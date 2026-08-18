# 🚀 Ultimate Antimatter Bridge

The **Ultimate Antimatter Bridge** is a low-latency, cryptographically secure HTTP/2 reverse proxy and gateway that bridges the **Antigravity IDE** on your PC natively to your mobile device or tablet.

By multiplexing network traffic over high-performance **HTTP/2**, Antimatter bypasses mobile browser connection limits, giving you desktop-class speed, instant file tree browsing, zero UI lag, and native touchscreen responsiveness.

---

## ✨ Features

* **⚡ HTTP/2 Multiplexing:** Eliminates mobile browser connection bottlenecks and UI freezes.
* **🪟 Standalone Desktop GUI:** Double-clicking the binary automatically launches a dedicated, distraction-free control panel window.
* **🌐 Dual Connection Modes:**
  * **🏠 Local Wi-Fi:** Instant speed on your local network using pre-bundled `mkcert v1.4.4` TLS certificates.
  * **🌍 Tailscale MagicDNS:** Global P2P WireGuard connectivity via your `*.ts.net` domain with native Let's Encrypt TLS certificates (100% trusted green padlock on mobile).
* **🧭 Interactive Tailscale Smart Guide:** Real-time OS-specific guide for Linux, macOS, and Windows with 1-click command copying.
* **📲 1-Click Root CA Installation:** Direct button on the dashboard to install `rootCA.pem` onto iOS/Android for a permanent green padlock on local Wi-Fi.
* **🔄 Single-Instance Lifecycle:** Running or double-clicking the app again instantly re-opens your control panel without interrupting your active phone session.
* **🛡️ Enterprise Security:** 256-bit cryptographic access tokens, HMAC-SHA256 signed session cookies, and in-memory rate limiting against brute-force attacks.
* **🔍 Dynamic IDE Auto-Discovery:** Silently watches for the Antigravity IDE language server port and hot-reconnects automatically.

---

## 🚀 Quick Start

### 1. Run the Standalone Binary
Simply run (or double-click) the compiled executable:

```bash
./bin/antimatter
```

A dedicated control panel window will pop open on your desktop (`http://localhost:5865/dashboard`).

### CLI Options:
| Flag | Description |
| :--- | :--- |
| `--headless` | Run bridge in background without launching a desktop GUI window |
| `-v`, `--version` | Print Antimatter version (`v1.0.0`) and exit |
| `-h`, `--help` | Show CLI help message and exit |

### 2. Connect Your Phone
1. Choose **🏠 Local Wi-Fi** or **🌍 Tailscale MagicDNS** on the dashboard.
2. Scan the displayed vector QR code with your phone camera or browser.
3. Code with full desktop speed on your mobile device!

---

## 🧪 Automated Testing

Antimatter includes a zero-dependency automated test suite using Node's native test runner (`node:test`):

```bash
npm test
```
Executes unit tests across Authentication, IP Rate Limiting, Path Configurations, and Vector QR Code Generation in <250ms.

---

## 📦 Zero-Dependency Architecture

Antimatter is packaged as a completely self-contained binary:

| Component | Status | Description |
| :--- | :--- | :--- |
| **Node.js Runtime** | ✅ Built-in | Embedded inside the standalone executable. |
| **Local TLS (`mkcert`)** | ✅ Built-in | Official `v1.4.4` binaries pre-compressed for Linux, macOS, and Windows. |
| **Vector QR Code Engine** | ✅ Built-in | Real-time SVG vector rendering. |
| **Web Control Panel** | ✅ Built-in | Embedded dark-mode UI with live status polling. |

---

## 🛠️ Multi-Platform Compilation

You can build standalone binaries for Linux, macOS, and Windows:

```bash
# Build for current machine (Linux x64)
npm run build

# Build specific platform binaries
npm run build:linux   # -> bin/antimatter-linux-x64
npm run build:mac     # -> bin/antimatter-macos-arm64
npm run build:win     # -> bin/antimatter-windows-x64.exe

# Build all platforms at once
npm run build:all
```

---

## 🔐 Security & Privacy

* **Localhost-Only GUI:** The desktop dashboard is bound strictly to `127.0.0.1:5865` and cannot be accessed from external networks.
* **Encrypted Remote Tunnel:** Remote mobile connections are strictly encrypted via TLS / HTTP/2 on port `5864`.
* **Zero-Knowledge Architecture:** No telemetry, no third-party cloud relays, and no external tracking. All traffic stays strictly between your PC and your mobile device.
