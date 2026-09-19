const test = require('node:test');
const assert = require('node:assert');
const auth = require('../lib/auth');
const hub = require('../lib/hub');
const proxy = require('../lib/proxy');

test('Security Vulnerability Fixes', async (t) => {

  await t.test('DOM XSS (escapeHTML) sanitizes malicious inputs in Hub', () => {
    const maliciousTarget = {
      id: '123',
      name: '<script>alert("xss")</script>',
      icon: '"><img src=x onerror=alert(1)>',
      port: 8080
    };
    const html = hub.getHubHtml([maliciousTarget], [maliciousTarget], 'token');
    
    assert.strictEqual(html.includes('&lt;script&gt;'), true, 'Should contain escaped script tags');
    assert.strictEqual(html.includes('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;'), true, 'Should contain escaped image tag');
  });

  await t.test('Exchange Token is short-lived and single-use', () => {
    const token = auth.generateExchangeToken();
    assert.strictEqual(auth.verifyExchangeToken(token), true, 'First verification should succeed');
    assert.strictEqual(auth.verifyExchangeToken(token), false, 'Second verification should fail (single use)');
  });

  await t.test('sessionCookieCache memory leak prevention respects strict bound', () => {
    // Generate valid cookies and fill the cache
    const initialSize = auth.getCookieCacheSize();
    for (let i = 0; i < 1200; i++) {
      const cookie = auth.generateSessionCookie();
      auth.verifySessionCookie(cookie); 
    }
    const finalSize = auth.getCookieCacheSize();
    assert.ok(finalSize <= 1000, `Cache size should be bounded to 1000, got ${finalSize}`);
  });

  await t.test('Auth token setter works correctly', () => {
    const original = auth.SECURE_TOKEN;
    const validHex = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    auth.SECURE_TOKEN = validHex;
    assert.strictEqual(auth.SECURE_TOKEN, validHex);
    auth.SECURE_TOKEN = original; // restore
  });
});
