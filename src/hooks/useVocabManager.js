import { useState, useEffect, useCallback } from 'react';
import { ensureSrsMetadata, getDueWords } from '../utils/srsEngine';
import { syncEngine } from '../utils/syncEngine';

/**
 * useVocabManager Hook
 * Manages vocabulary list state, localStorage persistence with SRS metadata,
 * item addition/removal, toggle behavior, and due review counting.
 */
export function useVocabManager() {
  const [vocabList, setVocabList] = useState(() => {
    try {
      const saved = localStorage.getItem('hp_vocab_list');
      const list = saved ? JSON.parse(saved) : [];
      return Array.isArray(list) ? list.map(ensureSrsMetadata) : [];
    } catch {
      return [];
    }
  });

  // Listen for background cloud sync updates
  useEffect(() => {
    const handleSynced = (e) => {
      if (Array.isArray(e.detail)) {
        setVocabList(e.detail.map(ensureSrsMetadata));
      }
    };
    window.addEventListener('hp_vocab_synced', handleSynced);
    return () => window.removeEventListener('hp_vocab_synced', handleSynced);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hp_vocab_list', JSON.stringify(vocabList));
    } catch (e) {
      console.warn('[Vocab] Failed to persist vocabList:', e);
    }
  }, [vocabList]);

  // Duolingo SRS: count words due for review today
  const dueWordsCount = useMemo(() => getDueWords(vocabList).length, [vocabList]);

  const isWordSaved = useCallback((word) => {
    if (!word) return false;
    const target = String(word).toLowerCase().trim();
    return vocabList.some(v => (v.word || v.front || '').toLowerCase().trim() === target);
  }, [vocabList]);

  // Toggle word in vocabulary (atomic state update)
  const toggleSaveWord = useCallback((wordData, sentenceCue = null, bookId = '', chapterId = '') => {
    if (!wordData || !wordData.word) return;

    const targetWord = wordData.word.toLowerCase().trim();
    setVocabList(prev => {
      const exists = prev.some(v => (v.word || v.front || '').toLowerCase().trim() === targetWord);
      if (exists) {
        syncEngine.markVocabDirty(targetWord);
        return prev.filter(v => (v.word || v.front || '').toLowerCase().trim() !== targetWord);
      } else {
        const newEntry = ensureSrsMetadata({
          id: Date.now().toString(),
          word: wordData.word,
          front: wordData.word,
          translation: wordData.translation || wordData.meaning || '',
          definition: wordData.definition || wordData.meaning || '',
          phonetic: wordData.phonetic || wordData.ipa || '',
          context: sentenceCue ? (sentenceCue.text || '') : (wordData.context || ''),
          contextQuote: sentenceCue ? (sentenceCue.text || '') : (wordData.contextQuote || ''),
          startTime: sentenceCue ? sentenceCue.startTime : null,
          endTime: sentenceCue ? sentenceCue.endTime : null,
          chapterId: chapterId || '',
          bookId: bookId || '',
          tags: ['Hogwarts', 'Reading'],
          addedAt: new Date().toISOString(),
          updatedAt: Date.now()
        });

        syncEngine.markVocabDirty(wordData.word);
        return [newEntry, ...prev];
      }
    });
  }, []);

  const removeWord = useCallback((word) => {
    if (!word) return;
    const target = String(word).toLowerCase().trim();
    setVocabList(prev => prev.filter(v => (v.word || v.front || '').toLowerCase().trim() !== target));
    syncEngine.markVocabDirty(target);
  }, []);

  const clearAllVocab = useCallback(() => {
    vocabList.forEach(v => {
      if (v.word) syncEngine.markVocabDirty(v.word);
    });
    setVocabList([]);
  }, [vocabList]);

  return {
    vocabList,
    setVocabList,
    dueWordsCount,
    isWordSaved,
    toggleSaveWord,
    removeWord,
    clearAllVocab
  };
}
