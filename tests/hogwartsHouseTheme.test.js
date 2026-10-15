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
    .replace(/from '(\.\.\/)+hooks\/([^'\.]+)(\.js)?'/g, "from '../src/hooks/$2.js'");
  const transformed = esbuild.transformSync(code, { loader: 'jsx', format: 'esm' });
  const fullOut = path.resolve(__dirname, outRelPath);
  fs.writeFileSync(fullOut, transformed.code, 'utf8');
}

test('Hogwarts House Theme Engine Test Suite', async (t) => {
  // 1. useHogwartsHouse logic
  const hookPath = path.resolve(projectRoot, 'src/hooks/useHogwartsHouse.js');
  assert.ok(fs.existsSync(hookPath), 'useHogwartsHouse.js must exist');
  const { applyHouseThemeToDom, getSavedHouse, saveHouse } = await import('../src/hooks/useHogwartsHouse.js');

  await t.test('3.1: getSavedHouse and saveHouse persist user house safely', () => {
    // Mock localStorage
    const storageMap = new Map();
    globalThis.localStorage = {
      getItem: (k) => storageMap.get(k) || null,
      setItem: (k, v) => storageMap.set(k, String(v)),
      removeItem: (k) => storageMap.delete(k)
    };

    assert.strictEqual(getSavedHouse(), 'gryffindor', 'Default house must be Gryffindor');
    saveHouse('slytherin');
    assert.strictEqual(getSavedHouse(), 'slytherin', 'Must retrieve saved house Slytherin');
    saveHouse('invalid_house');
    assert.strictEqual(getSavedHouse(), 'gryffindor', 'Invalid house must fallback to Gryffindor');
  });

  await t.test('3.2: applyHouseThemeToDom sets data-house and CSS variables on document element', () => {
    const styleMap = new Map();
    const docElem = {
      setAttribute: (k, v) => docElem.attrs.set(k, v),
      getAttribute: (k) => docElem.attrs.get(k),
      attrs: new Map(),
      style: {
        setProperty: (prop, val) => styleMap.set(prop, val),
        getPropertyValue: (prop) => styleMap.get(prop)
      }
    };
    globalThis.document = { documentElement: docElem };

    applyHouseThemeToDom('ravenclaw');
    assert.strictEqual(docElem.attrs.get('data-house'), 'ravenclaw', 'data-house must be ravenclaw');
    assert.ok(styleMap.get('--c-house-primary'), 'Must set --c-house-primary CSS variable');
    assert.ok(styleMap.get('--c-house-gem'), 'Must set --c-house-gem CSS variable');
  });

  await t.test('3.3: HOUSES constants contain canonical 4 Houses with traits and colors', async () => {
    const { HOUSES } = await import('../src/constants/hogwartsTheme.js');
    assert.ok(HOUSES.gryffindor, 'Gryffindor must exist');
    assert.ok(HOUSES.slytherin, 'Slytherin must exist');
    assert.ok(HOUSES.ravenclaw, 'Ravenclaw must exist');
    assert.ok(HOUSES.hufflepuff, 'Hufflepuff must exist');
    assert.strictEqual(HOUSES.gryffindor.nameZh, '格兰芬多');
    assert.strictEqual(HOUSES.slytherin.nameZh, '斯莱特林');
    assert.strictEqual(HOUSES.ravenclaw.nameZh, '拉文克劳');
    assert.strictEqual(HOUSES.hufflepuff.nameZh, '赫奇帕奇');
  });
});
