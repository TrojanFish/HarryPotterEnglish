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

// Transpile ReaderTopBar.jsx
const barSrcPath = path.resolve(projectRoot, 'src', 'components', 'navigation', 'ReaderTopBar.jsx');

test('ReaderTopBar Dual-Engine Mode Switcher Test Suite', async (t) => {
  assert.ok(fs.existsSync(barSrcPath), 'ReaderTopBar.jsx must exist');
  let barSrcCode = fs.readFileSync(barSrcPath, 'utf8');
  barSrcCode = barSrcCode.replace("from '../../utils/vttParser'", "from '../src/utils/vttParser.js'");

  const transformed = esbuild.transformSync(barSrcCode, { loader: 'jsx', format: 'esm' });
  const compiledPath = path.resolve(__dirname, 'ReaderTopBar.compiled.js');
  fs.writeFileSync(compiledPath, transformed.code, 'utf8');

  const { ReaderTopBar } = await import('./ReaderTopBar.compiled.js');

  const mockBook = { id: 'book1', title: 'Philosopher Stone', cnTitle: '哈利·波特' };
  const mockChapter = { id: 'c1', title: 'The Boy Who Lived', cnTitle: '第1章' };

  await t.test('3.1: Renders Dual-Engine mode switcher (随行播客 vs 精研工坊)', () => {
    const html = renderToString(
      React.createElement(ReaderTopBar, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        playerMode: 'podcast',
        onSwitchPlayerMode: () => {},
        studyMode: 'normal',
        setStudyMode: () => {}
      })
    );

    assert.ok(html.includes('随行播客') || html.includes('播客模式'), 'Must include 随行播客 mode option');
    assert.ok(html.includes('精研工坊') || html.includes('精研模式'), 'Must include 精研工坊 mode option');
  });

  await t.test('3.2: Highlights active mode correctly', () => {
    const htmlPodcast = renderToString(
      React.createElement(ReaderTopBar, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        playerMode: 'podcast',
        onSwitchPlayerMode: () => {}
      })
    );

    const htmlStudio = renderToString(
      React.createElement(ReaderTopBar, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        playerMode: 'studio',
        onSwitchPlayerMode: () => {}
      })
    );

    assert.ok(htmlPodcast.includes('bg-amber-500 text-white') || htmlPodcast.includes('text-white'), 'Podcast mode should have active highlighted style');
    assert.ok(htmlStudio.includes('bg-amber-500 text-white') || htmlStudio.includes('text-white'), 'Studio mode should have active highlighted style');
  });
});
