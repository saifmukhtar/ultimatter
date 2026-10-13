# Changelog

All notable changes to Ultimatter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.7] - 2026-10-13

### Fixed
* **WebKit Process Spawn Redirection:** Introduced lightweight preload hook (`libwebkit_redirect.so`) to seamlessly redirect WebKit subprocess invocations (`WebKitNetworkProcess`, `WebKitWebProcess`, `WebKitGPUProcess`) from hardcoded compile-time system paths (`/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/`) to internal AppImage paths (`$APPDIR/usr/libexec/webkit2gtk-4.1/`).
* **Injected Bundle Configuration:** Configured `WEBKIT_INJECTED_BUNDLE_PATH` in `AppRun` to eliminate web extension bundle loading failures.

## [1.1.6] - 2026-10-13

### Fixed
* **AppImage Self-Contained Dependency Closure:** Implemented automated recursive dependency resolution (`ldd` + official AppImage `excludelist`) in `build-appimage.sh`. Automatically packages required WebKit2GTK secondary runtime libraries (including `libsoup-3.0`, `libwebpmux`, `libwebpdemux`, `libwoff2dec`, `libenchant-2`, `libsecret-1`, and font/image decoders) while preserving core host system drivers (`glibc`, `X11`, `OpenGL`). Guarantees standalone operation in minimal environments and sandboxes (e.g. Firejail).

## [1.1.5] - 2026-10-13

### Added
* **Self-Contained Linux AppImage:** Dynamically bundles the WebKit2GTK runtime (`libwebkit2gtk-4.1`, `libjavascriptcoregtk-4.1`, WPE backends, and WebKit helper processes) directly inside the AppImage. Strips unneeded debug symbols to achieve full multi-distro portability (e.g. Ubuntu 22.04 LTS) while maintaining an ultra-compact ~68 MB footprint.
* **Packaging Verification:** Added strict post-copy validation checks in `build-appimage.sh` to ensure all critical WebKit libraries and sub-processes are present prior to packaging.

### Fixed
* **Cold-Start Startup Deadline:** Replaced loop-count probing in the desktop GUI with a strict 7-second wall-clock deadline (`Instant::now()`), completely eliminating `Connection refused` race conditions on cold boots while preventing prolonged startup freezes.

## [1.1.4] - 2026-10-13

### Added
* **Windows MSIX Packaging:** Modernized Windows packaging to official containerized MSIX format (`Ultimatter-Windows-x64.msix`), generated natively via Windows SDK `MakeAppx.exe`.
* **Microsoft Store Identity Integration:** Integrated verified Microsoft Partner Center Package Identity (`saifmukhtar.ultimatter`) and visual asset tiles (`Square44x44Logo`, `Square150x150Logo`, `Wide310x150Logo`, `StoreLogo`, `SplashScreen`) for direct Store submission.
* **Automated CI/CD Dynamic Versioning:** Configured GitHub Actions to dynamically inject release versions from `package.json` directly into `AppxManifest.xml` during build.

## [1.1.3] - 2026-09-28

### Added
* **Windows MSI Installer:** Completely overhauled Windows distribution to use `cargo-wix`, providing a native `.msi` installer for easier Microsoft Store publishing and clean local installations.
* **macOS Universal Builds:** Added dual-architecture GitHub Action builds for macOS, producing separate `.zip` bundles for modern Apple Silicon (`arm64`) and older Intel (`x64`) machines.
* **Portable Artifacts:** Restored standalone headless CLI binaries and portable ZIP distributions across all OS pipelines for advanced headless/Docker deployments.

### Fixed
* **Linux Release Pipeline:** Resolved a severe race condition in the Linux GitHub Actions workflow where the Node.js headless CLI and Rust Desktop GUI both attempted to write to `ultimatter-linux-x64`, causing the final portable tarball to be overwritten.
* **Store Compliance:** Updated default privacy policy and app metadata to strictly comply with Microsoft Partner Center guidelines (clarified non-generative AI networking status).

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
