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

    // 5. Disabled target filtering
    proxy.updateTargets([
      { id: 'antigravity', name: 'Google Antigravity', shortName: 'Antigravity', port: 43675, protocol: 'https', status: 'online', enabled: true },
      { id: 'opencode', name: 'OpenCode', shortName: 'OpenCode', port: 4096, protocol: 'http', status: 'online', enabled: false }
    ]);
    const reqDisabled = { url: '/agent/opencode', headers: { host: '127.0.0.1:5864' } };
    // Should fallback to enabled target instead of disabled one
    assert.strictEqual(proxy.resolveTargetForRequest(reqDisabled).id, 'antigravity');
  });

  await t.test('checkAuth validates session cookies and query tokens correctly', () => {
    const auth = require('../lib/auth');
    const validCookie = auth.generateSessionCookie();

    // Valid cookie
    const reqWithCookie = { url: '/agent/opencode', headers: { host: '127.0.0.1:5864', cookie: `mobile_auth=${validCookie}` } };
    const res1 = proxy.checkAuth(reqWithCookie);
    assert.strictEqual(res1.auth, true);

    // Valid query token
    const reqWithToken = { url: `/?token=${auth.SECURE_TOKEN}`, headers: { host: '127.0.0.1:5864' } };
    const res2 = proxy.checkAuth(reqWithToken);
    assert.strictEqual(res2.auth, true);
    assert.strictEqual(res2.hasToken, true);

    // Invalid token
    const reqInvalid = { url: '/?token=invalid_token_here', headers: { host: '127.0.0.1:5864' } };
    const res3 = proxy.checkAuth(reqInvalid);
    assert.strictEqual(res3.auth, false);
  });
});
