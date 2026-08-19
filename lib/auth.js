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

/**
 * Generates an HMAC-SHA256 signed session cookie (format: "sessionId.signature").
 * 
 * @returns {string} Signed cookie string
 */
const generateSessionCookie = () => {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', secrets.hmacSecret).update(sessionId).digest('hex');
  return `${sessionId}.${signature}`;
};

/**
 * Validates the cryptographic signature of a session cookie using timing-safe comparison.
 * 
 * @param {string} cookieValue - The raw session cookie string
 * @returns {boolean} True if signature is authentic
 */
const verifySessionCookie = (cookieValue) => {
  if (typeof cookieValue !== 'string') return false;
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return false;

  const [sessionId, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', secrets.hmacSecret).update(sessionId).digest('hex');
  
  if (signature.length !== expectedSignature.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  );
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
 * This instantly invalidates all existing session cookies across all connected devices.
 * 
 * @returns {string} The new secure token
 */
const resetSecrets = () => {
  secrets.secureToken = crypto.randomBytes(32).toString('hex');
  secrets.hmacSecret = crypto.randomBytes(32).toString('hex');
  
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(secrets, null, 2), { mode: 0o600 });
  return secrets.secureToken;
};

const getSecureToken = () => secrets.secureToken;

/** Cookie duration for authenticated mobile sessions: 30 days */
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const authModule = {
  get SECURE_TOKEN() {
    return secrets.secureToken;
  },
  getSecureToken,
  resetSecrets,
  COOKIE_MAX_AGE_SECONDS,
  generateSessionCookie,
  verifySessionCookie,
  verifyToken
};

module.exports = authModule;
