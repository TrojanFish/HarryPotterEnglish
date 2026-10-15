/**
 * Adversarial Stress & Empirical Challenge Suite for R1 Speech Scoring Engine
 * File: tests/speechScoring_stress.test.js
 *
 * Challenges:
 * 1. Extreme sentence lengths (100, 250, 500 words) & latency bounds (<50ms normal, <2000ms extreme)
 * 2. Massive stuttering, repeats, and insertions (50x repeats, random filler storms)
 * 3. Weird unicode punctuation, symbols, emojis, zero-width chars, mixed scripts
 * 4. Score normalization bounds strictly [0, 100] and word statuses strictly valid
 * 5. Type safety & adversarial malformed inputs
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  evaluatePronunciation, 
  levenshteinDistance, 
  soundex, 
  cleanWord, 
  compareWords,
  isSpeechRecognitionSupported
} from '../src/utils/speechScoring.js';

// Helper validator for PronunciationResult contract
function assertValidPronunciationResult(result, expectedLength = null) {
  assert.strictEqual(typeof result, 'object', 'Result must be an object');
  assert.strictEqual(typeof result.score, 'number', 'Score must be a number');
  assert.ok(!Number.isNaN(result.score), 'Score must not be NaN');
  assert.ok(result.score >= 0, `Score must be >= 0, got ${result.score}`);
  assert.ok(result.score <= 100, `Score must be <= 100, got ${result.score}`);
  assert.strictEqual(Math.round(result.score), result.score, 'Score must be an integer');

  assert.ok(Array.isArray(result.words), 'Words must be an array');
  if (expectedLength !== null) {
    assert.strictEqual(result.words.length, expectedLength, `Words length must be ${expectedLength}`);
  }

  for (const w of result.words) {
    assert.strictEqual(typeof w.word, 'string', 'Word must be string');
    assert.ok(
      ['matched', 'partial', 'inaccurate'].includes(w.status),
      `Invalid word status: ${w.status}`
    );
    assert.ok(
      [0.0, 0.6, 1.0].includes(w.score),
      `Word score must be 0.0, 0.6, or 1.0, got ${w.score}`
    );
  }

  assert.strictEqual(typeof result.transcript, 'string', 'Transcript must be a string');
  assert.strictEqual(typeof result.isFallback, 'boolean', 'isFallback must be boolean');
  assert.strictEqual(typeof result.latencyMs, 'number', 'latencyMs must be number');
  assert.ok(result.latencyMs >= 0, 'latencyMs must be >= 0');
}

// ============================================================================
// SUITE 1: Extreme Sentence Lengths & Latency SLA (<50ms normal, <2000ms extreme)
// ============================================================================

test('Challenge 1.1: Standard sentence (10-25 words) latency is strictly < 50ms', () => {
  const sentence = 'Mr and Mrs Dursley of number four Privet Drive were proud to say that they were perfectly normal thank you very much.';
  
  // Warmup run
  evaluatePronunciation(sentence, sentence);

  // Measure 10 runs for statistical confidence
  const times = [];
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    const res = evaluatePronunciation(sentence, sentence);
    const duration = performance.now() - t0;
    times.push(duration);
    assertValidPronunciationResult(res, 22);
    assert.strictEqual(res.score, 100);
  }

  const avgLatency = times.reduce((a, b) => a + b, 0) / times.length;
  const maxLatency = Math.max(...times);

  console.log(`[Perf 1.1] 22 words: avg=${avgLatency.toFixed(2)}ms, max=${maxLatency.toFixed(2)}ms`);
  assert.ok(avgLatency < 50, `Average latency (${avgLatency}ms) exceeded 50ms SLA`);
  assert.ok(maxLatency < 50, `Max latency (${maxLatency}ms) exceeded 50ms SLA`);
});

test('Challenge 1.2: Long sentence (100 words) latency is strictly < 2000ms', () => {
  const vocab = ['harry', 'potter', 'wand', 'gryffindor', 'spell', 'castle', 'quidditch', 'hogwarts', 'dumbledore', 'snitch'];
  const words100 = Array.from({ length: 100 }, (_, i) => vocab[i % vocab.length]).join(' ');

  const t0 = performance.now();
  const res = evaluatePronunciation(words100, words100);
  const duration = performance.now() - t0;

  console.log(`[Perf 1.2] 100 words: ${duration.toFixed(2)}ms, internal latencyMs: ${res.latencyMs}ms`);
  assertValidPronunciationResult(res, 100);
  assert.strictEqual(res.score, 100);
  assert.ok(duration < 2000, `Execution took ${duration}ms, strictly required < 2000ms`);
});

test('Challenge 1.3: Scaled sentence (250 words) latency is strictly < 2000ms', () => {
  const vocab = ['albus', 'severus', 'minerva', 'ronald', 'hermione', 'hagrid', 'draco', 'voldemort', 'phoenix', 'patronus'];
  const words250 = Array.from({ length: 250 }, (_, i) => vocab[i % vocab.length]).join(' ');

  const t0 = performance.now();
  const res = evaluatePronunciation(words250, words250);
  const duration = performance.now() - t0;

  console.log(`[Perf 1.3] 250 words: ${duration.toFixed(2)}ms, internal latencyMs: ${res.latencyMs}ms`);
  assertValidPronunciationResult(res, 250);
  assert.strictEqual(res.score, 100);
  assert.ok(duration < 2000, `Execution took ${duration}ms, strictly required < 2000ms`);
});

test('Challenge 1.4: Extreme sentence (500 words) latency stress', () => {
  const vocab = ['magic', 'cauldron', 'potion', 'parseltongue', 'hufflepuff', 'ravenclaw', 'slytherin', 'horcrux', 'diadem', 'locket'];
  const words500 = Array.from({ length: 500 }, (_, i) => vocab[i % vocab.length]).join(' ');

  const t0 = performance.now();
  const res = evaluatePronunciation(words500, words500);
  const duration = performance.now() - t0;

  console.log(`[Perf 1.4] 500 words: ${duration.toFixed(2)}ms, internal latencyMs: ${res.latencyMs}ms`);
  assertValidPronunciationResult(res, 500);
  assert.strictEqual(res.score, 100);
  assert.ok(duration < 2000, `500 words took ${duration}ms, must be < 2000ms`);
});

test('Challenge 1.5: Asymmetric length stress (10 target words vs 400 spoken words)', () => {
  const target = 'Harry Potter picked up his wand and cast a spell';
  const fillers = Array.from({ length: 400 }, () => 'um').join(' ');
  const spoken = `um um Harry um Potter um picked um up um his um wand um and um cast um a um spell ${fillers}`;

  const t0 = performance.now();
  const res = evaluatePronunciation(target, spoken);
  const duration = performance.now() - t0;

  console.log(`[Perf 1.5] 10 vs 400+ words: ${duration.toFixed(2)}ms`);
  assertValidPronunciationResult(res, 10);
  assert.ok(duration < 2000, `Asymmetric took ${duration}ms, must be < 2000ms`);
  assert.strictEqual(res.score, 100, 'All target words should align despite 400 filler words');
});

test('Challenge 1.6: Asymmetric length stress (400 target words vs 10 spoken words)', () => {
  const vocab = ['hogwarts', 'express', 'platform', 'nine', 'three', 'quarters', 'train', 'kings', 'cross', 'london'];
  const target = Array.from({ length: 400 }, (_, i) => vocab[i % vocab.length]).join(' ');
  const spoken = 'hogwarts express platform london';

  const t0 = performance.now();
  const res = evaluatePronunciation(target, spoken);
  const duration = performance.now() - t0;

  console.log(`[Perf 1.6] 400 vs 4 words: ${duration.toFixed(2)}ms`);
  assertValidPronunciationResult(res, 400);
  assert.ok(duration < 2000, `Took ${duration}ms, must be < 2000ms`);
  assert.ok(res.score <= 5, `Expected score <= 5%, got ${res.score}%`);
});

// ============================================================================
// SUITE 2: Massive Stuttering, Repeats, and Insertion Attacks
// ============================================================================

test('Challenge 2.1: Massive word stuttering (each word repeated 5-10 times)', () => {
  const target = 'Wingardium Leviosa make the feather fly';
  const spoken = 'Wingardium Wingardium Wingardium Wingardium Leviosa Leviosa Leviosa make make feather feather feather fly fly fly';

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res, 6);

  // 'Wingardium', 'Leviosa', 'make', 'feather', 'fly' should match; 'the' was omitted
  const matched = res.words.filter(w => w.status === 'matched').map(w => w.word);
  assert.ok(matched.includes('Wingardium'));
  assert.ok(matched.includes('Leviosa'));
  assert.ok(matched.includes('make'));
  assert.ok(matched.includes('feather'));
  assert.ok(matched.includes('fly'));
  assert.ok(res.score >= 70, `Expected score >= 70, got ${res.score}`);
});

test('Challenge 2.2: Stuttering with 50 repeated filler words interspersed', () => {
  const target = 'Expecto Patronum';
  const filler50 = Array.from({ length: 50 }, () => 'ah').join(' ');
  const spoken = `${filler50} Expecto ${filler50} Patronum ${filler50}`;

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res, 2);
  assert.strictEqual(res.score, 100, 'Expecto and Patronum should both align and match');
  assert.strictEqual(res.words[0].status, 'matched');
  assert.strictEqual(res.words[1].status, 'matched');
});

test('Challenge 2.3: Spoken sentence repeats the entire sentence 3 times', () => {
  const target = 'It does not do to dwell on dreams and forget to live';
  const spoken = `${target} ${target} ${target}`;

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res, 12);
  assert.strictEqual(res.score, 100);
  for (const w of res.words) {
    assert.strictEqual(w.status, 'matched');
  }
});

test('Challenge 2.4: Reversed word order in spoken speech', () => {
  const target = 'the boy who lived';
  const spoken = 'lived who boy the';

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res, 4);
  // Monotonic sequence alignment will align at most one or two non-crossing words
  assert.ok(res.score < 100, 'Reversed sentence should not be 100%');
});

// ============================================================================
// SUITE 3: Weird Unicode, Punctuation, Symbols, Emojis, Mixed Scripts
// ============================================================================

test('Challenge 3.1: Heavy symbol decoration in target and spoken', () => {
  const target = '*** Harry Potter +++ defeated === Voldemort ###';
  const spoken = 'Harry Potter defeated Voldemort';

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res);
  // Pure symbol tokens become punct tokens (score 1.0) and words match
  assert.strictEqual(res.score, 100);
});

test('Challenge 3.2: Spoken text containing symbols and punctuation', () => {
  const target = 'Severus Snape brewed a tricky potion';
  const spoken = 'Severus *** Snape +++ brewed ### a === tricky !!! potion';

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res, 6);
  assert.strictEqual(res.score, 100, 'Extra symbols in spoken should be skipped as insertions');
});

test('Challenge 3.3: Strange unicode punctuation (smart quotes, em/en-dashes, ellipses, guillemets, inverted punct)', () => {
  const target = '«¿¡“Hermione’s—clever…book”!?»';
  const spoken = "Hermione's clever book";

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res);
  assert.ok(res.score >= 50, `Expected score >= 50, got ${res.score}`);
});

test('Challenge 3.4: Zero-width spaces, non-breaking spaces, and exotic whitespace', () => {
  const target = 'Ron\u200BWeasley\u00A0ate\u2002chocolate\u2003frogs';
  const spoken = 'Ron Weasley ate chocolate frogs';

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res);
  assert.ok(res.score > 0, `Expected score > 0, got ${res.score}`);
});

test('Challenge 3.5: Accented and diacritical characters (French, German, Spanish)', () => {
  const target = 'Fleur Delacour drank café au lait with gemütlich señorita';
  const spoken = 'fleur delacour drank cafe au lait with gemutlich senorita';

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res, 9);
  // Should match or be partial sound-alike
  assert.ok(res.score >= 80, `Expected score >= 80, got ${res.score}`);
});

test('Challenge 3.6: Non-Latin scripts (Cyrillic, CJK, Arabic, Math symbols)', () => {
  const target = '∑(x) + ∫f(x)dx = 42';
  const spoken = 'sum of x equals 42';

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res);
  assert.ok(res.score >= 0 && res.score <= 100);
});

test('Challenge 3.7: CJK characters mixed into target', () => {
  const target = 'Harry Potter 哈利波特 and the Sorcerer Stone';
  const spoken = 'Harry Potter and the Sorcerer Stone';

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res);
  assert.ok(res.score >= 80, `Expected high score, got ${res.score}`);
});

// ============================================================================
// SUITE 4: Contraction & British/American Spelling Edge Cases
// ============================================================================

test('Challenge 4.1: Multi-contraction expansion and compression in a single sentence', () => {
  const target = "You'd better know that we'd have won if you'd listened";
  const spoken = "You would better know that we would have won if you would listened";

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res, 10);
  assert.strictEqual(res.score, 100, "All 1-to-2 contractions ('you would', 'we would') should resolve to 100%");
});

test('Challenge 4.2: Reverse contraction: target expanded, spoken contracted', () => {
  const target = "They did not believe that he was not guilty";
  const spoken = "They didn't believe that he wasn't guilty";

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res, 9);
  assert.strictEqual(res.score, 100, "2-to-1 contractions ('did not' -> didn't, 'was not' -> wasn't) should resolve to 100%");
});

test('Challenge 4.3: Mixed British-American spelling & digit equivalences', () => {
  const target = 'In 4 hours the travelling theatre showed grey colour in centre';
  const spoken = 'In four hours the traveling theater showed gray color in center';

  const res = evaluatePronunciation(target, spoken);
  assertValidPronunciationResult(res, 11);
  assert.strictEqual(res.score, 100, 'UK/US spellings and digits/words should achieve 100%');
});

// ============================================================================
// SUITE 5: Score Normalization Bounds & Robustness Under Adversarial Inputs
// ============================================================================

test('Challenge 5.1: Boundary values: score is never < 0 and never > 100', () => {
  const testCases = [
    ['', ''],
    ['', 'something spoken'],
    ['target sentence here', ''],
    ['   ', '   '],
    ['a', 'b'],
    ['a b c d e', 'a b c d e'],
    ['!@#$%^&*()_+', '!@#$%^&*()_+'],
    ['word', 'word '.repeat(50)],
    ['word '.repeat(50), 'word'],
    ['completely unrelated gibberish xyz123', 'avada kedavra']
  ];

  for (const [target, spoken] of testCases) {
    const res = evaluatePronunciation(target, spoken);
    assertValidPronunciationResult(res);
    assert.ok(res.score >= 0, `Score must be >= 0, was ${res.score} for [${target}] / [${spoken}]`);
    assert.ok(res.score <= 100, `Score must be <= 100, was ${res.score} for [${target}] / [${spoken}]`);
  }
});

test('Challenge 5.2: Falsy and nullish inputs handled safely without throwing', () => {
  const safeInputs = [null, undefined, '', '   '];

  for (const badTarget of safeInputs) {
    const res = evaluatePronunciation(badTarget, 'hello');
    assertValidPronunciationResult(res);
    assert.strictEqual(res.score, 0);
  }

  for (const badSpoken of safeInputs) {
    const res = evaluatePronunciation('hello world', badSpoken);
    assertValidPronunciationResult(res);
    assert.strictEqual(res.score, 0);
    assert.strictEqual(res.isFallback, true);
  }
});

test('Challenge 5.3: Extremely long single token (e.g. 500 chars no spaces)', () => {
  const longToken = 'supercalifragilisticexpialidocious'.repeat(15); // ~510 chars
  const t0 = performance.now();
  const res = evaluatePronunciation(longToken, longToken);
  const duration = performance.now() - t0;

  console.log(`[Perf 5.3] 500-char token: ${duration.toFixed(2)}ms`);
  assertValidPronunciationResult(res, 1);
  assert.strictEqual(res.score, 100);
  assert.ok(duration < 2000, `Long token took ${duration}ms, must be < 2000ms`);
});

test('Challenge 5.4: Phonetic soundex and homophone equivalence correctness', () => {
  // Test phonetic soundex pairs
  assert.strictEqual(soundex('Robert'), 'R163');
  assert.strictEqual(soundex('Rupert'), 'R163');
  assert.strictEqual(soundex('Harry'), soundex('Hairy'), 'Harry and Hairy share Soundex H600');
  assert.strictEqual(soundex('Smith'), soundex('Smyth'), 'Smith and Smyth share Soundex S530');

  // Verify compareWords handles homophones through EQUIVALENCES or soundex
  const comp1 = compareWords('knight', 'night');
  assert.strictEqual(comp1.status, 'matched', 'knight and night match via EQUIVALENCES');
  assert.strictEqual(comp1.score, 1.0);

  const comp2 = compareWords('witch', 'which');
  assert.strictEqual(comp2.status, 'matched', 'witch and which match via EQUIVALENCES');
  assert.strictEqual(comp2.score, 1.0);

  const comp3 = compareWords('harry', 'hairy');
  assert.strictEqual(comp3.status, 'partial', 'harry and hairy match as partial sound-alike');
  assert.strictEqual(comp3.score, 0.6);
});

test('Challenge 5.5: Levenshtein distance boundary properties', () => {
  assert.strictEqual(levenshteinDistance('', ''), 0);
  assert.strictEqual(levenshteinDistance('a', ''), 1);
  assert.strictEqual(levenshteinDistance('', 'a'), 1);
  assert.strictEqual(levenshteinDistance('abc', 'abc'), 0);
  assert.strictEqual(levenshteinDistance('abc', 'def'), 3);
  assert.strictEqual(levenshteinDistance('abc', 'ab'), 1);
  assert.strictEqual(levenshteinDistance('ab', 'abc'), 1);
});
