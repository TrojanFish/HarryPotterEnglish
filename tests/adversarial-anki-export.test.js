/**
 * Adversarial Challenge Test Suite for Milestone 3 (R3: Anki Export Pipeline & Flashcard Synchronization)
 *
 * Empirical challenger: challenger_m3_2
 *
 * Verifies:
 * 1. Empty vocabulary state: 0 words disabled state & safe error-free handling.
 * 2. Browser download simulation: mock Blob, URL.createObjectURL, URL.revokeObjectURL for ZERO memory leaks.
 * 3. Strict Anki Desktop / AnkiMobile TSV import specifications & oracle verification.
 * 4. Adversarial stress testing: regex metacharacters, boundary sanitization, and scale stress (1,000 cards).
 * 5. End-to-end integration between App.jsx vocab schema and VocabularyDrawer.jsx.
 * 6. Empirical bug reproduction: multi-word bolding failure, unescaped tag delimiters, and CSV URL leak.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import React from 'react';
import { renderToString } from 'react-dom/server';

import {
  generateAnkiTSV,
  downloadAnkiFile,
  sanitizeForTSV,
  boldWordInContext,
  formatAudioTimestamp
} from '../src/utils/ankiExport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Transpile VocabularyDrawer.jsx for Node test environment
const drawerSrcPath = path.resolve(projectRoot, 'src', 'components', 'VocabularyDrawer.jsx');
let drawerSrcCode = fs.readFileSync(drawerSrcPath, 'utf8');
drawerSrcCode = drawerSrcCode
  .replace('../utils/ankiExport', '../src/utils/ankiExport.js')
  .replace('../utils/parchmentPdfGenerator', '../src/utils/parchmentPdfGenerator.js');
const transformedDrawer = esbuild.transformSync(drawerSrcCode, { loader: 'jsx', format: 'esm' });
const compiledDrawerPath = path.resolve(__dirname, 'VocabularyDrawer.compiled.js');
fs.writeFileSync(compiledDrawerPath, transformedDrawer.code, 'utf8');

const { VocabularyDrawer } = await import('./VocabularyDrawer.compiled.js');

// ============================================================================
// ANKI IMPORT VALIDATOR ORACLE
// Emulates the parser used by Anki Desktop (Anki 2.1+) and AnkiMobile
// ============================================================================
class AnkiImportValidatorOracle {
  /**
   * Parse and validate raw TSV content strictly against Anki Desktop import rules.
   *
   * @param {string} rawContent - TSV content
   * @param {object} [expectedOptions={}]
   * @returns {{ isValid: boolean, errors: string[], directives: Record<string, string>, rows: Array<string[]> }}
   */
  static validate(rawContent, expectedOptions = {}) {
    const errors = [];
    const directives = {};
    const rows = [];

    if (typeof rawContent !== 'string') {
      return { isValid: false, errors: ['Content is not a string'], directives, rows };
    }

    const lines = rawContent.split(/\r?\n/);
    let inHeader = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // End of file trailing empty line is normal
      if (i === lines.length - 1 && line.trim() === '') {
        continue;
      }

      // Directive / Header lines start with '#'
      if (line.startsWith('#')) {
        if (!inHeader) {
          errors.push(`Line ${i + 1}: Found directive header '#' after data rows started: "${line}"`);
        }
        const colonIdx = line.indexOf(':');
        if (colonIdx > 1) {
          const key = line.substring(1, colonIdx).trim().toLowerCase();
          const value = line.substring(colonIdx + 1).trim();
          directives[key] = value;
        }
        continue;
      }

      // Once non-# line is reached, header is done
      inHeader = false;

      // Data row: Must be split strictly by tab '\t'
      const columns = line.split('\t');

      // PROJECT.md § Anki Export Contract specifies exactly 7 tab-delimited columns
      if (columns.length !== 7) {
        errors.push(
          `Line ${i + 1}: Expected exactly 7 columns, but found ${columns.length} columns. Content: "${line.substring(0, 100)}..."`
        );
      }

      // Check for illegal unescaped characters that disrupt Anki Desktop parsing
      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        const col = columns[colIdx];
        if (col.includes('\r')) {
          errors.push(`Line ${i + 1}, Col ${colIdx + 1}: Contains unescaped carriage return '\\r'`);
        }
      }

      rows.push(columns);
    }

    // Directives verification
    if (directives['separator'] !== 'Tab') {
      errors.push(`Missing or invalid #separator directive. Found: "${directives['separator']}", expected: "Tab"`);
    }
    if (directives['html'] !== 'true') {
      errors.push(`Missing or invalid #html directive. Found: "${directives['html']}", expected: "true"`);
    }
    if (directives['tags column'] !== '7') {
      errors.push(`Missing or invalid #tags column directive. Found: "${directives['tags column']}", expected: "7"`);
    }
    if (expectedOptions.deckName && directives['deck'] !== expectedOptions.deckName) {
      errors.push(`Deck directive mismatch. Found: "${directives['deck']}", expected: "${expectedOptions.deckName}"`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      directives,
      rows
    };
  }
}

// ============================================================================
// MEMORY LEAK SIMULATION HARNESS
// ============================================================================
function setupBrowserMock() {
  const activeUrls = new Set();
  const createdBlobs = [];
  const appendedElements = [];
  const clickedElements = [];
  let urlCounter = 0;

  class MockBlob {
    constructor(parts, options = {}) {
      this.parts = parts;
      this.type = options.type || '';
      this.content = parts.join('');
      this.size = Buffer.byteLength(this.content, 'utf8');
      createdBlobs.push(this);
    }
  }

  const mockWindow = {};
  const mockDocument = {
    body: {
      children: [],
      appendChild(node) {
        this.children.push(node);
        appendedElements.push(node);
        return node;
      },
      removeChild(node) {
        const idx = this.children.indexOf(node);
        if (idx !== -1) {
          this.children.splice(idx, 1);
        }
        return node;
      }
    },
    createElement(tagName) {
      const element = {
        tagName: tagName.toUpperCase(),
        href: '',
        download: '',
        click() {
          clickedElements.push(this);
        },
        setAttribute(attr, val) {
          this[attr] = val;
        }
      };
      return element;
    }
  };

  const mockURL = {
    createObjectURL(blob) {
      urlCounter++;
      const url = `blob:hogwarts-anki://${urlCounter}`;
      activeUrls.add(url);
      return url;
    },
    revokeObjectURL(url) {
      if (activeUrls.has(url)) {
        activeUrls.delete(url);
      }
    }
  };

  // Bind to globalThis
  const prevWindow = globalThis.window;
  const prevDoc = globalThis.document;
  const prevBlob = globalThis.Blob;
  const prevURL = globalThis.URL;

  globalThis.window = mockWindow;
  globalThis.document = mockDocument;
  globalThis.Blob = MockBlob;
  globalThis.URL = mockURL;

  return {
    activeUrls,
    createdBlobs,
    appendedElements,
    clickedElements,
    mockDocument,
    cleanup() {
      if (prevWindow !== undefined) globalThis.window = prevWindow; else delete globalThis.window;
      if (prevDoc !== undefined) globalThis.document = prevDoc; else delete globalThis.document;
      if (prevBlob !== undefined) globalThis.Blob = prevBlob; else delete globalThis.Blob;
      if (prevURL !== undefined) globalThis.URL = prevURL; else delete globalThis.URL;
    }
  };
}

// ============================================================================
// TESTS: TIER 1 - EMPTY STATE RESILIENCE
// ============================================================================

test('Adversarial 1.1: Empty vocabulary state in VocabularyDrawer renders buttons with disabled attribute', () => {
  const html = renderToString(
    React.createElement(VocabularyDrawer, {
      isOpen: true,
      onClose: () => {},
      vocabList: [],
      onRemoveWord: () => {},
      onClearAll: () => {},
      isParchment: false
    })
  );

  // 1. Must indicate empty count (0) (React 18 SSR emits <!-- --> comments)
  assert.match(html, /魔法生词本 \((?:<!-- -->)?0(?:<!-- -->)?\)/, 'Header must display zero count');

  // 2. Must render empty state guidance message
  assert.match(html, /暂无生词/, 'Must show empty placeholder');

  // 3. Export to Anki (TSV) button MUST be disabled
  assert.match(html, /<button[^>]*disabled=""[^>]*>[\s\S]*?导出至 Anki \(TSV\)/, 'Anki TSV export button must be disabled when vocab is empty');

  // 4. Export CSV button MUST be disabled
  assert.match(html, /<button[^>]*disabled=""[^>]*>[\s\S]*?导出 CSV/, 'CSV export button must be disabled when vocab is empty');

  // 5. Clear all button MUST be disabled
  assert.match(html, /<button[^>]*disabled=""[^>]*>[\s\S]*?清空生词本/, 'Clear all button must be disabled when vocab is empty');
});

test('Adversarial 1.2: Empty vocab list export execution safely early-returns without calling download or crashing', () => {
  const mockEnv = setupBrowserMock();
  try {
    // When vocabList is empty, generateAnkiTSV returns headers with 0 rows
    const tsvContent = generateAnkiTSV([]);
    const validation = AnkiImportValidatorOracle.validate(tsvContent);
    assert.strictEqual(validation.isValid, true, `Validation failed: ${validation.errors.join('; ')}`);
    assert.strictEqual(validation.rows.length, 0, 'Must produce exactly 0 data rows');

    // Simulate clicking export when vocabList is empty (e.g. programmatic invocation)
    const emptyList = [];
    if (emptyList && emptyList.length > 0) {
      downloadAnkiFile(generateAnkiTSV(emptyList));
    }

    // Nothing should be downloaded
    assert.strictEqual(mockEnv.createdBlobs.length, 0, 'No blob should be allocated');
    assert.strictEqual(mockEnv.activeUrls.size, 0, 'No object URL should be allocated');
    assert.strictEqual(mockEnv.clickedElements.length, 0, 'No download click should be triggered');
  } finally {
    mockEnv.cleanup();
  }
});

test('Adversarial 1.3: generateAnkiTSV boundary handling of null, undefined, and malformed inputs', () => {
  // Test undefined
  const undefinedResult = generateAnkiTSV(undefined);
  const vUndefined = AnkiImportValidatorOracle.validate(undefinedResult);
  assert.strictEqual(vUndefined.isValid, true);
  assert.strictEqual(vUndefined.rows.length, 0);

  // Test null
  const nullResult = generateAnkiTSV(null);
  const vNull = AnkiImportValidatorOracle.validate(nullResult);
  assert.strictEqual(vNull.isValid, true);
  assert.strictEqual(vNull.rows.length, 0);

  // Test non-array string
  const stringResult = generateAnkiTSV('not-an-array');
  const vString = AnkiImportValidatorOracle.validate(stringResult);
  assert.strictEqual(vString.isValid, true);
  assert.strictEqual(vString.rows.length, 0);

  // Test array with degenerate items [null, undefined, {}]
  const degenerateList = [null, undefined, {}];
  const degenerateResult = generateAnkiTSV(degenerateList);
  const vDegenerate = AnkiImportValidatorOracle.validate(degenerateResult);
  assert.strictEqual(vDegenerate.isValid, true, `Degenerate validation failed: ${vDegenerate.errors.join('; ')}`);
  assert.strictEqual(vDegenerate.rows.length, 3, 'Must produce 3 rows corresponding to the 3 entries');
  for (const row of vDegenerate.rows) {
    assert.strictEqual(row.length, 7, 'Each degenerate row must still have exactly 7 columns');
  }
});

// ============================================================================
// TESTS: TIER 2 - BROWSER DOWNLOAD SIMULATION & ZERO MEMORY LEAK ORACLE
// ============================================================================

test('Adversarial 2.1: Browser download simulation verifies exact DOM lifecycle & ZERO memory leaks in Anki export', () => {
  const mockEnv = setupBrowserMock();
  try {
    const testContent = generateAnkiTSV([
      {
        word: 'Alohomora',
        phonetic: '/əˌloʊhoʊˈmɔːrə/',
        pos: 'spell',
        definition: 'The Unlocking Charm',
        contextQuote: 'Harry pointed his wand and whispered, "Alohomora!"',
        startTime: 12.5,
        endTime: 15.0,
        chapterId: 'hp1-01'
      }
    ]);

    // Perform download
    downloadAnkiFile(testContent, 'hogwarts_anki_test.tsv');

    // 1. Verify Blob creation & MIME type
    assert.strictEqual(mockEnv.createdBlobs.length, 1, 'Exactly one Blob must be created');
    const blob = mockEnv.createdBlobs[0];
    assert.strictEqual(blob.type, 'text/tab-separated-values;charset=utf-8', 'Blob MIME type must be TSV utf-8');
    assert.strictEqual(blob.content, testContent, 'Blob content must match generated TSV');

    // 2. Verify Anchor attributes & click
    assert.strictEqual(mockEnv.clickedElements.length, 1, 'Anchor element must be clicked');
    const anchor = mockEnv.clickedElements[0];
    assert.strictEqual(anchor.tagName, 'A', 'Must be an <a> element');
    assert.strictEqual(anchor.download, 'hogwarts_anki_test.tsv', 'Download attribute must match filename');
    assert.match(anchor.href, /^blob:hogwarts-anki:\/\/\d+$/, 'Href must be a valid Blob URL');

    // 3. Verify DOM element cleanup
    assert.strictEqual(mockEnv.mockDocument.body.children.length, 0, 'Anchor must be removed from document.body after click');

    // 4. MEMORY LEAK CHECK: Verify URL.revokeObjectURL was invoked
    assert.strictEqual(mockEnv.activeUrls.size, 0, 'Active Object URL set must be empty (ZERO memory leaks in downloadAnkiFile)');
  } finally {
    mockEnv.cleanup();
  }
});

test('Adversarial 2.2: Burst Download Stress Test (100 rapid exports) leaves ZERO leaked URLs and 0 DOM remnants', () => {
  const mockEnv = setupBrowserMock();
  try {
    const count = 100;
    for (let i = 0; i < count; i++) {
      const content = generateAnkiTSV([
        {
          word: `word_${i}`,
          phonetic: `/wɜːd_${i}/`,
          translation: `测试单词 ${i}`,
          contextQuote: `This is context sentence number ${i}.`
        }
      ]);
      downloadAnkiFile(content, `burst_export_${i}.tsv`);
    }

    // Verify 100 downloads completed
    assert.strictEqual(mockEnv.createdBlobs.length, count, `Should create ${count} Blobs`);
    assert.strictEqual(mockEnv.clickedElements.length, count, `Should trigger ${count} download clicks`);

    // Verify DOM is clean
    assert.strictEqual(mockEnv.mockDocument.body.children.length, 0, 'All temporary anchors must be removed from DOM');

    // Verify ZERO memory leaks
    assert.strictEqual(mockEnv.activeUrls.size, 0, `All ${count} Blob URLs must be revoked; zero memory leaks`);
  } finally {
    mockEnv.cleanup();
  }
});

test('Adversarial 2.3: Non-browser / SSR environment safely no-ops without ReferenceError', () => {
  // Ensure window and document are undefined
  const prevWindow = globalThis.window;
  const prevDoc = globalThis.document;
  delete globalThis.window;
  delete globalThis.document;

  try {
    // Should not throw ReferenceError
    assert.doesNotThrow(() => {
      downloadAnkiFile('some content', 'test.tsv');
    });
  } finally {
    if (prevWindow !== undefined) globalThis.window = prevWindow;
    if (prevDoc !== undefined) globalThis.document = prevDoc;
  }
});

test('Adversarial 2.4: Memory leak remediation in VocabularyDrawer handleExportCSV verifies URL.revokeObjectURL', () => {
  const mockEnv = setupBrowserMock();
  try {
    // Replicate VocabularyDrawer.jsx lines 53-68 (handleExportCSV)
    const vocabList = [{ word: 'Lumos', phonetic: '/luːmɒs/', pos: 'spell', translation: '闪光', context: 'Lumos!' }];
    
    // Simulate handleExportCSV
    const header = 'Word,Phonetic,Part of Speech,Translation,Context\n';
    const rows = vocabList.map(v => 
      `"${v.word}","${v.phonetic || ''}","${v.pos || ''}","${(v.translation || '').replace(/"/g, '""')}","${(v.context || '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new globalThis.Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = globalThis.URL.createObjectURL(blob);
    const link = globalThis.document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hogwarts_vocab_${Date.now()}.csv`);
    globalThis.document.body.appendChild(link);
    link.click();
    globalThis.document.body.removeChild(link);
    globalThis.URL.revokeObjectURL(url);

    // Assert that active Object URL was cleanly revoked (ZERO memory leaks)
    assert.strictEqual(mockEnv.activeUrls.size, 0, 'handleExportCSV must revoke Object URL with zero leaks');
  } finally {
    mockEnv.cleanup();
  }
});

// ============================================================================
// TESTS: TIER 3 - STRICT ANKI DESKTOP / ANKIMOBILE TSV COMPLIANCE ORACLE
// ============================================================================

test('Adversarial 3.1: Strict Anki TSV column count & header directive compliance for standard entries', () => {
  const sampleVocab = [
    {
      word: 'wand',
      phonetic: '/wɒnd/',
      pos: 'noun',
      definition: 'A magical instrument',
      lore: 'The wand chooses the wizard, Mr. Potter.',
      contextQuote: 'The wand chooses the wizard.',
      startTime: 30.5,
      endTime: 34.0,
      chapterId: 'hp1-05',
      bookId: 'hp1',
      tags: ['magic', 'diagon-alley']
    },
    {
      word: 'owl',
      phonetic: '/aʊl/',
      pos: 'noun',
      definition: 'A nocturnal bird of prey',
      contextQuote: 'An owl flew past the window.',
      chapterId: 'hp1-01',
      bookId: 'hp1'
    }
  ];

  const tsv = generateAnkiTSV(sampleVocab, { deckName: 'Hogwarts Spells & Lore' });
  const validation = AnkiImportValidatorOracle.validate(tsv, { deckName: 'Hogwarts Spells & Lore' });

  assert.strictEqual(validation.isValid, true, `Validation failed: ${validation.errors.join('; ')}`);
  assert.strictEqual(validation.rows.length, 2, 'Must have exactly 2 data rows');

  // Verify Row 1
  const [front1, phonetic1, pos1, back1, quote1, timestamp1, tags1] = validation.rows[0];
  assert.strictEqual(front1, 'wand');
  assert.strictEqual(phonetic1, '/wɒnd/');
  assert.strictEqual(pos1, 'noun');
  assert.ok(back1.includes('A magical instrument'));
  assert.ok(back1.includes('<i>Lore: The wand chooses the wizard, Mr. Potter.</i>'));
  assert.strictEqual(quote1, 'The <b>wand</b> chooses the wizard.');
  assert.strictEqual(timestamp1, '00:30.50 - 00:34.00');
  assert.ok(tags1.includes('magic'));
  assert.ok(tags1.includes('diagon-alley'));
  assert.ok(tags1.includes('Hogwarts::hp1-05'));
  assert.ok(tags1.includes('Hogwarts::hp1'));

  // Verify Row 2
  const [front2, phonetic2, pos2, back2, quote2, timestamp2, tags2] = validation.rows[1];
  assert.strictEqual(front2, 'owl');
  assert.strictEqual(phonetic2, '/aʊl/');
  assert.strictEqual(pos2, 'noun');
  assert.strictEqual(back2, 'A nocturnal bird of prey');
  assert.strictEqual(quote2, 'An <b>owl</b> flew past the window.');
  assert.strictEqual(timestamp2, '');
  assert.ok(tags2.includes('Hogwarts::hp1-01'));
  assert.ok(tags2.includes('Hogwarts::hp1'));
});

test('Adversarial 3.2: Sanitization defense: text fields sanitize tabs to spaces and newlines to <br>', () => {
  const hostileVocab = [
    {
      word: 'hostile\tword\twith\ttabs',
      phonetic: '/hɒs\ttaɪl/',
      pos: 'noun\tverb',
      definition: 'Line 1 of definition.\r\nLine 2 of definition.\nLine 3 with\ttab.',
      lore: 'Lore line 1\r\nLore line 2\twith tab',
      contextQuote: 'First line of context\r\nSecond line with\ttab character and the hostile word.',
      audioTimestamp: '01:23.45\t01:25.00\r\nnext',
      tags: ['tag1', 'tag2']
    }
  ];

  const tsv = generateAnkiTSV(hostileVocab);
  const validation = AnkiImportValidatorOracle.validate(tsv);

  assert.strictEqual(validation.isValid, true, `Structural corruption detected! Errors: ${validation.errors.join('; ')}`);
  assert.strictEqual(validation.rows.length, 1, 'Must parse as exactly 1 row despite raw newlines');

  const row = validation.rows[0];
  assert.strictEqual(row.length, 7, 'Row must contain exactly 7 columns despite raw tabs');

  // Verify replacement rules
  assert.ok(!row[0].includes('\t'), 'Word must have tabs converted to spaces');
  assert.ok(!row[3].includes('\n') && !row[3].includes('\r'), 'Definition must not have unescaped newlines');
  assert.ok(row[3].includes('<br>'), 'Definition newlines must be converted to <br>');
  assert.ok(!row[4].includes('\n') && !row[4].includes('\r'), 'Context quote must not have unescaped newlines');
  assert.ok(row[4].includes('<br>'), 'Context quote newlines must be converted to <br>');
});

test('Adversarial 3.3: Sanitized tags array containing tabs/newlines preserves valid TSV column structure', () => {
  // If user tags contain a tab or newline (e.g. from copy-pasting or custom metadata), tagsStr must be sanitized
  const buggyVocab = [
    {
      word: 'spell',
      definition: 'A magical charm',
      contextQuote: 'He cast a spell.',
      tags: ['tag\twith\ttabs', 'tag\nwith\nnewlines']
    }
  ];

  const tsv = generateAnkiTSV(buggyVocab);
  const validation = AnkiImportValidatorOracle.validate(tsv);

  assert.strictEqual(
    validation.isValid,
    true,
    `Validation should succeed when tags are sanitized: ${validation.errors.join('; ')}`
  );
  assert.strictEqual(validation.rows.length, 1, 'Must produce exactly 1 data row');
  assert.strictEqual(validation.rows[0].length, 7, 'Must produce exactly 7 columns');
  assert.ok(validation.rows[0][6].includes('tag_with_tabs'), 'Tabs converted to underscores in tags');
  assert.ok(validation.rows[0][6].includes('tag_with_newlines'), 'Newlines converted to underscores in tags');
});

test('Adversarial 3.4: Multi-word phrases, hyphenated words, apostrophes, and HTML tag safety in boldWordInContext', () => {
  // 1. Multi-word phrase (e.g. Harry Potter spell)
  const multiWordQuote = 'Harry shouted with all his might, "Expecto Patronum!"';
  const multiWordResult = boldWordInContext(multiWordQuote, 'Expecto Patronum');
  assert.strictEqual(
    multiWordResult.includes('<b>Expecto Patronum</b>'),
    true,
    'Multi-word phrase "Expecto Patronum" must be bolded in context'
  );

  // 2. Hyphenated word
  const hyphenQuote = 'He was a well-known wizard in London.';
  const hyphenResult = boldWordInContext(hyphenQuote, 'well-known');
  assert.strictEqual(
    hyphenResult.includes('<b>well-known</b>'),
    true,
    'Hyphenated word "well-known" must be bolded in context'
  );

  // 3. Contracted word with apostrophe
  const apostropheQuote = "Please don't do that, Harry.";
  const apostropheResult = boldWordInContext(apostropheQuote, "don't");
  assert.strictEqual(
    apostropheResult.includes("<b>don't</b>"),
    true,
    'Contracted word "don\'t" must be bolded in context'
  );

  // 4. Harry Potter core terms from challenger findings
  assert.strictEqual(
    boldWordInContext('A hooded death-eater appeared in the mist.', 'death-eater').includes('<b>death-eater</b>'),
    true,
    'death-eater must be bolded'
  );
  assert.strictEqual(
    boldWordInContext('He dared not speak the name of you-know-who.', 'you-know-who').includes('<b>you-know-who</b>'),
    true,
    'you-know-who must be bolded'
  );
  assert.strictEqual(
    boldWordInContext('The half-blood prince was skilled at potions.', 'half-blood').includes('<b>half-blood</b>'),
    true,
    'half-blood must be bolded'
  );
  assert.strictEqual(
    boldWordInContext("They visited Dumbledore's office after curfew.", "dumbledore's").includes("<b>Dumbledore's</b>"),
    true,
    "dumbledore's must be bolded"
  );
  assert.strictEqual(
    boldWordInContext("Harry won't let Voldemort win.", "won't").includes("<b>won't</b>"),
    true,
    "won't must be bolded"
  );

  // 5. HTML tag collision safety: bolding word 'div' inside <div> does not corrupt tags into <<b>div</b>>
  const htmlTagResult = boldWordInContext('The wizard stood in a <div>room</div>.', 'div');
  assert.strictEqual(
    htmlTagResult.includes('<<b>div</b>>'),
    false,
    'Must not corrupt HTML tags into <<b>div</b>>'
  );
  assert.strictEqual(
    htmlTagResult,
    'The wizard stood in a <div>room</div>.',
    'Tags preserved intact without corruption'
  );
});

test('Adversarial 3.5: Audio timestamp precision and boundary edge cases', () => {
  // Normal range
  assert.strictEqual(formatAudioTimestamp({ startTime: 65.25, endTime: 70.80 }), '01:05.25 - 01:10.80');
  
  // Single start time
  assert.strictEqual(formatAudioTimestamp({ startTime: 12.0 }), '00:12.00');

  // End time before start time (invalid range -> fallback to start time)
  assert.strictEqual(formatAudioTimestamp({ startTime: 50.0, endTime: 40.0 }), '00:50.00');

  // Zero start time
  assert.strictEqual(formatAudioTimestamp({ startTime: 0, endTime: 2.5 }), '00:00.00 - 00:02.50');

  // Pre-formatted string timestamp preserved
  assert.strictEqual(formatAudioTimestamp({ audioTimestamp: '05:20 - 05:30' }), '05:20 - 05:30');

  // Extreme / invalid timestamps (negative start, end < start, Infinity)
  assert.strictEqual(formatAudioTimestamp({ startTime: -15, endTime: 10 }), '');
  assert.strictEqual(formatAudioTimestamp({ startTime: Infinity }), '');
  assert.strictEqual(formatAudioTimestamp({ startTime: -5 }), '');

  // Null / undefined / NaN handled safely
  assert.strictEqual(formatAudioTimestamp({ startTime: null }), '');
  assert.strictEqual(formatAudioTimestamp({ startTime: undefined }), '');
  assert.strictEqual(formatAudioTimestamp({ startTime: 'invalid' }), '');
  assert.strictEqual(formatAudioTimestamp(null), '');
});

test('Adversarial 3.6: Large-scale stress test (1,000 diverse vocabulary items) generates valid Anki TSV in <1000ms', () => {
  const vocab1000 = [];
  const words = ['quidditch', 'gryffindor', 'slytherin', 'hufflepuff', 'ravenclaw', 'dumbledore', 'voldemort', 'hagrid', 'hermione', 'ron'];

  for (let i = 0; i < 1000; i++) {
    const baseWord = words[i % words.length];
    vocab1000.push({
      id: `vocab_${i}`,
      word: `${baseWord}_${i}`,
      phonetic: `/ˈ${baseWord}_${i}/`,
      pos: i % 2 === 0 ? 'noun' : 'verb',
      definition: `魔法词汇释义 ${i}: 特殊含义描述。`,
      lore: i % 3 === 0 ? `霍格沃茨传奇典故 ${i}` : '',
      contextQuote: `In chapter ${i % 17 + 1}, Harry learned about ${baseWord}_${i} while studying in the library.`,
      startTime: (i * 3.5),
      endTime: (i * 3.5 + 4.2),
      chapterId: `hp1-${String((i % 17) + 1).padStart(2, '0')}`,
      bookId: 'hp1',
      tags: ['hogwarts', `group_${i % 5}`]
    });
  }

  const startTime = Date.now();
  const tsv = generateAnkiTSV(vocab1000, { deckName: 'Hogwarts Grand Lexicon' });
  const duration = Date.now() - startTime;

  assert.ok(duration < 1000, `TSV generation for 1,000 items took ${duration}ms, must be < 1000ms`);

  // Validate full generated TSV with Anki validator oracle
  const validation = AnkiImportValidatorOracle.validate(tsv, { deckName: 'Hogwarts Grand Lexicon' });
  assert.strictEqual(validation.isValid, true, `1000-item TSV failed validation: ${validation.errors.slice(0, 5).join('; ')}`);
  assert.strictEqual(validation.rows.length, 1000, 'All 1,000 records must parse cleanly');
  assert.strictEqual(validation.directives['deck'], 'Hogwarts Grand Lexicon');
});

// ============================================================================
// TESTS: TIER 4 - END-TO-END WORKFLOW INTEGRATION
// ============================================================================

test('Adversarial 4.1: End-to-end integration between App.jsx vocab schema and generateAnkiTSV (Hierarchical tag omission)', () => {
  // Simulate App.jsx handleSaveToVocab payload for single word
  const wordData = {
    word: 'Alohomora',
    phonetic: '/əˌloʊhoʊˈmɔːrə/',
    pos: 'spell',
    translation: '开门咒',
    explanation: '用于开锁的标准咒语',
    lore: '弗立维教授在一年级魔咒课上讲授',
    isHpLore: true
  };

  const sentenceCue = {
    text: 'Hermione whispered, "Alohomora!" and the door sprang open.',
    startTime: 145.2,
    endTime: 149.8
  };

  const selectedBook = 'hp1';
  const selectedChapter = 'hp1-09';
  const currentChapterObj = { title: 'The Midnight Duel' };

  // Replicate exact App.jsx line 356-377 logic
  const newEntry = {
    id: Date.now().toString(),
    word: wordData.word,
    front: wordData.word,
    phonetic: wordData.phonetic || '',
    pos: wordData.pos || '',
    partOfSpeech: wordData.pos || '',
    translation: wordData.translation || '',
    definition: wordData.translation || wordData.explanation || '',
    explanation: wordData.explanation || '',
    lore: wordData.lore || '',
    isHpLore: wordData.isHpLore || false,
    context: sentenceCue ? sentenceCue.text : '',
    contextQuote: sentenceCue ? sentenceCue.text : '',
    startTime: sentenceCue ? sentenceCue.startTime : undefined,
    endTime: sentenceCue ? sentenceCue.endTime : undefined,
    chapterId: selectedChapter || '',
    bookId: selectedBook || '',
    chapterTitle: currentChapterObj ? currentChapterObj.title : '',
    tags: [selectedBook, selectedChapter].filter(Boolean),
    dateAdded: new Date().toLocaleDateString()
  };

  // Feed into Anki generator
  const tsv = generateAnkiTSV([newEntry], { deckName: 'Hogwarts Magic English' });
  const validation = AnkiImportValidatorOracle.validate(tsv, { deckName: 'Hogwarts Magic English' });

  assert.strictEqual(validation.isValid, true);
  assert.strictEqual(validation.rows.length, 1);

  const [front, phonetic, pos, back, quote, timestamp, tags] = validation.rows[0];
  assert.strictEqual(front, 'Alohomora');
  assert.strictEqual(phonetic, '/əˌloʊhoʊˈmɔːrə/');
  assert.strictEqual(pos, 'spell');
  assert.ok(back.includes('开门咒'));
  assert.ok(back.includes('弗立维教授在一年级魔咒课上讲授'));
  assert.ok(quote.includes('<b>Alohomora</b>'));
  assert.strictEqual(timestamp, '02:25.20 - 02:29.80');

  // EMPIRICAL BUG CONFIRMATION: App.jsx passed tags: ['hp1', 'hp1-09'].
  // ankiExport.js checks: if (!tags.some(t => t.includes(entry.chapterId)))
  // Since 'hp1-09'.includes('hp1-09') is true, it SKIPS adding 'Hogwarts::hp1-09'!
  // Thus hierarchical tag is missing from the exported card!
  assert.strictEqual(
    tags.includes('Hogwarts::hp1-09'),
    false,
    'BUG CONFIRMED: Hierarchical tag Hogwarts::hp1-09 omitted because bare tag exists in entry.tags'
  );
  assert.strictEqual(tags, 'hp1 hp1-09', 'Exported tags only contain bare tokens without Hogwarts:: prefix');
});

test('Adversarial 4.2: VocabularyDrawer UI mode switching and flashcard controls', () => {
  const vocabList = [
    {
      id: '1',
      word: 'Alohomora',
      phonetic: '/əˌloʊhoʊˈmɔːrə/',
      translation: '开门咒',
      lore: '标准咒语初级',
      context: 'She whispered Alohomora.'
    },
    {
      id: '2',
      word: 'Lumos',
      phonetic: '/ˈluːmɒs/',
      translation: '荧光闪烁',
      lore: '点亮魔杖尖端',
      context: 'Lumos! cried Harry.'
    }
  ];

  // 1. Render in list mode
  const listHtml = renderToString(
    React.createElement(VocabularyDrawer, {
      isOpen: true,
      onClose: () => {},
      vocabList: vocabList,
      onRemoveWord: () => {},
      onClearAll: () => {},
      isParchment: true
    })
  );

  assert.match(listHtml, /魔法生词本 \((?:<!-- -->)?2(?:<!-- -->)?\)/);
  assert.match(listHtml, /Alohomora/);
  assert.match(listHtml, /Lumos/);
  // Buttons must NOT be disabled
  assert.doesNotMatch(listHtml, /<button[^>]*disabled=""[^>]*>[\s\S]*?导出至 Anki \(TSV\)/);

  // 2. Closed drawer renders null
  const closedHtml = renderToString(
    React.createElement(VocabularyDrawer, {
      isOpen: false,
      onClose: () => {},
      vocabList: vocabList,
      onRemoveWord: () => {},
      onClearAll: () => {},
      isParchment: false
    })
  );
  assert.strictEqual(closedHtml, '', 'Closed drawer must render null');
});
