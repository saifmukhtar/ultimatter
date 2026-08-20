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
const dashboard = require('./dashboard');
const hub = require('./hub');
const pwa = require('./pwa');
const bubble = require('./bubble');
const config = require('./config');
const version = require('./version');
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
  if (activeTargets.length === 0) return null;

  // 1. Check if explicit agent query param is specified (e.g. /?agent=opencode)
  const hostHeader = req.headers[':authority'] || req.headers.host || '';
  try {
    const url = new URL(req.url, `https://${hostHeader}`);
    const queryAgent = url.searchParams.get('agent');
    if (queryAgent) {
      const match = activeTargets.find(a => a.id === queryAgent || (a.shortName && a.shortName.toLowerCase() === queryAgent.toLowerCase()));
      if (match) return match;
    }
  } catch (e) {}

  // 2. Check selected_agent session cookie
  const rawCookie = req.headers['cookie'] || req.headers['Cookie'] || '';
  if (rawCookie) {
    const cookies = rawCookie.split(';').map(c => c.trim());
    const agentCookie = cookies.find(c => c.startsWith('selected_agent='));
    if (agentCookie) {
      const agentId = decodeURIComponent(agentCookie.split('=')[1] || '');
      const match = activeTargets.find(a => a.id === agentId);
      if (match) return match;
    }
  }

  // 3. Default to primary active agent
  return activeTargets[0] || null;
};

/**
 * Generates the waiting screen shown on the phone when no AI agent is running.
 * 
 * @returns {string} HTML waiting page
 */
const getWaitingPageHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content">
  <title>Ultimatter - Waiting for Agents</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: max(24px, env(safe-area-inset-top, 24px)) max(16px, env(safe-area-inset-right, 16px)) max(40px, env(safe-area-inset-bottom, 40px)) max(16px, env(safe-area-inset-left, 16px));
      text-align: center;
      -webkit-font-smoothing: antialiased;
      touch-action: manipulation;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 36px 24px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 10px 30px -4px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    .spinner-ring {
      width: 48px;
      height: 48px;
      border: 3px solid #e2e8f0;
      border-top-color: #0284c7;
      border-radius: 50%;
      animation: spin 0.9s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite;
      margin-bottom: 4px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .brand-title {
      font-size: 19px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .desc {
      font-size: 13px;
      color: #64748b;
      line-height: 1.55;
    }
    .target-preview {
      display: flex;
      gap: 8px;
      margin: 4px 0;
    }
    .target-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 20px;
      margin-top: 4px;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      background-color: #10b981;
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(0.75); }
    }
    .code-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      color: #0f172a;
      width: 100%;
      text-align: center;
      margin: 2px 0;
    }
  </style>
  <script>
    const checkStatus = () => {
      fetch('/api/bridge-status')
        .then(res => res.json())
        .then(data => {
          if (data.online) {
            window.location.reload();
          }
        })
        .catch(() => {});
    };
    setInterval(checkStatus, 1500);
  </script>
</head>
<body>
  <div class="card">
    <div class="spinner-ring"></div>
    <div class="brand-title">Waiting for AI Agents</div>
    <p class="desc">The encrypted gateway is active. Launch Antigravity or OpenCode on your desktop to connect.</p>
    <div class="code-box">
      <span>Terminal: <strong>opencode web</strong></span>
    </div>
    <div class="status-badge">
      <div class="pulse-dot"></div>
      Auto-connecting on launch...
    </div>
  </div>
</body>
</html>`;

/**
 * Preserves and sanitizes upstream Content-Security-Policy (CSP) headers.
 * Retains all security directives (default-src, img-src, font-src, frame-ancestors, etc.)
 * while ensuring first-party portal scripts ('self', 'unsafe-inline', 'wasm-unsafe-eval')
 * and secure WebSockets ('self', 'wss:', 'ws:') execute cleanly.
 * 
 * @param {string} rawCsp - Original upstream CSP header string
 * @returns {string} Sanitized, security-preserved CSP header string
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

        let modifiedHtml = pwa.injectPwaMetaTags(html);
        if (config.getBubbleEnabled()) {
          modifiedHtml = bubble.injectBubble(modifiedHtml);
        }
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
  const manifestBuffer = Buffer.from(JSON.stringify(pwa.getManifest(), null, 2), 'utf8');
  const manifestEtag = `"${crypto.createHash('md5').update(manifestBuffer).digest('hex').substring(0, 16)}"`;

  const iconBuffer = Buffer.from(pwa.APP_ICON_SVG, 'utf8');
  const iconEtag = `"${crypto.createHash('md5').update(iconBuffer).digest('hex').substring(0, 16)}"`;

  const portalScript = bubble.getPortalScript();
  const portalBuffer = Buffer.from(portalScript, 'utf8');
  const portalEtag = `"${crypto.createHash('md5').update(portalBuffer).digest('hex').substring(0, 16)}"`;

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

  const checkAuth = (req) => {
    const hostHeader = req.headers[':authority'] || req.headers.host || '';
    const url = new URL(req.url, `https://${hostHeader}`);
    const token = url.searchParams.get('token');
    
    // 1. Check if token in URL query parameter is valid
    if (token) {
      if (auth.verifyToken(token)) {
        security.clearFailedAttempts(req.socket.remoteAddress);
        return { auth: true, hasToken: true };
      } else {
        security.recordFailedAttempt(req.socket.remoteAddress);
      }
    }

    // 2. Check if signed session cookie is valid
    const rawCookie = req.headers['cookie'] || req.headers['Cookie'] || '';
    if (rawCookie) {
      const cookies = rawCookie.split(';').map(c => c.trim());
      const authCookie = cookies.find(c => c.startsWith('mobile_auth='));
      if (authCookie) {
        const cookieVal = authCookie.split('=')[1];
        if (auth.verifySessionCookie(cookieVal)) {
          security.clearFailedAttempts(req.socket.remoteAddress);
          return { auth: true, hasToken: false };
        }
      }
    }
    return { auth: false, hasToken: false };
  };

  let allowTailscale = true;

  const isTailscaleRequest = (req) => {
    const remoteIp = (req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress.replace(/^::ffff:/, '') : '';
    if (remoteIp.startsWith('100.') || remoteIp.startsWith('fd7a:')) return true;
    
    const hostHeader = req.headers[':authority'] || req.headers.host || '';
    if (hostHeader.includes('.ts.net')) return true;

    return false;
  };

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
      res.end(`<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
          <title>Ultimatter - Remote Access Paused</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
              background-color: #f8fafc;
              color: #0f172a;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 24px 16px;
              text-align: center;
              -webkit-font-smoothing: antialiased;
            }
            .card {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
              padding: 32px 24px;
              max-width: 400px;
              width: 100%;
              box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 12px;
            }
            .icon { font-size: 36px; margin-bottom: 4px; }
            h2 { font-size: 18px; font-weight: 700; color: #0f172a; }
            p { font-size: 13px; color: #64748b; line-height: 1.5; }
            .badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: #fefce8;
              border: 1px solid #fef08a;
              color: #854d0e;
              font-size: 11px;
              font-weight: 600;
              padding: 4px 12px;
              border-radius: 20px;
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⏸️</div>
            <h2>Remote Access Paused</h2>
            <p>The host PC has temporarily disabled remote Tailscale access (LAN-Only Mode). Re-enable from the desktop control panel.</p>
            <div class="badge">🔒 LAN Isolation Active</div>
          </div>
        </body>
        </html>
      `);
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

    // Shadow DOM Portal External Script Route (with ETag caching)
    if (pathname === '/api/ultimatter-portal.js') {
      serveStaticAsset(req, res, 'application/javascript; charset=utf-8', portalBuffer, portalEtag);
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
      res.setHeader('Set-Cookie', `mobile_auth=${newSessionCookie}; Path=/; Max-Age=${auth.COOKIE_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax`);
    }

    if (!authResult.auth && pathname !== '/favicon.ico') {
      res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
          <title>Ultimatter - Secure Auth</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
              background-color: #f8fafc;
              color: #0f172a;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 24px 16px;
              text-align: center;
              -webkit-font-smoothing: antialiased;
            }
            .card {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
              padding: 32px 24px;
              max-width: 400px;
              width: 100%;
              box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 12px;
            }
            .icon { font-size: 36px; margin-bottom: 4px; }
            h2 { font-size: 18px; font-weight: 700; color: #0f172a; }
            p { font-size: 13px; color: #64748b; line-height: 1.5; }
            .badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              color: #1d4ed8;
              font-size: 11px;
              font-weight: 600;
              padding: 4px 12px;
              border-radius: 20px;
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">🔒</div>
            <h2>Cryptographically Secured</h2>
            <p>Scan the dynamic QR code on your PC's Ultimatter Control Panel to connect your phone.</p>
            <div class="badge">🛡️ Zero Trust Architecture</div>
          </div>
        </body>
        </html>
      `);
      return;
    }

    // Mobile Hub / Launcher Canvas Route: /hub or /agents
    if (pathname === '/hub' || pathname === '/agents') {
      const network = require('./network');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(hub.getHubHtml(network.AGENT_TARGETS, activeTargets, auth.SECURE_TOKEN));
      return;
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        agents: network.AGENT_TARGETS.map(t => {
          const active = activeTargets.find(a => a.id === t.id);
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
  
  const dashboardHandler = (req, res) => {
    if (req.url === '/dashboard' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(dashboard.getDashboardHtml());
      return;
    }

    if (req.method === 'POST' && req.url === '/api/dashboard/toggle-tailscale') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          if (typeof data.allowTailscale === 'boolean') {
            allowTailscale = data.allowTailscale;
          } else {
            allowTailscale = !allowTailscale;
          }
        } catch (e) {
          allowTailscale = !allowTailscale;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, allowTailscale }));
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/dashboard/reset-token') {
      const newToken = auth.resetSecrets();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, token: newToken }));
      return;
    }

    if (req.method === 'POST' && req.url === '/api/dashboard/set-local-domain') {
      const network = require('./network');
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          const domain = network.setLocalDomain(data.domain || '');
          network.generateSSLCertificate(localIp, domain, true);
          reloadTlsContext();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, domain }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/dashboard/unban') {
      security.clearAllBans();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'All IP bans cleared' }));
      return;
    }

    if (req.method === 'POST' && req.url === '/api/dashboard/toggle-bubble') {
      const currentState = config.getBubbleEnabled();
      const newState = config.setBubbleEnabled(!currentState);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, mobileBubbleEnabled: newState }));
      return;
    }

    if (req.url === '/api/dashboard/status') {
      const network = require('./network');
      const tsInfo = network.getTailscaleState();
      const currentTailscaleDns = tsInfo.dnsName || tailscaleDns;

      const localDomain = network.getLocalDomain();
      const targetPath = activeTargets.length > 1 ? '/hub' : '';
      const localUrl = `https://${localIp}:${PROXY_PORT}${targetPath}?token=${auth.SECURE_TOKEN}`;
      const localDomainUrl = `https://${localDomain}:${PROXY_PORT}${targetPath}?token=${auth.SECURE_TOKEN}`;
      const dynamicTailscaleUrl = currentTailscaleDns ? `https://${currentTailscaleDns}:${PROXY_PORT}${targetPath}?token=${auth.SECURE_TOKEN}` : '';

      const primary = activeTargets[0] || null;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        localUrl,
        localDomain,
        localDomainUrl,
        localQrSvg: dashboard.generateQrSvg(localUrl),
        localDomainQrSvg: dashboard.generateQrSvg(localDomainUrl),
        tailscaleUrl: dynamicTailscaleUrl,
        tailscaleQrSvg: currentTailscaleDns ? dashboard.generateQrSvg(dynamicTailscaleUrl) : '',
        tailscaleAvailable: tsInfo.state === 'connected',
        tailscaleState: tsInfo.state, // 'connected' | 'stopped' | 'not_installed'
        tailscaleDns: currentTailscaleDns,
        tailscaleIpv4: tsInfo.ipv4,
        tailscaleIpv6: tsInfo.ipv6,
        localIpv6: network.getLocalIpv6(),
        peers: tsInfo.peers || [],
        allowTailscale,
        mobileBubbleEnabled: config.getBubbleEnabled(),
        bannedCount: security.getBannedIpCount(),
        platform: require('os').platform(),
        agents: network.AGENT_TARGETS.map(t => {
          const active = activeTargets.find(a => a.id === t.id);
          return {
            id: t.id,
            name: t.name,
            shortName: t.shortName,
            icon: t.icon,
            type: t.type,
            online: !!active,
            port: active ? active.port : (t.defaultPort || null),
            description: t.description
          };
        }),
        activeCount: activeTargets.length,
        ideOnline: activeTargets.length > 0,
        idePort: primary ? primary.port : null,
        agentName: primary ? (primary.shortName || primary.name) : null,
        versionInfo: version.getCachedVersionInfo(),
        token: auth.SECURE_TOKEN
      }));
      return;
    }

    if (req.url === '/api/ca.pem') {
      const network = require('./network');
      const rootCaFile = network.getRootCaPath();
      if (rootCaFile && fs.existsSync(rootCaFile)) {
        res.writeHead(200, {
          'Content-Type': 'application/x-x509-ca-cert',
          'Content-Disposition': 'attachment; filename="ultimatter-root-ca.pem"'
        });
        fs.createReadStream(rootCaFile).pipe(res);
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Root CA certificate not found');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  };

  const handleEaddrinuse = (err) => {
    if (err && err.code === 'EADDRINUSE') {
      const dashboardUrl = `http://localhost:${DASHBOARD_PORT}/dashboard`;
      console.log(`\n🚀 Ultimatter is already active in background. Re-opening Control Panel...\n`);
      const network = require('./network');
      network.openBrowser(dashboardUrl);
      process.exit(0);
    }
  };

  const dashboardServer = http.createServer(dashboardHandler);
  dashboardServer.on('error', handleEaddrinuse);
  dashboardServer.listen(DASHBOARD_PORT, '127.0.0.1');

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
  sanitizeCspHeader,
  PROXY_PORT, 
  DASHBOARD_PORT 
};
