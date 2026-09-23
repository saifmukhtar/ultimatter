# Changelog

All notable changes to Ultimatter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2026-09-23

### Security (Major Audit & CVE Patches)
* **DNS Rebinding & Master Token Leak:** Fixed critical vulnerability where the control server did not validate the `Host` header, allowing malicious sites to bypass CORS and extract the `SECURE_TOKEN` via DNS rebinding.
* **CSRF on Control Server:** Validated `Origin` headers and enforced `X-Requested-With: XMLHttpRequest` preflight checks for all state-changing POST requests (Tailscale toggles, shutdown commands, etc.).
* **DOM XSS in Hub Templates:** Implemented strict HTML entity encoding for all agent names, descriptions, and icons injected into the Mobile Hub PWA.
* **Token TOCTOU & URL Exposure:** Implemented a single-use exchange token system, removing the permanent master token from web proxy URLs. Fixed a Time-of-Check to Time-of-Use gap by implementing a soft-refresh threshold for QR codes.
* **Cookie & Memory Hardening:** Bounded the session cookie cache size to prevent Denial of Service (DoS) memory leaks. Added `Secure` and `SameSite=Lax` flags to the HMAC-SHA256 `mobile_auth` cookie. Added strict 64-character hex regex guards to token inputs.
* **Defense-in-Depth:** Prevented downgrading of upstream CSP headers, injected strict HSTS and `X-Frame-Options` headers, and added safeguards to prevent Root CA private key leaks via the download endpoint.

### Performance & Fixes
* **Zero-Fork Agent Discovery:** Eliminated severe CPU drain and battery spikes by replacing heavy OS shell spawning (`powershell`/`lsof`) with direct, in-memory kernel socket inspection (`/proc/net/tcp`).
* **AppImage Startup Race Condition:** Fixed a blank-screen bug on restart by implementing a double-probe supervisor check in Rust to properly wait for stale backend processes to exit.
* **IP Rotation Resilience:** Fixed an issue where router IP changes broke Root CA trust. The gateway now parses `cert.pem` and dynamically regenerates the Leaf Certificate if the current IP is missing from the Subject Alternative Names (SAN).
* **UI & Client Fixes:** Resolved a JS syntax error (apostrophe in template literal) that broke the dashboard. Added a fallback JavaScript QR scanner (`jsQR`) for browsers lacking `BarcodeDetector` support.

## [1.1.1] - 2026-08-15

### Added
* **CloudCLI Integration:** Added stable support and auto-discovery for Claude Code (CloudCLI) on port 3001.
* **SDK Library API:** Transformed Ultimatter into a proper Node.js library (`createMobileGateway`). You can now install `ultimatter` via npm to wrap any local web app with secure HTTPS, QR pairing, and mobile PWA support programmatically.
* **Native Desktop App:** Rebuilt the standalone desktop application into a proper, high-performance native app using Rust, Tao, and Wry (replacing heavy Electron/CEF wrappers) for Linux, macOS, and Windows.

## [1.1.0] - 2026-07-20

### Added
* **OpenCode Integration:** Added stable support and auto-discovery for the OpenCode autonomous AI coding agent.

## [1.0.0] - 2026-06-10

### Added
* **Initial Stable Release:** Launched the zero-touch mobile gateway for Google Antigravity.
* **Core Features:** Auto-discovery for Antigravity, dual-channel TLS (Local Wi-Fi + Tailscale MagicDNS), 256-bit token QR pairing, and Mobile Hub PWA with virtual keyboard auto-docking.
