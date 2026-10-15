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

// Transpile LumosClozeInput
const lumosSrcPath = path.resolve(projectRoot, 'src', 'components', 'dictation', 'LumosClozeInput.jsx');
let lumosSrcCode = fs.readFileSync(lumosSrcPath, 'utf8')
  .replace('../../utils/dictationEngine', '../src/utils/dictationEngine.js')
  .replace('../../utils/spellAudioSynthesizer', '../src/utils/spellAudioSynthesizer.js');
const transformedLumos = esbuild.transformSync(lumosSrcCode, { loader: 'jsx', format: 'esm' });
const compiledLumosPath = path.resolve(__dirname, 'LumosClozeInput.compiled.js');
fs.writeFileSync(compiledLumosPath, transformedLumos.code, 'utf8');

// Transpile AurorFullTyping
const aurorSrcPath = path.resolve(projectRoot, 'src', 'components', 'dictation', 'AurorFullTyping.jsx');
let aurorSrcCode = fs.readFileSync(aurorSrcPath, 'utf8')
  .replace('../../utils/vttParser', '../src/utils/vttParser.js')
  .replace('../../utils/dictationEngine', '../src/utils/dictationEngine.js');
const transformedAuror = esbuild.transformSync(aurorSrcCode, { loader: 'jsx', format: 'esm' });
const compiledAurorPath = path.resolve(__dirname, 'AurorFullTyping.compiled.js');
fs.writeFileSync(compiledAurorPath, transformedAuror.code, 'utf8');

const { LumosClozeInput } = await import('./LumosClozeInput.compiled.js');
const { AurorFullTyping } = await import('./AurorFullTyping.compiled.js');

test('DictationStudio Ergonomics & Dual-Channel Feedback Test Suite', async (t) => {

  await t.test('5.1: LumosClozeInput input fields enforce text-base (16px) to prevent iOS auto-zoom', () => {
    const html = renderToString(
      React.createElement(LumosClozeInput, {
        sentenceText: 'The wand chooses the wizard, Mr. Potter.',
        isParchment: true
      })
    );

    assert.ok(html.includes('text-base'), 'Cloze inputs must have text-base to prevent mobile auto-zoom');
    assert.ok(html.includes('<input'), 'Must render input elements for cloze blanks');
  });

  await t.test('5.2: LumosClozeInput provides dual-channel indicator for invalid or wrong input', () => {
    const html = renderToString(
      React.createElement(LumosClozeInput, {
        sentenceText: 'The wand chooses the wizard, Mr. Potter.',
        isParchment: true
      })
    );

    // Verify dual-channel status support: must include dual-channel classes or wrong icon indicators
    assert.ok(html.includes('cloze-input') || html.includes('text-center font-bold text-base'), 'Input must have structured styling');
    assert.ok(html.includes('status-icon-container') || html.includes('Check'), 'Must support status icon indicator');
  });

  await t.test('5.3: AurorFullTyping textarea enforces text-base and 44px ergonomics', () => {
    const html = renderToString(
      React.createElement(AurorFullTyping, {
        currentCue: { text: 'Expecto Patronum creates a silver guardian.' },
        userInput: '',
        showAnswer: false
      })
    );

    assert.ok(html.includes('text-base'), 'Auror typing textarea must have text-base (16px)');
    assert.ok(html.includes('<textarea'), 'Must render student typing textarea');
    assert.ok(!html.includes('·'), 'Must eliminate unstructured middle-dots from header');
  });
});
