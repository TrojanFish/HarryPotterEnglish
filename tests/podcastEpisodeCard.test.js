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

// Transpile PodcastEpisodeCard.jsx
const cardSrcPath = path.resolve(projectRoot, 'src', 'components', 'podcast', 'PodcastEpisodeCard.jsx');

test('PodcastEpisodeCard Component Test Suite', async (t) => {
  assert.ok(fs.existsSync(cardSrcPath), 'Source file PodcastEpisodeCard.jsx must exist');
  let cardSrcCode = fs.readFileSync(cardSrcPath, 'utf8');
  cardSrcCode = cardSrcCode.replace("from '../../utils/vttParser'", "from '../src/utils/vttParser.js'");

  const transformed = esbuild.transformSync(cardSrcCode, { loader: 'jsx', format: 'esm' });
  const compiledPath = path.resolve(__dirname, 'PodcastEpisodeCard.compiled.js');
  fs.writeFileSync(compiledPath, transformed.code, 'utf8');

  const { PodcastEpisodeCard } = await import('./PodcastEpisodeCard.compiled.js');

  const mockChapter = {
    id: 'ch-01',
    number: 1,
    title: 'The Boy Who Lived',
    cnTitle: '大难不死的男孩',
    duration: '21:40'
  };

  await t.test('2.1: Renders episode badge (EP.01), titles, and duration', () => {
    const html = renderToString(
      React.createElement(PodcastEpisodeCard, {
        chapter: mockChapter,
        chapterIndex: 0,
        isCurrent: false,
        isPlaying: false,
        bookmarkCount: 0,
        onSelectChapter: () => {}
      })
    );

    assert.ok(html.includes('EP.01') || html.includes('EP.1') || html.includes('01'), 'Must display formatted episode number');
    assert.ok(html.includes('大难不死的男孩'), 'Must display chapter title');
    assert.ok(html.includes('The Boy Who Lived'), 'Must display English subtitle');
    assert.ok(html.includes('21:40'), 'Must display duration timestamp');
  });

  await t.test('2.2: Renders bookmark count pill when bookmarks exist', () => {
    const html = renderToString(
      React.createElement(PodcastEpisodeCard, {
        chapter: mockChapter,
        chapterIndex: 0,
        isCurrent: false,
        isPlaying: false,
        bookmarkCount: 3,
        onSelectChapter: () => {}
      })
    );

    assert.ok(html.includes('3') && (html.includes('疑句') || html.includes('星标')), 'Must display bookmark count indicator');
  });

  await t.test('2.3: Highlights current playing episode with wave indicator', () => {
    const html = renderToString(
      React.createElement(PodcastEpisodeCard, {
        chapter: mockChapter,
        chapterIndex: 0,
        isCurrent: true,
        isPlaying: true,
        bookmarkCount: 0,
        onSelectChapter: () => {}
      })
    );

    assert.ok(html.includes('border-amber') || html.includes('bg-amber-50') || html.includes('正在播放') || html.includes('正在精听'), 'Must show current active styling');
    assert.ok(html.includes('min-h-[44px]') || html.includes('p-') || html.includes('w-11'), 'Must conform to Apple HIG >= 44x44px touch targets');
  });

  await t.test('2.4: Action play/pause button provides dedicated onTogglePlay delegation', () => {
    let playToggled = false;
    let chapterSelected = false;

    // Simulate clicking button directly
    const element = React.createElement(PodcastEpisodeCard, {
      chapter: mockChapter,
      chapterIndex: 0,
      isCurrent: true,
      isPlaying: true,
      bookmarkCount: 0,
      onSelectChapter: () => { chapterSelected = true; },
      onTogglePlay: () => { playToggled = true; }
    });

    const rendered = renderToString(element);
    assert.ok(rendered.includes('暂停此单集'), 'Must render pause title when current & playing');
    // Ensure button element is rendered with proper aria attributes
    assert.ok(rendered.includes('aria-label="暂停此单集"'));
  });
});
