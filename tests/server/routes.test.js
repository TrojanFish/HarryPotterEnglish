import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Set environment flags before importing server
process.env.NODE_ENV = 'test';
process.env.VERCEL = '1';
process.env.JWT_SECRET = 'test_jwt_secret_key_at_least_32_bytes_long';
process.env.ADMIN_SECRET_KEY = 'test_admin_secret_super_secure';

const { app, authRegisterLimiter, authLoginLimiter } = await import('../../server/index.js');
const { _clearStore } = await import('../../server/authStore.js');
const { _clearActivationStore } = await import('../../server/activationStore.js');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('Server Auth & Activation Routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_at_least_32_bytes_long';
    process.env.ADMIN_SECRET_KEY = 'test_admin_secret_super_secure';
    if (typeof _clearStore === 'function') _clearStore();
    if (typeof _clearActivationStore === 'function') _clearActivationStore();
    if (authRegisterLimiter?._reset) authRegisterLimiter._reset();
    if (authLoginLimiter?._reset) authLoginLimiter._reset();
  });


  describe('POST /api/auth/register', () => {
    it('successfully registers a user and returns token and user info', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'harry_potter',
          password: 'nimbus2000password',
          wizardName: 'Harry Potter'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.userId.startsWith('usr_'));
      assert.equal(data.username, 'harry_potter');
      assert.equal(data.wizardName, 'Harry Potter');
      assert.ok(typeof data.token === 'string' && data.token.length > 20);
      assert.equal(data.isPro, false);
      assert.equal(data.proExpiresAt, null);
      assert.equal(data.avatar, 'default');
    });

    it('returns 409 USER_EXISTS on duplicate username', async () => {
      await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'hermione_g',
          password: 'timeTurner123',
          wizardName: 'Hermione Granger'
        })
      });

      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'hermione_g',
          password: 'anotherPassword123'
        })
      });

      assert.equal(res.status, 409);
      const data = await res.json();
      assert.equal(data.error, 'USER_EXISTS');
    });

    it('returns 400 on invalid username format', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'ab',
          password: 'password123'
        })
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'INVALID_USERNAME');
    });

    it('returns 503 AUTH_CONFIG_MISSING when JWT_SECRET is unset', async () => {
      const savedSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      try {
        const res = await fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'ronald_w',
            password: 'scabberspassword'
          })
        });

        assert.equal(res.status, 503);
        const data = await res.json();
        assert.equal(data.error, 'AUTH_CONFIG_MISSING');
      } finally {
        process.env.JWT_SECRET = savedSecret;
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('successfully logs in with valid credentials', async () => {
      await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'draco_m',
          password: 'slytherinPassword',
          wizardName: 'Draco Malfoy'
        })
      });

      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'draco_m',
          password: 'slytherinPassword'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.username, 'draco_m');
      assert.equal(data.wizardName, 'Draco Malfoy');
      assert.ok(typeof data.token === 'string');
    });

    it('returns 401 INVALID_CREDENTIALS on wrong password', async () => {
      await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'neville_l',
          password: 'rememberallpassword'
        })
      });

      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'neville_l',
          password: 'wrong_password'
        })
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'INVALID_CREDENTIALS');
    });

    it('returns 503 AUTH_CONFIG_MISSING when JWT_SECRET is unset', async () => {
      const savedSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      try {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'any_user',
            password: 'any_password'
          })
        });

        assert.equal(res.status, 503);
        const data = await res.json();
        assert.equal(data.error, 'AUTH_CONFIG_MISSING');
      } finally {
        process.env.JWT_SECRET = savedSecret;
      }
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user info when valid Bearer token is provided', async () => {
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'luna_l',
          password: 'radishEarrings1',
          wizardName: 'Luna Lovegood'
        })
      });
      const regData = await regRes.json();

      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${regData.token}`
        }
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.userId, regData.userId);
      assert.equal(data.username, 'luna_l');
      assert.equal(data.wizardName, 'Luna Lovegood');
      assert.equal(data.avatar, 'default');
      assert.equal(data.isPro, false);
      assert.equal(data.proExpiresAt, null);
      assert.equal(data.token, undefined);
    });

    it('returns 401 MISSING_TOKEN when authorization header is absent', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'MISSING_TOKEN');
    });

    it('returns 401 INVALID_TOKEN when token is invalid or tampered', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: 'Bearer invalid.token.value'
        }
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'INVALID_TOKEN');
    });
  });

  describe('PATCH /api/auth/me', () => {
    it('updates user avatar and returns updated user', async () => {
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'cedric_d',
          password: 'hufflepuffChamp1'
        })
      });
      const regData = await regRes.json();

      const patchRes = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${regData.token}`
        },
        body: JSON.stringify({ avatarId: 'avatar_badger' })
      });

      assert.equal(patchRes.status, 200);
      const patchData = await patchRes.json();
      assert.equal(patchData.avatar, 'avatar_badger');

      // Verify GET /api/auth/me also reflects the new avatar
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${regData.token}` }
      });
      const meData = await meRes.json();
      assert.equal(meData.avatar, 'avatar_badger');
    });
  });

  describe('POST /api/activation/redeem', () => {
    it('successfully redeems generated MONTH_30 code and activates Pro', async () => {
      // 1. Generate code via admin API
      const genRes = await fetch(`${baseUrl}/api/admin/activation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'test_admin_secret_super_secure'
        },
        body: JSON.stringify({ type: 'MONTH_30', count: 1 })
      });
      assert.equal(genRes.status, 200);
      const { codes } = await genRes.json();
      const code = codes[0];

      // 2. Register user
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'cho_chang',
          password: 'ravenclawSeeker'
        })
      });
      const { token } = await regRes.json();

      // 3. Redeem code
      const redeemRes = await fetch(`${baseUrl}/api/activation/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: code.toLowerCase() }) // Test case-insensitivity
      });

      assert.equal(redeemRes.status, 200);
      const redeemData = await redeemRes.json();
      assert.equal(redeemData.isPro, true);
      assert.ok(typeof redeemData.proExpiresAt === 'number');
      assert.equal(redeemData.message, 'Pro activated');

      // 4. Verify me endpoint reflects Pro status
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const meData = await meRes.json();
      assert.equal(meData.isPro, true);
      assert.equal(meData.proExpiresAt, redeemData.proExpiresAt);
    });

    it('returns 409 CODE_ALREADY_USED on double redemption', async () => {
      const genRes = await fetch(`${baseUrl}/api/admin/activation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'test_admin_secret_super_secure'
        },
        body: JSON.stringify({ type: 'MONTH_30', count: 1 })
      });
      const { codes } = await genRes.json();
      const code = codes[0];

      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'user_one', password: 'password123' })
      });
      const { token: token1 } = await regRes.json();

      const regRes2 = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'user_two', password: 'password123' })
      });
      const { token: token2 } = await regRes2.json();

      // First redemption succeeds
      const res1 = await fetch(`${baseUrl}/api/activation/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`
        },
        body: JSON.stringify({ code })
      });
      assert.equal(res1.status, 200);

      // Second redemption fails with 409
      const res2 = await fetch(`${baseUrl}/api/activation/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token2}`
        },
        body: JSON.stringify({ code })
      });
      assert.equal(res2.status, 409);
      const data2 = await res2.json();
      assert.equal(data2.error, 'CODE_ALREADY_USED');
    });

    it('returns 404 CODE_NOT_FOUND for non-existent code', async () => {
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'user_three', password: 'password123' })
      });
      const { token } = await regRes.json();

      const res = await fetch(`${baseUrl}/api/activation/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: 'HP-M30-NONEXIST' })
      });

      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.error, 'CODE_NOT_FOUND');
    });

    it('returns 410 CODE_REVOKED for revoked code', async () => {
      const genRes = await fetch(`${baseUrl}/api/admin/activation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'test_admin_secret_super_secure'
        },
        body: JSON.stringify({ type: 'MONTH_30', count: 1 })
      });
      const { codes } = await genRes.json();
      const code = codes[0];

      // Revoke code via admin API
      await fetch(`${baseUrl}/api/admin/activation/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'test_admin_secret_super_secure'
        },
        body: JSON.stringify({ code })
      });

      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'user_four', password: 'password123' })
      });
      const { token } = await regRes.json();

      const res = await fetch(`${baseUrl}/api/activation/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });

      assert.equal(res.status, 410);
      const data = await res.json();
      assert.equal(data.error, 'CODE_REVOKED');
    });

    it('prevents accidental downgrade when user is already FOREVER Pro', async () => {
      // 1. Generate FOREVER code and MONTH_30 code
      const genResForever = await fetch(`${baseUrl}/api/admin/activation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'test_admin_secret_super_secure'
        },
        body: JSON.stringify({ type: 'FOREVER', count: 1 })
      });
      const { codes: foreverCodes } = await genResForever.json();

      const genResMonth = await fetch(`${baseUrl}/api/admin/activation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'test_admin_secret_super_secure'
        },
        body: JSON.stringify({ type: 'MONTH_30', count: 1 })
      });
      const { codes: monthCodes } = await genResMonth.json();

      // 2. Register user
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'forever_user', password: 'password123' })
      });
      const { token } = await regRes.json();

      // 3. Redeem FOREVER code
      const resForever = await fetch(`${baseUrl}/api/activation/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: foreverCodes[0] })
      });
      const foreverData = await resForever.json();
      assert.equal(foreverData.isPro, true);
      assert.equal(foreverData.proExpiresAt, null);

      // 4. Redeem MONTH_30 code - proExpiresAt must remain null (no downgrade)
      const resMonth = await fetch(`${baseUrl}/api/activation/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: monthCodes[0] })
      });
      const monthData = await resMonth.json();
      assert.equal(monthData.isPro, true);
      assert.equal(monthData.proExpiresAt, null);
    });
  });

  describe('Admin Activation Endpoints', () => {
    it('returns 403 INVALID_ADMIN_KEY when x-admin-key is missing or invalid', async () => {
      const resMissing = await fetch(`${baseUrl}/api/admin/activation/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'MONTH_30', count: 1 })
      });
      assert.equal(resMissing.status, 403);
      const dataMissing = await resMissing.json();
      assert.equal(dataMissing.error, 'INVALID_ADMIN_KEY');

      const resWrong = await fetch(`${baseUrl}/api/admin/activation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'wrong_secret_key'
        },
        body: JSON.stringify({ type: 'MONTH_30', count: 1 })
      });
      assert.equal(resWrong.status, 403);
      const dataWrong = await resWrong.json();
      assert.equal(dataWrong.error, 'INVALID_ADMIN_KEY');
    });

    it('returns 503 ADMIN_CONFIG_MISSING when ADMIN_SECRET_KEY is unset', async () => {
      const savedSecret = process.env.ADMIN_SECRET_KEY;
      delete process.env.ADMIN_SECRET_KEY;

      try {
        const res = await fetch(`${baseUrl}/api/admin/activation/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': savedSecret
          },
          body: JSON.stringify({ type: 'MONTH_30', count: 1 })
        });
        assert.equal(res.status, 503);
        const data = await res.json();
        assert.equal(data.error, 'ADMIN_CONFIG_MISSING');
      } finally {
        process.env.ADMIN_SECRET_KEY = savedSecret;
      }
    });

    it('allows generating, listing, and revoking codes with valid admin key', async () => {
      // 1. Generate 2 SEASON_90 codes
      const genRes = await fetch(`${baseUrl}/api/admin/activation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'test_admin_secret_super_secure'
        },
        body: JSON.stringify({ type: 'SEASON_90', count: 2 })
      });
      assert.equal(genRes.status, 200);
      const genData = await genRes.json();
      assert.equal(genData.codes.length, 2);

      // 2. List codes
      const listRes = await fetch(`${baseUrl}/api/admin/activation/list`, {
        headers: {
          'x-admin-key': 'test_admin_secret_super_secure'
        }
      });
      assert.equal(listRes.status, 200);
      const listData = await listRes.json();
      assert.equal(listData.codes.length, 2);

      // 3. Revoke one code
      const codeToRevoke = genData.codes[0];
      const revokeRes = await fetch(`${baseUrl}/api/admin/activation/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'test_admin_secret_super_secure'
        },
        body: JSON.stringify({ code: codeToRevoke })
      });
      assert.equal(revokeRes.status, 200);
      const revokeData = await revokeRes.json();
      assert.equal(revokeData.success, true);

      // 4. List again to confirm revoked state
      const listRes2 = await fetch(`${baseUrl}/api/admin/activation/list`, {
        headers: {
          'x-admin-key': 'test_admin_secret_super_secure'
        }
      });
      const listData2 = await listRes2.json();
      const revokedRecord = listData2.codes.find((c) => c.code === codeToRevoke);
      assert.equal(revokedRecord.revoked, true);
    });
  });

  describe('Rate Limiting on Auth Endpoints', () => {
    it('authRegisterLimiter limits requests after 5 attempts', async () => {
      // Send 5 register requests with x-test-rate-limit header
      for (let i = 1; i <= 5; i++) {
        const res = await fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-test-rate-limit': '1'
          },
          body: JSON.stringify({
            username: `ratelimit_user_${i}`,
            password: 'validpassword123'
          })
        });
        assert.equal(res.status, 200, `Request ${i} should succeed`);
      }

      // 6th request should be rate-limited with status 429
      const blockedRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-rate-limit': '1'
        },
        body: JSON.stringify({
          username: 'ratelimit_user_6',
          password: 'validpassword123'
        })
      });

      assert.equal(blockedRes.status, 429);
      const blockedData = await blockedRes.json();
      assert.equal(blockedData.error, 'Too Many Requests');
      assert.ok(blockedData.message.includes('15分钟'));
    });

    it('authLoginLimiter limits requests after 10 attempts', async () => {
      // Send 10 login requests with x-test-rate-limit header
      for (let i = 1; i <= 10; i++) {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-test-rate-limit': '1'
          },
          body: JSON.stringify({
            username: `nonexistent_user_${i}`,
            password: 'wrongpassword'
          })
        });
        assert.equal(res.status, 401, `Request ${i} should return 401`);
      }

      // 11th request should be rate-limited with status 429
      const blockedRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-rate-limit': '1'
        },
        body: JSON.stringify({
          username: 'nonexistent_user_11',
          password: 'wrongpassword'
        })
      });

      assert.equal(blockedRes.status, 429);
      const blockedData = await blockedRes.json();
      assert.equal(blockedData.error, 'Too Many Requests');
      assert.ok(blockedData.message.includes('15分钟'));
    });
  });
});

