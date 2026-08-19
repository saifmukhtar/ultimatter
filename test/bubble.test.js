const test = require('node:test');
const assert = require('node:assert');
const bubble = require('../lib/bubble');

test('Bubble Module - Draggable Edge Bubble & Switcher Drawer', async (t) => {
  await t.test('getPortalScript and getBubbleSnippet return valid HTML/JS for CSP-compliant injection', () => {
    const script = bubble.getPortalScript();
    assert.strictEqual(typeof script, 'string');
    assert.strictEqual(script.includes('ultimatter-portal'), true);
    assert.strictEqual(script.includes('attachShadow'), true);
    assert.strictEqual(script.includes('customElements.define'), true);

    const snippet = bubble.getBubbleSnippet();
    assert.strictEqual(typeof snippet, 'string');
    assert.strictEqual(snippet.includes('ultimatter-portal'), true);
    assert.strictEqual(snippet.includes('/api/ultimatter-portal.js'), true);
  });

  await t.test('injectBubble inserts snippet before closing body tag', () => {
    const mockHtml = '<!DOCTYPE html><html><head><title>Agent</title></head><body><div id="app"></div></body></html>';
    const modified = bubble.injectBubble(mockHtml);

    assert.strictEqual(typeof modified, 'string');
    assert.strictEqual(modified.includes('ultimatter-portal'), true);
    assert.strictEqual(modified.endsWith('</body></html>'), true);
  });

  await t.test('injectBubble is idempotent and does not duplicate snippet', () => {
    const mockHtml = '<!DOCTYPE html><html><head><title>Agent</title></head><body><div id="app"></div></body></html>';
    const modifiedOnce = bubble.injectBubble(mockHtml);
    const modifiedTwice = bubble.injectBubble(modifiedOnce);

    const occurrences = (modifiedTwice.match(/ultimatter-portal-root/g) || []).length;
    assert.strictEqual(occurrences, 1);
  });

  await t.test('injectBubble handles non-HTML strings gracefully', () => {
    const nonHtml = '{"status":"ok"}';
    assert.strictEqual(bubble.injectBubble(nonHtml), nonHtml);
    assert.strictEqual(bubble.injectBubble(null), null);
    assert.strictEqual(bubble.injectBubble(undefined), undefined);
  });

  await t.test('sanitizeCspHeader preserves strict directives while allowing self script and websocket streams', () => {
    const proxy = require('../lib/proxy');
    const strictCsp = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'sha256-jURJv6M3UYb5GqNE3+c1I0SvGlqS1+LmHVWtqFsefBk='; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; object-src 'none'";
    const sanitized = proxy.sanitizeCspHeader(strictCsp);

    assert.strictEqual(typeof sanitized, 'string');
    assert.strictEqual(sanitized.includes("default-src 'self'"), true);
    assert.strictEqual(sanitized.includes("frame-ancestors 'none'"), true);
    assert.strictEqual(sanitized.includes("object-src 'none'"), true);
    assert.strictEqual(sanitized.includes("script-src 'self'"), true);
    assert.strictEqual(sanitized.includes("'unsafe-inline'"), true);
    assert.strictEqual(sanitized.includes("'wasm-unsafe-eval'"), true);
    assert.strictEqual(sanitized.includes('wss:'), true);
  });
});
