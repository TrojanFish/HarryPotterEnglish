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

function compileJsx(filePath, outPath) {
  let code = fs.readFileSync(filePath, 'utf8');
  const transformed = esbuild.transformSync(code, { loader: 'jsx', format: 'esm' });
  fs.writeFileSync(outPath, transformed.code, 'utf8');
}

test('DesktopSidebar & TabletRail Page Views Routing Test Suite', async (t) => {
  // 1. DesktopSidebar
  const sidebarPath = path.resolve(projectRoot, 'src', 'components', 'navigation', 'DesktopSidebar.jsx');
  const sidebarCompiled = path.resolve(__dirname, 'DesktopSidebar.test.compiled.js');
  compileJsx(sidebarPath, sidebarCompiled);
  const { DesktopSidebar } = await import('./DesktopSidebar.test.compiled.js');

  await t.test('3.1: DesktopSidebar highlights vocab item when currentView=vocab', () => {
    const html = renderToString(
      React.createElement(DesktopSidebar, {
        currentView: 'vocab',
        vocabCount: 12
      })
    );
    assert.ok(html.includes('魔法生词本'), 'Must render 魔法生词本');
    assert.ok(html.includes('bg-amber-500 text-white border border-amber-600'), 'Must contain active button class');
    // Verify that the active button wraps 魔法生词本
    const parts = html.split('<button');
    const vocabButton = parts.find(p => p.includes('魔法生词本'));
    assert.ok(vocabButton, 'Vocab button must exist');
    assert.ok(vocabButton.includes('bg-amber-500 text-white border border-amber-600'), 'Vocab button must be active');
  });

  await t.test('3.2: DesktopSidebar highlights analytics item when currentView=analytics', () => {
    const html = renderToString(
      React.createElement(DesktopSidebar, {
        currentView: 'analytics'
      })
    );
    assert.ok(html.includes('学业罗盘'), 'Must render 学业罗盘');
    const parts = html.split('<button');
    const analyticsButton = parts.find(p => p.includes('学业罗盘'));
    assert.ok(analyticsButton, 'Analytics button must exist');
    assert.ok(analyticsButton.includes('bg-amber-500 text-white border border-amber-600'), 'Analytics button must be active');
  });

  await t.test('3.3: DesktopSidebar highlights storage item when currentView=storage', () => {
    const html = renderToString(
      React.createElement(DesktopSidebar, {
        currentView: 'storage',
        cachedChaptersCount: 3
      })
    );
    assert.ok(html.includes('离线管理'), 'Must render 离线管理');
    const parts = html.split('<button');
    const storageButton = parts.find(p => p.includes('离线管理'));
    assert.ok(storageButton, 'Storage button must exist');
    assert.ok(storageButton.includes('bg-amber-500 text-white border border-amber-600'), 'Storage button must be active');
  });

  // 2. TabletRail
  const railPath = path.resolve(projectRoot, 'src', 'components', 'navigation', 'TabletRail.jsx');
  const railCompiled = path.resolve(__dirname, 'TabletRail.test.compiled.js');
  compileJsx(railPath, railCompiled);
  const { TabletRail } = await import('./TabletRail.test.compiled.js');

  await t.test('3.4: TabletRail highlights active item when currentView=vocab or analytics or storage', () => {
    const htmlVocab = renderToString(React.createElement(TabletRail, { currentView: 'vocab' }));
    const htmlAnalytics = renderToString(React.createElement(TabletRail, { currentView: 'analytics' }));
    const htmlStorage = renderToString(React.createElement(TabletRail, { currentView: 'storage' }));

    assert.ok(htmlVocab.includes('bg-amber-500 text-white'), 'TabletRail vocab should be active');
    assert.ok(htmlAnalytics.includes('bg-amber-500 text-white'), 'TabletRail analytics should be active');
    assert.ok(htmlStorage.includes('bg-amber-500 text-white'), 'TabletRail storage should be active');
  });
});
