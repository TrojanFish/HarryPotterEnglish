import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'hp_bookmarked_sentences';

/**
 * Normalizes a sentence cue into a structured persistent bookmark record
 */
export function normalizeSentenceBookmark(cue, bookId = '', chapterId = '') {
  if (!cue) return null;
  const rawId = cue.id ?? cue.startTime ?? cue.start ?? 0;
  const startSec = Number(cue.startTime ?? cue.start ?? 0);
  const endSec = Number(cue.endTime ?? cue.end ?? 0);
  const id = `bm_${bookId}_${chapterId}_${rawId}_${Date.now()}`;
  return {
    id,
    cueId: String(rawId),
    start: startSec,
    end: endSec,
    text: cue.text || '',
    translation: cue.translation || '',
    bookId: String(bookId),
    chapterId: String(chapterId),
    createdAt: new Date().toISOString()
  };
}

/**
 * Pure function: Toggles a cue in the bookmark list
 */
export function toggleBookmarkInList(list = [], cue, bookId = '', chapterId = '') {
  if (!cue) return list;
  const targetCueId = String(cue.id ?? cue.startTime ?? cue.start ?? 0);
  const targetBookId = String(bookId || '');
  const targetChapterId = String(chapterId || '');

  const exists = list.some(b => 
    b.cueId === targetCueId &&
    (!targetBookId || b.bookId === targetBookId) &&
    (!targetChapterId || b.chapterId === targetChapterId)
  );

  if (exists) {
    return list.filter(b => !(
      b.cueId === targetCueId &&
      (!targetBookId || b.bookId === targetBookId) &&
      (!targetChapterId || b.chapterId === targetChapterId)
    ));
  } else {
    const newItem = normalizeSentenceBookmark(cue, targetBookId, targetChapterId);
    return newItem ? [newItem, ...list] : list;
  }
}

/**
 * Pure function: Gets a Set of bookmarked cueIds strictly scoped to a book and chapter
 */
export function getChapterBookmarkedCueIds(list = [], bookId = '', chapterId = '') {
  if (!Array.isArray(list)) return new Set();
  const targetBookId = String(bookId || '');
  const targetChapterId = String(chapterId || '');
  const matched = list.filter(b => 
    (!targetBookId || b.bookId === targetBookId) &&
    (!targetChapterId || b.chapterId === targetChapterId)
  );
  return new Set(matched.map(b => b.cueId));
}

/**
 * Pure function: Counts bookmarks belonging to a specific book and chapter
 */
export function getChapterBookmarkCount(list = [], bookId = '', chapterId = '') {
  if (!Array.isArray(list)) return 0;
  return list.filter(b => b.bookId === String(bookId) && b.chapterId === String(chapterId)).length;
}

/**
 * useBookmarkManager Hook
 * Central store for Accio Starred / Bookmarked sentences across Podcast & Studio modes
 */
export function useBookmarkManager() {
  const [bookmarkedSentences, setBookmarkedSentences] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarkedSentences));
    } catch (e) {
      console.warn('[BookmarkManager] Failed to persist bookmarks:', e);
    }
  }, [bookmarkedSentences]);

  const bookmarkedCueIds = useMemo(() => {
    return new Set(bookmarkedSentences.map(b => b.cueId));
  }, [bookmarkedSentences]);

  const toggleBookmarkSentence = useCallback((cue, bookId = '', chapterId = '') => {
    setBookmarkedSentences(prev => toggleBookmarkInList(prev, cue, bookId, chapterId));
  }, []);

  const removeBookmark = useCallback((id) => {
    setBookmarkedSentences(prev => prev.filter(b => b.id !== id && b.cueId !== id));
  }, []);

  const clearAllBookmarks = useCallback(() => {
    setBookmarkedSentences([]);
  }, []);

  const getChapterCount = useCallback((bookId, chapterId) => {
    return getChapterBookmarkCount(bookmarkedSentences, bookId, chapterId);
  }, [bookmarkedSentences]);

  const getChapterCueIds = useCallback((bookId, chapterId) => {
    return getChapterBookmarkedCueIds(bookmarkedSentences, bookId, chapterId);
  }, [bookmarkedSentences]);

  return {
    bookmarkedSentences,
    bookmarkedCueIds,
    toggleBookmarkSentence,
    removeBookmark,
    clearAllBookmarks,
    getChapterBookmarkCount: getChapterCount,
    getChapterBookmarkedCueIds: getChapterCueIds
  };
}

export default useBookmarkManager;
