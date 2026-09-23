# 🏛️ Ultimatter Architecture

> **System Engineering, Topology, and Execution Flow**  
> Ultimatter is a universal, decoupled mobile gateway SDK for any local web service or AI coding agent (Google Antigravity, OpenCode, CloudCLI).

---

## 1. Overview: The Zero-Touch Outer Gateway

Ultimatter wraps your local services as an **outer gateway** — it never touches, modifies, or installs into your agent or IDE directories. It communicates with agents exclusively over loopback TCP (`127.0.0.1`) and is completely invisible to them.

```
📱 Phone (iOS / Android PWA)
          │
          │  HTTPS + 256-bit auth (port :5864)
          │  Local Wi-Fi  ──OR──  5G Tailscale WireGuard
          ▼
┌─────────────────────────────────────────────┐
│           ULTIMATTER GATEWAY DAEMON         │
│                                             │
│  ┌──────────────────┐  ┌─────────────────┐  │
│  │  256-bit Auth    │  │  Rate Limiter   │  │
│  │  + HMAC Cookies  │◄►│  IP Ban Engine  │  │
│  └────────┬─────────┘  └─────────────────┘  │
│           │                                 │
│  ┌────────▼─────────────────────────────┐   │
│  │   HTTP/2 + WebSocket Reverse Proxy   │   │
│  │   SNI multi-cert TLS routing         │   │
│  │   Mobile Hub at root (/)             │   │
│  │   Streaming HTML mobile adaptation   │   │
│  └────────┬─────────────────────────────┘   │
│           │                                 │
│  ┌────────▼─────────────────────────────┐   │
│  │   Zero-Fork OS Port Discovery        │   │
│  │   /proc/net/tcp in-memory read       │   │
│  │   0.0% idle CPU                      │   │
│  └────────┬─────────────────────────────┘   │
└───────────┼─────────────────────────────────┘
            │  loopback (127.0.0.1)
    ┌───────┼────────────┐
    ▼       ▼            ▼
Antigravity  OpenCode  CloudCLI
  :33353     :4096      :3001
```

---

## 2. Component Map

| Module | File | Responsibility |
|--------|------|----------------|
| **Gateway SDK** | `lib/gateway.js` | Public `createMobileGateway()` entry point |
| **Reverse Proxy** | `lib/proxy.js` | HTTP/2 + WebSocket proxy engine, SNI routing, target management |
| **Auth Engine** | `lib/auth.js` | 256-bit token generation, HMAC-SHA256 session cookies, 5s micro-cache |
| **Security** | `lib/security.js` | In-memory IP rate limiter, 15-min ban engine, 1s burst debounce |
| **Network** | `lib/network.js` | Local IP detection, mkcert TLS generation, Tailscale DNS detection, agent discovery |
| **Desktop Dashboard** | `lib/dashboard.js` | Wry webview HTML for the native desktop control panel |
| **Mobile Hub** | `lib/hub.js` | PWA served to phone — agent cards, vitals, CA download, QR pairing |
| **Control Server** | `lib/control-server.js` | Internal HTTP server on :5865 — desktop UI API (status, toggle, reset token) |
| **Desktop Supervisor** | `desktop/src/supervisor.rs` | Rust process that spawns and double-probe monitors the Node backend |
| **Config** | `lib/config.js` | File paths, ports, and constants (`~/.config/ultimatter/`) |
| **Version** | `lib/version.js` | Package version export |
| **Pages** | `lib/pages/` | Static HTML pages: pairing handshake, waiting state |

---

## 3. Execution Flow (Lifecycle)

```
User launches binary
        │
        ▼
1. Rust Wry desktop window starts
   Supervisor double-probes :5865 to check if backend is already alive
        │
        ▼
2. If no backend → spawns ultimatter-backend (Node pkg binary) --headless
   Wry polls :5865 up to 25 times (200ms interval) for backend readiness
        │
        ▼
3. Webview loads http://127.0.0.1:5865/dashboard
   Desktop control panel appears
        │
        ▼
4. Node backend reads /proc/net/tcp in memory
   Discovers active agent ports (Antigravity, OpenCode, CloudCLI)
        │
        ▼
5. TLS server binds :5864 with SNI multi-cert routing
   (mkcert for local Wi-Fi, Let's Encrypt via Tailscale for 5G)
        │
        ▼
6. Desktop control panel renders live QR code
        │
        ▼
7. Phone scans QR → one-time 256-bit token exchange
   Gateway issues 30-day HMAC-SHA256 cookie → 302 redirect to /
   Token stripped from URL (clean PWA bookmark)
        │
        ▼
8. Phone lands on Mobile Hub → taps agent card → full-screen IDE
   HTML stream adapted on-the-fly (keyboard docking, 0ms tap delay)
```

---

## 4. Stage Details

### Stage A — Double-Probe Supervisor (Race Condition Fix)

The Rust supervisor does not trust a single port probe at startup. On first launch or after an AppImage restart, a stale backend from a previous session can still be responding on :5865 as its mount is being unmounted.

**Fix:** The supervisor probes :5865 once. If it responds, it waits **2 seconds** and probes again. Only if both probes succeed does it conclude "already running". If the second probe fails, it spawns a fresh backend. This eliminates the blank-screen race condition.

Source: [`desktop/src/supervisor.rs`](desktop/src/supervisor.rs)

---

### Stage B — Zero-Fork Agent Discovery

Traditional port scanners spawn child processes (`ss`, `lsof`, `netstat`) in a loop causing CPU spikes. Ultimatter uses **in-memory kernel inspection**:

1. Reads `/proc/net/tcp` and `/proc/net/tcp6` directly in memory
2. Computes a 32-bit MurmurHash fingerprint of the socket table
3. If the fingerprint is unchanged from the last poll → **skip everything, 0.0% CPU**
4. If changed → runs a two-stage HTTP/HTTPS handshake probe on candidate ports to distinguish real web agents from TCP language servers (e.g. `gopls`, `rust-analyzer`)
5. Polling adapts from 1.5s on startup to 10s during steady state

Source: [`lib/network.js`](lib/network.js)

---

### Stage C — SNI Multi-Cert TLS Routing

A single port `:5864` serves both local Wi-Fi and 5G remote connections by inspecting the TLS SNI hostname before certificate selection:

```
Incoming connection on :5864
          │
          ├── SNI hostname ends in .ts.net?
          │       YES → Tailscale Let's Encrypt certificate
          │       NO  → local mkcert certificate (IP + .local)
          ▼
    Connection terminates with correct cert, no redirect needed
```

Certificates are generated automatically at startup:
- **Local:** `mkcert` generates a cert for your current LAN IP + `.local` hostname, stored in `~/.config/ultimatter/`
- **Tailscale:** Ultimatter runs `tailscale cert` for your `*.ts.net` hostname on first use

Source: [`lib/proxy.js`](lib/proxy.js)

---

### Stage D — Auth & Session Management

| Step | Mechanism |
|------|-----------|
| Token generation | `crypto.randomBytes(32).toString('hex')` — 256-bit entropy |
| QR code | Encodes `https://<ip>:5864/?token=<token>` — one-time use exchange |
| Cookie issuance | `mobile_auth` — HMAC-SHA256 signed, 30-day expiry, `HttpOnly`, `SameSite=Lax` |
| Cookie validation | `crypto.timingSafeEqual()` — constant-time comparison, immune to timing attacks |
| Session micro-cache | 5-second in-memory cache — repeat auth latency drops from ~0.5ms to **0.001ms** |
| Rate limiting | 20 failed attempts → 15-minute IP ban, 1-second burst debounce |

Source: [`lib/auth.js`](lib/auth.js), [`lib/security.js`](lib/security.js)

---

### Stage E — Streaming HTML Mobile Adaptation

When proxying an agent's web UI to mobile, Ultimatter intercepts the HTTP response stream and injects mobile-specific patches without buffering the full response:

| Injection | What it fixes |
|-----------|--------------|
| `interactive-widget=resizes-content` | Virtual keyboard resizes viewport instead of covering the input box |
| `viewport-fit=cover` | Edge-to-edge display on notched phones |
| `touch-action: manipulation` | Eliminates the 300ms mobile tap delay |
| `env(safe-area-inset-*)` CSS vars | Content stays inside notch/home-indicator safe areas |
| WebSocket reconnect listener | Re-arms WebSocket within 200ms when switching between Wi-Fi and 5G |

Source: [`lib/proxy.js`](lib/proxy.js)

---

## 5. Protocol Routing

| Traffic Type | Protocol | Transport Strategy |
|--------------|----------|--------------------|
| Static assets, HTML pages | HTTP/2 multiplexing | Persistent keep-alive TCP pools (max 128 sockets), `TCP_NODELAY`, 304 ETag cache |
| Live agent streams, terminals | Raw WebSocket duplex | Direct full-duplex TCP tunnel via Node `upgrade` event, bypasses HTTP/2 |
| Mobile Hub (`/`) | Fast HTTP router | Agent card switching via `/agent/:id`, `selected_agent` cookie persistence |
| Desktop control panel | HTTP on :5865 (loopback only) | Internal API — status, toggle remote access, reset token, agent manager |

---

## 6. Security Model

| Threat | Defense |
|--------|---------|
| Brute-force token guessing | 256-bit entropy ($2^{256}$ combinations) + 15-min IP ban after 20 failed attempts |
| Timing attacks | `crypto.timingSafeEqual()` on all token and cookie comparisons |
| CSRF | `Origin`/`Host`/`Referer` headers rewritten only after authentication; `SameSite=Lax` cookie |
| XSS token theft | Tokens transmitted via `HttpOnly` cookies only — not accessible to JS |
| LAN isolation | One-click toggle blocks all Tailscale IPs (`100.x`, `fd7a:`, `*.ts.net`) with `403 Forbidden` |
| Credential storage | `~/.config/ultimatter/` — directory `0o700`, files `0o600` |

---

## 7. Directory Structure

```
ultimatter/
├── index.js               ← SDK public API exports
├── bin/
│   └── cli.js             ← CLI entry point (standalone app mode)
├── lib/
│   ├── gateway.js         ← createMobileGateway() SDK
│   ├── proxy.js           ← HTTP/2 + WebSocket reverse proxy engine
│   ├── auth.js            ← Token + HMAC session auth
│   ├── security.js        ← Rate limiter + IP ban engine
│   ├── network.js         ← IP detection, TLS cert gen, agent discovery
│   ├── control-server.js  ← Desktop control panel API server (:5865)
│   ├── dashboard.js       ← Desktop control panel HTML (Wry webview)
│   ├── hub.js             ← Mobile Hub PWA HTML
│   ├── pwa.js             ← PWA manifest + service worker
│   ├── config.js          ← Paths, ports, constants
│   ├── version.js         ← Package version
│   └── pages/
│       ├── pairing.js     ← QR token exchange page
│       └── waiting.js     ← "Gateway starting" page
├── desktop/
│   └── src/
│       ├── main.rs        ← Tao/Wry native window + webview
│       └── supervisor.rs  ← Backend process spawning + double-probe liveness
├── assets/                ← Icons, screenshots
├── scripts/               ← Build scripts (AppImage, Windows icon injection)
└── packaging/             ← macOS .app bundle packaging
```
