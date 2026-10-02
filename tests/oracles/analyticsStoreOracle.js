/**
 * Reference Oracle for R2 Analytics Store.
 * Strictly adheres to PROJECT.md § Analytics Store Contract.
 */

const STORAGE_KEY = 'hogwarts_analytics_data';

function getTodayDateStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function loadState() {
  try {
    const raw = globalThis.localStorage ? globalThis.localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createInitialState();
    return parsed;
  } catch (e) {
    return createInitialState();
  }
}

function saveState(state) {
  try {
    if (globalThis.localStorage) {
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    // Ignore storage errors
  }
}

function createInitialState() {
  return {
    totalListeningSeconds: 0,
    dailyListeningSeconds: {}, // { 'YYYY-MM-DD': seconds }
    dictationHistory: [], // Array of session objects
    shadowingScores: [], // Array of { chapterId, cueId, score, date }
    completedChapters: [], // Array of chapterIds
    streakDays: 0,
    longestStreakDays: 0,
    lastActiveDate: null
  };
}

function calculateStreaks(dailyListening, dictationHistory, shadowingScores) {
  const activeDates = new Set();
  for (const [date, sec] of Object.entries(dailyListening || {})) {
    if (sec > 0) activeDates.add(date);
  }
  for (const item of dictationHistory || []) {
    if (item.date) activeDates.add(item.date);
  }
  for (const item of shadowingScores || []) {
    if (item.date) activeDates.add(item.date);
  }

  if (activeDates.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sortedDates = Array.from(activeDates).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dateStr of sortedDates) {
    const d = new Date(dateStr + 'T00:00:00Z');
    if (prevDate) {
      const diffDays = Math.round((d - prevDate) / (1000 * 60 * 60 * 24));
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

  // Check if today or yesterday is active to determine current streak
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (activeDates.has(todayStr) || activeDates.has(yesterdayStr)) {
    // Current streak is unbroken
    currentStreak = tempStreak;
  } else {
    currentStreak = 0;
  }

  return { currentStreak, longestStreak };
}

export function recordListeningSeconds(seconds) {
  const sec = Math.max(0, Number(seconds) || 0);
  if (sec <= 0) return;

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

export function recordDictationSession(session) {
  if (!session || typeof session !== 'object') return;
  const state = loadState();

  const totalWords = Math.max(0, Number(session.totalWords) || 0);
  const correctWords = Math.max(0, Number(session.correctWords) || 0);
  const accuracy = totalWords > 0 ? (session.accuracy !== undefined ? session.accuracy : Math.round((correctWords / totalWords) * 100)) : 0;

  const today = getTodayDateStr();
  const record = {
    chapterId: session.chapterId || '',
    chapterTitle: session.chapterTitle || '',
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

export function recordShadowingScore(record) {
  if (!record || typeof record !== 'object') return;
  const state = loadState();

  const today = getTodayDateStr();
  state.shadowingScores.push({
    chapterId: record.chapterId || '',
    cueId: record.cueId || 0,
    score: Math.min(100, Math.max(0, Number(record.score) || 0)),
    date: today,
    timestamp: Date.now()
  });
  state.lastActiveDate = today;

  const streaks = calculateStreaks(state.dailyListeningSeconds, state.dictationHistory, state.shadowingScores);
  state.streakDays = streaks.currentStreak;
  state.longestStreakDays = Math.max(state.longestStreakDays, streaks.longestStreak);

  saveState(state);
}

export function markChapterCompleted(chapterId) {
  if (!chapterId) return;
  const state = loadState();
  if (!state.completedChapters.includes(chapterId)) {
    state.completedChapters.push(chapterId);
    saveState(state);
  }
}

export function getAnalyticsSummary() {
  const state = loadState();
  const streaks = calculateStreaks(state.dailyListeningSeconds, state.dictationHistory, state.shadowingScores);

  // Generate weekly listening minutes (last 7 days)
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

  // Generate dictation trend
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
    longestStreakDays: Math.max(state.longestStreakDays, streaks.longestStreak)
  };
}
