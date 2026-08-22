const QRCode = require('qrcode');

/**
 * Generates an SVG string representation of a QR code using vector paths.
 * 
 * @param {string} text - Payload to encode
 * @returns {string} SVG markup string
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
          path += `M${c} ${r}h1v1h-1z `;
        }
      }
    }
    
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" style="width: 100%; height: 100%; display: block;"><path fill="#0f172a" d="${path}"/></svg>`;
  } catch (err) {
    return '';
  }
};

/**
 * Generates the clean, minimal, elegant light-themed Desktop Control Panel HTML document.
 * 
 * @returns {string} HTML document
 */
const getDashboardHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ultimatter Control Panel</title>
  <link rel="icon" type="image/svg+xml" href="/icon.svg">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "SF Pro Text", Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02);
      max-width: 460px;
      width: 100%;
      padding: 26px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo-svg {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
      flex-shrink: 0;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .status-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      transition: all 0.2s;
    }
    .status-pill.online {
      background: #ecfdf5;
      color: #059669;
      border-color: #a7f3d0;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #dc2626;
      transition: all 0.2s;
    }
    .status-pill.online .status-dot {
      background: #059669;
      box-shadow: 0 0 6px rgba(5, 150, 105, 0.4);
    }
    .security-toolbar {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 12px;
      margin-bottom: 16px;
    }
    .security-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .switch-track {
      width: 32px;
      height: 18px;
      background: #cbd5e1;
      border-radius: 10px;
      position: relative;
      transition: background 0.25s;
    }
    .switch-track.on {
      background: #10b981;
    }
    .switch-thumb {
      width: 14px;
      height: 14px;
      background: #ffffff;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 0.25s;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    }
    .switch-track.on .switch-thumb {
      transform: translateX(14px);
    }
    .security-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .unban-btn {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .unban-btn:hover {
      background: #fee2e2;
      border-color: #ef4444;
    }
    .reset-token-btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .reset-token-btn:hover {
      border-color: #ef4444;
      color: #dc2626;
      background: #fef2f2;
    }
    .reset-token-btn.quit {
      color: #dc2626;
      border-color: #fecaca;
      background: #fef2f2;
    }
    .reset-token-btn.quit:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #b91c1c;
    }
    .mode-tabs {
      width: 100%;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 10px;
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
    }
    .tab-btn {
      flex: 1;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
      padding: 8px 12px;
      border-radius: 7px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .tab-btn.active {
      background: #ffffff;
      color: #0f172a;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .sub-tabs {
      display: flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
      gap: 3px;
      margin-bottom: 12px;
      width: 100%;
    }
    .sub-tab-btn {
      flex: 1;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 11px;
      font-weight: 600;
      padding: 5px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    .sub-tab-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }
    .qr-container {
      width: 210px;
      height: 210px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      margin: 0 auto 14px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    .domain-bar {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 12px;
      font-size: 12px;
      color: #475569;
    }
    .domain-name {
      color: #0284c7;
      font-weight: 600;
      font-family: ui-monospace, monospace;
    }
    .edit-btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155;
      border-radius: 5px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .edit-btn:hover {
      border-color: #0284c7;
      color: #0284c7;
      background: #f0f9ff;
    }
    .link-section {
      width: 100%;
      margin-bottom: 12px;
    }
    .link-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 6px;
      display: block;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .link-box {
      display: flex;
      gap: 6px;
    }
    .link-input {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 12px;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      color: #0f172a;
      outline: none;
      transition: border-color 0.2s;
    }
    .link-input:focus {
      border-color: #0284c7;
      background: #ffffff;
    }
    .copy-btn {
      background: #0284c7;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 9px 16px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .copy-btn:hover { background: #0369a1; }
    .copy-btn.copied { background: #059669; }
    .copy-btn.secondary {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .copy-btn.secondary:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .copy-btn.secondary.copied {
      background: #059669;
      color: #ffffff;
      border-color: #059669;
    }
    .peer-card {
      width: 100%;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 12px;
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
      color: #1e293b;
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
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .peer-badge.relay {
      background: #fefce8;
      color: #ca8a04;
      border: 1px solid #fef08a;
    }
    .peer-tip {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
      background: #ffffff;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #ca8a04;
    }
    .platform-notice {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      margin-top: 10px;
      font-size: 11px;
      line-height: 1.5;
      color: #475569;
      text-align: left;
    }
    .platform-notice strong {
      color: #1e293b;
    }
    .guide-card {
      width: 100%;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 16px;
      text-align: center;
      margin-bottom: 14px;
    }
    .guide-header {
      font-weight: 600;
      color: #0f172a;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .guide-desc {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 14px;
    }
    .code-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 12px;
      text-align: left;
    }
    .code-text {
      font-family: ui-monospace, monospace;
      font-size: 11px;
      color: #0f172a;
      overflow-x: auto;
      white-space: nowrap;
    }
    .copy-small-btn {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #334155;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .copy-small-btn:hover { background: #e2e8f0; }
    .btn-action {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: background 0.2s;
    }
    .btn-action:hover { background: #0369a1; }
    .info-footer {
      width: 100%;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
      margin-top: 6px;
    }
    .badge-tip-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      margin-top: 10px;
    }
    .badge-item {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
    }
    .agents-quick-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: flex-start;
      margin-bottom: 12px;
      padding: 0 2px;
    }
    .agent-chip {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
      cursor: pointer;
      transition: all 0.2s;
    }
    .agent-chip:hover {
      background: #dcfce7;
      border-color: #86efac;
    }
    .ipv6-badge {
      font-size: 10px;
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      padding: 1px 6px;
      border-radius: 10px;
      font-weight: 600;
      margin-left: 4px;
    }
    .smart-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      text-align: left;
      margin-top: 12px;
      width: 100%;
    }
    .smart-header {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 10px;
      letter-spacing: -0.2px;
    }
    .smart-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .smart-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .smart-item-icon {
      font-size: 18px;
      line-height: 1.2;
      flex-shrink: 0;
    }
    .smart-item-text {
      flex: 1;
      min-width: 0;
    }
    .smart-item-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .smart-item-desc {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
      margin-top: 2px;
    }
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 12px;
      width: 100%;
      max-width: 440px;
      padding: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      border: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      gap: 14px;
      text-align: left;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 18px;
      color: #64748b;
      cursor: pointer;
      line-height: 1;
    }
    .modal-desc {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    .agents-modal-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 260px;
      overflow-y: auto;
    }
    .agent-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .agent-item-row.online {
      border-color: #bae6fd;
      background: #f0f9ff;
    }
    .agent-item-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .agent-item-icon {
      font-size: 20px;
    }
    .agent-item-name {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
    .agent-item-sub {
      font-size: 11px;
      color: #64748b;
    }
    .agent-status-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 12px;
    }
    .agent-status-badge.online {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .agent-status-badge.offline {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
    }
    .modal-btn-primary {
      background: #0284c7;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 7px 16px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">
        <svg class="brand-logo-svg" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="brandBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f172a" />
              <stop offset="100%" stop-color="#020617" />
            </linearGradient>
            <linearGradient id="brandGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#818cf8" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" rx="128" fill="url(#brandBg)" />
          <circle cx="256" cy="256" r="180" fill="none" stroke="url(#brandGlow)" stroke-width="12" stroke-dasharray="24 16" opacity="0.4" />
          <g transform="translate(106, 106) scale(0.58)">
            <path fill="url(#brandGlow)" d="M256 0c141.385 0 256 114.615 256 256S397.385 512 256 512 0 397.385 0 256 114.615 0 256 0z" opacity="0.05" />
            <path fill="#ffffff" d="M472.9 44.5c-4.2-4.1-10.2-5.9-16-4.7-65.7 13.6-136.2 55.4-198.8 118-47.5 47.5-84.8 104.9-108.4 167.3-8.8 23.3-13.6 47.7-14.3 72.3-27.1 11.2-48.4 33.7-58.1 62.7-2.6 7.7 2.1 15.9 10 17.5 13.9 2.8 28.5 1.5 42.1-3.6 15.4 17.9 37.6 29.5 62 31.9 2.5.3 5-.5 7.1-2 2-1.5 3.3-3.7 3.8-6.2 3.5-17.7 1.4-36.2-6.1-52.6 22.9-.6 45.6-5.1 67.3-13.3 62.4-23.6 119.8-60.9 167.3-108.4 62.6-62.6 104.4-133.1 118-198.8 1.2-5.8-.6-11.8-4.7-16-1.5-1.5-3.3-2.7-5.3-3.6zM288 176c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32z"/>
          </g>
        </svg>
        <div>
          <div class="brand-title">Ultimatter</div>
          <div class="brand-sub">Universal AI Gateway</div>
        </div>
      </div>
      <div id="statusPill" class="status-pill" onclick="openAgentsModal()" style="cursor:pointer;" title="Click to view and switch connected AI agents">
        <span class="status-dot"></span>
        <span id="statusText">Agent Offline</span>
      </div>
    </div>

    <!-- Active Agents Quick Chips -->
    <div id="activeAgentsBar" class="agents-quick-bar" style="display:none;"></div>

    <!-- Security Control Bar -->
    <div class="security-toolbar">
      <div class="security-toggle" onclick="toggleTailscale()" title="Click to toggle Remote Access">
        <div id="switchTrack" class="switch-track on">
          <div class="switch-thumb"></div>
        </div>
        <span id="remoteToggleText">Remote Access: ON</span>
      </div>
      <div id="securityActions" class="security-actions">
        <button id="agentsModalBtn" class="reset-token-btn" onclick="openAgentsModal()" title="View supported AI agents">
          🤖 Agents (<span id="agentsCountText">0</span>)
        </button>
        <button id="resetTokenBtn" class="reset-token-btn" onclick="promptResetToken()" title="Regenerate token & revoke all connected devices">
          🔄 Reset Token
        </button>
        <button id="quitAppBtn" class="reset-token-btn quit" onclick="promptQuitApp()" title="Shut down Ultimatter and stop all background services">
          🛑 Quit
        </button>
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
        <span class="link-label">Direct Mobile Connection Link & Token</span>
        <div class="link-box">
          <input type="text" id="directLinkInput" class="link-input" readonly value="Loading..." />
          <button id="copyBtn" class="copy-btn" onclick="copyLink()" title="Copy clean mobile connection URL">Copy Link</button>
          <button id="copyTokenBtn" class="copy-btn secondary" onclick="copyToken()" title="Copy 64-character pairing token only">🔑 Token</button>
        </div>
      </div>
    </div>

    <!-- Smart Diagnostics & Assistant Card -->
    <div id="smartAssistantCard" class="smart-card" style="display:none;"></div>

    <div class="info-footer">
      <div id="tipText">Scan this QR code with your phone camera or browser to connect instantly.</div>
      <div class="badge-tip-row">
        <span class="badge-item">⚡ HTTP/2 Multiplexed</span>
        <span class="badge-item">🔒 256-Bit Auth</span>
        <a id="versionBadge" href="https://github.com/saifmukhtar/ultimatter/releases" target="_blank" class="badge-item" style="text-decoration:none;font-weight:600;color:#64748b;" title="View releases on GitHub">v1.0.0</a>
      </div>
    </div>
  </div>

  <!-- Agents Manager Modal -->
  <div id="agentsModal" class="modal-backdrop" style="display:none;" onclick="closeAgentsModal(event)">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div class="modal-title">🤖 AI Agent Manager</div>
        <button class="modal-close" onclick="closeAgentsModal()">✕</button>
      </div>
      <div class="modal-desc">
        Ultimatter automatically detects active AI coding agents on your machine. You can connect and switch between them from your phone via the <strong>Ultimatter Hub</strong>.
      </div>
      <div id="agentsModalList" class="agents-modal-list"></div>
      <div class="modal-footer">
        <button class="modal-btn-primary" onclick="closeAgentsModal()">Done</button>
      </div>
    </div>
  </div>

  <script>
    let state = {
      mode: 'local',
      localSubMode: 'ip', // 'ip' or 'domain'
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
      bannedCount: 0,
      platform: 'linux',
      ideOnline: false,
      idePort: null,
      agentName: null,
      agents: [],
      activeCount: 0
    };

    const openAgentsModal = () => {
      const modal = document.getElementById('agentsModal');
      if (modal) modal.style.display = 'flex';
      renderAgentsModalList();
    };

    const closeAgentsModal = () => {
      const modal = document.getElementById('agentsModal');
      if (modal) modal.style.display = 'none';
    };

    const renderAgentsModalList = () => {
      const list = document.getElementById('agentsModalList');
      if (!list) return;
      if (!state.agents || state.agents.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:12px;color:#8b949e;font-size:12px;">Scanning for agents...</div>';
        return;
      }
      list.innerHTML = state.agents.map(function(a) {
        var isOnline = a.online;
        return '<div class="agent-item-row ' + (isOnline ? 'online' : '') + '">' +
          '<div class="agent-item-left">' +
            '<div class="agent-item-icon">' + (a.icon || '🤖') + '</div>' +
            '<div>' +
              '<div class="agent-item-name">' + a.name + '</div>' +
              '<div class="agent-item-sub">' + (isOnline ? ('Listening on port ' + a.port) : (a.description || 'Offline')) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="agent-status-badge ' + (isOnline ? 'online' : 'offline') + '">' +
            (isOnline ? '🟢 Online' : '⚪ Offline') +
          '</div>' +
        '</div>';
      }).join('');
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

    const unbanAllIps = () => {
      fetch('/api/dashboard/unban', { method: 'POST' })
        .then(res => res.json())
        .then(() => {
          pollStatus();
        })
        .catch(() => {});
    };

    const promptResetToken = () => {
      if (confirm("⚠️ Revoke All Sessions & Reset Token?\\n\\nThis will instantly disconnect all active phones until they scan the new QR code.")) {
        fetch('/api/dashboard/reset-token', { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            pollStatus();
          })
          .catch(() => {});
      }
    };

    const promptQuitApp = () => {
      if (confirm("🛑 Stop Ultimatter & Quit?\\n\\nThis will stop all background gateway bridges and close the application.")) {
        document.body.innerHTML = \`
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;padding:24px;">
            <div style="font-size:36px;margin-bottom:12px;">🛑</div>
            <h2 style="font-size:18px;margin-bottom:6px;font-weight:700;">Ultimatter Stopped</h2>
            <p style="font-size:13px;color:#94a3b8;line-height:1.5;">All background services have been safely shut down.</p>
          </div>
        \`;
        if (window.ipc && window.ipc.postMessage) {
          try { window.ipc.postMessage('quit'); } catch (e) {}
        }
        fetch('/api/dashboard/shutdown', { method: 'POST' }).catch(() => {});
        setTimeout(() => { window.close(); }, 400);
      }
    };

    const setLocalSubMode = (sub) => {
      state.localSubMode = sub;
      updateUI();
    };

    const promptEditDomain = () => {
      const current = state.localDomain ? state.localDomain.replace(/\\.local$/, '') : 'ultramarine';
      const input = prompt("Enter custom local hostname (e.g. saif-pc, code, antimatter):", current);
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
      const isWin = state.platform === 'win32';

      if (state.tailscaleState === 'stopped') {
        let commandHtml = '';
        if (isLinux || isMac) {
          const upCmd = 'sudo tailscale up';
          commandHtml = \`
            <div class="code-box">
              <span class="code-text" id="startCmd">\${upCmd}</span>
              <button id="copyStartBtn" class="copy-small-btn" onclick="copyText('\${upCmd}', 'copyStartBtn')">Copy</button>
            </div>
          \`;
        } else {
          commandHtml = \`
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; font-size: 12px; color: #334155; margin-bottom: 12px;">
              Open <strong>Tailscale</strong> from the Windows system tray or Start Menu and sign in.
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
            <div style="font-size: 11px; color: #64748b;">
              ⚡ As soon as Tailscale connects, this card will automatically flip to your QR code!
            </div>
          </div>
        \`;
      } else {
        // not_installed
        let installCmd = 'curl -fsSL https://tailscale.com/install.sh | sh';
        if (isMac) installCmd = 'brew install tailscale';
        
        let installHtml = '';
        if (isLinux || isMac) {
          installHtml = \`
            <div class="code-box">
              <span class="code-text" id="instCmd">\${installCmd}</span>
              <button id="copyInstBtn" class="copy-small-btn" onclick="copyText('\${installCmd}', 'copyInstBtn')">Copy</button>
            </div>
          \`;
        } else {
          installHtml = \`
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; font-size: 12px; color: #334155; margin-bottom: 12px;">
              Install <strong>Tailscale</strong> from the <strong>Microsoft Store</strong> or official installer.
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
          </div>
        \`;
      }
    };

    const updateUI = () => {
      const isTailscale = state.mode === 'tailscale';
      document.getElementById('tabLocal').className = 'tab-btn ' + (!isTailscale ? 'active' : '');
      document.getElementById('tabTailscale').className = 'tab-btn ' + (isTailscale ? 'active' : '');

      const switchTrack = document.getElementById('switchTrack');
      const toggleText = document.getElementById('remoteToggleText');
      if (switchTrack && toggleText) {
        switchTrack.className = 'switch-track ' + (state.allowTailscale ? 'on' : 'off');
        toggleText.innerText = state.allowTailscale ? 'Remote Access: ON' : 'Remote Access: OFF (LAN Only)';
      }

      const securityActions = document.getElementById('securityActions');
      if (securityActions) {
        let unbanHtml = '';
        if (state.bannedCount > 0) {
          unbanHtml = \`<button class="unban-btn" onclick="unbanAllIps()" title="Unban all locked devices">🔓 Unban (\${state.bannedCount})</button>\`;
        }
        securityActions.innerHTML = \`\${unbanHtml}<button id="resetTokenBtn" class="reset-token-btn" onclick="promptResetToken()" title="Regenerate token & revoke all connected devices">🔄 Reset Token</button>\`;
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
        const isDomain = !isTailscale && state.localSubMode === 'domain';
        const activeUrl = isTailscale ? state.tailscaleUrl : (isDomain ? (state.localDomainUrl || state.localUrl) : state.localUrl);
        const activeQr = isTailscale ? state.tailscaleQrSvg : (isDomain ? (state.localDomainQrSvg || state.localQrSvg) : state.localQrSvg);

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

        let localSubTabsHtml = '';
        let domainDetailsHtml = '';
        if (!isTailscale) {
          localSubTabsHtml = \`
            <div class="sub-tabs">
              <button class="sub-tab-btn \${state.localSubMode === 'ip' ? 'active' : ''}" onclick="setLocalSubMode('ip')">
                📍 Direct IP (Universal)
              </button>
              <button class="sub-tab-btn \${state.localSubMode === 'domain' ? 'active' : ''}" onclick="setLocalSubMode('domain')">
                🏷️ .local Domain
              </button>
            </div>
          \`;

          if (isDomain) {
            domainDetailsHtml = \`
              <div class="domain-bar">
                <span>🏠 Local Domain: <strong class="domain-name">\${state.localDomain || 'ultramarine.local'}</strong></span>
                <button class="edit-btn" onclick="promptEditDomain()">✏️ Rename</button>
              </div>
              <div class="platform-notice">
                <div>🍏 <strong>Apple (iOS / Mac):</strong> Works out-of-the-box via Bonjour.</div>
                <div style="margin-top: 4px;">🤖 <strong>Android:</strong> Requires <strong>Settings &rarr; Private DNS &rarr; Off</strong> (or switch to Direct IP above).</div>
              </div>
            \`;
          }
        }

        mainContent.innerHTML = \`
          \${localSubTabsHtml}
          <div class="qr-container" id="qrWrapper">\${activeQr || '<div style="color: #64748b; padding: 20px; font-size: 13px;">Generating QR code...</div>'}</div>
          <div class="link-section">
            <span class="link-label">Direct Mobile Connection Link</span>
            <div class="link-box">
              <input type="text" id="directLinkInput" class="link-input" readonly value="\${activeUrl || 'Unavailable'}" />
              <button id="copyBtn" class="copy-btn" onclick="copyLink()">Copy</button>
            </div>
          </div>
          \${domainDetailsHtml}
          \${peerSectionHtml}
        \`;
      }

      const statusPill = document.getElementById('statusPill');
      const statusText = document.getElementById('statusText');
      if (state.activeCount > 1) {
        statusPill.className = 'status-pill online';
        statusText.innerText = state.activeCount + ' Agents Active';
      } else if (state.ideOnline) {
        statusPill.className = 'status-pill online';
        statusText.innerText = (state.agentName || 'Agent') + ' Connected :' + state.idePort;
      } else {
        statusPill.className = 'status-pill';
        statusText.innerText = 'Agents Offline';
      }

      const activeAgents = (state.agents || []).filter(function(a) { return a.online; });
      const agentsBar = document.getElementById('activeAgentsBar');
      if (agentsBar) {
        if (activeAgents.length > 0) {
          agentsBar.style.display = 'flex';
          agentsBar.innerHTML = activeAgents.map(function(a) {
            return '<span class="agent-chip" onclick="openAgentsModal()">' + (a.icon || '🤖') + ' ' + (a.shortName || a.name) + ' (:' + a.port + ')</span>';
          }).join('');
        } else {
          agentsBar.style.display = 'none';
        }
      }

      const bubbleTrack = document.getElementById('bubbleSwitchTrack');
      if (bubbleTrack) {
        bubbleTrack.className = state.mobileBubbleEnabled ? 'switch-track on' : 'switch-track';
      }

      const vBadge = document.getElementById('versionBadge');
      if (vBadge && state.versionInfo) {
        if (state.versionInfo.hasUpdate) {
          vBadge.innerHTML = '⬆️ v' + state.versionInfo.latestVersion + ' Available';
          vBadge.style.background = '#e0f2fe';
          vBadge.style.color = '#0369a1';
          vBadge.style.border = '1px solid #7dd3fc';
        } else {
          vBadge.innerHTML = 'v' + (state.versionInfo.currentVersion || '1.0.0');
          vBadge.style.background = '#f1f5f9';
          vBadge.style.color = '#64748b';
          vBadge.style.border = '1px solid #e2e8f0';
        }
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
        tipText.innerHTML = '📱 <strong>Standalone PWA Ready:</strong> Tap "Add to Home Screen" to install as a full-screen app.<br><a href="/api/ca.pem" download="rootCA.pem" style="display:inline-block;margin-top:6px;font-size:11px;color:#0284c7;text-decoration:underline;">📲 Download Root CA for Phone (rootCA.pem)</a>';
      }

      // Render Smart Diagnostics & Quick Start Card
      const smartCard = document.getElementById('smartAssistantCard');
      if (smartCard) {
        if (activeAgents.length === 0) {
          smartCard.style.display = 'block';
          smartCard.innerHTML = \`
            <div class="smart-header">
              <span>💡</span>
              <span>Smart Quick Start & Diagnostics</span>
            </div>
            <div class="smart-body">
              <div class="smart-item">
                <span class="smart-item-icon">🛸</span>
                <div class="smart-item-text">
                  <strong>Google Antigravity:</strong> Launch Google Antigravity on your PC to auto-connect.
                </div>
              </div>
              <div class="smart-item">
                <span class="smart-item-icon">👐</span>
                <div class="smart-item-text">
                  <strong>OpenCode:</strong> Start OpenCode web in terminal: <code class="smart-code">opencode web</code>
                </div>
              </div>
              <div class="smart-item">
                <span class="smart-item-icon">🧠</span>
                <div class="smart-item-text">
                  <strong>Claude Code:</strong> Start Claude Code UI in terminal: <code class="smart-code">cloudcli</code>
                </div>
              </div>
            </div>
          \`;
        } else {
          smartCard.style.display = 'none';
        }
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
            btn.innerText = 'Copy Link';
            btn.className = 'copy-btn';
          }, 2000);
        }
      });
    };

    const copyToken = () => {
      if (!state.token) return;
      navigator.clipboard.writeText(state.token).then(() => {
        const btn = document.getElementById('copyTokenBtn');
        if (btn) {
          btn.innerText = 'Copied!';
          btn.className = 'copy-btn secondary copied';
          setTimeout(() => {
            btn.innerText = '🔑 Token';
            btn.className = 'copy-btn secondary';
          }, 2000);
        }
      });
    };

    const pollStatus = () => {
      fetch('/api/dashboard/status')
        .then(res => res.json())
        .then(data => {
          state.token = data.token || '';
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
          state.versionInfo = data.versionInfo || null;
          state.bannedCount = data.bannedCount || 0;
          state.platform = data.platform || 'linux';
          state.ideOnline = data.ideOnline;
          state.idePort = data.idePort;
          state.agentName = data.agentName || null;
          state.agents = data.agents || [];
          state.activeCount = data.activeCount || (data.ideOnline ? 1 : 0);
          
          const countEl = document.getElementById('agentsCountText');
          if (countEl) countEl.innerText = state.activeCount;
          renderAgentsModalList();
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
