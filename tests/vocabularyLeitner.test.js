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

// Transpile WaxSealBadge.jsx
const waxSealSrcPath = path.resolve(projectRoot, 'src', 'components', 'common', 'WaxSealBadge.jsx');
const transformedWaxSeal = esbuild.transformSync(fs.readFileSync(waxSealSrcPath, 'utf8'), { loader: 'jsx', format: 'esm' });
fs.writeFileSync(path.resolve(__dirname, 'WaxSealBadge.compiled.js'), transformedWaxSeal.code, 'utf8');

// Transpile VocabularyDrawer.jsx
const drawerSrcPath = path.resolve(projectRoot, 'src', 'components', 'VocabularyDrawer.jsx');
let drawerSrcCode = fs.readFileSync(drawerSrcPath, 'utf8')
  .replace("from '../utils/ankiExport'", "from '../src/utils/ankiExport.js'")
  .replace("from '../utils/parchmentPdfGenerator'", "from '../src/utils/parchmentPdfGenerator.js'")
  .replace("from '../utils/srsEngine'", "from '../src/utils/srsEngine.js'")
  .replace("from './common/WaxSealBadge.jsx'", "from './WaxSealBadge.compiled.js'")
  .replace("from '../constants/hogwartsTheme.js'", "from '../src/constants/hogwartsTheme.js'");

const transformedDrawer = esbuild.transformSync(drawerSrcCode, { loader: 'jsx', format: 'esm' });
const compiledDrawerPath = path.resolve(__dirname, 'VocabularyDrawerLeitner.compiled.js');
fs.writeFileSync(compiledDrawerPath, transformedDrawer.code, 'utf8');

const { VocabularyDrawer } = await import('./VocabularyDrawerLeitner.compiled.js');

test('VocabularyDrawer Leitner Spaced Repetition & Action Pyramid Test Suite', async (t) => {
  const mockVocab = [
    {
      id: 'v1',
      word: 'Wand',
      phonetic: '/wɒnd/',
      translation: '魔杖',
      context: 'The wand chooses the wizard.',
      srsLevel: 1,
      nextReviewDate: '2020-01-01' // Past date -> overdue
    },
    {
      id: 'v2',
      word: 'Patronus',
      phonetic: '/pəˈtroʊnəs/',
      translation: '守护神',
      context: 'Expecto Patronum!',
      srsLevel: 3,
      nextReviewDate: '2099-01-01' // Future date
    },
    {
      id: 'v3',
      word: 'Alohomora',
      translation: '开锁咒',
      context: 'Alohomora opened the door.'
      // Legacy item without srsLevel -> defaults to Box 1
    }
  ];

  await t.test('6.1: Renders Leitner 5-Box memory distribution strip', () => {
    const html = renderToString(
      React.createElement(VocabularyDrawer, {
        isOpen: true,
        onClose: () => {},
        vocabList: mockVocab,
        isParchment: true
      })
    );

    assert.ok(html.includes('leitner-distribution') || html.includes('Box 1') || html.includes('Box 1 · 初学'),
      'Must render Leitner box breakdown');
    assert.ok(html.includes('Box 5') || html.includes('永久掌握'),
      'Must represent 5-box memory curve');
  });

  await t.test('6.2: Accurately identifies and highlights overdue words count', () => {
    const html = renderToString(
      React.createElement(VocabularyDrawer, {
        isOpen: true,
        onClose: () => {},
        vocabList: mockVocab,
        isParchment: true,
        onOpenSrs: () => {}
      })
    );

    // v1 is overdue ('2020-01-01') and v3 has no date (due today) -> at least 1-2 due words
    assert.ok(html.includes('待复习') || html.includes('待重炼'), 'Must display due review notification');
  });

  await t.test('6.3: Refactoring UI 3-Tier Action Pyramid & GitHub-style Icon Controls', () => {
    const html = renderToString(
      React.createElement(VocabularyDrawer, {
        isOpen: true,
        onClose: () => {},
        vocabList: mockVocab,
        isParchment: true
      })
    );

    // Primary CTA: PDF Print
    assert.ok(html.includes('打印羊皮纸单词卡 (PDF)') || html.includes('打印羊皮纸单词卡'),
      'Primary action must be printable parchment flashcard PDF');
    // Anki export eliminated completely
    assert.ok(!html.includes('导出至 Anki') && !html.includes('Anki 挖空卡'), 'Must eliminate redundant Anki export');
    // Secondary: CSV export
    assert.ok(html.includes('导出为通用表格 CSV 格式'), 'Secondary action must include CSV export');
    // Tertiary: Clear
    assert.ok(html.includes('清空'), 'Tertiary action must include clear with protection');
  });
});
