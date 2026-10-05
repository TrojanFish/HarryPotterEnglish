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
  .replace('../utils/vttParser', '../src/utils/vttParser.js')
  .replace('../data/hpDictionary', '../src/data/hpDictionary.js');

const transformedViewer = esbuild.transformSync(viewerSrcCode, { loader: 'jsx', format: 'esm' });
const compiledViewerPath = path.resolve(__dirname, 'SubtitleViewer.compiled.js');
fs.writeFileSync(compiledViewerPath, transformedViewer.code, 'utf8');

const { SubtitleViewer } = await import('./SubtitleViewer.compiled.js');

test('SubtitleViewer Hero Unit Focus & SLA Ergonomics Test Suite', async (t) => {
  const mockCues = [
    {
      id: 'cue-0',
      startTime: 1.0,
      endTime: 5.5,
      text: 'Mr. and Mrs. Dursley were proud to say that they were perfectly normal.',
      translation: '德思礼夫妇总是得意地宣称，他们是非常规矩的正常人家。'
    },
    {
      id: 'cue-1',
      startTime: 6.0,
      endTime: 10.5,
      text: 'They were the last people you would expect to be involved in anything strange.',
      translation: '他们最不愿与任何古怪或神秘的事物扯上干系。'
    }
  ];

  await t.test('3.1: Active sentence card applies .reading-hero-sentence class and indicator', () => {
    const html = renderToString(
      React.createElement(SubtitleViewer, {
        cues: mockCues,
        activeCueIndex: 0,
        studyMode: 'normal',
        showTranslation: true,
        isParchment: true,
        onSeekToCue: () => {},
        onWordClick: () => {},
        onRecordCue: () => {},
        onSaveToVocab: () => {}
      })
    );

    // Active card (cue-0) must have hero sentence focus class
    assert.ok(html.includes('reading-hero-sentence'), 'Active sentence card must contain reading-hero-sentence class');
    assert.ok(html.includes('正在朗读'), 'Active sentence must render active audio indicator');
  });

  await t.test('3.2: Inactive sentences apply .reading-inactive-sentence class to reduce visual distraction', () => {
    const html = renderToString(
      React.createElement(SubtitleViewer, {
        cues: mockCues,
        activeCueIndex: 0,
        studyMode: 'normal',
        showTranslation: true,
        isParchment: true,
        onSeekToCue: () => {},
        onWordClick: () => {},
        onRecordCue: () => {},
        onSaveToVocab: () => {}
      })
    );

    assert.ok(html.includes('reading-inactive-sentence'), 'Inactive sentence cards must contain reading-inactive-sentence class');
  });

  await t.test('3.3: Blind listening mode hides inactive text with mist mask', () => {
    const html = renderToString(
      React.createElement(SubtitleViewer, {
        cues: mockCues,
        activeCueIndex: 0,
        studyMode: 'blind',
        showTranslation: false,
        isParchment: true,
        onSeekToCue: () => {},
        onWordClick: () => {},
        onRecordCue: () => {},
        onSaveToVocab: () => {}
      })
    );

    // In blind mode, the inactive sentence (cue-1) should show the blind mask prompt
    assert.ok(html.includes('迷雾遮罩') || html.includes('blind-mask'), 'Blind mode must show mist mask indicator');
  });

  await t.test('3.4: Interactive action buttons adhere to Apple HIG >=44px touch targets', () => {
    const html = renderToString(
      React.createElement(SubtitleViewer, {
        cues: mockCues,
        activeCueIndex: 0,
        studyMode: 'normal',
        showTranslation: true,
        isParchment: true,
        onSeekToCue: () => {},
        onWordClick: () => {},
        onRecordCue: () => {},
        onSaveToVocab: () => {}
      })
    );

    // Sentence row action buttons must enforce min-w-[44px] min-h-[44px]
    assert.ok(html.includes('min-h-[44px]'), 'Must enforce Apple HIG 44px minimum height touch target');
    assert.ok(html.includes('min-w-[44px]'), 'Must enforce Apple HIG 44px minimum width touch target');
  });
});

