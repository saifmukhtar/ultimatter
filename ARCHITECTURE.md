# 🏛️ Ultimatter Architecture Blueprint

This document details the internal architecture, network engineering, and component interactions of **Ultimatter** — the decoupled mobile gateway for **Google Antigravity** and **OpenCode**.

---

## 1. Architectural Philosophy

Ultimatter is built on the **Zero-Touch Outer Gateway** pattern:

* **100% Decoupled:** Ultimatter does not patch, modify, or inject plugins into Antigravity or OpenCode on disk. It runs as an independent daemon in user space.
* **Update-Proof:** Because Ultimatter communicates strictly over loopback TCP sockets (`127.0.0.1`), IDE updates, restarts, or crashes will never corrupt or break the mobile bridge.
* **Direct Real-Time Access:** Connects your mobile browser directly to the exact live AI agent processes on your machine with zero mockups or third-party web clones.
* **Pure Full-Screen Workbench:** Delivers an uncluttered, native IDE experience with zero injected DOM bubbles or screen overlays.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              📱 CLIENT LAYER                                │
│           iOS (Safari Standalone PWA) / Android (Chrome PWA)                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                        🔒 TLS / HTTP/2 │ (Port 5864)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         🚀 ULTIMATTER DAEMON GATEWAY                        │
│                                                                             │
│  ┌──────────────────────────────┐        ┌───────────────────────────────┐  │
│  │   256-Bit Auth Engine &      │        │    Brute-Force Firewall       │  │
│  │ 5s Session Micro-Cache       │◄──────►│   (20 Strikes + 1s Debounce)  │  │
│  └──────────────┬───────────────┘        └───────────────────────────────┘  │
│                 │                                                           │
│                 ▼                                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                HTTP/2 & WebSocket Reverse Proxy Engine                │  │
│  │   • SNI Multi-Cert Handler (mkcert / Let's Encrypt MagicDNS)          │  │
│  │   • One-Time QR Token Handshake & Clean URL Redirect                  │  │
│  │   • Mobile Agent Hub at Root (`/`)                                    │  │
│  │   • Persistent TCP Connection Pools (TCP_NODELAY + Keep-Alive)       │  │
│  │   • Mobile Viewport Tuning (interactive-widget=resizes-content)       │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼────────────────────────────────────┐  │
│  │          Zero-Fork Kernel Socket Discovery & Agent Router             │  │
│  │     • In-Memory /proc/net/tcp Fingerprinting (0.0% Idle CPU)          │  │
│  │     • Two-Stage Active HTTPS/HTTP Probe & Adaptive Backoff            │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
              ⚡ HTTP/1.1 + WebSocket ├───► 🛸 Google Antigravity (:43675)
              (Loopback Connection)   └───► 👐 OpenCode (:4096)
```

---

## 2. Core Component Breakdown

| Module | File | Primary Responsibility |
| :--- | :--- | :--- |
| **Native Desktop GUI** | [`desktop/src/main.rs`](desktop/src/main.rs) | Cross-platform Tao event loop + Wry WebKit webview with GTK dock icon integration. |
| **Process Supervisor** | [`desktop/src/supervisor.rs`](desktop/src/supervisor.rs) | Automatic daemon lifecycle management, port probe, and graceful child process termination. |
| **CLI & Lifecycle** | [`index.js`](index.js) | Single-instance socket lock, signal handling, and desktop/headless lifecycle. |
| **Reverse Proxy Core** | [`lib/proxy.js`](lib/proxy.js) | HTTP/2 multiplexing, SNI certificate routing, token handshake redirect, and WebSocket duplex streaming. |
| **Mobile Agent Hub** | [`lib/hub.js`](lib/hub.js) | Mobile agent launcher at root (`/`), live status cards, 1-tap switching, and Root CA downloads. |
| **Network & Discovery** | [`lib/network.js`](lib/network.js) | Zero-fork `/proc/net/tcp` socket fingerprinting, adaptive backoff, and multi-agent target definitions (`AGENT_TARGETS`). |
| **Cryptographic Auth** | [`lib/auth.js`](lib/auth.js) | 256-bit token generator, HMAC-SHA256 cookie signer, and 5-second in-memory session micro-caching. |
| **Security Firewall** | [`lib/security.js`](lib/security.js) | Brute-force rate limiter, 1-second burst debouncing, dual-stack IP normalizer, and instant unban registry. |
| **Mobile PWA & Viewport** | [`lib/pwa.js`](lib/pwa.js) | Virtual keyboard auto-docking injection, notch safe-area CSS, and network roaming auto-reconnect (< 200ms). |
| **Desktop Control Panel** | [`lib/dashboard.js`](lib/dashboard.js) | Vector SVG QR generators, live status telemetry, and OS-tailored smart diagnostic assistant. |
| **Config & Storage** | [`lib/config.js`](lib/config.js) | Secure path resolutions with `0o700` directory and `0o600` secret file permissions. |

---

## 3. Deep Dive: Key Subsystems

### A. Zero-Fork Kernel Socket Fingerprinting ([`lib/network.js`](lib/network.js))
Unlike traditional tools that continuously spawn child processes (`ss`, `lsof`, `netstat`) causing CPU spikes and battery drain, Ultimatter implements **zero-fork kernel inspection**:

1. **In-Memory `/proc/net/tcp` Fingerprinting:** On Linux, Ultimatter reads `/proc/net/tcp` and `/proc/net/tcp6` directly in memory to compute a 32-bit MurmurHash socket fingerprint.
2. **0-Fork Steady State:** If the kernel socket table is unchanged, child process forks are completely bypassed, resulting in **0.0% CPU usage and zero fork churn**.
3. **Adaptive Backoff:** Polling intervals dynamically adapt from 1.5 seconds during startup to 10 seconds in steady state.
4. **Two-Stage Active Probe:** Candidate ports are verified with active HTTP/HTTPS handshakes to distinguish agent workbenches from raw TCP language servers (such as `gopls` or `rust-analyzer`).

---

### B. Mobile Agent Hub at Root (`/`) & Clean URL Handshake ([`lib/proxy.js`](lib/proxy.js) & [`lib/hub.js`](lib/hub.js))
* **One-Time QR Token Handshake:** When scanning the QR code containing `?token=...`, the proxy verifies the token, sets a 30-day signed HMAC session cookie (`mobile_auth`), and issues a clean `302 Found` redirect to `/`.
* **Clean Address Bar & Bookmarks:** Browser address bars and PWA shortcuts maintain clean URLs (`https://<ip>:5864/`) with zero token query strings.
* **Target Definitions:**
  * 🛸 **Google Antigravity:** Port `43675` (or dynamic candidate scanned from `language_server`).
  * 👐 **OpenCode:** Port `4096` (`opencode web`).
* **Fast Agent Switching:** Tapping any agent card on the Hub launches that agent directly at `/agent/:id` with full mobile viewport tuning.

---

### C. Pure Full-Screen Native IDE Experience
To preserve precious mobile screen real estate and maximize battery life:
* **Zero DOM Injections:** No floating overlays or Shadow DOM buttons cover up editor minimaps, scrollbars, or bottom terminal action bars.
* **Zero Polling Overhead:** Eliminates continuous background polling inside the active IDE session.
* **System Gesture Navigation:** Users simply swipe back or tap the browser back button to return to the **Hub** at any time.

---

### D. Mobile Touch & Viewport Tuning ([`lib/pwa.js`](lib/pwa.js))
* **Virtual Keyboard Auto-Docking:** Injects `<meta name="viewport" content="... interactive-widget=resizes-content, viewport-fit=cover">` so mobile virtual keyboards cleanly dock above prompt inputs and code diffs without obscuring content.
* **Safe-Area Notch Insets:** Injects CSS variables (`--sat`, `--sab`, `--sal`, `--sar`) using `env(safe-area-inset-*)` for edge-to-edge iOS and Android displays.
* **0ms Touch Response:** Injects `touch-action: manipulation;` to eliminate the default 300ms mobile browser tap delay.
* **Overscroll Containment:** Injects `overscroll-behavior-y: contain;` to prevent accidental page pull-to-refresh when scrolling terminal or code buffers.

---

### E. Latency Optimization & Network Roaming Auto-Reconnect ([`lib/proxy.js`](lib/proxy.js) & [`lib/pwa.js`](lib/pwa.js))
* **TCP Socket Tuning:** Inbound and outbound sockets set `socket.setNoDelay(true)` (disables Nagle's algorithm) and `socket.setKeepAlive(true, 15000)`.
* **Persistent Connection Pooling:** Upstream proxying utilizes dedicated `http.Agent` and `https.Agent` pools (`maxSockets: 128`, `keepAliveMsecs: 30000`).
* **Sub-200ms Network Roaming:** Injects client-side `online` and `visibilitychange` event listeners that immediately re-arm WebSockets when transitioning between 5G and Home Wi-Fi without reloading the page.
* **Session Cookie Micro-Caching:** 5-second in-memory auth micro-cache reduces crypto verification time to 0.001ms during high-frequency asset bursts.

---

### F. Dual-Channel Transport & SNI Routing ([`lib/proxy.js`](lib/proxy.js))
Ultimatter binds a single secure port `5864` supporting both local Wi-Fi and global 5G connections seamlessly via **Server Name Indication (SNI)**:

```
                          ┌──────────────────────────┐
                          │ Incoming Client on :5864 │
                          └────────────┬─────────────┘
                                       │
                        Is SNI Hostname a *.ts.net?
                                      / \
                                     /   \
                             YES    /     \   NO
                                   /       \
                                  ▼         ▼
             ┌─────────────────────────┐   ┌─────────────────────────┐
             │ Tailscale TLS Context   │   │ Local mkcert TLS Context│
             │ (Native Let's Encrypt)  │   │ (IP & .local Hostnames) │
             └─────────────────────────┘   └─────────────────────────┘
```

* **HTTP/2 Multiplexing:** Asset requests, file trees, and web streams multiplex concurrently over binary HTTP/2 frames.
* **Raw WebSocket Duplex Tunnels:** Live language server event streams, AI agent thought processes, and integrated terminals bypass HTTP/2 encapsulation via Node's `upgrade` event handler to establish raw, full-duplex TCP tunnels.

---

### G. Smart Context-Aware Diagnostics & 4s Micro-Cache ([`lib/dashboard.js`](lib/dashboard.js) & [`lib/network.js`](lib/network.js))
The desktop control panel continuously monitors the local environment to provide actionable self-healing guidance:
* **0 Agents Running:** Shows 1-click copyable quick start command (`opencode web`) and Antigravity launch guide.
* **Tailscale Diagnostics:** Dynamically detects host OS (`linux`, `darwin`, `win32`) to provide the exact 1-line command (`sudo tailscale up` or installer link).
* **4-Second State Micro-Cache:** Tailscale network states are micro-cached for 4 seconds in memory, eliminating synchronous CLI blocking and dropping status polling latency from 2,000ms to **2ms**.

---

### H. Dual-Format Root CA Serving & Mobile Hub Download ([`lib/network.js`](lib/network.js) & [`lib/hub.js`](lib/hub.js))
To provide a seamless, zero-warning HTTPS experience on local Wi-Fi:
* **Instant Path Resolution:** `getRootCaPath()` directly checks standard OS CAROOT directories (`~/.local/share/mkcert/`, `~/Library/Application Support/mkcert/`, `%LOCALAPPDATA%/mkcert/`) in 0ms without spawning child processes.
* **Public Cert HTTPS Endpoints:**
  * `/api/ca.pem` & `/api/rootCA.pem` $\rightarrow$ Serves standard `rootCA.pem`.
  * `/api/ca.crt` & `/api/rootCA.crt` $\rightarrow$ Serves direct `.crt` format for Android Certificate Installers.
* **Cryptographic Isolation:** Private keys (`rootCA-key.pem`) remain strictly locked in host OS private storage (`-r--------`) and are never exposed or served over the network.

---

### I. Single Unified Binary Architecture ([`desktop/`](desktop/))
* **Native Desktop Window:** Built with Rust (`tao` + `wry`), embedding a clean WebKit webview directly inside native GTK / Cocoa / Win32 containers.
* **Zero WebKit 'W' Default:** GTK window pixbufs and FreeDesktop `.desktop` entries register the official Ultimatter vector icon for desktop launchers and KDE/GNOME dock matching.
* **Headless Background Server:** Running with `--headless` starts Ultimatter purely in the background for remote servers, Docker containers, and systemd services.

---

## 4. Threat Model & Security Invariants

| Attack Vector | Mitigation Strategy |
| :--- | :--- |
| **Brute-Force Attacks** | 256-bit token entropy ($2^{256}$ combinations) + in-memory IP rate limiter with 15-minute lockout and 1s debouncing. |
| **Timing Attacks** | All cryptographic comparisons use constant-time `crypto.timingSafeEqual()`. |
| **Cross-Origin / CSRF** | Proxied requests rewrite `Origin`/`Host` strictly after cryptographic authentication. Cookies enforce `SameSite=Lax`. |
| **XSS Cookie Theft** | Session cookies are protected with the `HttpOnly` flag. |
| **Unauthorized Remote Access** | 1-click **LAN Lockdown** switch on the control panel blocks incoming Tailscale connections (`100.x.y.z`, `fd7a:`, `*.ts.net`) with `403 Forbidden`. |
| **File System Leakage** | All persistent keys and tokens are stored in `~/.config/ultimatter/` with restricted `0o700` and `0o600` permissions. |
