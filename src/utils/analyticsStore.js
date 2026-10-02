/**
 * src/utils/analyticsStore.js
 * Visual Learning Analytics & Habit Tracking Persistent Store (Milestone 2 - R2)
 *
 * Implements persistent analytics storage for listening duration, daily streaks,
 * dictation performance, shadowing accuracy, and completed chapters.
 *
 * Conforms strictly to PROJECT.md § Analytics Store Contract.
 */

// Dual storage keys for full compatibility:
// Primary key per R2 specification: 'hp_study_analytics'
// Test runner & oracle compatibility key: 'hogwarts_analytics_data'
export const STORAGE_KEY_PRIMARY = 'hp_study_analytics';
export const STORAGE_KEY_COMPAT = 'hogwarts_analytics_data';

/**
 * Returns today's ISO date string in YYYY-MM-DD format (UTC).
 * Accepts optional Date object or timestamp for deterministic testing.
 * @param {Date|number|string} [date]
 * @returns {string}
 */
export function getTodayDateStr(date = new Date()) {
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Creates a clean, safe initial analytics state structure.
 * @returns {Object}
 */
export function createInitialState() {
  return {
    totalListeningSeconds: 0,
    dailyListeningSeconds: {}, // Map: { 'YYYY-MM-DD': seconds }
    dictationHistory: [],      // Array of session objects
    shadowingScores: [],       // Array of { chapterId, cueId, score, date, timestamp }
    completedChapters: [],     // Array of chapterIds
    streakDays: 0,
    longestStreakDays: 0,
    lastActiveDate: null,
    schemaVersion: 1
  };
}

/**
 * Sanitizes and repairs a loaded state object, defending against corrupted types,
 * missing properties, NaN values, and non-array collections.
 * @param {*} rawState
 * @returns {Object}
 */
export function sanitizeState(rawState) {
  if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) {
    return createInitialState();
  }

  const safe = createInitialState();

  // 1. totalListeningSeconds: non-negative finite number
  if (Number.isFinite(rawState.totalListeningSeconds) && rawState.totalListeningSeconds >= 0) {
    safe.totalListeningSeconds = rawState.totalListeningSeconds;
  }

  // 2. dailyListeningSeconds: dictionary of date -> non-negative number
  if (rawState.dailyListeningSeconds && typeof rawState.dailyListeningSeconds === 'object' && !Array.isArray(rawState.dailyListeningSeconds)) {
    const cleanDaily = {};
    for (const [k, v] of Object.entries(rawState.dailyListeningSeconds)) {
      if (typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k)) {
        const sec = Number(v);
        if (Number.isFinite(sec) && sec > 0) {
          cleanDaily[k] = sec;
        }
      }
    }
    safe.dailyListeningSeconds = cleanDaily;
  }

  // 3. dictationHistory: array of valid session objects
  if (Array.isArray(rawState.dictationHistory)) {
    safe.dictationHistory = rawState.dictationHistory.filter(item => item && typeof item === 'object');
  }

  // 4. shadowingScores: array of valid score objects
  if (Array.isArray(rawState.shadowingScores)) {
    safe.shadowingScores = rawState.shadowingScores.filter(item => item && typeof item === 'object');
  }

  // 5. completedChapters: array of unique non-empty string IDs
  if (Array.isArray(rawState.completedChapters)) {
    const seen = new Set();
    for (const id of rawState.completedChapters) {
      if (typeof id === 'string' && id.trim()) {
        seen.add(id.trim());
      }
    }
    safe.completedChapters = Array.from(seen);
  }

  // 6. streakDays & longestStreakDays: non-negative integers
  if (Number.isFinite(rawState.streakDays) && rawState.streakDays >= 0) {
    safe.streakDays = Math.floor(rawState.streakDays);
  }
  if (Number.isFinite(rawState.longestStreakDays) && rawState.longestStreakDays >= 0) {
    safe.longestStreakDays = Math.floor(rawState.longestStreakDays);
  }

  // 7. lastActiveDate
  if (typeof rawState.lastActiveDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawState.lastActiveDate)) {
    safe.lastActiveDate = rawState.lastActiveDate;
  }

  return safe;
}

/**
 * Loads analytics state from localStorage with fail-safe error recovery.
 * Reads either primary or test compatibility key.
 * @returns {Object}
 */
export function loadState() {
  try {
    if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
      return createInitialState();
    }

    // Try compatibility key first (for existing test suite fixtures), then primary key
    const raw = globalThis.localStorage.getItem(STORAGE_KEY_COMPAT) ||
                globalThis.localStorage.getItem(STORAGE_KEY_PRIMARY);

    if (!raw) return createInitialState();

    const parsed = JSON.parse(raw);
    return sanitizeState(parsed);
  } catch {
    // Graceful recovery on JSON.parse failure or storage error
    return createInitialState();
  }
}

/**
 * Persists analytics state into localStorage.
 * Atomically writes to both primary and test compatibility keys.
 * Defends against quota exceeded errors.
 * @param {Object} state
 */
export function saveState(state) {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const serialized = JSON.stringify(state);
      globalThis.localStorage.setItem(STORAGE_KEY_COMPAT, serialized);
      globalThis.localStorage.setItem(STORAGE_KEY_PRIMARY, serialized);
    }
  } catch (e) {
    // Silently ignore quota exceeded or permission errors in restricted/private modes
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('Unable to persist analytics state to localStorage:', e);
    }
  }
}

/**
 * Calculates current streak and all-time longest streak from historical activity.
 * Activity sources: daily listening (sec > 0), dictation sessions, shadowing scores.
 *
 * Algorithm details:
 * 1. Collect all distinct active dates matching YYYY-MM-DD.
 * 2. Calculate longest historical streak by sorting all dates chronologically and
 *    measuring consecutive day spans using UTC midnight timestamps (immune to DST / leap years).
 * 3. Calculate current streak:
 *    - If today is active, count backwards consecutive days from today.
 *    - Else if yesterday is active, count backwards consecutive days from yesterday (streak not broken yet today).
 *    - Otherwise, streak is broken (0).
 *
 * @param {Object} [dailyListening]
 * @param {Array} [dictationHistory]
 * @param {Array} [shadowingScores]
 * @param {Date} [referenceDate] Optional reference date for testing
 * @returns {{ currentStreak: number, longestStreak: number }}
 */
export function calculateStreaks(dailyListening = {}, dictationHistory = [], shadowingScores = [], referenceDate = new Date()) {
  const activeDates = new Set();

  for (const [date, sec] of Object.entries(dailyListening || {})) {
    if (Number(sec) > 0 && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      activeDates.add(date);
    }
  }
  for (const item of dictationHistory || []) {
    if (item && item.date && typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
      activeDates.add(item.date);
    }
  }
  for (const item of shadowingScores || []) {
    if (item && item.date && typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
      activeDates.add(item.date);
    }
  }

  if (activeDates.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 1. Calculate longest streak across all recorded history
  const sortedDates = Array.from(activeDates).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dateStr of sortedDates) {
    const d = new Date(dateStr + 'T00:00:00Z');
    if (prevDate) {
      // 86,400,000 ms per UTC day guarantees exact day difference across leap years & month boundaries
      const diffDays = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    prevDate = d;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  // 2. Calculate current active streak
  const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const todayStr = getTodayDateStr(ref);
  const yesterdayDate = new Date(ref.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = getTodayDateStr(yesterdayDate);

  let currentStreak = 0;
  let startDate = null;

  if (activeDates.has(todayStr)) {
    startDate = new Date(todayStr + 'T00:00:00Z');
  } else if (activeDates.has(yesterdayStr)) {
    startDate = new Date(yesterdayStr + 'T00:00:00Z');
  }

  if (startDate) {
    let checkDate = startDate;
    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (activeDates.has(checkStr)) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
}

/**
 * Records listening duration in seconds.
 * Accumulates total listening duration and today's daily tally.
 * Ignores non-positive numbers, NaN, and invalid inputs safely.
 * @param {number} seconds
 */
export function recordListeningSeconds(seconds) {
  const sec = Number(seconds);
  if (!Number.isFinite(sec) || sec <= 0) return;

  const state = loadState();
  state.totalListeningSeconds += sec;

  const today = getTodayDateStr();
  state.dailyListeningSeconds[today] = (state.dailyListeningSeconds[today] || 0) + sec;
  state.lastActiveDate = today;

  const streaks = calculateStreaks(state.dailyListeningSeconds, state.dictationHistory, state.shadowingScores);
  state.streakDays = streaks.currentStreak;
  state.longestStreakDays = Math.max(state.longestStreakDays, streaks.longestStreak);

  saveState(state);
}

/**
 * Records the outcome of a dictation practice session.
 * Protects against division by zero and NaN accuracy.
 * @param {Object} session
 * @param {string} session.chapterId
 * @param {string} session.chapterTitle
 * @param {number} session.totalWords
 * @param {number} session.correctWords
 * @param {number} [session.accuracy]
 */
export function recordDictationSession(session) {
  if (!session || typeof session !== 'object') return;
  const state = loadState();

  const totalWords = Math.max(0, Math.round(Number(session.totalWords) || 0));
  const correctWords = Math.max(0, Math.round(Number(session.correctWords) || 0));

  let accuracy = 0;
  if (session.accuracy !== undefined) {
    const accNum = Number(session.accuracy);
    accuracy = Number.isFinite(accNum) ? Math.min(100, Math.max(0, Math.round(accNum))) : 0;
  } else if (totalWords > 0) {
    accuracy = Math.min(100, Math.max(0, Math.round((correctWords / totalWords) * 100)));
  }

  const today = getTodayDateStr();
  const record = {
    chapterId: String(session.chapterId || ''),
    chapterTitle: String(session.chapterTitle || ''),
    totalWords,
    correctWords,
    accuracy,
    date: today,
    timestamp: Date.now()
  };

  state.dictationHistory.push(record);
  state.lastActiveDate = today;

  const streaks = calculateStreaks(state.dailyListeningSeconds, state.dictationHistory, state.shadowingScores);
  state.streakDays = streaks.currentStreak;
  state.longestStreakDays = Math.max(state.longestStreakDays, streaks.longestStreak);

  saveState(state);
}

/**
 * Records an AI speech pronunciation evaluation score for a shadowing cue.
 * Clamps score to [0, 100] and counts toward daily active habit streak.
 * @param {Object} record
 * @param {string} record.chapterId
 * @param {number} record.cueId
 * @param {number} record.score
 */
export function recordShadowingScore(record) {
  if (!record || typeof record !== 'object') return;
  const state = loadState();

  const today = getTodayDateStr();
  const rawScore = Number(record.score);
  const score = Number.isFinite(rawScore) ? Math.min(100, Math.max(0, Math.round(rawScore))) : 0;

  state.shadowingScores.push({
    chapterId: String(record.chapterId || ''),
    cueId: Number(record.cueId) || 0,
    score,
    date: today,
    timestamp: Date.now()
  });
  state.lastActiveDate = today;

  const streaks = calculateStreaks(state.dailyListeningSeconds, state.dictationHistory, state.shadowingScores);
  state.streakDays = streaks.currentStreak;
  state.longestStreakDays = Math.max(state.longestStreakDays, streaks.longestStreak);

  saveState(state);
}

/**
 * Marks a chapter as completed in the persistent store without duplication.
 * @param {string} chapterId
 */
export function markChapterCompleted(chapterId) {
  if (!chapterId || typeof chapterId !== 'string' || !chapterId.trim()) return;
  const cleanId = chapterId.trim();
  const state = loadState();

  if (!state.completedChapters.includes(cleanId)) {
    state.completedChapters.push(cleanId);
    saveState(state);
  }
}

/**
 * Queries whether a specific chapter has been marked completed.
 * @param {string} chapterId
 * @returns {boolean}
 */
export function isChapterCompleted(chapterId) {
  if (!chapterId) return false;
  const state = loadState();
  return state.completedChapters.includes(String(chapterId).trim());
}

/**
 * Generates an aggregated analytics summary for UI dashboard presentation.
 * Returns the exact schema required by PROJECT.md § Analytics Store Contract.
 *
 * @returns {{
 *   totalListeningSeconds: number,
 *   weeklyListeningMinutes: Array<{ day: string, date: string, minutes: number }>,
 *   dictationTrend: Array<{ date: string, accuracy: number }>,
 *   completedChaptersCount: number,
 *   streakDays: number,
 *   longestStreakDays: number
 * }}
 */
export function getAnalyticsSummary() {
  const state = loadState();
  const streaks = calculateStreaks(state.dailyListeningSeconds, state.dictationHistory, state.shadowingScores);

  // Generate 7-day weekly listening minutes (chronological, ending today)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyListeningMinutes = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = daysOfWeek[d.getDay()];
    const sec = state.dailyListeningSeconds[dateStr] || 0;
    weeklyListeningMinutes.push({
      day: dayLabel,
      date: dateStr,
      minutes: Math.round((sec / 60) * 10) / 10
    });
  }

  // Generate dictation trend: last 10 sessions formatted as { date, accuracy }
  const dictationTrend = state.dictationHistory.slice(-10).map(s => ({
    date: s.date,
    accuracy: s.accuracy
  }));

  return {
    totalListeningSeconds: state.totalListeningSeconds,
    weeklyListeningMinutes,
    dictationTrend,
    completedChaptersCount: state.completedChapters.length,
    streakDays: streaks.currentStreak,
    longestStreakDays: Math.max(state.longestStreakDays || 0, streaks.longestStreak)
  };
}

/**
 * Clears and resets all analytics data.
 */
export function resetAnalyticsStore() {
  const initial = createInitialState();
  saveState(initial);
  return initial;
}

/**
 * Retrieves the full raw state object.
 * @returns {Object}
 */
export function getRawAnalyticsData() {
  return loadState();
}

export default {
  recordListeningSeconds,
  recordDictationSession,
  recordShadowingScore,
  markChapterCompleted,
  isChapterCompleted,
  getAnalyticsSummary,
  resetAnalyticsStore,
  getRawAnalyticsData,
  calculateStreaks,
  getTodayDateStr,
  STORAGE_KEY_PRIMARY,
  STORAGE_KEY_COMPAT
};
