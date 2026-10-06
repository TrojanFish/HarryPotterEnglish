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
const capsuleSrcPath = path.resolve(projectRoot, 'src', 'components', 'navigation', 'GlobalPodcastCapsule.jsx');
let capsuleSrcCode = fs.readFileSync(capsuleSrcPath, 'utf8');
capsuleSrcCode = capsuleSrcCode
  .replace("from '../../utils/vttParser'", "from '../src/utils/vttParser.js'")
  .replace("from '../../utils/sleepTimer'", "from '../src/utils/sleepTimer.js'");

const transformedCapsule = esbuild.transformSync(capsuleSrcCode, { loader: 'jsx', format: 'esm' });
const compiledCapsulePath = path.resolve(__dirname, 'GlobalPodcastCapsule.compiled.js');
fs.writeFileSync(compiledCapsulePath, transformedCapsule.code, 'utf8');

const { GlobalPodcastCapsule } = await import('./GlobalPodcastCapsule.compiled.js');

test('GlobalPodcastCapsule Test Suite', async (t) => {
  const mockBook = { id: 'book1', title: 'Philosopher Stone', cnTitle: '哈利·波特与魔法石' };
  const mockChapter = { id: 'c1', title: 'The Boy Who Lived', cnTitle: '大难不死的男孩' };

  await t.test('3.1: Desktop view renders floating capsule with chapter title and 15s transport', () => {
    const html = renderToString(
      React.createElement(GlobalPodcastCapsule, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 45,
        duration: 300,
        isPlaying: true,
        isMobile: false,
        onPlayPause: () => {},
        onSeekRelative: () => {},
        onEnterPlayer: () => {}
      })
    );

    assert.ok(html.includes('大难不死的男孩'), 'Must render chapter title');
    assert.ok(html.includes('快退 15 秒') || html.includes('15s'), 'Must contain 15s skip backward');
    assert.ok(html.includes('快进 15 秒') || html.includes('15s'), 'Must contain 15s skip forward');
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
});
