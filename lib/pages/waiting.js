/**
 * Generates the waiting screen shown on the phone when no AI agent is running.
 * 
 * @returns {string} HTML waiting page
 */
const getWaitingPageHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content">
  <title>Ultimatter - Waiting for Agents</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: max(24px, env(safe-area-inset-top, 24px)) max(16px, env(safe-area-inset-right, 16px)) max(40px, env(safe-area-inset-bottom, 40px)) max(16px, env(safe-area-inset-left, 16px));
      text-align: center;
      -webkit-font-smoothing: antialiased;
      touch-action: manipulation;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 36px 24px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 10px 30px -4px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    .spinner-ring {
      width: 48px;
      height: 48px;
      border: 3px solid #e2e8f0;
      border-top-color: #0284c7;
      border-radius: 50%;
      animation: spin 0.9s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite;
      margin-bottom: 4px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .brand-title {
      font-size: 19px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .desc {
      font-size: 13px;
      color: #64748b;
      line-height: 1.55;
    }
    .target-preview {
      display: flex;
      gap: 8px;
      margin: 4px 0;
    }
    .target-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 20px;
      margin-top: 4px;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      background-color: #10b981;
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(0.75); }
    }
    .code-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      color: #0f172a;
      width: 100%;
      text-align: center;
      margin: 2px 0;
    }
  </style>
  <script>
    const checkStatus = () => {
      fetch('/api/bridge-status')
        .then(res => res.json())
        .then(data => {
          if (data.online) {
            window.location.reload();
          }
        })
        .catch(() => {});
    };
    setInterval(checkStatus, 1500);
  </script>
</head>
<body>
  <div class="card">
    <div class="spinner-ring"></div>
    <div class="brand-title">Waiting for AI Agents</div>
    <p class="desc">The encrypted gateway is active. Launch Antigravity or OpenCode on your desktop to connect.</p>
    <div class="code-box">
      <span>Terminal: <strong>opencode web</strong></span>
    </div>
    <div class="status-badge">
      <div class="pulse-dot"></div>
      Auto-connecting on launch...
    </div>
  </div>
</body>
</html>`;

module.exports = {
  getWaitingPageHtml
};
