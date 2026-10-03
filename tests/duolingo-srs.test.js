/**
 * tests/duolingo-srs.test.js
 * Verification test suite for Duolingo-style Spaced Repetition System (SRS)
 * and Time-Turner Streak Freeze mechanics.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import './setup.js';
import { resetTestEnvironment } from './setup.js';
import { 
  ensureSrsMetadata, 
  getDueWords, 
  processReviewResult, 
  getSrsStats,
  SRS_INTERVALS_DAYS 
} from '../src/utils/srsEngine.js';
import { 
  checkAndApplyTimeTurnerProtection, 
  getTimeTurners, 
  awardTimeTurner, 
  useTimeTurner,
  getAnalyticsSummary,
  getTodayDateStr
} from '../src/utils/analyticsStore.js';

// ============================================================================
// Duolingo SRS Leitner Engine Tests
// ============================================================================

test('Duolingo SRS: ensureSrsMetadata initializes missing SRS properties safely', () => {
  const rawWord = { id: 'w1', word: 'lumos', translation: '荧光闪烁' };
  const initialized = ensureSrsMetadata(rawWord);

  assert.strictEqual(initialized.srsBox, 1);
  assert.strictEqual(initialized.srsIntervalDays, 1);
  assert.strictEqual(initialized.srsReviewCount, 0);
  assert.strictEqual(typeof initialized.srsNextReviewDate, 'string');
  assert.match(initialized.srsNextReviewDate, /^\d{4}-\d{2}-\d{2}$/);
});

test('Duolingo SRS: getDueWords filters entries due today or overdue', () => {
  const today = getTodayDateStr();
  const tomorrow = getTodayDateStr(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const yesterday = getTodayDateStr(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const list = [
    { id: 'w1', word: 'alohomora', srsNextReviewDate: today },
    { id: 'w2', word: 'patronum', srsNextReviewDate: yesterday },
    { id: 'w3', word: 'nox', srsNextReviewDate: tomorrow }
  ];

  const due = getDueWords(list);
  assert.strictEqual(due.length, 2);
  assert.ok(due.some(w => w.word === 'alohomora'));
  assert.ok(due.some(w => w.word === 'patronum'));
  assert.ok(!due.some(w => w.word === 'nox'));
});

test('Duolingo SRS: processReviewResult advances box on success and resets on mistake', () => {
  const initial = [
    { id: 'w1', word: 'wand', srsBox: 1, srsIntervalDays: 1, srsReviewCount: 0 },
    { id: 'w2', word: 'cloak', srsBox: 3, srsIntervalDays: 7, srsReviewCount: 2 }
  ];

  // 1. Remembered 'wand' -> box advances to 2, interval to 3 days
  const updated1 = processReviewResult('w1', true, initial);
  const wand = updated1.find(w => w.id === 'w1');
  assert.strictEqual(wand.srsBox, 2);
  assert.strictEqual(wand.srsIntervalDays, SRS_INTERVALS_DAYS[2]);
  assert.strictEqual(wand.srsReviewCount, 1);

  // 2. Forgotten 'cloak' -> box resets to 1, interval to 1 day
  const updated2 = processReviewResult('w2', false, updated1);
  const cloak = updated2.find(w => w.id === 'w2');
  assert.strictEqual(cloak.srsBox, 1);
  assert.strictEqual(cloak.srsIntervalDays, SRS_INTERVALS_DAYS[1]);
  assert.strictEqual(cloak.srsReviewCount, 3);
});

test('Duolingo SRS: getSrsStats aggregates box mastery counts and due count', () => {
  const list = [
    { id: 'w1', word: 'a', srsBox: 1, srsNextReviewDate: getTodayDateStr() },
    { id: 'w2', word: 'b', srsBox: 2, srsNextReviewDate: getTodayDateStr() },
    { id: 'w3', word: 'c', srsBox: 5, srsNextReviewDate: '2099-01-01' }
  ];

  const stats = getSrsStats(list);
  assert.strictEqual(stats.total, 3);
  assert.strictEqual(stats.box1, 1);
  assert.strictEqual(stats.box2, 1);
  assert.strictEqual(stats.box5, 1);
  assert.strictEqual(stats.mastered, 1); // Box 5 is mastered
  assert.strictEqual(stats.dueToday, 2);
});

// ============================================================================
// Duolingo Time-Turner Streak Freeze Tests
// ============================================================================

test('Time-Turner: Starts with 1 welcome freeze and awards up to max 2', () => {
  resetTestEnvironment();
  const initial = getTimeTurners();
  assert.strictEqual(initial.count, 1);
  assert.strictEqual(initial.maxCount, 2);

  // Awarding 1 brings count to 2
  const newCount = awardTimeTurner(1);
  assert.strictEqual(newCount, 2);

  // Awarding beyond max remains capped at 2
  const cappedCount = awardTimeTurner(5);
  assert.strictEqual(cappedCount, 2);

  // Consuming reduces count
  const success = useTimeTurner();
  assert.strictEqual(success, true);
  assert.strictEqual(getTimeTurners().count, 1);
});

test('Time-Turner: Automatically activates and protects streak when a single day is missed', () => {
  resetTestEnvironment();

  // Set up scenario: active day-before-yesterday, missed yesterday
  const now = new Date();
  const dayBeforeYesterday = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const dayBeforeStr = getTodayDateStr(dayBeforeYesterday);

  const testState = {
    totalListeningSeconds: 600,
    dailyListeningSeconds: {
      [dayBeforeStr]: 600
    },
    dictationHistory: [],
    shadowingScores: [],
    completedChapters: [],
    streakDays: 1,
    longestStreakDays: 1,
    timeTurnersCount: 1,
    frozenDates: []
  };

  globalThis.localStorage.setItem('hogwarts_analytics_data', JSON.stringify(testState));

  // Trigger protection check
  const result = checkAndApplyTimeTurnerProtection(now);
  assert.strictEqual(result.protected, true);
  assert.strictEqual(result.remaining, 0);

  // Verify that yesterday is now in frozenDates and streak is preserved
  const summary = getAnalyticsSummary();
  assert.strictEqual(summary.streakDays, 2); // Streak was preserved (active T-2 + frozen T-1 = 2) instead of resetting to 0
  assert.strictEqual(summary.timeTurnersCount, 0);
  assert.strictEqual(summary.frozenDates.length, 1);
});
