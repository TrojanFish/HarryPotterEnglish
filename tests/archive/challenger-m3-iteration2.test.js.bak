/**
 * Challenger Stress-Testing Harness for Milestone 3 (Iteration 2)
 *
 * File: tests/challenger-m3-iteration2.test.js
 * Project: Hogwarts Audio Functional Expansion
 *
 * Adversarially stress-tests:
 * 1. Special regex characters in words (wand+core, accio?, *spell*, (potion), [charm], etc.)
 * 2. Words with apostrophes or hyphens (you-know-who, won't, death-eater, half-blood, dumbledore's, etc.)
 * 3. Words that match HTML tag names (div, span, b, i, strong) inside sentences containing HTML markup
 * 4. Hostile input with embedded tabs, newlines, and quotes across all schema fields
 * 5. Extreme timestamps (negative start, end < start, zero, Infinity, -Infinity, NaN, non-numeric)
 * 6. High volume batch test (1,000+ and 2,500+ items) measuring runtime and heap stability
 * 7. HTML tag boundary collision and nested tag preservation
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateAnkiTSV,
  downloadAnkiFile,
  sanitizeForTSV,
  boldWordInContext,
  formatAudioTimestamp
} from '../src/utils/ankiExport.js';

// ============================================================================
// ANKI IMPORT VALIDATOR ORACLE
// ============================================================================
class AnkiImportValidatorOracle {
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

      // Data row
      inHeader = false;
      const columns = line.split('\t');

      if (columns.length !== 7) {
        errors.push(
          `Line ${i + 1}: Expected exactly 7 columns, found ${columns.length}. Line sample: "${line.substring(0, 80)}"`
        );
      }

      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        const col = columns[colIdx];
        if (col.includes('\r')) {
          errors.push(`Line ${i + 1}, Col ${colIdx + 1}: Contains unescaped carriage return '\\r'`);
        }
      }

      rows.push(columns);
    }

    if (directives['separator'] !== 'Tab') {
      errors.push(`Invalid #separator: "${directives['separator']}"`);
    }
    if (directives['html'] !== 'true') {
      errors.push(`Invalid #html: "${directives['html']}"`);
    }
    if (directives['tags column'] !== '7') {
      errors.push(`Invalid #tags column: "${directives['tags column']}"`);
    }
    if (expectedOptions.deckName && directives['deck'] !== expectedOptions.deckName) {
      errors.push(`Deck mismatch: "${directives['deck']}" vs "${expectedOptions.deckName}"`);
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
// SUITE 1: SPECIAL REGEX CHARACTERS IN WORDS
// ============================================================================
test('Challenger 1.1: Special regex characters in vocabulary words bold properly without crashing regex engine', () => {
  const cases = [
    { word: 'wand+core', quote: 'The wand+core was made of dragon heartstring.', expected: 'The <b>wand+core</b> was made of dragon heartstring.' },
    { word: 'accio?', quote: 'Did he shout accio? before fleeing?', expected: 'Did he shout <b>accio?</b> before fleeing?' },
    { word: '*spell*', quote: 'Marked with a special *spell* in the book.', expected: 'Marked with a special <b>*spell*</b> in the book.' },
    { word: '(potion)', quote: 'He brewed the secret (potion) at midnight.', expected: 'He brewed the secret <b>(potion)</b> at midnight.' },
    { word: '[charm]', quote: 'An ancient [charm] guarded the entrance.', expected: 'An ancient <b>[charm]</b> guarded the entrance.' },
    { word: '^anchor$', quote: 'A magic ^anchor$ held the boat.', expected: 'A magic <b>^anchor$</b> held the boat.' },
    { word: '{incantation}', quote: 'Repeat the {incantation} three times.', expected: 'Repeat the <b>{incantation}</b> three times.' },
    { word: 'wand|staff', quote: 'Choose between a wand|staff for duel.', expected: 'Choose between a <b>wand|staff</b> for duel.' },
    { word: '\\back', quote: 'Stand \\back shouted the wizard.', expected: 'Stand <b>\\back</b> shouted the wizard.' },
    { word: '$100', quote: 'The rare broom cost $100 galleons.', expected: 'The rare broom cost <b>$100</b> galleons.' },
    { word: 'word.with.dots', quote: 'Found word.with.dots in old manuscript.', expected: 'Found <b>word.with.dots</b> in old manuscript.' }
  ];

  for (const c of cases) {
    const result = boldWordInContext(c.quote, c.word);
    assert.strictEqual(
      result,
      c.expected,
      `Failed bolding for regex word "${c.word}". Got: "${result}", Expected: "${c.expected}"`
    );
  }
});

test('Challenger 1.2: Special regex characters at sentence boundaries and surrounded by punctuation', () => {
  // Word at start of sentence
  assert.strictEqual(
    boldWordInContext('*spell* is cast.', '*spell*'),
    '<b>*spell*</b> is cast.'
  );

  // Word at end of sentence with period
  assert.strictEqual(
    boldWordInContext('He used wand+core.', 'wand+core'),
    'He used <b>wand+core</b>.'
  );

  // Word inside quotes
  assert.strictEqual(
    boldWordInContext('He said, "(potion)".', '(potion)'),
    'He said, "<b>(potion)</b>".'
  );
});

// ============================================================================
// SUITE 2: WORDS WITH APOSTROPHES OR HYPHENS
// ============================================================================
test('Challenger 2.1: Harry Potter canon hyphenated and apostrophized terms', () => {
  const cases = [
    { word: 'you-know-who', quote: 'He dared not speak the name of You-Know-Who in public.', expectedPattern: /<b>You-Know-Who<\/b>/i },
    { word: "won't", quote: "Harry won't surrender to the Dark Lord.", expectedPattern: /<b>won't<\/b>/i },
    { word: 'death-eater', quote: 'A masked death-eater vanished into thin air.', expectedPattern: /<b>death-eater<\/b>/i },
    { word: 'half-blood', quote: 'Severus was the half-blood prince.', expectedPattern: /<b>half-blood<\/b>/i },
    { word: "dumbledore's", quote: "They visited Dumbledore's office secretly.", expectedPattern: /<b>Dumbledore's<\/b>/i },
    { word: "o'clock", quote: "Meet me at eight o'clock tonight.", expectedPattern: /<b>o'clock<\/b>/i },
    { word: 'tri-wizard', quote: 'The tri-wizard tournament commenced in winter.', expectedPattern: /<b>tri-wizard<\/b>/i },
    { word: 'non-magic', quote: 'Muggles are non-magic folk.', expectedPattern: /<b>non-magic<\/b>/i },
    { word: "don't", quote: "Don't tickle a sleeping dragon.", expectedPattern: /<b>Don't<\/b>/i },
    { word: "can't", quote: "You can't apparate inside Hogwarts grounds.", expectedPattern: /<b>can't<\/b>/i },
    { word: "it's", quote: "It's time to enter the Great Hall.", expectedPattern: /<b>It's<\/b>/i }
  ];

  for (const c of cases) {
    const result = boldWordInContext(c.quote, c.word);
    assert.match(
      result,
      c.expectedPattern,
      `Expected "${c.word}" to be bolded in "${c.quote}", but got "${result}"`
    );
  }
});

test('Challenger 2.2: Multiple hyphens and nested possessives', () => {
  const multiHyphen = boldWordInContext('He cast an anti-anti-jinx spell.', 'anti-anti-jinx');
  assert.strictEqual(multiHyphen, 'He cast an <b>anti-anti-jinx</b> spell.');

  const possessive = boldWordInContext("The quaffle-keeper's glove was dropped.", "quaffle-keeper's");
  assert.strictEqual(possessive, "The <b>quaffle-keeper's</b> glove was dropped.");
});

// ============================================================================
// SUITE 3: WORDS MATCHING HTML TAG NAMES INSIDE HTML SENTENCES
// ============================================================================
test('Challenger 3.1: Words matching HTML tags do not corrupt tag syntax', () => {
  const htmlCases = [
    { word: 'div', quote: 'The wizard stood in a <div>room</div>.', expected: 'The wizard stood in a <div>room</div>.' },
    { word: 'span', quote: 'He held a <span class="magical">wand</span>.', expected: 'He held a <span class="magical">wand</span>.' },
    { word: 'b', quote: 'To <b>be</b> or not to <b>be</b>.', expected: 'To <b>be</b> or not to <b>be</b>.' },
    { word: 'i', quote: 'She saw an <i>owl</i> overhead.', expected: 'She saw an <i>owl</i> overhead.' },
    { word: 'p', quote: '<p>A paragraph of spells.</p>', expected: '<p>A paragraph of spells.</p>' },
    { word: 'strong', quote: 'Cast a <strong>strong</strong> shield.', expected: 'Cast a <strong><b>strong</b></strong> shield.' }
  ];

  for (const c of htmlCases) {
    const result = boldWordInContext(c.quote, c.word);
    assert.strictEqual(
      result,
      c.expected,
      `HTML collision test failed for word "${c.word}". Got: "${result}", Expected: "${c.expected}"`
    );
    assert.strictEqual(result.includes('<<b>'), false, `Corrupted opening tag found in "${result}"`);
    assert.strictEqual(result.includes('</<b>'), false, `Corrupted closing tag found in "${result}"`);
  }
});

test('Challenger 3.2: Tag name appears as legitimate text inside HTML elements', () => {
  // In: "<div>A div inside a container.</div>", word: "div"
  // The 'div' in the text content SHOULD be bolded, while the <div> tag tags MUST remain untouched!
  const quote = '<div>A div inside a container.</div>';
  const result = boldWordInContext(quote, 'div');
  assert.strictEqual(
    result,
    '<div>A <b>div</b> inside a container.</div>',
    `Expected text 'div' to be bolded without corrupting enclosing <div> tag. Got: "${result}"`
  );
});

// ============================================================================
// SUITE 4: HOSTILE INPUT (EMBEDDED TABS, NEWLINES, QUOTES IN ALL FIELDS)
// ============================================================================
test('Challenger 4.1: Hostile injection across word, tags, phonetic, definition, quote, chapterId, and bookId', () => {
  const hostileEntry = {
    word: 'hostile\tword\nwith\r\nnewlines and "quotes"',
    phonetic: '/\thɒs\ttaɪl\n/\r\n',
    partOfSpeech: 'noun\tverb\nadj',
    definition: 'Line 1\twith tab\r\nLine 2\nLine 3 with "double quotes"',
    lore: 'Lore line 1\twith tab\r\nLore line 2',
    contextQuote: 'First quote line\twith tab\r\nSecond quote line with "quotes" and hostile word.',
    audioTimestamp: '01:23.45\t01:25.00\r\nnext',
    chapterId: 'hp1\t01\ncorrupted\r\nline',
    bookId: 'hp1\tbook\ncorrupted',
    tags: ['tag\t1', 'tag\n2', 'tag\r\n3', 'tag with "quotes"']
  };

  const tsv = generateAnkiTSV([hostileEntry], { deckName: 'Hostile Deck\tName' });
  const validation = AnkiImportValidatorOracle.validate(tsv, { deckName: 'Hostile Deck\tName' });

  assert.strictEqual(
    validation.isValid,
    true,
    `Hostile input broke TSV structure: ${validation.errors.join('; ')}`
  );

  // Exactly 1 data row must be produced
  assert.strictEqual(validation.rows.length, 1, 'Single hostile entry must produce exactly 1 TSV data row');
  
  const [front, phonetic, pos, back, quote, timestamp, tags] = validation.rows[0];

  // Exactly 7 columns
  assert.strictEqual(validation.rows[0].length, 7, 'Row must have exactly 7 columns');

  // Verify no raw tabs in front, phonetic, pos, back, quote, timestamp
  assert.strictEqual(front.includes('\t'), false, 'Front must not contain raw tabs');
  assert.strictEqual(phonetic.includes('\t'), false, 'Phonetic must not contain raw tabs');
  assert.strictEqual(pos.includes('\t'), false, 'PartOfSpeech must not contain raw tabs');
  assert.strictEqual(back.includes('\t'), false, 'Back must not contain raw tabs');
  assert.strictEqual(quote.includes('\t'), false, 'ContextQuote must not contain raw tabs');
  assert.strictEqual(timestamp.includes('\t'), false, 'AudioTimestamp must not contain raw tabs');

  // Verify no raw newlines or carriage returns in any field
  for (let i = 0; i < 7; i++) {
    assert.strictEqual(validation.rows[0][i].includes('\n'), false, `Column ${i + 1} contains unescaped newline`);
    assert.strictEqual(validation.rows[0][i].includes('\r'), false, `Column ${i + 1} contains unescaped carriage return`);
  }

  // Tags column must be clean
  assert.strictEqual(tags.includes('\t'), false, 'Tags must not contain raw tabs');
  assert.strictEqual(tags.includes('\n'), false, 'Tags must not contain raw newlines');
});

test('Challenger 4.2: Tags given as messy string with tabs, newlines, and multiple spaces', () => {
  const entry = {
    word: 'accio',
    tags: '  tag1\t\ttag2\ntag3\r\ntag4   tag5  '
  };

  const tsv = generateAnkiTSV([entry]);
  const validation = AnkiImportValidatorOracle.validate(tsv);

  assert.strictEqual(validation.isValid, true);
  assert.strictEqual(validation.rows.length, 1);
  const tagsCol = validation.rows[0][6];
  assert.strictEqual(tagsCol.includes('\t'), false);
  assert.strictEqual(tagsCol.includes('\n'), false);
  assert.strictEqual(tagsCol, 'tag1 tag2 tag3 tag4 tag5');
});

// ============================================================================
// SUITE 5: EXTREME AND MALFORMED TIMESTAMPS
// ============================================================================
test('Challenger 5.1: Negative, non-finite, inverted, and malformed timestamps produce safe output', () => {
  // Negative start
  assert.strictEqual(formatAudioTimestamp({ startTime: -15 }), '');
  assert.strictEqual(formatAudioTimestamp({ startTime: -0.01 }), '');
  assert.strictEqual(formatAudioTimestamp({ startTime: -15, endTime: 10 }), '');

  // End < start
  assert.strictEqual(formatAudioTimestamp({ startTime: 50, endTime: 40 }), '00:50.00');

  // Zero start
  assert.strictEqual(formatAudioTimestamp({ startTime: 0, endTime: 5.5 }), '00:00.00 - 00:05.50');
  assert.strictEqual(formatAudioTimestamp({ startTime: 0, endTime: 0 }), '00:00.00');

  // Non-finite values
  assert.strictEqual(formatAudioTimestamp({ startTime: Infinity }), '');
  assert.strictEqual(formatAudioTimestamp({ startTime: -Infinity }), '');
  assert.strictEqual(formatAudioTimestamp({ startTime: 10, endTime: Infinity }), '00:10.00');
  assert.strictEqual(formatAudioTimestamp({ startTime: NaN }), '');
  assert.strictEqual(formatAudioTimestamp({ startTime: 10, endTime: NaN }), '00:10.00');

  // Non-numeric strings and booleans
  assert.strictEqual(formatAudioTimestamp({ startTime: 'invalid' }), '');
  assert.strictEqual(formatAudioTimestamp({ startTime: '12.5abc' }), '');
  assert.strictEqual(formatAudioTimestamp({ startTime: true }), '00:01.00'); // Number(true) is 1.0
  assert.strictEqual(formatAudioTimestamp({ startTime: false }), '00:00.00'); // Number(false) is 0.0

  // Null, undefined, empty object
  assert.strictEqual(formatAudioTimestamp(null), '');
  assert.strictEqual(formatAudioTimestamp(undefined), '');
  assert.strictEqual(formatAudioTimestamp({}), '');

  // Pre-formatted string timestamp with tabs/newlines
  assert.strictEqual(formatAudioTimestamp({ audioTimestamp: '01:00\t-\n02:00' }), '01:00 -<br>02:00');
});

// ============================================================================
// SUITE 6: HIGH VOLUME BATCH STRESS & MEMORY STABILITY
// ============================================================================
test('Challenger 6.1: High volume batch stress test (1,500 diverse items)', () => {
  const batch = [];
  const words = [
    'wand+core', 'you-know-who', 'accio?', 'death-eater', 'div',
    '*spell*', 'half-blood', 'span', "dumbledore's", '(potion)'
  ];

  for (let i = 0; i < 1500; i++) {
    const w = words[i % words.length];
    batch.push({
      id: `stress_${i}`,
      word: w,
      phonetic: `/${w}/`,
      pos: 'noun',
      definition: `Definition of ${w} for item #${i}\nwith line break\tand tab`,
      lore: i % 4 === 0 ? `Lore for ${w} #${i}` : '',
      contextQuote: `During chapter ${i % 20}, Harry encountered ${w} in a <div>chamber</div> with\ttabs and\nnewlines.`,
      startTime: (i * 2.1) % 3600,
      endTime: ((i * 2.1) % 3600) + 3.5,
      chapterId: `hp1-${(i % 17) + 1}`,
      bookId: 'hp1',
      tags: ['stress-test', `batch_${i % 10}`, 'tag\twith\ttab']
    });
  }

  const memBefore = process.memoryUsage().heapUsed;
  const startTimer = performance.now();

  const tsv = generateAnkiTSV(batch, { deckName: 'Hogwarts Ultra Stress Deck' });

  const durationMs = performance.now() - startTimer;
  const memAfter = process.memoryUsage().heapUsed;
  const heapDeltaMb = (memAfter - memBefore) / (1024 * 1024);

  // Runtime threshold: 1,500 items must be generated in under 1,500ms
  assert.ok(
    durationMs < 1500,
    `Batch generation for 1,500 items took ${durationMs.toFixed(2)}ms (must be < 1500ms)`
  );

  // Memory threshold: heap delta should not explode (< 50MB)
  assert.ok(
    heapDeltaMb < 50,
    `Batch memory consumption was ${heapDeltaMb.toFixed(2)} MB (must be < 50MB)`
  );

  // Oracle validation on full 1,500 row dataset
  const validation = AnkiImportValidatorOracle.validate(tsv, { deckName: 'Hogwarts Ultra Stress Deck' });
  assert.strictEqual(
    validation.isValid,
    true,
    `Validation errors in 1500-item batch: ${validation.errors.slice(0, 5).join('; ')}`
  );
  assert.strictEqual(validation.rows.length, 1500, 'Must produce exactly 1,500 parsed rows');

  // Verify sample row formatting
  const sampleRow = validation.rows[0]; // word: wand+core
  assert.strictEqual(sampleRow.length, 7);
  assert.strictEqual(sampleRow[0], 'wand+core');
  assert.ok(sampleRow[4].includes('<b>wand+core</b>'));
  assert.strictEqual(sampleRow[4].includes('<<b>'), false);
});

test('Challenger 6.2: Saturated Stress Test (2,500 items) for linear scaling', () => {
  const batch2500 = [];
  for (let i = 0; i < 2500; i++) {
    batch2500.push({
      word: `lumos_${i}`,
      definition: `Light spell variation ${i}`,
      contextQuote: `Lumos_${i} illuminated the dark corridor.`
    });
  }

  const start = performance.now();
  const tsv = generateAnkiTSV(batch2500);
  const duration = performance.now() - start;

  assert.ok(
    duration < 2500,
    `2,500 items took ${duration.toFixed(2)}ms, scaling should be roughly linear (< 2500ms)`
  );

  const validation = AnkiImportValidatorOracle.validate(tsv);
  assert.strictEqual(validation.isValid, true);
  assert.strictEqual(validation.rows.length, 2500);
});
