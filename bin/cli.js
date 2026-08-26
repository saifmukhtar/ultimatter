#!/usr/bin/env node

const http = require('http');
const network = require('../lib/network');
const proxy = require('../lib/proxy');
const { createMobileGateway } = require('../lib/gateway');
const pkg = require('../package.json');

const args = process.argv.slice(2);

// Handle CLI help flag
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🚀 Ultimatter - Universal Mobile Gateway for Local Dev & AI Agents

Usage:
  ultimatter [options]

Options:
  -p, --port <port>     Wrap a custom local port or URL (e.g. 3000, 8080)
  -n, --name <name>     Custom application name (e.g. "My App")
  --headless            Run in background without launching a desktop GUI window
  -v, --version         Print Ultimatter version and exit
  -h, --help            Show this help message and exit

Examples:
  npx ultimatter                    # Auto-discover AI coding agents (Antigravity, OpenCode, Claude Code)
  npx ultimatter --port 3000        # Wrap a local web app on port 3000 with mobile HTTPS & QR pairing
  npx ultimatter -p 8080 -n "API"   # Wrap custom service with custom name
`);
  process.exit(0);
}

// Handle CLI version flag
if (args.includes('--version') || args.includes('-v')) {
  console.log(`v${pkg.version}`);
  process.exit(0);
}

// Parse custom port flag (-p, --port)
let customPort = null;
const portIdx = args.findIndex(a => a === '--port' || a === '-p');
if (portIdx !== -1 && args[portIdx + 1]) {
  customPort = args[portIdx + 1];
}

// Parse custom name flag (-n, --name)
let customName = 'Ultimatter App';
const nameIdx = args.findIndex(a => a === '--name' || a === '-n');
if (nameIdx !== -1 && args[nameIdx + 1]) {
  customName = args[nameIdx + 1];
}

const isHeadless = args.includes('--headless');

/**
 * Checks if another Ultimatter process is already running in the background
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
const startCli = async () => {
  try {
    // Mode A: Custom Target Port Wrapping (CLI SDK Mode)
    if (customPort) {
      await createMobileGateway({
        target: customPort,
        appName: customName,
        enableControlServer: false,
        printQr: true
      });
      return;
    }

    // Mode B: Default Standalone Multi-Agent AI Gateway Mode
    const isRunning = await checkIfAlreadyRunning();
    const dashboardUrl = `http://localhost:${proxy.DASHBOARD_PORT}/dashboard`;

    // 1. Single-Instance Re-Opener
    if (isRunning) {
      console.log(`\n🚀 Ultimatter is already active in background.`);
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
    await proxy.startProxy({
      localIp,
      tailscaleDns: validTailscaleDns,
      proxyPort: proxy.PROXY_PORT,
      dashboardPort: proxy.DASHBOARD_PORT,
      enableControlServer: true
    });

    // 5. Start Background Agent Port Discovery Watcher
    network.watchIdePort((targets) => {
      proxy.updateTargets(targets);
    });

    // 6. Launch Standalone GUI Window on Desktop (unless running --headless)
    if (!isHeadless) {
      network.openBrowser(dashboardUrl);
    } else {
      console.log(`⚙️  Headless Mode: Desktop GUI window will not open automatically.`);
    }
  } catch (err) {
    console.error("❌ Ultimatter Startup Failed:", err.message);
    process.exit(1);
  }
};

startCli();
