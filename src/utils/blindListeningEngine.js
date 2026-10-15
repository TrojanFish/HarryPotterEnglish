/**
 * blindListeningEngine.js — Hogwarts Magic Blind Listening Scaffolding Engine
 * Powers the "魔法磨耳朵" auditory decoding workout gym:
 * - Keyword Radar: extracts 1~2 vocabulary anchors without spoiling sentence grammar
 * - Sentence metrics calculation (word count & duration)
 * - Self-assessment mastery rate calculations
 */

import { HP_LORE_DICTIONARY } from '../data/hpDictionary.js';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'am',
  'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
  'does', 'did', 'he', 'she', 'it', 'they', 'we', 'you', 'i', 'his', 'her',
  'its', 'their', 'our', 'your', 'my', 'him', 'them', 'us', 'me', 'that',
  'this', 'these', 'those', 'as', 'so', 'than', 'too', 'very', 'can', 'could',
  'will', 'would', 'just', 'should', 'now', 'then', 'there', 'here', 'out',
  'not', 'no', 'what', 'who', 'how', 'when', 'where', 'why', 'all', 'any',
  'some', 'one', 'two', 'like', 'said', 'back', 'down', 'well', 'come', 'came'
]);

function isDictionaryMatch(word, dictionary) {
  if (!dictionary || !word) return false;
  if (dictionary[word]) return true;
  if (word.endsWith('s') && dictionary[word.slice(0, -1)]) return true;
  if (word.endsWith('es') && dictionary[word.slice(0, -2)]) return true;
  if (word.endsWith('ed') && dictionary[word.slice(0, -1)]) return true;
  if (word.endsWith('ed') && dictionary[word.slice(0, -2)]) return true;
  if (word.endsWith('ing') && dictionary[word.slice(0, -3)]) return true;
  return false;
}

/**
 * Extracts 1~2 key vocabulary anchors for auditory focus
 * @param {string} text - Raw English sentence text
 * @param {Record<string, any>} [dictionary] - Optional HP dictionary override
 * @returns {Array<{ word: string, isHpLore: boolean }>} Top 1~2 radar focus words
 */
export function extractKeywordRadar(text = '', dictionary = HP_LORE_DICTIONARY) {
  if (!text || typeof text !== 'string') return [];

  // Split into raw words preserving case
  const rawWords = text.match(/[a-zA-Z'’-]+/g) || [];
  const candidates = [];
  const seen = new Set();

  for (const raw of rawWords) {
    const clean = raw.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length < 4 || STOP_WORDS.has(clean) || seen.has(clean)) continue;
    seen.add(clean);

    const isHpLore = isDictionaryMatch(clean, dictionary);
    let score = clean.length;
    if (isHpLore) score += 30; // High priority for Hogwarts lore & magic terms

    candidates.push({
      word: raw,
      clean,
      isHpLore,
      score
    });
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, 2).map(({ word, isHpLore }) => ({
    word,
    isHpLore
  }));
}

/**
 * Formats sentence metrics (word count & duration in seconds)
 * @param {object} cue - VTT cue object with text, startTime, endTime
 * @returns {{ wordCount: number, durationSeconds: number, label: string }}
 */
export function formatSentenceMetrics(cue = {}) {
  const text = cue.text || '';
  const words = (text.match(/[a-zA-Z'’-]+/g) || []).length;
  const start = typeof cue.startTime === 'number' ? cue.startTime : 0;
  const end = typeof cue.endTime === 'number' ? cue.endTime : start;
  const duration = Math.max(0, end - start);
  const durationLabel = duration > 0 ? `${duration.toFixed(1)}s` : '';

  return {
    wordCount: words,
    durationSeconds: duration,
    label: durationLabel ? `${words} 词 · ${durationLabel}` : `${words} 词`
  };
}

/**
 * Calculates blind listening mastery percentage
 * @param {number} masteredCount - Number of sentences marked "听懂了"
 * @param {number} totalReviewed - Number of sentences self-assessed
 * @returns {number} Percentage 0 - 100
 */
export function calculateBlindMastery(masteredCount = 0, totalReviewed = 0) {
  if (totalReviewed <= 0) return 100;
  return Math.round((masteredCount / totalReviewed) * 100);
}
