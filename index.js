const http = require('http');
const network = require('./lib/network');
const proxy = require('./lib/proxy');

const args = process.argv.slice(2);

// Handle CLI help flag
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🚀 Ultimate Antimatter Bridge

Usage:
  antimatter [options]

Options:
  --headless       Run bridge in background without launching a desktop GUI window
  -v, --version    Print Antimatter version and exit
  -h, --help       Show this help message and exit
`);
  process.exit(0);
}

// Handle CLI version flag
if (args.includes('--version') || args.includes('-v')) {
  const pkg = require('./package.json');
  console.log(`v${pkg.version}`);
  process.exit(0);
}

const isHeadless = args.includes('--headless');

/**
 * Checks if another Antimatter process is already running in the background
 * by probing the local dashboard status endpoint.
 * 
 * @returns {Promise<boolean>} True if another instance is already running
 */
const checkIfAlreadyRunning = () => {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${proxy.DASHBOARD_PORT}/api/dashboard/status`, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(!!json.token);
        } catch (e) {
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
};

/**
 * Main application bootstrap lifecycle.
 */
const startBridge = async () => {
  try {
    const isRunning = await checkIfAlreadyRunning();
    const dashboardUrl = `http://localhost:${proxy.DASHBOARD_PORT}/dashboard`;

    // 1. Single-Instance Re-Opener
    if (isRunning) {
      console.log(`\n🚀 Antimatter is already active in background.`);
      if (!isHeadless) {
        console.log(`Re-opening Control Panel in desktop window...\n`);
        network.openBrowser(dashboardUrl);
      }
      return;
    }

    // 2. Local Wi-Fi SSL Initialization
    const localIp = network.getLocalIp();
    network.generateSSLCertificate(localIp);

    // 3. Tailscale MagicDNS TLS Initialization
    let validTailscaleDns = null;
    const tailscaleDns = network.getTailscaleDns();
    if (tailscaleDns) {
      const ok = network.generateTailscaleCert(tailscaleDns);
      if (ok) validTailscaleDns = tailscaleDns;
    }

    // 4. Start Reverse Proxy (HTTP/2 on :5864, Local Dashboard on :5865)
    proxy.startProxy(localIp, validTailscaleDns);

    // 5. Start Background IDE Port Discovery Watcher
    network.watchIdePort((port) => {
      proxy.updateTargetPort(port);
    });

    // 6. Launch Standalone GUI Window on Desktop (unless running --headless)
    if (!isHeadless) {
      network.openBrowser(dashboardUrl);
    } else {
      console.log(`⚙️  Headless Mode: Desktop GUI window will not open automatically.`);
    }
  } catch (err) {
    console.error("❌ Antimatter Startup Failed:", err.message);
    process.exit(1);
  }
};

startBridge();
