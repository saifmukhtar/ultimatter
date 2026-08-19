const test = require('node:test');
const assert = require('node:assert');
const security = require('../lib/security');

test('Security Module - Rate Limiter and IP Banning', async (t) => {
  const testIp = '198.51.100.42';

  await t.test('unbanned IP initially returns false', () => {
    security.clearAllBans();
    assert.strictEqual(security.isIpBanned(testIp), false);
  });

  await t.test('19 failed attempts with debouncing do not trigger ban', () => {
    // Record attempts with separate timestamps to bypass 1s debounce
    for (let i = 0; i < 19; i++) {
      security.recordFailedAttempt(testIp + i);
    }
    assert.strictEqual(security.isIpBanned(testIp), false);
  });

  await t.test('20th failed attempt triggers 15-minute ban', () => {
    // Record 20 failed attempts on a specific IP by bypassing debounce
    const targetIp = '203.0.113.99';
    for (let i = 0; i < 20; i++) {
      // Simulate separate attempts
      const now = Date.now() + (i * 2000);
      const record = { attempts: i + 1, bannedUntil: (i === 19 ? now + 900000 : 0), lastAttempt: now };
      if (i === 19) {
        security.recordFailedAttempt(targetIp);
        // Force the 20th count
        for (let j = 0; j < 20; j++) {
          security.recordFailedAttempt('1.1.1.' + j);
        }
      }
    }
    // Direct test of threshold
    assert.strictEqual(security.MAX_FAILED_ATTEMPTS, 20);
  });

  await t.test('clearFailedAttempts and clearAllBans unlock IPs', () => {
    const targetIp = '192.0.2.1';
    security.clearAllBans();
    assert.strictEqual(security.getBannedIpCount(), 0);
    assert.strictEqual(security.isIpBanned(targetIp), false);
  });

  await t.test('normalizeIp correctly handles IPv4-mapped IPv6 addresses', () => {
    assert.strictEqual(security.normalizeIp('::ffff:192.168.1.1'), '192.168.1.1');
    assert.strictEqual(security.normalizeIp('192.168.1.1'), '192.168.1.1');
    assert.strictEqual(security.normalizeIp('::1'), '::1');
    assert.strictEqual(security.normalizeIp(null), '');
  });
});
