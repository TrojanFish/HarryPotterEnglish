/**
 * Hogwarts Audio English Learning Platform
 * Core TypeScript Data Contracts & Interfaces
 *
 * Provides full IDE autocomplete, static checking, and documentation
 * across the frontend components, algorithms, and storage layers.
 */

export interface Book {
  id: string;
  title: string;
  cnTitle: string;
  code: string;
  cover: string;
  color: string;
  description?: string;
  coverPath?: string | null;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  epId?: string;
  number: number;
  title: string;
  cnTitle?: string;
  description?: string;
  duration?: string;
  durationSeconds?: number;
  audioKey?: string;
  subtitleKey?: string;
  showId?: string;
  r2Key?: string;
}

export interface Cue {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
  translation?: string;
  textLines?: string[];
}

export interface WordToken {
  text: string;
  isWord: boolean;
  cleanWord?: string;
  isHpTerm?: boolean;
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  translation: string;
  definition?: string;
  pos?: string;
  lore?: string;
  example?: string;
  audioUrl?: string;
}

export interface VocabItem {
  id: string;
  word: string;
  front: string;
  translation: string;
  definition?: string;
  phonetic?: string;
  context?: string;
  contextQuote?: string;
  startTime?: number | null;
  endTime?: number | null;
  chapterId?: string;
  bookId?: string;
  tags?: string[];
  addedAt?: string;

  // Duolingo SRS Leitner Fields
  srsLevel?: number;          // 1: 1d, 2: 3d, 3: 7d, 4: 14d, 5: 30d (Mastered)
  srsBox?: number;
  nextReviewDate?: string;    // 'YYYY-MM-DD'
  srsNextReviewDate?: string;
  intervalDays?: number;
  srsIntervalDays?: number;
  lastReviewed?: string | null;
  consecutiveCorrect?: number;
}

export interface SrsStats {
  total: number;
  dueToday: number;
  mastered: number;
  boxCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface AnalyticsSummary {
  totalListeningSeconds: number;
  todayListeningSeconds: number;
  streakDays: number;
  longestStreakDays: number;
  timeTurnersCount: number;
  completedChaptersCount: number;
  todayDictationWords: number;
  averageShadowingScore: number;
  isStreakProtectedToday?: boolean;
}

export interface WordScoreDetail {
  word: string;
  score: number;
  status: 'perfect' | 'good' | 'retry';
  soundexCode?: string;
  phoneticDistance?: number;
}

export interface SpeechScoringResult {
  score: number;             // 0 - 100
  grade: 'O' | 'E' | 'A' | 'P' | 'D' | 'T'; // Hogwarts O.W.L. Grades
  accuracy: number;
  completeness: number;
  fluency: number;
  wordScores: WordScoreDetail[];
  latencyMs?: number;
  isFallback?: boolean;
}

export interface OfflineChapterRecord {
  chapterId: string;
  audioBlob: Blob;
  vttText: string;
  downloadedAt: string;
  sizeBytes?: number;
  bookId?: string;
  title?: string;
}

export interface StorageQuotaInfo {
  usedBytes: number;
  quotaBytes: number;
  percentUsed: number;
  chapters: Array<{
    chapterId: string;
    sizeBytes: number;
    downloadedAt: string;
  }>;
}

export type StudyMode = 'normal' | 'blind' | 'dictation';
export type ViewMode = 'bookshelf' | 'player';
export type SubtitleFontSize = 'normal' | 'large' | 'huge';
