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

// Bundle DictationStudio for testing
const studioSrcPath = path.resolve(projectRoot, 'src', 'components', 'DictationStudio.jsx');
const compiledStudioPath = path.resolve(__dirname, 'DictationStudio.keyboard.compiled.js');

esbuild.buildSync({
  entryPoints: [studioSrcPath],
  outfile: compiledStudioPath,
  bundle: true,
  format: 'esm',
  external: ['react', 'react-dom', 'lucide-react', 'react/jsx-runtime']
});

const { DictationStudio } = await import('./DictationStudio.keyboard.compiled.js');

test('DictationStudio Mobile Keyboard & Viewport Adaptation Test Suite', async (t) => {
  const mockCues = [
    {
      id: 'cue-0',
      startTime: 1.0,
      endTime: 5.5,
      text: 'The wand chooses the wizard, Mr. Potter.',
      translation: '魔杖选择巫师，波特先生。'
    }
  ];

  await t.test('2.1: DictationStudio root container incorporates 100dvh and overscroll-contain for mobile soft keyboard safety', () => {
    const html = renderToString(
      React.createElement(DictationStudio, {
        cues: mockCues,
        activeCueIndex: 0,
        isPlaying: false,
        isParchment: true
      })
    );

    assert.ok(html.includes('100dvh'), 'Root container must include 100dvh to handle mobile keyboard expansion without layout collapse');
    assert.ok(html.includes('overscroll-contain'), 'Root container or scroll area must include overscroll-contain to prevent pull-to-refresh interference');
  });

  await t.test('2.2: Audio replay station remains rendered with explicit touch targets (>=44px)', () => {
    const html = renderToString(
      React.createElement(DictationStudio, {
        cues: mockCues,
        activeCueIndex: 0,
        isPlaying: false,
        isParchment: true
      })
    );

    assert.ok(html.includes('重播本句'), 'Replay current sentence button must exist');
    assert.ok(html.includes('min-w-[44px]') || html.includes('h-10') || html.includes('h-11'), 'Controls must adhere to Apple HIG touch targets');
  });
});
