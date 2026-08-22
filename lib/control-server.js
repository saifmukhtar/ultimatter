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
        let currentAllow = getAllowTailscale();
        try {
          const data = JSON.parse(body || '{}');
          if (typeof data.allowTailscale === 'boolean') {
            currentAllow = data.allowTailscale;
          } else {
            currentAllow = !currentAllow;
          }
        } catch (e) {
          currentAllow = !currentAllow;
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

    if (req.url === '/api/dashboard/status') {
      const network = require('./network');
      const tsInfo = network.getTailscaleState();
      const currentTailscaleDns = tsInfo.dnsName || tailscaleDns;

      const localDomain = network.getLocalDomain();
      const localUrl = `https://${localIp}:${proxyPort}/`;
      const localDomainUrl = `https://${localDomain}:${proxyPort}/`;
      const dynamicTailscaleUrl = currentTailscaleDns ? `https://${currentTailscaleDns}:${proxyPort}/` : '';

      const localQrPayload = `https://${localIp}:${proxyPort}/?token=${auth.SECURE_TOKEN}`;
      const localDomainQrPayload = `https://${localDomain}:${proxyPort}/?token=${auth.SECURE_TOKEN}`;
      const tailscaleQrPayload = currentTailscaleDns ? `https://${currentTailscaleDns}:${proxyPort}/?token=${auth.SECURE_TOKEN}` : '';

      const activeTargets = getActiveTargets ? getActiveTargets() : [];
      const primary = activeTargets[0] || null;

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
      const dashboardUrl = `http://localhost:${dashboardPort}/dashboard`;
      console.log(`\n🚀 Ultimatter is already active in background. Re-opening Control Panel...\n`);
      const network = require('./network');
      network.openBrowser(dashboardUrl);
      process.exit(0);
    }
  };

  const dashboardServer = http.createServer(dashboardHandler);
  dashboardServer.on('error', handleEaddrinuse);
  dashboardServer.listen(dashboardPort, '127.0.0.1');

  return dashboardServer;
};

module.exports = {
  startControlServer
};
