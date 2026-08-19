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
});
