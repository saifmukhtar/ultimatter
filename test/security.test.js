const test = require('node:test');
const assert = require('node:assert');
const security = require('../lib/security');

test('Security Module - Rate Limiter and IP Banning', async (t) => {
  const testIp = '198.51.100.42';

  await t.test('unbanned IP initially returns false', () => {
    assert.strictEqual(security.isIpBanned(testIp), false);
  });

  await t.test('4 failed attempts do not trigger ban', () => {
    for (let i = 0; i < 4; i++) {
      security.recordFailedAttempt(testIp);
    }
    assert.strictEqual(security.isIpBanned(testIp), false);
  });

  await t.test('5th failed attempt triggers 15-minute ban', () => {
    security.recordFailedAttempt(testIp);
    assert.strictEqual(security.isIpBanned(testIp), true);
  });

  await t.test('clearFailedAttempts unlocks the IP', () => {
    security.clearFailedAttempts(testIp);
    assert.strictEqual(security.isIpBanned(testIp), false);
  });
});
