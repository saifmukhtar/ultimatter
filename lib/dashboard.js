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
    @keyframes slideUpFade {
      0% { opacity: 0; transform: translateY(16px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.08), 0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
      max-width: 460px;
      width: 100%;
      padding: 26px;
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      user-select: none;
    }
    .status-pill:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    .status-pill:active {
      transform: translateY(0);
    }
    .status-pill.online {
      background: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #94a3b8;
      transition: all 0.2s;
    }
    .status-pill.online .status-dot {
      background: #10b981;
      box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
    }
    .pill-chevron {
      font-size: 14px;
      line-height: 1;
      opacity: 0.6;
      margin-left: 1px;
      font-weight: 700;
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
      background: #f1f5f9;
      border: none;
      color: #475569;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .reset-token-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .reset-token-btn.quit {
      color: #dc2626;
      background: #fee2e2;
    }
    .reset-token-btn.quit:hover {
      background: #fecaca;
      color: #b91c1c;
    }
    .mode-tabs {
      width: 100%;
      background: #e2e8f0;
      padding: 4px;
      border-radius: 12px;
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
    }
    .tab-btn {
      flex: 1;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 12px;
      font-weight: 600;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .tab-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08), 0 1px 1px rgba(0, 0, 0, 0.04);
    }
    .sub-tabs {
      display: flex;
      background: #e2e8f0;
      padding: 4px;
      border-radius: 10px;
      gap: 4px;
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
      padding: 6px 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: center;
    }
    .sub-tab-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 1px rgba(0, 0, 0, 0.04);
    }
    .qr-container {
      width: 190px;
      height: 190px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: inset 0 0 0 1px #e2e8f0, 0 8px 16px -4px rgba(0,0,0,0.05);
      padding: 16px;
      margin: 0 auto 16px auto;
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
      background: #f1f5f9;
      border-radius: 10px;
      padding: 4px;
      align-items: center;
    }
    .link-input {
      flex: 1;
      background: transparent;
      border: none;
      padding: 8px 10px;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      color: #0f172a;
      outline: none;
    }
    button:active {
      transform: scale(0.95);
    }
    .copy-btn {
      background: #0f172a;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
    }
    .copy-btn:hover { 
      background: #1e293b; 
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .github-star-btn:hover {
      border-color: #0284c7 !important;
      color: #0284c7 !important;
      background: #f0f9ff !important;
      box-shadow: 0 4px 10px rgba(2,132,199,0.15) !important;
    }
    .copy-btn.copied { 
      background: #059669;
      box-shadow: none;
    }
    .copy-btn.secondary {
      background: transparent;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .copy-btn.secondary:hover {
      background: #f1f5f9;
      color: #0f172a;
      box-shadow: none;
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
      border-radius: 20px;
      width: 100%;
      max-width: 440px;
      padding: 24px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06);
      border: 1px solid rgba(255,255,255,0.4);
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: left;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    .modal-close {
      background: transparent;
      border: none;
      font-size: 16px;
      color: #94a3b8;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .modal-close:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .modal-desc {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    .agents-modal-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 280px;
      overflow-y: auto;
    }
    .agent-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .agent-item-row:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      transform: translateY(-1px);
    }
    .agent-item-row:active {
      transform: scale(0.98);
      background: #f8fafc;
    }
    .agent-item-row.online {
      border-color: #bae6fd;
      background: #f0f9ff;
    }
    .agent-item-row.online:hover {
      border-color: #7dd3fc;
      background: #e0f2fe;
    }
    .agent-item-left {
      display: flex;
      align-items: center;
      gap: 12px;
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
      padding: 4px 10px;
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
      margin-top: 4px;
    }
    .modal-btn-primary {
      background: #0f172a;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s;
    }
    .modal-btn-primary:hover {
      background: #1e293b;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    /* === Tutorial Overlay === */
    .tut-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(2px);
      z-index: 8000;
      animation: tutFadeIn 0.3s ease;
    }
    @keyframes tutFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .tut-spotlight {
      position: fixed;
      z-index: 8001;
      border-radius: 10px;
      box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.72), 0 0 0 3px rgba(255,255,255,0.6);
      pointer-events: none;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .tut-popover {
      position: fixed;
      background: #ffffff;
      border-radius: 16px;
      padding: 20px 22px;
      width: 260px;
      z-index: 8002;
      box-shadow: 0 24px 48px rgba(0,0,0,0.18);
      animation: tutPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes tutPopIn {
      from { opacity: 0; transform: translateY(8px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .tut-popover-emoji { font-size: 28px; margin-bottom: 8px; }
    .tut-popover-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .tut-popover-desc {
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .tut-popover-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .tut-step-dots {
      display: flex;
      gap: 5px;
    }
    .tut-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #e2e8f0;
      transition: background 0.2s;
    }
    .tut-dot.active { background: #0f172a; }
    .tut-next-btn {
      background: #0f172a;
      color: white;
      border: none;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .tut-next-btn:hover { background: #1e293b; }
    .tut-skip-btn {
      background: none;
      border: none;
      font-size: 11px;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
    }
    .tut-skip-btn:hover { color: #64748b; }
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
      <div id="statusPill" class="status-pill" onclick="openAgentsModal()" title="View and switch connected AI agents">
        <span class="status-dot"></span>
        <span id="statusText">Agents</span>
        <span class="pill-chevron">&rsaquo;</span>
      </div>
    </div>

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
        <a id="versionBadge" href="https://github.com/saifmukhtar/ultimatter/releases" target="_blank" class="badge-item" style="text-decoration:none;font-weight:600;color:#64748b;" title="View releases on GitHub">v1.1.2</a>
      </div>
      <div style="margin-top: 14px; text-align: center;">
        <a href="https://github.com/saifmukhtar/ultimatter" target="_blank" class="github-star-btn" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 20px; padding: 5px 14px; font-size: 12px; font-weight: 600; color: #475569; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
          <svg height="14" viewBox="0 0 16 16" width="14" style="margin-right:6px;fill:#eab308"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
          Star on GitHub
        </a>
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

  <!-- Custom Confirm Dialog -->
  <div id="customConfirmOverlay" class="modal-backdrop" style="display:none; align-items:center; justify-content:center; z-index:9999; opacity:0; transition:opacity 0.2s;" onclick="event.stopPropagation()">
    <div class="modal-card" style="max-width:320px; padding:24px; text-align:center; transform: scale(0.95); transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);" id="customConfirmCard">
      <div id="customConfirmIcon" style="font-size:32px; margin-bottom:12px;"></div>
      <div id="customConfirmTitle" style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:8px;"></div>
      <div id="customConfirmMsg" style="font-size:13px; color:#475569; margin-bottom:24px; line-height:1.5;"></div>
      <div style="display:flex; justify-content:center; gap:12px;">
        <button onclick="closeCustomConfirm()" style="padding:8px 20px; border-radius:8px; border:1px solid #cbd5e1; background:#ffffff; color:#475569; font-weight:600; cursor:pointer; font-size:12px; transition:all 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#ffffff'" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">Cancel</button>
        <button onclick="executeCustomConfirm()" style="padding:8px 20px; border-radius:8px; border:none; background:#dc2626; color:#ffffff; font-weight:600; cursor:pointer; font-size:12px; box-shadow:0 2px 4px rgba(220,38,38,0.2); transition:all 0.2s;" onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">Confirm</button>
      </div>
    </div>
  </div>

  <!-- Onboarding Tutorial -->
  <div id="tutOverlay" class="tut-overlay" style="display:none;"></div>
  <div id="tutSpotlight" class="tut-spotlight" style="display:none;"></div>
  <div id="tutPopover" class="tut-popover" style="display:none;">
    <div id="tutEmoji" class="tut-popover-emoji"></div>
    <div id="tutTitle" class="tut-popover-title"></div>
    <div id="tutDesc" class="tut-popover-desc"></div>
    <div class="tut-popover-footer">
      <div class="tut-step-dots" id="tutDots"></div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button class="tut-skip-btn" onclick="endTutorial()">Skip</button>
        <button class="tut-next-btn" id="tutNextBtn" onclick="tutNext()">Next →</button>
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

    let confirmCallback = null;
    const showCustomConfirm = (icon, title, message, onConfirm) => {
      document.getElementById('customConfirmIcon').innerText = icon;
      document.getElementById('customConfirmTitle').innerText = title;
      document.getElementById('customConfirmMsg').innerText = message;
      confirmCallback = onConfirm;
      const overlay = document.getElementById('customConfirmOverlay');
      const card = document.getElementById('customConfirmCard');
      overlay.style.display = 'flex';
      setTimeout(() => {
        overlay.style.opacity = '1';
        card.style.transform = 'scale(1)';
      }, 10);
    };
    const closeCustomConfirm = () => {
      const overlay = document.getElementById('customConfirmOverlay');
      const card = document.getElementById('customConfirmCard');
      overlay.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => { 
        overlay.style.display = 'none'; 
        confirmCallback = null; 
      }, 200);
    };
    const executeCustomConfirm = () => {
      if (confirmCallback) confirmCallback();
      closeCustomConfirm();
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

    const toggleAgent = (agentId, nextEnabled) => {
      const isEnabled = typeof nextEnabled === 'boolean' ? nextEnabled : nextEnabled === 'true';
      fetch('/api/dashboard/toggle-agent', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agentId, enabled: isEnabled })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          state.disabledAgents = data.disabledAgents || [];
          if (state.agents) {
            state.agents.forEach(function(a) {
              if (a.id === agentId) {
                a.enabled = isEnabled;
              }
            });
          }
          renderAgentsModalList();
          updateUI();
          pollStatus();
        }
      })
      .catch(function() {});
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
        var isEnabled = a.enabled !== false;
        var subText = !isEnabled ? 'Mobile Access Disabled' : (isOnline ? ('Listening on port ' + a.port) : (a.description || 'Offline'));
        return '<div class="agent-item-row ' + (isOnline && isEnabled ? 'online' : '') + '" style="' + (!isEnabled ? 'opacity: 0.65;' : '') + '" onclick="toggleAgent(\\'' + a.id + '\\', ' + (!isEnabled) + ')" title="Click to ' + (isEnabled ? 'disable' : 'enable') + ' mobile gateway access for ' + a.name + '">' +
          '<div class="agent-item-left">' +
            '<div class="agent-item-icon">' + (a.icon || '🤖') + '</div>' +
            '<div>' +
              '<div class="agent-item-name">' + a.name + (!isEnabled ? ' <span style="font-size:10px;color:#94a3b8;font-weight:normal;">(Disabled)</span>' : '') + '</div>' +
              '<div class="agent-item-sub">' + subText + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div class="agent-status-badge ' + (isOnline ? 'online' : 'offline') + '">' +
              (isOnline ? '🟢 Online' : '⚪ Offline') +
            '</div>' +
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
      fetch('/api/dashboard/toggle-tailscale', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
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
      fetch('/api/dashboard/unban', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(res => res.json())
        .then(() => {
          pollStatus();
        })
        .catch(() => {});
    };

    const promptResetToken = () => {
      showCustomConfirm(
        "⚠️", 
        "Revoke All Sessions & Reset Token?", 
        "This will instantly disconnect all active phones until they scan the new QR code.", 
        () => {
          fetch('/api/dashboard/reset-token', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(res => res.json())
            .then(data => pollStatus())
            .catch(() => {});
        }
      );
    };

    const promptQuitApp = () => {
      showCustomConfirm(
        "🛑", 
        "Stop Ultimatter & Quit?", 
        "This will stop all background gateway bridges and close the application.", 
        () => {
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
          fetch('/api/dashboard/shutdown', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' } }).catch(() => {});
          setTimeout(() => { window.close(); }, 400);
        }
      );
    };

    const setLocalSubMode = (sub) => {
      state.localSubMode = sub;
      updateUI();
    };

    const promptEditDomain = () => {
      const current = state.localDomain ? state.localDomain.replace(/\\.local$/, '') : 'ultramarine';
      const input = prompt("Enter custom local hostname (e.g. saif-pc, code, antimatter):", current);
      if (input && input.trim()) {
        fetch('/api/dashboard/set-local-domain', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
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
        securityActions.innerHTML = \`\${unbanHtml}<button id="resetTokenBtn" class="reset-token-btn" onclick="promptResetToken()" title="Regenerate token & revoke all connected devices">🔄 Reset Token</button><button id="quitAppBtn" class="reset-token-btn quit" onclick="promptQuitApp()" title="Shut down Ultimatter and stop all background services">🛑 Quit</button>\`;
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

      const isOnline = state.activeCount > 0 || state.ideOnline;
      const statusPill = document.getElementById('statusPill');
      const statusText = document.getElementById('statusText');
      if (statusPill && statusText) {
        statusPill.className = isOnline ? 'status-pill online' : 'status-pill';
        statusText.innerText = 'Agents';
      }

      const activeAgents = (state.agents || []).filter(function(a) { return a.online; });

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
          vBadge.innerHTML = 'v' + (state.versionInfo.currentVersion || '1.1.2');
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
        tipText.innerHTML = '📱 <strong>Standalone PWA Ready:</strong> Tap "Add to Home Screen" to install as a full-screen app.<br><a href="/api/ca.pem" download="ultimatter.pem" style="display:inline-flex; align-items:center; gap:6px; margin-top:10px; padding:6px 12px; font-size:11px; font-weight:600; color:#334155; background:#f1f5f9; border-radius:8px; text-decoration:none; transition:all 0.2s;" onmouseover="this.style.background=\\'#e2e8f0\\';this.style.color=\\'#0f172a\\'" onmouseout="this.style.background=\\'#f1f5f9\\';this.style.color=\\'#334155\\'">🔒 Download Certificate (ultimatter.pem)</a>';
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
                <span class="smart-item-icon">☁️</span>
                <div class="smart-item-text">
                  <strong>CloudCLI:</strong> Start CloudCLI in terminal: <code class="smart-code">cloudcli</code>
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
      fetch('/api/dashboard/exchange-token', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(res => res.json())
        .then(data => {
          state.token = data.token || '';
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
        })
        .catch(() => {});
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

    // === Onboarding Tutorial ===
    const TUT_KEY = 'ultimatter_tut_done_v1';
    const tutSteps = [
      {
        emoji: '👋',
        title: 'Welcome to Ultimatter!',
        desc: 'This quick tour shows you the key controls. You can skip it any time.',
        targetId: null, // welcome card, no spotlight
      },
      {
        emoji: '📱',
        title: 'Connect Your Phone',
        desc: 'Scan this QR code with your phone camera to instantly open the Ultimatter Mobile Hub — no setup needed.',
        targetId: 'qrWrapper',
      },
      {
        emoji: '🤖',
        title: 'Switch AI Agents',
        desc: 'Tap here to see all detected AI agents on your machine and toggle which ones are accessible from your phone.',
        targetId: 'agentsModalBtn',
      },
      {
        emoji: '🛑',
        title: 'Quitting Ultimatter',
        desc: 'When you\'re done, use the Quit button here to safely stop the gateway and all background services.',
        targetId: 'quitAppBtn',
      },
    ];

    let tutStep = 0;

    function startTutorial() {
      if (localStorage.getItem(TUT_KEY)) return; // already done
      tutStep = 0;
      showTutStep();
    }

    function showTutStep() {
      const step = tutSteps[tutStep];
      const overlay = document.getElementById('tutOverlay');
      const spotlight = document.getElementById('tutSpotlight');
      const popover = document.getElementById('tutPopover');
      const dots = document.getElementById('tutDots');
      const nextBtn = document.getElementById('tutNextBtn');

      overlay.style.display = 'block';
      document.getElementById('tutEmoji').textContent = step.emoji;
      document.getElementById('tutTitle').textContent = step.title;
      document.getElementById('tutDesc').textContent = step.desc;

      // Dots
      dots.innerHTML = tutSteps.map((_, i) =>
        '<div class="tut-dot' + (i === tutStep ? ' active' : '') + '"></div>'
      ).join('');

      // Last step
      nextBtn.textContent = tutStep === tutSteps.length - 1 ? 'Done ✓' : 'Next →';

      // Spotlight on target element
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          const r = el.getBoundingClientRect();
          const pad = 8;
          spotlight.style.display = 'block';
          spotlight.style.top = (r.top - pad) + 'px';
          spotlight.style.left = (r.left - pad) + 'px';
          spotlight.style.width = (r.width + pad * 2) + 'px';
          spotlight.style.height = (r.height + pad * 2) + 'px';

          // Position popover below or above the element
          const below = r.bottom + 16 + 220 < window.innerHeight;
          popover.style.top = below ? (r.bottom + 16) + 'px' : (r.top - 220) + 'px';
          popover.style.left = Math.min(r.left, window.innerWidth - 280) + 'px';
        } else {
          spotlight.style.display = 'none';
          centerPopover(popover);
        }
      } else {
        spotlight.style.display = 'none';
        centerPopover(popover);
      }

      // Trigger re-animation by cloning
      const clone = popover.cloneNode(true);
      clone.id = 'tutPopover';
      clone.style.display = 'block';
      clone.querySelector('.tut-skip-btn').onclick = endTutorial;
      clone.querySelector('.tut-next-btn').onclick = tutNext;
      popover.replaceWith(clone);
    }

    function centerPopover(popover) {
      popover.style.top = '50%';
      popover.style.left = '50%';
      popover.style.transform = 'translate(-50%, -50%)';
    }

    function tutNext() {
      tutStep++;
      if (tutStep >= tutSteps.length) {
        endTutorial();
      } else {
        showTutStep();
      }
    }

    function endTutorial() {
      localStorage.setItem(TUT_KEY, '1');
      document.getElementById('tutOverlay').style.display = 'none';
      document.getElementById('tutSpotlight').style.display = 'none';
      document.getElementById('tutPopover').style.display = 'none';
    }

    // Start after a short delay so the UI has fully rendered
    setTimeout(startTutorial, 1200);
  </script>
</body>
</html>`;

module.exports = {
  generateQrSvg,
  getDashboardHtml
};
