# 🏛️ Ultimatter Architecture Blueprint

> **High-Level System Engineering, Topology, and Execution Flow Specification**  
> Ultimatter is a decoupled, zero-touch mobile gateway for **Google Antigravity** and **OpenCode**.

---

## 1. Architectural Philosophy: The Zero-Touch Outer Gateway

Ultimatter is designed around a single architectural principle: **The Zero-Touch Outer Gateway**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              📱 CLIENT LAYER                                │
│           iOS (Safari Standalone PWA) / Android (Chrome PWA)                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                  🔒 Dual-Channel TLS  │ (Port 5864: Local Wi-Fi & 5G Tailscale)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        🚀 ULTIMATTER GATEWAY DAEMON                         │
│                                                                             │
│  ┌──────────────────────────────┐        ┌───────────────────────────────┐  │
│  │   256-Bit Auth Engine &      │        │     Brute-Force Firewall      │  │
│  │   5s Session Micro-Cache     │◄──────►│   (20 Strikes + 1s Debounce)  │  │
│  └──────────────┬───────────────┘        └───────────────────────────────┘  │
│                 │                                                           │
│                 ▼                                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                HTTP/2 & WebSocket Reverse Proxy Engine                │  │
│  │   • SNI Multi-Cert Routing (mkcert / Tailscale MagicDNS)              │  │
│  │   • One-Time QR Token Handshake & Clean URL Redirect                  │  │
│  │   • Mobile Agent Hub at Root (`/`)                                    │  │
│  │   • Streaming HTML Adaptation (Keyboard Auto-Docking + 0ms Tap Delay) │  │
│  │   • Persistent TCP Connection Pools (TCP_NODELAY + Keep-Alive)       │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼────────────────────────────────────┐  │
│  │           Zero-Fork In-Memory Kernel Socket Discovery                 │  │
│  │     • In-Memory /proc/net/tcp Fingerprinting (0.0% Idle CPU)          │  │
│  │     • Two-Stage Active HTTPS/HTTP Probe & Adaptive Backoff            │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                       │
               ⚡ HTTP/1.1 + WebSocket ├───► 🛸 Google Antigravity (:43675)
               (Loopback Connection)   └───► 👐 OpenCode (:4096)
```

### Core Design Principles
* **100% Decoupled (Zero-Touch):** Ultimatter does not patch, modify, or inject plugins into IDE or agent files on disk. It runs strictly as an external daemon in user space.
* **Update & Crash Proof:** Because Ultimatter communicates strictly over loopback TCP sockets (`127.0.0.1`), updating or restarting Antigravity/OpenCode never breaks the mobile bridge.
* **Direct Real-Time Stream:** Bridges your mobile device directly to the active agent process on your PC—no cloud relays, no mockups, no third-party web clones.
* **Pure Workbench View:** Delivers the full-screen IDE experience with zero DOM overlays or floating bubbles obstructing minimaps or terminal drawers.

---

## 2. End-to-End Execution Flow & Lifecycle

```
[User Launches Binary]
       │
       ▼
1. Native Rust Wry Desktop Window boots & verifies loopback daemon
       │
       ▼
2. Gateway inspects Linux Kernel (/proc/net/tcp) in memory (0.0% CPU)
       │
       ▼
3. Active Agents Auto-Discovered (Antigravity :43675 / OpenCode :4096)
       │
       ▼
4. Dual-Channel TLS Server binds Port 5864 (SNI: Local Wi-Fi & 5G Tailscale)
       │
       ▼
5. Phone Scans Desktop QR Code (Native Camera or In-Browser Scanner)
       │
       ▼
6. 1-Time Token Exchange → 30-Day HMAC-SHA256 Cookie → Clean URL Redirect (/)
       │
       ▼
7. Full-Screen Mobile Workbench with Virtual Keyboard Auto-Docking (< 200ms Roaming)
```

---

## 3. The 5 Core Execution Stages

### Stage 1: Bootstrap & Single-Instance Loopback Lock
1. **Desktop GUI Initialization:** On launch, the native Rust Wry/Tao window starts and inspects `127.0.0.1:5865` for an active instance.
2. **Automatic Daemon Supervision:** If no gateway is running, the supervisor spawns the internal backend binary with `--headless` and establishes a local loopback lock.
3. **Graceful IPC Termination:** Clicking "Quit Ultimatter" sends an IPC event through Tao's event loop (`ControlFlow::Exit`), releasing all ports and shutting down cleanly.

---

### Stage 2: Zero-Fork In-Memory Agent Discovery
Traditional tools spawn shell child processes (`ss`, `lsof`, `netstat`) in a loop, causing CPU spikes and battery drain. Ultimatter implements **zero-fork kernel inspection**:

1. **Kernel Socket Fingerprinting:** Reads `/proc/net/tcp` and `/proc/net/tcp6` directly in memory to compute a 32-bit MurmurHash socket fingerprint.
2. **0-Fork Steady State:** If the kernel socket table is unchanged, child process execution is completely bypassed (**0.0% CPU usage**).
3. **Two-Stage Active Verification:** When socket changes are detected, candidate ports are probed via non-blocking HTTP/HTTPS handshakes to distinguish real agent workbenches from raw TCP language servers (like `gopls` or `rust-analyzer`).
4. **Adaptive Backoff:** Polling intervals dynamically scale from 1.5s during startup to 10s during steady state.

---

### Stage 3: Dual-Channel TLS & SNI Transport Layer
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

* **Local Wi-Fi:** Uses local `mkcert` TLS certificates with direct IP and mDNS `.local` domain support. Includes a **1-tap Root CA download card** (`rootCA.pem` / `rootCA.crt`) for zero-warning HTTPS on mobile.
* **Global 5G (Tailscale MagicDNS):** Automatically detects `*.ts.net` SNI handshakes to serve globally trusted Let's Encrypt certificates over peer-to-peer WireGuard mesh tunnels.

---

### Stage 4: Zero-Trust Authentication & Clean URL Handshake
* **One-Time QR Token Handshake:** Scanning the desktop QR code transmits a 256-bit cryptographic token. The gateway validates the token, issues a 30-day signed HMAC-SHA256 session cookie (`mobile_auth`), and issues a `302 Found` redirect to `/`.
* **Clean Address Bar & PWA Shortcuts:** The token is immediately stripped from the browser URL, ensuring PWA home screen shortcuts and bookmarks remain clean (`https://<ip>:5864/`).
* **5-Second Auth Micro-Cache:** Repeat token/cookie cryptographic validations are micro-cached in memory for 5 seconds, dropping repeat verification latency to **0.001ms** during high-concurrency asset loading.

---

### Stage 5: Streaming HTML Adaptation & PWA Mobile Runtime
When proxying the IDE workbench to mobile devices, Ultimatter dynamically adapts the HTML stream on-the-fly:

1. **Virtual Keyboard Auto-Docking:** Injects `<meta name="viewport" content="... interactive-widget=resizes-content, viewport-fit=cover">` so virtual keyboards resize the viewport and never cover prompt inputs or code diffs.
2. **0ms Touch Response:** Injects `touch-action: manipulation;` to eliminate the 300ms mobile browser tap delay.
3. **Safe-Area Notch Adaptation:** Injects CSS variables (`--sat`, `--sab`, `--sal`, `--sar`) via `env(safe-area-inset-*)` for seamless edge-to-edge iOS and Android displays.
4. **Sub-200ms Network Roaming:** Injects client-side event listeners that immediately re-arm WebSockets when transitioning between 5G and Home Wi-Fi without page refreshes.

---

## 4. Protocol Routing & Performance Engineering

| Traffic Type | Protocol Path | Transport Strategy |
| :--- | :--- | :--- |
| **Static Assets & Code Files** | `HTTP/2 Multiplexing` | Persistent keep-alive TCP pools (`httpAgent` / `httpsAgent`, max 128 sockets) with zero-byte 304 ETag caching. |
| **Live Thought Streams & Terminals** | `Raw WebSocket Duplex` | Bypasses HTTP/2 encapsulation via Node `upgrade` event into direct full-duplex TCP tunnels with `TCP_NODELAY` (disables Nagle's buffering). |
| **Mobile Agent Hub** | `Fast Router at /` | 1-tap switching between active agents (`/agent/:id`) with automatic `selected_agent` cookie persistence. |
