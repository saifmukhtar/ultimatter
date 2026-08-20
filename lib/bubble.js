/**
 * Generates and injects the Shadow DOM Encapsulated Draggable Edge Bubble and Agent Switcher.
 * 100% immune to external CSS resets (e.g. Tailwind v4) and CSP inline script blocking.
 */

const getPortalScript = () => {
  return `
(function() {
  if (customElements.get('ultimatter-portal')) return;

  class UltimatterPortal extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });

      shadow.innerHTML = \`
        <style>
          :host {
            all: initial;
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            pointer-events: none !important;
            z-index: 2147483647 !important;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
            -webkit-user-select: none;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          .fab {
            position: absolute !important;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #ffffff;
            border: 1.5px solid #cbd5e1;
            box-shadow: 0 6px 22px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(15, 23, 42, 0.08);
            color: #0f172a;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            cursor: grab;
            touch-action: none;
            pointer-events: auto !important;
            transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 2147483647;
          }
          .fab.visible {
            display: flex !important;
          }
          .fab.dimmed {
            opacity: 0.38;
          }
          .fab:active {
            transform: scale(0.92);
            opacity: 1 !important;
            cursor: grabbing;
          }
          .fab-dot {
            position: absolute;
            top: 3px;
            right: 3px;
            width: 10px;
            height: 10px;
            background: #10b981;
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
          }
          .backdrop {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(15, 23, 42, 0.55);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 2147483647;
            display: none;
            align-items: flex-end;
            justify-content: center;
            pointer-events: auto !important;
          }
          .drawer {
            background: #ffffff;
            width: 100%;
            max-width: 460px;
            border-radius: 20px 20px 0 0;
            padding: 20px 18px max(34px, env(safe-area-inset-bottom, 34px));
            box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            gap: 14px;
            animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            color: #0f172a;
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .drawer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 2px;
          }
          .drawer-title {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 8px;
            letter-spacing: -0.2px;
          }
          .close-btn {
            background: #f1f5f9;
            border: none;
            color: #64748b;
            font-size: 16px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .agent-list {
            display: flex;
            flex-direction: column;
            gap: 9px;
            max-height: 280px;
            overflow-y: auto;
          }
          .agent-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .agent-item:active {
            background: #f1f5f9;
            transform: scale(0.98);
          }
          .agent-item.current {
            border-color: #a7f3d0;
            background: #f0fdf4;
          }
          .item-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .item-icon {
            font-size: 22px;
          }
          .item-name {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
          }
          .item-sub {
            font-size: 11px;
            color: #64748b;
            font-family: ui-monospace, monospace;
          }
          .badge-active {
            font-size: 11px;
            font-weight: 600;
            background: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
            padding: 3px 8px;
            border-radius: 12px;
          }
          .badge-switch {
            font-size: 11px;
            font-weight: 600;
            background: #0284c7;
            color: #ffffff;
            padding: 5px 11px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
          }
          .hub-btn {
            width: 100%;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            color: #334155;
            font-size: 13px;
            font-weight: 600;
            padding: 11px 16px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            margin-top: 4px;
            transition: background 0.2s;
          }
          .hub-btn:active {
            background: #e2e8f0;
          }
        </style>

        <div id="fab" class="fab" title="Tap to switch agents">
          <span>🚀</span>
          <span class="fab-dot"></span>
        </div>

        <div id="backdrop" class="backdrop">
          <div id="drawer" class="drawer">
            <div class="drawer-header">
              <div class="drawer-title">
                <span>🚀</span>
                <span>Switch Agent</span>
              </div>
              <button id="closeBtn" class="close-btn">✕</button>
            </div>
            <div id="agentList" class="agent-list">
              <div style="text-align:center;padding:12px;color:#64748b;font-size:12px;">Loading active agents...</div>
            </div>
            <button id="bottomHubBtn" class="hub-btn">
              <span>🏠</span>
              <span>Open Ultimatter Hub</span>
            </button>
          </div>
        </div>
      \`;

      this.fab = shadow.getElementById('fab');
      this.backdrop = shadow.getElementById('backdrop');
      this.closeBtn = shadow.getElementById('closeBtn');
      this.agentList = shadow.getElementById('agentList');
      this.bottomHubBtn = shadow.getElementById('bottomHubBtn');

      this.style.display = 'none'; // Auto-hidden in single-agent mode!
      this.initPosition();
      this.initGestures();
      this.initEvents();
      this.checkAgentVisibility();
      setInterval(() => this.checkAgentVisibility(), 2500);
    }

    checkAgentVisibility() {
      fetch('/api/bridge-status')
        .then(res => res.json())
        .then(data => {
          const count = data.count || (data.agents ? data.agents.length : 0);
          if (count >= 2) {
            this.fab.classList.add('visible');
          } else {
            this.fab.classList.remove('visible');
            this.closeDrawer();
          }
        })
        .catch(() => {});
    }

    initPosition() {
      let side = 'right';
      let top = Math.round(window.innerHeight * 0.65);

      try {
        const saved = JSON.parse(localStorage.getItem('ultimatter_fab_pos') || '{}');
        if (saved.side === 'left' || saved.side === 'right') side = saved.side;
        if (typeof saved.top === 'number' && saved.top >= 40 && saved.top <= window.innerHeight - 60) {
          top = saved.top;
        }
      } catch (e) {}

      this.applyPosition(side, top, false);
    }

    applyPosition(side, top, animate) {
      if (animate) {
        this.fab.style.transition = 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1), right 0.25s cubic-bezier(0.16, 1, 0.3, 1), top 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s';
      } else {
        this.fab.style.transition = 'opacity 0.3s, transform 0.15s ease-out';
      }

      this.fab.style.top = top + 'px';
      if (side === 'left') {
        this.fab.style.left = '12px';
        this.fab.style.right = 'auto';
      } else {
        this.fab.style.right = '12px';
        this.fab.style.left = 'auto';
      }

      this.currentSide = side;
      this.currentTop = top;

      try {
        localStorage.setItem('ultimatter_fab_pos', JSON.stringify({ side, top }));
      } catch (e) {}
    }

    initGestures() {
      let isDragging = false;
      let startX = 0, startY = 0;
      let fabX = 0, fabY = 0;
      let moved = false;
      let dimTimer = null;

      const resetDimTimer = () => {
        this.fab.classList.remove('dimmed');
        clearTimeout(dimTimer);
        dimTimer = setTimeout(() => {
          this.fab.classList.add('dimmed');
        }, 3500);
      };

      resetDimTimer();

      const onPointerDown = (e) => {
        isDragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        const rect = this.fab.getBoundingClientRect();
        fabX = rect.left;
        fabY = rect.top;

        this.fab.style.transition = 'none';
        resetDimTimer();
        if (e.stopPropagation) e.stopPropagation();
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const diffX = e.clientX - startX;
        const diffY = e.clientY - startY;

        if (Math.abs(diffX) > 4 || Math.abs(diffY) > 4) {
          moved = true;
          const newX = Math.max(8, Math.min(fabX + diffX, window.innerWidth - 56));
          const newY = Math.max(45, Math.min(fabY + diffY, window.innerHeight - 65));

          this.fab.style.left = newX + 'px';
          this.fab.style.right = 'auto';
          this.fab.style.top = newY + 'px';

          if (e.preventDefault) e.preventDefault();
        }
        if (e.stopPropagation) e.stopPropagation();
      };

      const onPointerUp = (e) => {
        if (!isDragging) return;
        isDragging = false;

        if (moved) {
          const rect = this.fab.getBoundingClientRect();
          const midX = rect.left + rect.width / 2;
          const targetSide = midX < window.innerWidth / 2 ? 'left' : 'right';
          const targetTop = Math.max(45, Math.min(rect.top, window.innerHeight - 65));
          this.applyPosition(targetSide, targetTop, true);
        } else {
          this.openDrawer();
        }

        resetDimTimer();
        if (e.stopPropagation) e.stopPropagation();
      };

      this.fab.addEventListener('pointerdown', onPointerDown, { capture: true });
      window.addEventListener('pointermove', onPointerMove, { capture: true, passive: false });
      window.addEventListener('pointerup', onPointerUp, { capture: true });
      window.addEventListener('pointercancel', onPointerUp, { capture: true });
    }

    initEvents() {
      this.closeBtn.addEventListener('click', () => {
        try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
        this.closeDrawer();
      });
      this.backdrop.addEventListener('click', (e) => {
        if (e.target === this.backdrop) this.closeDrawer();
      });
      this.bottomHubBtn.addEventListener('click', () => {
        try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
        window.location.assign('/hub');
      });
    }

    openDrawer() {
      try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
      this.backdrop.style.display = 'flex';
      this.renderDrawerList();
    }

    closeDrawer() {
      this.backdrop.style.display = 'none';
    }

    renderDrawerList() {
      fetch('/api/bridge-status')
        .then(res => res.json())
        .then(data => {
          const agents = data.agents || [];
          
          const hubCardHtml = \`
            <div class="agent-item" style="border-color:#bae6fd;background:#f0f9ff;" id="item-hub">
              <div class="item-left">
                <div class="item-icon">🏠</div>
                <div>
                  <div class="item-name" style="color:#0369a1;">Ultimatter Hub</div>
                  <div class="item-sub" style="color:#0284c7;">All Active Agents & Status</div>
                </div>
              </div>
              <button class="badge-switch" style="background:#0284c7;">Open Hub ↗</button>
            </div>
          \`;

          if (agents.length === 0) {
            this.agentList.innerHTML = hubCardHtml + '<div style="text-align:center;padding:12px;color:#64748b;font-size:12px;">No other agents active on PC</div>';
            this.attachDrawerItemEvents();
            return;
          }

          let currentAgent = '';
          try {
            const match = document.cookie.match(/selected_agent=([^;]+)/);
            if (match) currentAgent = decodeURIComponent(match[1]);
          } catch (e) {}

          const agentCardsHtml = agents.map(a => {
            const isCurrent = (currentAgent && currentAgent === a.id) || (!currentAgent && a.id === agents[0].id);
            return \`
              <div class="agent-item \${isCurrent ? 'current' : ''}" data-agent-id="\${a.id}">
                <div class="item-left">
                  <div class="item-icon">\${a.icon || '🤖'}</div>
                  <div>
                    <div class="item-name">\${a.name}</div>
                    <div class="item-sub">:\${a.port}</div>
                  </div>
                </div>
                \${isCurrent 
                  ? '<span class="badge-active">✓ Current</span>' 
                  : '<button class="badge-switch">Switch →</button>'}
              </div>
            \`;
          }).join('');

          this.agentList.innerHTML = hubCardHtml + agentCardsHtml;
          this.attachDrawerItemEvents();
        })
        .catch(() => {
          this.agentList.innerHTML = \`
            <div class="agent-item" style="border-color:#bae6fd;background:#f0f9ff;" id="item-hub">
              <div class="item-left">
                <div class="item-icon">🏠</div>
                <div>
                  <div class="item-name" style="color:#0369a1;">Ultimatter Hub</div>
                  <div class="item-sub" style="color:#0284c7;">Go to Hub</div>
                </div>
              </div>
              <button class="badge-switch" style="background:#0284c7;">Open Hub ↗</button>
            </div>
          \`;
          this.attachDrawerItemEvents();
        });
    }

    attachDrawerItemEvents() {
      const hubItem = this.agentList.querySelector('#item-hub');
      if (hubItem) {
        hubItem.addEventListener('click', () => {
          try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
          window.location.assign('/hub');
        });
      }

      const agentItems = this.agentList.querySelectorAll('[data-agent-id]');
      agentItems.forEach(item => {
        item.addEventListener('click', () => {
          try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
          const agentId = item.getAttribute('data-agent-id');
          if (agentId) {
            fetch('/api/switch-agent?id=' + encodeURIComponent(agentId), { method: 'POST' })
              .then(() => { window.location.assign('/'); })
              .catch(() => { window.location.assign('/'); });
          }
        });
      });
    }
  }

  customElements.define('ultimatter-portal', UltimatterPortal);
})();
`;
};

const getBubbleSnippet = () => {
  return `
<!-- Ultimatter Shadow DOM Encapsulated Portal -->
<ultimatter-portal id="ultimatter-portal-root"></ultimatter-portal>
<script src="/api/ultimatter-portal.js" defer></script>
<!-- End Ultimatter Shadow DOM Encapsulated Portal -->
`;
};

/**
 * Injects the Shadow DOM portal component into the agent's HTML page before </body>.
 * 
 * @param {string} html - Raw HTML from the upstream agent
 * @returns {string} Modified HTML containing the portal
 */
const injectBubble = (html) => {
  if (typeof html !== 'string' || !html.includes('</body>')) {
    return html;
  }
  if (html.includes('ultimatter-portal')) {
    return html;
  }
  const snippet = getBubbleSnippet();
  return html.replace('</body>', `${snippet}\n</body>`);
};

module.exports = {
  getPortalScript,
  getBubbleSnippet,
  injectBubble
};
