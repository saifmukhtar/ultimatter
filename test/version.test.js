const test = require('node:test');
const assert = require('node:assert');
const version = require('../lib/version');

test('Version Module - Semver Comparison & Cache Handling', async (t) => {
  await t.test('isNewerVersion correctly compares semantic versions', () => {
    // Newer major
    assert.strictEqual(version.isNewerVersion('1.0.0', '2.0.0'), true);
    // Newer minor
    assert.strictEqual(version.isNewerVersion('1.0.0', '1.1.0'), true);
    // Newer patch
    assert.strictEqual(version.isNewerVersion('1.0.0', '1.0.1'), true);
    // Same version
    assert.strictEqual(version.isNewerVersion('1.0.0', '1.0.0'), false);
    // Older version
    assert.strictEqual(version.isNewerVersion('1.1.0', '1.0.0'), false);
    // With v prefix
    assert.strictEqual(version.isNewerVersion('v1.0.0', 'v1.2.0'), true);
  });

  await t.test('getCachedVersionInfo returns valid object structure', () => {
    const info = version.getCachedVersionInfo();
    assert.strictEqual(typeof info, 'object');
    assert.strictEqual(typeof info.currentVersion, 'string');
    assert.strictEqual(typeof info.hasUpdate, 'boolean');
    assert.strictEqual(typeof info.releaseUrl, 'string');
  });

  await t.test('checkLatestVersion invokes callback gracefully without throwing', (t, done) => {
    version.checkLatestVersion((info) => {
      assert.strictEqual(typeof info, 'object');
      assert.strictEqual(typeof info.currentVersion, 'string');
      done();
    });
  });
});
