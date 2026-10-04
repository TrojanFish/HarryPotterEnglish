import { useState, useCallback } from 'react';

/**
 * useModalManager Hook
 * Centralizes the open/close state and active payloads for all 7 application drawers/modals.
 */
export function useModalManager() {
  const [isShelfOpen, setIsShelfOpen] = useState(false);
  const [isVocabOpen, setIsVocabOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [isSrsOpen, setIsSrsOpen] = useState(false);

  // Active modal payloads
  const [selectedWordData, setSelectedWordData] = useState(null);
  const [activeWordSentence, setActiveWordSentence] = useState(null);
  const [currentRecordCue, setCurrentRecordCue] = useState(null);

  const openWordModal = useCallback((wordData, sentence = null) => {
    setSelectedWordData(wordData);
    setActiveWordSentence(sentence);
  }, []);

  const closeWordModal = useCallback(() => {
    setSelectedWordData(null);
    setActiveWordSentence(null);
  }, []);

  const openRecorder = useCallback((cue) => {
    setCurrentRecordCue(cue);
    setIsRecorderOpen(true);
  }, []);

  const closeRecorder = useCallback(() => {
    setIsRecorderOpen(false);
    setCurrentRecordCue(null);
  }, []);

  const closeAllModals = useCallback(() => {
    setIsShelfOpen(false);
    setIsVocabOpen(false);
    setIsShortcutsOpen(false);
    setIsRecorderOpen(false);
    setIsAnalyticsOpen(false);
    setIsStorageOpen(false);
    setIsSrsOpen(false);
    setSelectedWordData(null);
  }, []);

  return {
    isShelfOpen,
    setIsShelfOpen,
    isVocabOpen,
    setIsVocabOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
    isRecorderOpen,
    setIsRecorderOpen,
    isAnalyticsOpen,
    setIsAnalyticsOpen,
    isStorageOpen,
    setIsStorageOpen,
    isSrsOpen,
    setIsSrsOpen,
    selectedWordData,
    activeWordSentence,
    currentRecordCue,
    openWordModal,
    closeWordModal,
    openRecorder,
    closeRecorder,
    closeAllModals
  };
}
