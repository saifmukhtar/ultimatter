/**
 * In-memory store for IP rate limiting and brute-force protection.
 * Map<string, { attempts: number, bannedUntil: number, lastAttempt: number }>
 */
const rateLimits = new Map();

const MAX_FAILED_ATTEMPTS = 20;
const BAN_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const DEBOUNCE_WINDOW_MS = 1000; // 1 second burst debounce

/**
 * Normalizes client IP addresses by stripping IPv4-mapped IPv6 prefixes (::ffff:).
 * 
 * @param {string} ip - Raw remote address
 * @returns {string} Clean normalized IP
 */
const normalizeIp = (ip) => {
  if (typeof ip !== 'string') return '';
  return ip.replace(/^::ffff:/, '').trim();
};

/**
 * Checks whether an IP address is currently banned.
 * Automatically cleans up expired bans.
 * 
 * @param {string} ip - The client IP address
 * @returns {boolean} True if the IP is currently banned
 */
const isIpBanned = (ip) => {
  const cleanIp = normalizeIp(ip);
  if (!cleanIp) return false;
  
  const record = rateLimits.get(cleanIp);
  if (!record) return false;

  const now = Date.now();
  if (record.bannedUntil > now) {
    return true;
  }

  // Ban expired: clear the record to free memory
  if (record.bannedUntil > 0) {
    rateLimits.delete(cleanIp);
  }

  return false;
};

/**
 * Records a failed authentication attempt for a given IP.
 * Debounces rapid bursts within 1000ms (such as parallel asset fetches with an outdated token).
 * Triggers a 15-minute ban if 20 failed attempts are exceeded.
 * 
 * @param {string} ip - The client IP address
 */
const recordFailedAttempt = (ip) => {
  const cleanIp = normalizeIp(ip);
  if (!cleanIp) return;
  
  const now = Date.now();
  let record = rateLimits.get(cleanIp) || { attempts: 0, bannedUntil: 0, lastAttempt: 0 };

  // Reset counter if previous attempt was more than 15 minutes ago
  if (now - record.lastAttempt > BAN_DURATION_MS && record.bannedUntil === 0) {
    record.attempts = 0;
  }

  // Debounce: if the previous failure from this IP occurred within 1000ms, update timestamp without incrementing strike count
  if (record.lastAttempt > 0 && (now - record.lastAttempt) < DEBOUNCE_WINDOW_MS) {
    record.lastAttempt = now;
    rateLimits.set(cleanIp, record);
    return;
  }

  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.bannedUntil = now + BAN_DURATION_MS;
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`\n🚨 SECURITY ALERT: Banned IP ${cleanIp} for 15 minutes due to repeated authentication failures.`);
    }
  }

  rateLimits.set(cleanIp, record);
};

/**
 * Clears failed attempts when an IP successfully authenticates.
 * 
 * @param {string} ip - The client IP address
 */
const clearFailedAttempts = (ip) => {
  const cleanIp = normalizeIp(ip);
  if (!cleanIp) return;
  rateLimits.delete(cleanIp);
};

/**
 * Clears all active IP bans and resets rate limiters.
 */
const clearAllBans = () => {
  rateLimits.clear();
};

/**
 * Returns the count of currently banned IP addresses.
 * 
 * @returns {number} Active ban count
 */
const getBannedIpCount = () => {
  const now = Date.now();
  let count = 0;
  for (const [ip, record] of rateLimits.entries()) {
    if (record.bannedUntil > now) {
      count += 1;
    } else if (record.bannedUntil > 0) {
      rateLimits.delete(ip);
    }
  }
  return count;
};

module.exports = {
  normalizeIp,
  isIpBanned,
  recordFailedAttempt,
  clearFailedAttempts,
  clearAllBans,
  getBannedIpCount,
  MAX_FAILED_ATTEMPTS
};
