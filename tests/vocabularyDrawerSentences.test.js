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

// Transpile VocabularyDrawer.jsx
const drawerSrcPath = path.resolve(projectRoot, 'src', 'components', 'VocabularyDrawer.jsx');

test('VocabularyDrawer Starred Sentences Workshop Test Suite', async (t) => {
  assert.ok(fs.existsSync(drawerSrcPath), 'Source file VocabularyDrawer.jsx must exist');
  // Transpile WaxSealBadge.jsx
  const waxSealSrcPath = path.resolve(projectRoot, 'src', 'components', 'common', 'WaxSealBadge.jsx');
  const transformedWaxSeal = esbuild.transformSync(fs.readFileSync(waxSealSrcPath, 'utf8'), { loader: 'jsx', format: 'esm' });
  fs.writeFileSync(path.resolve(__dirname, 'WaxSealBadge.compiled.js'), transformedWaxSeal.code, 'utf8');

  let drawerSrcCode = fs.readFileSync(drawerSrcPath, 'utf8');
  drawerSrcCode = drawerSrcCode
    .replace("from '../utils/parchmentPdfGenerator'", "from '../src/utils/parchmentPdfGenerator.js'")
    .replace("from '../utils/vttParser'", "from '../src/utils/vttParser.js'")
    .replace("from './common/WaxSealBadge.jsx'", "from './WaxSealBadge.compiled.js'")
    .replace("from '../constants/hogwartsTheme.js'", "from '../src/constants/hogwartsTheme.js'");

  const transformed = esbuild.transformSync(drawerSrcCode, { loader: 'jsx', format: 'esm' });
  const compiledPath = path.resolve(__dirname, 'VocabularyDrawer.compiled.js');
  fs.writeFileSync(compiledPath, transformed.code, 'utf8');

  const { VocabularyDrawer } = await import('./VocabularyDrawer.compiled.js');

  const mockVocab = [
    { word: 'wand', translation: '魔杖', srsBox: 1 }
  ];

  const mockSentences = [
    {
      id: 'bm-1',
      cueId: 'c1',
      text: 'Mr and Mrs Dursley were proud to say that they were perfectly normal.',
      translation: '德思礼夫妇总是得意地说他们是非常规矩的人。',
      chapterId: 'ch-01',
      createdAt: '2026-10-06T00:00:00Z'
    }
  ];

  await t.test('3.1: Renders tab switchers for Words and Starred Sentences', () => {
    const html = renderToString(
      React.createElement(VocabularyDrawer, {
        isOpen: true,
        onClose: () => {},
        vocabList: mockVocab,
        bookmarkedSentences: mockSentences,
        onRemoveWord: () => {},
        onRemoveBookmark: () => {}
      })
    );

    assert.ok(html.includes('生词本') || html.includes('生词'), 'Must render words tab');
    assert.ok(html.includes('疑难句') || html.includes('星标句'), 'Must render starred sentences tab');
  });

  await t.test('3.2: Renders sentence item with translation and action buttons', () => {
    const html = renderToString(
      React.createElement(VocabularyDrawer, {
        isOpen: true,
        initialTab: 'sentences',
        onClose: () => {},
        vocabList: mockVocab,
        bookmarkedSentences: mockSentences,
        onRemoveWord: () => {},
        onRemoveBookmark: () => {}
      })
    );

    assert.ok(html.includes('Mr and Mrs Dursley') || html.includes('德思礼夫妇'), 'Must display bookmarked sentence content');
    assert.ok(html.includes('min-h-[44px]') || html.includes('w-10') || html.includes('w-11') || html.includes('duo-touch-target'), 'Action buttons must respect Apple HIG touch targets');
  });

  await t.test('3.3: Renders jump to original audio button and clear all bookmarks affordance', () => {
    const html = renderToString(
      React.createElement(VocabularyDrawer, {
        isOpen: true,
        initialTab: 'sentences',
        onClose: () => {},
        vocabList: mockVocab,
        bookmarkedSentences: mockSentences,
        onRemoveWord: () => {},
        onRemoveBookmark: () => {},
        onClearAllBookmarks: () => {},
        onPlaySentence: () => {}
      })
    );

    assert.ok(html.includes('回听原著原声') || html.includes('定位播放') || html.includes('原声'), 'Must provide jump to original audio affordance');
    assert.ok(html.includes('清空所有疑难句') || html.includes('清空全部'), 'Must provide clear all bookmarks affordance');
  });
});
