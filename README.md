# 🚀 Ultimatter

> **The Ultimate Mobile Gateway for Antigravity**  
> Run Antigravity directly on your phone with **100% true desktop parity** and zero latency.

---

## ⚡ Quick Start (20 Seconds)

> 📦 **Zero-Dependency Standalone Executable:** No Node.js, Python, or external runtime required. Everything is self-contained.  
> 📥 **[Download Latest Binary from GitHub Releases](https://github.com/saifmukhtar/ultimatter/releases)** or build from source.

### 1. Launch Ultimatter
```bash
./bin/ultimatter
```
A sleek control panel will open on your desktop (`http://localhost:5865/dashboard`).

### 2. Connect Your Phone
* Scan the displayed **QR code** with your phone's camera or browser.
* Tap **"Add to Home Screen"** (iOS) or **"Install App"** (Android) to run it as a full-screen mobile app!

---

## ✨ Key Highlights

* 💯 **100% Native Desktop Parity:** Full IDE settings, model selection, reasoning thought process, subagents, MCP tools, and terminals.
* 📱 **True Standalone PWA:** Runs full-screen on iOS & Android with zero browser address bar clutter.
* ⚡ **HTTP/2 & WireGuard Speed:** Ultra-low latency multiplexed stream over Local Wi-Fi or 5G (Tailscale MagicDNS).
* 🛡️ **Zero-Trust Security:** 256-bit cryptographic tokens, timestamped HMAC session cookies, and brute-force rate limiting.
* 🕊️ **Minimal Control Panel:** 1-click token reset, remote access toggle, and local `.local` domain management.

---

## 🏗️ Zero-Touch Decoupled Architecture

Ultimatter is **100% independent and detached** from Antigravity:

* 🔌 **Zero Plugins Required:** It does not modify, patch, or install anything inside Antigravity files on disk.
* 🔍 **OS-Level Auto-Discovery:** Silently detects the active Antigravity port automatically.
* 🛡️ **Crash & Update Proof:** Updating or restarting Antigravity will never break your mobile connection.
* 🏛️ **Full Details:** Read the complete [ARCHITECTURE.md](ARCHITECTURE.md) for in-depth design specifications.

---

## 🛠️ Development & Tests

```bash
# Run automated test suite (32 unit tests)
npm test

# Build standalone binary for Linux
npm run build

# Build for all platforms (Linux, macOS, Windows)
npm run build:all
```

---

## 🔐 Privacy
100% private and peer-to-peer. No third-party clouds, no external tracking, and zero telemetry.
