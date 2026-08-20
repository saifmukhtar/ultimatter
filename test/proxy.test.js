const test = require('node:test');
const assert = require('node:assert');
const proxy = require('../lib/proxy');

test('Proxy Module - Port Definitions and Target Updates', async (t) => {
  await t.test('exports correct default proxy and dashboard ports', () => {
    assert.strictEqual(proxy.PROXY_PORT, 5864);
    assert.strictEqual(proxy.DASHBOARD_PORT, 5865);
  });

  await t.test('updateTargets handles array, object, number, and null targets', () => {
    // Array of targets
    proxy.updateTargets([
      { id: 'opencode', name: 'OpenCode', shortName: 'OpenCode', port: 4096, protocol: 'http', status: 'online' }
    ]);

    // Single object target
    proxy.updateTargets({ id: 'antigravity', name: 'Google Antigravity', shortName: 'Antigravity', port: 43675, protocol: 'https', status: 'online' });

    // Number target (legacy format)
    proxy.updateTargets(43675);

    // Null / empty target
    proxy.updateTargets(null);
    proxy.updateTargets([]);
  });

  await t.test('sanitizeCspHeader preserves strict directives while adding required tokens', () => {
    const rawCsp = "default-src 'self'; script-src 'self' 'sha256-abc'; connect-src 'self'; style-src 'self'";
    const sanitized = proxy.sanitizeCspHeader(rawCsp);

    assert.ok(sanitized.includes("'unsafe-inline'"));
    assert.ok(sanitized.includes("'wasm-unsafe-eval'"));
    assert.ok(sanitized.includes('wss:'));
    assert.ok(sanitized.includes('ws:'));
    assert.ok(!sanitized.includes("'sha256-abc'"));
  });
});
