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

  // 2. HouseSelectorModal
  compileJsx('src/components/common/HouseSelectorModal.jsx', 'HouseSelectorModal.compiled.js');
  const { HouseSelectorModal } = await import('./HouseSelectorModal.compiled.js');

  await t.test('3.3: HouseSelectorModal renders all 4 Houses with traits and motto', () => {
    const html = renderToString(
      React.createElement(HouseSelectorModal, {
        isOpen: true,
        currentHouse: 'gryffindor',
        onClose: () => {},
        onSelectHouse: () => {}
      })
    );

    assert.ok(html.includes('格兰芬多'), 'Must display 格兰芬多');
    assert.ok(html.includes('斯莱特林'), 'Must display 斯莱特林');
    assert.ok(html.includes('拉文克劳'), 'Must display 拉文克劳');
    assert.ok(html.includes('赫奇帕奇'), 'Must display 赫奇帕奇');
    assert.ok(html.includes('狮子') || html.includes('勇'), 'Must mention house trait or animal');
    assert.ok(html.includes('分院') || html.includes('学院'), 'Must contain House selection title');
  });

  t.after(() => {
    try {
      const f = path.resolve(__dirname, 'HouseSelectorModal.compiled.js');
      if (fs.existsSync(f)) fs.unlinkSync(f);
    } catch {}
  });
});
