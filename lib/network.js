const os = require('os');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync, exec } = require('child_process');
const { 
  CONFIG_DIR, 
  LOCAL_CERT_FILE, 
  LOCAL_KEY_FILE, 
  SETTINGS_FILE, 
  getTailscaleCertFiles 
} = require('./config');

/**
 * Universal Registry of supported AI coding agent target definitions.
 */
const AGENT_TARGETS = [
  {
    id: 'antigravity',
    name: 'Google Antigravity',
    shortName: 'Antigravity',
    icon: '🛸',
    type: 'web',
    processPattern: 'language_server',
    protocol: 'https',
    probePath: '/',
    description: 'Autonomous multi-agent IDE and web workbench',
    validate: (res) => res.statusCode === 200 || res.statusCode === 401
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    shortName: 'OpenCode',
    icon: '👐',
    type: 'web',
    processPattern: 'opencode',
    protocol: 'http',
    defaultPort: 4096,
    probePath: '/doc',
    description: 'Open-source autonomous AI coding agent',
    validate: (res) => res.statusCode === 200
  },
  {
    id: 'claude',
    name: 'Claude Code',
    shortName: 'Claude',
    icon: '🧠',
    type: 'terminal',
    command: 'claude',
    description: 'Anthropic agentic terminal assistant (Coming Soon)',
    validate: null
  },
  {
    id: 'cursor',
    name: 'Cursor Agent',
    shortName: 'Cursor',
    icon: '⚡',
    type: 'terminal',
    command: 'cursor agent',
    description: 'Cursor IDE agent CLI (Coming Soon)',
    validate: null
  }
];

/**
 * Retrieves the primary local IPv4 address (Wi-Fi or Ethernet).
 * 
 * @returns {string} Local IPv4 address (e.g. "192.168.1.50" or "127.0.0.1")
 */
const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    if (/docker|veth|br-|vmnet|vbox|tailscale|tun|tap/i.test(name)) continue;

    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
};

/**
 * Retrieves the local non-internal IPv6 address if available.
 * 
 * @returns {string} Local IPv6 address or empty string
 */
const getLocalIpv6 = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    if (/docker|veth|br-|vmnet|vbox|tailscale|tun|tap/i.test(name)) continue;

    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv6' && !iface.internal && !iface.address.startsWith('fe80:')) {
        return iface.address;
      }
    }
  }
  return '';
};

/**
 * Retrieves the configured local mDNS domain (defaults to "ultramarine.local").
 * 
 * @returns {string} Local domain string
 */
const getLocalDomain = () => {
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      if (settings.localDomain && typeof settings.localDomain === 'string') {
        return settings.localDomain.trim();
      }
    } catch (e) {}
  }
  return 'ultramarine.local';
};

/**
 * Updates and persists the local mDNS domain name in settings.
 * 
 * @param {string} customName - New hostname (e.g. "saif-pc" or "antimatter.local")
 * @returns {string} Sanitized domain name (e.g. "saif-pc.local")
 */
const setLocalDomain = (customName) => {
  let cleanName = (customName || '').trim().toLowerCase().replace(/[^a-z0-9-.]/g, '');
  if (!cleanName) cleanName = 'ultramarine';
  if (!cleanName.endsWith('.local')) {
    cleanName = `${cleanName}.local`;
  }

  let settings = {};
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch (e) {}
  }

  settings.localDomain = cleanName;
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), { mode: 0o600 });
  return cleanName;
};

/**
 * Generates local SSL certificates with mkcert covering local IP, localhost, and custom .local domain.
 * 
 * @param {string} localIp - Primary local IP
 * @param {string} [localDomain=null] - Custom mDNS domain
 * @param {boolean} [force=false] - Force re-generation even if files exist
 * @returns {boolean} True if certificate generated successfully
 */
const generateSSLCertificate = (localIp, localDomain = null, force = false) => {
  if (!force && fs.existsSync(LOCAL_CERT_FILE) && fs.existsSync(LOCAL_KEY_FILE)) {
    return true;
  }

  try {
    const mkcertCmd = getMkcertBinary();
    const domain = localDomain || getLocalDomain();
    
    execSync(`${mkcertCmd} -install`, { stdio: 'ignore' });
    execSync(`${mkcertCmd} -cert-file "${LOCAL_CERT_FILE}" -key-file "${LOCAL_KEY_FILE}" ${localIp} localhost 127.0.0.1 ${domain}`, { stdio: 'ignore' });
    
    return true;
  } catch (err) {
    console.warn("⚠️ mkcert generation notice:", err.message);
    return false;
  }
};

/**
 * Probes a candidate port with the agent target's protocol and path.
 * 
 * @param {number} port - TCP port to probe
 * @param {object} target - Target definition from AGENT_TARGETS
 * @returns {Promise<boolean>}
 */
const probeTargetPort = (port, target) => {
  return new Promise((resolve) => {
    if (!target || !target.protocol) return resolve(false);
    const client = target.protocol === 'https' ? https : http;
    const url = `${target.protocol}://127.0.0.1:${port}${target.probePath || '/'}`;
    const opts = target.protocol === 'https' ? { rejectUnauthorized: false } : {};
    
    const req = client.get(url, opts, (res) => {
      resolve(target.validate ? target.validate(res) : (res.statusCode >= 200 && res.statusCode < 500));
    });
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
};

/**
 * Backward-compatible helper checking if port responds like an Antigravity IDE.
 * 
 * @param {number} port - TCP port
 * @returns {Promise<boolean>}
 */
const checkPortIsIde = (port) => {
  return probeTargetPort(port, AGENT_TARGETS[0]);
};

/**
 * Discovers ALL active AI coding agents listening on localhost simultaneously.
 * 
 * @returns {Promise<Array<{ id: string, name: string, shortName: string, icon: string, type: string, port: number, protocol: string, status: string, description: string }>>}
 */
const findAllActiveAgentTargets = () => {
  return new Promise((resolve) => {
    const webTargets = AGENT_TARGETS.filter(t => t.type === 'web');
    const patterns = webTargets.map(t => t.processPattern).join('|');
    let cmd = '';
    
    if (os.platform() === 'darwin') {
      cmd = `lsof -iTCP -sTCP:LISTEN -P -n | grep -E "${patterns}"`;
    } else if (os.platform() === 'win32') {
      cmd = `powershell -NoProfile -Command "$ErrorActionPreference = 'SilentlyContinue'; Get-NetTCPConnection -State Listen | Where-Object { $_.LocalAddress -eq '127.0.0.1' } | ForEach-Object { $proc = Get-Process -Id $_.OwningProcess; if ($proc.ProcessName -match '${patterns}') { Write-Output ($proc.ProcessName + ':' + $_.LocalPort) } }"`;
    } else {
      cmd = `ss -tlnp | grep -E "${patterns}"`;
    }

    exec(cmd, async (err, stdout) => {
      const candidates = [];

      if (!err && stdout) {
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          for (const target of webTargets) {
            if (new RegExp(target.processPattern, 'i').test(line)) {
              const portMatch = line.match(/(?:127\.0\.0\.1|0\.0\.0\.0|\[::\]|localhost):(\d+)/i);
              if (portMatch) {
                const parsed = parseInt(portMatch[1], 10);
                if (!isNaN(parsed) && !candidates.some(c => c.port === parsed && c.target.id === target.id)) {
                  candidates.push({ port: parsed, target });
                }
              }
            }
          }
        }
      }

      // Add default known ports (e.g. OpenCode 4096) for fast probe
      for (const target of webTargets) {
        if (target.defaultPort && !candidates.some(c => c.port === target.defaultPort && c.target.id === target.id)) {
          candidates.push({ port: target.defaultPort, target });
        }
      }

      const activeList = [];
      for (const { port, target } of candidates) {
        if (await probeTargetPort(port, target)) {
          if (!activeList.some(a => a.id === target.id)) {
            activeList.push({
              id: target.id,
              name: target.name,
              shortName: target.shortName,
              icon: target.icon,
              type: target.type,
              port,
              protocol: target.protocol,
              status: 'online',
              description: target.description
            });
          }
        }
      }

      resolve(activeList);
    });
  });
};

/**
 * Returns the primary active agent target or null.
 * 
 * @returns {Promise<{ id: string, name: string, shortName: string, icon: string, type: string, port: number, protocol: string, status: string, description: string } | null>}
 */
const findActiveAgentTarget = async () => {
  const all = await findAllActiveAgentTargets();
  return all.length > 0 ? all[0] : null;
};

/**
 * Backward-compatible helper returning primary active port number or null.
 * 
 * @returns {Promise<number | null>}
 */
const findActiveIdePort = async () => {
  const target = await findActiveAgentTarget();
  return target ? target.port : null;
};

/**
 * Background watcher for dynamic multi-agent port and target changes.
 * 
 * @param {function(Array<object>): void} callback
 * @param {number} [fastIntervalMs=1500]
 * @param {number} [slowIntervalMs=4500]
 * @returns {function(): void}
 */
const watchIdePort = (callback, fastIntervalMs = 1500, slowIntervalMs = 4500) => {
  let lastTargetKey = null;
  let timer = null;
  let isRunning = true;
  
  const scheduleNext = (delay) => {
    if (!isRunning) return;
    timer = setTimeout(check, delay);
  };

  const check = async () => {
    try {
      const activeTargets = await findAllActiveAgentTargets();
      const currentTargetKey = activeTargets.map(t => `${t.id}:${t.port}:${t.protocol}`).sort().join('|');
      if (currentTargetKey !== lastTargetKey) {
        lastTargetKey = currentTargetKey;
        callback(activeTargets);
      }
    } catch (e) {}

    const nextDelay = lastTargetKey ? slowIntervalMs : fastIntervalMs;
    scheduleNext(nextDelay);
  };

  check();

  return () => {
    isRunning = false;
    if (timer) clearTimeout(timer);
  };
};

/**
 * Retrieves the active Tailscale MagicDNS domain name if available.
 * 
 * @returns {string | null} Full DNS name (e.g. "host.tailnet.ts.net")
 */
const getTailscaleDns = () => {
  try {
    const stdout = execSync('tailscale status --json', { stdio: 'pipe', encoding: 'utf8' });
    const status = JSON.parse(stdout);
    if (status && status.Self && status.Self.DNSName) {
      return status.Self.DNSName.replace(/\.$/, '');
    }
  } catch (e) {}
  return null;
};

/**
 * Retrieves detailed Tailscale status, state, IPs, and connected peers.
 * 
 * @returns {object} Tailscale state metadata
 */
const getTailscaleState = () => {
  try {
    const stdout = execSync('tailscale status --json', { stdio: 'pipe', encoding: 'utf8' });
    const status = JSON.parse(stdout);
    if (status && status.Self) {
      const dnsName = status.Self.DNSName ? status.Self.DNSName.replace(/\.$/, '') : null;
      const ipv4 = (status.Self.TailscaleIPs || []).find(ip => ip.includes('.')) || '';
      const ipv6 = (status.Self.TailscaleIPs || []).find(ip => ip.includes(':')) || '';
      
      const peers = [];
      if (status.Peer) {
        for (const key of Object.keys(status.Peer)) {
          const peer = status.Peer[key];
          if (peer.Active) {
            peers.push({
              hostName: peer.HostName || peer.DNSName || 'Peer',
              mode: (peer.CurAddr && !peer.CurAddr.includes('relay')) ? 'direct' : 'relay',
              relay: peer.Relay || ''
            });
          }
        }
      }

      return {
        state: 'connected',
        dnsName,
        ipv4,
        ipv6,
        peers
      };
    }
  } catch (e) {
    try {
      execSync('which tailscale', { stdio: 'ignore' });
      return { state: 'stopped', dnsName: null, ipv4: '', ipv6: '', peers: [] };
    } catch (err) {
      return { state: 'not_installed', dnsName: null, ipv4: '', ipv6: '', peers: [] };
    }
  }
  return { state: 'not_installed', dnsName: null, ipv4: '', ipv6: '', peers: [] };
};

/**
 * Generates official Let's Encrypt TLS certificates via Tailscale.
 * 
 * @param {string} dnsName - Tailscale MagicDNS name
 * @returns {boolean} True if certificate exists or was generated
 */
const generateTailscaleCert = (dnsName) => {
  if (!dnsName) return false;
  const { certFile, keyFile } = getTailscaleCertFiles(dnsName);

  if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
    return true;
  }

  try {
    console.log(`🔒 Requesting Let's Encrypt TLS certificate for ${dnsName} via Tailscale...`);
    execSync(`tailscale cert ${dnsName}`, { cwd: CONFIG_DIR, stdio: 'pipe' });
    return fs.existsSync(certFile) && fs.existsSync(keyFile);
  } catch (e) {
    console.warn(`⚠️ Tailscale cert notice: ${e.message}`);
    return false;
  }
};

/**
 * Resolves or extracts the bundled mkcert binary for the current operating system.
 * 
 * @returns {string} Path or command for mkcert
 */
const getMkcertBinary = () => {
  try {
    execSync('which mkcert', { stdio: 'ignore' });
    return 'mkcert';
  } catch (e) {}

  const binDir = path.join(CONFIG_DIR, 'bin');
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true, mode: 0o700 });
  }

  const isWin = os.platform() === 'win32';
  const isMac = os.platform() === 'darwin';
  const arch = os.arch();

  let assetName = 'mkcert-linux-amd64';
  if (isWin) assetName = 'mkcert-windows-amd64.exe';
  else if (isMac) assetName = arch === 'arm64' ? 'mkcert-darwin-arm64' : 'mkcert-darwin-amd64';
  else if (arch === 'arm64') assetName = 'mkcert-linux-arm64';

  const configMkcert = path.join(binDir, isWin ? 'mkcert.exe' : 'mkcert');

  if (fs.existsSync(configMkcert)) {
    return `"${configMkcert}"`;
  }

  const bundledAssetPath = path.join(__dirname, '..', 'assets', assetName);
  if (fs.existsSync(bundledAssetPath)) {
    fs.copyFileSync(bundledAssetPath, configMkcert);
    if (!isWin) fs.chmodSync(configMkcert, 0o755);
    return `"${configMkcert}"`;
  }

  try {
    const downloadUrl = `https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/${assetName}`;
    execSync(`curl -fsSL -o "${configMkcert}" "${downloadUrl}"`, { stdio: 'ignore' });
    if (!isWin) fs.chmodSync(configMkcert, 0o755);
    return `"${configMkcert}"`;
  } catch (err) {
    throw new Error('mkcert binary not found and failed to download automatically.');
  }
};

/**
 * Returns the absolute path to the local rootCA.pem file.
 * 
 * @returns {string | null} Path to root CA
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
      for (const b of macBrowsers) {
        if (fs.existsSync(b)) {
          exec(`"${b}" --app="${url}" --window-size=${windowWidth},${windowHeight} >/dev/null 2>&1 &`);
          return;
        }
      }
      exec(`open "${url}"`);
    } else if (os.platform() === 'win32') {
      const winBrowsers = [
        `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
        `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
        `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
        `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
        `${process.env['PROGRAMFILES(X86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
        `${process.env.PROGRAMFILES}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
        `${process.env.LOCALAPPDATA}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`
      ];
      for (const b of winBrowsers) {
        if (b && fs.existsSync(b)) {
          exec(`start "" "${b}" --app="${url}" --window-size=${windowWidth},${windowHeight}`);
          return;
        }
      }
      exec(`start "" "${url}"`);
    } else {
      const linuxBrowsers = ['google-chrome', 'google-chrome-stable', 'brave-browser', 'brave', 'microsoft-edge', 'chromium', 'chromium-browser'];
      for (const b of linuxBrowsers) {
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
  } catch (err) {}
};

module.exports = {
  AGENT_TARGETS,
  getLocalIp,
  getLocalIpv6,
  getLocalDomain,
  setLocalDomain,
  getTailscaleDns,
  getTailscaleState,
  generateTailscaleCert,
  generateSSLCertificate,
  getMkcertBinary,
  getRootCaPath,
  probeTargetPort,
  checkPortIsIde,
  findAllActiveAgentTargets,
  findActiveAgentTarget,
  findActiveIdePort,
  watchIdePort,
  openBrowser
};
