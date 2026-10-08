/**
 * sleepTimer.js — Hogwarts Narrative Audio Sleep Timer Utility
 * Supports presets: 15min, 30min, 45min, or end of chapter.
 * Strictly zero emojis.
 */

export const SLEEP_TIMER_OPTIONS = [
  { label: '关闭', value: null, short: '关' },
  { label: '15 分钟', value: 15, short: '15m' },
  { label: '30 分钟', value: 30, short: '30m' },
  { label: '45 分钟', value: 45, short: '45m' },
  { label: '本集播完', value: 'end_of_chapter', short: '本集' }
];

export function getNextSleepTimerOption(currentValue) {
  const values = SLEEP_TIMER_OPTIONS.map(opt => opt.value);
  const currentIndex = values.indexOf(currentValue);
  const nextIndex = (currentIndex + 1) % values.length;
  return values[nextIndex];
}

export function formatSleepTimerRemaining(remainingSeconds, mode) {
  if (mode === 'end_of_chapter') {
    return '本集';
  }
  if (remainingSeconds === null || remainingSeconds === undefined || mode === null) {
    return '';
  }
  const safeSecs = Math.max(0, Math.floor(remainingSeconds));
  const mins = Math.floor(safeSecs / 60);
  const secs = safeSecs % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateSleepTimerRemaining(targetTimestamp, now = Date.now()) {
  if (!targetTimestamp) return null;
  const diffMs = targetTimestamp - now;
  return Math.max(0, Math.ceil(diffMs / 1000));
}
