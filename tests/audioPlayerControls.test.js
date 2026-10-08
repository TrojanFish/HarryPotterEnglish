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

// Transpile AudioPlayer.jsx
const playerSrcPath = path.resolve(projectRoot, 'src', 'components', 'AudioPlayer.jsx');
let playerSrcCode = fs.readFileSync(playerSrcPath, 'utf8');
playerSrcCode = playerSrcCode
  .replace("from '../utils/vttParser'", "from '../src/utils/vttParser.js'")
  .replace("from '../utils/spellAudioSynthesizer'", "from './mockSynthesizer.js'");

// Create mock synthesizer if needed
const mockSynthPath = path.resolve(__dirname, 'mockSynthesizer.js');
fs.writeFileSync(mockSynthPath, 'export function playCorrectChime() {}', 'utf8');

const transformedPlayer = esbuild.transformSync(playerSrcCode, { loader: 'jsx', format: 'esm' });
const compiledPlayerPath = path.resolve(__dirname, 'AudioPlayer.compiled.js');
fs.writeFileSync(compiledPlayerPath, transformedPlayer.code, 'utf8');

const { AudioPlayer } = await import('./AudioPlayer.compiled.js');

test('AudioPlayer Podcast Controls Test Suite', async (t) => {
  const mockBook = { id: 'book1', title: 'HP 1', cnTitle: '哈利·波特' };
  const mockChapter = { id: 'c1', title: 'Ch 1', cnTitle: '大难不死的男孩' };

  await t.test('2.1: Renders sentence navigation buttons (上一句 / 下一句) with streamlined transport', () => {
    const html = renderToString(
      React.createElement(AudioPlayer, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 30,
        duration: 300,
        isPlaying: true,
        playbackRate: 1.0,
        activeCueIndex: 1,
        totalCues: 10,
        onPrevSentence: () => {},
        onNextSentence: () => {}
      })
    );

    assert.ok(html.includes('上一句'), 'Must contain 上一句 navigation button');
    assert.ok(html.includes('下一句'), 'Must contain 下一句 navigation button');
    assert.ok(!html.includes('快退 15 秒'), 'Must not contain 15s skip backward button');
    assert.ok(!html.includes('快进 15 秒'), 'Must not contain 15s skip forward button');
  });

  await t.test('2.2: Renders Sleep Timer button', () => {
    const html = renderToString(
      React.createElement(AudioPlayer, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 30,
        duration: 300,
        isPlaying: true,
        sleepTimerMode: 15,
        sleepTimerRemaining: '14:59'
      })
    );

    assert.ok(html.includes('睡眠定时') || html.includes('定时'), 'Must contain sleep timer button');
    assert.ok(html.includes('w-11 h-11') && html.includes('min-w-[44px]'), 'Sleep timer must adhere to strict 44x44px button footprint');
    assert.ok(html.includes('14:59'), 'Must render countdown string inside 44x44px button');
  });

  await t.test('2.3: Mobile controls layer renders symmetrical 5-button cluster (Loop, Prev, Play, Next, Speed)', () => {
    const html = renderToString(
      React.createElement(AudioPlayer, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 30,
        duration: 300,
        isPlaying: true,
        playbackRate: 1.0,
        activeCueIndex: 1,
        totalCues: 10,
        isLoopSentence: true,
        onPrevSentence: () => {},
        onNextSentence: () => {},
        onToggleLoopSentence: () => {},
        onPlayPause: () => {},
        onChangePlaybackRate: () => {}
      })
    );

    // Mobile layer should contain single-sentence loop, prev, play/pause, next, and speed controls
    const mobileClusterMatch = html.match(/<div class="[^"]*flex sm:hidden items-center[^"]*"[^>]*>([\s\S]*?)<div class="[^"]*hidden sm:flex/);
    assert.ok(mobileClusterMatch, 'Must find mobile thumb zone cluster');
    assert.ok(mobileClusterMatch[0].includes('justify-between'), 'Mobile cluster must use justify-between for proportional thumb spacing');
    assert.ok(mobileClusterMatch[0].includes('max-w-sm'), 'Mobile cluster must constrain max width to thumb zone');
    const mobileClusterHtml = mobileClusterMatch[1];
    assert.ok(mobileClusterHtml.includes('单句循环'), 'Mobile thumb cluster must include single-sentence loop button');
    assert.ok(mobileClusterHtml.includes('上一句'), 'Mobile thumb cluster must include previous sentence button');
    assert.ok(mobileClusterHtml.includes('播放或暂停'), 'Mobile thumb cluster must include play/pause CTA');
    assert.ok(mobileClusterHtml.includes('下一句'), 'Mobile thumb cluster must include next sentence button');
    assert.ok(mobileClusterHtml.includes('播放倍速') || mobileClusterHtml.includes('1.0x'), 'Mobile thumb cluster must include speed cycle button');
  });

  await t.test('2.4: Desktop transport controls are geometrically centered using absolute center anchoring', () => {
    const html = renderToString(
      React.createElement(AudioPlayer, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 30,
        duration: 300,
        isPlaying: true,
        playbackRate: 1.0,
        activeCueIndex: 1,
        totalCues: 10,
        onPrevSentence: () => {},
        onNextSentence: () => {}
      })
    );

    // Desktop controls row must use absolute center positioning for the transport cluster
    assert.ok(
      html.includes('absolute left-1/2 -translate-x-1/2'),
      'Desktop controls cluster must be anchored with absolute left-1/2 -translate-x-1/2 to guarantee true screen centering'
    );
  });
});

