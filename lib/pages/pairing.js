/**
 * Generates the 401 Connect & Pairing screen with the in-browser camera scanner.
 * 
 * @returns {string} HTML pairing page
 */
const getPairingPageHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Ultimatter - Connect Device</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px 16px;
      text-align: center;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 36px 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 4px 24px -2px rgba(15, 23, 42, 0.06);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .brand-logo-wrap {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2px;
    }
    h2 { font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; }
    p { font-size: 13px; color: #64748b; line-height: 1.5; max-width: 320px; }
    
    /* Camera Scanner UI */
    .scanner-btn {
      width: 100%;
      padding: 14px 20px;
      background: #0284c7;
      color: #ffffff;
      border: none;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 2px 12px rgba(2, 132, 199, 0.25);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      touch-action: manipulation;
    }
    .scanner-btn:active { transform: scale(0.98); background: #0369a1; }
    
    .scanner-view-container {
      display: none;
      width: 100%;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      position: relative;
    }
    .video-wrapper {
      position: relative;
      width: 100%;
      height: 250px;
      border-radius: 16px;
      overflow: hidden;
      background: #0f172a;
      border: 2px solid #0284c7;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .scanner-laser {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
      animation: scanLaser 2s ease-in-out infinite alternate;
    }
    @keyframes scanLaser {
      0% { top: 10%; }
      100% { top: 90%; }
    }
    .close-camera-btn {
      padding: 7px 16px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
    }

    .error-msg {
      font-size: 12px;
      color: #ef4444;
      font-weight: 500;
      display: none;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-size: 11px;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 20px;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand-logo-wrap">
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style="width: 64px; height: 64px; border-radius: 16px; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12);">
        <defs>
          <linearGradient id="pairBrandBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>
          <linearGradient id="pairBrandGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#818cf8" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="128" fill="url(#pairBrandBg)" />
        <circle cx="256" cy="256" r="180" fill="none" stroke="url(#pairBrandGlow)" stroke-width="12" stroke-dasharray="24 16" opacity="0.4" />
        <g transform="translate(106, 106) scale(0.58)">
          <path fill="url(#pairBrandGlow)" d="M256 0c141.385 0 256 114.615 256 256S397.385 512 256 512 0 397.385 0 256 114.615 0 256 0z" opacity="0.05" />
          <path fill="#ffffff" d="M472.9 44.5c-4.2-4.1-10.2-5.9-16-4.7-65.7 13.6-136.2 55.4-198.8 118-47.5 47.5-84.8 104.9-108.4 167.3-8.8 23.3-13.6 47.7-14.3 72.3-27.1 11.2-48.4 33.7-58.1 62.7-2.6 7.7 2.1 15.9 10 17.5 13.9 2.8 28.5 1.5 42.1-3.6 15.4 17.9 37.6 29.5 62 31.9 2.5.3 5-.5 7.1-2 2-1.5 3.3-3.7 3.8-6.2 3.5-17.7 1.4-36.2-6.1-52.6 22.9-.6 45.6-5.1 67.3-13.3 62.4-23.6 119.8-60.9 167.3-108.4 62.6-62.6 104.4-133.1 118-198.8 1.2-5.8-.6-11.8-4.7-16-1.5-1.5-3.3-2.7-5.3-3.6zM288 176c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32z"/>
        </g>
      </svg>
    </div>
    <h2>Pair This Device</h2>
    <p>Scan the dynamic QR code displayed on your PC's <strong>Ultimatter Control Panel</strong> to connect.</p>
    
    <!-- Primary Action: In-Browser Camera Scanner -->
    <button id="startScanBtn" class="scanner-btn" onclick="toggleCameraScanner()">
      <span>📷</span>
      <span>Scan QR Code with Camera</span>
    </button>

    <!-- Video Viewfinder -->
    <div id="scannerContainer" class="scanner-view-container">
      <div class="video-wrapper">
        <video id="scannerVideo" playsinline autoplay muted></video>
        <div class="scanner-laser"></div>
      </div>
      <button class="close-camera-btn" onclick="stopCameraScanner()">✕ Close Camera</button>
    </div>

    <div id="errorText" class="error-msg"></div>

    <div class="badge">🛡️ Zero-Trust Cryptographic Pairing</div>
  </div>

  <script>
    let videoStream = null;
    let scanningActive = false;
    let barcodeDetector = null;

    if ('BarcodeDetector' in window) {
      try {
        barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) {}
    }

    async function toggleCameraScanner() {
      const container = document.getElementById('scannerContainer');
      const startBtn = document.getElementById('startScanBtn');
      const video = document.getElementById('scannerVideo');
      const err = document.getElementById('errorText');

      if (videoStream) {
        stopCameraScanner();
        return;
      }

      err.style.display = 'none';

      try {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
        video.srcObject = videoStream;
        await video.play();
        container.style.display = 'flex';
        startBtn.style.display = 'none';
        scanningActive = true;
        requestAnimationFrame(scanVideoFrame);
      } catch (e) {
        err.innerText = '⚠️ Camera access denied or not supported in this browser.';
        err.style.display = 'block';
        stopCameraScanner();
      }
    }

    function stopCameraScanner() {
      scanningActive = false;
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
      }
      const container = document.getElementById('scannerContainer');
      const startBtn = document.getElementById('startScanBtn');
      if (container) container.style.display = 'none';
      if (startBtn) startBtn.style.display = 'flex';
    }

    async function scanVideoFrame() {
      if (!scanningActive) return;
      const video = document.getElementById('scannerVideo');
      
      if (video.readyState === video.HAVE_ENOUGH_DATA && barcodeDetector) {
        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              stopCameraScanner();
              handleScannedValue(rawValue);
              return;
            }
          }
        } catch (e) {}
      }
      if (scanningActive) {
        requestAnimationFrame(scanVideoFrame);
      }
    }

    function handleScannedValue(val) {
      let token = val.trim();
      if (token.includes('token=')) {
        try {
          const u = new URL(token.startsWith('http') ? token : ('https://dummy/' + token));
          token = u.searchParams.get('token') || token;
        } catch (e) {}
      }
      authenticateWithToken(token);
    }

    function authenticateWithToken(token) {
      const err = document.getElementById('errorText');
      const startBtn = document.getElementById('startScanBtn');
      if (startBtn) {
        startBtn.innerText = 'Verifying...';
        startBtn.disabled = true;
      }

      fetch('/api/auth-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
          window.location.replace('/');
        } else {
          if (navigator.vibrate) navigator.vibrate(50);
          err.innerText = '❌ Invalid pairing token. Check your desktop screen.';
          err.style.display = 'block';
          if (startBtn) {
            startBtn.innerHTML = '<span>📷</span><span>Scan QR Code with Camera</span>';
            startBtn.disabled = false;
          }
        }
      })
      .catch(() => {
        err.innerText = '❌ Connection failed. Check gateway status.';
        err.style.display = 'block';
        if (startBtn) {
          startBtn.innerHTML = '<span>📷</span><span>Scan QR Code with Camera</span>';
          startBtn.disabled = false;
        }
      });
    }
  </script>
</body>
</html>`;

/**
 * Generates the notification card when remote access is temporarily disabled (LAN-Only mode).
 * 
 * @returns {string} HTML notification page
 */
const getTailscalePausedHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Ultimatter - Remote Access Paused</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px 16px;
      text-align: center;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .icon { font-size: 36px; margin-bottom: 4px; }
    h2 { font-size: 18px; font-weight: 700; color: #0f172a; }
    p { font-size: 13px; color: #64748b; line-height: 1.5; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #fefce8;
      border: 1px solid #fef08a;
      color: #854d0e;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 20px;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⏸️</div>
    <h2>Remote Access Paused</h2>
    <p>The host PC has temporarily disabled remote Tailscale access (LAN-Only Mode). Re-enable from the desktop control panel.</p>
    <div class="badge">🔒 LAN Isolation Active</div>
  </div>
</body>
</html>`;

module.exports = {
  getPairingPageHtml,
  getTailscalePausedHtml
};
