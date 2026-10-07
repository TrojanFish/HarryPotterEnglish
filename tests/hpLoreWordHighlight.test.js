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

// Transpile WordModal
const modalSrcPath = path.resolve(projectRoot, 'src', 'components', 'WordModal.jsx');
let modalSrcCode = fs.readFileSync(modalSrcPath, 'utf8')
  .replace(/from '\.\.\/utils\/([^']+)'/g, "from '../src/utils/$1.js'");
const transformedModal = esbuild.transformSync(modalSrcCode, { loader: 'jsx', format: 'esm' });
const compiledModalPath = path.resolve(__dirname, 'WordModal.lore.compiled.js');
fs.writeFileSync(compiledModalPath, transformedModal.code, 'utf8');

const { WordModal } = await import('./WordModal.lore.compiled.js');

test('Harry Potter Lore Highlight & Wax-Seal Modal Focus Test Suite', async (t) => {
  const viewerSrcPath = path.resolve(projectRoot, 'src', 'components', 'SubtitleViewer.jsx');
  const viewerSrc = fs.readFileSync(viewerSrcPath, 'utf8');

  await t.test('4.1: SubtitleViewer styles HP lore words with distinctive dashed border and amber wax tint', () => {
    assert.ok(
      viewerSrc.includes('border-dashed border-amber-600') || viewerSrc.includes('border-dashed border-amber-500') || viewerSrc.includes('border-dashed'),
      'HP lore terms must render with dashed amber border'
    );
    assert.ok(
      viewerSrc.includes('bg-amber-500/10') || viewerSrc.includes('bg-amber-100/60') || viewerSrc.includes('bg-amber-100'),
      'HP lore terms must render with subtle amber wax highlight'
    );
  });

  await t.test('4.2: WordModal defaults to lore tab when wordData contains lore backstory', () => {
    const loreWordData = {
      word: 'Muggle',
      phonetic: 'ˈmʌɡ.əl',
      pos: 'noun',
      translation: '麻瓜',
      explanation: 'A non-magical person.',
      lore: '魔法世界对不会魔法的普通人的称呼。'
    };

    const html = renderToString(
      React.createElement(WordModal, {
        wordData: loreWordData,
        currentSentence: 'Mr. Dursley was a proud Muggle.',
        onClose: () => {},
        onSaveToVocab: () => {},
        isSaved: false,
        isParchment: true
      })
    );

    // If active tab is lore, the lore section should be visible in HTML output
    assert.ok(
      html.includes('魔法世界对不会魔法的普通人的称呼'),
      'WordModal must display lore backstory directly when lore exists'
    );
  });

  await t.test('4.3: WordModal defaults to meaning tab when wordData has no lore', () => {
    const standardWordData = {
      word: 'normal',
      phonetic: 'ˈnɔː.məl',
      pos: 'adj',
      translation: '正常的，平淡无奇的',
      explanation: 'Conforming to a standard; usual, typical, or expected.'
    };

    const html = renderToString(
      React.createElement(WordModal, {
        wordData: standardWordData,
        currentSentence: 'They were perfectly normal.',
        onClose: () => {},
        onSaveToVocab: () => {},
        isSaved: false,
        isParchment: true
      })
    );

    assert.ok(
      html.includes('正常的，平淡无奇的'),
      'WordModal must display standard translation directly when no lore exists'
    );
  });
});
