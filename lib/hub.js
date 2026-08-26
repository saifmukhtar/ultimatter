const os = require('os');

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
  const hostname = os.hostname() || 'Host';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content">
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
      padding: max(24px, env(safe-area-inset-top, 24px)) max(16px, env(safe-area-inset-right, 16px)) max(40px, env(safe-area-inset-bottom, 40px)) max(16px, env(safe-area-inset-left, 16px));
      display: flex;
      flex-direction: column;
      align-items: center;
      -webkit-font-smoothing: antialiased;
      touch-action: manipulation;
      overscroll-behavior-y: contain;
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
    .brand-logo-svg {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
      flex-shrink: 0;
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
      transition: color 0.3s ease, opacity 0.3s ease;
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
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
    .pwa-tip-banner {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 14px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 2px;
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    .pwa-tip-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .pwa-tip-icon { font-size: 20px; flex-shrink: 0; }
    .pwa-tip-title { font-size: 12px; font-weight: 700; color: #0369a1; }
    .pwa-tip-desc { font-size: 11px; color: #0284c7; line-height: 1.4; margin-top: 1px; }
    .pwa-tip-close {
      background: #e0f2fe;
      border: none;
      color: #0369a1;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .ca-download-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
    }
    .ca-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .ca-icon { font-size: 20px; flex-shrink: 0; }
    .ca-title { font-size: 12px; font-weight: 700; color: #0f172a; }
    .ca-desc { font-size: 11px; color: #64748b; line-height: 1.35; margin-top: 1px; }
    .btn-ca {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      text-decoration: none;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    .btn-ca:active {
      background: #e2e8f0;
      transform: scale(0.97);
    }
  </style>
  <script>
    let hubPollInterval = null;
    let vitalsPollInterval = null;

    const startPolling = () => {
      stopPolling();
      pollHub();
      pollVitals();
      hubPollInterval = setInterval(pollHub, 2000);
      vitalsPollInterval = setInterval(pollVitals, 2500);
    };

    const stopPolling = () => {
      if (hubPollInterval) { clearInterval(hubPollInterval); hubPollInterval = null; }
      if (vitalsPollInterval) { clearInterval(vitalsPollInterval); vitalsPollInterval = null; }
    };

    const switchAgent = (agentId) => {
      stopPolling(); // Stop background battery drain immediately upon launching an agent
      try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
      
      const cards = document.querySelectorAll('[data-agent-id="' + agentId + '"]');
      cards.forEach(function(card) {
        const badge = card.querySelector('.action-badge');
        if (badge) {
          badge.innerText = 'Opening...';
          badge.style.background = '#0284c7';
          badge.style.color = '#ffffff';
          badge.style.borderColor = '#0284c7';
        }
      });

      fetch('/api/switch-agent?id=' + encodeURIComponent(agentId), { method: 'POST' })
        .then(() => {
          window.location.href = '/?agent=' + encodeURIComponent(agentId);
        })
        .catch(() => {
          window.location.href = '/?agent=' + encodeURIComponent(agentId);
        });
    };

    const dismissPwaTip = (e) => {
      if (e) e.stopPropagation();
      const banner = document.getElementById('pwaTipBanner');
      if (banner) banner.style.display = 'none';
      try { localStorage.setItem('ultimatter_pwa_tip_dismissed', 'true'); } catch(e) {}
    };

    const checkPwaMode = () => {
      try {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        const dismissed = localStorage.getItem('ultimatter_pwa_tip_dismissed') === 'true';
        if (!isStandalone && !dismissed) {
          const banner = document.getElementById('pwaTipBanner');
          if (banner) banner.style.display = 'flex';
        }
      } catch (e) {}
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
            '<div class="empty-desc">Launch Antigravity or start OpenCode in terminal: <code style="display:inline-block;margin-top:6px;background:#f1f5f9;border:1px solid #cbd5e1;padding:4px 8px;border-radius:6px;font-family:monospace;color:#0f172a;font-weight:600;">opencode web</code></div>' +
          '</div>';
        return;
      }

      container.innerHTML = activeList.map(function(target) {
        return (
          '<div class="agent-card" data-agent-id="' + target.id + '" onclick="switchAgent(\\'' + target.id + '\\')">' +
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

    const pollVitals = () => {
      fetch('/api/system-stats')
        .then(res => res.json())
        .then(data => {
          if (data) {
            if (data.hostname) {
              const nameEl = document.getElementById('vitalsHostname');
              if (nameEl) nameEl.innerText = data.hostname + ' Vitals';
            }
            if (data.cpu) {
              const cpu = data.cpu.load + '%';
              const ram = data.mem.percent + '% (' + data.mem.used + '/' + data.mem.total + ' GB)';
              const descEl = document.getElementById('vitalsDesc');
              const badgeEl = document.getElementById('vitalsBadge');
              if (descEl) descEl.innerText = 'CPU: ' + cpu + ' • RAM: ' + ram;
              if (badgeEl) badgeEl.innerText = cpu + ' CPU';
            }
          }
        }).catch(() => {});
    };

    // Lifecycle Handlers: Pause polling when tab is hidden or user locks phone; resume on return
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        stopPolling();
      }
    });

    window.addEventListener('pageshow', () => {
      startPolling();
    });

    window.addEventListener('pagehide', () => {
      stopPolling();
    });

    window.addEventListener('DOMContentLoaded', () => {
      checkPwaMode();
      startPolling();
    });
  </script>
</head>
<body>
  <div class="hub-container">
    <header class="header">
      <div class="brand">
        <svg class="brand-logo-svg" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="hubBrandBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f172a" />
              <stop offset="100%" stop-color="#020617" />
            </linearGradient>
            <linearGradient id="hubBrandGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#818cf8" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" rx="128" fill="url(#hubBrandBg)" />
          <circle cx="256" cy="256" r="180" fill="none" stroke="url(#hubBrandGlow)" stroke-width="12" stroke-dasharray="24 16" opacity="0.4" />
          <g transform="translate(106, 106) scale(0.58)">
            <path fill="url(#hubBrandGlow)" d="M256 0c141.385 0 256 114.615 256 256S397.385 512 256 512 0 397.385 0 256 114.615 0 256 0z" opacity="0.05" />
            <path fill="#ffffff" d="M472.9 44.5c-4.2-4.1-10.2-5.9-16-4.7-65.7 13.6-136.2 55.4-198.8 118-47.5 47.5-84.8 104.9-108.4 167.3-8.8 23.3-13.6 47.7-14.3 72.3-27.1 11.2-48.4 33.7-58.1 62.7-2.6 7.7 2.1 15.9 10 17.5 13.9 2.8 28.5 1.5 42.1-3.6 15.4 17.9 37.6 29.5 62 31.9 2.5.3 5-.5 7.1-2 2-1.5 3.3-3.7 3.8-6.2 3.5-17.7 1.4-36.2-6.1-52.6 22.9-.6 45.6-5.1 67.3-13.3 62.4-23.6 119.8-60.9 167.3-108.4 62.6-62.6 104.4-133.1 118-198.8 1.2-5.8-.6-11.8-4.7-16-1.5-1.5-3.3-2.7-5.3-3.6zM288 176c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32z"/>
          </g>
        </svg>
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

    <div id="pwaTipBanner" class="pwa-tip-banner" style="display: none;">
      <div class="pwa-tip-left">
        <div class="pwa-tip-icon">💡</div>
        <div>
          <div class="pwa-tip-title">Install as Mobile App</div>
          <div class="pwa-tip-desc">Tap <strong>Share</strong> (or <strong>⋮</strong>) &amp; <strong>Add to Home Screen</strong> for full-screen mode.</div>
        </div>
      </div>
      <button class="pwa-tip-close" onclick="dismissPwaTip(event)">✕</button>
    </div>

    <div>
      <div class="section-header">
        <span class="section-title">Active Desktop Agents</span>
        <span id="agentCountBadge" class="agent-count-badge">${activeTargets.length} Running</span>
      </div>

      <!-- Sticky First Card: Host System Vitals -->
      <div class="agent-card" style="margin-top: 10px; margin-bottom: 10px; cursor: default; border-left: 3px solid #0284c7;">
        <div class="agent-info">
          <div class="agent-avatar" style="background: #f0f9ff; border-color: #bae6fd; font-size: 22px;">🖥️</div>
          <div class="agent-meta">
            <div class="agent-name-row">
              <span class="agent-name" id="vitalsHostname">${hostname} Vitals</span>
              <span class="port-tag" id="vitalsLiveBadge" style="color: #0284c7; background: #f0f9ff; border-color: #bae6fd;">Live</span>
            </div>
            <div class="agent-desc" id="vitalsDesc">CPU: Loading... • RAM: Loading...</div>
          </div>
        </div>
        <div class="action-badge" style="background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%); box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);">
          <span id="vitalsBadge">--% CPU</span>
        </div>
      </div>

      <div id="agentGrid" class="agent-grid">
        ${activeTargets.length === 0 ? `
          <div class="empty-card">
            <div class="empty-icon">⏳</div>
            <div class="empty-title">Waiting for Desktop Agents</div>
            <div class="empty-desc">Launch Antigravity or start OpenCode in terminal: <code style="display:inline-block;margin-top:6px;background:#f1f5f9;border:1px solid #cbd5e1;padding:4px 8px;border-radius:6px;font-family:monospace;color:#0f172a;font-weight:600;">opencode web</code></div>
          </div>
        ` : activeTargets.map(target => `
          <div class="agent-card" data-agent-id="${target.id}" onclick="switchAgent('${target.id}')">
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

    <div class="ca-download-card">
      <div class="ca-left">
        <span class="ca-icon">📲</span>
        <div>
          <div class="ca-title">Local Root CA Certificate</div>
          <div class="ca-desc">Install on phone for zero-warning HTTPS on Wi-Fi (rootCA.pem)</div>
        </div>
      </div>
      <div style="display: flex; gap: 6px; align-items: center;">
        <a href="/api/ca.pem" download="rootCA.pem" class="btn-ca" title="Standard Root CA (.pem)">.PEM ↓</a>
        <a href="/api/ca.crt" download="rootCA.crt" class="btn-ca" style="background:#f1f5f9;color:#0f172a;border:1px solid #cbd5e1;" title="Android Certificate Installer (.crt)">.CRT ↓</a>
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
