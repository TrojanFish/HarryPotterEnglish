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
  let drawerSrcCode = fs.readFileSync(drawerSrcPath, 'utf8');
  drawerSrcCode = drawerSrcCode
    .replace("from '../utils/parchmentPdfGenerator'", "from '../src/utils/parchmentPdfGenerator.js'")
    .replace("from '../utils/vttParser'", "from '../src/utils/vttParser.js'");

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
});
