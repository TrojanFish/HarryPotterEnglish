/**
 * Adversarial Challenge Test Suite for AnalyticsDashboard (Milestone 2 - R2)
 *
 * Focus areas:
 * 1. Empty data chart rendering (zero listening minutes, zero dictation sessions)
 * 2. Saturated data chart rendering (thousands of minutes, 100 dictation sessions)
 * 3. Boundary & malformed data resilience (NaN, negative, >100%, 1-session edge case)
 * 4. Theme contrast (WCAG 2.1 compliance) & visibility across Parchment vs Night Sky
 * 5. Lifecycle & SSR behavior analysis (useState initial state vs useEffect)
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

// Transpile OwlsCertificateModal.jsx
const owlsPath = path.resolve(projectRoot, 'src', 'components', 'analytics', 'OwlsCertificateModal.jsx');
const transformedOwls = esbuild.transformSync(
  fs.readFileSync(owlsPath, 'utf8')
    .replace("from '../../constants/hogwartsTheme.js'", "from '../src/constants/hogwartsTheme.js'")
    .replace("from '../common/WaxSealBadge.jsx'", "from './WaxSealBadge.compiled.js'"),
  { loader: 'jsx', format: 'esm' }
);
fs.writeFileSync(path.resolve(__dirname, 'OwlsCertificateModal.compiled.js'), transformedOwls.code, 'utf8');

// Transpile original component as-is
const dashboardOriginalSrc = fs.readFileSync(
  path.resolve(projectRoot, 'src', 'components', 'AnalyticsDashboard.jsx'),
  'utf8'
).replace(/\.\.\/utils\/(\w+)/g, '../src/utils/$1.js')
 .replace("from './analytics/OwlsCertificateModal.jsx'", "from './OwlsCertificateModal.compiled.js'")
 .replace("from '../constants/hogwartsTheme.js'", "from '../src/constants/hogwartsTheme.js'");

const dashboardCompiled = esbuild.transformSync(dashboardOriginalSrc, { loader: 'jsx', format: 'esm' });
const compiledPath = path.resolve(__dirname, 'AnalyticsDashboard.adversarial.compiled.js');
fs.writeFileSync(compiledPath, dashboardCompiled.code, 'utf8');

const { AnalyticsDashboard } = await import('./AnalyticsDashboard.adversarial.compiled.js');

// Transpile a testable harness that permits injecting custom summary for deep SVG mathematical stress testing
const harnessSrc = dashboardOriginalSrc
  .replace(
    'export function AnalyticsDashboard({',
    'export function AnalyticsDashboardHarness({ initialSummary = null,'
  )
  .replace(
    'const [summary, setSummary] = useState(null);',
    'const [summary, setSummary] = useState(initialSummary);'
  )
  .replace(
    'export default AnalyticsDashboard;',
    'export default AnalyticsDashboardHarness;'
  );

const harnessCompiled = esbuild.transformSync(harnessSrc, { loader: 'jsx', format: 'esm' });
const harnessCompiledPath = path.resolve(__dirname, 'AnalyticsDashboardHarness.compiled.js');
fs.writeFileSync(harnessCompiledPath, harnessCompiled.code, 'utf8');

const { AnalyticsDashboardHarness } = await import('./AnalyticsDashboardHarness.compiled.js');

/**
 * Helper: Computes WCAG 2.1 Relative Luminance for hex color '#RRGGBB'
 */
function getRelativeLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Helper: Computes WCAG 2.1 Contrast Ratio between two hex colors
 */
function getContrastRatio(hex1, hex2) {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ============================================================================
// CHALLENGE 1: Empty Data & Pristine State Handling
// ============================================================================

test('Adversarial R2.1: Completely empty state renders cleanly without NaN, Infinity, or broken SVG paths', () => {
  resetTestEnvironment();

  const html = renderToString(
    React.createElement(AnalyticsDashboard, {
      isOpen: true,
      onClose: () => {},
      isParchment: false,
      vocabCount: 0
    })
  );

  // Must render core modal structures
  assert.ok(html.includes('霍格沃茨学业数据罗盘'), 'Title must be present in empty state');
  // Check streak metric card
  assert.ok(html.includes('>0</span><span class="text-xs text-[#8c9ba5]">天'), 'Streak card displays 0天');
  // Check listening duration metric card
  assert.ok(html.includes('>0</span><span class="text-xs text-[#8c9ba5]">分钟'), 'Listening card displays 0分钟');
  // Check completed chapters metric card
  assert.ok(html.includes('>0</span><span class="text-xs text-[#8c9ba5]">篇'), 'Chapters card displays 0篇');
  // Check vocab metric card
  assert.ok(html.includes('>0</span><span class="text-xs text-[#8c9ba5]">词'), 'Vocab card displays 0词');

  // Must render Weekly Bar Chart
  assert.ok(html.includes('<svg'), 'Bar chart SVG must exist');
  // Gridline max label for empty state: Math.round(1.0 * 15) = 15m
  assert.ok(html.includes('15<!-- -->m') || html.includes('15m'), 'Empty bar chart y-axis must show minimum 15m baseline scale');

  // Must render Dictation Empty State (not broken chart)
  assert.ok(html.includes('暂无听写练习记录'), 'Dictation empty state message must be shown');
  assert.ok(html.includes('切换至顶部【听写工坊】'), 'Empty state guidance must be present');

  // Strict check: zero NaN or Infinity or null/undefined in rendered markup
  assert.strictEqual(/NaN/.test(html), false, 'Rendered HTML must never contain "NaN"');
  assert.strictEqual(/Infinity/.test(html), false, 'Rendered HTML must never contain "Infinity"');
  assert.strictEqual(/undefined/.test(html), false, 'Rendered HTML must never contain "undefined"');
});

test('Adversarial R2.2: Single dictation session (length = 1) boundary condition avoids division by zero', () => {
  resetTestEnvironment();

  // Test single session with 0% accuracy
  const singleZeroSummary = {
    totalListeningSeconds: 0,
    weeklyListeningMinutes: [
      { day: 'Sun', date: '2026-09-26', minutes: 0 },
      { day: 'Mon', date: '2026-09-27', minutes: 0 },
      { day: 'Tue', date: '2026-09-28', minutes: 0 },
      { day: 'Wed', date: '2026-09-29', minutes: 0 },
      { day: 'Thu', date: '2026-09-30', minutes: 0 },
      { day: 'Fri', date: '2026-10-01', minutes: 0 },
      { day: 'Sat', date: '2026-10-02', minutes: 0 }
    ],
    dictationTrend: [
      { date: '2026-10-02', accuracy: 0 }
    ],
    completedChaptersCount: 0,
    streakDays: 1,
    longestStreakDays: 1
  };

  const html = renderToString(
    React.createElement(AnalyticsDashboardHarness, {
      isOpen: true,
      onClose: () => {},
      initialSummary: singleZeroSummary,
      isParchment: false,
      vocabCount: 0
    })
  );

  // When length === 1, x must center at 260 (520 / 2)
  assert.ok(html.includes('cx="260"'), 'Single point x coordinate must be centered at 260');
  // For accuracy 0%, y = 160 - 25 - (0/100) * 110 = 135
  assert.ok(html.includes('cy="135"'), 'Single point y coordinate for 0% accuracy must be 135');
  assert.ok(html.includes('0<!-- -->%') || html.includes('0%'), 'Accuracy label 0% must be rendered');

  // When length === 1, trendLinePath and trendAreaPath must NOT render invalid empty paths
  assert.strictEqual(html.includes('<path d=""'), false, 'Must not render broken empty path');
  assert.strictEqual(/NaN/.test(html), false, 'No NaN allowed on length = 1 boundary');
  assert.strictEqual(/Infinity/.test(html), false, 'No Infinity allowed on length = 1 boundary');
});

test('Adversarial R2.3: Single dictation session with 100% accuracy maps accurately to top padding', () => {
  const single100Summary = {
    totalListeningSeconds: 0,
    weeklyListeningMinutes: [],
    dictationTrend: [{ date: '2026-10-02', accuracy: 100 }],
    completedChaptersCount: 0,
    streakDays: 1,
    longestStreakDays: 1
  };

  const html = renderToString(
    React.createElement(AnalyticsDashboardHarness, {
      isOpen: true,
      onClose: () => {},
      initialSummary: single100Summary
    })
  );

  // For accuracy 100%, y = 160 - 25 - (100/100) * 110 = 25
  assert.ok(html.includes('cx="260"'), 'Centered x at 260');
  assert.ok(html.includes('cy="25"'), 'Top y at 25 for 100% accuracy');
  assert.ok(html.includes('100<!-- -->%') || html.includes('100%'), '100% accuracy text rendered');
});

// ============================================================================
// CHALLENGE 2: Saturated Data Stress Testing
// ============================================================================

test('Adversarial R2.4: Extreme listening duration (10,000,000 seconds / ~2,777 hours) formats properly', () => {
  const saturatedListeningSummary = {
    totalListeningSeconds: 10000000, // 2777 hours 46 minutes 40 seconds
    weeklyListeningMinutes: [
      { day: 'Sun', date: '2026-09-26', minutes: 1200 },
      { day: 'Mon', date: '2026-09-27', minutes: 2400 },
      { day: 'Tue', date: '2026-09-28', minutes: 3600 },
      { day: 'Wed', date: '2026-09-29', minutes: 4800 },
      { day: 'Thu', date: '2026-09-30', minutes: 6000 },
      { day: 'Fri', date: '2026-10-01', minutes: 7200 },
      { day: 'Sat', date: '2026-10-02', minutes: 10000 }
    ],
    dictationTrend: [],
    completedChaptersCount: 999,
    streakDays: 365,
    longestStreakDays: 730
  };

  const html = renderToString(
    React.createElement(AnalyticsDashboardHarness, {
      isOpen: true,
      onClose: () => {},
      initialSummary: saturatedListeningSummary,
      vocabCount: 50000
    })
  );

  // Check habit card formatting
  assert.ok(html.includes('2777h') && html.includes('46'), 'Should format 2,777 hours and 46 minutes');
  assert.ok(html.includes('10000000'), 'Should display 10000000 seconds counter');
  assert.ok(html.includes('999'), 'Should display 999 chapters');
  assert.ok(html.includes('50000'), 'Should display 50,000 vocab entries');
  assert.ok(html.includes('365'), 'Should display 365 days streak');
  assert.ok(html.includes('730'), 'Should display 730 longest streak');

  // Bar chart scaling with max 10000m
  assert.ok(html.includes('10000<!-- -->m') || html.includes('10000m'), 'Max scale gridline should show 10000m');
  assert.ok(html.includes('5000<!-- -->m') || html.includes('5000m'), 'Mid scale gridline should show 5000m');
  assert.strictEqual(/NaN/.test(html), false, 'No NaN on saturated listening numbers');
});

test('Adversarial R2.5: Saturated 100 dictation sessions generate valid SVG path without memory exhaustion or NaN', () => {
  // Generate 100 realistic dictation sessions
  const sessions = [];
  for (let i = 1; i <= 100; i++) {
    const acc = (i * 7) % 101; // Varying accuracy between 0 and 100
    sessions.push({
      date: `2026-0${Math.floor(i / 30) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
      accuracy: acc
    });
  }

  const saturatedSessionsSummary = {
    totalListeningSeconds: 3600,
    weeklyListeningMinutes: [
      { day: 'Sun', date: '2026-09-26', minutes: 10 },
      { day: 'Mon', date: '2026-09-27', minutes: 15 },
      { day: 'Tue', date: '2026-09-28', minutes: 20 },
      { day: 'Wed', date: '2026-09-29', minutes: 25 },
      { day: 'Thu', date: '2026-09-30', minutes: 30 },
      { day: 'Fri', date: '2026-10-01', minutes: 35 },
      { day: 'Sat', date: '2026-10-02', minutes: 40 }
    ],
    dictationTrend: sessions,
    completedChaptersCount: 15,
    streakDays: 45,
    longestStreakDays: 60
  };

  const html = renderToString(
    React.createElement(AnalyticsDashboardHarness, {
      isOpen: true,
      onClose: () => {},
      initialSummary: saturatedSessionsSummary
    })
  );

  // SVG Trend Line and Area paths must be non-empty and well-formed
  assert.ok(html.includes('d=" M 40,'), 'Trend line path must start at initial coordinate (x=40)');
  assert.ok(html.includes('L 480,'), 'Trend line path must terminate at end coordinate (x=480)');
  assert.ok(html.includes('L 480,135 L 40,135 Z'), 'Trend area path must close at baseline (y=135)');

  // Verify all 100 data points rendered (filter by r="5" which is used for data point nodes)
  const nodeMatches = html.match(/<circle\b[^>]*r="5"/g);
  assert.ok(nodeMatches && nodeMatches.length === 100, `Must render exactly 100 data point circles, found ${nodeMatches?.length}`);

  // No NaN or Infinity in 100 points
  assert.strictEqual(/NaN/.test(html), false, 'No NaN in 100 points');
  assert.strictEqual(/Infinity/.test(html), false, 'No Infinity in 100 points');
});

// ============================================================================
// CHALLENGE 3: Boundary & Malformed Inputs
// ============================================================================

test('Adversarial R2.6: Malformed session accuracy (negative, >100%, null) is safely clamped in dictation curve', () => {
  const malformedSummary = {
    totalListeningSeconds: 0,
    weeklyListeningMinutes: [
      { day: 'Sun', date: '2026-09-26', minutes: 0 },
      { day: 'Mon', date: '2026-09-27', minutes: 10 },
      { day: 'Tue', date: '2026-09-28', minutes: 0 },
      { day: 'Wed', date: '2026-09-29', minutes: 20 },
      { day: 'Thu', date: '2026-09-30', minutes: 0 },
      { day: 'Fri', date: '2026-10-01', minutes: 10 },
      { day: 'Sat', date: '2026-10-02', minutes: 15 }
    ],
    dictationTrend: [
      { date: '2026-10-01', accuracy: -100 }, // Underflow -> clamped to 0
      { date: '2026-10-02', accuracy: 250 },  // Overflow -> clamped to 100
      { date: '2026-10-03', accuracy: 50 },
      { date: '2026-10-04', accuracy: null }  // null -> guarded to 0
    ],
    completedChaptersCount: 0,
    streakDays: 0,
    longestStreakDays: 0
  };

  const html = renderToString(
    React.createElement(AnalyticsDashboardHarness, {
      isOpen: true,
      onClose: () => {},
      initialSummary: malformedSummary
    })
  );

  // Underflow (-100) must clamp to y=135 (0% accuracy)
  assert.ok(html.includes('cx="40" cy="135"'), 'Point 1 (-100%) must clamp to y=135');
  // Overflow (250) must clamp to y=25 (100% accuracy)
  assert.ok(html.includes('cy="25"'), 'Point 2 (250%) must clamp to y=25');

  // Verify coordinates are strictly numbers
  assert.strictEqual(/cy="NaN"/.test(html), false, 'cy attribute must never be NaN');
  assert.strictEqual(/cx="NaN"/.test(html), false, 'cx attribute must never be NaN');
  assert.strictEqual(/Infinity/.test(html), false, 'Malformed accuracies must not produce Infinity');
});

test('Adversarial R2.6b [REMEDIATED]: AnalyticsDashboard safely guards d.minutes=NaN preventing SVG NaN attributes', () => {
  // Verify remediation of d.minutes=NaN vulnerability in AnalyticsDashboard
  const nanMinutesSummary = {
    totalListeningSeconds: 0,
    weeklyListeningMinutes: [
      { day: 'Sun', date: '2026-09-26', minutes: NaN }
    ],
    dictationTrend: [],
    completedChaptersCount: 0,
    streakDays: 0,
    longestStreakDays: 0
  };

  const html = renderToString(
    React.createElement(AnalyticsDashboardHarness, {
      isOpen: true,
      onClose: () => {},
      initialSummary: nanMinutesSummary
    })
  );

  const hasNanInSvgRect = /<rect[^>]*y="NaN"/.test(html) || /<rect[^>]*height="NaN"/.test(html);
  assert.strictEqual(
    hasNanInSvgRect,
    false,
    'Remediated: d.minutes=NaN produces no y="NaN" or height="NaN" attributes in SVG rect'
  );
});

// ============================================================================
// CHALLENGE 4: Theme Switching & WCAG 2.1 Contrast Auditing
// ============================================================================

test('Adversarial R2.7: Theme switching correctly toggles Parchment vs Hogwarts Night Sky palette classes', () => {
  const sampleSummary = {
    totalListeningSeconds: 1800,
    weeklyListeningMinutes: [
      { day: 'Mon', date: '2026-10-01', minutes: 30 }
    ],
    dictationTrend: [
      { date: '2026-10-01', accuracy: 85 }
    ],
    completedChaptersCount: 2,
    streakDays: 3,
    longestStreakDays: 5
  };

  const darkHtml = renderToString(
    React.createElement(AnalyticsDashboardHarness, {
      isOpen: true,
      onClose: () => {},
      initialSummary: sampleSummary,
      isParchment: false
    })
  );

  const parchmentHtml = renderToString(
    React.createElement(AnalyticsDashboardHarness, {
      isOpen: true,
      onClose: () => {},
      initialSummary: sampleSummary,
      isParchment: true
    })
  );

  // Dark Theme Palette Assertions
  assert.ok(darkHtml.includes('bg-[#0e1422]'), 'Dark theme modal background');
  assert.ok(darkHtml.includes('border-[#223147]'), 'Dark theme container border');
  assert.ok(darkHtml.includes('text-[#e2d9c8]'), 'Dark theme text');
  assert.ok(darkHtml.includes('bg-[#131b2a]'), 'Dark theme card background');
  assert.ok(darkHtml.includes('stroke="#1e293b"'), 'Dark theme gridlines');
  assert.ok(darkHtml.includes('fill="#64748b"'), 'Dark theme axis text');

  // Parchment Theme Palette Assertions
  assert.ok(parchmentHtml.includes('bg-[#fbf6ea]'), 'Parchment modal background');
  assert.ok(parchmentHtml.includes('border-[#dec9a5]'), 'Parchment container border');
  assert.ok(parchmentHtml.includes('text-[#2d1e12]'), 'Parchment primary text');
  assert.ok(parchmentHtml.includes('bg-[#fffdf8]'), 'Parchment card background');
  assert.ok(parchmentHtml.includes('stroke="#e8dcbe"'), 'Parchment gridlines');
  assert.ok(parchmentHtml.includes('fill="#998369"'), 'Parchment axis text');
});

test('Adversarial R2.8: WCAG 2.1 color contrast verification across both themes', () => {
  // Parchment Theme Color Pairs
  const parchmentBg = '#fbf6ea';
  const parchmentCardBg = '#fffdf8';
  const parchmentPrimaryText = '#2d1e12';
  const parchmentSecondaryText = '#7d6852';
  const parchmentLabelText = '#5c4834';

  const parchmentPrimaryRatio = getContrastRatio(parchmentPrimaryText, parchmentBg);
  assert.ok(
    parchmentPrimaryRatio >= 7.0,
    `Parchment primary text contrast (${parchmentPrimaryRatio.toFixed(2)}) must exceed AAA threshold (7.0)`
  );

  const parchmentLabelRatio = getContrastRatio(parchmentLabelText, parchmentCardBg);
  assert.ok(
    parchmentLabelRatio >= 7.0,
    `Parchment label contrast (${parchmentLabelRatio.toFixed(2)}) must exceed AAA threshold (7.0)`
  );

  const parchmentSecondaryRatio = getContrastRatio(parchmentSecondaryText, parchmentCardBg);
  assert.ok(
    parchmentSecondaryRatio >= 4.5,
    `Parchment secondary contrast (${parchmentSecondaryRatio.toFixed(2)}) must exceed AA threshold (4.5)`
  );

  // Night Sky Theme Color Pairs
  const nightSkyBg = '#0e1422';
  const nightSkyCardBg = '#131b2a';
  const nightSkyPrimaryText = '#e2d9c8';
  const nightSkyGoldHeader = '#d3a625';
  const nightSkyCardText = '#8c9ba5';
  const nightSkyActiveGold = '#f3d38c';
  const nightSkyTooltipBg = '#182335';

  const nightSkyPrimaryRatio = getContrastRatio(nightSkyPrimaryText, nightSkyBg);
  assert.ok(
    nightSkyPrimaryRatio >= 7.0,
    `Night sky primary text contrast (${nightSkyPrimaryRatio.toFixed(2)}) must exceed AAA threshold (7.0)`
  );

  const nightSkyGoldRatio = getContrastRatio(nightSkyGoldHeader, nightSkyBg);
  assert.ok(
    nightSkyGoldRatio >= 4.5,
    `Night sky gold title contrast (${nightSkyGoldRatio.toFixed(2)}) must exceed AA threshold (4.5)`
  );

  const nightSkyCardRatio = getContrastRatio(nightSkyCardText, nightSkyCardBg);
  assert.ok(
    nightSkyCardRatio >= 4.5,
    `Night sky card text contrast (${nightSkyCardRatio.toFixed(2)}) must exceed AA threshold (4.5)`
  );

  const nightSkyActiveGoldRatio = getContrastRatio(nightSkyActiveGold, nightSkyTooltipBg);
  assert.ok(
    nightSkyActiveGoldRatio >= 7.0,
    `Night sky tooltip gold contrast (${nightSkyActiveGoldRatio.toFixed(2)}) must exceed AAA threshold (7.0)`
  );
});

// ============================================================================
// CHALLENGE 5: Behavioral & SSR Discovery Audit
// ============================================================================

test('Adversarial R2.9: Empirical verification of useState(null) SSR limitation vs Client-side double-render', () => {
  resetTestEnvironment();

  // Populate persistent storage with realistic active study data
  analyticsStore.recordListeningSeconds(3600); // 1 hour
  analyticsStore.recordDictationSession({
    chapterId: 'hp1-01',
    chapterTitle: 'The Boy Who Lived',
    totalWords: 10,
    correctWords: 9,
    accuracy: 90
  });

  // Render original un-harnessed AnalyticsDashboard via SSR
  const ssrHtml = renderToString(
    React.createElement(AnalyticsDashboard, {
      isOpen: true,
      onClose: () => {},
      isParchment: false,
      vocabCount: 12
    })
  );

  // SSR observation: Because useState is initialized to null and useEffect is skipped in SSR,
  // the initial render output uses the empty fallback structure.
  assert.ok(
    ssrHtml.includes('暂无听写练习记录'),
    'Observation confirmed: SSR render uses initial null fallback state (empty dictation prompt)'
  );

  // Note: While this produces safe, non-crashing HTML in SSR, it reveals that on client-side mount,
  // the component performs an initial frame render with 0 values before useEffect updates the state.
  // The fallback structure successfully defends against crashes:
  assert.strictEqual(/NaN/.test(ssrHtml), false, 'Fallback structure is safe from NaN');
  assert.strictEqual(/undefined/.test(ssrHtml), false, 'Fallback structure is safe from undefined');
});
