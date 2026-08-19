const test = require('node:test');
const assert = require('node:assert');
const auth = require('../lib/auth');

test('Auth Module - Token Verification', async (t) => {
  await t.test('returns true for valid secureToken', () => {
    assert.strictEqual(auth.verifyToken(auth.SECURE_TOKEN), true);
  });

  await t.test('returns false for invalid token', () => {
    assert.strictEqual(auth.verifyToken('invalid_token_123'), false);
    assert.strictEqual(auth.verifyToken(''), false);
    assert.strictEqual(auth.verifyToken(null), false);
    assert.strictEqual(auth.verifyToken(undefined), false);
  });

  await t.test('returns false for wrong length token', () => {
    assert.strictEqual(auth.verifyToken(auth.SECURE_TOKEN.slice(0, 10)), false);
  });
});

test('Auth Module - Session Cookie Management', async (t) => {
  await t.test('generates valid signed session cookie', () => {
    const cookie = auth.generateSessionCookie();
    assert.strictEqual(typeof cookie, 'string');
    assert.strictEqual(cookie.includes('.'), true);
    assert.strictEqual(auth.verifySessionCookie(cookie), true);
  });

  await t.test('rejects tampered session cookies', () => {
    const cookie = auth.generateSessionCookie();
    const [sessionId, sig] = cookie.split('.');
    
    // Tamper with payload
    const tamperedPayload = `tampered${sessionId.slice(8)}.${sig}`;
    assert.strictEqual(auth.verifySessionCookie(tamperedPayload), false);

    // Tamper with signature
    const tamperedSig = `${sessionId}.${sig.slice(0, -4)}0000`;
    assert.strictEqual(auth.verifySessionCookie(tamperedSig), false);

    // Invalid format
    assert.strictEqual(auth.verifySessionCookie('random_string_no_dot'), false);
    assert.strictEqual(auth.verifySessionCookie(''), false);
    assert.strictEqual(auth.verifySessionCookie(null), false);
  });

  await t.test('exports 30-day cookie max age (2,592,000s)', () => {
    assert.strictEqual(auth.COOKIE_MAX_AGE_SECONDS, 30 * 24 * 60 * 60);
  });
});
