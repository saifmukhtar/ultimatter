/**
 * Generates the Mobile Agent Launcher Hub HTML document.
 * Features a premium soft-light theme displaying ONLY currently running agents.
 * 
 * @param {Array<object>} allTargets - Complete list of supported agents from AGENT_TARGETS
 * @param {Array<object>} activeTargets - Currently active/online agents
 * @param {string} [token=''] - Current access token
 * @returns {string} HTML string for the Mobile Agent Hub
 */
const getHubHtml = (allTargets = [], activeTargets = [], token = '') => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Ultimatter Hub</title>
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#f8fafc">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <link rel="apple-touch-icon" href="/icon.svg">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      min-height: 100vh;
      padding: 24px 16px 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      -webkit-font-smoothing: antialiased;
    }
    .hub-container {
      max-width: 440px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 4px 4px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      font-size: 26px;
      line-height: 1;
    }
    .brand-title {
      font-size: 19px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.4px;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 1px;
      font-weight: 500;
    }
    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #047857;
      font-size: 11px;
      font-weight: 600;
      padding: 5px 11px;
      border-radius: 20px;
      box-shadow: 0 1px 2px rgba(16, 185, 129, 0.05);
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(0.75); }
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 4px;
      margin-bottom: 2px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
    }
    .agent-count-badge {
      font-size: 11px;
      font-weight: 600;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .agent-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .agent-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03), 0 1px 2px rgba(15, 23, 42, 0.02);
    }
    .agent-card:active {
      transform: scale(0.98);
      background: #f8fafc;
    }
    .agent-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
    }
    .agent-info {
      display: flex;
      align-items: center;
      gap: 13px;
      min-width: 0;
    }
    .agent-avatar {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }
    .agent-meta {
      min-width: 0;
    }
    .agent-name-row {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 3px;
    }
    .agent-name {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.2px;
    }
    .port-tag {
      font-size: 11px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #0284c7;
      background: #f0f9ff;
      padding: 1px 6px;
      border-radius: 6px;
      border: 1px solid #bae6fd;
      font-weight: 600;
    }
    .agent-desc {
      font-size: 12px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }
    .action-badge {
      font-size: 12px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 10px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 5px;
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
      border: none;
      letter-spacing: -0.1px;
    }
    .empty-card {
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 16px;
      padding: 36px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .empty-icon {
      font-size: 32px;
      opacity: 0.8;
      animation: float 2.5s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    .empty-title {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
    }
    .empty-desc {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      max-width: 280px;
    }
    .footer-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 16px;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
    }
    .footer-icon {
      font-size: 18px;
      flex-shrink: 0;
    }
  </style>
  <script>
    const switchAgent = (agentId) => {
      fetch('/api/switch-agent?id=' + encodeURIComponent(agentId), { method: 'POST' })
        .then(() => {
          window.location.href = '/';
        })
        .catch(() => {
          window.location.href = '/';
        });
    };

    let lastActiveIds = '';

    const renderActiveAgents = (agents) => {
      const container = document.getElementById('agentGrid');
      const countBadge = document.getElementById('agentCountBadge');
      if (!container) return;

      const activeList = agents.filter(function(a) { return a.online; });
      const currentIds = activeList.map(function(a) { return a.id + ':' + a.port; }).join(',');

      if (countBadge) {
        countBadge.innerText = activeList.length + ' Running';
      }

      if (currentIds === lastActiveIds) return;
      lastActiveIds = currentIds;

      if (activeList.length === 0) {
        container.innerHTML = 
          '<div class="empty-card">' +
            '<div class="empty-icon">⏳</div>' +
            '<div class="empty-title">Waiting for Desktop Agents</div>' +
            '<div class="empty-desc">Launch Antigravity or OpenCode on your PC to connect.</div>' +
          '</div>';
        return;
      }

      container.innerHTML = activeList.map(function(target) {
        return (
          '<div class="agent-card" onclick="switchAgent(\\'' + target.id + '\\')">' +
            '<div class="agent-info">' +
              '<div class="agent-avatar">' + (target.icon || '🤖') + '</div>' +
              '<div class="agent-meta">' +
                '<div class="agent-name-row">' +
                  '<span class="agent-name">' + target.name + '</span>' +
                  '<span class="port-tag">:' + target.port + '</span>' +
                '</div>' +
                '<div class="agent-desc">' + (target.description || 'Active AI agent session') + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="action-badge">Open →</div>' +
          '</div>'
        );
      }).join('');
    };

    const pollHub = () => {
      fetch('/api/dashboard/status')
        .then(res => res.json())
        .then(data => {
          if (data && data.agents) {
            renderActiveAgents(data.agents);
          }
        })
        .catch(() => {});
    };

    setInterval(pollHub, 1500);
  </script>
</head>
<body>
  <div class="hub-container">
    <header class="header">
      <div class="brand">
        <span class="brand-icon">🚀</span>
        <div>
          <div class="brand-title">Ultimatter Hub</div>
          <div class="brand-sub">Universal AI Agent Gateway</div>
        </div>
      </div>
      <div class="live-badge">
        <span class="pulse-dot"></span>
        Active
      </div>
    </header>

    <div>
      <div class="section-header">
        <span class="section-title">Active Desktop Agents</span>
        <span id="agentCountBadge" class="agent-count-badge">${activeTargets.length} Running</span>
      </div>
      <div id="agentGrid" class="agent-grid" style="margin-top: 10px;">
        ${activeTargets.length === 0 ? `
          <div class="empty-card">
            <div class="empty-icon">⏳</div>
            <div class="empty-title">Waiting for Desktop Agents</div>
            <div class="empty-desc">Launch Antigravity or OpenCode on your PC to connect.</div>
          </div>
        ` : activeTargets.map(target => `
          <div class="agent-card" onclick="switchAgent('${target.id}')">
            <div class="agent-info">
              <div class="agent-avatar">${target.icon || '🤖'}</div>
              <div class="agent-meta">
                <div class="agent-name-row">
                  <span class="agent-name">${target.name}</span>
                  <span class="port-tag">:${target.port}</span>
                </div>
                <div class="agent-desc">${target.description || 'Active AI agent session'}</div>
              </div>
            </div>
            <div class="action-badge">Open →</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="footer-card">
      <span class="footer-icon">🔒</span>
      <span><strong>Encrypted Multi-Agent Tunnel:</strong> Select any running agent above to launch its full mobile interface with zero configuration.</span>
    </div>
  </div>
</body>
</html>`;
};

module.exports = { getHubHtml };
