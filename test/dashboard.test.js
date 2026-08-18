const test = require('node:test');
const assert = require('node:assert');
const dashboard = require('../lib/dashboard');

test('Dashboard Module - Vector SVG QR and HTML Generator', async (t) => {
  await t.test('generates valid vector SVG QR code', () => {
    const svg = dashboard.generateQrSvg('https://127.0.0.1:5864/?token=test');
    assert.strictEqual(typeof svg, 'string');
    assert.strictEqual(svg.startsWith('<svg'), true);
    assert.strictEqual(svg.endsWith('</svg>'), true);
    assert.strictEqual(svg.includes('shape-rendering="crispEdges"'), true);
    assert.strictEqual(svg.includes('<path fill="#000000"'), true);
  });

  await t.test('handles empty or null payloads gracefully', () => {
    assert.strictEqual(dashboard.generateQrSvg(''), '');
    assert.strictEqual(dashboard.generateQrSvg(null), '');
    assert.strictEqual(dashboard.generateQrSvg(undefined), '');
  });

  await t.test('getDashboardHtml produces valid HTML document', () => {
    const html = dashboard.getDashboardHtml();
    assert.strictEqual(html.includes('<!DOCTYPE html>'), true);
    assert.strictEqual(html.includes('Ultimatter Control Panel'), true);
    assert.strictEqual(html.includes('id="tabTailscale"'), true);
  });
});
