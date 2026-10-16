/**
 * Hogwarts Server Authentication Store
 * Handles user registration, credential verification with scrypt,
 * and stateless HMAC-SHA256 bearer tokens.
 * Zero external dependencies: uses node:crypto exclusively.
 */

import crypto from 'node:crypto';

// Internal in-memory stores
const users = new Map();        // userId -> userRecord
const usernameIndex = new Map(); // username.toLowerCase() -> userId

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const TOKEN_TTL_SECONDS = 30 * 86400; // 30 days

/**
 * Retrieve JWT_SECRET from environment or throw AUTH_CONFIG_MISSING
 */
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('JWT_SECRET environment variable is not configured');
    err.code = 'AUTH_CONFIG_MISSING';
    throw err;
  }
  return secret;
}

/**
 * Generate a 3-part HMAC-SHA256 stateless token:
 * base64url(userId) : expiry_unix_seconds : base64url(hmac_sha256(userId + ':' + expiry, SECRET))
 *
 * @param {string} userId
 * @param {number} [ttlSeconds]
 * @returns {string}
 */
export function generateToken(userId, ttlSeconds = TOKEN_TTL_SECONDS) {
  const secret = getSecret();
  if (!userId || typeof userId !== 'string') {
    const err = new Error('Invalid userId for token generation');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
  const encodedUserId = Buffer.from(userId, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${userId}:${expiry}`)
    .digest('base64url');

  return `${encodedUserId}:${expiry}:${signature}`;
}

/**
 * Verify a 3-part token, validating timing-safe HMAC signature and expiry.
 *
 * @param {string} token
 * @returns {{ userId: string }}
 */
export function verifyToken(token) {
  const secret = getSecret();

  if (!token || typeof token !== 'string') {
    const err = new Error('Token is missing or invalid');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  const parts = token.split(':');
  if (parts.length !== 3) {
    const err = new Error('Invalid token structure');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  const [encodedUserId, expiryStr, signatureBase64] = parts;

  let userId;
  try {
    userId = Buffer.from(encodedUserId, 'base64url').toString('utf8');
  } catch {
    const err = new Error('Failed to decode token userId');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  if (!userId) {
    const err = new Error('Token payload has empty userId');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  const expectedHmacBuf = crypto
    .createHmac('sha256', secret)
    .update(`${userId}:${expiryStr}`)
    .digest();

  let signatureBuf;
  try {
    signatureBuf = Buffer.from(signatureBase64, 'base64url');
  } catch {
    const err = new Error('Failed to decode token signature');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  if (
    signatureBuf.length !== expectedHmacBuf.length ||
    !crypto.timingSafeEqual(signatureBuf, expectedHmacBuf)
  ) {
    const err = new Error('Token signature mismatch');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  const expirySec = parseInt(expiryStr, 10);
  if (Number.isNaN(expirySec)) {
    const err = new Error('Invalid token expiry value');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec >= expirySec) {
    const err = new Error('Token has expired');
    err.code = 'TOKEN_EXPIRED';
    throw err;
  }

  return { userId };
}

/**
 * Register a new user.
 *
 * @param {Object} params
 * @param {string} params.username
 * @param {string} params.password
 * @param {string} [params.wizardName]
 * @returns {{ userId: string, username: string, wizardName: string, token: string, isPro: boolean, proExpiresAt: number|null, avatar: string }}
 */
export function registerUser({ username, password, wizardName }) {
  // Check auth config first
  getSecret();

  if (!username || typeof username !== 'string' || !USERNAME_REGEX.test(username)) {
    const err = new Error('Username must be 3-20 characters of letters, numbers, or underscores');
    err.code = 'INVALID_USERNAME';
    throw err;
  }

  if (!password || typeof password !== 'string') {
    const err = new Error('Password is required');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const lowerUsername = username.toLowerCase();
  if (usernameIndex.has(lowerUsername)) {
    const err = new Error('Username already exists');
    err.code = 'USER_EXISTS';
    throw err;
  }

  let userId;
  do {
    userId = 'usr_' + crypto.randomBytes(4).toString('hex');
  } while (users.has(userId));

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');

  const cleanWizardName = (typeof wizardName === 'string' && wizardName.trim())
    ? wizardName.trim()
    : '';

  const userRecord = {
    userId,
    username,
    passwordHash,
    salt,
    wizardName: cleanWizardName,
    avatar: 'default',
    isPro: false,
    proExpiresAt: null,
    createdAt: Date.now()
  };

  users.set(userId, userRecord);
  usernameIndex.set(lowerUsername, userId);

  const token = generateToken(userId);

  return {
    userId: userRecord.userId,
    username: userRecord.username,
    wizardName: userRecord.wizardName,
    token,
    isPro: userRecord.isPro,
    proExpiresAt: userRecord.proExpiresAt,
    avatar: userRecord.avatar
  };
}

/**
 * Log in an existing user with username and password.
 *
 * @param {Object} params
 * @param {string} params.username
 * @param {string} params.password
 * @returns {{ userId: string, username: string, wizardName: string, token: string, isPro: boolean, proExpiresAt: number|null, avatar: string }}
 */
export function loginUser({ username, password }) {
  // Check auth config first
  getSecret();

  if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
    const err = new Error('Invalid username or password');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const lowerUsername = username.toLowerCase();
  const userId = usernameIndex.get(lowerUsername);
  if (!userId) {
    const err = new Error('Invalid username or password');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const user = users.get(userId);
  if (!user) {
    const err = new Error('Invalid username or password');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const computedHash = crypto.scryptSync(password, user.salt, 64).toString('hex');
  const computedHashBuf = Buffer.from(computedHash, 'hex');
  const storedHashBuf = Buffer.from(user.passwordHash, 'hex');

  if (
    computedHashBuf.length !== storedHashBuf.length ||
    !crypto.timingSafeEqual(computedHashBuf, storedHashBuf)
  ) {
    const err = new Error('Invalid username or password');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const token = generateToken(user.userId);

  return {
    userId: user.userId,
    username: user.username,
    wizardName: user.wizardName,
    token,
    isPro: user.isPro,
    proExpiresAt: user.proExpiresAt,
    avatar: user.avatar
  };
}

/**
 * Retrieve user by unique userId.
 *
 * @param {string} userId
 * @returns {Object|null}
 */
export function getUserById(userId) {
  const user = users.get(userId);
  if (!user) return null;
  return { ...user };
}

/**
 * Update user Pro membership status.
 *
 * @param {string} userId
 * @param {Object} params
 * @param {boolean} params.isPro
 * @param {number|null} [params.proExpiresAt]
 */
export function updateUserPro(userId, { isPro, proExpiresAt }) {
  const user = users.get(userId);
  if (!user) return;

  user.isPro = Boolean(isPro);
  if (proExpiresAt !== undefined) {
    user.proExpiresAt = proExpiresAt;
  }
}

/**
 * Update user avatar ID.
 *
 * @param {string} userId
 * @param {string} avatarId
 */
export function updateUserAvatar(userId, avatarId) {
  const user = users.get(userId);
  if (!user) return;

  user.avatar = avatarId;
}

/**
 * Reset internal stores (for testing purposes only).
 */
export function _clearStore() {
  users.clear();
  usernameIndex.clear();
}
