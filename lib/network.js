const os = require('os');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const https = require('https');
const { exec, execSync } = require('child_process');
const { CONFIG_DIR, LOCAL_CERT_FILE, LOCAL_KEY_FILE } = require('./config');

/**
 * Discovers the machine's primary local IPv4 address for Wi-Fi/Ethernet.
 * Ignores loopbacks (127.0.0.1) and Tailscale CGNAT addresses (100.x.x.x).
 * 
 * @returns {string} The local IP address (e.g. "192.168.1.50") or "127.0.0.1" fallback
 */
const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('100.')) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
};

/**
 * Discovers the machine's primary local IPv6 address for Wi-Fi/Ethernet if available.
 * Ignores link-local (fe80::) and Tailscale ULA (fd7a::).
 * 
 * @returns {string | null} The local IPv6 address or null
 */
const getLocalIpv6 = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv6' && !iface.internal && !iface.address.startsWith('fe80:') && !iface.address.startsWith('fd7a:')) {
        return iface.address;
      }
    }
  }
  return null;
};

/**
 * Inspects Tailscale installation and connection state on the host PC.
 * 
 * @returns {{ state: 'connected' | 'stopped' | 'not_installed', dnsName: string | null, ipv4: string | null, ipv6: string | null, peers: Array<object>, platform: string }}
 */
const getTailscaleState = () => {
  const isWin = os.platform() === 'win32';
  const binName = isWin ? 'tailscale.exe' : 'tailscale';

  // 1. Check if tailscale binary is installed in PATH
  let isInstalled = false;
  try {
    execSync(`${binName} version`, { stdio: 'ignore' });
    isInstalled = true;
  } catch (e) {}

  if (!isInstalled) {
    return { state: 'not_installed', dnsName: null, ipv4: null, ipv6: null, peers: [], platform: os.platform() };
  }

  // 2. Check if the daemon is running and connected
  try {
    const stdout = execSync('tailscale status --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const status = JSON.parse(stdout);
    if (status && status.Self && status.Self.DNSName) {
      let dns = status.Self.DNSName;
      if (dns.endsWith('.')) dns = dns.slice(0, -1);

      const tailscaleIps = status.Self.TailscaleIPs || [];
      const ipv4 = tailscaleIps.find(ip => !ip.includes(':')) || null;
      const ipv6 = tailscaleIps.find(ip => ip.includes(':')) || null;

      const peers = [];
      if (status.Peer) {
        for (const peerKey of Object.keys(status.Peer)) {
          const p = status.Peer[peerKey];
          if (p && p.Online) {
            const isDirect = !!p.CurAddr;
            peers.push({
              hostName: p.HostName || 'Unknown Peer',
              os: p.OS || '',
              online: true,
              mode: isDirect ? 'direct' : 'relay',
              relay: p.Relay || '',
              curAddr: p.CurAddr || ''
            });
          }
        }
      }

      return {
        state: 'connected',
        dnsName: dns,
        ipv4,
        ipv6,
        peers,
        platform: os.platform()
      };
    }
  } catch (err) {}

  return { state: 'stopped', dnsName: null, ipv4: null, ipv6: null, peers: [], platform: os.platform() };
};

/**
 * Returns the active Tailscale MagicDNS domain if connected.
 * 
 * @returns {string | null}
 */
const getTailscaleDns = () => {
  const info = getTailscaleState();
  return info.state === 'connected' ? info.dnsName : null;
};

/**
 * Requests a Let's Encrypt TLS certificate for a Tailscale MagicDNS domain.
 * 
 * @param {string} dnsName - MagicDNS hostname
 * @returns {boolean} True if certificate generation succeeded
 */
const generateTailscaleCert = (dnsName) => {
  console.log(`🔒 Requesting Let's Encrypt TLS certificate for ${dnsName} via Tailscale...`);
  try {
    execSync(`tailscale cert ${dnsName}`, { cwd: CONFIG_DIR, stdio: 'pipe' });
    return true;
  } catch (err) {
    const errorMsg = (err.stderr ? err.stderr.toString() : err.message).trim();
    console.warn(`\n⚠️ Tailscale Cert Notice: ${errorMsg}`);
    
    if (errorMsg.includes("access denied")) {
      console.warn(`(To enable MagicDNS TLS, run: sudo tailscale set --operator=$USER)\n`);
    } else if (errorMsg.includes("does not support getting TLS certs")) {
      console.warn(`(To enable MagicDNS TLS, turn on "HTTPS Certificates" at https://login.tailscale.com/admin/dns)\n`);
    }
    
    return false;
  }
};

/**
 * Locates or auto-extracts the pre-bundled compressed mkcert binary for the current OS.
 * 
 * @returns {string} Executable path to mkcert
 */
const getMkcertBinary = () => {
  const isWin = os.platform() === 'win32';
  const binaryName = isWin ? 'mkcert.exe' : 'mkcert';
  const configMkcert = path.join(CONFIG_DIR, binaryName);

  // 1. Check if ~/.config/ultimatter/mkcert already exists
  if (fs.existsSync(configMkcert)) {
    try {
      if (!isWin) fs.chmodSync(configMkcert, 0o755);
      return configMkcert;
    } catch (e) {}
  }

  // 2. Check if mkcert is installed in system PATH
  try {
    execSync(`${binaryName} -version`, { stdio: 'ignore' });
    return binaryName;
  } catch (e) {}

  // 3. Determine matching compressed asset for host OS & architecture
  let gzAssetName = 'mkcert-linux-x64.gz';
  if (os.platform() === 'darwin') {
    gzAssetName = os.arch() === 'arm64' ? 'mkcert-darwin-arm64.gz' : 'mkcert-darwin-x64.gz';
  } else if (isWin) {
    gzAssetName = 'mkcert-windows-x64.exe.gz';
  } else if (os.arch() === 'arm64') {
    gzAssetName = 'mkcert-linux-arm64.gz';
  }

  const assetCandidates = [
    path.join(__dirname, '..', 'assets', gzAssetName),
    path.join(process.cwd(), 'assets', gzAssetName)
  ];

  for (const assetGz of assetCandidates) {
    if (fs.existsSync(assetGz)) {
      try {
        const compressedData = fs.readFileSync(assetGz);
        const decompressedData = zlib.gunzipSync(compressedData);
        fs.writeFileSync(configMkcert, decompressedData);
        if (!isWin) fs.chmodSync(configMkcert, 0o755);
        return configMkcert;
      } catch (e) {}
    }
  }

  // 4. Self-healing download fallback from GitHub release
  try {
    let assetName = 'mkcert-v1.4.4-linux-amd64';
    if (os.platform() === 'darwin') {
      assetName = os.arch() === 'arm64' ? 'mkcert-v1.4.4-darwin-arm64' : 'mkcert-v1.4.4-darwin-amd64';
    } else if (isWin) {
      assetName = os.arch() === 'arm64' ? 'mkcert-v1.4.4-windows-arm64.exe' : 'mkcert-v1.4.4-windows-amd64.exe';
    } else if (os.arch() === 'arm64') {
      assetName = 'mkcert-v1.4.4-linux-arm64';
    }

    const downloadUrl = `https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/${assetName}`;
    execSync(`curl -fsSL -o "${configMkcert}" "${downloadUrl}"`, { stdio: 'ignore' });
    if (!isWin) fs.chmodSync(configMkcert, 0o755);
    return configMkcert;
  } catch (err) {}

  return binaryName;
};

/**
 * Returns the absolute path to mkcert's rootCA.pem file.
 * 
 * @returns {string | null} Path to rootCA.pem or null if unavailable
 */
const getRootCaPath = () => {
  try {
    const mkcertCmd = getMkcertBinary();
    const caDir = execSync(`${mkcertCmd} -CAROOT`, { encoding: 'utf8' }).trim();
    const rootCaFile = path.join(caDir, 'rootCA.pem');
    if (fs.existsSync(rootCaFile)) return rootCaFile;
  } catch (e) {}
  return null;
};

/**
 * Generates local Wi-Fi TLS certificates using mkcert.
 * 
 * @param {string} localIp - The local machine IP address
 */
const generateSSLCertificate = (localIp) => {
  if (fs.existsSync(LOCAL_CERT_FILE) && fs.existsSync(LOCAL_KEY_FILE)) {
    return;
  }
  
  console.log(`🔒 Generating trusted SSL certificate for ${localIp} using mkcert...`);
  try {
    const mkcertCmd = getMkcertBinary();
    execSync(`${mkcertCmd} -cert-file "${LOCAL_CERT_FILE}" -key-file "${LOCAL_KEY_FILE}" ${localIp} localhost 127.0.0.1`, { stdio: 'ignore' });
  } catch (err) {
    console.error("Failed to generate SSL certificate.");
    process.exit(1);
  }
};

/**
 * Probes a candidate port to verify if it responds like an Antigravity IDE language server.
 * 
 * @param {number} port - TCP port to probe
 * @returns {Promise<boolean>}
 */
const checkPortIsIde = (port) => {
  return new Promise((resolve) => {
    const req = https.get(`https://127.0.0.1:${port}/`, { rejectUnauthorized: false }, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 401);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => resolve(false));
  });
};

/**
 * Inspects listening TCP sockets on the host OS to discover the Antigravity IDE port.
 * 
 * @returns {Promise<number | null>} Active port number or null
 */
const findActiveIdePort = () => {
  return new Promise((resolve) => {
    let cmd = '';
    if (os.platform() === 'darwin') {
      cmd = "lsof -iTCP -sTCP:LISTEN -P -n | grep language_server";
    } else if (os.platform() === 'win32') {
      cmd = `powershell -NoProfile -Command "$ErrorActionPreference = 'SilentlyContinue'; Get-NetTCPConnection -State Listen | Where-Object { $_.LocalAddress -eq '127.0.0.1' } | ForEach-Object { $proc = Get-Process -Id $_.OwningProcess; if ($proc.ProcessName -match 'language_server') { Write-Output ('127.0.0.1:' + $_.LocalPort) } }"`;
    } else {
      cmd = "ss -tlnp | grep language_server";
    }

    exec(cmd, async (err, stdout) => {
      if (err || !stdout) return resolve(null);
      
      const ports = [];
      const regex = /127\.0\.0\.1:(\d+)/g;
      let match;
      while ((match = regex.exec(stdout)) !== null) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && !ports.includes(parsed)) {
          ports.push(parsed);
        }
      }

      for (const p of ports) {
        if (await checkPortIsIde(p)) return resolve(p);
      }
      resolve(null);
    });
  });
};

/**
 * Starts background watcher to detect IDE language server port changes.
 * Uses adaptive polling interval (1.5s when disconnected, 4.5s when connected).
 * 
 * @param {function(number | null): void} callback - Invoked when active port changes
 * @param {number} [fastIntervalMs=1500] - Polling delay when searching
 * @param {number} [slowIntervalMs=4500] - Polling delay when connected
 * @returns {function(): void} Stop function to cancel watcher
 */
const watchIdePort = (callback, fastIntervalMs = 1500, slowIntervalMs = 4500) => {
  let lastPort = null;
  let timer = null;
  let isRunning = true;
  
  const scheduleNext = (delay) => {
    if (!isRunning) return;
    timer = setTimeout(check, delay);
  };

  const check = async () => {
    try {
      const currentPort = await findActiveIdePort();
      if (currentPort !== lastPort) {
        lastPort = currentPort;
        callback(currentPort);
      }
    } catch (e) {
      // Suppress transient check errors
    }

    const nextDelay = lastPort ? slowIntervalMs : fastIntervalMs;
    scheduleNext(nextDelay);
  };

  check();

  return () => {
    isRunning = false;
    if (timer) clearTimeout(timer);
  };
};

/**
 * Opens a dedicated floating application window for the Ultimatter Control Panel.
 * 
 * @param {string} url - The URL to open (e.g. "http://localhost:5865/dashboard")
 */
const openBrowser = (url) => {
  const windowWidth = 520;
  const windowHeight = 740;

  try {
    if (os.platform() === 'darwin') {
      const macBrowsers = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        '/Applications/Chromium.app/Contents/MacOS/Chromium'
      ];
      for (const browser of macBrowsers) {
        if (fs.existsSync(browser)) {
          exec(`"${browser}" --app="${url}" --window-size=${windowWidth},${windowHeight} >/dev/null 2>&1 &`);
          return;
        }
      }
      if (fs.existsSync('/Applications/Firefox.app')) {
        exec(`open -n -a Firefox --args --new-window "${url}"`);
        return;
      }
      exec(`open "${url}"`);
    } else if (os.platform() === 'win32') {
      const winCommands = [
        `start chrome --app="${url}" --window-size=${windowWidth},${windowHeight}`,
        `start msedge --app="${url}" --window-size=${windowWidth},${windowHeight}`,
        `start brave --app="${url}" --window-size=${windowWidth},${windowHeight}`,
        `start firefox -new-window "${url}"`
      ];
      for (const cmd of winCommands) {
        try {
          execSync(cmd, { stdio: 'ignore' });
          return;
        } catch (e) {}
      }
      exec(`start "" "${url}"`);
    } else {
      // Linux
      const linuxChromium = ['google-chrome', 'chromium-browser', 'chromium', 'brave-browser', 'microsoft-edge'];
      for (const b of linuxChromium) {
        try {
          execSync(`which ${b}`, { stdio: 'ignore' });
          exec(`${b} --app="${url}" --window-size=${windowWidth},${windowHeight} >/dev/null 2>&1 &`);
          return;
        } catch (e) {}
      }

      try {
        execSync('which firefox', { stdio: 'ignore' });
        exec(`firefox --new-window "${url}" >/dev/null 2>&1 &`);
        return;
      } catch (e) {}

      exec(`xdg-open "${url}" >/dev/null 2>&1 &`);
    }
  } catch (err) {
    // Suppress errors on headless servers
  }
};

module.exports = {
  getLocalIp,
  getLocalIpv6,
  getTailscaleDns,
  getTailscaleState,
  generateTailscaleCert,
  generateSSLCertificate,
  getMkcertBinary,
  getRootCaPath,
  findActiveIdePort,
  watchIdePort,
  openBrowser
};
