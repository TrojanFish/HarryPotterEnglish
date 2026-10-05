import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS, getCefrInfo, CEFR_LEVELS } from '../src/data/books.js';

test('CEFR Schema & Books Catalog Test Suite', async (t) => {

  await t.test('1.1: BOOKS array contains complete 7-volume Harry Potter progression', () => {
    assert.ok(Array.isArray(BOOKS), 'BOOKS must be an array');
    assert.ok(BOOKS.length >= 7, 'BOOKS must contain at least 7 entries for the HP series');

    for (const book of BOOKS) {
      assert.ok(book.id, 'Every book must have an id');
      assert.ok(book.title, 'Every book must have an English title');
      assert.ok(book.titleZh, 'Every book must have a Chinese title');
      assert.ok(book.cefr, `Book ${book.id} must define a cefr property`);
      assert.ok(['A2', 'B1', 'B2', 'C1'].includes(book.cefr), `CEFR must be A2, B1, B2, or C1 (got ${book.cefr})`);
      assert.ok(book.cefrLabel, `Book ${book.id} must have a human-readable cefrLabel`);
    }
  });

  await t.test('1.2: CEFR difficulty progression accurately increases across books', () => {
    const hp1 = BOOKS.find(b => b.id.includes('1'));
    const hp2 = BOOKS.find(b => b.id.includes('2'));
    const hp7 = BOOKS.find(b => b.id.includes('7'));

    assert.equal(hp1.cefr, 'A2', 'Book 1 must be CEFR A2 (Foundation/Apprentice)');
    assert.equal(hp2.cefr, 'B1', 'Book 2 must be CEFR B1 (Intermediate/Explorer)');
    assert.ok(['B2', 'C1'].includes(hp7.cefr), 'Book 7 must be CEFR B2 or C1 (Mastery)');
  });

  await t.test('1.3: CEFR_LEVELS definition complies with dual-channel accessibility (text + color)', () => {
    assert.ok(CEFR_LEVELS.A2, 'CEFR_LEVELS must have A2 config');
    assert.ok(CEFR_LEVELS.B1, 'CEFR_LEVELS must have B1 config');
    assert.ok(CEFR_LEVELS.B2, 'CEFR_LEVELS must have B2 config');
    assert.ok(CEFR_LEVELS.C1, 'CEFR_LEVELS must have C1 config');

    for (const [code, info] of Object.entries(CEFR_LEVELS)) {
      assert.equal(info.code, code);
      assert.ok(info.label, `Level ${code} must have a text label`);
      assert.ok(info.badgeClass, `Level ${code} must have a badge CSS class`);
      assert.ok(info.bgVar, `Level ${code} must reference a CSS variable`);
    }
  });

  await t.test('1.4: getCefrInfo accurately resolves books by id, object, or fallback safely', () => {
    const infoById = getCefrInfo('book1');
    assert.equal(infoById.code, 'A2');
    assert.equal(infoById.label, '入门');

    const infoByObj = getCefrInfo({ id: 'book3', title: 'Prisoner of Azkaban' });
    assert.equal(infoByObj.code, 'B1');

    const infoByAltId = getCefrInfo('hp-book-7');
    assert.equal(infoByAltId.code, 'C1');

    // Unknown fallback
    const fallback = getCefrInfo('unknown-book-999');
    assert.ok(fallback, 'Must return fallback info');
    assert.ok(fallback.label, 'Fallback must have label');
    assert.equal(fallback.code, 'B1', 'Default fallback should be B1');

    // Null/undefined safety
    assert.doesNotThrow(() => getCefrInfo(null));
    assert.doesNotThrow(() => getCefrInfo(undefined));
  });
});
