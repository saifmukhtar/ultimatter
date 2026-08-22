const http = require('http');
const https = require('https');
const http2 = require('http2');
const tls = require('tls');
const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');
const QRCode = require('qrcode');
const httpProxy = require('http-proxy');
const auth = require('./auth');
const security = require('./security');
const hub = require('./hub');
const pwa = require('./pwa');
const version = require('./version');
const { getWaitingPageHtml } = require('./pages/waiting');
const { getPairingPageHtml, getTailscalePausedHtml } = require('./pages/pairing');
const { startControlServer } = require('./control-server');
const { LOCAL_CERT_FILE, LOCAL_KEY_FILE, getTailscaleCertFiles } = require('./config');

/** Persistent upstream keep-alive agent pools to eliminate repeated TCP/TLS handshake latency */
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 128,
  maxFreeSockets: 32,
  keepAliveMsecs: 30000
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 128,
  maxFreeSockets: 32,
  keepAliveMsecs: 30000,
  rejectUnauthorized: false
});

/** Port for external mobile connections (HTTPS / HTTP/2) */
const PROXY_PORT = 5864;

/** Port for local host desktop GUI control panel (HTTP) */
const DASHBOARD_PORT = 5865;

/** Tracks all currently discovered active AI agent targets */
let activeTargets = []; // Array<{ id, name, shortName, icon, type, port, protocol, status, description }>

/**
 * Updates active upstream agent targets and logs status changes.
 * 
 * @param {Array<object> | object | number | null} newTargets
 */
const updateTargets = (newTargets) => {
  const previousCount = activeTargets.length;
  
  if (Array.isArray(newTargets)) {
    activeTargets = newTargets;
  } else if (typeof newTargets === 'number') {
    activeTargets = newTargets ? [{ id: 'antigravity', name: 'Google Antigravity', shortName: 'Antigravity', port: newTargets, protocol: 'https', status: 'online' }] : [];
  } else if (newTargets && typeof newTargets === 'object') {
    activeTargets = [newTargets];
  } else {
    activeTargets = [];
  }

  if (activeTargets.length > 0) {
    const summary = activeTargets.map(t => `${t.shortName || t.name} (:${t.port})`).join(', ');
    console.log(`\n✅ Connected agents: ${summary}`);
  } else if (previousCount > 0) {
    console.log(`\n⏳ All AI agents went offline. Waiting for agents to start...`);
  }
};

const updateTarget = updateTargets;
const updateTargetPort = updateTargets;

/**
 * Resolves the appropriate target agent for an incoming request.
 * 
 * @param {object} req - HTTP request object
 * @returns {object | null} Matched target or null
 */
const resolveTargetForRequest = (req) => {
  const availableTargets = activeTargets.filter(t => t.enabled !== false);
  if (availableTargets.length === 0) return null;

  const hostHeader = (req.headers && (req.headers[':authority'] || req.headers.host)) || '';
  try {
    const url = new URL(req.url, `https://${hostHeader || '127.0.0.1'}`);
    // 1. Check path prefix /agent/:id
    if (url.pathname.startsWith('/agent/')) {
      const pathAgent = url.pathname.split('/')[2];
      if (pathAgent) {
        const match = availableTargets.find(a => a.id === pathAgent || (a.shortName && a.shortName.toLowerCase() === pathAgent.toLowerCase()));
        if (match) return match;
      }
    }

    // 2. Check query parameter ?agent=...
    const queryAgent = url.searchParams.get('agent');
    if (queryAgent) {
      const match = availableTargets.find(a => a.id === queryAgent || (a.shortName && a.shortName.toLowerCase() === queryAgent.toLowerCase()));
      if (match) return match;
    }
  } catch (e) {}

  // 3. Check selected_agent session cookie
  const rawCookie = (req.headers && (req.headers['cookie'] || req.headers['Cookie'])) || '';
  if (rawCookie) {
    const cookies = rawCookie.split(';').map(c => c.trim());
    const agentCookie = cookies.find(c => c.startsWith('selected_agent='));
    if (agentCookie) {
      const agentId = decodeURIComponent(agentCookie.split('=')[1] || '');
      const match = availableTargets.find(a => a.id === agentId);
      if (match) return match;
    }
  }

  // 4. Default to primary active enabled agent
  return availableTargets[0] || null;
};

/**
 * Preserves and sanitizes upstream Content-Security-Policy (CSP) headers.
 * 
 * @param {string} rawCsp - Original upstream CSP header string
 * @returns {string} Sanitized CSP header string
 */
const sanitizeCspHeader = (rawCsp) => {
  if (!rawCsp || typeof rawCsp !== 'string') return '';

  const directives = rawCsp.split(';').map(d => d.trim()).filter(Boolean);
  const directiveMap = new Map();

  for (const d of directives) {
    const parts = d.split(/\s+/);
    const name = parts[0].toLowerCase();
    const values = parts.slice(1);
    directiveMap.set(name, values);
  }

  // 1. Sanitize script-src
  let scriptSrc = directiveMap.get('script-src') || ["'self'"];
  scriptSrc = scriptSrc.filter(v => !v.startsWith("'sha256-") && !v.startsWith("'sha384-") && !v.startsWith("'sha512-") && !v.startsWith("'nonce-"));
  if (!scriptSrc.includes("'self'")) scriptSrc.unshift("'self'");
  if (!scriptSrc.includes("'unsafe-inline'")) scriptSrc.push("'unsafe-inline'");
  if (!scriptSrc.includes("'wasm-unsafe-eval'")) scriptSrc.push("'wasm-unsafe-eval'");
  directiveMap.set('script-src', scriptSrc);

  // 2. Sanitize connect-src
  let connectSrc = directiveMap.get('connect-src') || ["'self'"];
  if (!connectSrc.includes("'self'")) connectSrc.unshift("'self'");
  if (!connectSrc.includes('https:')) connectSrc.push('https:');
  if (!connectSrc.includes('wss:')) connectSrc.push('wss:');
  if (!connectSrc.includes('ws:')) connectSrc.push('ws:');
  directiveMap.set('connect-src', connectSrc);

  // 3. Sanitize style-src
  let styleSrc = directiveMap.get('style-src');
  if (styleSrc) {
    if (!styleSrc.includes("'self'")) styleSrc.unshift("'self'");
    if (!styleSrc.includes("'unsafe-inline'")) styleSrc.push("'unsafe-inline'");
    directiveMap.set('style-src', styleSrc);
  }

  const result = [];
  for (const [name, values] of directiveMap.entries()) {
    result.push(`${name} ${values.join(' ')}`);
  }
  return result.join('; ');
};

/**
 * Validates request authentication via query token or signed session cookie.
 * 
 * @param {import('http').IncomingMessage} req
 * @returns {{ auth: boolean, hasToken: boolean }}
 */
const checkAuth = (req) => {
  const hostHeader = (req.headers && (req.headers[':authority'] || req.headers.host)) || '';
  const url = new URL(req.url, `https://${hostHeader || '127.0.0.1'}`);
  const token = url.searchParams.get('token');
  const remoteAddress = (req.socket && req.socket.remoteAddress) || '';
  
  // 1. Check if token in URL query parameter is valid
  if (token) {
    if (auth.verifyToken(token)) {
      if (remoteAddress) security.clearFailedAttempts(remoteAddress);
      return { auth: true, hasToken: true };
    } else {
      if (remoteAddress) security.recordFailedAttempt(remoteAddress);
    }
  }

  // 2. Check if signed session cookie is valid
  const rawCookie = (req.headers && (req.headers['cookie'] || req.headers['Cookie'])) || '';
  if (rawCookie) {
    const cookies = rawCookie.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('mobile_auth='));
    if (authCookie) {
      const cookieVal = authCookie.split('=')[1];
      if (auth.verifySessionCookie(cookieVal)) {
        if (remoteAddress) security.clearFailedAttempts(remoteAddress);
        return { auth: true, hasToken: false };
      }
    }
  }
  return { auth: false, hasToken: false };
};

/**
 * Initializes and starts the Ultimatter reverse proxy and local dashboard servers.
 * 
 * @param {string} localIp - Primary local machine IP address
 * @param {string | null} [tailscaleDns=null] - Tailscale MagicDNS domain if available
 */
const startProxy = (localIp, tailscaleDns = null) => {
  const proxy = httpProxy.createProxyServer({
    secure: false,        // Ignore self-signed upstream certs
    ws: true,              // Enable WebSocket proxying
    selfHandleResponse: true // Intercept HTML streams to inject PWA & online shim
  });

  proxy.on('error', (err, req, res) => {
    if (res && res.writeHead) {
      if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Ultimatter Error: Upstream Agent Connection Refused');
    } else if (res && res.destroy) {
      res.destroy();
    }
  });

  proxy.on('proxyRes', (proxyRes, req, res) => {
    // Strip forbidden HTTP/1.1 connection headers for HTTP/2 compliance
    const forbiddenHeaders = ['connection', 'keep-alive', 'transfer-encoding', 'upgrade'];
    forbiddenHeaders.forEach(h => delete proxyRes.headers[h]);

    const contentType = proxyRes.headers['content-type'] || '';
    const isHtml = contentType.includes('text/html');

    if (!isHtml) {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
      return;
    }

    // Intercept and inject PWA meta tags & online network shim into HTML
    const chunks = [];
    proxyRes.on('data', chunk => chunks.push(chunk));
    proxyRes.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const encoding = proxyRes.headers['content-encoding'];
        let html = '';

        if (encoding === 'gzip') {
          html = zlib.gunzipSync(buffer).toString('utf8');
        } else if (encoding === 'br') {
          html = zlib.brotliDecompressSync(buffer).toString('utf8');
        } else if (encoding === 'deflate') {
          html = zlib.inflateSync(buffer).toString('utf8');
        } else {
          html = buffer.toString('utf8');
        }

        const modifiedHtml = pwa.injectPwaMetaTags(html);
        const modifiedBuffer = Buffer.from(modifiedHtml, 'utf8');

        delete proxyRes.headers['content-encoding'];
        if (proxyRes.headers['content-security-policy']) {
          proxyRes.headers['content-security-policy'] = sanitizeCspHeader(proxyRes.headers['content-security-policy']);
        }
        if (proxyRes.headers['content-security-policy-report-only']) {
          proxyRes.headers['content-security-policy-report-only'] = sanitizeCspHeader(proxyRes.headers['content-security-policy-report-only']);
        }
        proxyRes.headers['content-length'] = modifiedBuffer.length;

        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        res.end(modifiedBuffer);
      } catch (err) {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        res.end(Buffer.concat(chunks));
      }
    });
  });

  // Precompute static PWA assets and immutable ETags for sub-millisecond 304 caching
  const serveStaticAsset = (req, res, contentType, buffer, etag) => {
    const ifNoneMatch = req.headers['if-none-match'] || '';
    if (ifNoneMatch === etag) {
      res.writeHead(304, {
        'ETag': etag,
        'Cache-Control': 'public, max-age=86400, immutable'
      });
      res.end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'ETag': etag,
      'Cache-Control': 'public, max-age=86400, immutable'
    });
    res.end(buffer);
  };

  let allowTailscale = true;

  const isTailscaleRequest = (req) => {
    const remoteIp = (req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress.replace(/^::ffff:/, '') : '';
    if (remoteIp.startsWith('100.') || remoteIp.startsWith('fd7a:')) return true;
    
    const hostHeader = req.headers[':authority'] || req.headers.host || '';
    if (hostHeader.includes('.ts.net')) return true;

    return false;
  };

  const manifestBuffer = Buffer.from(JSON.stringify(pwa.getManifest(), null, 2), 'utf8');
  const manifestEtag = `"${crypto.createHash('md5').update(manifestBuffer).digest('hex').substring(0, 16)}"`;

  const iconBuffer = Buffer.from(pwa.APP_ICON_SVG, 'utf8');
  const iconEtag = `"${crypto.createHash('md5').update(iconBuffer).digest('hex').substring(0, 16)}"`;

  const requestHandler = (req, res) => {
    // IP Ban Check
    if (security.isIpBanned(req.socket.remoteAddress)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden - IP Banned for Brute Force Attempts');
      return;
    }

    // Remote Access (Tailscale) Lockdown Check
    if (!allowTailscale && isTailscaleRequest(req)) {
      res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getTailscalePausedHtml());
      return;
    }

    const hostHeader = req.headers[':authority'] || req.headers.host || '127.0.0.1';
    let pathname = req.url;
    try {
      pathname = new URL(req.url, `https://${hostHeader}`).pathname;
    } catch (e) {}

    // PWA Manifest and Icons (with zero-byte 304 ETag caching)
    if (pathname === '/manifest.webmanifest' || pathname === '/manifest.json') {
      serveStaticAsset(req, res, 'application/manifest+json; charset=utf-8', manifestBuffer, manifestEtag);
      return;
    }

    if (pathname === '/icon.svg' || pathname === '/apple-touch-icon.png' || pathname === '/favicon.ico') {
      serveStaticAsset(req, res, 'image/svg+xml; charset=utf-8', iconBuffer, iconEtag);
      return;
    }

    // Local Root CA Certificate Download Route (.pem and .crt)
    if (pathname === '/api/ca.pem' || pathname === '/api/ca.crt' || pathname === '/api/rootCA.pem' || pathname === '/api/rootCA.crt') {
      const network = require('./network');
      const rootCaFile = network.getRootCaPath();
      if (rootCaFile && fs.existsSync(rootCaFile)) {
        const isCrt = pathname.endsWith('.crt');
        const filename = isCrt ? 'rootCA.crt' : 'rootCA.pem';
        const contentType = isCrt ? 'application/x-x509-ca-cert' : 'application/x-pem-file';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache'
        });
        fs.createReadStream(rootCaFile).pipe(res);
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Root CA certificate not found');
      return;
    }

    // Status polling endpoint
    if (pathname === '/api/bridge-status') {
      const active = activeTargets[0] || null;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        online: activeTargets.length > 0, 
        count: activeTargets.length,
        port: active ? active.port : null,
        agentName: active ? (active.shortName || active.name) : null,
        agents: activeTargets
      }));
      return;
    }

    const authResult = checkAuth(req);
    
    if (authResult.hasToken) {
      const newSessionCookie = auth.generateSessionCookie();
      try {
        const urlObj = new URL(req.url, `https://${hostHeader}`);
        urlObj.searchParams.delete('token');
        const cleanPath = urlObj.pathname + (urlObj.search && urlObj.search !== '?' ? urlObj.search : '');
        res.writeHead(302, {
          'Set-Cookie': `mobile_auth=${newSessionCookie}; Path=/; Max-Age=${auth.COOKIE_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax`,
          'Location': cleanPath || '/'
        });
        res.end();
        return;
      } catch (e) {
        res.setHeader('Set-Cookie', `mobile_auth=${newSessionCookie}; Path=/; Max-Age=${auth.COOKIE_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax`);
      }
    }

    // Pairing Token Submission API: /api/auth-token
    if (pathname === '/api/auth-token' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          let token = (data.token || '').trim();
          if (token.includes('token=')) {
            try {
              const u = new URL(token.startsWith('http') ? token : `https://dummy/${token}`);
              token = u.searchParams.get('token') || token;
            } catch (e) {}
          }
          if (token && auth.verifyToken(token)) {
            const newSessionCookie = auth.generateSessionCookie();
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Set-Cookie': `mobile_auth=${newSessionCookie}; Path=/; Max-Age=${auth.COOKIE_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax`
            });
            res.end(JSON.stringify({ success: true }));
            return;
          }
        } catch (e) {}

        const clientIp = security.normalizeIp(req.socket.remoteAddress);
        security.recordFailedAttempt(clientIp);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid pairing token' }));
      });
      return;
    }

    if (!authResult.auth && pathname !== '/favicon.ico') {
      res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getPairingPageHtml());
      return;
    }

    // Mobile Hub is the default Root Landing Canvas: / or /hub or /agents
    if (pathname === '/' || pathname === '/hub' || pathname === '/agents') {
      const network = require('./network');
      const disabledList = network.getDisabledAgents();
      const enabledTargets = network.AGENT_TARGETS.filter(t => !disabledList.includes(t.id));
      const enabledActiveTargets = activeTargets.filter(t => !disabledList.includes(t.id));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(hub.getHubHtml(enabledTargets, enabledActiveTargets, auth.SECURE_TOKEN));
      return;
    }

    // Agent Dedicated Route: /agent/:id (e.g. /agent/antigravity or /agent/opencode)
    if (pathname.startsWith('/agent/')) {
      const parts = pathname.split('/');
      const agentId = parts[2] || '';
      res.setHeader('Set-Cookie', `selected_agent=${encodeURIComponent(agentId)}; Path=/; Max-Age=2592000; SameSite=Lax`);
      
      const remainingPath = '/' + parts.slice(3).join('/') + (pathname.includes('?') ? '?' + pathname.split('?')[1] : '');
      req.url = remainingPath === '' ? '/' : remainingPath;
    }

    // Agent Switcher API: /api/switch-agent?id=...
    if (pathname === '/api/switch-agent') {
      try {
        const url = new URL(req.url, `https://${hostHeader}`);
        const targetId = url.searchParams.get('id') || '';
        res.setHeader('Set-Cookie', `selected_agent=${encodeURIComponent(targetId)}; Path=/; Max-Age=2592000; SameSite=Lax`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, agent: targetId }));
        return;
      } catch (e) {}
    }

    // Hub status polling for live cards
    if (pathname === '/api/hub-status') {
      const network = require('./network');
      const disabledList = network.getDisabledAgents();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        agents: network.AGENT_TARGETS.filter(t => !disabledList.includes(t.id)).map(t => {
          const active = activeTargets.find(a => a.id === t.id && !disabledList.includes(a.id));
          return {
            id: t.id,
            name: t.name,
            online: !!active,
            port: active ? active.port : (t.defaultPort || null)
          };
        })
      }));
      return;
    }

    // Resolve target agent for this request
    const target = resolveTargetForRequest(req);

    // If authorized but no agent is running, serve holding screen
    if (!target) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getWaitingPageHtml());
      return;
    }

    // Clean HTTP/2 headers for upstream HTTP/1.1 proxy compatibility
    const oldUrl = req.url;
    const oldMethod = req.method;
    
    const cleanHeaders = {};
    for (const key in req.headers) {
      if (!key.startsWith(':')) {
        cleanHeaders[key] = req.headers[key];
      }
    }
    
    cleanHeaders['host'] = `127.0.0.1:${target.port}`;
    cleanHeaders['origin'] = `${target.protocol}://127.0.0.1:${target.port}`;
    cleanHeaders['referer'] = `${target.protocol}://127.0.0.1:${target.port}/`;

    Object.defineProperty(req, 'headers', {
      get: () => cleanHeaders,
      configurable: true
    });

    req.url = oldUrl;
    req.method = oldMethod;

    proxy.web(req, res, { 
      target: `${target.protocol}://127.0.0.1:${target.port}`,
      agent: target.protocol === 'https' ? httpsAgent : httpAgent
    });
  };

  const upgradeHandler = (req, socket, head) => {
    if (security.isIpBanned(req.socket.remoteAddress)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    if (!allowTailscale && isTailscaleRequest(req)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    const authResult = checkAuth(req);
    if (!authResult.auth) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const target = resolveTargetForRequest(req);
    if (!target) {
      socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
      socket.destroy();
      return;
    }

    const oldUrl = req.url;
    const oldMethod = req.method;
    
    const cleanHeaders = {};
    for (const key in req.headers) {
      if (!key.startsWith(':')) {
        cleanHeaders[key] = req.headers[key];
      }
    }
    
    cleanHeaders['host'] = `127.0.0.1:${target.port}`;
    cleanHeaders['origin'] = `${target.protocol}://127.0.0.1:${target.port}`;

    Object.defineProperty(req, 'headers', {
      get: () => cleanHeaders,
      configurable: true
    });

    req.url = oldUrl;
    req.method = oldMethod;

    proxy.ws(req, socket, head, { target: `${target.protocol}://127.0.0.1:${target.port}` });
  };

  const secureServer = http2.createSecureServer({
    key: fs.readFileSync(LOCAL_KEY_FILE),
    cert: fs.readFileSync(LOCAL_CERT_FILE),
    allowHTTP1: true,
    SNICallback: (servername, cb) => {
      const targetDns = (servername && servername.endsWith('.ts.net')) ? servername : tailscaleDns;
      if (targetDns) {
        const tsCerts = getTailscaleCertFiles(targetDns);
        if (fs.existsSync(tsCerts.keyFile) && fs.existsSync(tsCerts.certFile)) {
          try {
            const ctx = tls.createSecureContext({
              key: fs.readFileSync(tsCerts.keyFile),
              cert: fs.readFileSync(tsCerts.certFile)
            });
            return cb(null, ctx);
          } catch (e) {}
        }
      }
      cb(null, null);
    }
  }, requestHandler);

  // Disable Nagle's buffering algorithm on incoming sockets for instantaneous token/keystroke streaming
  secureServer.on('connection', (socket) => {
    socket.setNoDelay(true);
    socket.setKeepAlive(true, 15000);
  });

  secureServer.on('upgrade', upgradeHandler);

  const reloadTlsContext = () => {
    try {
      if (fs.existsSync(LOCAL_CERT_FILE) && fs.existsSync(LOCAL_KEY_FILE)) {
        const newCtx = tls.createSecureContext({
          key: fs.readFileSync(LOCAL_KEY_FILE),
          cert: fs.readFileSync(LOCAL_CERT_FILE)
        });
        if (secureServer && secureServer.setSecureContext) {
          secureServer.setSecureContext(newCtx);
        }
      }
    } catch (e) {}
  };

  let dashboardServer = null;

  const shutdownGateway = () => {
    try { if (secureServer) secureServer.close(); } catch (e) {}
    try { if (dashboardServer) dashboardServer.close(); } catch (e) {}
    process.exit(0);
  };

  dashboardServer = startControlServer({
    localIp,
    tailscaleDns,
    proxyPort: PROXY_PORT,
    dashboardPort: DASHBOARD_PORT,
    getActiveTargets: () => activeTargets,
    getAllowTailscale: () => allowTailscale,
    setAllowTailscale: (val) => { allowTailscale = val; },
    reloadTlsContext,
    shutdownGateway
  });

  const handleEaddrinuse = (err) => {
    if (err && err.code === 'EADDRINUSE') {
      const dashboardUrl = `http://localhost:${DASHBOARD_PORT}/dashboard`;
      console.log(`\n🚀 Ultimatter is already active in background. Re-opening Control Panel...\n`);
      const network = require('./network');
      network.openBrowser(dashboardUrl);
      process.exit(0);
    }
  };

  secureServer.on('error', handleEaddrinuse);
  secureServer.listen(PROXY_PORT, '0.0.0.0', () => {
    const localUrl = `https://${localIp}:${PROXY_PORT}/?token=${auth.SECURE_TOKEN}`;
    const tailscaleUrl = tailscaleDns ? `https://${tailscaleDns}:${PROXY_PORT}/?token=${auth.SECURE_TOKEN}` : null;
    
    console.log(`\n======================================================`);
    console.log(`🚀 UNIVERSAL AI AGENT GATEWAY IS LIVE! 🚀`);
    console.log(`======================================================`);
    console.log(`✅ HTTP/2 Multiplexing & Dynamic Routing Active`);
    console.log(`✅ Cryptographic Auth Enforced`);
    console.log(`✅ Web Control Panel: http://localhost:${DASHBOARD_PORT}/dashboard`);
    console.log(`✅ Multi-Agent Port Auto-Discovery Active\n`);
    
    console.log(`📱 Local Wi-Fi Connection:\n`);
    QRCode.toString(localUrl, { type: 'terminal', small: true }, (err, str) => {
      if (!err && str) console.log(str);
    });
    console.log(`👉 Wi-Fi Link: ${localUrl}`);
    
    if (tailscaleUrl) {
      console.log(`\n🌍 Tailscale MagicDNS Link: ${tailscaleUrl}`);
    }
    
    console.log(`======================================================\n`);

    // Non-blocking background check for latest release
    version.checkLatestVersion((info) => {
      if (info && info.hasUpdate) {
        console.log(`✨ Update Available: v${info.currentVersion} → v${info.latestVersion}`);
        console.log(`👉 Download: ${info.releaseUrl}\n`);
      }
    });
  });
};

module.exports = { 
  startProxy, 
  updateTargets, 
  updateTarget, 
  updateTargetPort, 
  resolveTargetForRequest,
  sanitizeCspHeader,
  checkAuth,
  PROXY_PORT, 
  DASHBOARD_PORT 
};
