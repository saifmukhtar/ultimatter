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

  await t.test('SETTINGS_FILE points inside CONFIG_DIR', () => {
    assert.strictEqual(config.SETTINGS_FILE.startsWith(config.CONFIG_DIR), true);
  });

  await t.test('network module manages local mDNS domain', () => {
    const network = require('../lib/network');
    const originalDomain = network.getLocalDomain();

    try {
      const updated = network.setLocalDomain('test-host');
      assert.strictEqual(updated, 'test-host.local');
      assert.strictEqual(network.getLocalDomain(), 'test-host.local');
    } finally {
      // Clean up test domain and restore or remove settings file
      if (fs.existsSync(config.SETTINGS_FILE)) {
        fs.unlinkSync(config.SETTINGS_FILE);
      }
    }
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

    const procPorts = network.getProcListeningPorts();
    assert.strictEqual(Array.isArray(procPorts), true);

    const fingerprint = network.getLinuxSocketFingerprint();
    assert.strictEqual(typeof fingerprint, 'string');
  });

  await t.test('AGENT_TARGETS contains unified definitions for Antigravity and OpenCode', () => {
    const network = require('../lib/network');
    assert.strictEqual(Array.isArray(network.AGENT_TARGETS), true);
    assert.strictEqual(network.AGENT_TARGETS.length, 2);

    const antigravity = network.AGENT_TARGETS.find(t => t.id === 'antigravity');
    assert.ok(antigravity);
    assert.strictEqual(antigravity.protocol, 'https');
    assert.strictEqual(antigravity.processPattern, 'language_server');

    const opencode = network.AGENT_TARGETS.find(t => t.id === 'opencode');
    assert.ok(opencode);
    assert.strictEqual(opencode.protocol, 'http');
    assert.strictEqual(opencode.defaultPort, 4096);
    assert.strictEqual(opencode.processPattern, 'opencode');
  });

  await t.test('hub module generates valid HTML document with agent cards', () => {
    const hub = require('../lib/hub');
    const network = require('../lib/network');
    
    // 1. Test active targets rendering
    const activeHtml = hub.getHubHtml(network.AGENT_TARGETS, [network.AGENT_TARGETS[0], network.AGENT_TARGETS[1]], 'test-token');
    assert.strictEqual(typeof activeHtml, 'string');
    assert.strictEqual(activeHtml.includes('Ultimatter Hub'), true);
    assert.strictEqual(activeHtml.includes('Google Antigravity'), true);
    assert.strictEqual(activeHtml.includes('OpenCode'), true);
    assert.strictEqual(activeHtml.includes('switchAgent'), true);

    // 2. Test empty state when 0 agents active
    const emptyHtml = hub.getHubHtml(network.AGENT_TARGETS, [], 'test-token');
    assert.strictEqual(emptyHtml.includes('Waiting for Desktop Agents'), true);
  });

  await t.test('config module manages mobile bubble preference', () => {
    try {
      // Default should be false
      assert.strictEqual(config.getBubbleEnabled(), false);

      // Enable and verify
      config.setBubbleEnabled(true);
      assert.strictEqual(config.getBubbleEnabled(), true);

      // Disable and verify
      config.setBubbleEnabled(false);
      assert.strictEqual(config.getBubbleEnabled(), false);
    } finally {
      if (fs.existsSync(config.SETTINGS_FILE)) {
        fs.unlinkSync(config.SETTINGS_FILE);
      }
    }
  });
});
