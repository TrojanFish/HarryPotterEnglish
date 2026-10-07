import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import React from 'react';
import { renderToString } from 'react-dom/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Transpile GlobalPodcastCapsule.jsx
// Transpile GoldenSnitchScrubber.jsx
const snitchPath = path.resolve(projectRoot, 'src', 'components', 'common', 'GoldenSnitchScrubber.jsx');
const transformedSnitch = esbuild.transformSync(fs.readFileSync(snitchPath, 'utf8'), { loader: 'jsx', format: 'esm' });
fs.writeFileSync(path.resolve(__dirname, 'GoldenSnitchScrubber.compiled.js'), transformedSnitch.code, 'utf8');

const capsuleSrcPath = path.resolve(projectRoot, 'src', 'components', 'navigation', 'GlobalPodcastCapsule.jsx');
let capsuleSrcCode = fs.readFileSync(capsuleSrcPath, 'utf8');
capsuleSrcCode = capsuleSrcCode
  .replace("from '../../utils/vttParser'", "from '../src/utils/vttParser.js'")
  .replace("from '../../utils/sleepTimer'", "from '../src/utils/sleepTimer.js'")
  .replace("from '../../utils/magicalSound.js'", "from '../src/utils/magicalSound.js'")
  .replace("from '../common/GoldenSnitchScrubber.jsx'", "from './GoldenSnitchScrubber.compiled.js'");

const transformedCapsule = esbuild.transformSync(capsuleSrcCode, { loader: 'jsx', format: 'esm' });
const compiledCapsulePath = path.resolve(__dirname, 'GlobalPodcastCapsule.compiled.js');
fs.writeFileSync(compiledCapsulePath, transformedCapsule.code, 'utf8');

const { GlobalPodcastCapsule } = await import('./GlobalPodcastCapsule.compiled.js');

test('GlobalPodcastCapsule Test Suite', async (t) => {
  const mockBook = { id: 'book1', title: 'Philosopher Stone', cnTitle: '哈利·波特与魔法石' };
  const mockChapter = { id: 'c1', title: 'The Boy Who Lived', cnTitle: '大难不死的男孩' };

  await t.test('3.1: Desktop view renders floating capsule with chapter title and sentence transport', () => {
    const html = renderToString(
      React.createElement(GlobalPodcastCapsule, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 45,
        duration: 300,
        isPlaying: true,
        isMobile: false,
        onPlayPause: () => {},
        onPrevSentence: () => {},
        onNextSentence: () => {},
        onEnterPlayer: () => {}
      })
    );

    assert.ok(html.includes('大难不死的男孩'), 'Must render chapter title');
    assert.ok(html.includes('上一句'), 'Must contain 上一句');
    assert.ok(html.includes('下一句'), 'Must contain 下一句');
    assert.ok(!html.includes('快退 15 秒'), 'Must not contain 15s skip backward');
    assert.ok(!html.includes('快进 15 秒'), 'Must not contain 15s skip forward');
    assert.ok(html.includes('进入精听') || html.includes('教室'), 'Must include enter player CTA');
  });

  await t.test('3.2: Mobile view renders compact capsule adhering to Apple HIG touch targets', () => {
    const html = renderToString(
      React.createElement(GlobalPodcastCapsule, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 45,
        duration: 300,
        isPlaying: false,
        isMobile: true,
        onPlayPause: () => {},
        onSeekRelative: () => {},
        onEnterPlayer: () => {}
      })
    );

    assert.ok(html.includes('大难不死的男孩'), 'Mobile must render chapter title');
    assert.ok(html.includes('min-h-[44px]') || html.includes('w-11') || html.includes('w-10'), 'Buttons must follow Apple HIG touch targets');
  });

  await t.test('3.3: Displays sleep timer countdown when active', () => {
    const html = renderToString(
      React.createElement(GlobalPodcastCapsule, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 45,
        duration: 300,
        isPlaying: true,
        sleepTimerMode: 15,
        sleepTimerRemaining: '14:30'
      })
    );

    assert.ok(html.includes('14:30'), 'Must render active sleep timer countdown');
  });

  await t.test('3.4: Mobile capsule adheres to warm parchment design system and harmonized transport controls', () => {
    const html = renderToString(
      React.createElement(GlobalPodcastCapsule, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 45,
        duration: 300,
        isPlaying: true,
        isMobile: true,
        onPlayPause: () => {},
        onPrevSentence: () => {},
        onNextSentence: () => {},
        onEnterPlayer: () => {}
      })
    );

    // Mobile capsule must avoid full-bleed high-saturation orange and use parchment palette
    assert.ok(!html.includes('bg-amber-500 text-white border border-amber-600'), 'Must eliminate isolated high-saturation orange mobile capsule background');
    assert.ok(html.includes('bg-white') || html.includes('bg-[#'), 'Must use warm parchment background');
    assert.ok(html.includes('上一句') && html.includes('下一句'), 'Mobile capsule must support sentence navigation');
  });

  await t.test('3.5: Desktop player bar renders top subtle hidden progress bar and removes center bulky input range', () => {
    const html = renderToString(
      React.createElement(GlobalPodcastCapsule, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 45,
        duration: 300,
        isPlaying: true,
        isMobile: false,
        onPlayPause: () => {},
        onSeek: () => {}
      })
    );

    // Desktop view must feature a top-flush scrubber line
    assert.ok(
      html.includes('capsule-top-scrubber') || html.includes('top-0 left-0 right-0') || html.includes('absolute top-0'),
      'Must contain top-mounted progress bar along top edge'
    );
    // Center cluster must eliminate bulky range input
    assert.ok(
      !html.includes('type="range"'),
      'Desktop center controls must eliminate bulky input[type=range] scrubber'
    );
  });

  await t.test('3.6: Desktop player bar provides unified workspace-width docking with max-w-7xl container', () => {
    const html = renderToString(
      React.createElement(GlobalPodcastCapsule, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 45,
        duration: 300,
        isPlaying: true,
        isMobile: false
      })
    );

    assert.ok(
      html.includes('max-w-7xl') && html.includes('mx-auto'),
      'Desktop bottom bar must contain max-w-7xl mx-auto container for unified page alignment'
    );
    assert.ok(
      html.includes('w-full'),
      'Desktop bottom bar must dock across workspace width with w-full'
    );
  });

  await t.test('3.7: Mobile player bar docks with unified full width across views', () => {
    const html = renderToString(
      React.createElement(GlobalPodcastCapsule, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 45,
        duration: 300,
        isPlaying: false,
        isMobile: true
      })
    );

    assert.ok(
      html.includes('w-full') && html.includes('border-t'),
      'Mobile player bar must feature full-width docking with border-t'
    );
  });

  await t.test('3.8: On bookshelf homepage, play button cluster removes time indicator below play button', () => {
    const htmlBookshelf = renderToString(
      React.createElement(GlobalPodcastCapsule, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 45,
        duration: 300,
        isPlaying: true,
        isMobile: false,
        currentView: 'bookshelf',
        onPlayPause: () => {}
      })
    );

    // On bookshelf view, the sub-text time indicator below play button must be eliminated
    assert.ok(
      !htmlBookshelf.includes('00:45</span><span class="text-stone-300">/</span><span>05:00'),
      'Homepage center play cluster must eliminate redundant time indicator below play button'
    );
  });

  await t.test('3.9: Mobile capsule maintains uniform height without redundant pb-safe on analytics page', () => {
    const htmlAnalytics = renderToString(
      React.createElement(GlobalPodcastCapsule, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 45,
        duration: 300,
        isPlaying: true,
        isMobile: true,
        currentView: 'analytics',
        onPlayPause: () => {}
      })
    );

    // Mobile capsule must not include pb-safe to prevent excessive height stacking above MobileBottomNav
    assert.ok(
      !htmlAnalytics.includes('pb-safe'),
      'Mobile capsule must not apply pb-safe on analytics view to maintain uniform height with other pages'
    );
  });
});


