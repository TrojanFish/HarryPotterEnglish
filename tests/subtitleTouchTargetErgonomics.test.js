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

// Transpile SubtitleViewer.jsx for Node test environment
const viewerSrcPath = path.resolve(projectRoot, 'src', 'components', 'SubtitleViewer.jsx');
let viewerSrcCode = fs.readFileSync(viewerSrcPath, 'utf8');
viewerSrcCode = viewerSrcCode
  .replace(/from '(\.\.\/)+utils\/([^']+)'/g, "from '../src/utils/$2.js'")
  .replace(/from '(\.\.\/)+data\/([^']+)'/g, "from '../src/data/$2.js'");

const transformedViewer = esbuild.transformSync(viewerSrcCode, { loader: 'jsx', format: 'esm' });
const compiledViewerPath = path.resolve(__dirname, 'SubtitleViewer.touch.compiled.js');
fs.writeFileSync(compiledViewerPath, transformedViewer.code, 'utf8');

const { SubtitleViewer } = await import('./SubtitleViewer.touch.compiled.js');

test('SubtitleViewer Word Token Touch Target Ergonomics Test Suite', async (t) => {
  const mockCues = [
    {
      id: 'cue-0',
      startTime: 1.0,
      endTime: 5.5,
      text: 'Mr. and Mrs. Dursley were proud to say that they were normal.',
      translation: '德思礼夫妇总是得意地宣称，他们是非常规矩的正常人家。'
    }
  ];

  await t.test('1.1: Word tokens must include touch-manipulation and touch hit expansion classes', () => {
    const html = renderToString(
      React.createElement(SubtitleViewer, {
        cues: mockCues,
        activeCueIndex: 0,
        onSeekToCue: () => {},
        onWordClick: () => {},
        studyMode: 'normal',
        showTranslation: true,
        isParchment: true,
        isPlaying: false,
        currentTime: 0
      })
    );

    // Assert word tokens have touch-manipulation to prevent 300ms mobile tap delay
    assert.ok(html.includes('touch-manipulation'), 'Word token elements must contain touch-manipulation');

    // Assert word tokens have touch padding to expand hit area
    assert.ok(html.includes('py-0.5') && html.includes('px-1'), 'Word tokens must have py-0.5 and px-1 padding for ergonomic hit radius');

    // Assert active scale feedback for tactile responsiveness
    assert.ok(html.includes('active:scale-95') || html.includes('active:scale-[0.96]'), 'Word tokens must have active press scaling feedback');
  });
});
