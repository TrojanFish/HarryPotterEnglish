import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Set JWT_SECRET before dynamic import
process.env.JWT_SECRET = 'test_secret_for_unit_tests_only_32_bytes_len';

const {
  registerUser,
  loginUser,
  verifyToken,
  generateToken,
  getUserById,
  updateUserPro,
  updateUserAvatar,
  _clearStore
} = await import('../../server/authStore.js');

describe('Server authStore', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret_for_unit_tests_only_32_bytes_len';
    if (typeof _clearStore === 'function') {
      _clearStore();
    }
  });

  it('1. registerUser creates user, returns token and userId starting with usr_', () => {
    const res = registerUser({
      username: 'harry_potter',
      password: 'nimbus2000password',
      wizardName: 'Harry Potter'
    });

    assert.ok(res.userId.startsWith('usr_'));
    assert.equal(res.username, 'harry_potter');
    assert.equal(res.wizardName, 'Harry Potter');
    assert.ok(typeof res.token === 'string' && res.token.length > 20);
    assert.equal(res.isPro, false);
    assert.equal(res.proExpiresAt, null);
    assert.equal(res.avatar, 'default');

    const stored = getUserById(res.userId);
    assert.ok(stored);
    assert.equal(stored.userId, res.userId);
    assert.equal(stored.username, 'harry_potter');
    assert.equal(stored.wizardName, 'Harry Potter');
  });

  it('2. Duplicate username throws USER_EXISTS', () => {
    registerUser({
      username: 'ronald_weasley',
      password: 'scabberspassword'
    });

    assert.throws(
      () => {
        registerUser({
          username: 'ronald_weasley',
          password: 'newpassword123'
        });
      },
      (err) => {
        assert.equal(err.code, 'USER_EXISTS');
        return true;
      }
    );

    // Case-insensitive duplicate check
    assert.throws(
      () => {
        registerUser({
          username: 'RONALD_WEASLEY',
          password: 'differentpassword'
        });
      },
      (err) => {
        assert.equal(err.code, 'USER_EXISTS');
        return true;
      }
    );
  });

  it('3. Invalid username (e.g. "h!") throws INVALID_USERNAME', () => {
    const invalidUsernames = ['h!', 'ab', 'a'.repeat(21), 'has space', 'special@char'];
    for (const username of invalidUsernames) {
      assert.throws(
        () => {
          registerUser({
            username,
            password: 'validpassword123'
          });
        },
        (err) => {
          assert.equal(err.code, 'INVALID_USERNAME');
          return true;
        }
      );
    }
  });

  it('4. loginUser with correct password returns token and user info', () => {
    const registered = registerUser({
      username: 'hermione_g',
      password: 'timeTurner123',
      wizardName: 'Hermione Granger'
    });

    const loginRes = loginUser({
      username: 'hermione_g',
      password: 'timeTurner123'
    });

    assert.equal(loginRes.userId, registered.userId);
    assert.equal(loginRes.username, 'hermione_g');
    assert.equal(loginRes.wizardName, 'Hermione Granger');
    assert.ok(typeof loginRes.token === 'string');
    assert.equal(loginRes.isPro, false);
    assert.equal(loginRes.proExpiresAt, null);
    assert.equal(loginRes.avatar, 'default');
  });

  it('5. loginUser with wrong password throws INVALID_CREDENTIALS', () => {
    registerUser({
      username: 'neville_l',
      password: 'rememberallpassword'
    });

    assert.throws(
      () => {
        loginUser({
          username: 'neville_l',
          password: 'wrongpassword'
        });
      },
      (err) => {
        assert.equal(err.code, 'INVALID_CREDENTIALS');
        return true;
      }
    );

    assert.throws(
      () => {
        loginUser({
          username: 'nonexistent_user',
          password: 'any_password'
        });
      },
      (err) => {
        assert.equal(err.code, 'INVALID_CREDENTIALS');
        return true;
      }
    );
  });

  it('6. verifyToken round-trips to correct userId', () => {
    const res = registerUser({
      username: 'albus_d',
      password: 'lemonDropPassword'
    });

    const verified = verifyToken(res.token);
    assert.equal(verified.userId, res.userId);

    const generated = generateToken('usr_manual_test_99');
    const verifiedGenerated = verifyToken(generated);
    assert.equal(verifiedGenerated.userId, 'usr_manual_test_99');
  });

  it('7. Tampered token throws INVALID_TOKEN', () => {
    const res = registerUser({
      username: 'severus_s',
      password: 'alwaysPassword'
    });

    const validToken = res.token;
    const parts = validToken.split(':');
    assert.equal(parts.length, 3);

    // Tampered signature
    const tamperedSigToken = `${parts[0]}:${parts[1]}:invalidSignatureString`;
    assert.throws(
      () => verifyToken(tamperedSigToken),
      (err) => {
        assert.equal(err.code, 'INVALID_TOKEN');
        return true;
      }
    );

    // Tampered payload
    const tamperedUserIdToken = `d3JvbmdVc2Vy:${parts[1]}:${parts[2]}`;
    assert.throws(
      () => verifyToken(tamperedUserIdToken),
      (err) => {
        assert.equal(err.code, 'INVALID_TOKEN');
        return true;
      }
    );

    // Malformed token structure
    assert.throws(
      () => verifyToken('not-a-colon-separated-token'),
      (err) => {
        assert.equal(err.code, 'INVALID_TOKEN');
        return true;
      }
    );
  });

  it('8. When JWT_SECRET is absent, loginUser and others throw AUTH_CONFIG_MISSING', () => {
    const savedSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    try {
      assert.throws(
        () => {
          loginUser({ username: 'someone', password: 'password' });
        },
        (err) => {
          assert.equal(err.code, 'AUTH_CONFIG_MISSING');
          return true;
        }
      );

      assert.throws(
        () => {
          registerUser({ username: 'someone', password: 'password' });
        },
        (err) => {
          assert.equal(err.code, 'AUTH_CONFIG_MISSING');
          return true;
        }
      );

      assert.throws(
        () => {
          generateToken('usr_123');
        },
        (err) => {
          assert.equal(err.code, 'AUTH_CONFIG_MISSING');
          return true;
        }
      );

      assert.throws(
        () => {
          verifyToken('a:b:c');
        },
        (err) => {
          assert.equal(err.code, 'AUTH_CONFIG_MISSING');
          return true;
        }
      );
    } finally {
      process.env.JWT_SECRET = savedSecret;
    }
  });

  it('9. updateUserPro and updateUserAvatar update user profile fields', () => {
    const res = registerUser({
      username: 'draco_m',
      password: 'slytherinPassword'
    });

    const expiresAt = Date.now() + 30 * 86400 * 1000;
    updateUserPro(res.userId, { isPro: true, proExpiresAt: expiresAt });

    let updated = getUserById(res.userId);
    assert.equal(updated.isPro, true);
    assert.equal(updated.proExpiresAt, expiresAt);

    updateUserAvatar(res.userId, 'draco');
    updated = getUserById(res.userId);
    assert.equal(updated.avatar, 'draco');
  });

  it('10. Expired token throws TOKEN_EXPIRED', () => {
    // Generate token with negative TTL
    const expiredToken = generateToken('usr_expired_test', -10);
    assert.throws(
      () => verifyToken(expiredToken),
      (err) => {
        assert.equal(err.code, 'TOKEN_EXPIRED');
        return true;
      }
    );
  });

  it('11. getUserById returns null for unknown userId', () => {
    const user = getUserById('usr_does_not_exist');
    assert.equal(user, null);
  });
});

