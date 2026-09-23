# Ultimatter

> **Universal Mobile Gateway SDK** — wrap any local web service or AI agent with encrypted mobile access, QR pairing, and a native PWA in seconds.

[![npm version](https://img.shields.io/npm/v/ultimatter.svg?style=flat-square)](https://www.npmjs.com/package/ultimatter)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Platform: Linux · macOS · Windows](https://img.shields.io/badge/Platform-Linux%20%C2%B7%20macOS%20%C2%B7%20Windows-lightgrey?style=flat-square)]()

<br>

<p align="center">
  <img src="assets/main_menu.png" width="320" alt="Ultimatter Desktop Control Panel" />
&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="assets/mobile_hub.png" width="160" alt="Ultimatter Mobile Hub" />
</p>

---

## What is Ultimatter?

Ultimatter is **two things in one**:

### 1. 📦 A Node.js SDK / Library
`npm install ultimatter` — wrap any local port with a secure, mobile-ready HTTPS gateway in 3 lines of code. Works with any web service: local dev servers, AI agents, internal tools, dashboards.

### 2. 🖥️ A Standalone Desktop App
Download the pre-built binary for your OS. Point-and-click mobile gateway for your AI coding agents — **Google Antigravity**, **OpenCode**, and **CloudCLI** — with auto-discovery, QR pairing, and a live Mobile Hub.

---

## SDK Quick Start

```bash
npm install ultimatter
```

```javascript
const { createMobileGateway } = require('ultimatter');

// Wrap any local port with HTTPS, QR pairing, and mobile access
await createMobileGateway({
  target: 3000,          // Local port or URL to proxy
  name:   'My Dev App',  // Friendly name shown on the Mobile Hub
  icon:   '🛠️',         // Emoji icon for the Mobile Hub card
  printQr: true,         // Print QR code to terminal on startup
});
```

That's it. Ultimatter will:
- Generate a local TLS certificate (via mkcert) for zero-warning HTTPS
- Start an HTTP/2 reverse proxy on port `5864`
- Launch a Mobile Hub dashboard at the root (`/`)
- Print a QR code to your terminal to pair your phone instantly

### SDK Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `number \| string` | — | Local port number or URL to proxy (e.g. `3000`, `'http://localhost:8080'`) |
| `name` | `string` | `'Ultimatter App'` | Display name shown on the Mobile Hub |
| `icon` | `string` | `'⚡'` | Emoji icon for the agent card |
| `printQr` | `boolean` | `false` | Print QR code to terminal |
| `token` | `string` | auto-generated | Custom 64-char hex auth token |
| `port` | `number` | `5864` | Override the proxy port |
| `enableTailscale` | `boolean` | `true` | Enable Tailscale MagicDNS TLS |
| `enableHub` | `boolean \| 'auto'` | `'auto'` | Show Mobile Hub at root |

### Programmatic API

```javascript
const {
  createMobileGateway,  // High-level SDK — wrap a target in seconds
  startProxy,           // Low-level: start the HTTP/2 proxy engine directly
  updateTargets,        // Live-update the proxy target list without restart
  network,              // Network utilities: getLocalIp, generateSSLCertificate, getTailscaleDns
  auth,                 // Auth engine: token validation, session management
  security,             // Security: rate limiter, IP banning
} = require('ultimatter');
```

---

## Standalone App

Download the pre-built binary for your platform from **[GitHub Releases](https://github.com/saifmukhtar/ultimatter/releases)**:

| Platform | Binary | Notes |
|----------|--------|-------|
| 🐧 Linux | `Ultimatter-x86_64.AppImage` | Native GUI + embedded backend. Double-click to run. |
| 🐧 Linux (headless) | `ultimatter-linux-x64` | Single binary for servers / CI. Run with `--headless`. |
| 🍎 macOS (Apple Silicon) | `Ultimatter.app` / `ultimatter-macos-arm64` | Standalone bundle. Requires `codesign --sign - ./ultimatter-macos-arm64` on first run. |
| 🪟 Windows | `ultimatter-windows-x64.exe` | Standalone executable with embedded icon. |

```bash
# Headless server / Docker / CI
./ultimatter-linux-x64 --headless

# Custom port wrapping via CLI
./ultimatter-linux-x64 --port 8080 --name "My API"
```

### Connecting Your Phone

1. **Scan the QR code** on the desktop control panel with your phone camera.
2. Accept the Root CA certificate prompt (one-time, downloaded from the Mobile Hub).
3. Tap **Share → Add to Home Screen** (iOS) or **Install App** (Android) to install as a full-screen PWA.
4. Tap any agent card on the Mobile Hub to enter the full-screen session.

---

## Supported AI Agents

Ultimatter auto-discovers running agent processes on your machine via in-memory OS-level port inspection (zero CPU overhead). No plugins, no config files.

<p align="center">
  <img src="assets/agents.png" width="300" alt="Agent Manager showing Google Antigravity, OpenCode, and CloudCLI" />
</p>

| Agent | Discovery | Default Port |
|-------|-----------|-------------|
| 🛸 **Google Antigravity** | Auto | `:33353` |
| 👐 **OpenCode** | Auto (`opencode web`) | `:4096` |
| 🧠 **CloudCLI** (Anthropic Claude) | Auto | `:3001` |

### Google Antigravity

Full agent UI, reasoning streams, subagents, MCP tool workflows — all accessible on your phone over local Wi-Fi or 5G.

<p align="center">
  <img src="assets/antigravity.png" width="200" alt="Google Antigravity on mobile via Ultimatter" />
</p>

### Tailscale MagicDNS (5G Remote Access)

Access your agents from anywhere over a direct WireGuard peer-to-peer tunnel with globally trusted Let's Encrypt certificates — no cloud relay, no port forwarding.

<p align="center">
  <img src="assets/tailscale.png" width="300" alt="Tailscale MagicDNS mode in Ultimatter" />
</p>

---

## Architecture & Philosophy

Ultimatter follows the **Zero-Touch Outer Gateway** pattern:

```
📱 Phone (iOS/Android PWA)
        │
        │  HTTPS + 256-bit Auth (Port 5864)
        ▼
┌─────────────────────────────┐
│   Ultimatter Gateway Daemon │
│                             │
│  ┌─────────────────────┐   │
│  │  Auth + Rate Limiter │   │
│  └──────────┬──────────┘   │
│             │               │
│  ┌──────────▼──────────┐   │
│  │ HTTP/2 Reverse Proxy │   │
│  │ + WebSocket Bridge   │   │
│  └──────────┬──────────┘   │
│             │               │
│  ┌──────────▼──────────┐   │
│  │  Zero-Fork OS Port   │   │
│  │  Auto-Discovery      │   │
│  └──────────┬──────────┘   │
└─────────────┼───────────────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
Antigravity OpenCode  CloudCLI
 :33353      :4096     :3001
```

**Key principles:**
- 🔌 **Zero plugins** — never modifies or installs into your agent directories
- 🔍 **Zero-fork discovery** — reads `/proc/net/tcp` in RAM; 0.0% idle CPU
- 🛡️ **Crash-proof** — restarting or updating an agent never interrupts the gateway
- 🔒 **Zero cloud** — 100% peer-to-peer, no telemetry, no remote relay

Read [ARCHITECTURE.md](ARCHITECTURE.md) for the full technical deep-dive.

---

## Security Model

| Invariant | Implementation |
|-----------|----------------|
| **Brute-force defense** | 256-bit token entropy, 15-min IP ban after 20 strikes |
| **Timing-attack immunity** | `crypto.timingSafeEqual()` on all auth checks |
| **CSRF isolation** | `Origin`/`Host`/`Referer` rewritten only post-auth; `SameSite=Lax` cookies |
| **XSS protection** | Tokens transmitted exclusively via `HttpOnly` signed cookies |
| **LAN lockdown** | 1-click toggle blocks all Tailscale connections with `403 Forbidden` |
| **Restricted storage** | Secrets stored in `~/.config/ultimatter/` with `0o700`/`0o600` permissions |

---

## Development

```bash
# Run test suite (45 unit tests)
npm test

# Start gateway from source
node bin/cli.js

# Build all platform binaries
npm run build:all

# Build Linux AppImage only
npm run build:appimage
```

---

## FAQ

<details>
<summary><strong>Is Ultimatter only for AI agents?</strong></summary>
<br>
No. Ultimatter is a general-purpose mobile gateway library. Use it to wrap any local web service — a dev server, an internal dashboard, a home lab tool — with secure HTTPS, QR pairing, and PWA support. The AI agent auto-discovery is a bonus feature of the standalone app.
</details>

<details>
<summary><strong>Does it require modifying Antigravity, OpenCode, or CloudCLI?</strong></summary>
<br>
<strong>Zero modifications.</strong> Ultimatter communicates with agents over loopback sockets (<code>127.0.0.1</code>) and never touches your IDE directories. Updating or restarting an agent will never break the gateway.
</details>

<details>
<summary><strong>Does it cause CPU or battery drain?</strong></summary>
<br>
<strong>0.0% idle CPU.</strong> Agent discovery uses in-memory <code>/proc/net/tcp</code> inspection (Linux) with adaptive polling backoff — no child processes, no shell spawning.
</details>

<details>
<summary><strong>How does the mobile virtual keyboard auto-docking work?</strong></summary>
<br>
Ultimatter intercepts the HTML stream and injects <code>interactive-widget=resizes-content</code> and <code>viewport-fit=cover</code>. When the virtual keyboard opens, the viewport contracts so prompt inputs and chat buttons stay pinned directly above the keyboard.
</details>

---

## Privacy

100% private and peer-to-peer. Zero third-party clouds, zero telemetry, zero remote data collection. All communication is encrypted point-to-point between your desktop and phone.

---

## License

[MIT](LICENSE) © Saif Mukhtar
