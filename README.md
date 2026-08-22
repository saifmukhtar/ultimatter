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
Download the standalone application for your platform from **[GitHub Releases](https://github.com/saifmukhtar/ultimatter/releases)**:
* **Linux:** Double-click `Ultimatter-x86_64.AppImage` (runs native window and integrates into your system application menu).
* **macOS:** Open `Ultimatter.app`.
* **Windows:** Double-click `ultimatter-windows-x64.exe`.

> 💡 **Headless / Server Mode:** If running on a remote headless Linux server or Docker container without a GUI, launch with the `--headless` flag:
> ```bash
> ./ultimatter-linux-x64 --headless
> ```

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

## 🛡️ Security & Threat Model

| Security Invariant | Implementation & Defense Mechanism |
| :--- | :--- |
| **Brute-Force Defense** | 256-bit token entropy ($2^{256}$ combinations) paired with an active in-memory rate limiter enforcing 15-minute lockouts after 20 strikes (with 1-second burst debouncing). |
| **Timing-Attack Immunity** | All token and cookie verifications execute in constant time via Node's native `crypto.timingSafeEqual()`. |
| **CSRF & Origin Isolation** | Upstream requests strictly rewrite `Origin`, `Host`, and `Referer` headers *only* after cryptographic authentication succeeds. Cookies enforce `SameSite=Lax`. |
| **XSS Protection** | Session tokens are transmitted exclusively via `HttpOnly` signed cookies, preventing client-side script theft. |
| **LAN Isolation (Lockdown)** | 1-click **LAN Lockdown** switch on the desktop control panel instantly denies all incoming Tailscale connections (`100.x.y.z`, `fd7a:`, `*.ts.net`) with `403 Forbidden`. |
| **Restricted Host Storage** | All tokens, keys, and session secrets are stored in `~/.config/ultimatter/` with strict POSIX `0o700` directory and `0o600` file permissions. |

---

## ❓ Frequently Asked Questions (FAQs)

<details>
<summary><strong>1. What is Ultimatter and how does it fit into the Antimatter ecosystem?</strong></summary>
<br>
Ultimatter is the zero-touch, standalone desktop-to-mobile gateway built for the Antimatter ecosystem and AI coding agents (Google Antigravity & OpenCode). Unlike complex cloud setups or remote tunneling services, Ultimatter requires zero cloud accounts, zero third-party relay servers, and zero modifications to your local IDE. It acts as an intelligent outer gateway, providing instant peer-to-peer mobile browser & PWA access with native touchscreen optimizations over local Wi-Fi or 5G.
</details>

<details>
<summary><strong>2. Does running Ultimatter on my desktop cause high CPU or battery drain?</strong></summary>
<br>
<strong>No (0.0% Idle CPU).</strong> Ultimatter uses <em>zero-fork kernel inspection</em> (`/proc/net/tcp` in RAM on Linux) with adaptive polling backoff. It does not spawn background shell processes or language servers, maintaining 0.0% CPU overhead while waiting for connections.
</details>

<details>
<summary><strong>3. How does the mobile virtual keyboard auto-docking work?</strong></summary>
<br>
Standard web IDEs suffer from mobile virtual keyboards covering the prompt box or code diff view. Ultimatter dynamically intercepts the HTML stream and injects <code>interactive-widget=resizes-content</code> and <code>viewport-fit=cover</code>. When the virtual keyboard opens, the viewport dynamically contracts so the prompt input and chat buttons stay pinned directly above the keyboard.
</details>

<details>
<summary><strong>4. Do I need to install any plugins or modify Google Antigravity / OpenCode?</strong></summary>
<br>
<strong>Zero modifications.</strong> Ultimatter follows the <em>Zero-Touch Outer Gateway</em> pattern. It communicates with agents over loopback sockets (`127.0.0.1`) and never touches, modifies, or installs files in your IDE directories. Updating or restarting your agents will never break Ultimatter.
</details>

---

## 🔐 Privacy
100% private and peer-to-peer. Zero third-party clouds, zero telemetry tracking, and zero remote data collection. All communication is strictly encrypted point-to-point.
