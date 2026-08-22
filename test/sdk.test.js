const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const https = require('https');
const { createMobileGateway, PROXY_PORT, DASHBOARD_PORT } = require('../index');

/**
 * Helper to execute an authenticated HTTPS request to the gateway proxy,
 * exchanging the URL token for a signed session cookie and fetching the destination page.
 */
const fetchGatewayPage = async (url) => {
  const cookie = await new Promise((resolve, reject) => {
    const req = https.get(url, { rejectUnauthorized: false, agent: false }, (res) => {
      const rawCookie = res.headers['set-cookie'] || [];
      resolve(Array.isArray(rawCookie) ? rawCookie.join('; ') : rawCookie);
    });
    req.on('error', reject);
  });

  return new Promise((resolve, reject) => {
    const targetUrl = new URL(url);
    targetUrl.search = '';
    const req = https.get(targetUrl.toString(), {
      rejectUnauthorized: false,
      agent: false,
      headers: { 'Cookie': cookie }
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
  });
};

test('SDK Module - Programmatic Library API', async (t) => {
  // Spawn a mock upstream web server on an ephemeral port
  const mockUpstream = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<html><head><title>My Mock App</title></head><body><h1>Hello from Local Dev Server!</h1></body></html>');
  });

  const upstreamPort = await new Promise((resolve) => {
    mockUpstream.listen(0, '127.0.0.1', () => {
      resolve(mockUpstream.address().port);
    });
  });

  await t.test('createMobileGateway wraps a local port with TLS, QR, and token auth', async () => {
    const testProxyPort = 15864;
    const testDashboardPort = 15866;
    const gateway = await createMobileGateway({
      target: upstreamPort,
      port: testProxyPort,
      dashboardPort: testDashboardPort,
      appName: 'Unit Test App',
      icon: '🧪',
      enableControlServer: false,
      enableTailscale: false,
      printQr: false
    });

    assert.ok(gateway.server);
    assert.strictEqual(typeof gateway.close, 'function');
    assert.strictEqual(typeof gateway.mobileUrl, 'string');
    assert.strictEqual(typeof gateway.token, 'string');
    assert.strictEqual(typeof gateway.qrSvg, 'string');
    assert.ok(gateway.qrSvg.includes('<svg'));
    assert.ok(gateway.mobileUrl.includes(`:${testProxyPort}/?token=`));

    // Make an authenticated HTTPS request to the gateway proxy
    const responseData = await fetchGatewayPage(gateway.mobileUrl);

    assert.strictEqual(responseData.status, 200);
    // Directly proxied to mock upstream without Hub intermediate screen
    assert.ok(responseData.body.includes('Hello from Local Dev Server!'));
    // Injected PWA tags
    assert.ok(responseData.body.includes('manifest.webmanifest'));

    await gateway.close();
  });

  await t.test('createMobileGateway supports URL target string format', async () => {
    const testProxyPort = 15867;
    const testDashboardPort = 15868;
    const gateway = await createMobileGateway({
      target: `http://127.0.0.1:${upstreamPort}`,
      port: testProxyPort,
      dashboardPort: testDashboardPort,
      appName: 'URL App',
      enableControlServer: false,
      enableTailscale: false,
      printQr: false
    });

    assert.ok(gateway.server);
    const responseData = await fetchGatewayPage(gateway.mobileUrl);
    assert.strictEqual(responseData.status, 200);
    assert.ok(responseData.body.includes('Hello from Local Dev Server!'));

    await gateway.close();
  });

  await t.test('createMobileGateway with multiple targets automatically serves Mobile Hub', async () => {
    const testProxyPort = 15869;
    const testDashboardPort = 15870;
    const gateway = await createMobileGateway({
      targets: [
        { id: 'web', name: 'Web Dashboard', port: upstreamPort, icon: '🌐' },
        { id: 'api', name: 'GraphQL API', port: upstreamPort, icon: '⚡' }
      ],
      port: testProxyPort,
      dashboardPort: testDashboardPort,
      enableControlServer: false,
      enableTailscale: false,
      printQr: false
    });

    // Make an authenticated HTTPS request to the gateway proxy
    const responseData = await fetchGatewayPage(gateway.mobileUrl);

    assert.strictEqual(responseData.status, 200);
    // Serves Hub with target cards
    assert.ok(responseData.body.includes('Ultimatter Hub'));
    assert.ok(responseData.body.includes('Web Dashboard'));
    assert.ok(responseData.body.includes('GraphQL API'));

    await gateway.close();
  });

  // Cleanup mock upstream
  await new Promise((resolve) => mockUpstream.close(resolve));
});
