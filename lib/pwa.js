/**
 * PWA Engine for Ultimatter.
 * Provides dynamic Web App Manifest, embedded vector app icons, and Apple iOS / Android standalone meta tags.
 */

const APP_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bg)" />
  <circle cx="256" cy="256" r="180" fill="none" stroke="url(#glow)" stroke-width="8" stroke-dasharray="24 16" opacity="0.4" />
  <g transform="translate(106, 106) scale(0.58)">
    <path fill="url(#glow)" d="M256 0c141.385 0 256 114.615 256 256S397.385 512 256 512 0 397.385 0 256 114.615 0 256 0z" opacity="0.05" />
    <path fill="#ffffff" d="M472.9 44.5c-4.2-4.1-10.2-5.9-16-4.7-65.7 13.6-136.2 55.4-198.8 118-47.5 47.5-84.8 104.9-108.4 167.3-8.8 23.3-13.6 47.7-14.3 72.3-27.1 11.2-48.4 33.7-58.1 62.7-2.6 7.7 2.1 15.9 10 17.5 13.9 2.8 28.5 1.5 42.1-3.6 15.4 17.9 37.6 29.5 62 31.9 2.5.3 5-.5 7.1-2 2-1.5 3.3-3.7 3.8-6.2 3.5-17.7 1.4-36.2-6.1-52.6 22.9-.6 45.6-5.1 67.3-13.3 62.4-23.6 119.8-60.9 167.3-108.4 62.6-62.6 104.4-133.1 118-198.8 1.2-5.8-.6-11.8-4.7-16-1.5-1.5-3.3-2.7-5.3-3.6zM288 176c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32z"/>
  </g>
</svg>`;

/**
 * Returns the Web App Manifest JSON object.
 * Configures the app for true standalone mode on mobile home screens.
 * 
 * @returns {object} Manifest JSON
 */
const getManifest = () => ({
  name: "Ultimatter",
  short_name: "Ultimatter",
  description: "The Ultimate Mobile Gateway for Antigravity",
  start_url: "/",
  display: "standalone",
  orientation: "any",
  background_color: "#0b0f19",
  theme_color: "#0b0f19",
  icons: [
    {
      src: "/icon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any maskable"
    }
  ]
});

/**
 * Injects PWA manifest links and Apple mobile web app tags into HTML responses.
 * 
 * @param {string} html - Raw HTML document
 * @returns {string} Modified HTML with PWA tags injected
 */
const injectPwaMetaTags = (html) => {
  if (typeof html !== 'string') return html;
  if (html.includes('manifest.webmanifest')) return html; // Already injected

  const pwaTags = `
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Ultimatter">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#0b0f19">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" type="image/svg+xml" href="/icon.svg">
  <link rel="apple-touch-icon" href="/icon.svg">
  <script>
    try {
      Object.defineProperty(navigator, 'onLine', { get: function() { return true; }, configurable: true });
      window.addEventListener('offline', function(e) { e.stopImmediatePropagation(); }, true);
    } catch (e) {}
  </script>
`;

  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${pwaTags}`);
  } else if (html.includes('</head>')) {
    return html.replace('</head>', `${pwaTags}</head>`);
  }
  return pwaTags + html;
};

module.exports = {
  APP_ICON_SVG,
  getManifest,
  injectPwaMetaTags
};
