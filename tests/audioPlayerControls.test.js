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

  await t.test('2.1: Renders 15-second skip backward and forward buttons', () => {
    const html = renderToString(
      React.createElement(AudioPlayer, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 30,
        duration: 300,
        isPlaying: true,
        playbackRate: 1.0,
        onSeekRelative: () => {}
      })
    );

    assert.ok(html.includes('快退 15 秒') || html.includes('15秒'), 'Must contain 15s skip backward button');
    assert.ok(html.includes('快进 15 秒') || html.includes('15秒'), 'Must contain 15s skip forward button');
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
  });
});
