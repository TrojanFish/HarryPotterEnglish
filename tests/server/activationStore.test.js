import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  TYPE_MAP,
  generateActivationCodes,
  redeemCode,
  listCodes,
  revokeCode,
  _clearActivationStore
} from '../../server/activationStore.js';

describe('Server activationStore', () => {
  beforeEach(() => {
    if (typeof _clearActivationStore === 'function') {
      _clearActivationStore();
    }
  });

  it('1. generateActivationCodes("MONTH_30", 1) produces code starting with HP-M30-', () => {
    const codes = generateActivationCodes('MONTH_30', 1);
    assert.equal(codes.length, 1);
    assert.ok(codes[0].startsWith('HP-M30-'));
    assert.equal(codes[0].length, 'HP-M30-'.length + 6);

    const suffix = codes[0].slice('HP-M30-'.length);
    const validCharset = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
    assert.ok(validCharset.test(suffix));
  });

  it('2. generateActivationCodes("FOREVER", 2) produces 2 codes starting with HP-PRO-', () => {
    const codes = generateActivationCodes('FOREVER', 2);
    assert.equal(codes.length, 2);
    assert.notEqual(codes[0], codes[1]);
    assert.ok(codes[0].startsWith('HP-PRO-'));
    assert.ok(codes[1].startsWith('HP-PRO-'));
  });

  it('3. generateActivationCodes validation: invalid count and invalid type throw', () => {
    assert.throws(
      () => generateActivationCodes('MONTH_30', 51),
      (err) => err.code === 'INVALID_COUNT'
    );

    assert.throws(
      () => generateActivationCodes('MONTH_30', 0),
      (err) => err.code === 'INVALID_COUNT'
    );

    assert.throws(
      () => generateActivationCodes('MONTH_30', -5),
      (err) => err.code === 'INVALID_COUNT'
    );

    assert.throws(
      () => generateActivationCodes('UNKNOWN_TYPE', 1),
      (err) => err.code === 'INVALID_TYPE'
    );
  });

  it('4. Redeeming MONTH_30 sets proExpiresAt ~30 days from now (within 5000ms tolerance)', () => {
    const [code] = generateActivationCodes('MONTH_30', 1);
    const now = Date.now();
    const result = redeemCode(code, 'usr_hermione', { isPro: false, proExpiresAt: null });

    assert.equal(result.isPro, true);
    assert.ok(typeof result.proExpiresAt === 'number');

    const expectedExpiry = now + 30 * 86400 * 1000;
    const diff = Math.abs(result.proExpiresAt - expectedExpiry);
    assert.ok(diff < 5000, `Difference ${diff}ms should be under 5000ms`);
  });

  it('5. Stacking on existing active subscription adds 30 days to currentUser.proExpiresAt', () => {
    const [code] = generateActivationCodes('MONTH_30', 1);
    const futureExpiry = Date.now() + 15 * 86400 * 1000; // 15 days in future

    const result = redeemCode(code, 'usr_ron', {
      isPro: true,
      proExpiresAt: futureExpiry
    });

    assert.equal(result.isPro, true);
    const expectedExpiry = futureExpiry + 30 * 86400 * 1000;
    assert.equal(result.proExpiresAt, expectedExpiry);
  });

  it('5b. Stacking on an expired subscription starts from now instead of old expiry', () => {
    const [code] = generateActivationCodes('SEASON_90', 1);
    const pastExpiry = Date.now() - 10 * 86400 * 1000; // expired 10 days ago
    const beforeRedeem = Date.now();

    const result = redeemCode(code, 'usr_neville', {
      isPro: false,
      proExpiresAt: pastExpiry
    });

    assert.equal(result.isPro, true);
    const expectedExpiry = beforeRedeem + 90 * 86400 * 1000;
    const diff = Math.abs(result.proExpiresAt - expectedExpiry);
    assert.ok(diff < 5000, `Difference ${diff}ms should be under 5000ms`);
  });

  it('6. FOREVER sets isPro: true, proExpiresAt: null', () => {
    const [code] = generateActivationCodes('FOREVER', 1);
    const result = redeemCode(code, 'usr_harry', {
      isPro: true,
      proExpiresAt: Date.now() + 10000
    });

    assert.equal(result.isPro, true);
    assert.equal(result.proExpiresAt, null);
  });

  it('7. Double redemption throws CODE_ALREADY_USED', () => {
    const [code] = generateActivationCodes('YEAR_365', 1);
    redeemCode(code, 'usr_ginny', {});

    assert.throws(
      () => redeemCode(code, 'usr_luna', {}),
      (err) => err.code === 'CODE_ALREADY_USED'
    );
  });

  it('8. Invalid code throws CODE_NOT_FOUND', () => {
    assert.throws(
      () => redeemCode('HP-M30-NONEXIST', 'usr_draco', {}),
      (err) => err.code === 'CODE_NOT_FOUND'
    );
  });

  it('9. listCodes() length increases after generateActivationCodes', () => {
    const initialList = listCodes();
    assert.equal(initialList.length, 0);

    generateActivationCodes('MONTH_30', 3);
    const updatedList = listCodes();
    assert.equal(updatedList.length, 3);

    const first = updatedList[0];
    assert.ok(first.code.startsWith('HP-M30-'));
    assert.equal(first.type, 'MONTH_30');
    assert.equal(first.durationDays, 30);
    assert.equal(first.redeemedAt, null);
    assert.equal(first.redeemedBy, null);
    assert.equal(first.revoked, false);
    assert.ok(typeof first.createdAt === 'number');
  });

  it('10. revokeCode() then redeemCode() throws CODE_REVOKED', () => {
    const [code] = generateActivationCodes('MONTH_30', 1);
    revokeCode(code);

    assert.throws(
      () => redeemCode(code, 'usr_albus', {}),
      (err) => err.code === 'CODE_REVOKED'
    );
  });

  it('10b. revokeCode() on non-existent code throws CODE_NOT_FOUND', () => {
    assert.throws(
      () => revokeCode('HP-M30-INVALID'),
      (err) => err.code === 'CODE_NOT_FOUND'
    );
  });

  it('11. TYPE_MAP exported with expected structure', () => {
    assert.deepEqual(TYPE_MAP.MONTH_30, { prefix: 'HP-M30-', days: 30 });
    assert.deepEqual(TYPE_MAP.SEASON_90, { prefix: 'HP-Q90-', days: 90 });
    assert.deepEqual(TYPE_MAP.YEAR_365, { prefix: 'HP-Y365-', days: 365 });
    assert.deepEqual(TYPE_MAP.FOREVER, { prefix: 'HP-PRO-', days: null });
  });
});
