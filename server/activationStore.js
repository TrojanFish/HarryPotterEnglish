/**
 * Hogwarts Server Activation Code Store
 * Handles generation, redemption, stacking, and revocation of Pro activation codes.
 * Zero external dependencies: uses node:crypto exclusively.
 * Zero emojis allowed.
 */

import crypto from 'node:crypto';

export const TYPE_MAP = {
  MONTH_30:  { prefix: 'HP-M30-',  days: 30 },
  SEASON_90: { prefix: 'HP-Q90-',  days: 90 },
  YEAR_365:  { prefix: 'HP-Y365-', days: 365 },
  FOREVER:   { prefix: 'HP-PRO-',  days: null }
};

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// In-memory activation store: code -> record
const activations = new Map();

/**
 * Generate a 6-character random Crockford base32 suffix
 *
 * @param {string} prefix
 * @returns {string}
 */
function generateCodeString(prefix) {
  let result = prefix;
  for (let i = 0; i < 6; i++) {
    const idx = crypto.randomInt(0, CHARSET.length);
    result += CHARSET[idx];
  }
  return result;
}

/**
 * Generate batch activation codes
 *
 * @param {string} type - Key in TYPE_MAP
 * @param {number} count - 1 to 50 inclusive
 * @returns {string[]}
 */
export function generateActivationCodes(type, count) {
  if (!type || typeof type !== 'string' || !TYPE_MAP[type]) {
    const err = new Error(`Invalid activation code type: ${type}`);
    err.code = 'INVALID_TYPE';
    throw err;
  }

  if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > 50) {
    const err = new Error(`Invalid code count: ${count}. Count must be between 1 and 50.`);
    err.code = 'INVALID_COUNT';
    throw err;
  }

  const typeConfig = TYPE_MAP[type];
  const generatedCodes = [];

  for (let i = 0; i < count; i++) {
    let code;
    do {
      code = generateCodeString(typeConfig.prefix);
    } while (activations.has(code));

    const record = {
      code,
      type,
      durationDays: typeConfig.days,
      createdAt: Date.now(),
      redeemedAt: null,
      redeemedBy: null,
      revoked: false
    };

    activations.set(code, record);
    generatedCodes.push(code);
  }

  return generatedCodes;
}

/**
 * Redeem an activation code and calculate stacked Pro status
 *
 * @param {string} code
 * @param {string} userId
 * @param {object} [currentUser={}]
 * @returns {{ isPro: true, proExpiresAt: number|null }}
 */
export function redeemCode(code, userId, currentUser = {}) {
  if (!code || typeof code !== 'string') {
    const err = new Error('Activation code not found');
    err.code = 'CODE_NOT_FOUND';
    throw err;
  }

  const record = activations.get(code);
  if (!record) {
    const err = new Error('Activation code not found');
    err.code = 'CODE_NOT_FOUND';
    throw err;
  }

  if (record.revoked === true) {
    const err = new Error('Activation code has been revoked');
    err.code = 'CODE_REVOKED';
    throw err;
  }

  if (record.redeemedAt !== null && record.redeemedAt !== undefined) {
    const err = new Error('Activation code has already been redeemed');
    err.code = 'CODE_ALREADY_USED';
    throw err;
  }

  record.redeemedAt = Date.now();
  record.redeemedBy = userId;

  if (record.durationDays === null) {
    return { isPro: true, proExpiresAt: null };
  }

  const now = Date.now();
  const base = (
    currentUser &&
    currentUser.isPro &&
    typeof currentUser.proExpiresAt === 'number' &&
    currentUser.proExpiresAt > now
  )
    ? currentUser.proExpiresAt
    : now;

  const proExpiresAt = base + record.durationDays * 86400 * 1000;
  return { isPro: true, proExpiresAt };
}

/**
 * List all activation records in memory
 *
 * @returns {Array<object>}
 */
export function listCodes() {
  return Array.from(activations.values());
}

/**
 * Revoke an activation code
 *
 * @param {string} code
 * @returns {object}
 */
export function revokeCode(code) {
  if (!code || typeof code !== 'string') {
    const err = new Error('Activation code not found');
    err.code = 'CODE_NOT_FOUND';
    throw err;
  }

  const record = activations.get(code);
  if (!record) {
    const err = new Error('Activation code not found');
    err.code = 'CODE_NOT_FOUND';
    throw err;
  }

  record.revoked = true;
  return record;
}

/**
 * Clear all activation records (for unit test isolation)
 */
export function _clearActivationStore() {
  activations.clear();
}
