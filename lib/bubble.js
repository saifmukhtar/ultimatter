/**
 * Generates and injects the Draggable Mobile Edge Bubble and Agent Switcher Drawer.
 * Injected on-the-fly into agent HTML responses by the gateway proxy (zero file modification).
 */

const getBubbleSnippet = () => {
  return `
<!-- Ultimatter Floating Edge Bubble & Agent Switcher -->
<div id="ultimatter-bubble-root">
  <style>
    #ultimatter-bubble-root {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      pointer-events: auto !important;
    }
    #ultimatter-fab {
      position: fixed;
      right: 14px;
      top: 65%;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      box-shadow: 0 4px 18px rgba(15, 23, 42, 0.16), 0 2px 5px rgba(15, 23, 42, 0.08);
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 21px;
      z-index: 2147483640;
      cursor: grab;
      touch-action: none;
      pointer-events: auto !important;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s ease-out;
    }
    #ultimatter-fab.dimmed {
      opacity: 0.4;
    }
    #ultimatter-fab:active {
      transform: scale(0.92);
      opacity: 1 !important;
    }
    .ultimatter-fab-dot {
      position: absolute;
      top: 3px;
      right: 3px;
      width: 9px;
      height: 9px;
      background: #10b981;
      border: 2px solid #ffffff;
      border-radius: 50%;
    }
    #ultimatter-drawer-backdrop {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 2147483645;
      display: none;
      align-items: flex-end;
      justify-content: center;
      pointer-events: auto !important;
    }
    #ultimatter-drawer {
      background: #ffffff;
      width: 100%;
      max-width: 460px;
      border-radius: 20px 20px 0 0;
      padding: 20px 18px 32px;
      box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      gap: 14px;
      animation: ultimatterSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      color: #0f172a;
      pointer-events: auto !important;
    }
    @keyframes ultimatterSlideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .ultimatter-drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 2px;
    }
    .ultimatter-drawer-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ultimatter-close-btn {
      background: #f1f5f9;
      border: none;
      color: #64748b;
      font-size: 16px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .ultimatter-agent-list {
      display: flex;
      flex-direction: column;
      gap: 9px;
      max-height: 280px;
      overflow-y: auto;
    }
    .ultimatter-agent-item {
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
    .ultimatter-agent-item:active {
      background: #f1f5f9;
      transform: scale(0.98);
    }
    .ultimatter-agent-item.current {
      border-color: #a7f3d0;
      background: #f0fdf4;
    }
    .ultimatter-item-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ultimatter-item-icon {
      font-size: 22px;
    }
    .ultimatter-item-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .ultimatter-item-sub {
      font-size: 11px;
      color: #64748b;
      font-family: ui-monospace, monospace;
    }
    .ultimatter-badge-active {
      font-size: 11px;
      font-weight: 600;
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
      padding: 3px 8px;
      border-radius: 12px;
    }
    .ultimatter-badge-switch {
      font-size: 11px;
      font-weight: 600;
      background: #0284c7;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
    }
    .ultimatter-hub-btn {
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
    .ultimatter-hub-btn:active {
      background: #e2e8f0;
    }
  </style>

  <!-- Floating Edge Bubble with Online Indicator -->
  <div id="ultimatter-fab" title="Tap to switch agents">
    <span>🚀</span>
    <span class="ultimatter-fab-dot"></span>
  </div>

  <!-- Agent Switcher Drawer -->
  <div id="ultimatter-drawer-backdrop">
    <div id="ultimatter-drawer">
      <div class="ultimatter-drawer-header">
        <div class="ultimatter-drawer-title">
          <span>🚀</span>
          <span>Switch Agent</span>
        </div>
        <button class="ultimatter-close-btn" onclick="window.__ultimatterCloseDrawer()">✕</button>
      </div>
      <div id="ultimatterAgentList" class="ultimatter-agent-list">
        <div style="text-align:center;padding:12px;color:#64748b;font-size:12px;">Loading active agents...</div>
      </div>
      <button class="ultimatter-hub-btn" onclick="window.location.assign('/hub')">
        <span>🏠</span>
        <span>Open Ultimatter Hub</span>
      </button>
    </div>
  </div>

  <script>
    (function() {
      var fab = document.getElementById('ultimatter-fab');
      var backdrop = document.getElementById('ultimatter-drawer-backdrop');
      if (!fab || !backdrop) return;

      var isDragging = false;
      var startY = 0;
      var startX = 0;
      var fabTop = 0;
      var moved = false;
      var dimTimer = null;

      // Restore saved top position
      try {
        var savedTop = localStorage.getItem('ultimatter_fab_top');
        if (savedTop) {
          fab.style.top = savedTop + 'px';
        }
      } catch (e) {}

      var resetDimTimer = function() {
        fab.classList.remove('dimmed');
        clearTimeout(dimTimer);
        dimTimer = setTimeout(function() {
          fab.classList.add('dimmed');
        }, 3500);
      };

      resetDimTimer();

      // Unified Pointer & Touch Drag Gestures with Capture Mode
      var onDragStart = function(e) {
        var clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        var clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        isDragging = true;
        moved = false;
        startY = clientY;
        startX = clientX;
        fabTop = fab.getBoundingClientRect().top;
        resetDimTimer();
        if (e.stopPropagation) e.stopPropagation();
      };

      var onDragMove = function(e) {
        if (!isDragging) return;
        var clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        var clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        var diffY = clientY - startY;
        var diffX = clientX - startX;
        if (Math.abs(diffY) > 4 || Math.abs(diffX) > 4) {
          moved = true;
          var newTop = fabTop + diffY;
          var maxTop = window.innerHeight - 60;
          var boundedTop = Math.max(50, Math.min(newTop, maxTop));
          fab.style.top = boundedTop + 'px';
          if (e.preventDefault) e.preventDefault();
        }
        if (e.stopPropagation) e.stopPropagation();
      };

      var onDragEnd = function(e) {
        if (!isDragging) return;
        isDragging = false;
        if (moved) {
          try {
            localStorage.setItem('ultimatter_fab_top', fab.getBoundingClientRect().top);
          } catch (err) {}
        } else {
          openDrawer();
        }
        resetDimTimer();
        if (e.stopPropagation) e.stopPropagation();
      };

      // Pointer Events (Modern Standard)
      if (window.PointerEvent) {
        fab.addEventListener('pointerdown', onDragStart, { capture: true });
        window.addEventListener('pointermove', onDragMove, { capture: true, passive: false });
        window.addEventListener('pointerup', onDragEnd, { capture: true });
        window.addEventListener('pointercancel', onDragEnd, { capture: true });
      } else {
        // Fallback to Touch & Mouse
        fab.addEventListener('touchstart', onDragStart, { capture: true, passive: true });
        window.addEventListener('touchmove', onDragMove, { capture: true, passive: false });
        window.addEventListener('touchend', onDragEnd, { capture: true });
        fab.addEventListener('mousedown', onDragStart, { capture: true });
        window.addEventListener('mousemove', onDragMove, { capture: true });
        window.addEventListener('mouseup', onDragEnd, { capture: true });
      }

      var openDrawer = function() {
        backdrop.style.display = 'flex';
        renderDrawerList();
      };

      window.__ultimatterCloseDrawer = function() {
        backdrop.style.display = 'none';
      };

      backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) window.__ultimatterCloseDrawer();
      });

      var renderDrawerList = function() {
        var list = document.getElementById('ultimatterAgentList');
        if (!list) return;

        fetch('/api/bridge-status')
          .then(function(res) { return res.json(); })
          .then(function(data) {
            var agents = data.agents || [];
            
            var hubCardHtml = 
              '<div class="ultimatter-agent-item" style="border-color:#bae6fd;background:#f0f9ff;" onclick="window.location.assign(\\'/hub\\')">' +
                '<div class="ultimatter-item-left">' +
                  '<div class="ultimatter-item-icon">🏠</div>' +
                  '<div>' +
                    '<div class="ultimatter-item-name" style="color:#0369a1;">Ultimatter Hub</div>' +
                    '<div class="ultimatter-item-sub" style="color:#0284c7;">All Active Agents & Status</div>' +
                  '</div>' +
                '</div>' +
                '<button class="ultimatter-badge-switch" style="background:#0284c7;">Open Hub ↗</button>' +
              '</div>';

            if (agents.length === 0) {
              list.innerHTML = hubCardHtml + '<div style="text-align:center;padding:12px;color:#64748b;font-size:12px;">No other agents active on PC</div>';
              return;
            }

            // Read selected_agent cookie
            var currentAgent = '';
            try {
              var match = document.cookie.match(/selected_agent=([^;]+)/);
              if (match) currentAgent = decodeURIComponent(match[1]);
            } catch (e) {}

            var agentCardsHtml = agents.map(function(a) {
              var isCurrent = (currentAgent && currentAgent === a.id) || (!currentAgent && a.id === agents[0].id);
              return (
                '<div class="ultimatter-agent-item ' + (isCurrent ? 'current' : '') + '" onclick="window.__ultimatterSwitch(\\'' + a.id + '\\')">' +
                  '<div class="ultimatter-item-left">' +
                    '<div class="ultimatter-item-icon">' + (a.icon || '🤖') + '</div>' +
                    '<div>' +
                      '<div class="ultimatter-item-name">' + a.name + '</div>' +
                      '<div class="ultimatter-item-sub">:' + a.port + '</div>' +
                    '</div>' +
                  '</div>' +
                  (isCurrent 
                    ? '<span class="ultimatter-badge-active">✓ Current</span>' 
                    : '<button class="ultimatter-badge-switch">Switch →</button>') +
                '</div>'
              );
            }).join('');

            list.innerHTML = hubCardHtml + agentCardsHtml;
          })
          .catch(function() {
            list.innerHTML = 
              '<div class="ultimatter-agent-item" style="border-color:#bae6fd;background:#f0f9ff;" onclick="window.location.assign(\\'/hub\\')">' +
                '<div class="ultimatter-item-left">' +
                  '<div class="ultimatter-item-icon">🏠</div>' +
                  '<div>' +
                    '<div class="ultimatter-item-name" style="color:#0369a1;">Ultimatter Hub</div>' +
                    '<div class="ultimatter-item-sub" style="color:#0284c7;">Go to Hub</div>' +
                  '</div>' +
                '</div>' +
                '<button class="ultimatter-badge-switch" style="background:#0284c7;">Open Hub ↗</button>' +
              '</div>';
          });
      };

      window.__ultimatterSwitch = function(agentId) {
        fetch('/api/switch-agent?id=' + encodeURIComponent(agentId), { method: 'POST' })
          .then(function() {
            window.location.assign('/');
          })
          .catch(function() {
            window.location.assign('/');
          });
      };
    })();
  </script>
</div>
<!-- End Ultimatter Floating Edge Bubble -->
`;
};

/**
 * Injects the floating bubble snippet into the agent's HTML page before </body>.
 * 
 * @param {string} html - Raw HTML from the upstream agent
 * @returns {string} Modified HTML containing the floating bubble
 */
const injectBubble = (html) => {
  if (typeof html !== 'string' || !html.includes('</body>')) {
    return html;
  }
  if (html.includes('id="ultimatter-bubble-root"')) {
    return html;
  }
  const snippet = getBubbleSnippet();
  return html.replace('</body>', `${snippet}\n</body>`);
};

module.exports = {
  getBubbleSnippet,
  injectBubble
};
