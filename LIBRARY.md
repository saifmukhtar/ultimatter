# 🚀 Ultimatter SDK & Programmatic Library

> **Turn any local dev server, web app, or AI interface into a secure, mobile-paired application with 1 line of code.**

The **Ultimatter SDK** is a zero-configuration, security-hardened reverse proxy engine designed to bridge desktop/local web servers directly to mobile devices (iOS & Android) over Local Wi-Fi and Tailscale MagicDNS.

---

## ⚡ What Problem Does It Solve?

When developers build local web applications, AI agent dashboards, or dev servers (Next.js, Vite, Express, Fastify, Ollama, Jupyter, etc.) and try to use them on their phones:

1. ❌ **Broken HTTPS & WebSockets on Mobile:** Mobile Safari and Chrome aggressively block untrusted self-signed certificates and unencrypted HTTP/WebSocket connections.
2. ❌ **Tedious Authentication Boilerplate:** Writing pairing QR codes, cryptographic tokens, HMAC cookies, and rate limiters takes days.
3. ❌ **Complex Networking Setup:** Manually looking up local LAN IPs, configuring mDNS, and setting up split-DNS or Tailscale tunnels is cumbersome.
4. ❌ **Sub-par Mobile Experience:** Local web apps lack proper viewport scaling, standalone PWA manifests, and connection reconnect shims.

**Ultimatter SDK solves all of this automatically in a single function call.**

---

## 📦 What You Get Out-of-the-Box

| Feature | Description |
| :--- | :--- |
| 🔒 **Automatic Local & Remote TLS** | Generates trusted local CA certificates (`mkcert`) with pure OpenSSL fallback, plus automated Tailscale Let's Encrypt certificates. |
| ⚡ **HTTP/2 Multiplexing & WSS** | High-throughput, low-latency streaming for AI tokens, terminal buffers, and real-time WebSockets over a single connection. |
| 🛡️ **Zero-Trust Security** | Cryptographic 256-bit token pairing, HMAC-signed session cookies (30-day sliding window), and automatic 15-minute IP rate-limiting bans. |
| 📱 **Auto-Adaptive Mobile Routing** | **1 App:** Lands directly in your app with zero clicks. <br>**2+ Apps:** Displays the interactive **Ultimatter Mobile Hub** launcher. |
| 📲 **PWA & Mobile Optimization** | Automatically injects Web App Manifests, iOS standalone meta tags, and high-DPI app icons into proxied HTML responses. |
| 📷 **Instant QR Code Pairing** | Generates ASCII QR codes in the terminal and scalable vector SVGs (`qrSvg`) for embedding in web interfaces. |

---

## 🛠️ Installation

```bash
npm install ultimatter
```

---

## 🚀 Quick Start (3 Lines of Code)

### 1. Wrapping an Existing Port or Dev Server

```javascript
import { createMobileGateway } from 'ultimatter';

// Wrap your existing local server running on port 3000
const gateway = await createMobileGateway({
  target: 3000,
  appName: 'My Web App',
  icon: '⚡',
  printQr: true // Prints scannable pairing QR code in terminal
});

console.log(`📱 Mobile Wi-Fi URL: ${gateway.mobileUrl}`);
```

---

### 2. Full Express / Fastify Integration

```javascript
import express from 'express';
import { createMobileGateway } from 'ultimatter';

const app = express();

app.get('/', (req, res) => {
  res.send('<h1>Hello from my Mobile-Ready App!</h1>');
});

const server = app.listen(3000, async () => {
  // Turn Express server into a secure mobile gateway
  const gateway = await createMobileGateway({
    target: 3000,
    appName: 'Express Backend',
    icon: '🚀',
    printQr: true
  });

  // Graceful teardown
  process.on('SIGINT', async () => {
    await gateway.close();
    server.close();
    process.exit(0);
  });
});
```

---

### 3. Multi-Service Mobile Hub Launcher

If your project has multiple local services (e.g. Frontend + Backend API + Docs), Ultimatter will automatically serve the **Mobile Hub launchpad** so you can switch between them on your phone:

```javascript
import { createMobileGateway } from 'ultimatter';

const gateway = await createMobileGateway({
  targets: [
    { id: 'web', name: 'Web Dashboard', port: 3000, icon: '🌐' },
    { id: 'api', name: 'GraphQL API', port: 8080, icon: '⚡' },
    { id: 'docs', name: 'API Documentation', port: 8000, icon: '📚' }
  ],
  printQr: true
});
```

---

## ⚙️ Programmatic API Reference

### `createMobileGateway(options)`

#### Options:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `target` | `number \| string` | `null` | Single target port (e.g. `3000`) or URL (`"http://127.0.0.1:3000"`). |
| `targets` | `Array<object>` | `null` | Array of target definitions: `[{ id, name, port, protocol, icon }]`. |
| `port` / `proxyPort` | `number` | `5864` | External HTTPS / HTTP/2 gateway port. |
| `dashboardPort` | `number` | `5865` | Local desktop control panel port (if enabled). |
| `appName` / `name` | `string` | `'Ultimatter App'` | Name displayed on mobile pairing and PWA header. |
| `icon` | `string` | `'⚡'` | Emoji or icon identifier. |
| `enableTailscale` | `boolean` | `true` | Auto-detect and configure Tailscale MagicDNS TLS if available. |
| `enableControlServer`| `boolean` | `false` | Start the local desktop GUI HTTP control panel on port 5865. |
| `enableHub` | `'auto' \| boolean` | `'auto'` | `'auto'` bypasses hub for 1 app and shows hub for 2+ apps. |
| `token` | `string` | *Crypto Random* | Custom pairing token (defaults to auto-generated 256-bit token). |
| `printQr` | `boolean` | `false` | Print ASCII QR code and connection links to `stdout`. |

#### Returns (`Promise<GatewayInstance>`):

```typescript
interface GatewayInstance {
  server: http2.Http2SecureServer; // Raw Node.js HTTP/2 secure server
  close: () => Promise<void>;      // Closes gateway and destroys all active sockets
  mobileUrl: string;               // Wi-Fi HTTPS pairing URL with token
  localIp: string;                 // Discovered local LAN IP
  tailscaleUrl: string | null;     // Encrypted Tailscale MagicDNS URL (if available)
  token: string;                   // Active 256-bit security token
  qrSvg: string;                   // Raw scalable vector SVG QR code string
  updateTargets: (targets: any) => void; // Dynamically update targets at runtime
}
```

---

## 💻 Zero-Install CLI Usage

You can also wrap any running server or port instantly via the CLI without writing code:

```bash
# Wrap a local web app running on port 3000
npx ultimatter --port 3000

# Wrap custom service with a custom name
npx ultimatter -p 8080 -n "My Fastify API"

# Run default multi-agent AI discovery mode (Antigravity, OpenCode, Claude Code)
npx ultimatter
```

---

## 🎯 Common Use Cases

* **Local AI Agent UIs:** Expose autonomous agent terminals (OpenCode, Claude Code, Antigravity, Aider) to mobile for on-the-go monitoring.
* **Local LLM Interfaces:** Run Ollama, LM Studio, or vLLM web UIs and chat with your local models from your phone securely.
* **Frontend Mobile Testing:** Test responsive layouts, camera APIs, and touch interactions on real mobile devices with real HTTPS certificates.
* **Internal Tools & Dashboards:** Safely view developer tools, Jupyter notebooks, or database admin viewers on mobile without public exposure.

---

## 📄 License

MIT © [Saif Mukhtar](https://github.com/saifmukhtar)
