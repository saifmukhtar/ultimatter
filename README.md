# 🚀 Ultimatter

> **High-Performance Mobile Gateway for Google Antigravity & OpenCode**  
> Access, monitor, and interact with the exact same AI coding agents running on your desktop PC directly from your phone — over local Wi-Fi or 5G with zero cloud dependencies.

---

## 💡 What is Ultimatter?

Ultimatter is a lightweight, zero-dependency gateway designed specifically for **Google Antigravity** and **OpenCode**. 

Instead of running a stripped-down mobile client or third-party web clone, Ultimatter establishes an encrypted, low-latency bridge directly to the active agent sessions on your desktop. You get **the exact same workspace, tools, subagents, and live reasoning streams** running on your PC, beautifully adapted for mobile touchscreens with zero screen clutter.

---

## ✨ Features

### 🤖 First-Class Agent Support
* 🛸 **Google Antigravity:** Full agent UI, reasoning thought process streams, subagents, and MCP tool workflows.
* 👐 **OpenCode:** Instant mobile web access (`opencode web`) with automatic port discovery.
* 🏠 **Ultimatter Mobile Hub (Root `/`):** Live status cards for all active agents, 1-tap launching, and fast switching.

### 📱 Pure Full-Screen Mobile & PWA Experience
* 🎯 **100% Pure Native IDE (Zero Overlays):** Clean workbench view with zero floating buttons or DOM overlays blocking editor minimaps, scrollbars, or terminal drawers.
* 📱 **Virtual Keyboard Auto-Docking:** Injects `interactive-widget=resizes-content` and `viewport-fit=cover` so virtual keyboards never obscure prompt boxes or code diffs.
* ⚡ **0ms Touch Response:** Injects `touch-action: manipulation` to eliminate the 300ms mobile tap delay.
* 📲 **Clean PWA Launcher:** Install to your iOS or Android home screen with clean base URLs (`https://<ip>:5864/`) and zero token clutter in your address bar or bookmarks.

### 🛡️ Zero-Trust Security & Clean Onboarding
* 🔒 **One-Time QR Token Handshake:** Scan the dynamic desktop QR code once to automatically establish a 30-day signed HMAC session cookie and redirect to a clean, token-free URL.
* 🛡️ **Active Rate Limiting & Banning:** Automatically blocks brute-force attempts with debounced 15-minute IP bans.
* 🏠 **LAN-Only Lockdown:** 1-click toggle on the desktop control panel to pause remote connections and isolate access strictly to local Wi-Fi.

### ⚡ Performance & Low Latency
* 🚀 **HTTP/2 Multiplexing & Connection Pooling:** Persistent TCP socket pools with `TCP_NODELAY` and keep-alive streaming.
* 🔄 **Instant Network Roaming:** Seamlessly switches between 5G and Home Wi-Fi with instant WebSocket auto-reconnect (< 200ms) without page refreshes.
* 🔋 **Zero Idle Overhead (0.0% CPU):** Zero-fork kernel socket fingerprinting (`/proc/net/tcp`) that inspects sockets in memory without spawning child processes.
* ⚡ **Micro-Cached Session Auth:** 5-second in-memory session cache dropping repeat cryptographic auth latency to 0.001ms.

### 🌍 Universal Connectivity
* 🏠 **Local Wi-Fi:** Direct IP and mDNS `.local` domain support with a **1-tap Root CA download card** on the Mobile Hub (`rootCA.pem` and `rootCA.crt`) for zero-warning HTTPS on mobile.
* 🌍 **5G Remote Access (Tailscale MagicDNS):** Direct peer-to-peer WireGuard tunnels with globally trusted Let's Encrypt certificates.
* 🖥️ **Native Desktop Window:** Single unified executable featuring a native desktop GUI window (`Tao` + `Wry`) with official dock icon integration.

---

## ⚡ Quick Start

> 📦 **Single Unified Standalone Executable:** Everything is self-contained in a single native binary (4.0MB).

### 1. Launch Ultimatter
Download the latest executable for your OS from **[GitHub Releases](https://github.com/saifmukhtar/ultimatter/releases)**:

* **Desktop (Windows / macOS / Linux):** Simply launch the executable. Ultimatter will automatically open its **native desktop Control Panel window** with embedded status and vector QR code:
  ```bash
  ./ultimatter-linux-x64
  ```
* **Server / Headless Mode:** Run with the `--headless` flag to start Ultimatter as a background service without opening a desktop GUI window:
  ```bash
  ./ultimatter-linux-x64 --headless
  ```

### 2. Connect Your Phone
1. Scan the **QR Code** displayed on the desktop control panel with your phone's camera.
2. The phone automatically validates the token, sets a 30-day session cookie, and redirects to the clean **Mobile Hub** (`https://<ip>:5864/`).
3. Tap **Share &rarr; Add to Home Screen** (iOS Safari) or **Install App** (Android Chrome) to launch Ultimatter as a full-screen mobile app.
4. Tap any active agent card (`🛸 Google Antigravity` or `👐 OpenCode`) to enter the full-screen IDE session.

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
# Run comprehensive automated test suite (44 unit tests)
npm test

# Build standalone binary for Linux
npm run build:linux

# Build for all platforms (Linux, macOS, Windows)
npm run build:all

# Package release tarball
npm run pack:release
```

---

## 🔐 Privacy
100% private and peer-to-peer. Zero third-party clouds, zero data logging, and zero external telemetry.
