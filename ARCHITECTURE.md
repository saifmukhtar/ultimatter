# 🏛️ Ultimatter Architecture Blueprint

This document details the internal architecture, network engineering, and component interactions of **Ultimatter** — the universal, decoupled mobile gateway for AI desktop agents.

---

## 1. Architectural Philosophy

Ultimatter is built on the **Zero-Touch Outer Gateway** pattern:

* **100% Decoupled:** Ultimatter does not patch, modify, or inject plugins into the AI agent or IDE on disk. It runs as an independent daemon in user space.
* **Update-Proof:** Because Ultimatter communicates strictly over loopback TCP sockets (`127.0.0.1`), IDE updates, restarts, or crashes will never corrupt or break the mobile bridge.
* **Universal Protocol Translation:** Converts modern mobile HTTP/2 requests from Safari and Chrome into the upstream language server's expected HTTP/1.1 and WebSocket formats.

```
┌─────────────────────────────────────────────────────────────┐
│                       📱 CLIENT LAYER                       │
│    iOS (Safari Standalone PWA) / Android (Chrome PWA)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
               🔒 TLS / HTTP/2 │ (Port 5864)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 🚀 ULTIMATTER DAEMON GATEWAY                │
│                                                             │
│  ┌──────────────────────┐        ┌───────────────────────┐  │
│  │   256-Bit Auth &     │        │  Brute-Force Firewall │  │
│  │ Timestamped Cookies  │◄──────►│ (20 Strikes + Debounce)│ │
│  └──────────┬───────────┘        └───────────────────────┘  │
│             │                                               │
│             ▼                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │        HTTP/2 & WebSocket Reverse Proxy Engine        │  │
│  │   • SNI Multi-Cert Handler (mkcert / Let's Encrypt)   │  │
│  │   • PWA & Online Network Shim Stream Interception     │  │
│  │   • Upstream Header Normalizer (Host/Origin/Referer)  │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                               │
│  ┌──────────────────────────▼────────────────────────────┐  │
│  │     OS-Level Socket Discovery & Two-Stage Probing     │  │
│  │     (Polls ss / lsof / PowerShell + HTTPS Probe)      │  │
│  └──────────────────────────┬────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │
              ⚡ HTTP/1.1 + WS │ (https://127.0.0.1:45981)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 💻 LOCAL AI AGENT BACKEND                   │
│         Antigravity IDE / Language Server Process           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Component Breakdown

| Module | File | Primary Responsibility |
| :--- | :--- | :--- |
| **CLI & Lifecycle** | [`index.js`](index.js) | CLI argument parsing, single-instance lock, and process daemonization. |
| **Reverse Proxy Core** | [`lib/proxy.js`](lib/proxy.js) | HTTP/2 secure server, SNI certificate router, WebSocket upgrade tunnels, and response transformation. |
| **Network & Discovery** | [`lib/network.js`](lib/network.js) | OS listening socket inspection, HTTPS validation probe, local mDNS resolver, and embedded `mkcert` runner. |
| **Cryptographic Auth** | [`lib/auth.js`](lib/auth.js) | 256-bit secure token generator, HMAC-SHA256 cookie signer, and chronological expiry verification. |
| **Security Firewall** | [`lib/security.js`](lib/security.js) | Brute-force rate limiter, 1-second burst debouncing, dual-stack IP normalizer, and instant unban registry. |
| **PWA & Stream Shim** | [`lib/pwa.js`](lib/pwa.js) | Manifest generator, SVG vector icon pipeline, and `<head>` network online shim. |
| **Desktop Control Panel** | [`lib/dashboard.js`](lib/dashboard.js) | Light minimal UI, vector SVG QR generator, telemetry polling, and domain manager. |
| **Config & Storage** | [`lib/config.js`](lib/config.js) | Secure path resolutions with `0o700` directory and `0o600` secret file permissions. |

---

## 3. Deep Dive: Key Subsystems

### A. Two-Stage OS Socket Auto-Discovery ([`lib/network.js`](lib/network.js))
Instead of requiring hardcoded ports or IDE plugins, Ultimatter uses a robust **two-stage verification pipeline**:
1. **Stage 1 (Kernel Socket Scanning):** Ultimatter queries OS-level listening sockets for active `language_server` processes:
   * **Linux:** `ss -tlnp | grep language_server`
   * **macOS:** `lsof -iTCP -sTCP:LISTEN -P -n | grep language_server`
   * **Windows:** `Get-NetTCPConnection` via PowerShell matching process names.
2. **Stage 2 (Active HTTPS Validation Probe):** Candidate ports are actively probed with an HTTPS handshake (`checkPortIsIde`). This strictly distinguishes the AI agent's web workbench from raw TCP language servers (such as `rust-analyzer`, `gopls`, or `pyright`), eliminating false positives.

When validated, Ultimatter hot-updates its proxy target dynamically without dropping active client connections.

---

### B. Dual-Channel Transport & WebSocket Upgrade Tunneling ([`lib/proxy.js`](lib/proxy.js))
Ultimatter binds a unified port `5864` supporting both local Wi-Fi and global 5G connections seamlessly via **Server Name Indication (SNI)**:

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

* **HTTP/2 Multiplexing:** Standard web requests, editor assets, and file trees stream concurrently over binary HTTP/2 frames.
* **Raw WebSocket Duplex Tunnels:** Live language server event streams, real-time agent telemetry, and integrated terminals bypass HTTP/2 encapsulation via Node's `upgrade` event handler (`proxy.ws`) to establish raw, uninterrupted full-duplex TCP tunnels.

---

### C. Cryptographic Authentication & 30-Day Cookies ([`lib/auth.js`](lib/auth.js))
1. **Initial QR Scan:** The user scans the QR code containing a 256-bit token (`?token=<hex>`).
2. **Timing-Safe Validation:** `auth.verifyToken()` validates the token using `crypto.timingSafeEqual()` to prevent timing attacks.
3. **Timestamped Session Cookie:** On first load, the proxy sets:
   $$\text{Cookie Payload} = \text{sessionId} \mathbin{\Vert} \text{timestamp} \mathbin{\Vert} \text{HMAC}_{\text{secret}}(\text{sessionId} \mathbin{\Vert} \text{timestamp})$$
4. **Expiry Verification:** Subsequent requests validate both HMAC authenticity and confirm that $\text{Date.now()} - \text{timestamp} < 30\text{ days}$.
5. **1-Click Revocation:** Rotating `hmacSecret` via the dashboard instantly revokes all cookies across all devices.

---

### D. HTML Stream Interception & Network Online Shim ([`lib/proxy.js`](lib/proxy.js) & [`lib/pwa.js`](lib/pwa.js))
When the upstream IDE returns `Content-Type: text/html`, Ultimatter decompresses the stream (Gzip, Brotli, or Deflate) and injects:
* **Standalone PWA Meta Tags:** Configures `apple-mobile-web-app-capable: yes` and links `/manifest.webmanifest` and `/icon.svg`.
* **Network Online Shim:** Overrides `navigator.onLine` to `true` and suppresses false `offline` event propagation caused by Android mobile hotspot interface classification.

---

### E. Brute-Force Rate Limiter & Debounce Engine ([`lib/security.js`](lib/security.js))
* **Threshold:** 20 failed attempts triggers a 15-minute IP ban.
* **1-Second Burst Debouncing:** When a browser fires 10 parallel asset requests with an outdated token on page refresh, all attempts within 1000ms count as **1 single failed strike**.
* **IP Normalization:** Strips IPv4-mapped IPv6 prefixes (`::ffff:`) to ensure uniform tracking.
* **1-Click Unban:** `POST /api/dashboard/unban` allows instant lockout resolution via the desktop GUI.

---

### F. Zero-Dependency Standalone Packaging
Ultimatter is compiled using `@yao-pkg/pkg` into a single standalone binary:
* **Embedded Node.js Engine:** Embeds the Node.js v22 runtime directly inside the executable.
* **Bundled mkcert Binaries:** Includes official `mkcert v1.4.4` platform binaries (`assets/mkcert-*`) that auto-extract to `~/.config/ultimatter/bin/` if not present on the host OS.
* **Self-Contained Web GUI:** Embeds all HTML, CSS, vector SVG icons, and QR generators into the binary with zero external runtime dependencies.

---

## 4. Threat Model & Security Invariants

| Attack Vector | Mitigation Strategy |
| :--- | :--- |
| **Brute-Force Attacks** | 256-bit token entropy ($2^{256}$ combinations) + in-memory IP rate limiter. |
| **Timing Attacks** | All cryptographic comparisons use constant-time `crypto.timingSafeEqual()`. |
| **Cross-Origin / CSRF** | Proxied requests rewrite `Origin`/`Host` strictly after cryptographic authentication. Cookies enforce `SameSite=Lax`. |
| **XSS Cookie Theft** | Session cookies are protected with the `HttpOnly` flag. |
| **Unauthorized Remote Access** | 1-click **LAN Lockdown** switch in dashboard blocks incoming Tailscale connections (`100.x.y.z`, `fd7a:`, `*.ts.net`) with `403 Forbidden`. |
| **File System Leakage** | All persistent keys and tokens are stored in `~/.config/ultimatter/` with restricted `0o700` and `0o600` permissions. |
