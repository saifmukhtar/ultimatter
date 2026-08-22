const QRCode = require('qrcode');
const network = require('./network');
const proxy = require('./proxy');
const auth = require('./auth');
const dashboard = require('./dashboard');

/**
 * Creates and starts a secure mobile gateway wrapping one or more local web targets.
 * 
 * @param {object} [options={}]
 * @param {number | string} [options.target] - Single target port or local URL (e.g. 3000 or "http://127.0.0.1:3000")
 * @param {Array<object>} [options.targets] - Multiple target definitions for multi-app setups
 * @param {number} [options.port=5864] - External HTTPS/HTTP2 proxy port (alias: proxyPort)
 * @param {number} [options.proxyPort=5864] - External HTTPS/HTTP2 proxy port
 * @param {number} [options.dashboardPort=5865] - Desktop control panel port
 * @param {string} [options.name="Ultimatter App"] - Application name
 * @param {string} [options.appName="Ultimatter App"] - Application name
 * @param {string} [options.icon="⚡"] - Application emoji or icon
 * @param {boolean} [options.enableTailscale=true] - Enable Tailscale MagicDNS integration if available
 * @param {boolean} [options.enableControlServer=false] - Start the desktop GUI control panel HTTP server
 * @param {string | boolean} [options.enableHub='auto'] - 'auto' | true | false
 * @param {string} [options.token] - Optional custom cryptographic token
 * @param {boolean} [options.printQr=false] - Print ASCII QR code to stdout
 * @returns {Promise<{ server: import('http2').Http2SecureServer, close: () => Promise<void>, mobileUrl: string, localIp: string, tailscaleUrl: string | null, token: string, qrSvg: string, updateTargets: (targets: any) => void }>}
 */
const createMobileGateway = async (options = {}) => {
  const proxyPort = options.port || options.proxyPort || proxy.PROXY_PORT;
  const dashboardPort = options.dashboardPort || proxy.DASHBOARD_PORT;
  const appName = options.name || options.appName || 'Ultimatter App';
  const icon = options.icon || '⚡';
  const enableTailscale = options.enableTailscale !== false;
  const enableControlServer = options.enableControlServer === true;
  const enableHub = options.enableHub !== undefined ? options.enableHub : 'auto';
  const printQr = options.printQr === true;

  if (options.token && typeof options.token === 'string') {
    auth.SECURE_TOKEN = options.token.trim();
  }

  // 1. Local Wi-Fi SSL Initialization
  const localIp = network.getLocalIp();
  network.generateSSLCertificate(localIp);

  // 2. Tailscale MagicDNS Initialization
  let validTailscaleDns = null;
  if (enableTailscale) {
    const tailscaleDns = network.getTailscaleDns();
    if (tailscaleDns) {
      const ok = network.generateTailscaleCert(tailscaleDns);
      if (ok) validTailscaleDns = tailscaleDns;
    }
  }

  // 3. Normalize Target(s)
  let initialTargets = null;

  if (options.target !== undefined && options.target !== null) {
    let port = 3000;
    let protocol = 'http';

    if (typeof options.target === 'number') {
      port = options.target;
    } else if (typeof options.target === 'string') {
      try {
        const url = new URL(options.target.includes('://') ? options.target : `http://${options.target}`);
        port = parseInt(url.port, 10) || (url.protocol === 'https:' ? 443 : 80);
        protocol = url.protocol.replace(':', '') || 'http';
      } catch (e) {
        const parsed = parseInt(options.target, 10);
        if (!isNaN(parsed)) port = parsed;
      }
    }

    initialTargets = [{
      id: 'default',
      name: appName,
      shortName: appName,
      icon: icon,
      type: 'web',
      port,
      protocol,
      status: 'online',
      enabled: true,
      description: `Target on ${protocol}://127.0.0.1:${port}`
    }];
  } else if (Array.isArray(options.targets) && options.targets.length > 0) {
    initialTargets = options.targets.map((t, idx) => ({
      id: t.id || `target-${idx + 1}`,
      name: t.name || `Target ${idx + 1}`,
      shortName: t.shortName || t.name || `Target ${idx + 1}`,
      icon: t.icon || icon,
      type: 'web',
      port: t.port || 3000,
      protocol: t.protocol || 'http',
      status: t.status || 'online',
      enabled: t.enabled !== false,
      description: t.description || `Target on ${t.protocol || 'http'}://127.0.0.1:${t.port || 3000}`
    }));
  }

  // 4. Start Reverse Proxy Engine
  const server = await proxy.startProxy({
    localIp,
    tailscaleDns: validTailscaleDns,
    proxyPort,
    dashboardPort,
    targets: initialTargets,
    enableControlServer,
    enableHub
  });

  const mobileUrl = `https://${localIp}:${proxyPort}/?token=${auth.SECURE_TOKEN}`;
  const tailscaleUrl = validTailscaleDns ? `https://${validTailscaleDns}:${proxyPort}/?token=${auth.SECURE_TOKEN}` : null;
  const qrSvg = dashboard.generateQrSvg(mobileUrl);

  if (printQr) {
    console.log(`\n🚀 Ultimatter Mobile Gateway is Live!`);
    console.log(`📱 Scan with your phone to connect:\n`);
    QRCode.toString(mobileUrl, { type: 'terminal', small: true }, (err, str) => {
      if (!err && str) console.log(str);
    });
    console.log(`👉 Mobile Wi-Fi URL: ${mobileUrl}`);
    if (tailscaleUrl) {
      console.log(`🌍 Tailscale URL: ${tailscaleUrl}`);
    }
    console.log('');
  }

  const close = () => {
    if (server && typeof server.closeGateway === 'function') {
      return server.closeGateway();
    }
    return new Promise((resolve) => {
      if (server && server.close) {
        if (typeof server.closeAllConnections === 'function') {
          server.closeAllConnections();
        }
        if (typeof server.closeIdleConnections === 'function') {
          server.closeIdleConnections();
        }
        server.close(() => resolve());
        setTimeout(resolve, 50);
      } else {
        resolve();
      }
    });
  };

  return {
    server,
    close,
    mobileUrl,
    localIp,
    tailscaleUrl,
    token: auth.SECURE_TOKEN,
    qrSvg,
    updateTargets: proxy.updateTargets
  };
};

module.exports = {
  createMobileGateway
};
