const crypto = require('crypto');
const fs = require('fs');
const { SECRETS_FILE } = require('./config');

/**
 * Loads existing cryptographic secrets from disk or generates a fresh set.
 * 
 * @returns {{ secureToken: string, hmacSecret: string }}
 */
const loadOrGenerateSecrets = () => {
  if (fs.existsSync(SECRETS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8'));
    } catch (e) {
      // If corrupted, regenerate below
    }
  }

  const secrets = {
    secureToken: crypto.randomBytes(32).toString('hex'),
    hmacSecret: crypto.randomBytes(32).toString('hex')
  };

  // Write with strict user-only read/write permissions (0o600)
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(secrets, null, 2), { mode: 0o600 });
  return secrets;
};

const secrets = loadOrGenerateSecrets();

/** Cookie duration for authenticated mobile sessions: 30 days */
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * Generates an HMAC-SHA256 signed session cookie (format: "sessionId.timestamp.signature").
 * 
 * @returns {string} Signed timestamped cookie string
 */
const generateSessionCookie = () => {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now().toString();
  const payload = `${sessionId}.${timestamp}`;
  const signature = crypto.createHmac('sha256', secrets.hmacSecret).update(payload).digest('hex');
  return `${payload}.${signature}`;
};

// Sub-millisecond in-memory cache for validated session cookies (cookieValue -> validUntilMs)
const sessionCookieCache = new Map();
const COOKIE_CACHE_TTL_MS = 5000; // 5 seconds micro-cache

/**
 * Validates the cryptographic signature and timestamp of a session cookie using timing-safe comparison.
 * Utilizes a bounded 5-second in-memory micro-cache for sub-millisecond throughput during parallel asset bursts.
 * 
 * @param {string} cookieValue - The raw session cookie string
 * @returns {boolean} True if signature is authentic and within the 30-day validity window
 */
const verifySessionCookie = (cookieValue) => {
  if (typeof cookieValue !== 'string') return false;

  const now = Date.now();

  // Fast-path: micro-cache hit
  const cachedUntil = sessionCookieCache.get(cookieValue);
  if (cachedUntil && cachedUntil > now) {
    return true;
  }

  const parts = cookieValue.split('.');
  if (parts.length !== 3) return false;

  const [sessionId, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp) || timestamp <= 0) return false;

  // Check 30-day chronological expiry
  const maxAgeMs = COOKIE_MAX_AGE_SECONDS * 1000;
  if (now - timestamp > maxAgeMs) return false;

  const payload = `${sessionId}.${timestampStr}`;
  const expectedSignature = crypto.createHmac('sha256', secrets.hmacSecret).update(payload).digest('hex');
  
  if (signature.length !== expectedSignature.length) return false;

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  );

  if (isValid) {
    // Bounded cache maintenance
    if (sessionCookieCache.size > 1000) {
      for (const [key, exp] of sessionCookieCache.entries()) {
        if (exp <= now) sessionCookieCache.delete(key);
      }
    }
    sessionCookieCache.set(cookieValue, now + COOKIE_CACHE_TTL_MS);
  }

  return isValid;
};

/**
 * Validates an incoming access token against the configured secureToken.
 * 
 * @param {string} token - The raw access token from query param or header
 * @returns {boolean} True if token matches
 */
const verifyToken = (token) => {
  if (typeof token !== 'string' || token.length !== secrets.secureToken.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(token, 'utf8'),
    Buffer.from(secrets.secureToken, 'utf8')
  );
};

/**
 * Regenerates the 256-bit secureToken and HMAC secret, saving them to disk.
 * This instantly invalidates all existing session cookies and flushes the micro-cache.
 * 
 * @returns {string} The new secure token
 */
const resetSecrets = () => {
  secrets.secureToken = crypto.randomBytes(32).toString('hex');
  secrets.hmacSecret = crypto.randomBytes(32).toString('hex');
  sessionCookieCache.clear();
  
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(secrets, null, 2), { mode: 0o600 });
  return secrets.secureToken;
};

const getSecureToken = () => secrets.secureToken;
const getCookieCacheSize = () => sessionCookieCache.size;

const authModule = {
  get SECURE_TOKEN() {
    return secrets.secureToken;
  },
  getSecureToken,
  resetSecrets,
  COOKIE_MAX_AGE_SECONDS,
  generateSessionCookie,
  verifySessionCookie,
  verifyToken,
  getCookieCacheSize
};

module.exports = authModule;

