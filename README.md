# 🚀 Ultimatter

> **High-Performance Mobile Gateway for Google Antigravity & OpenCode**  
> Access, monitor, and interact with the exact same AI coding agents running on your desktop PC directly from your phone — over local Wi-Fi or 5G with zero cloud dependencies.

---

## 💡 What is Ultimatter?

Ultimatter is a lightweight, zero-dependency gateway designed specifically for **Google Antigravity** and **OpenCode**. 

Instead of running a stripped-down mobile client or third-party web clone, Ultimatter establishes an encrypted, low-latency bridge directly to the active agent sessions on your desktop. You get **the exact same workspace, tools, subagents, and live reasoning streams** running on your PC, beautifully adapted for mobile touchscreens.

---

## ✨ Features

### 🤖 First-Class Agent Support
* 🛸 **Google Antigravity:** Full agent UI, reasoning thought process streams, subagents, and MCP tool workflows.
* 👐 **OpenCode:** Instant mobile web access (`opencode web`) with automatic port discovery.
* 🔄 **Ultimatter Mobile Hub:** Seamlessly switch between active agents running on your PC with 1 tap or via the optional floating edge switcher bubble.

### 📱 Tailored Mobile & PWA Experience
* 🎨 **Apple HIG Design System:** Clean, soft-light UI with fluid spring animations (`cubic-bezier(0.16, 1, 0.3, 1)`) and 8px backdrop blur.
* 📱 **Virtual Keyboard Auto-Docking:** Injects `interactive-widget=resizes-content` and `viewport-fit=cover` so mobile keyboards never obscure prompt boxes or code diffs.
* ⚡ **0ms Touch & Micro-Haptics:** Injects `touch-action: manipulation` to eliminate the 300ms mobile tap delay, paired with 8ms subtle micro-haptic feedback.
* 📲 **True Standalone PWA:** Install to your iOS or Android home screen with zero browser address bar clutter.

### ⚡ Performance & Low Latency
* 🚀 **HTTP/2 Multiplexing & Connection Pooling:** Persistent TCP socket pools with `TCP_NODELAY` and keep-alive streaming.
* 🔄 **Instant Network Roaming:** Seamlessly switches between 5G and Home Wi-Fi with instant WebSocket auto-reconnect (< 200ms) without page refreshes.
* 🔋 **Zero Idle Overhead (0.0% CPU):** Zero-fork kernel socket fingerprinting (`/proc/net/tcp`) that inspects sockets in memory without spawning child processes.
* ⚡ **Micro-Cached Session Auth:** 5-second in-memory session cache dropping repeat cryptographic auth latency to 0.001ms.

### 🛡️ Zero-Trust Security
* 🔒 **256-Bit Cryptographic Security:** Protected by high-entropy tokens and signed timestamped HMAC session cookies (30-day persistence).
* 🛡️ **Active Rate Limiting & Banning:** Automatically blocks brute-force attempts with debounced 15-minute IP bans.
* 🏠 **LAN-Only Toggle:** 1-click toggle on the desktop control panel to pause remote connections and isolate access to local Wi-Fi.

### 🌍 Seamless Connectivity
* 🏠 **Local Wi-Fi:** Direct IP and mDNS `.local` domain support with downloadable Root CA certificate for clean HTTPS on mobile.
* 🌍 **5G Remote Access (Tailscale MagicDNS):** Direct peer-to-peer WireGuard tunnels with globally trusted Let's Encrypt certificates.
* 💡 **Smart Self-Healing Diagnostics:** Dynamic desktop control panel that detects your OS and provides 1-click copyable terminal commands for agents and network services.

---

## ⚡ Quick Start

> 📦 **Zero-Dependency Standalone Executable:** No Node.js, Python, or external runtime required. Everything is self-contained in a single native binary.

### 1. Launch Ultimatter
Download the latest executable for your OS from **[GitHub Releases](https://github.com/saifmukhtar/ultimatter/releases)**:

* **Desktop (Windows / macOS / Linux):** Simply double-click the executable. The desktop control panel will automatically launch in your browser.
* **Server / Headless Mode:** Run with the `--headless` flag to start Ultimatter as a background service without opening a browser window:
  ```bash
  ./ultimatter --headless
  ```

### 2. Connect Your Phone
1. Scan the **QR Code** displayed on the desktop control panel with your phone's camera.
2. Tap **Share &rarr; Add to Home Screen** (iOS Safari) or **Install App** (Android Chrome) to launch Ultimatter as a full-screen mobile app.

---

## 🏗️ Architecture & Philosophy

Ultimatter is **100% decoupled** from your IDE and agent environments:

* 🔌 **Zero Plugins Required:** Does not modify, patch, or install anything inside Antigravity or OpenCode directories.
* 🔍 **OS-Level Auto-Discovery:** Silently discovers active local agent ports in memory without background CPU usage.
* 🛡️ **Crash & Update Proof:** Updating or restarting Antigravity/OpenCode never interrupts the host gateway.
* 🏛️ **Full Specifications:** Read [ARCHITECTURE.md](ARCHITECTURE.md) for deep-dive technical details.

---

## 🛠️ Development & Testing

```bash
# Run comprehensive automated test suite (50 unit tests)
npm test

# Build standalone binary for Linux
npm run build:linux

# Build for all platforms (Linux, macOS, Windows)
npm run build:all
```

---

## 🔐 Privacy
100% private and peer-to-peer. Zero third-party clouds, zero data logging, and zero external telemetry.
