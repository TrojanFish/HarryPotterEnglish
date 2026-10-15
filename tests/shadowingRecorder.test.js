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

// Transpile ShadowingRecorder.jsx
const recorderSrcPath = path.resolve(projectRoot, 'src', 'components', 'ShadowingRecorder.jsx');
let recorderSrcCode = fs.readFileSync(recorderSrcPath, 'utf8')
  .replace("from '../utils/speechScoring'", "from '../src/utils/speechScoring.js'");

const transformedRecorder = esbuild.transformSync(recorderSrcCode, { loader: 'jsx', format: 'esm' });
const compiledRecorderPath = path.resolve(__dirname, 'ShadowingRecorderPhase3.compiled.js');
fs.writeFileSync(compiledRecorderPath, transformedRecorder.code, 'utf8');

const { ShadowingRecorder } = await import('./ShadowingRecorderPhase3.compiled.js');

test('ShadowingRecorder A/B Dual-Track & Ergonomics Test Suite', async (t) => {
  const mockCue = {
    id: 'cue-test-1',
    text: 'Wingardium Leviosa!',
    translation: '羽加迪姆·勒维奥萨！',
    startTime: 12.5,
    endTime: 15.0
  };

  await t.test('7.1: Renders dedicated Track A (Original British Audio) with structured badge and >=44px button', () => {
    const html = renderToString(
      React.createElement(ShadowingRecorder, {
        isOpen: true,
        onClose: () => {},
        currentCue: mockCue,
        onPlayOriginalSnippet: () => {},
        isParchment: true
      })
    );

    assert.ok(html.includes('track-a-badge') || html.includes('Track A'), 'Must render explicit Track A label');
    assert.ok(html.includes('播放原音') || html.includes('原版朗读'), 'Must render track A audio button');
    assert.ok(html.includes('min-h-[44px]'), 'Buttons must adhere to Apple HIG 44px touch target');
  });

  await t.test('7.2: Renders dedicated Track B (Student Recording) with dual-channel status', () => {
    const html = renderToString(
      React.createElement(ShadowingRecorder, {
        isOpen: true,
        onClose: () => {},
        currentCue: mockCue,
        onPlayOriginalSnippet: () => {},
        isParchment: true
      })
    );

    assert.ok(html.includes('track-b-badge') || html.includes('Track B'), 'Must render explicit Track B label');
    assert.ok(html.includes('开始录音') || html.includes('你的跟读录音'), 'Must render student recording controls');
  });

  await t.test('7.3: Clean typography eliminates unstructured middle-dot connectors', () => {
    const html = renderToString(
      React.createElement(ShadowingRecorder, {
        isOpen: true,
        onClose: () => {},
        currentCue: mockCue,
        onPlayOriginalSnippet: () => {},
        isParchment: true
      })
    );

    // Eliminates raw "原著朗读目标句 · Target Sentence" pattern
    assert.ok(!html.includes('原著朗读目标句 · Target Sentence'), 'Must eliminate raw middle-dot in target sentence title');
  });
});
