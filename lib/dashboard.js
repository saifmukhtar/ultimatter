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
    .peer-card {
      width: 100%;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      text-align: left;
    }
    .peer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
    }
    .peer-name {
      font-weight: 600;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .peer-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .peer-badge.direct {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }
    .peer-badge.relay {
      background: rgba(234, 179, 8, 0.15);
      color: #fde047;
      border: 1px solid rgba(234, 179, 8, 0.3);
    }
    .peer-tip {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.4;
      background: rgba(0, 0, 0, 0.2);
      padding: 6px 8px;
      border-radius: 4px;
      border-left: 2px solid #eab308;
    }
    .ipv6-badge {
      font-size: 10px;
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 1px 6px;
      border-radius: 10px;
    }
    .security-toolbar {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid #1f2937;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 14px;
    }
    .security-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 600;
      color: #cbd5e1;
      cursor: pointer;
      user-select: none;
      transition: opacity 0.2s;
    }
    .security-toggle:hover { opacity: 0.85; }
    .toggle-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      transition: all 0.3s;
    }
    .toggle-dot.on {
      background: #22c55e;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
    }
    .toggle-dot.off {
      background: #ef4444;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
    }
    .reset-token-btn {
      background: transparent;
      border: 1px solid #374151;
      color: #94a3b8;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .reset-token-btn:hover {
      border-color: #ef4444;
      color: #f87171;
      background: rgba(239, 68, 68, 0.1);
    }
    .domain-bar {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 8px 12px;
      margin-top: 10px;
      font-size: 11px;
      color: #94a3b8;
    }
    .domain-name {
      color: #38bdf8;
      font-weight: 600;
      font-family: monospace;
    }
    .edit-btn {
      background: transparent;
      border: 1px solid #334155;
      color: #cbd5e1;
      border-radius: 4px;
      padding: 3px 8px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .edit-btn:hover {
      background: #1e293b;
      border-color: #38bdf8;
      color: #38bdf8;
    }
    .pwa-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(56, 189, 248, 0.1);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 12px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
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

    <!-- Security & Privacy Control Bar -->
    <div class="security-toolbar">
      <div class="security-toggle" onclick="toggleTailscale()" title="Click to toggle Remote Access on/off">
        <span id="remoteToggleDot" class="toggle-dot on"></span>
        <span id="remoteToggleText">Remote Access: ON</span>
      </div>
      <button id="resetTokenBtn" class="reset-token-btn" onclick="promptResetToken()" title="Regenerate token & revoke all connected devices">
        🔄 Reset Token
      </button>
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
      localDomain: '',
      localDomainUrl: '',
      localQrSvg: '',
      localDomainQrSvg: '',
      tailscaleUrl: '',
      tailscaleQrSvg: '',
      tailscaleAvailable: false,
      tailscaleState: 'stopped', // 'connected' | 'stopped' | 'not_installed'
      tailscaleDns: '',
      tailscaleIpv4: '',
      tailscaleIpv6: '',
      localIpv6: '',
      peers: [],
      allowTailscale: true,
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

    const toggleTailscale = () => {
      const nextState = !state.allowTailscale;
      fetch('/api/dashboard/toggle-tailscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowTailscale: nextState })
      })
      .then(res => res.json())
      .then(data => {
        state.allowTailscale = data.allowTailscale;
        updateUI();
      })
      .catch(() => {});
    };

    const promptResetToken = () => {
      if (confirm('⚠️ Revoke All Sessions & Reset Token?\\n\\nThis will instantly disconnect all active phones until they scan the new QR code.')) {
        fetch('/api/dashboard/reset-token', { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            pollStatus();
          })
          .catch(() => {});
      }
    };

    const promptEditDomain = () => {
      const current = state.localDomain ? state.localDomain.replace(/\\.local$/, '') : 'ultramarine';
      const input = prompt('Enter custom local hostname (e.g. saif-pc, code, antimatter):', current);
      if (input && input.trim()) {
        fetch('/api/dashboard/set-local-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: input.trim() })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            pollStatus();
          } else {
            alert('Error: ' + data.error);
          }
        })
        .catch(() => {});
      }
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

      const toggleDot = document.getElementById('remoteToggleDot');
      const toggleText = document.getElementById('remoteToggleText');
      if (toggleDot && toggleText) {
        toggleDot.className = 'toggle-dot ' + (state.allowTailscale ? 'on' : 'off');
        toggleText.innerText = state.allowTailscale ? 'Remote Access: ON' : 'Remote Access: OFF (LAN Only)';
      }

      const mainContent = document.getElementById('mainContent');

      if (isTailscale && !state.allowTailscale) {
        mainContent.innerHTML = \`
          <div class="guide-card">
            <div class="guide-header">
              <span>🔒</span>
              <span>Tailscale Remote Access is Paused</span>
            </div>
            <div class="guide-desc">
              Ultimatter is currently locked to Local LAN-Only Mode. Incoming Tailscale connections are blocked for privacy.
            </div>
            <button class="btn-action" onclick="toggleTailscale()">
              ▶️ Resume Remote Access
            </button>
          </div>
        \`;
      } else if (isTailscale && state.tailscaleState !== 'connected') {
        mainContent.innerHTML = renderTailscaleGuide();
      } else {
        const activeUrl = isTailscale ? state.tailscaleUrl : (state.localDomainUrl || state.localUrl);
        const activeQr = isTailscale ? state.tailscaleQrSvg : (state.localDomainQrSvg || state.localQrSvg);

        let peerSectionHtml = '';
        if (isTailscale && state.peers && state.peers.length > 0) {
          peerSectionHtml = state.peers.map(p => {
            const isDirect = p.mode === 'direct';
            return \`
              <div class="peer-card">
                <div class="peer-row">
                  <span class="peer-name">📱 \${p.hostName}</span>
                  <span class="peer-badge \${isDirect ? 'direct' : 'relay'}">
                    \${isDirect ? '⚡ Direct P2P (WireGuard)' : '☁️ Relay (' + (p.relay || 'DERP') + ')'}
                  </span>
                </div>
                \${!isDirect ? \`
                  <div class="peer-tip">
                    💡 <strong>Direct Speed Tip:</strong> Toggle Tailscale ON/OFF on your phone or ensure IPv6 is enabled on mobile data to switch to a direct 15ms P2P link.
                  </div>
                \` : ''}
              </div>
            \`;
          }).join('');
        }

        let domainBarHtml = '';
        if (!isTailscale) {
          domainBarHtml = \`
            <div class="domain-bar">
              <span>🏠 Local Domain: <strong class="domain-name">\${state.localDomain || 'ultramarine.local'}</strong></span>
              <button class="edit-btn" onclick="promptEditDomain()">✏️ Rename</button>
            </div>
          \`;
        }

        mainContent.innerHTML = \`
          <div class="qr-container" id="qrWrapper">\${activeQr || '<div style="color: #6b7280; padding: 20px;">Generating QR code...</div>'}</div>
          <div class="link-section">
            <span class="link-label">Direct Mobile Connection Link:</span>
            <div class="link-box">
              <input type="text" id="directLinkInput" class="link-input" readonly value="\${activeUrl || 'Unavailable'}" />
              <button id="copyBtn" class="copy-btn" onclick="copyLink()">Copy</button>
            </div>
          </div>
          \${domainBarHtml}
          \${peerSectionHtml}
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
        if (!state.allowTailscale) {
          tipText.innerHTML = '🔒 Remote Access is currently paused. Only local Wi-Fi devices can connect.';
        } else if (state.tailscaleState === 'connected') {
          tipText.innerHTML = "🔒 MagicDNS Active: Trusted globally via Let's Encrypt TLS." + (state.tailscaleIpv6 ? ' <span class="ipv6-badge">IPv6 Ready</span>' : '');
        } else {
          tipText.innerHTML = '🌍 Tailscale allows instant, secure coding over 5G anywhere in the world.';
        }
      } else {
        tipText.innerHTML = '📱 <strong>Standalone PWA Ready:</strong> Tap "Add to Home Screen" to install as a full-screen app.<br><a href="/api/ca.pem" download style="display:inline-block;margin-top:8px;font-size:11px;color:#60a5fa;text-decoration:underline;">📲 Download Root CA for Phone</a>';
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
          state.localDomain = data.localDomain || '';
          state.localDomainUrl = data.localDomainUrl || '';
          state.localDomainQrSvg = data.localDomainQrSvg || '';
          state.tailscaleUrl = data.tailscaleUrl;
          state.localQrSvg = data.localQrSvg;
          state.tailscaleQrSvg = data.tailscaleQrSvg;
          state.tailscaleAvailable = data.tailscaleAvailable;
          state.tailscaleState = data.tailscaleState || (data.tailscaleAvailable ? 'connected' : 'stopped');
          state.tailscaleDns = data.tailscaleDns;
          state.tailscaleIpv4 = data.tailscaleIpv4 || '';
          state.tailscaleIpv6 = data.tailscaleIpv6 || '';
          state.localIpv6 = data.localIpv6 || '';
          state.peers = data.peers || [];
          state.allowTailscale = (data.allowTailscale !== false);
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
