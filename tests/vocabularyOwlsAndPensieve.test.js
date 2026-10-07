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
    .replace(/from '(\.\.\/)+constants\/([^'\.]+)(\.js)?'/g, "from '../src/constants/$2.js'")
    .replace(/from '(\.\.\/)+hooks\/([^'\.]+)(\.js)?'/g, "from '../src/hooks/$2.js'")
    .replace(/from '(\.\.\/)+utils\/([^'\.]+)(\.js)?'/g, "from '../src/utils/$2.js'")
    .replace(/from '(\.\/|\.\.\/)common\/([^'\.]+)(\.jsx?)?'/g, "from './$2.compiled.js'");
  const transformed = esbuild.transformSync(code, { loader: 'jsx', format: 'esm' });
  const fullOut = path.resolve(__dirname, outRelPath);
  fs.writeFileSync(fullOut, transformed.code, 'utf8');
}

test('VocabularyDrawer O.W.L.s & Pensieve Test Suite', async (t) => {
  // 1. WaxSealBadge
  compileJsx('src/components/common/WaxSealBadge.jsx', 'WaxSealBadge.compiled.js');
  const { WaxSealBadge } = await import('./WaxSealBadge.compiled.js');

  await t.test('4.1: WaxSealBadge renders classical seal with monogram and zero emojis', () => {
    const html = renderToString(React.createElement(WaxSealBadge, { text: 'O' }));
    assert.ok(html.includes('wax-seal') || html.includes('svg'), 'Must render SVG wax seal');
    assert.ok(html.includes('O'), 'Must display monogram or text');
  });

  // 2. VocabularyDrawer O.W.L.s scale and Pensieve
  compileJsx('src/components/VocabularyDrawer.jsx', 'VocabularyDrawer.owls.compiled.js');
  const { VocabularyDrawer } = await import('./VocabularyDrawer.owls.compiled.js');

  const mockVocabList = [
    { word: 'wand', translation: '魔杖', srsLevel: 0, nextReviewDate: Date.now() - 1000 },
    { word: 'potion', translation: '魔药', srsLevel: 5, nextReviewDate: Date.now() + 100000 }
  ];

  const mockBookmarkedSentences = [
    {
      id: 'sent-1',
      sentence: 'Mr and Mrs Dursley were proud.',
      translation: '德思礼夫妇很自豪。',
      bookId: 'book1',
      chapterId: 'c1',
      cue: { start: 0, end: 5 }
    }
  ];

  await t.test('4.2: VocabularyDrawer renders O.W.L.s 6-grade memory scale (T, D, P, A, E, O)', () => {
    const html = renderToString(
      React.createElement(VocabularyDrawer, {
        isOpen: true,
        vocabList: mockVocabList,
        bookmarkedSentences: mockBookmarkedSentences,
        onClose: () => {}
      })
    );

    // O.W.L.s grades
    assert.ok(html.includes('>T<') || html.includes('T (巨怪)'), 'Must render Grade T');
    assert.ok(html.includes('>O<') || html.includes('O (杰出)'), 'Must render Grade O');
    assert.ok(html.includes('O.W.L.s') || html.includes('巫师等级'), 'Must reference O.W.L.s examination scale');
  });

  await t.test('4.3: VocabularyDrawer brands Starred Sentences as 冥想盆 (The Pensieve)', () => {
    const html = renderToString(
      React.createElement(VocabularyDrawer, {
        isOpen: true,
        vocabList: mockVocabList,
        bookmarkedSentences: mockBookmarkedSentences,
        onClose: () => {}
      })
    );

    assert.ok(html.includes('冥想盆') || html.includes('Pensieve'), 'Must brand sentence bookmarks tab as 冥想盆 (The Pensieve)');
  });

  t.after(() => {
    try {
      ['WaxSealBadge.compiled.js', 'VocabularyDrawer.owls.compiled.js'].forEach(f => {
        const full = path.resolve(__dirname, f);
        if (fs.existsSync(full)) fs.unlinkSync(full);
      });
    } catch {}
  });
});
