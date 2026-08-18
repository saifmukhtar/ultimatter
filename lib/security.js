/**
 * In-memory store for IP rate limiting and brute-force protection.
 * Map<string, { attempts: number, bannedUntil: number, lastAttempt: number }>
 */
const rateLimits = new Map();

const MAX_FAILED_ATTEMPTS = 5;
const BAN_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Checks whether an IP address is currently banned.
 * Automatically cleans up expired bans.
 * 
 * @param {string} ip - The client IP address
 * @returns {boolean} True if the IP is currently banned
 */
const isIpBanned = (ip) => {
  const record = rateLimits.get(ip);
  if (!record) return false;

  const now = Date.now();
  if (record.bannedUntil > now) {
    return true;
  }

  // Ban expired: clear the record to free memory
  if (record.bannedUntil > 0) {
    rateLimits.delete(ip);
  }

  return false;
};

/**
 * Records a failed authentication attempt for a given IP.
 * Triggers a 15-minute ban if the threshold is exceeded.
 * 
 * @param {string} ip - The client IP address
 */
const recordFailedAttempt = (ip) => {
  const now = Date.now();
  let record = rateLimits.get(ip) || { attempts: 0, bannedUntil: 0, lastAttempt: now };

  // Reset counter if previous attempt was more than 15 minutes ago
  if (now - record.lastAttempt > BAN_DURATION_MS && record.bannedUntil === 0) {
    record.attempts = 0;
  }

  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.bannedUntil = now + BAN_DURATION_MS;
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`\n🚨 SECURITY ALERT: Banned IP ${ip} for 15 minutes due to repeated authentication failures.`);
    }
  }

  rateLimits.set(ip, record);
};

/**
 * Clears failed attempts when an IP successfully authenticates.
 * 
 * @param {string} ip - The client IP address
 */
const clearFailedAttempts = (ip) => {
  rateLimits.delete(ip);
};

module.exports = {
  isIpBanned,
  recordFailedAttempt,
  clearFailedAttempts
};
