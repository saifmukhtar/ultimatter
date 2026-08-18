const QRCode = require('qrcode');

/**
 * Generates an optimized, vector SVG QR code for any given string.
 * 
 * @param {string} text - The URL or text payload to encode
 * @returns {string} Clean SVG markup string
 */
const generateQrSvg = (text) => {
  if (!text) return '';
  try {
    const qrData = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const size = qrData.modules.size;
    const data = qrData.modules.data;
    let path = '';
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (data[r * size + c]) {
          path += `M${c + 1} ${r + 1}h1v1h-1z `;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size + 2} ${size + 2}" width="200" height="200" shape-rendering="crispEdges" style="background: #ffffff; padding: 12px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);"><path fill="#000000" d="${path.trim()}"/></svg>`;
  } catch (e) {
    return '';
  }
};

/**
 * Returns the complete single-page HTML document for the Desktop Control Panel.
 * 
 * @returns {string} Complete HTML/CSS/JS document
 */
const getDashboardHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ultimatter Control Panel</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
      user-select: none;
    }
    .card {
      background-color: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 24px;
      max-width: 460px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-icon { font-size: 20px; }
    .header h1 {
      font-size: 17px;
      font-weight: 700;
      color: #f9fafb;
      letter-spacing: -0.02em;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #f87171;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
      transition: all 0.3s ease;
    }
    .status-pill.online {
      background: rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.25);
      color: #4ade80;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }
    .status-pill.online .status-dot {
      box-shadow: 0 0 8px #4ade80;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }
    .mode-tabs {
      width: 100%;
      display: flex;
      background: #1f2937;
      padding: 4px;
      border-radius: 10px;
      margin-bottom: 20px;
      gap: 4px;
    }
    .tab-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: #9ca3af;
      padding: 9px 12px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 7px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;
    }
    .tab-btn.active {
      background: #374151;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
    .qr-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 20px;
      width: 100%;
    }
    .link-section {
      width: 100%;
      margin-bottom: 16px;
    }
    .link-label {
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
      margin-bottom: 6px;
      display: block;
    }
    .link-box {
      display: flex;
      background: #090d16;
      border: 1px solid #374151;
      border-radius: 8px;
      overflow: hidden;
    }
    .link-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #93c5fd;
      padding: 10px 12px;
      font-size: 12px;
      font-family: monospace;
      outline: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .copy-btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 0 16px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .copy-btn:hover { background: #1d4ed8; }
    .copy-btn.copied { background: #16a34a; }

    /* Guide Card Styles */
    .guide-card {
      width: 100%;
      background: #0d121f;
      border: 1px solid #1f2937;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      text-align: left;
    }
    .guide-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #f3f4f6;
      margin-bottom: 8px;
    }
    .guide-desc {
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.5;
      margin-bottom: 14px;
    }
    .code-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #050811;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 12px;
      font-family: monospace;
      font-size: 12px;
      color: #60a5fa;
      overflow-x: auto;
    }
    .code-text {
      user-select: text;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .copy-small-btn {
      background: #374151;
      color: #e5e7eb;
      border: none;
      border-radius: 5px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      margin-left: 8px;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    .copy-small-btn:hover { background: #4b5563; }
    .copy-small-btn.copied { background: #16a34a; color: white; }
    .btn-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      background: #2563eb;
      color: #ffffff;
      text-decoration: none;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      transition: background 0.2s;
      cursor: pointer;
      text-align: center;
    }
    .btn-action:hover { background: #1d4ed8; }
    .guide-footer {
      font-size: 11px;
      color: #6b7280;
      margin-top: 10px;
      text-align: center;
    }
    .info-footer {
      width: 100%;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
    }
    .badge-tip {
      color: #94a3b8;
      background: rgba(148, 163, 184, 0.1);
      padding: 4px 8px;
      border-radius: 6px;
      display: inline-block;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">
        <span class="brand-icon">🚀</span>
        <h1>Ultimatter</h1>
      </div>
      <div id="statusPill" class="status-pill">
        <span class="status-dot"></span>
        <span id="statusText">IDE Offline</span>
      </div>
    </div>

    <div class="mode-tabs">
      <button id="tabLocal" class="tab-btn active" onclick="setMode('local')">
        🏠 Local Wi-Fi
      </button>
      <button id="tabTailscale" class="tab-btn" onclick="setMode('tailscale')">
        🌍 Tailscale MagicDNS
      </button>
    </div>

    <!-- Main Content Container (Swapped dynamically) -->
    <div id="mainContent" style="width: 100%;">
      <div class="qr-container" id="qrWrapper"></div>

      <div class="link-section" id="linkSection">
        <span class="link-label">Direct Mobile Connection Link:</span>
        <div class="link-box">
          <input type="text" id="directLinkInput" class="link-input" readonly value="Loading..." />
          <button id="copyBtn" class="copy-btn" onclick="copyLink()">Copy</button>
        </div>
      </div>
    </div>

    <div class="info-footer">
      <div id="tipText">Scan this QR code with your phone camera or browser to connect instantly.</div>
      <div class="badge-tip">⚡ HTTP/2 Multiplexed &bull; 🔒 256-Bit Cryptographic Auth</div>
    </div>
  </div>

  <script>
    let state = {
      mode: 'local',
      localUrl: '',
      tailscaleUrl: '',
      localQrSvg: '',
      tailscaleQrSvg: '',
      tailscaleAvailable: false,
      tailscaleState: 'stopped', // 'connected' | 'stopped' | 'not_installed'
      tailscaleDns: '',
      platform: 'linux',
      ideOnline: false,
      idePort: null
    };

    const copyText = (text, btnId) => {
      navigator.clipboard.writeText(text).then(() => {
        if (btnId) {
          const btn = document.getElementById(btnId);
          if (btn) {
            btn.innerText = 'Copied!';
            btn.className += ' copied';
            setTimeout(() => {
              btn.innerText = 'Copy';
              btn.className = btn.className.replace(' copied', '');
            }, 2000);
          }
        }
      });
    };

    const renderTailscaleGuide = () => {
      const isLinux = state.platform === 'linux';
      const isMac = state.platform === 'darwin';

      if (state.tailscaleState === 'stopped') {
        let commandHtml = '';
        if (isLinux) {
          commandHtml = \`
            <div class="code-box">
              <span class="code-text" id="startCmd">sudo systemctl start tailscaled && sudo tailscale up</span>
              <button id="copyStartBtn" class="copy-small-btn" onclick="copyText('sudo systemctl start tailscaled && sudo tailscale up', 'copyStartBtn')">Copy</button>
            </div>
          \`;
        } else if (isMac) {
          commandHtml = \`
            <div style="background: #050811; border: 1px solid #374151; border-radius: 8px; padding: 12px; font-size: 12px; color: #93c5fd; margin-bottom: 12px;">
              Open the <strong>Tailscale</strong> app from your Applications folder or Menu Bar and tap <strong>Connect</strong>.
            </div>
          \`;
        } else {
          commandHtml = \`
            <div style="background: #050811; border: 1px solid #374151; border-radius: 8px; padding: 12px; font-size: 12px; color: #93c5fd; margin-bottom: 12px;">
              Open <strong>Tailscale</strong> from your Start Menu or System Tray and sign in.
            </div>
          \`;
        }

        return \`
          <div class="guide-card">
            <div class="guide-header">
              <span>🟡</span>
              <span>Tailscale is Stopped / Logged Out</span>
            </div>
            <div class="guide-desc">
              Tailscale is installed on this PC, but the service is currently not active or signed in.
            </div>
            \${commandHtml}
            <div class="guide-footer">
              ⚡ As soon as Tailscale connects, this card will automatically flip to your QR code!
            </div>
          </div>
        \`;
      } else {
        // not_installed
        let installCmd = 'curl -fsSL https://tailscale.com/install.sh | sh';
        if (isMac) installCmd = 'brew install --cask tailscale';
        else if (!isLinux) installCmd = 'https://tailscale.com/download';

        let installHtml = '';
        if (isLinux || isMac) {
          installHtml = \`
            <div class="code-box">
              <span class="code-text" id="instCmd">\${installCmd}</span>
              <button id="copyInstBtn" class="copy-small-btn" onclick="copyText('\${installCmd}', 'copyInstBtn')">Copy</button>
            </div>
          \`;
        }

        return \`
          <div class="guide-card">
            <div class="guide-header">
              <span>⚪</span>
              <span>Tailscale Not Installed</span>
            </div>
            <div class="guide-desc">
              Tailscale connects your phone to your PC over 5G with a direct peer-to-peer tunnel and native Let's Encrypt certificates.
            </div>
            \${installHtml}
            <a href="https://tailscale.com/download" target="_blank" class="btn-action">
              🌐 Download Tailscale for \${isLinux ? 'Linux' : (isMac ? 'macOS' : 'Windows')} &rarr;
            </a>
            <div class="guide-footer">
              Free for personal use &bull; No port forwarding needed
            </div>
          </div>
        \`;
      }
    };

    const updateUI = () => {
      const isTailscale = state.mode === 'tailscale';
      document.getElementById('tabLocal').className = 'tab-btn ' + (!isTailscale ? 'active' : '');
      document.getElementById('tabTailscale').className = 'tab-btn ' + (isTailscale ? 'active' : '');

      const mainContent = document.getElementById('mainContent');

      if (isTailscale && state.tailscaleState !== 'connected') {
        mainContent.innerHTML = renderTailscaleGuide();
      } else {
        const activeUrl = isTailscale ? state.tailscaleUrl : state.localUrl;
        const activeQr = isTailscale ? state.tailscaleQrSvg : state.localQrSvg;

        mainContent.innerHTML = \`
          <div class="qr-container" id="qrWrapper">\${activeQr || '<div style="color: #6b7280; padding: 20px;">Generating QR code...</div>'}</div>
          <div class="link-section">
            <span class="link-label">Direct Mobile Connection Link:</span>
            <div class="link-box">
              <input type="text" id="directLinkInput" class="link-input" readonly value="\${activeUrl || 'Unavailable'}" />
              <button id="copyBtn" class="copy-btn" onclick="copyLink()">Copy</button>
            </div>
          </div>
        \`;
      }

      const statusPill = document.getElementById('statusPill');
      const statusText = document.getElementById('statusText');
      if (state.ideOnline) {
        statusPill.className = 'status-pill online';
        statusText.innerText = 'IDE Connected :' + state.idePort;
      } else {
        statusPill.className = 'status-pill';
        statusText.innerText = 'IDE Offline';
      }

      const tipText = document.getElementById('tipText');
      if (isTailscale) {
        if (state.tailscaleState === 'connected') {
          tipText.innerHTML = '🔒 MagicDNS Active: Trusted globally via Let\\'s Encrypt TLS.';
        } else {
          tipText.innerHTML = '🌍 Tailscale allows instant, secure coding over 5G anywhere in the world.';
        }
      } else {
        tipText.innerHTML = '⚠️ Wi-Fi: If your browser says "Not Secure", tap <strong>Advanced &rarr; Proceed</strong>. <br><a href="/api/ca.pem" download style="display:inline-block;margin-top:8px;font-size:11px;color:#60a5fa;text-decoration:underline;">📲 Download Root CA for Phone</a>';
      }
    };

    const setMode = (mode) => {
      state.mode = mode;
      updateUI();
    };

    const copyLink = () => {
      const input = document.getElementById('directLinkInput');
      if (!input) return;
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        const btn = document.getElementById('copyBtn');
        if (btn) {
          btn.innerText = 'Copied!';
          btn.className = 'copy-btn copied';
          setTimeout(() => {
            btn.innerText = 'Copy';
            btn.className = 'copy-btn';
          }, 2000);
        }
      });
    };

    const pollStatus = () => {
      fetch('/api/dashboard/status')
        .then(res => res.json())
        .then(data => {
          state.localUrl = data.localUrl;
          state.tailscaleUrl = data.tailscaleUrl;
          state.localQrSvg = data.localQrSvg;
          state.tailscaleQrSvg = data.tailscaleQrSvg;
          state.tailscaleAvailable = data.tailscaleAvailable;
          state.tailscaleState = data.tailscaleState || (data.tailscaleAvailable ? 'connected' : 'stopped');
          state.tailscaleDns = data.tailscaleDns;
          state.platform = data.platform || 'linux';
          state.ideOnline = data.ideOnline;
          state.idePort = data.idePort;
          updateUI();
        })
        .catch(() => {});
    };

    pollStatus();
    setInterval(pollStatus, 1500);
  </script>
</body>
</html>`;

module.exports = {
  generateQrSvg,
  getDashboardHtml
};
