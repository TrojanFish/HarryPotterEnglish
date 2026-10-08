import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SLEEP_TIMER_OPTIONS,
  formatSleepTimerRemaining,
  getNextSleepTimerOption
} from '../src/utils/sleepTimer.js';

test('Sleep Timer Unit Tests', async (t) => {
  await t.test('1.1: SLEEP_TIMER_OPTIONS defines 5 standard presets', () => {
    assert.strictEqual(SLEEP_TIMER_OPTIONS.length, 5);
    assert.strictEqual(SLEEP_TIMER_OPTIONS[0].value, null);
    assert.strictEqual(SLEEP_TIMER_OPTIONS[1].value, 15);
    assert.strictEqual(SLEEP_TIMER_OPTIONS[2].value, 30);
    assert.strictEqual(SLEEP_TIMER_OPTIONS[3].value, 45);
    assert.strictEqual(SLEEP_TIMER_OPTIONS[4].value, 'end_of_chapter');
  });

  await t.test('1.2: formatSleepTimerRemaining accurately formats countdown', () => {
    assert.strictEqual(formatSleepTimerRemaining(900, 15), '15:00');
    assert.strictEqual(formatSleepTimerRemaining(899, 15), '14:59');
    assert.strictEqual(formatSleepTimerRemaining(65, 15), '01:05');
    assert.strictEqual(formatSleepTimerRemaining(0, 15), '00:00');
    assert.strictEqual(formatSleepTimerRemaining(null, 'end_of_chapter'), '本集');
    assert.strictEqual(formatSleepTimerRemaining(null, null), '');
  });

  await t.test('1.3: getNextSleepTimerOption cycles through presets', () => {
    assert.strictEqual(getNextSleepTimerOption(null), 15);
    assert.strictEqual(getNextSleepTimerOption(15), 30);
    assert.strictEqual(getNextSleepTimerOption(30), 45);
    assert.strictEqual(getNextSleepTimerOption(45), 'end_of_chapter');
    assert.strictEqual(getNextSleepTimerOption('end_of_chapter'), null);
  });

  await t.test('1.4: calculateSleepTimerRemaining avoids throttling drift using timestamps', async () => {
    const { calculateSleepTimerRemaining } = await import('../src/utils/sleepTimer.js');
    const now = 1000000;
    const target = now + 900000; // 15 mins later
    assert.strictEqual(calculateSleepTimerRemaining(target, now), 900);
    assert.strictEqual(calculateSleepTimerRemaining(target, now + 300000), 600);
    assert.strictEqual(calculateSleepTimerRemaining(target, now + 900000), 0);
    assert.strictEqual(calculateSleepTimerRemaining(target, now + 950000), 0);
    assert.strictEqual(calculateSleepTimerRemaining(null, now), null);
  });
});
