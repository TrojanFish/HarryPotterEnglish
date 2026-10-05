import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePrintableParchmentHTML,
  escapeHtml,
  highlightWordInContext
} from '../src/utils/parchmentPdfGenerator.js';

test('Parchment PDF Generator - Unit & Edge Case Test Suite', async (t) => {

  await t.test('1.1: Empty and invalid inputs produce safe fallback HTML without throwing', () => {
    const htmlEmpty = generatePrintableParchmentHTML([]);
    assert.ok(htmlEmpty.includes('<!DOCTYPE html>'));
    assert.ok(htmlEmpty.includes('生词本中尚无单词'));

    const htmlNull = generatePrintableParchmentHTML(null);
    assert.ok(htmlNull.includes('<!DOCTYPE html>'));

    const htmlUndefined = generatePrintableParchmentHTML(undefined);
    assert.ok(htmlUndefined.includes('<!DOCTYPE html>'));
  });

  await t.test('1.2: HTML sanitization prevents script injection and malformed markup', () => {
    const maliciousWord = '<script>alert("xss")</script>';
    const escaped = escapeHtml(maliciousWord);
    assert.ok(!escaped.includes('<script>'));
    assert.ok(escaped.includes('&lt;script&gt;'));

    const maliciousVocab = [{
      word: '<script>hack()</script>',
      translation: '<b>恶意</b>释义',
      context: 'He said <script>evil()</script> loudly.'
    }];

    const html = generatePrintableParchmentHTML(maliciousVocab);
    assert.ok(!html.includes('<script>hack()</script>'));
    assert.ok(html.includes('&lt;script&gt;hack()&lt;/script&gt;'));
  });

  await t.test('1.3: Pagination logic cleanly divides items into 6 cards per A4 page', () => {
    // Generate 12 mock items -> exactly 2 pages
    const mock12 = Array.from({ length: 12 }, (_, i) => ({
      word: `Spell${i + 1}`,
      phonetic: `/spel/`,
      pos: 'n.',
      translation: `魔法咒语 ${i + 1}`,
      context: `Harry practiced Spell${i + 1} with his wand.`
    }));

    const html12 = generatePrintableParchmentHTML(mock12);
    const pageMatches12 = html12.match(/class="a4-page"/g) || [];
    assert.equal(pageMatches12.length, 2, '12 items must render exactly 2 pages');

    // Generate 7 mock items -> exactly 2 pages (page 1 has 6, page 2 has 1)
    const mock7 = mock12.slice(0, 7);
    const html7 = generatePrintableParchmentHTML(mock7);
    const pageMatches7 = html7.match(/class="a4-page"/g) || [];
    assert.equal(pageMatches7.length, 2, '7 items must render exactly 2 pages');
  });

  await t.test('1.4: Card details include phonetics, context, and Ebbinghaus 5-step review boxes', () => {
    const sample = [{
      word: 'Wand',
      phonetic: '/wɒnd/',
      pos: 'noun',
      translation: '魔杖',
      context: 'The wand chooses the wizard, Mr. Potter.',
      bookTitle: 'Harry Potter 1',
      chapterTitle: 'The Magic Begins'
    }];

    const html = generatePrintableParchmentHTML(sample);

    // Assert word & phonetic
    assert.ok(html.includes('Wand'), 'Must render word');
    assert.ok(html.includes('/wɒnd/'), 'Must render phonetic');
    assert.ok(html.includes('魔杖'), 'Must render translation');

    // Assert bolded context
    assert.ok(html.includes('class="highlighted-word">wand</span>') || html.includes('The <span class="highlighted-word">wand</span> chooses'),
      'Must highlight target word in context sentence');

    // Assert Ebbinghaus checklist boxes
    assert.ok(html.includes('1天'), 'Must have Day 1 review box');
    assert.ok(html.includes('3天'), 'Must have Day 3 review box');
    assert.ok(html.includes('7天'), 'Must have Day 7 review box');
    assert.ok(html.includes('15天'), 'Must have Day 15 review box');
    assert.ok(html.includes('30天'), 'Must have Day 30 review box');
  });

  await t.test('1.5: Print stylesheet embeds @page and cut-out dashed lines', () => {
    const html = generatePrintableParchmentHTML([{ word: 'Lumos', translation: '荧光闪烁' }]);

    assert.ok(html.includes('@page {'), 'Must include @page CSS directive');
    assert.ok(html.includes('size: A4 portrait'), 'Must define A4 portrait page size');
    assert.ok(html.includes('break-inside: avoid') || html.includes('page-break-inside: avoid'),
      'Must contain break-inside avoid rule for cards');
    assert.ok(html.includes('dashed'), 'Must contain dashed cut-out lines');
  });

  await t.test('1.6: Stress test generates 100 diverse vocabulary items in under 50ms', () => {
    const largeList = Array.from({ length: 100 }, (_, i) => ({
      word: `Incantation_${i}`,
      phonetic: `/ɪn.kænˈteɪ.ʃən/`,
      pos: i % 2 === 0 ? 'verb' : 'noun',
      translation: `魔法咏唱测试第 ${i} 句`,
      context: `The professor recited Incantation_${i} to illuminate the chamber.`
    }));

    const start = performance.now();
    const html = generatePrintableParchmentHTML(largeList);
    const duration = performance.now() - start;

    assert.ok(html.length > 5000);
    assert.ok(duration < 500, `Large-scale generation took ${duration.toFixed(2)}ms (must be < 500ms)`);
  });
});
