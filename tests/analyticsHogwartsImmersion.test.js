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
    .replace(/from '(\.\/|\.\.\/)common\/([^'\.]+)(\.jsx?)?'/g, "from './$2.compiled.js'")
    .replace(/from '(\.\/|\.\.\/)analytics\/([^'\.]+)(\.jsx?)?'/g, "from './$2.compiled.js'");
  const transformed = esbuild.transformSync(code, { loader: 'jsx', format: 'esm' });
  const fullOut = path.resolve(__dirname, outRelPath);
  fs.writeFileSync(fullOut, transformed.code, 'utf8');
}

test('Hogwarts Immersion: House Hourglasses & O.W.L.s Certificate Test Suite', async (t) => {
  // 1. WaxSealBadge needed by components
  compileJsx('src/components/common/WaxSealBadge.jsx', 'WaxSealBadge.compiled.js');

  const mockSummary = {
    totalListeningSeconds: 7200, // 120 mins = 120 pts
    completedChaptersCount: 3,   // 3 * 50 = 150 pts
    streakDays: 7,               // 7 * 20 = 140 pts
    dictationAvgAccuracy: 95
  };

  // 2. Compile OwlsCertificateModal
  compileJsx('src/components/analytics/OwlsCertificateModal.jsx', 'OwlsCertificateModal.compiled.js');
  const { OwlsCertificateModal } = await import('./OwlsCertificateModal.compiled.js');

  await t.test('5.2: OwlsCertificateModal renders official O.W.L.s report with Dumbledore quote and zero emojis', () => {
    const html = renderToString(
      React.createElement(OwlsCertificateModal, {
        isOpen: true,
        onClose: () => {},
        userHouse: 'gryffindor',
        summary: mockSummary,
        vocabCount: 42
      })
    );

    // Hogwarts certificate elements
    assert.ok(html.includes('O.W.L.s') || html.includes('巫师等级考试'), 'Must mention O.W.L.s');
    assert.ok(html.includes('阿不思·邓布利多') || html.includes('Dumbledore'), 'Must include Dumbledore signature');
    assert.ok(html.includes('42') || html.includes('词'), 'Must render student stats');
    assert.ok(html.includes('wax-seal') || html.includes('svg'), 'Must render wax seal badge');

    // Apple HIG Mobile Bottom Sheet layout check
    assert.ok(html.includes('items-end'), 'Must use items-end on mobile for upward sliding sheet');
    assert.ok(html.includes('rounded-t-3xl'), 'Must use rounded-t-3xl on mobile for sheet top curves');
    assert.ok(html.includes('w-10 h-1.5') || html.includes('pull-handle'), 'Must include mobile drag/pull handle indicator');

    // Export Image and Actions check
    assert.ok(html.includes('导出荣誉长图') || html.includes('保存证书长图') || html.includes('导出长图'), 'Must render image export button');
    assert.ok(html.includes('复制喜报'), 'Must render copy report button');

    // Zero emojis check
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    assert.ok(!emojiRegex.test(html), 'Must have strictly zero emojis');
  });

  // 4. Compile AnalyticsDashboard
  compileJsx('src/components/AnalyticsDashboard.jsx', 'AnalyticsDashboard.compiled.js');
  const { AnalyticsDashboard } = await import('./AnalyticsDashboard.compiled.js');

  await t.test('5.3: AnalyticsDashboard renders responsive Owls honor button avoiding mobile truncation', () => {
    const html = renderToString(
      React.createElement(AnalyticsDashboard, {
        isOpen: true,
        onClose: () => {},
        userHouse: 'gryffindor',
        vocabCount: 42
      })
    );

    assert.ok(html.includes('霍格沃茨学业数据罗盘'), 'Must render compass title');
    assert.ok(html.includes('hidden sm:inline') && html.includes('学业喜报 (O.W.L.s 证书)'), 'Must render full label on desktop');
    assert.ok(html.includes('sm:hidden') && html.includes('学业喜报'), 'Must render short label on mobile');
  });

  t.after(() => {
    try {
      ['WaxSealBadge.compiled.js', 'OwlsCertificateModal.compiled.js', 'AnalyticsDashboard.compiled.js'].forEach(f => {
        const full = path.resolve(__dirname, f);
        if (fs.existsSync(full)) fs.unlinkSync(full);
      });
    } catch {}
  });
});
