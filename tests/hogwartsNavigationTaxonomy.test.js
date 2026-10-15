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

function compileJsx(srcRelPath, outRelPath) {
  const fullSrc = path.resolve(projectRoot, srcRelPath);
  let code = fs.readFileSync(fullSrc, 'utf8')
    .replace(/from '(\.\.\/)+utils\/([^'\.]+)(\.js)?'/g, "from '../src/utils/$2.js'")
    .replace(/from '(\.\.\/)+data\/([^'\.]+)(\.js)?'/g, "from '../src/data/$2.js'")
    .replace(/from '(\.\.\/)+constants\/([^'\.]+)(\.js)?'/g, "from '../src/constants/$2.js'")
    .replace(/from '(\.\/|\.\.\/)common\/([^'\.]+)(\.jsx?)?'/g, "from './$2.compiled.js'")
    .replace("from './PodcastLyricsStream'", "from './PodcastLyricsStream.compiled.js'");
  const transformed = esbuild.transformSync(code, { loader: 'jsx', format: 'esm' });
  const fullOut = path.resolve(__dirname, outRelPath);
  fs.writeFileSync(fullOut, transformed.code, 'utf8');
}

test('Hogwarts Navigation & View Taxonomy Test Suite', async (t) => {
  // 0. GoldenSnitchScrubber
  compileJsx('src/components/common/GoldenSnitchScrubber.jsx', 'GoldenSnitchScrubber.compiled.js');

  // 1. MobileBottomNav
  compileJsx('src/components/navigation/MobileBottomNav.jsx', 'MobileBottomNav.hogwarts.compiled.js');
  const { MobileBottomNav } = await import('./MobileBottomNav.hogwarts.compiled.js');

  await t.test('2.1: MobileBottomNav tabs adopt Hogwarts canonical names', () => {
    const html = renderToString(
      React.createElement(MobileBottomNav, {
        currentView: 'bookshelf',
        onSwitchView: () => {}
      })
    );

    assert.ok(html.includes('图书馆'), 'Must render 图书馆 tab');
    assert.ok(html.includes('魔咒精研') || html.includes('精研'), 'Must render 魔咒精研 tab');
    assert.ok(html.includes('魔法宝典') || html.includes('宝典'), 'Must render 魔法宝典 tab');
    assert.ok(html.includes('巫师档案') || html.includes('档案'), 'Must render 巫师档案 tab');
  });

  // 2. ReaderTopBar
  compileJsx('src/components/navigation/ReaderTopBar.jsx', 'ReaderTopBar.hogwarts.compiled.js');
  const { ReaderTopBar } = await import('./ReaderTopBar.hogwarts.compiled.js');

  await t.test('2.2: ReaderTopBar adopts Hogwarts back to library and wand gesture titles', () => {
    const html = renderToString(
      React.createElement(ReaderTopBar, {
        currentBook: { id: 'b1', title: 'Philosopher Stone' },
        currentChapter: { id: 'c1', title: 'Chapter 1' },
        onOpenShortcuts: () => {},
        onBackToShelf: () => {}
      })
    );

    assert.ok(html.includes('图书馆'), 'Back button title should mention 图书馆');
    assert.ok(html.includes('魔杖') || html.includes('手势'), 'Shortcuts button title should mention 魔杖手势');
  });

  // 3. PodcastPlayerView
  compileJsx('src/components/podcast/PodcastLyricsStream.jsx', 'PodcastLyricsStream.compiled.js');
  compileJsx('src/components/podcast/PodcastPlayerView.jsx', 'PodcastPlayerView.hogwarts.compiled.js');
  const { PodcastPlayerView } = await import('./PodcastPlayerView.hogwarts.compiled.js');

  await t.test('2.3: PodcastPlayerView sleep timer displays 安眠魔药 title', () => {
    const html = renderToString(
      React.createElement(PodcastPlayerView, {
        currentBook: { id: 'b1', title: 'Philosopher Stone', cnTitle: '魔法石' },
        currentChapter: { id: 'c1', title: 'Ch 1', cnTitle: '第1章' },
        sleepTimerMode: 15,
        sleepTimerRemaining: '14:20',
        onToggleSleepTimer: () => {}
      })
    );

    assert.ok(html.includes('安眠魔药') || html.includes('魔药'), 'Sleep timer title must mention 安眠魔药');
  });

  t.after(() => {
    try {
      [
        'MobileBottomNav.hogwarts.compiled.js',
        'ReaderTopBar.hogwarts.compiled.js',
        'PodcastPlayerView.hogwarts.compiled.js'
      ].forEach(f => {
        const full = path.resolve(__dirname, f);
        if (fs.existsSync(full)) fs.unlinkSync(full);
      });
    } catch {}
  });
});
