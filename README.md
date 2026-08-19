# 🚀 Ultimatter

**Ultimatter** is a low-latency, cryptographically secure HTTP/2 reverse proxy and desktop gateway that bridges your local AI coding agents directly to your phone, tablet, or browser with **100% true 1:1 desktop feature parity**.

By multiplexing network traffic over high-performance **HTTP/2**, Ultimatter eliminates connection bottlenecks, giving you desktop-class speed, instant file tree browsing, zero UI lag, and full touchscreen responsiveness.

---

## 🏗️ Decoupled Zero-Touch Architecture

Ultimatter is **100% architecturally decoupled and fully detached** from the Antigravity IDE and other coding agents. It requires **zero plugins, zero extensions, and zero modifications to the IDE codebase on disk**.

```
┌───────────────────────────┐         ┌───────────────────────────┐
│     📱 Mobile Phone       │         │    🚀 ULTIMATTER          │
│   (Safari / Chrome PWA)   │         │ (Standalone Daemon Proxy) │
└─────────────┬─────────────┘         └─────────────┬─────────────┘
              │                                     │
              │ 🔒 HTTPS / HTTP/2 (Port 5864)       │
              └────────────────────────────────────►│
                                                    │ 1. 256-bit Cryptographic Auth
                                                    │ 2. Scans OS for active port
                                                    │ 3. Proxies WebSockets & HTTP/2
                                                    ▼
                                      ┌───────────────────────────┐
                                      │   💻 ANTIGRAVITY IDE      │
                                      │  (Local Language Server)  │
                                      │   e.g. 127.0.0.1:45981    │
                                      └───────────────────────────┘
```

### 🔍 How Decoupling Works:

1. **OS-Level Socket Auto-Discovery ([`lib/network.js`](lib/network.js)):**  
   Ultimatter queries OS-level listening sockets (`ss -tlnp` on Linux, `lsof` on macOS, `Get-NetTCPConnection` on Windows) to automatically discover the dynamic port of any listening `language_server` process on localhost (e.g. `45981`).
2. **Transparent Outer Proxying ([`lib/proxy.js`](lib/proxy.js)):**  
   Ultimatter acts as an external secure gateway on port `5864`. It authenticates mobile connections, attaches 30-day cryptographic session cookies, and forwards raw HTTP/2 and WebSocket traffic to the local IDE language server.
3. **Works Even When the IDE is Closed:**  
   If Ultimatter is running while the IDE is offline, it serves a lightweight holding page on your phone that auto-reconnects as soon as the IDE process launches.
4. **Update-Proof & Crash-Resistant:**  
   Because Ultimatter never alters the IDE's binaries or files, IDE updates and restarts will never break your mobile connection.

---

## ✨ Features

* **💯 100% 1:1 Desktop Parity Out-of-the-Box:** Access full IDE settings, model selection, reasoning thought process, subagents, MCP tools, file editor, and terminal natively without the limitations and bugs of mobile clones.
* **📱 True Standalone PWA Engine:** Injects Apple & Android web app meta tags for a true full-screen mobile app experience with zero browser address bar clutter.
* **🕊️ Minimal & Elegant Light Dashboard:** Clean Apple/Stripe-inspired interface with real-time telemetry, live status radar, and responsive controls.
* **🔀 Local Wi-Fi Dual Selector:**
  * **📍 Direct IP (Universal):** Instant zero-configuration connection on all Android and iOS devices.
  * **🏷️ .local Domain (Persistent):** Customizable mDNS hostname (`ultramarine.local`) with inline rename support and platform guidance for Apple (Bonjour native) and Android (Private DNS).
* **🌍 Tailscale MagicDNS:** Global P2P WireGuard connectivity via your `*.ts.net` domain with native Let's Encrypt TLS certificates (100% trusted green padlock on mobile over 5G).
* **🛡️ Remote Access Switch (LAN Lockdown):** 1-click toggle to pause incoming Tailscale connections and restrict Ultimatter to local Wi-Fi only.
* **🔄 Instant Session Revocation:** 1-click token reset button that invalidates all active session cookies across all connected phones.
* **⚡ 20-Attempt Rate Limiter & 1-Click Unban:** Advanced brute-force firewall with 1-second burst debouncing and a 1-click unban button in the desktop UI.
* **📲 1-Click Root CA Installation:** Direct dashboard download of `rootCA.pem` for permanent local Wi-Fi green padlock trust on iOS and Android.
* **🔍 Dynamic Port Auto-Discovery:** Silently watches for active IDE port changes and hot-reconnects automatically.

---

## 📱 PWA Superpower (Add to Home Screen)

You don't need to install custom APKs or wait for App Store reviews. For a true native, full-screen mobile app experience:

* **iOS (Safari):** Open your Ultimatter QR link $\rightarrow$ Tap the **Share** icon $\rightarrow$ Select **"Add to Home Screen"**.
* **Android (Chrome / Brave):** Open your Ultimatter QR link $\rightarrow$ Tap the **Menu (⋮)** $\rightarrow$ Select **"Install App"** or **"Add to Home screen"**.

This runs the full desktop interface in dedicated full-screen mode with native mobile gestures and zero browser URL bar distractions!

---

## 🚀 Quick Start

### 1. Run the Standalone Binary
Simply run (or double-click) the compiled executable:

```bash
./bin/ultimatter
```

A dedicated control panel window will pop open on your desktop (`http://localhost:5865/dashboard`).

### CLI Options:
| Flag | Description |
| :--- | :--- |
| `--headless` | Run in background without launching a desktop GUI window |
| `-v`, `--version` | Print Ultimatter version (`v1.0.0`) and exit |
| `-h`, `--help` | Show CLI help message and exit |

### 2. Connect Your Phone
1. Choose **🏠 Local Wi-Fi** or **🌍 Tailscale MagicDNS** on the dashboard.
2. Scan the displayed vector QR code with your phone camera or browser.
3. Code with full desktop speed on your mobile device!

---

## 🗺️ Universal Multi-Agent Roadmap

Ultimatter is designed as the **Universal Mobile Gateway for ALL AI Desktop Agents**:

| AI Agent / IDE | Integration Mode | Status |
| :--- | :--- | :---: |
| **Google Antigravity (`ag` / `ag2`)** | Native Web Workbench Proxy & Auto-discovery | ✅ **Supported** |
| **Cursor IDE** | Web Workbench Port Proxy (`--serve-web`) | 🚧 **In Development** |
| **Claude Code (`claude`)** | Embedded Touch-Friendly Web Terminal (`xterm.js`) | 🚧 **In Development** |
| **Windsurf & OpenCode** | Web Remote IDE Tunneling | 📅 **Planned** |
| **Aider & OpenHands** | Local Web UI Multi-Device Gateway | 📅 **Planned** |
| **Multi-Agent Target Selector** | 1-Click Agent Switcher inside Desktop GUI | 📅 **Planned** |

---

## 🧪 Automated Testing

Ultimatter includes a zero-dependency automated test suite using Node's native test runner (`node:test`):

```bash
npm test
```
Executes **32 unit tests** across Authentication, Cryptographic Expiry, IP Rate Limiting, PWA Manifest, Path Configurations, and Vector QR Code Generation in <250ms with zero warnings.

---

## 📦 Zero-Dependency Architecture

Ultimatter is packaged as a completely self-contained binary:

| Component | Status | Description |
| :--- | :--- | :--- |
| **Node.js Runtime** | ✅ Built-in | Embedded inside the standalone executable. |
| **Local TLS (`mkcert`)** | ✅ Built-in | Official `v1.4.4` binaries pre-compressed for Linux, macOS, and Windows. |
| **Vector QR Code Engine** | ✅ Built-in | Real-time SVG vector rendering. |
| **Web Control Panel** | ✅ Built-in | Embedded light-mode UI with live status polling. |

---

## 🛠️ Multi-Platform Compilation

You can build standalone binaries for Linux, macOS, and Windows:

```bash
# Build for current machine (Linux x64)
npm run build

# Build specific platform binaries
npm run build:linux   # -> bin/ultimatter-linux-x64
npm run build:mac     # -> bin/ultimatter-macos-arm64
npm run build:win     # -> bin/ultimatter-windows-x64.exe

# Build all platforms at once
npm run build:all

# Package release archive (.tar.gz)
npm run pack:release
```

---

## 🔐 Security & Privacy

* **Localhost-Only GUI:** The desktop dashboard is bound strictly to `127.0.0.1:5865` and cannot be accessed from external networks.
* **Encrypted Remote Tunnel:** Remote mobile connections are strictly encrypted via TLS / HTTP/2 on port `5864`.
* **Zero-Knowledge Architecture:** No telemetry, no third-party cloud relays, and no external tracking. All traffic stays strictly between your PC and your mobile device.
