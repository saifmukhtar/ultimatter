const test = require('node:test');
const assert = require('node:assert');
const auth = require('../lib/auth');
const security = require('../lib/security');
const http = require('http');

test('Security Module - Rate Limiter and IP Banning', async (t) => {
  const testIp = '198.51.100.42';

  await t.test('unbanned IP initially returns false', () => {
    security.clearAllBans();
    assert.strictEqual(security.isIpBanned(testIp), false);
  });

  await t.test('19 failed attempts with debouncing do not trigger ban', () => {
    security.clearAllBans();
    const originalNow = Date.now;
    try {
      let currentTime = originalNow();
      Date.now = () => currentTime;
      for (let i = 0; i < 19; i++) {
        security.recordFailedAttempt(testIp);
        currentTime += 1100; // bypass debounce
      }
      assert.strictEqual(security.isIpBanned(testIp), false);
    } finally {
      Date.now = originalNow;
    }
  });

  await t.test('20th failed attempt triggers 15-minute ban', () => {
    security.clearAllBans();
    const originalNow = Date.now;
    try {
      let currentTime = originalNow();
      Date.now = () => currentTime;
      for (let i = 0; i < 20; i++) {
        security.recordFailedAttempt(testIp);
        currentTime += 1100; // bypass 1000ms debounce
      }
      assert.strictEqual(security.isIpBanned(testIp), true);
    } finally {
      Date.now = originalNow;
    }
  });

  await t.test('clearFailedAttempts and clearAllBans unlock IPs', () => {
    security.clearAllBans();
    const originalNow = Date.now;
    try {
      let currentTime = originalNow();
      Date.now = () => currentTime;
      for (let i = 0; i < 20; i++) {
        security.recordFailedAttempt(testIp);
        currentTime += 1100;
      }
      assert.strictEqual(security.isIpBanned(testIp), true);
      
      security.clearFailedAttempts(testIp);
      assert.strictEqual(security.isIpBanned(testIp), false);

      // Test clearAllBans
      for (let i = 0; i < 20; i++) {
        security.recordFailedAttempt(testIp);
        currentTime += 1100;
      }
      assert.strictEqual(security.isIpBanned(testIp), true);
      security.clearAllBans();
      assert.strictEqual(security.isIpBanned(testIp), false);
    } finally {
      Date.now = originalNow;
    }
  });

  await t.test('Ban logic correctly handles multiple IPs independently', () => {
    security.clearAllBans();
    const ipA = '10.0.0.1';
    const ipB = '10.0.0.2';
    
    const originalNow = Date.now;
    try {
      let currentTime = originalNow();
      Date.now = () => currentTime;
      for (let i = 0; i < 20; i++) {
        security.recordFailedAttempt(ipA);
        currentTime += 1100;
      }
      security.recordFailedAttempt(ipB);

      assert.strictEqual(security.isIpBanned(ipA), true);
      assert.strictEqual(security.isIpBanned(ipB), false);
    } finally {
      Date.now = originalNow;
    }
  });

  await t.test('normalizeIp correctly handles IPv4-mapped IPv6 addresses', () => {
    assert.strictEqual(security.normalizeIp('::ffff:192.168.1.1'), '192.168.1.1');
    assert.strictEqual(security.normalizeIp('192.168.1.1'), '192.168.1.1');
    assert.strictEqual(security.normalizeIp('::1'), '::1');
  });

  await t.test('normalizeIp returns empty string for null or undefined', () => {
    assert.strictEqual(security.normalizeIp(null), '');
    assert.strictEqual(security.normalizeIp(undefined), '');
  });
});

test('Security Module - Authentication & Exchange Tokens', async (t) => {
  await t.test('Exchange token used twice -> second use fails', () => {
    const token = auth.generateExchangeToken();
    const firstUse = auth.verifyExchangeToken(token);
    const secondUse = auth.verifyExchangeToken(token);
    assert.strictEqual(firstUse, true);
    assert.strictEqual(secondUse, false);
  });
  
  await t.test('Exchange token after 11 minutes -> fails', () => {
    const token = auth.generateExchangeToken();
    const originalNow = Date.now;
    try {
      Date.now = () => originalNow() + (11 * 60 * 1000);
      const isValid = auth.verifyExchangeToken(token);
      assert.strictEqual(isValid, false);
    } finally {
      Date.now = originalNow;
    }
  });

  await t.test('Invalid or fake token fails verifyExchangeToken', () => {
    assert.strictEqual(auth.verifyExchangeToken('not-a-real-token'), false);
    assert.strictEqual(auth.verifyExchangeToken(''), false);
    assert.strictEqual(auth.verifyExchangeToken(null), false);
  });
});

test('Security Module - HTML Escaping & XSS', async (t) => {
  const hub = require('../lib/hub');

  await t.test('escapeHTML escapes HTML text context', () => {
    const html = hub.getHubHtml([], [{id: '<script>alert(1)</script>', name: 'malicious', port: 1234}]);
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(!html.includes('<script>alert(1)</script>'));
  });

  await t.test('escapeHTML escapes attribute context', () => {
    const evilId = '" onmouseover="alert(1)';
    const html = hub.getHubHtml(
      [],
      [{ id: evilId, name: 'x', port: 1234 }]
    );
    assert.ok(!html.includes('onmouseover="alert(1)"'));
    assert.ok(html.includes('&quot;'));
  });

  await t.test('no inline onclick attributes emitted on agent cards', () => {
    const html = hub.getHubHtml([], [{ id: 'safe', name: 'x', port: 1234 }]);
    const agentCardMatch = html.match(/<div class="agent-card[^>]*>/g);
    assert.ok(agentCardMatch.length > 0);
    assert.ok(!agentCardMatch[0].includes('onclick='));
  });
});

test('Security Module - DNS Rebinding & Host Validation', async (t) => {
  let server, port;

  t.before(async () => {
    const { startControlServer } = require('../lib/control-server');
    server = startControlServer({
      localIp: '127.0.0.1',
      dashboardPort: 0,
      getActiveTargets: () => [],
      getAllowTailscale: () => false,
      setAllowTailscale: () => {},
      reloadTlsContext: () => {},
      shutdownGateway: () => {}
    });

    await new Promise(resolve => {
      if (server.listening) resolve();
      else server.on('listening', resolve);
    });
    
    port = server.address().port;
  });

  t.after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
  });

  await t.test('Exact Host checks block malicious DNS rebinding', async () => {
    const badHosts = ['localhost.evil.com', '127.0.0.1.attacker.com'];
    for (const badHost of badHosts) {
      const res = await new Promise(resolve => {
        const req = http.request({
          hostname: '127.0.0.1', port,
          path: '/api/dashboard/exchange-token',
          method: 'POST',
          headers: { 'Host': badHost }
        }, resolve);
        req.end();
      });
      assert.strictEqual(res.statusCode, 403, `Host: ${badHost} should be 403`);
    }
  });

  await t.test('Status payload does not leak master token or SECURE_TOKEN', async () => {
    const res3 = await new Promise(resolve => {
      const req = http.request({
        hostname: '127.0.0.1', port,
        path: '/api/dashboard/status',
        method: 'GET',
        headers: { 'Host': 'localhost:' + port }
      }, resolve);
      req.end();
    });
    
    let body = '';
    for await (const chunk of res3) body += chunk;
    const data = JSON.parse(body);
    
    assert.strictEqual(data.token, undefined);
    assert.strictEqual(data.SECURE_TOKEN, undefined);
  });
});
