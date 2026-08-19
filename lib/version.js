const https = require('https');

const CURRENT_VERSION = '1.0.0';
const RAW_PACKAGE_URL = 'https://raw.githubusercontent.com/saifmukhtar/ultimatter/main/package.json';
const RELEASES_URL = 'https://github.com/saifmukhtar/ultimatter/releases';
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

let cachedInfo = {
  currentVersion: CURRENT_VERSION,
  latestVersion: CURRENT_VERSION,
  hasUpdate: false,
  releaseUrl: RELEASES_URL,
  lastChecked: 0
};

/**
 * Compares two semantic version strings (e.g. "1.1.0" vs "1.0.0").
 * Returns true if remote is strictly newer than current.
 * 
 * @param {string} current
 * @param {string} remote
 * @returns {boolean}
 */
const isNewerVersion = (current, remote) => {
  if (!current || !remote) return false;
  const parse = (v) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const [cMaj, cMin, cPatch] = parse(current);
  const [rMaj, rMin, rPatch] = parse(remote);

  if (rMaj > cMaj) return true;
  if (rMaj === cMaj && rMin > cMin) return true;
  if (rMaj === cMaj && rMin === cMin && rPatch > cPatch) return true;
  return false;
};

/**
 * Checks GitHub raw CDN for the latest release version.
 * Non-blocking, cached, and 0-dependency.
 * 
 * @param {function(object): void} [callback]
 */
const checkLatestVersion = (callback) => {
  const now = Date.now();
  if (cachedInfo.lastChecked && (now - cachedInfo.lastChecked < CACHE_DURATION_MS)) {
    if (callback) callback(cachedInfo);
    return;
  }

  const req = https.get(RAW_PACKAGE_URL, {
    headers: { 'User-Agent': 'Ultimatter-App' },
    timeout: 3000
  }, (res) => {
    if (res.statusCode !== 200) {
      if (callback) callback(cachedInfo);
      return;
    }

    let rawData = '';
    res.on('data', chunk => { rawData += chunk; });
    res.on('end', () => {
      try {
        const pkg = JSON.parse(rawData);
        const remoteVersion = pkg.version ? pkg.version.trim() : CURRENT_VERSION;
        const hasUpdate = isNewerVersion(CURRENT_VERSION, remoteVersion);

        cachedInfo = {
          currentVersion: CURRENT_VERSION,
          latestVersion: remoteVersion,
          hasUpdate,
          releaseUrl: RELEASES_URL,
          lastChecked: Date.now()
        };

        if (callback) callback(cachedInfo);
      } catch (e) {
        if (callback) callback(cachedInfo);
      }
    });
  });

  req.on('error', () => {
    if (callback) callback(cachedInfo);
  });
  req.on('timeout', () => {
    req.destroy();
    if (callback) callback(cachedInfo);
  });
};

const getCachedVersionInfo = () => cachedInfo;

module.exports = {
  CURRENT_VERSION,
  RAW_PACKAGE_URL,
  RELEASES_URL,
  isNewerVersion,
  checkLatestVersion,
  getCachedVersionInfo
};
