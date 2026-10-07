import React, { useState, useEffect, useRef, useCallback, useTransition, useMemo } from 'react';
import { BookshelfView } from './components/BookshelfView';
import { BookShelfDrawer } from './components/BookShelfDrawer';
import { AudioPlayer } from './components/AudioPlayer';
import { SubtitleViewer } from './components/SubtitleViewer';
import { DictationStudio } from './components/DictationStudio';
import { WordModal } from './components/WordModal';
import { VocabularyDrawer } from './components/VocabularyDrawer';
import { SrsFlashcardModal } from './components/SrsFlashcardModal';
import { ShadowingRecorder } from './components/ShadowingRecorder';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { StorageManagerModal } from './components/StorageManagerModal';
import { lookupWord } from './data/hpDictionary';
import { useBreakpoint } from './utils/useBreakpoint';
import { DesktopSidebar } from './components/navigation/DesktopSidebar';
import { TabletRail } from './components/navigation/TabletRail';
import { MobileTopBar } from './components/navigation/MobileTopBar';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import { GlobalPodcastCapsule } from './components/navigation/GlobalPodcastCapsule';
import { ReaderTopBar } from './components/navigation/ReaderTopBar';
import { PodcastPlayerView } from './components/podcast/PodcastPlayerView';
import { Loader2, Eye, WifiOff } from 'lucide-react';
import { getNextSleepTimerOption, formatSleepTimerRemaining, calculateSleepTimerRemaining } from './utils/sleepTimer';

// Decoupled Domain Custom Hooks
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { useCatalog } from './hooks/useCatalog';
import { useStudyTracking } from './hooks/useStudyTracking';
import { useVocabManager } from './hooks/useVocabManager';
import { useBookmarkManager } from './hooks/useBookmarkManager';
import { useModalManager } from './hooks/useModalManager';

/**
 * App — Hogwarts Audio English Learning Platform
 * Refactored into cohesive domain hooks:
 * - useCatalog: Book library, chapter selection, R2 auto-discovery & offline caching
 * - useAudioPlayback: Audio element, rate/volume, sentence seek/loop, MediaSession
 * - useStudyTracking: Listening duration, streak preservation, eye-care sentinel
 * - useVocabManager: Vocabulary notebook & Duolingo SRS Leitner repetition
 * - useModalManager: Centralized drawer and modal states
 */
export function App() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const isParchment = true;

  // Apply warm parchment theme
  useEffect(() => {
    document.body.classList.add('theme-parchment');
  }, []);

  // 1. Domain Hooks Initialization
  const catalog = useCatalog();
  const {
    books,
    selectedBook,
    selectedChapter,
    currentBookObj,
    currentChapterObj,
    cues,
    audioUrl,
    isLoadingContent,
    isRefreshing,
    isOfflinePlaying,
    isOfflineUncached,
    cachedChaptersCount,
    selectBook,
    selectChapter,
    fetchCatalog,
    refreshOfflineCount
  } = catalog;

  const [, startTransition] = useTransition();

  // Hogwarts Sleep Timer State & Countdown
  const [sleepTimerMode, setSleepTimerMode] = useState(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(null);

  // Dual-Engine Player Mode: 'podcast' (随行播客) vs 'studio' (精研工坊)
  const [playerMode, setPlayerMode] = useState(() => {
    try {
      return localStorage.getItem('hp_player_mode') || 'podcast';
    } catch {
      return 'podcast';
    }
  });

  const handleSwitchPlayerMode = useCallback((newMode) => {
    startTransition(() => {
      setPlayerMode(newMode);
    });
    try {
      localStorage.setItem('hp_player_mode', newMode);
    } catch {}
  }, [startTransition]);

  // View Mode & Study Mode State
  const [currentView, setCurrentView] = useState(() => {
    try {
      const saved = localStorage.getItem('hp_current_view');
      return saved === 'player' ? 'player' : 'bookshelf';
    } catch {
      return 'bookshelf';
    }
  });

  const handleSwitchCurrentView = useCallback((newView) => {
    startTransition(() => {
      setCurrentView(newView);
    });
  }, [startTransition]);

  useEffect(() => {
    try {
      localStorage.setItem('hp_current_view', currentView);
    } catch {}
  }, [currentView]);

  const [studyMode, setStudyMode] = useState('normal'); // 'normal' | 'blind' | 'dictation'
  const handleSwitchStudyMode = useCallback((newStudyMode) => {
    startTransition(() => {
      setStudyMode(newStudyMode);
    });
  }, [startTransition]);

  const [showTranslation, setShowTranslation] = useState(true);

  // Chapter auto advance callback
  const handleChapterAutoAdvance = useCallback(() => {
    if (sleepTimerMode === 'end_of_chapter') {
      setSleepTimerMode(null);
      return;
    }
    const chapters = currentBookObj?.chapters || [];
    const currentIndex = chapters.findIndex(c => c.id === selectedChapter);
    if (currentIndex !== -1 && currentIndex < chapters.length - 1) {
      selectChapter(chapters[currentIndex + 1].id);
    }
  }, [currentBookObj, selectedChapter, selectChapter, sleepTimerMode]);

  const audio = useAudioPlayback({
    cues,
    currentBookObj,
    currentChapterObj,
    onChapterAutoAdvance: handleChapterAutoAdvance,
    disableCueAutoAdvance: playerMode === 'studio' && studyMode === 'dictation'
  });
  const {
    audioRef,
    isPlaying,
    setIsPlaying,
    currentTime,
    duration,
    playbackRate,
    setPlaybackRate,
    volume,
    setVolume,
    isLoopSentence,
    setIsLoopSentence,
    activeCueIndex,
    setActiveCueIndex,
    activeCue,
    togglePlayPause,
    seekTo,
    seekRelative,
    seekToCue,
    handlePrevSentence,
    handleNextSentence,
    handleReplayCurrentSentence,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
    handleWaiting,
    handleCanPlay,
    handleAudioError
  } = audio;

  const sleepTimerTargetRef = useRef(null);

  // Hogwarts Sleep Timer Countdown & Auto-Pause (Timestamp-Anchored)
  useEffect(() => {
    if (!sleepTimerMode || sleepTimerMode === 'end_of_chapter') {
      sleepTimerTargetRef.current = null;
      return;
    }

    const checkAndSyncTimer = () => {
      if (!sleepTimerTargetRef.current) return;
      const remaining = calculateSleepTimerRemaining(sleepTimerTargetRef.current);
      if (remaining === null) return;

      if (remaining <= 0) {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        setSleepTimerMode(null);
        setSleepTimerRemaining(null);
        sleepTimerTargetRef.current = null;
      } else {
        setSleepTimerRemaining(remaining);
      }
    };

    checkAndSyncTimer();
    const timer = setInterval(checkAndSyncTimer, 1000);

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkAndSyncTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [sleepTimerMode, audioRef, setIsPlaying]);

  const handleToggleSleepTimer = useCallback(() => {
    setSleepTimerMode((prev) => {
      const next = getNextSleepTimerOption(prev);
      if (typeof next === 'number') {
        const totalSecs = next * 60;
        sleepTimerTargetRef.current = Date.now() + totalSecs * 1000;
        setSleepTimerRemaining(totalSecs);
      } else {
        sleepTimerTargetRef.current = null;
        setSleepTimerRemaining(null);
      }
      return next;
    });
  }, []);

  const formattedSleepTime = formatSleepTimerRemaining(sleepTimerRemaining, sleepTimerMode);

  const tracking = useStudyTracking(isPlaying);
  const {
    analyticsSummary,
    refreshAnalytics,
    showEyeCarePrompt,
    dismissEyeCarePrompt
  } = tracking;

  const vocab = useVocabManager();
  const {
    vocabList,
    setVocabList,
    dueWordsCount,
    isWordSaved,
    toggleSaveWord,
    removeWord,
    clearAllVocab
  } = vocab;

  const bookmarkManager = useBookmarkManager();
  const {
    bookmarkedSentences,
    bookmarkedCueIds,
    toggleBookmarkSentence,
    removeBookmark,
    clearAllBookmarks,
    getChapterBookmarkCount,
    getChapterBookmarkedCueIds
  } = bookmarkManager;

  const currentChapterBookmarkedCueIds = useMemo(() => {
    return getChapterBookmarkedCueIds(selectedBook, selectedChapter);
  }, [getChapterBookmarkedCueIds, selectedBook, selectedChapter]);

  const modals = useModalManager();
  const {
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
  } = modals;

  // Pause continuous playback when transitioning into dictation mode in Studio
  const prevStudyModeRef = useRef(studyMode);
  const prevPlayerModeRef = useRef(playerMode);
  useEffect(() => {
    const studyModeChanged = prevStudyModeRef.current !== studyMode;
    const playerModeChanged = prevPlayerModeRef.current !== playerMode;

    if (studyModeChanged || playerModeChanged) {
      const justEnteredStudioDictation =
        playerMode === 'studio' &&
        studyMode === 'dictation' &&
        (prevStudyModeRef.current !== 'dictation' || prevPlayerModeRef.current !== 'studio');

      if (justEnteredStudioDictation && isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
      prevStudyModeRef.current = studyMode;
      prevPlayerModeRef.current = playerMode;
    }
  }, [studyMode, playerMode, isPlaying, setIsPlaying, audioRef]);

  // Offline status tracking (W3C Network API)
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
    setCanInstallPwa(false);
  };

  // Play Original Audio Snippet for Shadowing Recorder
  const snippetTimeoutRef = useRef(null);
  const handlePlayOriginalSnippet = useCallback((startTime, endTime) => {
    if (audioRef.current) {
      if (snippetTimeoutRef.current) {
        clearTimeout(snippetTimeoutRef.current);
        snippetTimeoutRef.current = null;
      }
      audioRef.current.currentTime = startTime;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      const durationMs = Math.max(300, (endTime - startTime) * 1000);
      snippetTimeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        snippetTimeoutRef.current = null;
      }, durationMs);
    }
  }, [audioRef, setIsPlaying]);

  useEffect(() => {
    return () => {
      if (snippetTimeoutRef.current) {
        clearTimeout(snippetTimeoutRef.current);
      }
    };
  }, []);

  // Word Click -> Open Dictionary Modal
  const handleWordClick = useCallback(async (rawWord, sentenceCue) => {
    const lookupResult = await lookupWord(rawWord);
    if (lookupResult) {
      openWordModal(lookupResult, sentenceCue);
    }
  }, [openWordModal]);

  // Play chapter from Storage Manager
  const handlePlayFromStorage = useCallback((chapterId) => {
    let foundBook = null;
    for (const b of books) {
      const ch = (b.chapters || []).find(c => c.id === chapterId);
      if (ch) {
        foundBook = b;
        break;
      }
    }
    if (foundBook && foundBook.id !== selectedBook) {
      selectBook(foundBook.id);
    }
    selectChapter(chapterId);
    setIsStorageOpen(false);
    setCurrentView('player');
  }, [books, selectedBook, selectBook, selectChapter, setIsStorageOpen]);

  // Jump to sentence audio from bookmarked sentences workshop
  const handlePlayBookmarkedSentence = useCallback((item) => {
    if (!item) return;
    setIsVocabOpen(false);
    if (item.bookId && item.bookId !== selectedBook) {
      selectBook(item.bookId);
    }
    if (item.chapterId && item.chapterId !== selectedChapter) {
      selectChapter(item.chapterId);
    }
    setCurrentView('player');
    const targetSeconds = Number(item.start) || 0;
    setTimeout(() => {
      seekTo(targetSeconds);
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 200);
  }, [selectedBook, selectedChapter, selectBook, selectChapter, seekTo, audioRef, setIsPlaying, setIsVocabOpen]);

  // Desktop Sidebar Collapse state (persisted)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('hp_desktop_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hp_desktop_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  // 3. Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const isAnyModalOpen = isShelfOpen || isVocabOpen || isShortcutsOpen || isRecorderOpen || isAnalyticsOpen || isStorageOpen || isSrsOpen || Boolean(selectedWordData);

      if (e.key === 'Escape') {
        if (isAnyModalOpen) {
          closeAllModals();
        }
        return;
      }

      // If a modal or drawer is active, suppress global media/view shortcuts to prevent background hijacking
      if (isAnyModalOpen) return;

      // In Bookshelf view, only handle sidebar toggling; do not hijack player controls
      if (currentView === 'bookshelf') {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
          e.preventDefault();
          toggleSidebarCollapsed();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevSentence();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextSentence();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReplayCurrentSentence();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsLoopSentence(prev => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setStudyMode(prev => prev === 'normal' ? 'blind' : prev === 'blind' ? 'dictation' : 'normal');
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebarCollapsed();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.1));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isShelfOpen,
    isVocabOpen,
    isShortcutsOpen,
    isRecorderOpen,
    isAnalyticsOpen,
    isStorageOpen,
    isSrsOpen,
    selectedWordData,
    currentView,
    closeAllModals,
    togglePlayPause,
    handlePrevSentence,
    handleNextSentence,
    handleReplayCurrentSentence,
    setIsLoopSentence,
    setStudyMode,
    toggleSidebarCollapsed,
    volume,
    setVolume
  ]);

  return (
    <div className={`h-screen h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col md:flex-row transition-colors duration-300 ${
      isParchment ? 'theme-parchment' : 'bg-[#0f172a] text-slate-100'
    }`}>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onError={handleAudioError}
        preload="auto"
        playsInline
        webkit-playsinline="true"
      />

      {/* ── 1. Desktop Left Permanent Sidebar (>= 1024px) ───────────── */}
      <DesktopSidebar
        currentView={currentView}
        onSwitchView={handleSwitchCurrentView}
        playerMode={playerMode}
        onSwitchPlayerMode={handleSwitchPlayerMode}
        studyMode={studyMode}
        setStudyMode={handleSwitchStudyMode}
        streakDays={analyticsSummary?.streakDays || 0}
        todayListeningSeconds={analyticsSummary?.todayListeningSeconds || 0}
        vocabCount={vocabList.length}
        cachedChaptersCount={cachedChaptersCount}
        onOpenVocab={() => handleSwitchCurrentView('vocab')}
        onOpenAnalytics={() => {
          refreshAnalytics();
          handleSwitchCurrentView('analytics');
        }}
        onOpenStorage={() => {
          refreshOfflineCount();
          handleSwitchCurrentView('storage');
        }}
        canInstallPwa={canInstallPwa}
        onInstallPwa={handleInstallPwa}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      {/* ── 2. Tablet Compact Icon Rail (768px - 1023px) ────────────── */}
      <TabletRail
        currentView={currentView}
        onSwitchView={handleSwitchCurrentView}
        playerMode={playerMode}
        onSwitchPlayerMode={handleSwitchPlayerMode}
        studyMode={studyMode}
        setStudyMode={handleSwitchStudyMode}
        streakDays={analyticsSummary?.streakDays || 0}
        vocabCount={vocabList.length}
        cachedChaptersCount={cachedChaptersCount}
        onOpenVocab={() => handleSwitchCurrentView('vocab')}
        onOpenAnalytics={() => {
          refreshAnalytics();
          handleSwitchCurrentView('analytics');
        }}
        onOpenStorage={() => {
          refreshOfflineCount();
          handleSwitchCurrentView('storage');
        }}
      />

      {/* ── 3. Main Workspace Area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Mobile Minimal Top Bar (< 768px, Bookshelf view only) */}
        {currentView === 'bookshelf' && (
          <MobileTopBar
            currentView={currentView}
            onSwitchView={handleSwitchCurrentView}
            currentBook={currentBookObj}
            currentChapter={currentChapterObj}
            onOpenShelf={() => setIsShelfOpen(true)}
            studyMode={studyMode}
            setStudyMode={handleSwitchStudyMode}
            streakDays={analyticsSummary?.streakDays || 0}
            onOpenAnalytics={() => {
              refreshAnalytics();
              setIsAnalyticsOpen(true);
            }}
            onOpenStorage={() => {
              refreshOfflineCount();
              setIsStorageOpen(true);
            }}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            cachedChaptersCount={cachedChaptersCount}
            canInstallPwa={canInstallPwa}
            onInstallPwa={handleInstallPwa}
          />
        )}

        {/* ── Content Viewport: Bookshelf, Vocab, Analytics, Storage, vs Player Studio ── */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
          {currentView === 'vocab' ? (
            <VocabularyDrawer
              isOpen={true}
              isPageView={true}
              onClose={() => setCurrentView('player')}
              vocabList={vocabList}
              onRemoveWord={removeWord}
              onClearAll={clearAllVocab}
              isParchment={isParchment}
              onOpenSrs={() => setIsSrsOpen(true)}
              bookmarkedSentences={bookmarkedSentences}
              onRemoveBookmark={removeBookmark}
              onClearAllBookmarks={clearAllBookmarks}
              onPlaySentence={handlePlayBookmarkedSentence}
            />
          ) : currentView === 'analytics' ? (
            <AnalyticsDashboard
              isOpen={true}
              isPageView={true}
              onClose={() => setCurrentView('player')}
              isParchment={isParchment}
              vocabCount={vocabList.length}
            />
          ) : currentView === 'storage' ? (
            <StorageManagerModal
              isOpen={true}
              isPageView={true}
              onClose={() => setCurrentView('player')}
              isParchment={isParchment}
              currentBook={currentBookObj}
              currentChapter={currentChapterObj}
              onPlayChapter={handlePlayFromStorage}
            />
          ) : currentView === 'bookshelf' ? (
            <BookshelfView
              books={books}
              selectedBook={selectedBook}
              selectedChapter={selectedChapter}
              onSelectBook={selectBook}
              onEnterPlayer={() => setCurrentView('player')}
              isParchment={isParchment}
              onSelectChapter={(chapterId, shouldPlay = true) => {
                selectChapter(chapterId);
                setCurrentView('player');
                if (shouldPlay) {
                  setTimeout(() => {
                    if (audioRef.current) {
                      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                    }
                  }, 150);
                }
              }}
              isPlaying={isPlaying}
              onTogglePlay={togglePlayPause}
              currentTime={currentTime}
              duration={duration}
              streakDays={analyticsSummary?.streakDays || 0}
              dueReviewCount={dueWordsCount}
              onOpenSrs={() => setIsSrsOpen(true)}
              onOpenVocab={() => setCurrentView('vocab')}
              onOpenAnalytics={() => {
                refreshAnalytics();
                setCurrentView('analytics');
              }}
              onOpenStorage={() => {
                refreshOfflineCount();
                setCurrentView('storage');
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Reading Top Bar */}
              <ReaderTopBar
                currentBook={currentBookObj}
                currentChapter={currentChapterObj}
                onOpenShelf={() => setIsShelfOpen(true)}
                playerMode={playerMode}
                onSwitchPlayerMode={handleSwitchPlayerMode}
                studyMode={studyMode}
                setStudyMode={handleSwitchStudyMode}
                showTranslation={showTranslation}
                onToggleTranslation={() => setShowTranslation(prev => !prev)}
                onOpenShortcuts={() => setIsShortcutsOpen(true)}
                onBackToShelf={() => handleSwitchCurrentView('bookshelf')}
                isOfflinePlaying={isOfflinePlaying}
              />

              {/* Central Study Area: Dual-Engine Switch (Podcast Companion vs Studio Workshop) */}
              <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
                {isLoadingContent ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-stone-500">
                    <Loader2 size={32} className="animate-spin text-amber-600" />
                    <p className="text-sm font-reading font-medium">正在开启有声原著羊皮卷...</p>
                  </div>
                ) : playerMode === 'podcast' ? (
                  <PodcastPlayerView
                    currentBook={currentBookObj}
                    currentChapter={currentChapterObj}
                    cues={cues}
                    activeCueIndex={activeCueIndex}
                    currentTime={currentTime}
                    duration={duration}
                    isPlaying={isPlaying}
                    playbackRate={playbackRate}
                    onChangePlaybackRate={setPlaybackRate}
                    onPlayPause={togglePlayPause}
                    onSeek={seekTo}
                    onSeekRelative={seekRelative}
                    onSeekToCue={seekToCue}
                    onPrevSentence={handlePrevSentence}
                    onNextSentence={handleNextSentence}
                    sleepTimerMode={sleepTimerMode}
                    sleepTimerRemaining={formattedSleepTime}
                    onToggleSleepTimer={handleToggleSleepTimer}
                    showTranslation={showTranslation}
                    onToggleTranslation={() => setShowTranslation(prev => !prev)}
                    bookmarkedCueIds={currentChapterBookmarkedCueIds}
                    onToggleBookmarkCue={(cue) => toggleBookmarkSentence(cue, selectedBook, selectedChapter)}
                  />
                ) : (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
                      {studyMode === 'dictation' ? (
                        <DictationStudio
                          cues={cues}
                          activeCueIndex={activeCueIndex}
                          onSeekToCue={(cue, autoPlay, opts) => seekToCue(cue, autoPlay, { stopAtEnd: true, ...opts })}
                          onPlayPause={togglePlayPause}
                          isPlaying={isPlaying}
                          playbackRate={playbackRate}
                          onChangePlaybackRate={setPlaybackRate}
                          onPrevSentence={handlePrevSentence}
                          onNextSentence={handleNextSentence}
                          onReplayCurrentSentence={(cue, opts) => handleReplayCurrentSentence({ stopAtEnd: true, ...opts })}
                          chapterId={selectedChapter}
                          chapterTitle={currentChapterObj?.cnTitle || currentChapterObj?.title || ''}
                          onCloseStudio={() => handleSwitchStudyMode('normal')}
                          isParchment={isParchment}
                          onSaveErrorWordsToVocab={(errorWords) => {
                            errorWords.forEach(w => {
                              toggleSaveWord({ word: w, translation: '拼写错词重炼' }, activeCue, selectedBook, selectedChapter);
                            });
                          }}
                          showTranslation={showTranslation}
                          onToggleTranslation={() => setShowTranslation(prev => !prev)}
                        />
                      ) : (
                        <SubtitleViewer
                          cues={cues}
                          activeCueIndex={activeCueIndex}
                          onSeekToCue={seekToCue}
                          onWordClick={handleWordClick}
                          studyMode={studyMode}
                          showTranslation={showTranslation}
                          setShowTranslation={setShowTranslation}
                          isLoopSentence={isLoopSentence}
                          onToggleLoopSentence={() => setIsLoopSentence(prev => !prev)}
                          onRecordCue={openRecorder}
                          isParchment={isParchment}
                          onSaveToVocab={(wordData, sentence) => toggleSaveWord(wordData, sentence, selectedBook, selectedChapter)}
                          onPrevSentence={handlePrevSentence}
                          onNextSentence={handleNextSentence}
                          bookmarkedCueIds={currentChapterBookmarkedCueIds}
                          onToggleBookmarkCue={(cue) => toggleBookmarkSentence(cue, selectedBook, selectedChapter)}
                          isPlaying={isPlaying}
                          playbackRate={playbackRate}
                          onChangePlaybackRate={setPlaybackRate}
                          onReplayCurrentSentence={handleReplayCurrentSentence}
                        />
                      )}
                    </div>

                    {/* Bottom Audio Controller (Active in Studio Mode when not in dictation) */}
                    {studyMode !== 'dictation' && (
                      <AudioPlayer
                        currentBook={currentBookObj}
                        currentChapter={currentChapterObj}
                        audioSrc={audioUrl}
                        currentTime={currentTime}
                        duration={duration}
                        isPlaying={isPlaying}
                        onPlayPause={togglePlayPause}
                        onSeek={seekTo}
                        onSeekRelative={seekRelative}
                        onPrevSentence={handlePrevSentence}
                        onNextSentence={handleNextSentence}
                        onReplayCurrentSentence={handleReplayCurrentSentence}
                        isLoopSentence={isLoopSentence}
                        onToggleLoopSentence={() => setIsLoopSentence(prev => !prev)}
                        playbackRate={playbackRate}
                        onChangePlaybackRate={setPlaybackRate}
                        volume={volume}
                        onChangeVolume={setVolume}
                        activeCue={activeCue}
                        totalCues={cues.length}
                        activeCueIndex={activeCueIndex}
                        isParchment={isParchment}
                        onToggleRecorder={() => {
                          if (activeCue) openRecorder(activeCue);
                        }}
                        isRecordingActive={isRecorderOpen}
                        sleepTimerMode={sleepTimerMode}
                        sleepTimerRemaining={formattedSleepTime}
                        onToggleSleepTimer={handleToggleSleepTimer}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Universal Persistent Podcast Capsule (Shown across non-player views whenever chapter is selected) */}
        {currentView !== 'player' && Boolean(currentChapterObj) && (
          <GlobalPodcastCapsule
            currentBook={currentBookObj}
            currentChapter={currentChapterObj}
            isPlaying={isPlaying}
            onPlayPause={togglePlayPause}
            onPrevSentence={handlePrevSentence}
            onNextSentence={handleNextSentence}
            onSeek={seekTo}
            onEnterPlayer={() => setCurrentView('player')}
            currentTime={currentTime}
            duration={duration}
            playbackRate={playbackRate}
            onChangePlaybackRate={setPlaybackRate}
            sleepTimerMode={sleepTimerMode}
            sleepTimerRemaining={formattedSleepTime}
            onToggleSleepTimer={handleToggleSleepTimer}
            isMobile={isMobile}
            currentView={currentView}
          />
        )}

        {/* Mobile Native Bottom Navigation Bar (< 768px in non-player views) */}
        {isMobile && currentView !== 'player' && (
          <MobileBottomNav
            currentView={currentView}
            onSwitchView={handleSwitchCurrentView}
            vocabCount={vocabList.length}
            onOpenVocab={() => handleSwitchCurrentView('vocab')}
            onOpenAnalytics={() => {
              refreshAnalytics();
              handleSwitchCurrentView('analytics');
            }}
          />
        )}
      </div>

      {/* ── 4. Centralized Modals & Drawers ─────────────────────────── */}
      <BookShelfDrawer
        isOpen={isShelfOpen}
        onClose={() => setIsShelfOpen(false)}
        books={books}
        selectedBookId={selectedBook}
        selectedChapterId={selectedChapter}
        onSelectBook={selectBook}
        onSelectChapter={(chapterId, shouldPlay = true) => {
          selectChapter(chapterId);
          setCurrentView('player');
          if (shouldPlay) {
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
              }
            }, 150);
          }
        }}
        onRefreshCatalog={() => fetchCatalog(true)}
        isRefreshing={isRefreshing}
        isParchment={isParchment}
        isPlaying={isPlaying}
        onTogglePlay={togglePlayPause}
        getChapterBookmarkCount={getChapterBookmarkCount}
      />

      <WordModal
        wordData={selectedWordData}
        currentSentence={activeWordSentence}
        onClose={closeWordModal}
        onSaveToVocab={(wd, sc) => toggleSaveWord(wd, sc, selectedBook, selectedChapter)}
        isSaved={selectedWordData ? isWordSaved(selectedWordData.word) : false}
        isParchment={isParchment}
      />

      <VocabularyDrawer
        isOpen={isVocabOpen}
        onClose={() => setIsVocabOpen(false)}
        vocabList={vocabList}
        onRemoveWord={removeWord}
        onClearAll={clearAllVocab}
        isParchment={isParchment}
        onOpenSrs={() => setIsSrsOpen(true)}
        bookmarkedSentences={bookmarkedSentences}
        onRemoveBookmark={removeBookmark}
        onClearAllBookmarks={clearAllBookmarks}
        onPlaySentence={handlePlayBookmarkedSentence}
      />

      <SrsFlashcardModal
        isOpen={isSrsOpen}
        onClose={() => setIsSrsOpen(false)}
        vocabList={vocabList}
        onUpdateVocabList={setVocabList}
        isParchment={isParchment}
      />

      <ShadowingRecorder
        isOpen={isRecorderOpen}
        onClose={closeRecorder}
        currentCue={currentRecordCue}
        onPlayOriginalSnippet={handlePlayOriginalSnippet}
        isParchment={isParchment}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        isParchment={isParchment}
      />

      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        isParchment={isParchment}
        vocabCount={vocabList.length}
      />

      <StorageManagerModal
        isOpen={isStorageOpen}
        onClose={() => {
          setIsStorageOpen(false);
          refreshOfflineCount();
        }}
        isParchment={isParchment}
        currentBook={currentBookObj}
        currentChapter={currentChapterObj}
        onPlayChapter={handlePlayFromStorage}
      />

      {/* Adolescent Visual Health Sentinel (20-20-20 Eye Care Standard) */}
      {showEyeCarePrompt && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-stone-900/95 text-stone-100 px-4 py-3 rounded-2xl border border-amber-400/60 backdrop-blur-md flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0 text-amber-300">
              <Eye size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-200">视力关怀 · 已专注精听 35 分钟</p>
              <p className="text-[11px] text-stone-300 leading-tight">建议远眺 6 米外的窗外 20 秒，放松眼部睫状肌哦</p>
            </div>
          </div>
          <button
            onClick={dismissEyeCarePrompt}
            className="shrink-0 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-all cursor-pointer"
          >
            我知道啦
          </button>
        </div>
      )}

      {/* Offline Network Status Notification (W3C Network API) */}
      {isOffline && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full border backdrop-blur-sm flex items-center gap-2 text-xs font-bold animate-fadeIn shadow-none ${
          isOfflineUncached
            ? 'bg-rose-950/95 text-rose-200 border-rose-400/60'
            : 'bg-stone-900/90 text-amber-200 border-amber-400/40'
        }`}>
          <WifiOff size={14} className={isOfflineUncached ? 'text-rose-400 shrink-0' : 'text-amber-400 shrink-0'} />
          <span>
            {isOfflineUncached
              ? '需要网络连接：本章节尚未下载至魔法行囊'
              : '离线魔法模式 · 正在畅享已下载本地章节'}
          </span>
          {isOfflineUncached && (
            <button
              onClick={() => setIsStorageOpen(true)}
              className="ml-1 underline text-amber-300 hover:text-white cursor-pointer"
            >
              打开行囊
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
