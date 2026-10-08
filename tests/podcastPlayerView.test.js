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

// Transpile PodcastPlayerView.jsx
const viewSrcPath = path.resolve(projectRoot, 'src', 'components', 'podcast', 'PodcastPlayerView.jsx');

test('PodcastPlayerView Test Suite', async (t) => {
  // Transpile GoldenSnitchScrubber.jsx
  const snitchPath = path.resolve(projectRoot, 'src', 'components', 'common', 'GoldenSnitchScrubber.jsx');
  const transformedSnitch = esbuild.transformSync(fs.readFileSync(snitchPath, 'utf8'), { loader: 'jsx', format: 'esm' });
  fs.writeFileSync(path.resolve(__dirname, 'GoldenSnitchScrubber.compiled.js'), transformedSnitch.code, 'utf8');

  let viewSrcCode = fs.readFileSync(viewSrcPath, 'utf8');
  viewSrcCode = viewSrcCode
    .replace("from '../../utils/vttParser'", "from '../src/utils/vttParser.js'")
    .replace("from '../../utils/magicalSound.js'", "from '../src/utils/magicalSound.js'")
    .replace("from './PodcastLyricsStream'", "from './PodcastLyricsStream.compiled.js'")
    .replace("from '../common/GoldenSnitchScrubber.jsx'", "from './GoldenSnitchScrubber.compiled.js'");

  const transformed = esbuild.transformSync(viewSrcCode, { loader: 'jsx', format: 'esm' });
  const compiledPath = path.resolve(__dirname, 'PodcastPlayerView.compiled.js');
  fs.writeFileSync(compiledPath, transformed.code, 'utf8');

  const { PodcastPlayerView } = await import('./PodcastPlayerView.compiled.js');

  const mockBook = { id: 'book1', title: 'Philosopher Stone', cnTitle: '哈利·波特与魔法石' };
  const mockChapter = { id: 'c1', title: 'The Boy Who Lived', cnTitle: '大难不死的男孩' };
  const mockCues = [
    { id: 'cue-1', start: 0, end: 5, text: 'Mr and Mrs Dursley were proud.', translation: '德思礼夫妇很自豪。' },
    { id: 'cue-2', start: 5, end: 10, text: 'They were perfectly normal.', translation: '他们非常规矩。' }
  ];

  await t.test('2.1: Renders cover, chapter title, and book information', () => {
    const html = renderToString(
      React.createElement(PodcastPlayerView, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        cues: mockCues,
        activeCueIndex: 0,
        currentTime: 25,
        duration: 300,
        isPlaying: true,
        playbackRate: 1.0,
        onPlayPause: () => {},
        onSeekRelative: () => {},
        onSwitchToStudio: () => {}
      })
    );

    assert.ok(html.includes('大难不死的男孩'), 'Must display chapter title');
    assert.ok(html.includes('哈利·波特与魔法石'), 'Must display book title');
    assert.ok(html.includes('cover.jpg') || html.includes('Cover'), 'Must render album cover art container');
  });

  await t.test('2.2: Renders transport controls (Sentence Nav, Play/Pause, Sleep Timer)', () => {
    const html = renderToString(
      React.createElement(PodcastPlayerView, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        cues: mockCues,
        activeCueIndex: 0,
        currentTime: 25,
        duration: 300,
        isPlaying: false,
        playbackRate: 1.25,
        sleepTimerMode: 15,
        sleepTimerRemaining: '14:20',
        onPlayPause: () => {},
        onPrevSentence: () => {},
        onNextSentence: () => {},
        onSwitchToStudio: () => {}
      })
    );

    assert.ok(html.includes('上一句'), 'Must have 上一句 button');
    assert.ok(html.includes('下一句'), 'Must have 下一句 button');
    assert.ok(html.includes('快退 15 秒') || html.includes('快退'), 'Podcast mode must have 15s skip backward');
    assert.ok(html.includes('快进 15 秒') || html.includes('快进'), 'Podcast mode must have 15s skip forward');
    assert.ok(html.includes('14:20') || html.includes('定时'), 'Must display active sleep timer indicator');
    assert.ok(html.includes('1.25x') || html.includes('1.25'), 'Must display current playback speed');
  });

  await t.test('2.3: Renders flowing lyrics stream without redundant studio buttons (centralized in TopBar)', () => {
    const html = renderToString(
      React.createElement(PodcastPlayerView, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        cues: mockCues,
        activeCueIndex: 1,
        currentTime: 7,
        duration: 300,
        isPlaying: true,
        onPlayPause: () => {}
      })
    );

    assert.ok(!html.includes('进入精研'), 'Must not render redundant studio button inside player body');
    assert.ok(html.includes('Mr and Mrs Dursley'), 'Must render embedded lyrics stream');
  });

  await t.test('2.4: Anchored unified bottom console rendered persistently with full transport controls (eliminates duplicate translation toggle)', () => {
    const html = renderToString(
      React.createElement(PodcastPlayerView, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        cues: mockCues,
        activeCueIndex: 0,
        currentTime: 25,
        duration: 300,
        isPlaying: false,
        playbackRate: 1.0,
        showTranslation: true,
        sleepTimerMode: 15,
        sleepTimerRemaining: '14:20',
        onPlayPause: () => {},
        onPrevSentence: () => {},
        onNextSentence: () => {},
        onToggleSleepTimer: () => {},
        onChangePlaybackRate: () => {}
      })
    );

    // Dedicated anchored bottom console must be present
    assert.ok(html.includes('podcast-anchored-console'), 'Must render dedicated anchored bottom console');
    assert.ok(!html.includes('aria-label="中英双语切换"'), 'Anchored console eliminates duplicate translation toggle (centralized in ReaderTopBar)');
    assert.ok(html.includes('播放倍速') || html.includes('1.0x'), 'Anchored console must provide speed cycle');
    assert.ok(html.includes('上一句') && html.includes('下一句'), 'Anchored console must provide sentence navigation');
    assert.ok(html.includes('w-[88px]'), 'Mobile sleep timer button must have fixed width w-[88px] to prevent layout jitter');
    assert.ok(html.includes('justify-between') && html.includes('max-w-sm'), 'Mobile thumb cluster must have balanced proportional spacing across thumb zone');
  });
});
