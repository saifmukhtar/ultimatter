# 📦 Ultimatter Library Reference

Ultimatter is a Node.js library you can install and use in your own projects to add secure mobile gateway access to any local web service.

```bash
npm install ultimatter
```

---

## Quick Start

```javascript
const { createMobileGateway } = require('ultimatter');

const gateway = await createMobileGateway({
  target:  3000,
  name:    'My App',
  printQr: true,
});

console.log(gateway.mobileUrl);    // https://192.168.x.x:5864/?token=...
console.log(gateway.tailscaleUrl); // https://hostname.ts.net:5864/?token=... (if Tailscale active)
```

---

## `createMobileGateway(options)` → `Promise<GatewayInstance>`

The main SDK entry point. Creates a TLS server, starts the HTTP/2 proxy, handles authentication, and returns a live gateway instance.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `number \| string` | — | Port number or URL to proxy. E.g. `3000`, `'http://localhost:8080'`, `'https://127.0.0.1:443'` |
| `targets` | `TargetDef[]` | — | Multiple targets (see [Multi-target](#multi-target) below). Use instead of `target` for more than one service |
| `name` | `string` | `'Ultimatter App'` | Display name shown on the Mobile Hub agent card |
| `icon` | `string` | `'⚡'` | Emoji icon shown on the Mobile Hub agent card |
| `port` | `number` | `5864` | External HTTPS proxy port (alias: `proxyPort`) |
| `printQr` | `boolean` | `false` | Print an ASCII QR code to stdout on startup |
| `token` | `string` | auto-generated | Custom 64-char hex auth token. If omitted, a cryptographically random one is generated and persisted to `~/.config/ultimatter/.secret.json` |
| `enableTailscale` | `boolean` | `true` | Auto-detect Tailscale and generate a `*.ts.net` Let's Encrypt cert for 5G access |
| `enableHub` | `boolean \| 'auto'` | `'auto'` | Show the Mobile Hub at `/`. `'auto'` shows it when no `target` is set (agent auto-discovery mode) |
| `enableControlServer` | `boolean` | `false` | Start the desktop control panel API on `:5865`. Only needed when running the full desktop app |
| `dashboardPort` | `number` | `5865` | Port for the internal control panel API |

### Return value — `GatewayInstance`

```typescript
{
  server:        Http2SecureServer,  // The raw Node.js HTTPS server
  mobileUrl:     string,             // Full pairing URL with one-time token (for local Wi-Fi)
  tailscaleUrl:  string | null,      // Full pairing URL for Tailscale (null if not available)
  localIp:       string,             // Detected local IP address (e.g. "192.168.1.10")
  token:         string,             // The active 256-bit auth token
  qrSvg:         string,             // SVG string of the QR code (for embedding in UIs)
  updateTargets: (targets) => void,  // Live-update the proxy target list without restart
  close:         () => Promise<void> // Gracefully shut down the gateway
}
```

---

## Examples

### Wrap a single local port

```javascript
const { createMobileGateway } = require('ultimatter');

await createMobileGateway({
  target:  3000,
  name:    'My Dev Server',
  icon:    '🌐',
  printQr: true,
});
```

### Wrap an HTTPS local service

```javascript
await createMobileGateway({
  target:  'https://localhost:8443',
  name:    'Local HTTPS API',
  printQr: true,
});
```

### Multi-target

Expose multiple services on one gateway. Each appears as a separate card on the Mobile Hub.

```javascript
await createMobileGateway({
  targets: [
    { id: 'frontend', name: 'React App',  icon: '⚛️', port: 3000 },
    { id: 'api',      name: 'API Server', icon: '🔌', port: 8080 },
    { id: 'docs',     name: 'Storybook',  icon: '📖', port: 6006 },
  ],
  printQr: true,
});
```

### Custom token

Fix the token so QR codes stay valid across restarts.

```javascript
await createMobileGateway({
  target: 3000,
  token:  process.env.ULTIMATTER_TOKEN, // your own 64-char hex string
});
```

### Live target updates

Update the proxy targets at runtime — useful when services start and stop dynamically.

```javascript
const gateway = await createMobileGateway({ target: 3000 });

// Later — swap to a different port without restarting
gateway.updateTargets([
  { id: 'app', name: 'New Target', port: 4000, protocol: 'http' }
]);
```

### Headless server / Docker

```javascript
await createMobileGateway({
  target:  3000,
  name:    'Production Preview',
  printQr: true,  // QR code appears in container logs
});
```

### Embed QR in your own UI

```javascript
const gateway = await createMobileGateway({ target: 3000 });

// gateway.qrSvg is a ready-to-embed SVG string
res.send(`<img src="data:image/svg+xml;base64,${Buffer.from(gateway.qrSvg).toString('base64')}">`);
```

---

## Multi-target `TargetDef` Schema

```typescript
{
  id:           string,             // Unique identifier
  name:         string,             // Display name on the Mobile Hub
  shortName?:   string,             // Short name (used in breadcrumbs)
  icon?:        string,             // Emoji icon
  port:         number,             // Local port number
  protocol?:    'http' | 'https',   // Default: 'http'
  description?: string,             // Subtitle on the Mobile Hub card
  enabled?:     boolean,            // Default: true
}
```

---

## Low-Level API

These are the internal modules exposed by the library for advanced use cases.

```javascript
const {
  createMobileGateway, // ← primary SDK — use this for most cases
  startProxy,          // start the HTTP/2 proxy engine directly
  updateTargets,       // update proxy targets on a running server
  network,             // network utilities
  auth,                // auth engine
  security,            // rate limiter / IP banning
} = require('ultimatter');
```

### `network`

| Export | Description |
|--------|-------------|
| `network.getLocalIp()` | Returns the machine's primary LAN IP address |
| `network.getTailscaleDns()` | Returns the `*.ts.net` hostname if Tailscale is active, else `null` |
| `network.generateSSLCertificate(ip)` | Generates a local mkcert TLS cert for the given IP |
| `network.generateTailscaleCert(dns)` | Runs `tailscale cert` for the given hostname |
| `network.AGENT_TARGETS` | Array of built-in agent discovery definitions |

### `auth`

| Export | Description |
|--------|-------------|
| `auth.SECURE_TOKEN` | The active 256-bit hex token (readable and settable) |
| `auth.generateExchangeToken()` | Generates a one-time exchange token for embedding in QR URLs |
| `auth.validateToken(token)` | Returns `true` if the token matches, using constant-time comparison |
| `auth.validateCookie(cookieHeader)` | Validates an incoming HMAC-SHA256 `mobile_auth` cookie |

### `security`

| Export | Description |
|--------|-------------|
| `security.checkRateLimit(ip)` | Returns `{ allowed: boolean, bannedUntil?: number }` |
| `security.recordFailedAttempt(ip)` | Records a failed auth attempt for the given IP |
| `security.resetRateLimit(ip)` | Clears the rate limit record for an IP |

---

## Ports Used

| Port | Direction | Purpose |
|------|-----------|---------|
| `:5864` | Inbound (phone → desktop) | HTTPS/HTTP2 proxy + Mobile Hub + auth handshake |
| `:5865` | Loopback only | Desktop control panel API (only active in standalone app mode) |

---

## File Storage

Ultimatter stores its generated credentials and certificates in `~/.config/ultimatter/`:

| File | Content | Permissions |
|------|---------|-------------|
| `.secret.json` | Auth token + HMAC secret | `0o600` |
| `cert.pem` | Local TLS certificate (mkcert) | `0o644` |
| `key.pem` | Local TLS private key | `0o600` |
| `settings.json` | Persisted settings (disabled agents, etc.) | `0o644` |

---

## Source

- Entry point: [`index.js`](index.js)
- SDK implementation: [`lib/gateway.js`](lib/gateway.js)
- Proxy engine: [`lib/proxy.js`](lib/proxy.js)
