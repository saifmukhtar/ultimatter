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
* 🔒 **One-Time QR Token Handshake:** Scan the dynamic desktop QR code with your native phone camera or the 1-tap in-browser camera scanner to establish a 30-day signed HMAC session cookie and redirect to a clean, token-free URL.
* 🛑 **1-Click Clean Shutdown:** Dedicated **"Quit Ultimatter"** action on the desktop control panel to gracefully terminate all network bridges, release ports, and exit cleanly with zero leftover background processes.
* 🛡️ **Active Rate Limiting & Banning:** Automatically blocks brute-force attempts with debounced 15-minute IP bans.
* 🏠 **LAN-Only Lockdown:** 1-click toggle on the desktop control panel to pause remote connections and isolate access strictly to local Wi-Fi.

### ⚡ Performance & Low Latency
* 🚀 **HTTP/2 Multiplexing & Connection Pooling:** Persistent TCP socket pools with `TCP_NODELAY` and keep-alive streaming.
* 🔄 **Instant Network Roaming:** Seamlessly switches between 5G and Home Wi-Fi with instant WebSocket auto-reconnect (< 200ms) without page refreshes.
* 🔋 **Zero Idle Overhead (0.0% CPU):** Zero-fork kernel socket fingerprinting (`/proc/net/tcp`) that inspects sockets in memory without spawning child processes.
* ⚡ **Micro-Cached Session Auth:** 5-second in-memory session cache dropping repeat cryptographic auth latency to 0.001ms.

### 🌍 Universal Connectivity & Multi-Platform Releases
* 🏠 **Local Wi-Fi:** Direct IP and mDNS `.local` domain support with a **1-tap Root CA download card** on the Mobile Hub (`rootCA.pem` and `rootCA.crt`) for zero-warning HTTPS on mobile.
* 🌍 **5G Remote Access (Tailscale MagicDNS):** Direct peer-to-peer WireGuard tunnels with globally trusted Let's Encrypt certificates.
* 📦 **100% Self-Contained Releases:** 
  * 🐧 **Linux AppImage (`Ultimatter-x86_64.AppImage`):** Native Rust Wry/Tao desktop GUI + bundled backend engine with embedded icon and 1-click auto desktop integration.
  * 🐧 **Linux Bare Binary (`ultimatter-linux-x64`):** Standalone single-file binary for headless servers & CLI.
  * 🍎 **macOS Bundle (`Ultimatter.app` & `ultimatter-macos-arm64`):** Standalone Apple Silicon app with embedded `AppIcon.icns` and ad-hoc codesigning.
  * 🪟 **Windows (`ultimatter-windows-x64.exe`):** Standalone executable with embedded `.ico` resource.

---

## ⚡ Quick Start

### 1. Launch Ultimatter
Download the standalone executable for your operating system from **[GitHub Releases](https://github.com/saifmukhtar/ultimatter/releases)**:

* **Linux (Desktop):** Download and double-click `Ultimatter-x86_64.AppImage` (runs native Rust Wry GUI and integrates automatically with your system menu):
  ```bash
  ./Ultimatter-x86_64.AppImage
  ```
* **Linux (Server / Headless):** Run the standalone binary with `--headless`:
  ```bash
  ./ultimatter-linux-x64 --headless
  ```
* **macOS:** Open `Ultimatter.app` or run `./ultimatter-macos-arm64`.
* **Windows:** Double-click `ultimatter-windows-x64.exe`.

### 2. Connect Your Phone
1. Scan the **QR Code** displayed on the desktop control panel with your phone's camera (or open `https://<ip>:5864` on your phone and tap **Scan QR Code with Camera**).
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
# Run comprehensive automated test suite (45 unit tests)
npm test

# Build Linux self-contained AppImage (Native Rust GUI + Backend)
npm run build:appimage

# Build standalone Linux raw binary
npm run build:linux

# Build for all platforms (AppImage, Linux, macOS, Windows)
npm run build:all
```

---

## 🔐 Privacy
100% private and peer-to-peer. Zero third-party clouds, zero data logging, and zero external telemetry.
