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

  await t.test('AGENT_TARGETS contains unified definitions for Antigravity, OpenCode, and CloudCLI', () => {
    const network = require('../lib/network');
    assert.strictEqual(Array.isArray(network.AGENT_TARGETS), true);
    assert.strictEqual(network.AGENT_TARGETS.length, 3);

    const antigravity = network.AGENT_TARGETS.find(t => t.id === 'antigravity');
    assert.ok(antigravity);
    assert.strictEqual(antigravity.protocol, 'https');
    assert.strictEqual(antigravity.processPattern, 'language_server');

    const opencode = network.AGENT_TARGETS.find(t => t.id === 'opencode');
    assert.ok(opencode);
    assert.strictEqual(opencode.protocol, 'http');
    assert.strictEqual(opencode.defaultPort, 4096);
    assert.strictEqual(opencode.processPattern, 'opencode');

    const cloudcli = network.AGENT_TARGETS.find(t => t.id === 'cloudcli');
    assert.ok(cloudcli);
    assert.strictEqual(cloudcli.protocol, 'http');
    assert.strictEqual(cloudcli.defaultPort, 3001);
    assert.strictEqual(cloudcli.processPattern, 'cloudcli|claudecode|claude');
    assert.strictEqual(cloudcli.probePath, '/health');
  });

  await t.test('hub module generates valid HTML document with agent cards', () => {
    const hub = require('../lib/hub');
    const network = require('../lib/network');
    
    // 1. Test active targets rendering
    const activeHtml = hub.getHubHtml(network.AGENT_TARGETS, [network.AGENT_TARGETS[0], network.AGENT_TARGETS[1], network.AGENT_TARGETS[2]], 'test-token');
    assert.strictEqual(typeof activeHtml, 'string');
    assert.strictEqual(activeHtml.includes('Ultimatter Hub'), true);
    assert.strictEqual(activeHtml.includes('Google Antigravity'), true);
    assert.strictEqual(activeHtml.includes('OpenCode'), true);
    assert.strictEqual(activeHtml.includes('Claude Code'), true);
    // 2. Test empty state when 0 agents active
    const emptyHtml = hub.getHubHtml(network.AGENT_TARGETS, [], 'test-token');
    assert.strictEqual(emptyHtml.includes('Waiting for Desktop Agents'), true);
    assert.strictEqual(emptyHtml.includes('ca-download-card'), true);
  });

  await t.test('network module manages disabled agents list with persistence', () => {
    const network = require('../lib/network');
    try {
      // 1. Initially empty
      assert.deepStrictEqual(network.getDisabledAgents(), []);

      // 2. Disable cloudcli
      const disabled1 = network.setAgentEnabled('cloudcli', false);
      assert.deepStrictEqual(disabled1, ['cloudcli']);
      assert.deepStrictEqual(network.getDisabledAgents(), ['cloudcli']);

      // 3. Disable opencode
      const disabled2 = network.setAgentEnabled('opencode', false);
      assert.deepStrictEqual(disabled2, ['cloudcli', 'opencode']);
      assert.deepStrictEqual(network.getDisabledAgents(), ['cloudcli', 'opencode']);

      // 4. Re-enable cloudcli
      const disabled3 = network.setAgentEnabled('cloudcli', true);
      assert.deepStrictEqual(disabled3, ['opencode']);
      assert.deepStrictEqual(network.getDisabledAgents(), ['opencode']);

      // 5. Re-enable opencode
      const disabled4 = network.setAgentEnabled('opencode', true);
      assert.deepStrictEqual(disabled4, []);
      assert.deepStrictEqual(network.getDisabledAgents(), []);
    } finally {
      if (fs.existsSync(config.SETTINGS_FILE)) {
        fs.unlinkSync(config.SETTINGS_FILE);
      }
    }
  });

  await t.test('network module manages allowTailscale remote access persistence', () => {
    const network = require('../lib/network');
    try {
      // 1. Default is true
      assert.strictEqual(network.getAllowTailscale(), true);

      // 2. Set to false and verify persistence
      network.setAllowTailscale(false);
      assert.strictEqual(network.getAllowTailscale(), false);

      // 3. Set back to true and verify persistence
      network.setAllowTailscale(true);
      assert.strictEqual(network.getAllowTailscale(), true);
    } finally {
      if (fs.existsSync(config.SETTINGS_FILE)) {
        fs.unlinkSync(config.SETTINGS_FILE);
      }
    }
  });
});
