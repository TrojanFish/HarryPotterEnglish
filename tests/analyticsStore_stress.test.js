/**
 * tests/analyticsStore_stress.test.js
 * Adversarial Stress & Edge Case Test Suite for src/utils/analyticsStore.js
 * Milestone 2 (R2: Visual Learning Analytics & Habit Tracking)
 *
 * Empirical Challenges:
 * 1. Extreme Leap Year Transitions (Feb 28 -> Feb 29 -> Mar 1, century leap years, leap gaps)
 * 2. Month Boundaries & Year Transitions (All 12 month borders, Dec 31 -> Jan 1, 365-day year unbroken streak)
 * 3. Timezone Shifts & Sub-day Timestamps (Midnight, midday, 23:59:59.999, UTC offsets)
 * 4. Non-consecutive Days & Streak History Preservation (Multiple gaps, random date insertion, multi-source dates)
 * 5. Corrupted Storage & Type Fuzzing (Malformed JSON, null, NaN, Infinity, negative numbers, bad formats)
 * 6. API Argument Fuzzing & Boundary Protection (0 words, negative words, oversized scores, bad chapter IDs)
 * 7. Storage Quota Exceeded Simulation (Mock quota error during setItem)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import './setup.js';
import { resetTestEnvironment, mockStorageInstance } from './setup.js';
import * as analyticsStore from '../src/utils/analyticsStore.js';

test.describe('Adversarial Stress Suite: analyticsStore.js', () => {

  test('Challenge 1.1: Leap year transitions (2024-02-28 -> 2024-02-29 -> 2024-03-01)', () => {
    resetTestEnvironment();

    // Full 3-day consecutive leap year transition
    const daily = {
      '2024-02-28': 100,
      '2024-02-29': 150,
      '2024-03-01': 200
    };
    const refDateMar1 = new Date('2024-03-01T12:00:00Z');
    const result3Day = analyticsStore.calculateStreaks(daily, [], [], refDateMar1);
    assert.strictEqual(result3Day.currentStreak, 3, 'Current streak across Feb 28 -> Feb 29 -> Mar 1 must be 3');
    assert.strictEqual(result3Day.longestStreak, 3, 'Longest streak across Feb 28 -> Feb 29 -> Mar 1 must be 3');

    // Missing leap day breaks streak: 2024-02-28 and 2024-03-01 with gap on 2024-02-29
    const dailyMissingLeap = {
      '2024-02-28': 100,
      '2024-03-01': 200
    };
    const resultMissingLeap = analyticsStore.calculateStreaks(dailyMissingLeap, [], [], refDateMar1);
    assert.strictEqual(resultMissingLeap.currentStreak, 1, 'Current streak on Mar 1 when Feb 29 was skipped must reset to 1');
    assert.strictEqual(resultMissingLeap.longestStreak, 1, 'Longest streak must be 1 when Feb 29 was skipped');
  });

  test('Challenge 1.2: Non-leap year transition (2023-02-28 -> 2023-03-01)', () => {
    resetTestEnvironment();

    // In 2023 (non-leap), Feb 28 to Mar 1 is directly consecutive
    const dailyNonLeap = {
      '2023-02-28': 300,
      '2023-03-01': 300
    };
    const refDateMar1_2023 = new Date('2023-03-01T10:00:00Z');
    const resultNonLeap = analyticsStore.calculateStreaks(dailyNonLeap, [], [], refDateMar1_2023);
    assert.strictEqual(resultNonLeap.currentStreak, 2, 'Feb 28 to Mar 1 in non-leap year must be consecutive (streak = 2)');
    assert.strictEqual(resultNonLeap.longestStreak, 2, 'Longest streak in non-leap year must be 2');
  });

  test('Challenge 1.3: Century leap years (2000 leap vs 2100 non-leap)', () => {
    resetTestEnvironment();

    // 2000 is a leap year (divisible by 400)
    const daily2000 = {
      '2000-02-28': 100,
      '2000-02-29': 100,
      '2000-03-01': 100
    };
    const res2000 = analyticsStore.calculateStreaks(daily2000, [], [], new Date('2000-03-01T12:00:00Z'));
    assert.strictEqual(res2000.currentStreak, 3, 'Century leap year 2000 must support 3-day leap streak');

    // 2100 is NOT a leap year (divisible by 100 but not 400)
    const daily2100 = {
      '2100-02-28': 100,
      '2100-03-01': 100
    };
    const res2100 = analyticsStore.calculateStreaks(daily2100, [], [], new Date('2100-03-01T12:00:00Z'));
    assert.strictEqual(res2100.currentStreak, 2, 'Year 2100 non-leap transition must be consecutive (streak = 2)');
  });

  test('Challenge 1.4: Leap day as reference date (2024-02-29)', () => {
    resetTestEnvironment();

    // Reference date is Feb 29 itself; yesterday is Feb 28
    const daily = {
      '2024-02-28': 200
      // No activity yet on Feb 29
    };
    const refDateLeapDay = new Date('2024-02-29T15:30:00Z');
    const res = analyticsStore.calculateStreaks(daily, [], [], refDateLeapDay);
    assert.strictEqual(res.currentStreak, 1, 'Activity on Feb 28 must keep streak alive on Feb 29');
    assert.strictEqual(res.longestStreak, 1);
  });

  test('Challenge 2.1: Year boundary transition (Dec 31 to Jan 1)', () => {
    resetTestEnvironment();

    const dailyYearEnd = {
      '2025-12-30': 500,
      '2025-12-31': 600,
      '2026-01-01': 700,
      '2026-01-02': 800
    };
    const refDateJan2 = new Date('2026-01-02T08:00:00Z');
    const res = analyticsStore.calculateStreaks(dailyYearEnd, [], [], refDateJan2);
    assert.strictEqual(res.currentStreak, 4, 'Streak across Dec 30 -> Dec 31 -> Jan 01 -> Jan 02 must be 4');
    assert.strictEqual(res.longestStreak, 4);
  });

  test('Challenge 2.2: Full 365-day uninterrupted year streak simulation', () => {
    resetTestEnvironment();

    const daily365 = {};
    const baseDate = new Date('2025-01-01T00:00:00Z');
    for (let i = 0; i < 365; i++) {
      const d = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
      daily365[d.toISOString().split('T')[0]] = 300;
    }
    const endOfYear = new Date('2025-12-31T20:00:00Z');
    const res = analyticsStore.calculateStreaks(daily365, [], [], endOfYear);
    assert.strictEqual(res.currentStreak, 365, 'Full 365-day unbroken streak must be 365');
    assert.strictEqual(res.longestStreak, 365, 'Longest streak must be 365');
  });

  test('Challenge 3.1: Timezone shifts and boundary timestamps (start of day vs end of day)', () => {
    resetTestEnvironment();

    const daily = {
      '2026-06-15': 300,
      '2026-06-16': 400
    };

    // Exactly at midnight 00:00:00.000Z
    const refMidnight = new Date('2026-06-16T00:00:00.000Z');
    const resMidnight = analyticsStore.calculateStreaks(daily, [], [], refMidnight);
    assert.strictEqual(resMidnight.currentStreak, 2, 'Midnight reference date must correctly count today (June 16) and yesterday');

    // At 23:59:59.999Z
    const refEndOfDay = new Date('2026-06-16T23:59:59.999Z');
    const resEndOfDay = analyticsStore.calculateStreaks(daily, [], [], refEndOfDay);
    assert.strictEqual(resEndOfDay.currentStreak, 2, 'End-of-day reference date must correctly count today and yesterday');

    // On June 17 at 00:00:01Z when June 17 has no activity yet (yesterday was June 16)
    const refNextDayEarly = new Date('2026-06-17T00:00:01.000Z');
    const resNextDay = analyticsStore.calculateStreaks(daily, [], [], refNextDayEarly);
    assert.strictEqual(resNextDay.currentStreak, 2, 'Early next day should keep yesterday streak active');
  });

  test('Challenge 4.1: Non-consecutive study days breaking current streak while preserving longest historical streak', () => {
    resetTestEnvironment();

    // Block 1: 2026-03-01 to 2026-03-05 (5 days)
    // Gap: 2026-03-06 to 2026-03-09 (4 days)
    // Block 2: 2026-03-10 to 2026-03-21 (12 days) <- longest
    // Gap: 2026-03-22 (1 day)
    // Block 3: 2026-03-23 to 2026-03-24 (2 days)
    // Gap: 2026-03-25 to 2026-03-27 (3 days)
    // Block 4: 2026-03-28 (today)
    const daily = {};
    for (let day = 1; day <= 5; day++) daily[`2026-03-0${day}`] = 300;
    for (let day = 10; day <= 21; day++) daily[`2026-03-${day}`] = 300;
    daily['2026-03-23'] = 300;
    daily['2026-03-24'] = 300;
    daily['2026-03-28'] = 300;

    const refDateToday = new Date('2026-03-28T12:00:00Z');
    const resToday = analyticsStore.calculateStreaks(daily, [], [], refDateToday);
    assert.strictEqual(resToday.currentStreak, 1, 'Current streak should be 1 on 2026-03-28 after 3-day gap');
    assert.strictEqual(resToday.longestStreak, 12, 'Longest streak must preserve the 12-day historical peak');

    // Test when today has no activity, but yesterday did NOT either (streak completely broken = 0)
    const refDateTomorrow = new Date('2026-03-30T12:00:00Z');
    const resBroken = analyticsStore.calculateStreaks(daily, [], [], refDateTomorrow);
    assert.strictEqual(resBroken.currentStreak, 0, 'Current streak should be 0 when neither today nor yesterday had activity');
    assert.strictEqual(resBroken.longestStreak, 12, 'Longest streak must still be 12');
  });

  test('Challenge 4.2: Mixed activity sources and out-of-order date entries', () => {
    resetTestEnvironment();

    // Shuffled chronological dates from 3 distinct sources:
    const daily = {
      '2026-04-03': 300,
      '2026-04-01': 200
    };
    const dictations = [
      { date: '2026-04-02', accuracy: 90, totalWords: 10, correctWords: 9 },
      { date: '2026-04-04', accuracy: 80, totalWords: 10, correctWords: 8 }
    ];
    const shadowing = [
      { date: '2026-04-05', score: 95, cueId: 1 },
      { date: '2026-04-02', score: 85, cueId: 2 } // Duplicate date with dictation
    ];

    const refDate = new Date('2026-04-05T18:00:00Z');
    const res = analyticsStore.calculateStreaks(daily, dictations, shadowing, refDate);

    // Consecutive active days: 04-01 (listening), 04-02 (dictation+shadowing), 04-03 (listening), 04-04 (dictation), 04-05 (shadowing)
    assert.strictEqual(res.currentStreak, 5, 'Mixed sources across 5 consecutive days must yield streak of 5');
    assert.strictEqual(res.longestStreak, 5, 'Longest streak must be 5');
  });

  test('Challenge 5.1: Corrupted JSON strings in localStorage', () => {
    const corruptCases = [
      'INVALID_JSON{{{',
      '{"totalListeningSeconds":',
      '{ "dailyListeningSeconds": ',
      '',
      'null',
      'undefined',
      '12345',
      '"just-a-string"',
      '[1, 2, 3]',
      'true',
      'false'
    ];

    for (const corrupt of corruptCases) {
      resetTestEnvironment();
      globalThis.localStorage.setItem(analyticsStore.STORAGE_KEY_PRIMARY, corrupt);
      globalThis.localStorage.setItem(analyticsStore.STORAGE_KEY_COMPAT, corrupt);

      const state = analyticsStore.loadState();
      assert.strictEqual(typeof state, 'object', `loadState on '${corrupt}' must return object`);
      assert.strictEqual(state.totalListeningSeconds, 0);
      assert.deepStrictEqual(state.completedChapters, []);
      assert.deepStrictEqual(state.dailyListeningSeconds, {});

      // getAnalyticsSummary must also succeed safely
      const summary = analyticsStore.getAnalyticsSummary();
      assert.strictEqual(summary.totalListeningSeconds, 0);
      assert.strictEqual(summary.streakDays, 0);
      assert.strictEqual(summary.weeklyListeningMinutes.length, 7);
      assert.strictEqual(summary.completedChaptersCount, 0);
    }
  });

  test('Challenge 5.2: Fuzzing corrupted state properties (NaN, negative, wrong types)', () => {
    resetTestEnvironment();

    const fuzzedState = {
      totalListeningSeconds: NaN,
      dailyListeningSeconds: {
        '2026-01-01': NaN,
        '2026-01-02': -500,
        '2026-01-03': Infinity,
        'invalid-date-format': 600,
        '2026-01-04': 120
      },
      dictationHistory: [
        null,
        undefined,
        42,
        'not-an-object',
        { date: '2026-01-04', accuracy: NaN, totalWords: 0 }
      ],
      shadowingScores: [
        null,
        { score: -50 },
        { score: 9999 }
      ],
      completedChapters: [
        null,
        undefined,
        '',
        '   ',
        12345,
        'hp1-01',
        'hp1-01', // duplicate
        '  hp1-02  '
      ],
      streakDays: -99,
      longestStreakDays: NaN,
      lastActiveDate: 123456
    };

    const sanitized = analyticsStore.sanitizeState(fuzzedState);

    assert.strictEqual(sanitized.totalListeningSeconds, 0, 'NaN totalListeningSeconds should sanitize to 0');
    assert.deepStrictEqual(sanitized.dailyListeningSeconds, { '2026-01-04': 120 }, 'Only valid positive finite numbers with YYYY-MM-DD should survive');
    assert.strictEqual(sanitized.completedChapters.length, 2, 'Completed chapters should trim and deduplicate');
    assert.ok(sanitized.completedChapters.includes('hp1-01'));
    assert.ok(sanitized.completedChapters.includes('hp1-02'));
    assert.strictEqual(sanitized.streakDays, 0, 'Negative streakDays should sanitize to 0');
    assert.strictEqual(sanitized.longestStreakDays, 0, 'NaN longestStreakDays should sanitize to 0');
    assert.strictEqual(sanitized.lastActiveDate, null, 'Non-string lastActiveDate should sanitize to null');
  });

  test('Challenge 6.1: API Argument Boundary Fuzzing', () => {
    resetTestEnvironment();

    // 1. recordListeningSeconds with bad inputs
    analyticsStore.recordListeningSeconds(-100);
    analyticsStore.recordListeningSeconds(0);
    analyticsStore.recordListeningSeconds(NaN);
    analyticsStore.recordListeningSeconds(Infinity);
    analyticsStore.recordListeningSeconds(-Infinity);
    analyticsStore.recordListeningSeconds(null);
    analyticsStore.recordListeningSeconds(undefined);
    analyticsStore.recordListeningSeconds('not-a-number');
    assert.strictEqual(analyticsStore.getAnalyticsSummary().totalListeningSeconds, 0, 'Invalid seconds must be ignored');

    // Valid numeric string should be accepted
    analyticsStore.recordListeningSeconds('120');
    assert.strictEqual(analyticsStore.getAnalyticsSummary().totalListeningSeconds, 120, 'Numeric string should be parsed and added');

    // 2. recordDictationSession with edge cases
    analyticsStore.recordDictationSession(null);
    analyticsStore.recordDictationSession(undefined);
    analyticsStore.recordDictationSession({});
    analyticsStore.recordDictationSession({ totalWords: 0, correctWords: 0 });
    analyticsStore.recordDictationSession({ totalWords: -10, correctWords: -5 });
    analyticsStore.recordDictationSession({ totalWords: 10, correctWords: 15 }); // >100% correct words
    analyticsStore.recordDictationSession({ accuracy: 150 }); // Oversized accuracy
    analyticsStore.recordDictationSession({ accuracy: -25 }); // Negative accuracy
    analyticsStore.recordDictationSession({ accuracy: NaN });

    const raw = analyticsStore.getRawAnalyticsData();
    assert.ok(raw.dictationHistory.length >= 4, 'Valid or recoverable session records added');
    for (const d of raw.dictationHistory) {
      assert.ok(Number.isFinite(d.accuracy), `Accuracy must be finite: ${d.accuracy}`);
      assert.ok(d.accuracy >= 0 && d.accuracy <= 100, `Accuracy must be clamped to [0, 100]: ${d.accuracy}`);
      assert.ok(d.totalWords >= 0, `totalWords must be >= 0: ${d.totalWords}`);
      assert.ok(d.correctWords >= 0, `correctWords must be >= 0: ${d.correctWords}`);
    }

    // 3. recordShadowingScore with edge cases
    analyticsStore.recordShadowingScore(null);
    analyticsStore.recordShadowingScore(undefined);
    analyticsStore.recordShadowingScore({ score: 200 });
    analyticsStore.recordShadowingScore({ score: -50 });
    analyticsStore.recordShadowingScore({ score: NaN });

    const rawShadow = analyticsStore.getRawAnalyticsData();
    assert.strictEqual(rawShadow.shadowingScores.length, 3);
    assert.strictEqual(rawShadow.shadowingScores[0].score, 100, 'Score > 100 should clamp to 100');
    assert.strictEqual(rawShadow.shadowingScores[1].score, 0, 'Score < 0 should clamp to 0');
    assert.strictEqual(rawShadow.shadowingScores[2].score, 0, 'NaN score should default to 0');

    // 4. markChapterCompleted with edge cases
    analyticsStore.markChapterCompleted(null);
    analyticsStore.markChapterCompleted(undefined);
    analyticsStore.markChapterCompleted('');
    analyticsStore.markChapterCompleted('   ');
    analyticsStore.markChapterCompleted(12345);
    analyticsStore.markChapterCompleted('hp1-01');
    analyticsStore.markChapterCompleted('hp1-01'); // duplicate
    analyticsStore.markChapterCompleted('  hp1-01  '); // trimmed duplicate

    assert.strictEqual(analyticsStore.isChapterCompleted('hp1-01'), true);
    assert.strictEqual(analyticsStore.isChapterCompleted('non-existent'), false);
    assert.strictEqual(analyticsStore.isChapterCompleted(null), false);
    assert.strictEqual(analyticsStore.getAnalyticsSummary().completedChaptersCount, 1, 'Only one valid chapter ID should be stored');
  });

  test('Challenge 7.1: Quota exceeded simulation during saveState', () => {
    resetTestEnvironment();

    // Mock setItem throwing QuotaExceededError
    const originalSetItem = mockStorageInstance.setItem;
    let setItemAttempts = 0;

    mockStorageInstance.setItem = () => {
      setItemAttempts++;
      const quotaErr = new Error('QuotaExceededError: The quota has been exceeded.');
      quotaErr.name = 'QuotaExceededError';
      quotaErr.code = 22;
      throw quotaErr;
    };

    try {
      // All these operations must catch the quota exception silently without crashing
      assert.doesNotThrow(() => {
        analyticsStore.recordListeningSeconds(60);
      }, 'recordListeningSeconds must not throw when storage quota exceeded');

      assert.doesNotThrow(() => {
        analyticsStore.recordDictationSession({
          chapterId: 'hp1-01',
          chapterTitle: 'Test',
          totalWords: 10,
          correctWords: 8
        });
      }, 'recordDictationSession must not throw when storage quota exceeded');

      assert.doesNotThrow(() => {
        analyticsStore.recordShadowingScore({
          chapterId: 'hp1-01',
          cueId: 1,
          score: 85
        });
      }, 'recordShadowingScore must not throw when storage quota exceeded');

      assert.doesNotThrow(() => {
        analyticsStore.markChapterCompleted('hp1-01');
      }, 'markChapterCompleted must not throw when storage quota exceeded');

      assert.doesNotThrow(() => {
        analyticsStore.resetAnalyticsStore();
      }, 'resetAnalyticsStore must not throw when storage quota exceeded');

      assert.ok(setItemAttempts > 0, 'setItem should have been attempted');
    } finally {
      mockStorageInstance.setItem = originalSetItem;
    }
  });

});
