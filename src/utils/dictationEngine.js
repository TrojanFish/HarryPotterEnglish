/**
 * dictationEngine.js
 * Hogwarts Spell Quest Core Game Engine
 * 
 * Provides algorithmic support for 4 difficulty levels:
 * 1. Accio Word Scramble: Splits target sentence into clickable word chips + realistic distractors.
 * 2. Lumos Cloze Masking: Identifies function words vs content/magical words for smart blanking.
 * 3. Auror & Dueling Evaluation: Calculates accuracy, streak bonuses, and house point awards.
 */

import { tokenizeSentence } from './vttParser.js';

// Common English function words (prepositions, articles, pronouns, conjunctions, aux verbs)
// In Cloze mode (Lumos), these are left visible so students focus on content vocabulary!
export const FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'and', 'or', 'but', 'nor', 'so', 'yet', 'as', 'if', 'when', 'than',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'ours', 'theirs',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'have', 'has', 'had', 'having',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'this', 'that', 'these', 'those', 'there', 'here', 'what', 'who', 'which', 'where', 'how'
]);

// Curated Harry Potter & Classical story distractor vocabulary pool
export const DISTRACTOR_POOL = [
  'wand', 'cloak', 'spell', 'castle', 'owl', 'feather', 'potion', 'cauldron',
  'broom', 'magic', 'wizard', 'witch', 'secret', 'dragon', 'chamber', 'stone',
  'mirror', 'dark', 'light', 'golden', 'shadow', 'forest', 'tower', 'staircase',
  'whisper', 'spark', 'flame', 'silver', 'crown', 'curse', 'charm', 'shield',
  'letter', 'train', 'platform', 'door', 'hall', 'great', 'ancient', 'brave',
  'clever', 'silent', 'sudden', 'strange', 'hidden', 'flying', 'glowing', 'mighty'
];

/**
 * Clean a word token into lowercase pure alphabetic for comparisons
 * @param {string} word 
 * @returns {string}
 */
export function cleanWord(word) {
  if (!word) return '';
  return word.toLowerCase().replace(/[^a-z'’\-]/g, '');
}

/**
 * Determine if a token is a content word (eligible for cloze blanking)
 * @param {string} rawWord 
 * @returns {boolean}
 */
export function isContentWord(rawWord) {
  const cleaned = cleanWord(rawWord);
  if (!cleaned || cleaned.length < 2) return false;
  return !FUNCTION_WORDS.has(cleaned);
}

/**
 * Generate Cloze structure for Lumos Mode
 * @param {string} sentenceText 
 * @returns {Array<{text: string, isWord: boolean, isBlank: boolean, firstLetter: string, clean: string}>}
 */
export function generateClozeStructure(sentenceText) {
  const tokens = tokenizeSentence(sentenceText);
  let contentWordCount = 0;

  // First pass: count content words
  tokens.forEach(t => {
    if (t.isWord && isContentWord(t.text)) {
      contentWordCount++;
    }
  });

  // If sentence has no content words (e.g. "It was he."), make the longest word blank
  let fallbackBlankIdx = -1;
  if (contentWordCount === 0) {
    let maxLen = 0;
    tokens.forEach((t, i) => {
      if (t.isWord && t.text.length > maxLen) {
        maxLen = t.text.length;
        fallbackBlankIdx = i;
      }
    });
  }

  let blankIndexCounter = 0;
  return tokens.map((token, idx) => {
    if (!token.isWord) {
      return {
        text: token.text,
        isWord: false,
        isBlank: false,
        clean: ''
      };
    }

    const cleaned = cleanWord(token.text);
    const shouldBlank = (fallbackBlankIdx !== -1)
      ? (idx === fallbackBlankIdx)
      : isContentWord(token.text);

    return {
      text: token.text,
      isWord: true,
      isBlank: shouldBlank,
      blankIndex: shouldBlank ? blankIndexCounter++ : -1,
      firstLetter: token.text[0] || '',
      clean: cleaned
    };
  });
}

/**
 * Generate Scramble Tiles for Accio Mode
 * Includes all words in the target sentence + 2~3 random distractors, shuffled.
 * @param {string} sentenceText 
 * @returns {{ targetWords: string[], tiles: Array<{ id: string, text: string, clean: string, isDistractor: boolean }> }}
 */
export function generateAccioTiles(sentenceText) {
  const tokens = tokenizeSentence(sentenceText);
  const targetWords = tokens.filter(t => t.isWord).map(t => t.text);

  const tiles = targetWords.map((word, idx) => ({
    id: `word_${idx}_${word}`,
    text: word,
    clean: cleanWord(word),
    isDistractor: false
  }));

  // Add 2 to 3 distractors not already in target sentence
  const targetCleans = new Set(tiles.map(t => t.clean));
  const availableDistractors = DISTRACTOR_POOL.filter(d => !targetCleans.has(d));
  
  // Pick up to 3 distractors
  const distractorCount = Math.min(3, Math.max(2, Math.floor(targetWords.length / 4)));
  const shuffledDistractors = [...availableDistractors].sort(() => 0.5 - Math.random());
  const selectedDistractors = shuffledDistractors.slice(0, distractorCount);

  selectedDistractors.forEach((dist, idx) => {
    tiles.push({
      id: `dist_${idx}_${dist}`,
      text: dist,
      clean: dist,
      isDistractor: true
    });
  });

  // Fisher-Yates shuffle
  const shuffledTiles = [...tiles];
  for (let i = shuffledTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledTiles[i], shuffledTiles[j]] = [shuffledTiles[j], shuffledTiles[i]];
  }

  return {
    targetWords,
    tiles: shuffledTiles
  };
}

/**
 * Calculate Hogwarts House Points based on difficulty and score
 * @param {'accio' | 'lumos' | 'auror' | 'dueling'} mode 
 * @param {number} accuracy 
 * @param {number} streak 
 * @returns {number} Points earned
 */
export function calculateHousePoints(mode, accuracy, streak = 0) {
  let basePoints = 10;
  if (mode === 'lumos') basePoints = 15;
  if (mode === 'auror') basePoints = 25;
  if (mode === 'dueling') basePoints = 35;

  const accuracyMultiplier = accuracy >= 95 ? 1.5 : accuracy >= 80 ? 1.2 : accuracy >= 60 ? 1.0 : 0.6;
  const streakBonus = Math.min(25, streak * 3);

  return Math.round(basePoints * accuracyMultiplier + streakBonus);
}

/**
 * Hogwarts House metadata configurations
 */
export const HOGWARTS_HOUSES = [
  { id: 'gryffindor', name: '格兰芬多', crest: '狮院 · 勇敢与果决', color: '#740001', accent: '#d3a625' },
  { id: 'ravenclaw',  name: '拉文克劳', crest: '鹰院 · 智慧与学识', color: '#0e1a40', accent: '#946b2d' },
  { id: 'hufflepuff', name: '赫奇帕奇', crest: '獾院 · 忠诚与勤劳', color: '#ecb939', accent: '#372e29' },
  { id: 'slytherin',  name: '斯莱特林', crest: '蛇院 · 精明与野心', color: '#1a472a', accent: '#aaaaaa' }
];

export default {
  FUNCTION_WORDS,
  cleanWord,
  isContentWord,
  generateClozeStructure,
  generateAccioTiles,
  calculateHousePoints,
  HOGWARTS_HOUSES
};
