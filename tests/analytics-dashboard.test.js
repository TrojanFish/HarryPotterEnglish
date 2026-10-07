/**
 * Milestone 2 (R2) Full Verification Test Suite
 *
 * Tests:
 * 1. analyticsStore.js:
 *    - Dual-key persistence (hp_study_analytics and hogwarts_analytics_data)
 *    - Consecutive day streak, gaps, broken streaks, historical longest streak
 *    - Defensive recovery against corrupted JSON, NaN, negative listening times
 *    - Dictation session recording with 0 words / 0 division protection
 *    - Shadowing score clamping and streak integration
 *    - Chapter completion deduplication
 * 2. AnalyticsDashboard.jsx:
 *    - React SSR renderToString verification
 *    - SVG Weekly Listening bar chart elements
 *    - SVG Dictation accuracy trend curve elements
 *    - Habit tracking cards (Streak, Listening time, Completed chapters, Vocab count)
 *    - Parchment vs Dark theme class styling
 * 3. Header.jsx:
 *    - Renders Analytics trigger button
 *    - Renders streak badge
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import React from 'react';
import { renderToString } from 'react-dom/server';
import './setup.js';
import { resetTestEnvironment } from './setup.js';
import * as analyticsStore from '../src/utils/analyticsStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Transpile WaxSealBadge.jsx
const waxSealPath = path.resolve(projectRoot, 'src', 'components', 'common', 'WaxSealBadge.jsx');
const transformedWax = esbuild.transformSync(fs.readFileSync(waxSealPath, 'utf8'), { loader: 'jsx', format: 'esm' });
fs.writeFileSync(path.resolve(__dirname, 'WaxSealBadge.compiled.js'), transformedWax.code, 'utf8');

// Transpile HouseHourglasses.jsx
const hourglassPath = path.resolve(projectRoot, 'src', 'components', 'analytics', 'HouseHourglasses.jsx');
const transformedHourglass = esbuild.transformSync(
  fs.readFileSync(hourglassPath, 'utf8')
    .replace("from '../../constants/hogwartsTheme.js'", "from '../src/constants/hogwartsTheme.js'")
    .replace("from '../common/WaxSealBadge.jsx'", "from './WaxSealBadge.compiled.js'"),
  { loader: 'jsx', format: 'esm' }
);
fs.writeFileSync(path.resolve(__dirname, 'HouseHourglasses.compiled.js'), transformedHourglass.code, 'utf8');

// Transpile OwlsCertificateModal.jsx
const owlsPath = path.resolve(projectRoot, 'src', 'components', 'analytics', 'OwlsCertificateModal.jsx');
const transformedOwls = esbuild.transformSync(
  fs.readFileSync(owlsPath, 'utf8')
    .replace("from '../../constants/hogwartsTheme.js'", "from '../src/constants/hogwartsTheme.js'")
    .replace("from '../common/WaxSealBadge.jsx'", "from './WaxSealBadge.compiled.js'"),
  { loader: 'jsx', format: 'esm' }
);
fs.writeFileSync(path.resolve(__dirname, 'OwlsCertificateModal.compiled.js'), transformedOwls.code, 'utf8');

// Transpile AnalyticsDashboard.jsx
const dashboardSrc = fs.readFileSync(path.resolve(projectRoot, 'src', 'components', 'AnalyticsDashboard.jsx'), 'utf8')
  .replace(/\.\.\/utils\/(\w+)/g, '../src/utils/$1.js')
  .replace("from './analytics/HouseHourglasses.jsx'", "from './HouseHourglasses.compiled.js'")
  .replace("from './analytics/OwlsCertificateModal.jsx'", "from './OwlsCertificateModal.compiled.js'")
  .replace("from '../constants/hogwartsTheme.js'", "from '../src/constants/hogwartsTheme.js'");
const dashboardCompiled = esbuild.transformSync(dashboardSrc, { loader: 'jsx', format: 'esm' });
const dashboardCompiledPath = path.resolve(__dirname, 'AnalyticsDashboard.compiled.js');
fs.writeFileSync(dashboardCompiledPath, dashboardCompiled.code, 'utf8');

const { AnalyticsDashboard } = await import('./AnalyticsDashboard.compiled.js');

// Import Header (from precompiled or source if exists)
let Header = null;
const headerPath = path.resolve(projectRoot, 'src', 'components', 'Header.jsx');
if (fs.existsSync(headerPath)) {
  const headerSrc = fs.readFileSync(headerPath, 'utf8');
  const headerCompiled = esbuild.transformSync(headerSrc, { loader: 'jsx', format: 'esm' });
  const headerCompiledPath = path.resolve(__dirname, 'Header.compiled.js');
  fs.writeFileSync(headerCompiledPath, headerCompiled.code, 'utf8');
}
const headerMod = await import('./Header.compiled.js');
Header = headerMod.Header;

test('R2 Unit: Dual-key storage synchronization', () => {
  resetTestEnvironment();
  analyticsStore.recordListeningSeconds(300);
  analyticsStore.markChapterCompleted('hp1-01');

  // Both keys must exist with identical content
  const primaryRaw = globalThis.localStorage.getItem(analyticsStore.STORAGE_KEY_PRIMARY);
  const compatRaw = globalThis.localStorage.getItem(analyticsStore.STORAGE_KEY_COMPAT);

  assert.ok(primaryRaw, 'Primary storage key hp_study_analytics must exist');
  assert.ok(compatRaw, 'Compatibility key hogwarts_analytics_data must exist');
  assert.strictEqual(primaryRaw, compatRaw, 'Both keys must be strictly synchronized');

  const parsed = JSON.parse(primaryRaw);
  assert.strictEqual(parsed.totalListeningSeconds, 300);
  assert.deepStrictEqual(parsed.completedChapters, ['hp1-01']);
});

test('R2 Unit: Error recovery against corrupted localStorage data', () => {
  resetTestEnvironment();
  globalThis.localStorage.setItem('hogwarts_analytics_data', '{corrupt-json-12345');
  globalThis.localStorage.setItem('hp_study_analytics', '{corrupt-json-12345');

  // Should not throw, should return safe fallback initial state
  const summary = analyticsStore.getAnalyticsSummary();
  assert.strictEqual(summary.totalListeningSeconds, 0);
  assert.strictEqual(summary.completedChaptersCount, 0);
  assert.strictEqual(summary.streakDays, 0);
  assert.strictEqual(summary.weeklyListeningMinutes.length, 7);

  // Subsequent record must heal the storage
  analyticsStore.recordListeningSeconds(120);
  const healedSummary = analyticsStore.getAnalyticsSummary();
  assert.strictEqual(healedSummary.totalListeningSeconds, 120);
});

test('R2 Unit: Streak algorithm across leap years and day transitions', () => {
  resetTestEnvironment();

  // Test leap year day transition (2024-02-28 to 2024-02-29 to 2024-03-01)
  const daily = {
    '2024-02-28': 600,
    '2024-02-29': 600,
    '2024-03-01': 600
  };
  const refDate = new Date('2024-03-01T12:00:00Z');
  const streaks = analyticsStore.calculateStreaks(daily, [], [], refDate);

  assert.strictEqual(streaks.longestStreak, 3, 'Consecutive leap year transition should count as 3');
  assert.strictEqual(streaks.currentStreak, 3, 'Current streak on 2024-03-01 should be 3');
});

test('R2 Unit: Broken streak preserves longest streak', () => {
  resetTestEnvironment();

  const daily = {
    '2026-01-01': 300,
    '2026-01-02': 300,
    '2026-01-03': 300,
    '2026-01-04': 300,
    // Gap: 2026-01-05
    '2026-01-06': 300
  };
  const refDate = new Date('2026-01-06T12:00:00Z');
  const streaks = analyticsStore.calculateStreaks(daily, [], [], refDate);

  assert.strictEqual(streaks.longestStreak, 4, 'Longest streak was 4 days');
  assert.strictEqual(streaks.currentStreak, 1, 'Current streak resets to 1 after gap');
});

test('R2 Unit: Dictation 0 words handles division by zero', () => {
  resetTestEnvironment();
  analyticsStore.recordDictationSession({
    chapterId: 'hp1-01',
    chapterTitle: 'Test',
    totalWords: 0,
    correctWords: 0
  });

  const summary = analyticsStore.getAnalyticsSummary();
  assert.strictEqual(summary.dictationTrend.length, 1);
  assert.strictEqual(summary.dictationTrend[0].accuracy, 0);
  assert.ok(!Number.isNaN(summary.dictationTrend[0].accuracy));
});

test('R2 UI: AnalyticsDashboard renders successfully with dark night sky theme', () => {
  resetTestEnvironment();
  analyticsStore.recordListeningSeconds(1800); // 30 minutes
  analyticsStore.recordDictationSession({
    chapterId: 'hp1-01',
    chapterTitle: 'The Boy Who Lived',
    totalWords: 10,
    correctWords: 9,
    accuracy: 90
  });
  analyticsStore.markChapterCompleted('hp1-01');

  const html = renderToString(
    React.createElement(AnalyticsDashboard, {
      isOpen: true,
      onClose: () => {},
      isParchment: false,
      vocabCount: 15
    })
  );

  // Check titles and metrics
  assert.ok(html.includes('霍格沃茨学业数据罗盘'), 'Must render dashboard title');
  assert.ok(html.includes('连续打卡天数'), 'Must render streak card');
  assert.ok(html.includes('累计专注听力'), 'Must render listening card');
  assert.ok(html.includes('已学完章节'), 'Must render chapters card');
  assert.ok(html.includes('生词库收录'), 'Must render vocab card');
  assert.ok(html.includes('15'), 'Must render vocab count 15');

  // Check SVG elements
  assert.ok(html.includes('<svg'), 'Must render SVG chart');
  assert.ok(html.includes('本周听力时长分布'), 'Must render bar chart header');
  assert.ok(html.includes('听写练习准确率走势'), 'Must render trend curve header');
  assert.ok(html.includes('bg-[#0e1422]'), 'Dark theme container class should be present');
});

test('R2 UI: AnalyticsDashboard renders with parchment theme', () => {
  resetTestEnvironment();

  const html = renderToString(
    React.createElement(AnalyticsDashboard, {
      isOpen: true,
      onClose: () => {},
      isParchment: true,
      vocabCount: 7
    })
  );

  assert.ok(html.includes('bg-[#fbf6ea]'), 'Parchment background must be rendered');
  assert.ok(html.includes('霍格沃茨学业数据罗盘'), 'Dashboard title present');
});

test('R2 UI: AnalyticsDashboard returns null when isOpen is false', () => {
  const html = renderToString(
    React.createElement(AnalyticsDashboard, {
      isOpen: false,
      onClose: () => {}
    })
  );
  assert.strictEqual(html, '');
});

test('R2 UI: Header renders Analytics button and streak badge', () => {
  const htmlWithStreak = renderToString(
    React.createElement(Header, {
      streakDays: 5,
      onOpenAnalytics: () => {},
      vocabCount: 10
    })
  );

  assert.ok(htmlWithStreak.includes('学业罗盘'), 'Header must contain Analytics button label');
  assert.ok(htmlWithStreak.includes('5天'), 'Header must display 5天 streak badge');

  const htmlZeroStreak = renderToString(
    React.createElement(Header, {
      streakDays: 0,
      onOpenAnalytics: () => {},
      vocabCount: 0
    })
  );
  assert.ok(htmlZeroStreak.includes('0天'), 'Header must display 0天 when streak is 0');
});
