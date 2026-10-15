/**
 * srsEngine.js
 * Duolingo-Style Spaced Repetition System (SRS 艾宾浩斯间隔复习引擎)
 * 
 * Implements Leitner Spaced Repetition for Hogwarts Vocabulary:
 * - Level 1: Review in 1 day (初学磨练)
 * - Level 2: Review in 3 days (初步巩固)
 * - Level 3: Review in 7 days (稳固记忆)
 * - Level 4: Review in 14 days (长效记忆)
 * - Level 5: Review in 30 days (永久掌握 Mastered)
 */

export const SRS_INTERVALS = {
  1: 1,   // 1 day
  2: 3,   // 3 days
  3: 7,   // 7 days
  4: 14,  // 14 days
  5: 30   // 30 days
};
export const SRS_INTERVALS_DAYS = SRS_INTERVALS;

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysToDate(dateStr, days) {
  const date = new Date(dateStr || Date.now());
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Initialize a vocabulary item with SRS metadata if missing
 * @param {object} item 
 * @returns {object}
 */
export function ensureSrsMetadata(item) {
  if (!item || typeof item !== 'object') return item;
  const level = item.srsLevel || item.srsBox || 1;
  const nextDate = item.nextReviewDate || item.srsNextReviewDate || getTodayString();
  const interval = item.intervalDays || item.srsIntervalDays || SRS_INTERVALS[level] || 1;
  const count = item.reviewCount || item.srsReviewCount || 0;

  return {
    ...item,
    srsLevel: level,
    srsBox: level,
    nextReviewDate: nextDate,
    srsNextReviewDate: nextDate,
    intervalDays: interval,
    srsIntervalDays: interval,
    lastReviewed: item.lastReviewed || null,
    consecutiveCorrect: item.consecutiveCorrect || 0,
    reviewCount: count,
    srsReviewCount: count,
    updatedAt: item.updatedAt || Date.now()
  };
}

/**
 * Filter words that are due for review today
 * @param {Array} vocabList 
 * @returns {Array} List of words due for review
 */
export function getDueWords(vocabList = []) {
  const today = getTodayString();
  return (vocabList || [])
    .map(ensureSrsMetadata)
    .filter(item => {
      // Due if never reviewed, or nextReviewDate <= today
      return !item.nextReviewDate || item.nextReviewDate <= today;
    })
    .sort((a, b) => (a.srsLevel || 1) - (b.srsLevel || 1));
}

/**
 * Process a flashcard review outcome for a single word
 * @param {string} wordIdOrWord 
 * @param {boolean} isSuccess 
 * @param {Array} vocabList 
 * @returns {Array} Updated vocabList
 */
export function processReviewResult(wordIdOrWord, isSuccess, vocabList = []) {
  const today = getTodayString();

  return (vocabList || []).map(rawItem => {
    const item = ensureSrsMetadata(rawItem);
    const matches = (item.id && item.id === wordIdOrWord) || 
                    (item.word && item.word.toLowerCase() === String(wordIdOrWord).toLowerCase());

    if (!matches) return item;

    let newLevel = item.srsLevel || 1;
    let newConsecutive = item.consecutiveCorrect || 0;

    if (isSuccess) {
      newLevel = Math.min(5, newLevel + 1);
      newConsecutive += 1;
    } else {
      // Duolingo style: drop to Level 1 if forgotten
      newLevel = 1;
      newConsecutive = 0;
    }

    const interval = SRS_INTERVALS[newLevel] || 1;
    const nextDate = addDaysToDate(today, interval);

    return {
      ...item,
      srsLevel: newLevel,
      srsBox: newLevel,
      consecutiveCorrect: newConsecutive,
      intervalDays: interval,
      srsIntervalDays: interval,
      lastReviewed: today,
      nextReviewDate: nextDate,
      srsNextReviewDate: nextDate,
      reviewCount: (item.reviewCount || 0) + 1,
      srsReviewCount: (item.reviewCount || 0) + 1,
      updatedAt: Date.now()
    };
  });
}

/**
 * Get comprehensive SRS statistics for the student dashboard
 * @param {Array} vocabList 
 * @returns {{ dueCount: number, dueToday: number, masteredCount: number, mastered: number, learningCount: number, totalCount: number, total: number }}
 */
export function getSrsStats(vocabList = []) {
  const today = getTodayString();
  let dueCount = 0;
  let masteredCount = 0;
  let learningCount = 0;
  const boxes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  (vocabList || []).forEach(rawItem => {
    const item = ensureSrsMetadata(rawItem);
    const box = item.srsLevel || 1;
    boxes[box] = (boxes[box] || 0) + 1;
    if (!item.nextReviewDate || item.nextReviewDate <= today) {
      dueCount++;
    }
    if (box >= 5) {
      masteredCount++;
    } else {
      learningCount++;
    }
  });

  return {
    total: (vocabList || []).length,
    dueCount,
    dueToday: dueCount,
    mastered: masteredCount,
    masteredCount,
    learningCount,
    box1: boxes[1],
    box2: boxes[2],
    box3: boxes[3],
    box4: boxes[4],
    box5: boxes[5],
    totalCount: (vocabList || []).length
  };
}

export default {
  SRS_INTERVALS,
  SRS_INTERVALS_DAYS,
  ensureSrsMetadata,
  getDueWords,
  processReviewResult,
  getSrsStats
};
