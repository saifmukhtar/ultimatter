const http = require('http');
const fs = require('fs');
const auth = require('./auth');
const security = require('./security');
const dashboard = require('./dashboard');
const version = require('./version');

/**
 * Creates and starts the Desktop Control Panel HTTP Server on port 5865.
 * 
 * @param {object} options
 * @param {string} options.localIp - Primary local machine IP
 * @param {string | null} options.tailscaleDns - Tailscale MagicDNS domain if available
 * @param {number} options.proxyPort - External proxy HTTPS port (5864)
 * @param {number} options.dashboardPort - Desktop control panel port (5865)
 * @param {() => Array<object>} options.getActiveTargets - Function returning current active agents
 * @param {() => boolean} options.getAllowTailscale - Function returning Tailscale allow state
 * @param {(val: boolean) => void} options.setAllowTailscale - Function updating Tailscale allow state
 * @param {() => void} options.reloadTlsContext - Function reloading HTTPS certificates
 * @param {() => void} options.shutdownGateway - Function terminating gateway gracefully
 * @returns {import('http').Server}
 */
const startControlServer = ({
  localIp,
  tailscaleDns = null,
  proxyPort = 5864,
  dashboardPort = 5865,
  getActiveTargets,
  getAllowTailscale,
  setAllowTailscale,
  reloadTlsContext,
  shutdownGateway
}) => {
  const dashboardHandler = async (req, res) => {
    // 1. Host Validation (DNS Rebinding protection)
    const host = req.headers.host || '';
    const getHostname = (h) => {
      if (!h) return '';
      if (h.startsWith('[')) {
        const end = h.indexOf(']');
        return end > 0 ? h.substring(1, end).toLowerCase() : '';
      }
      const colonIdx = h.indexOf(':');
      return (colonIdx >= 0 ? h.substring(0, colonIdx) : h).toLowerCase();
    };
    const ALLOWED_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
    const isAllowedOrigin = (value) => {
      if (!value) return false;
      try {
        const u = new URL(value);
        const hn = u.hostname.startsWith('[') ? u.hostname.slice(1, -1) : u.hostname;
        return u.protocol === 'http:' && ALLOWED_HOSTS.has(hn.toLowerCase());
      } catch { return false; }
    };
    
    if (!ALLOWED_HOSTS.has(getHostname(host))) {
      res.writeHead(403);
      res.end('Forbidden: Invalid Host');
      return;
    }

    // Add security headers to all responses
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.method === 'POST' && req.url === '/api/dashboard/exchange-token') {
      const fetchDest = req.headers['sec-fetch-dest'];
      const fetchSite = req.headers['sec-fetch-site'];
      const origin = req.headers.origin;
      const referer = req.headers.referer;
      const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
      const hasValidOrigin = isAllowedOrigin(origin);
      const hasValidReferer = (!origin && isAllowedOrigin(referer));
      const isSameSite = fetchSite === 'same-origin';
      if (!isAjax && !hasValidOrigin && !hasValidReferer && !isSameSite) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ token: auth.generateExchangeToken() }));
      return;
    }



    // 2. CSRF Protection for state-changing endpoints
    if (req.method === 'POST') {
      const fetchDest = req.headers['sec-fetch-dest'];
      const fetchSite = req.headers['sec-fetch-site'];
      const origin = req.headers.origin;
      const referer = req.headers.referer;
      const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
      
      const hasValidOrigin = isAllowedOrigin(origin);
      const hasValidReferer = (!origin && isAllowedOrigin(referer));
      const isSameSite = fetchSite === 'same-origin';
      
      if (!isAjax && !hasValidOrigin && !hasValidReferer && !isSameSite) {
        res.writeHead(403);
        res.end('Forbidden: CSRF blocked');
        return;
      }
      

    }

    if (req.url === '/dashboard' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(dashboard.getDashboardHtml());
      return;
    }

    if (req.method === 'POST' && req.url === '/api/dashboard/toggle-tailscale') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let currentAllow = getAllowTailscale();
        try {
          const data = JSON.parse(body || '{}');
          if (typeof data.allowTailscale === 'boolean') {
            currentAllow = data.allowTailscale;
          } else {
            res.writeHead(400);
            res.end('Bad Request');
            return;
          }
        } catch (e) {
          res.writeHead(400);
          res.end('Bad Request');
          return;
        }
        setAllowTailscale(currentAllow);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, allowTailscale: currentAllow }));
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
          if (reloadTlsContext) reloadTlsContext();
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

    if (req.method === 'POST' && req.url === '/api/dashboard/shutdown') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Shutting down Ultimatter...' }));
      console.log('\n🛑 Ultimatter shutdown initiated via Control Panel. Goodbye!\n');
      setTimeout(() => {
        if (shutdownGateway) shutdownGateway();
        else process.exit(0);
      }, 200);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/dashboard/toggle-agent') {
      const network = require('./network');
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          const agentId = (data.id || '').trim();
          const enabled = data.enabled !== false;
          if (agentId) {
            const disabled = network.setAgentEnabled(agentId, enabled);
            network.findAllActiveAgentTargets().then(targets => {
              const proxy = require('./proxy');
              proxy.updateTargets(targets);
            }).catch(() => {});

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, disabledAgents: disabled }));
            return;
          }
        } catch (e) {}
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid payload' }));
      });
      return;
    }

    if (req.url === '/api/dashboard/status') {
      const network = require('./network');
      const tsInfo = network.getTailscaleState();
      const currentTailscaleDns = tsInfo.dnsName || tailscaleDns;

      const localDomain = network.getLocalDomain();
      const localUrl = `https://${localIp}:${proxyPort}/`;
      const localDomainUrl = `https://${localDomain}:${proxyPort}/`;
      const dynamicTailscaleUrl = currentTailscaleDns ? `https://${currentTailscaleDns}:${proxyPort}/` : '';

      if (!cachedTokens.local || !auth.isExchangeTokenValid(cachedTokens.local)) cachedTokens.local = auth.generateExchangeToken();
      if (!cachedTokens.domain || !auth.isExchangeTokenValid(cachedTokens.domain)) cachedTokens.domain = auth.generateExchangeToken();
      if (!cachedTokens.tailscale || !auth.isExchangeTokenValid(cachedTokens.tailscale)) cachedTokens.tailscale = auth.generateExchangeToken();

      const localQrPayload = `https://${localIp}:${proxyPort}/?token=${cachedTokens.local}`;
      const localDomainQrPayload = `https://${localDomain}:${proxyPort}/?token=${cachedTokens.domain}`;
      const tailscaleQrPayload = currentTailscaleDns ? `https://${currentTailscaleDns}:${proxyPort}/?token=${cachedTokens.tailscale}` : '';

      let activeTargets = getActiveTargets ? getActiveTargets() : [];
      if (activeTargets.length > 0) {
        const verified = [];
        for (const t of activeTargets) {
          const isAlive = await network.probeTargetPort(t.port, t);
          if (isAlive) {
            verified.push(t);
          }
        }
        if (verified.length !== activeTargets.length) {
          activeTargets = verified;
          try {
            const proxy = require('./proxy');
            proxy.updateTargets(verified);
          } catch (e) {}
        }
      }

      const disabledList = network.getDisabledAgents();
      const enabledActiveTargets = activeTargets.filter(t => !disabledList.includes(t.id));
      const primary = enabledActiveTargets[0] || null;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        localUrl,
        localDomain,
        localDomainUrl,
        localQrSvg: dashboard.generateQrSvg(localQrPayload),
        localDomainQrSvg: dashboard.generateQrSvg(localDomainQrPayload),
        tailscaleUrl: dynamicTailscaleUrl,
        tailscaleQrSvg: currentTailscaleDns ? dashboard.generateQrSvg(tailscaleQrPayload) : '',
        tailscaleAvailable: tsInfo.state === 'connected',
        tailscaleState: tsInfo.state,
        tailscaleDns: currentTailscaleDns,
        tailscaleIpv4: tsInfo.ipv4,
        tailscaleIpv6: tsInfo.ipv6,
        localIpv6: network.getLocalIpv6(),
        peers: tsInfo.peers || [],
        allowTailscale: getAllowTailscale(),
        bannedCount: security.getBannedIpCount(),
        platform: require('os').platform(),
        disabledAgents: disabledList,
        agents: network.AGENT_TARGETS.map(t => {
          const active = activeTargets.find(a => a.id === t.id);
          const isEnabled = !disabledList.includes(t.id);
          return {
            id: t.id,
            name: t.name,
            shortName: t.shortName,
            icon: t.icon,
            type: t.type,
            online: !!active,
            enabled: isEnabled,
            port: active ? active.port : (t.defaultPort || null),
            description: t.description
          };
        }),
        activeCount: enabledActiveTargets.length,
        ideOnline: enabledActiveTargets.length > 0,
        idePort: primary ? primary.port : null,
        agentName: primary ? (primary.shortName || primary.name) : null,
        versionInfo: version.getCachedVersionInfo()
      }));
      return;
    }

    if (req.url === '/api/ca.pem' || req.url === '/api/ca.crt' || req.url === '/api/rootCA.pem' || req.url === '/api/rootCA.crt') {
      const network = require('./network');
      const rootCaFile = network.getRootCaPath();
      if (rootCaFile && fs.existsSync(rootCaFile)) {
        const isCrt = req.url.endsWith('.crt');
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

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  };

  const handleEaddrinuse = (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.log(`\\n🚀 Ultimatter is already active in background.\\n`);
      process.exit(0);
    }
  };

  const dashboardServer = http.createServer(dashboardHandler);
  dashboardServer.on('error', handleEaddrinuse);
  dashboardServer.listen(dashboardPort, '127.0.0.1');

  return dashboardServer;
};


let cachedTokens = { local: null, domain: null, tailscale: null };

module.exports = {

  startControlServer
};
