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

  await t.test('resolveTargetForRequest resolves correctly for /agent/:id, query, cookie and fallback', () => {
    proxy.updateTargets([
      { id: 'antigravity', name: 'Google Antigravity', shortName: 'Antigravity', port: 43675, protocol: 'https', status: 'online' },
      { id: 'opencode', name: 'OpenCode', shortName: 'OpenCode', port: 4096, protocol: 'http', status: 'online' }
    ]);

    // 1. Path resolution: /agent/opencode
    const reqPath = { url: '/agent/opencode/some/path', headers: { host: '127.0.0.1:5864' } };
    assert.strictEqual(proxy.resolveTargetForRequest(reqPath).id, 'opencode');

    // 2. Query param resolution: /?agent=antigravity
    const reqQuery = { url: '/?agent=antigravity', headers: { host: '127.0.0.1:5864' } };
    assert.strictEqual(proxy.resolveTargetForRequest(reqQuery).id, 'antigravity');

    // 3. Cookie resolution: selected_agent=opencode
    const reqCookie = { url: '/view', headers: { host: '127.0.0.1:5864', cookie: 'selected_agent=opencode' } };
    assert.strictEqual(proxy.resolveTargetForRequest(reqCookie).id, 'opencode');

    // 4. Default fallback: primary active target
    const reqDefault = { url: '/view', headers: { host: '127.0.0.1:5864' } };
    assert.strictEqual(proxy.resolveTargetForRequest(reqDefault).id, 'antigravity');
  });
});
