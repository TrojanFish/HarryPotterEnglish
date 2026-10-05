import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssPath = path.resolve(__dirname, '..', 'src', 'index.css');

test('CSS Tokens & Typography Focus Verification', async (t) => {
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  await t.test('2.1: CEFR color tokens exist in :root', () => {
    assert.ok(cssContent.includes('--c-cefr-a2'), 'Must define --c-cefr-a2');
    assert.ok(cssContent.includes('--c-cefr-b1'), 'Must define --c-cefr-b1');
    assert.ok(cssContent.includes('--c-cefr-b2'), 'Must define --c-cefr-b2');
    assert.ok(cssContent.includes('--c-cefr-c1'), 'Must define --c-cefr-c1');
  });

  await t.test('2.2: Dual-channel .cefr-pill classes exist for all 4 levels', () => {
    assert.ok(cssContent.includes('.cefr-pill'), 'Must define .cefr-pill base class');
    assert.ok(cssContent.includes('.cefr-pill-a2'), 'Must define .cefr-pill-a2');
    assert.ok(cssContent.includes('.cefr-pill-b1'), 'Must define .cefr-pill-b1');
    assert.ok(cssContent.includes('.cefr-pill-b2'), 'Must define .cefr-pill-b2');
    assert.ok(cssContent.includes('.cefr-pill-c1'), 'Must define .cefr-pill-c1');
  });

  await t.test('2.3: Hero unit reading sentence classes exist with leading-[1.85] and border', () => {
    assert.ok(cssContent.includes('.reading-hero-sentence'), 'Must define .reading-hero-sentence');
    assert.ok(cssContent.includes('.reading-inactive-sentence'), 'Must define .reading-inactive-sentence');
    assert.ok(cssContent.includes('1.85'), 'Hero sentence must specify 1.85 line-height');
  });
});
