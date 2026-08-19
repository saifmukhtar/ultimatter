/**
 * Generates the Mobile Agent Launcher Hub HTML document.
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
  <meta name="theme-color" content="#0d1117">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="apple-touch-icon" href="/icon.svg">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0d1117;
      color: #c9d1d9;
      min-height: 100vh;
      padding: 24px 16px 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .hub-container {
      max-width: 460px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 6px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      font-size: 28px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 700;
      color: #f0f6fc;
      letter-spacing: -0.3px;
    }
    .brand-sub {
      font-size: 12px;
      color: #8b949e;
      margin-top: 1px;
    }
    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(35, 134, 54, 0.15);
      border: 1px solid rgba(46, 160, 67, 0.4);
      color: #3fb950;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      background: #3fb950;
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.8); }
    }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #8b949e;
      margin-bottom: 2px;
      padding: 0 4px;
    }
    .agent-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .agent-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 14px;
      padding: 18px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }
    .agent-card:active {
      transform: scale(0.98);
    }
    .agent-card.online {
      border-color: rgba(56, 139, 253, 0.4);
      background: linear-gradient(180deg, #161b22 0%, #1c2128 100%);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
    .agent-card.online:hover {
      border-color: #58a6ff;
    }
    .agent-card.offline {
      opacity: 0.65;
      cursor: default;
    }
    .agent-info {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }
    .agent-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #21262d;
      border: 1px solid #30363d;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .agent-card.online .agent-avatar {
      background: rgba(56, 139, 253, 0.1);
      border-color: rgba(56, 139, 253, 0.3);
    }
    .agent-meta {
      min-width: 0;
    }
    .agent-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 3px;
    }
    .agent-name {
      font-size: 16px;
      font-weight: 600;
      color: #f0f6fc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .port-tag {
      font-size: 11px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #58a6ff;
      background: rgba(56, 139, 253, 0.12);
      padding: 1px 6px;
      border-radius: 6px;
      border: 1px solid rgba(56, 139, 253, 0.25);
    }
    .agent-desc {
      font-size: 12px;
      color: #8b949e;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .action-badge {
      font-size: 12px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 8px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .action-badge.open {
      background: #238636;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(35, 134, 54, 0.4);
    }
    .action-badge.inactive {
      background: #21262d;
      color: #8b949e;
      border: 1px solid #30363d;
      font-size: 11px;
    }
    .footer-note {
      text-align: center;
      font-size: 12px;
      color: #6e7681;
      line-height: 1.5;
      padding: 12px 10px;
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

    const pollHub = () => {
      fetch('/api/hub-status')
        .then(res => res.json())
        .then(data => {
          if (data && data.agents) {
            data.agents.forEach(agent => {
              const card = document.getElementById('card-' + agent.id);
              const badge = document.getElementById('badge-' + agent.id);
              const portEl = document.getElementById('port-' + agent.id);
              
              if (card && badge) {
                if (agent.online) {
                  card.className = 'agent-card online';
                  card.onclick = () => switchAgent(agent.id);
                  badge.className = 'action-badge open';
                  badge.innerHTML = 'Open →';
                  if (portEl) {
                    portEl.style.display = 'inline-block';
                    portEl.innerText = ':' + agent.port;
                  }
                } else {
                  card.className = 'agent-card offline';
                  card.onclick = null;
                  badge.className = 'action-badge inactive';
                  badge.innerHTML = 'Offline';
                  if (portEl) {
                    portEl.style.display = 'none';
                  }
                }
              }
            });
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
        Bridge Active
      </div>
    </header>

    <div>
      <div class="section-title">Available Desktop Agents</div>
      <div class="agent-grid">
        ${allTargets.map(target => {
          const active = activeTargets.find(a => a.id === target.id);
          const isOnline = !!active;
          const port = active ? active.port : (target.defaultPort || '');
          return `
            <div id="card-${target.id}" class="agent-card ${isOnline ? 'online' : 'offline'}" ${isOnline ? `onclick="switchAgent('${target.id}')"` : ''}>
              <div class="agent-info">
                <div class="agent-avatar">${target.icon}</div>
                <div class="agent-meta">
                  <div class="agent-name-row">
                    <span class="agent-name">${target.name}</span>
                    <span id="port-${target.id}" class="port-tag" style="${isOnline ? '' : 'display:none;'}">:${port}</span>
                  </div>
                  <div class="agent-desc">${target.description}</div>
                </div>
              </div>
              <div id="badge-${target.id}" class="action-badge ${isOnline ? 'open' : 'inactive'}">
                ${isOnline ? 'Open →' : 'Offline'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="footer-note">
      🔒 <strong>Universal 256-Bit Gateway:</strong> Launch any AI agent on your computer and tap above to instantly open it on your phone.
    </div>
  </div>
</body>
</html>`;
};

module.exports = { getHubHtml };
