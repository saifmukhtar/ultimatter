const test = require('node:test');
const assert = require('node:assert');
const pwa = require('../lib/pwa');

test('PWA Module - Web App Manifest & Meta Tags', async (t) => {
  await t.test('generates valid Web App Manifest with standalone display', () => {
    const manifest = pwa.getManifest();
    assert.strictEqual(typeof manifest, 'object');
    assert.strictEqual(manifest.name, 'Ultimatter');
    assert.strictEqual(manifest.display, 'standalone');
    assert.strictEqual(manifest.start_url, '/hub');
    assert.strictEqual(Array.isArray(manifest.icons), true);
    assert.strictEqual(manifest.icons.length > 0, true);
    assert.strictEqual(manifest.icons[0].src, '/icon.svg');
  });

  await t.test('APP_ICON_SVG is valid scalable vector graphic', () => {
    assert.strictEqual(typeof pwa.APP_ICON_SVG, 'string');
    assert.strictEqual(pwa.APP_ICON_SVG.includes('<svg'), true);
    assert.strictEqual(pwa.APP_ICON_SVG.includes('</svg>'), true);
  });

  await t.test('injects PWA meta tags into head tag', () => {
    const sampleHtml = '<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>';
    const modified = pwa.injectPwaMetaTags(sampleHtml);
    assert.strictEqual(modified.includes('manifest.webmanifest'), true);
    assert.strictEqual(modified.includes('apple-mobile-web-app-capable'), true);
    assert.strictEqual(modified.includes('mobile-web-app-capable'), true);
  });

  await t.test('does not duplicate PWA tags if already present', () => {
    const alreadyInjected = '<html><head><link rel="manifest" href="/manifest.webmanifest"></head></html>';
    const result = pwa.injectPwaMetaTags(alreadyInjected);
    assert.strictEqual(result, alreadyInjected);
  });
});
