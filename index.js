/**
 * Ultimatter - Universal Mobile Gateway SDK for Local Dev & AI Coding Agents
 * 
 * Provides programmatic APIs to wrap any local web application or service
 * into a secure, mobile-paired, HTTP/2 reverse proxy with automatic local TLS
 * and Tailscale MagicDNS encryption.
 */

const { createMobileGateway } = require('./lib/gateway');
const proxy = require('./lib/proxy');
const network = require('./lib/network');
const auth = require('./lib/auth');
const security = require('./lib/security');
const dashboard = require('./lib/dashboard');
const hub = require('./lib/hub');
const pwa = require('./lib/pwa');
const version = require('./lib/version');

module.exports = {
  createMobileGateway,
  startProxy: proxy.startProxy,
  updateTargets: proxy.updateTargets,
  resolveTargetForRequest: proxy.resolveTargetForRequest,
  PROXY_PORT: proxy.PROXY_PORT,
  DASHBOARD_PORT: proxy.DASHBOARD_PORT,
  network,
  auth,
  security,
  dashboard,
  hub,
  pwa,
  version
};
