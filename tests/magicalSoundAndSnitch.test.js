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

test('Procedural Magical Sound & Golden Snitch Scrubber Test Suite', async (t) => {
  // 1. magicalSound.js
  const soundPath = path.resolve(projectRoot, 'src', 'utils', 'magicalSound.js');
  assert.ok(fs.existsSync(soundPath), 'src/utils/magicalSound.js must exist');

  const { magicalSound } = await import('../src/utils/magicalSound.js');

  await t.test('6.1: magicalSound exposes canonical sound methods with safe no-op on non-browser environments', () => {
    assert.strictEqual(typeof magicalSound.playParchment, 'function', 'Must have playParchment');
    assert.strictEqual(typeof magicalSound.playWandTap, 'function', 'Must have playWandTap');
    assert.strictEqual(typeof magicalSound.playGemDrop, 'function', 'Must have playGemDrop');
    assert.strictEqual(typeof magicalSound.toggleMute, 'function', 'Must have toggleMute');
    assert.strictEqual(typeof magicalSound.isMuted, 'function', 'Must have isMuted');

    // Calling in Node without AudioContext must never throw
    assert.doesNotThrow(() => magicalSound.playParchment());
    assert.doesNotThrow(() => magicalSound.playWandTap());
    assert.doesNotThrow(() => magicalSound.playGemDrop());
  });

  // 2. GoldenSnitchScrubber.jsx
  const snitchPath = path.resolve(projectRoot, 'src', 'components', 'common', 'GoldenSnitchScrubber.jsx');
  assert.ok(fs.existsSync(snitchPath), 'src/components/common/GoldenSnitchScrubber.jsx must exist');

  const snitchCode = fs.readFileSync(snitchPath, 'utf8');
  const transformed = esbuild.transformSync(snitchCode, { loader: 'jsx', format: 'esm' });
  const compiledPath = path.resolve(__dirname, 'GoldenSnitchScrubber.compiled.js');
  fs.writeFileSync(compiledPath, transformed.code, 'utf8');

  const { GoldenSnitchScrubber } = await import('./GoldenSnitchScrubber.compiled.js');

  await t.test('6.2: GoldenSnitchScrubber renders SVG wings and golden snitch orb with zero emojis', () => {
    const html = renderToString(
      React.createElement(GoldenSnitchScrubber, {
        progress: 42,
        isHovered: true,
        size: 24
      })
    );

    assert.ok(html.includes('golden-snitch') || html.includes('svg'), 'Must render SVG golden snitch');
    assert.ok(html.includes('wing') || html.includes('path'), 'Must render wings');
    assert.ok(!/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(html), 'Must have strictly zero emojis');
  });

  t.after(() => {
    try {
      const full = path.resolve(__dirname, 'GoldenSnitchScrubber.compiled.js');
      if (fs.existsSync(full)) fs.unlinkSync(full);
    } catch {}
  });
});
