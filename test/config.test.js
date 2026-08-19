const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const config = require('../lib/config');

test('Config Module - Path Resolutions and Permissions', async (t) => {
  await t.test('CONFIG_DIR is properly resolved and exists', () => {
    assert.strictEqual(typeof config.CONFIG_DIR, 'string');
    assert.strictEqual(fs.existsSync(config.CONFIG_DIR), true);
  });

  await t.test('SECRETS_FILE points inside CONFIG_DIR', () => {
    assert.strictEqual(config.SECRETS_FILE.startsWith(config.CONFIG_DIR), true);
  });

  await t.test('LOCAL_CERT_FILE and LOCAL_KEY_FILE point inside CONFIG_DIR', () => {
    assert.strictEqual(config.LOCAL_CERT_FILE.startsWith(config.CONFIG_DIR), true);
    assert.strictEqual(config.LOCAL_KEY_FILE.startsWith(config.CONFIG_DIR), true);
  });

  await t.test('getTailscaleCertFiles resolves proper paths', () => {
    const files = config.getTailscaleCertFiles('node.tailnet.ts.net');
    assert.strictEqual(files.certFile.endsWith('node.tailnet.ts.net.crt'), true);
    assert.strictEqual(files.keyFile.endsWith('node.tailnet.ts.net.key'), true);
  });

  await t.test('network module discovers IP and Tailscale state object', () => {
    const network = require('../lib/network');
    const localIp = network.getLocalIp();
    assert.strictEqual(typeof localIp, 'string');
    assert.strictEqual(localIp.length > 0, true);

    const tsState = network.getTailscaleState();
    assert.strictEqual(typeof tsState, 'object');
    assert.strictEqual(['connected', 'stopped', 'not_installed'].includes(tsState.state), true);
    assert.strictEqual(Array.isArray(tsState.peers), true);
  });
});
