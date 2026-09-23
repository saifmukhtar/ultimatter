# Ultimatter

> **Universal Mobile Gateway SDK** — wrap any local web service or AI agent with encrypted mobile access, QR pairing, and a native PWA in seconds.

[![npm version](https://img.shields.io/npm/v/ultimatter.svg?style=flat-square)](https://www.npmjs.com/package/ultimatter)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%C2%B7%20macOS%20%C2%B7%20Windows-lightgrey?style=flat-square)]()

---

## What is Ultimatter?

Ultimatter is **two things in one**:

**📦 An npm library** — install it in any Node.js project and wrap any local port with secure mobile HTTPS access, QR pairing, and a live Mobile Hub in 3 lines of code.

**🖥️ A standalone desktop app** — a pre-built native GUI for Linux, macOS, and Windows. It auto-discovers your running AI coding agents (Google Antigravity, OpenCode, CloudCLI), generates a pairing QR code, and gives you full mobile browser + PWA access with zero configuration.

It works without modifying your agents, without cloud accounts, and without any configuration files. Everything runs locally, peer-to-peer.

---

## Desktop Control Panel

<p align="center">
  <img src="assets/main_menu.png" width="300" alt="Ultimatter Desktop Control Panel" />
</p>

The desktop control panel is a small, always-on-top native window that sits alongside your IDE. From here you can:

- **Remote Access toggle** — instantly pause or resume all mobile access with one click
- **QR Code** — your phone scans this once to pair. The QR refreshes if you reset the token or your network IP changes
- **Local Wi-Fi / Tailscale MagicDNS tabs** — switch between LAN-only mode (fast, local) and 5G remote access via Tailscale (anywhere in the world, peer-to-peer WireGuard)
- **Direct IP / .local Domain sub-tabs** — choose between raw IP (`https://192.168.x.x:5864`) or the mDNS `.local` hostname
- **Copy Link** — copy the connection URL directly to your clipboard
- **Reset Token** — invalidates all existing sessions and generates a fresh 256-bit auth token
- **Agents** — open the agent manager (see below)

---

## AI Agent Manager

<p align="center">
  <img src="assets/agents.png" width="300" alt="AI Agent Manager modal" />
</p>

The agent manager shows every supported AI coding agent and whether it is currently active on your machine. Ultimatter discovers agent processes automatically using in-memory OS-level port inspection — no plugins, no config files, no background CPU usage.

| Agent | Status | Details |
|-------|--------|---------|
| 🛸 **Google Antigravity** | Online — detected on `:33353` | Full IDE, reasoning streams, subagents, MCP tools |
| 👐 **OpenCode** | Offline | Start with `opencode web`, auto-detected on `:4096` |
| 🧠 **CloudCLI** (Anthropic Claude) | Offline | Auto-detected on `:3001` |

You can enable or disable individual agents directly from this panel. Disabled agents are hidden from the Mobile Hub on your phone.

---

## Mobile Hub

<p align="center">
  <img src="assets/mobile_hub.png" width="220" alt="Ultimatter Mobile Hub on Android" />
</p>

After scanning the QR code, your phone lands on the **Ultimatter Mobile Hub** — a clean, card-based dashboard that shows:

- **System Vitals card** — live CPU % and RAM usage of your desktop machine, updated in real time
- **Agent cards** — one card per active agent with an **Open →** button that launches the full agent IDE in mobile-optimized full-screen view
- **Root CA certificate card** — one-tap download of `ultimatter.pem` (or `.crt`) to install as a trusted certificate on your phone. This is required once for zero-warning HTTPS on local Wi-Fi
- **Install as Mobile App prompt** — tap Share → Add to Home Screen (iOS) or Install App (Android) to add Ultimatter as a full-screen PWA with no browser chrome

---

## Tailscale MagicDNS (5G Remote Access)

<p align="center">
  <img src="assets/tailscale.png" width="300" alt="Tailscale MagicDNS tab in Ultimatter" />
</p>

Switch to the **Tailscale MagicDNS** tab to access your agents from anywhere — not just your local Wi-Fi. Ultimatter detects your Tailscale connection automatically and generates a QR code with a globally valid Let's Encrypt certificate for your Tailscale hostname.

No cloud relay, no port forwarding, no VPN setup on your phone. It uses Tailscale's WireGuard peer-to-peer tunnel directly. If Tailscale is installed but not logged in, Ultimatter shows the exact command to run and flips to the QR view automatically once connected.

---

## SDK Quick Start

```bash
npm install ultimatter
```

```javascript
const { createMobileGateway } = require('ultimatter');

await createMobileGateway({
  target:  3000,        // local port or URL to proxy
  name:    'My App',    // display name on the Mobile Hub
  icon:    '🛠️',       // emoji icon for the agent card
  printQr: true,        // print QR code to terminal on startup
});
// → Generates local TLS cert, starts HTTPS proxy on :5864, prints QR code
```

Works with any local web service — a dev server, an internal dashboard, a home automation tool. The Mobile Hub, QR pairing, PWA install, and 256-bit auth all come included.

See **[LIBRARY.md](LIBRARY.md)** for the full API reference, all options, and more examples.

---

## Standalone App

Download for your platform from **[GitHub Releases](https://github.com/saifmukhtar/ultimatter/releases)**:

| Platform | Binary |
|----------|--------|
| 🐧 Linux (Desktop) | `Ultimatter-x86_64.AppImage` |
| 🐧 Linux (Headless / Server) | `ultimatter-linux-x64` |
| 🍎 macOS | `Ultimatter.app` |
| 🪟 Windows | `ultimatter-windows-x64.exe` |

```bash
# Headless mode — no GUI, runs as a background daemon
./ultimatter-linux-x64 --headless

# Wrap a specific port via CLI
./ultimatter-linux-x64 --port 8080 --name "My API"
```

---

## Architecture & Docs

- 📐 **[ARCHITECTURE.md](ARCHITECTURE.md)** — full system topology, execution flow, security model, and component breakdown
- 📦 **[LIBRARY.md](LIBRARY.md)** — full SDK reference, all options, low-level API, and examples

---

# Star History

<a href="https://www.star-history.com/?repos=saifmukhtar%2Fultimatter&type=date&logscale=&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=saifmukhtar/ultimatter&type=date&theme=dark&logscale&legend=bottom-right" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=saifmukhtar/ultimatter&type=date&logscale&legend=bottom-right" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=saifmukhtar/ultimatter&type=date&logscale&legend=bottom-right" />
 </picture>
</a>

---

## License

[Apache 2.0](LICENSE) © Saif Mukhtar
