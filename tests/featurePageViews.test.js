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

// Helper to compile JSX
function compileJsx(filePath, outPath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code
    .replace(/\.\.\/utils\//g, '../src/utils/')
    .replace(/\.\.\/data\//g, '../src/data/')
    .replace(/\.\.\/constants\//g, '../src/constants/')
    .replace(/\.\.\/hooks\//g, '../src/hooks/')
    .replace(/'\.\.\/utils\/([^']+)'/g, "'../src/utils/$1.js'")
    .replace(/'\.\.\/data\/([^']+)'/g, "'../src/data/$1.js'")
    .replace(/'\.\.\/constants\/([^']+)'/g, "'../src/constants/$1.js'")
    .replace(/'\.\.\/hooks\/([^']+)'/g, "'../src/hooks/$1.js'")
    .replace(/from '(\.\/|\.\.\/)common\/([^'\.]+)(\.jsx?)?'/g, "from './$2.compiled.js'")
    .replace(/from '(\.\/|\.\.\/)analytics\/([^'\.]+)(\.jsx?)?'/g, "from './$2.compiled.js'");
  // Ensure .js extensions for node ESM
  code = code.replace(/from '(\.\.\/src\/[^']+)'/g, (match, p1) => {
    return p1.endsWith('.js') ? match : `from '${p1}.js'`;
  });
  const transformed = esbuild.transformSync(code, { loader: 'jsx', format: 'esm' });
  fs.writeFileSync(outPath, transformed.code, 'utf8');
}

test('Feature Page Views (isPageView) Test Suite', async (t) => {
  // 0. WaxSealBadge
  const waxSealPath = path.resolve(projectRoot, 'src', 'components', 'common', 'WaxSealBadge.jsx');
  compileJsx(waxSealPath, path.resolve(__dirname, 'WaxSealBadge.compiled.js'));

  // 1. VocabularyDrawer
  const vocabPath = path.resolve(projectRoot, 'src', 'components', 'VocabularyDrawer.jsx');
  const vocabCompiled = path.resolve(__dirname, 'VocabularyDrawer.test.compiled.js');
  compileJsx(vocabPath, vocabCompiled);
  const { VocabularyDrawer } = await import('./VocabularyDrawer.test.compiled.js');

  await t.test('2.1: VocabularyDrawer renders inline page view without dark backdrop when isPageView=true', () => {
    const htmlPage = renderToString(
      React.createElement(VocabularyDrawer, {
        isOpen: true,
        isPageView: true,
        vocabList: [{ word: 'lumos', phonetic: '/ˈluːmɒs/', pos: 'n.', translation: '荧光闪烁', context: 'Lumos!' }]
      })
    );

    assert.ok(!htmlPage.includes('fixed inset-0'), 'Page view mode must not use fixed inset-0 overlay');
    assert.ok(!htmlPage.includes('bg-black/60'), 'Page view mode must not have black backdrop');
    assert.ok(htmlPage.includes('lumos'), 'Must render vocab words');
  });

  await t.test('2.2: VocabularyDrawer preserves drawer modal overlay when isPageView=false', () => {
    const htmlModal = renderToString(
      React.createElement(VocabularyDrawer, {
        isOpen: true,
        isPageView: false,
        vocabList: [{ word: 'lumos', phonetic: '/ˈluːmɒs/', pos: 'n.', translation: '荧光闪烁', context: 'Lumos!' }]
      })
    );

    assert.ok(htmlModal.includes('fixed inset-0'), 'Modal mode must retain fixed inset-0 overlay');
    assert.ok(htmlModal.includes('bg-black/60'), 'Modal mode must retain bg-black/60 backdrop');
  });

  // 2. AnalyticsDashboard
  const analyticsPath = path.resolve(projectRoot, 'src', 'components', 'AnalyticsDashboard.jsx');
  const analyticsCompiled = path.resolve(__dirname, 'AnalyticsDashboard.test.compiled.js');
  compileJsx(analyticsPath, analyticsCompiled);
  const { AnalyticsDashboard } = await import('./AnalyticsDashboard.test.compiled.js');

  await t.test('2.3: AnalyticsDashboard renders inline page view without dark backdrop when isPageView=true', () => {
    const htmlPage = renderToString(
      React.createElement(AnalyticsDashboard, {
        isOpen: true,
        isPageView: true,
        vocabCount: 5
      })
    );

    assert.ok(!htmlPage.includes('fixed inset-0'), 'Page view mode must not use fixed inset-0 overlay');
    assert.ok(!htmlPage.includes('bg-black/75'), 'Page view mode must not have black backdrop');
    assert.ok(htmlPage.includes('学业罗盘') || htmlPage.includes('学情') || htmlPage.includes('罗盘'), 'Must render analytics content');
  });

  // 3. StorageManagerModal
  const storagePath = path.resolve(projectRoot, 'src', 'components', 'StorageManagerModal.jsx');
  const storageCompiled = path.resolve(__dirname, 'StorageManagerModal.test.compiled.js');
  compileJsx(storagePath, storageCompiled);
  const { StorageManagerModal } = await import('./StorageManagerModal.test.compiled.js');

  await t.test('2.4: StorageManagerModal renders inline page view without dark backdrop when isPageView=true', () => {
    const htmlPage = renderToString(
      React.createElement(StorageManagerModal, {
        isOpen: true,
        isPageView: true
      })
    );

    assert.ok(!htmlPage.includes('fixed inset-0'), 'Page view mode must not use fixed inset-0 overlay');
    assert.ok(!htmlPage.includes('bg-black/70'), 'Page view mode must not have black backdrop');
    assert.ok(htmlPage.includes('离线') || htmlPage.includes('行囊'), 'Must render storage content');
  });
});
