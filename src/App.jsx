import React, { useState, useEffect, useCallback, useTransition } from 'react';
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
import { MobileMiniPlayer } from './components/navigation/MobileMiniPlayer';
import { ReaderTopBar } from './components/navigation/ReaderTopBar';
import { Loader2, Eye, WifiOff } from 'lucide-react';

// Decoupled Domain Custom Hooks
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { useCatalog } from './hooks/useCatalog';
import { useStudyTracking } from './hooks/useStudyTracking';
import { useVocabManager } from './hooks/useVocabManager';
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
    cachedChaptersCount,
    selectBook,
    selectChapter,
    fetchCatalog,
    refreshOfflineCount
  } = catalog;

  // Chapter auto advance callback
  const handleChapterAutoAdvance = useCallback(() => {
    const chapters = currentBookObj?.chapters || [];
    const currentIndex = chapters.findIndex(c => c.id === selectedChapter);
    if (currentIndex !== -1 && currentIndex < chapters.length - 1) {
      selectChapter(chapters[currentIndex + 1].id);
    }
  }, [currentBookObj, selectedChapter, selectChapter]);

  const audio = useAudioPlayback({
    cues,
    currentBookObj,
    currentChapterObj,
    onChapterAutoAdvance: handleChapterAutoAdvance
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

  // 2. View Mode & Study Mode State
  const [currentView, setCurrentView] = useState(() => {
    try {
      const saved = localStorage.getItem('hp_current_view');
      return saved === 'player' ? 'player' : 'bookshelf';
    } catch {
      return 'bookshelf';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hp_current_view', currentView);
    } catch {}
  }, [currentView]);

  const [studyMode, setStudyMode] = useState('normal'); // 'normal' | 'blind' | 'dictation'
  const [showTranslation, setShowTranslation] = useState(true);

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
        onSwitchView={setCurrentView}
        studyMode={studyMode}
        setStudyMode={setStudyMode}
        streakDays={analyticsSummary?.streakDays || 0}
        todayListeningSeconds={analyticsSummary?.todayListeningSeconds || 0}
        vocabCount={vocabList.length}
        cachedChaptersCount={cachedChaptersCount}
        onOpenVocab={() => setIsVocabOpen(true)}
        onOpenAnalytics={() => {
          refreshAnalytics();
          setIsAnalyticsOpen(true);
        }}
        onOpenStorage={() => {
          refreshOfflineCount();
          setIsStorageOpen(true);
        }}
        canInstallPwa={canInstallPwa}
        onInstallPwa={handleInstallPwa}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      {/* ── 2. Tablet Compact Icon Rail (768px - 1023px) ────────────── */}
      <TabletRail
        currentView={currentView}
        onSwitchView={setCurrentView}
        studyMode={studyMode}
        setStudyMode={setStudyMode}
        streakDays={analyticsSummary?.streakDays || 0}
        vocabCount={vocabList.length}
        cachedChaptersCount={cachedChaptersCount}
        onOpenVocab={() => setIsVocabOpen(true)}
        onOpenAnalytics={() => {
          refreshAnalytics();
          setIsAnalyticsOpen(true);
        }}
        onOpenStorage={() => {
          refreshOfflineCount();
          setIsStorageOpen(true);
        }}
      />

      {/* ── 3. Main Workspace Area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Mobile Minimal Top Bar (< 768px, Bookshelf view only) */}
        {currentView === 'bookshelf' && (
          <MobileTopBar
            currentView={currentView}
            onSwitchView={setCurrentView}
            currentBook={currentBookObj}
            currentChapter={currentChapterObj}
            onOpenShelf={() => setIsShelfOpen(true)}
            studyMode={studyMode}
            setStudyMode={setStudyMode}
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

        {/* ── Content Viewport: Bookshelf vs Player Studio ── */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
          {currentView === 'bookshelf' ? (
            <BookshelfView
              books={books}
              selectedBook={selectedBook}
              selectedChapter={selectedChapter}
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
              isPlaying={isPlaying}
              onTogglePlay={togglePlayPause}
              currentTime={currentTime}
              duration={duration}
              streakDays={analyticsSummary?.streakDays || 0}
              dueReviewCount={dueWordsCount}
              onOpenSrs={() => setIsSrsOpen(true)}
              onOpenVocab={() => setIsVocabOpen(true)}
              onOpenAnalytics={() => {
                refreshAnalytics();
                setIsAnalyticsOpen(true);
              }}
              onOpenStorage={() => {
                refreshOfflineCount();
                setIsStorageOpen(true);
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Reading Top Bar */}
              <ReaderTopBar
                currentBook={currentBookObj}
                currentChapter={currentChapterObj}
                onOpenShelf={() => setIsShelfOpen(true)}
                studyMode={studyMode}
                setStudyMode={setStudyMode}
                showTranslation={showTranslation}
                onToggleTranslation={() => setShowTranslation(prev => !prev)}
                onOpenShortcuts={() => setIsShortcutsOpen(true)}
                onBackToShelf={() => setCurrentView('bookshelf')}
                isOfflinePlaying={isOfflinePlaying}
              />

              {/* Central Study Area */}
              <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
                {isLoadingContent ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-stone-500">
                    <Loader2 size={32} className="animate-spin text-amber-600" />
                    <p className="text-sm font-reading font-medium">正在开启有声原著羊皮卷...</p>
                  </div>
                ) : studyMode === 'dictation' ? (
                  <div className="flex-1 overflow-y-auto px-4 py-4 sm:py-6 ios-scroll">
                    <DictationStudio
                      cues={cues}
                      activeCueIndex={activeCueIndex}
                      onSeekToCue={seekToCue}
                      onPlayPause={togglePlayPause}
                      isPlaying={isPlaying}
                      playbackRate={playbackRate}
                      onChangePlaybackRate={setPlaybackRate}
                      onPrevSentence={handlePrevSentence}
                      onNextSentence={handleNextSentence}
                      onReplayCurrentSentence={handleReplayCurrentSentence}
                      chapterId={selectedChapter}
                      chapterTitle={currentChapterObj?.cnTitle || currentChapterObj?.title || ''}
                      onCloseStudio={() => setStudyMode('normal')}
                      isParchment={isParchment}
                      onSaveErrorWordsToVocab={(errorWords) => {
                        errorWords.forEach(w => {
                          toggleSaveWord({ word: w, translation: '拼写错词重炼' }, activeCue, selectedBook, selectedChapter);
                        });
                      }}
                    />
                  </div>
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
                  />
                )}
              </div>

              {/* Bottom Audio Controller */}
              <AudioPlayer
                currentBook={currentBookObj}
                currentChapter={currentChapterObj}
                audioSrc={audioUrl}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onPlayPause={togglePlayPause}
                onSeek={seekTo}
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
              />
            </div>
          )}
        </div>

        {/* Mobile Floating Mini Player (Bookshelf view with active audio) */}
        {currentView === 'bookshelf' && (currentTime > 0 || isPlaying) && (
          <MobileMiniPlayer
            currentBook={currentBookObj}
            currentChapter={currentChapterObj}
            isPlaying={isPlaying}
            onPlayPause={togglePlayPause}
            currentTime={currentTime}
            duration={duration}
            onOpenPlayer={() => setCurrentView('player')}
            onNextSentence={handleNextSentence}
          />
        )}

        {/* Mobile Native Bottom Navigation Bar (< 768px in bookshelf view) */}
        {isMobile && currentView === 'bookshelf' && (
          <MobileBottomNav
            currentView={currentView}
            onSwitchView={setCurrentView}
            vocabCount={vocabList.length}
            onOpenVocab={() => setIsVocabOpen(true)}
            onOpenAnalytics={() => {
              refreshAnalytics();
              setIsAnalyticsOpen(true);
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
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-stone-900/90 text-amber-200 border border-amber-400/40 backdrop-blur-sm flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <WifiOff size={14} className="text-amber-400 shrink-0" />
          <span>离线魔法模式 · 正在畅享已下载本地章节</span>
        </div>
      )}
    </div>
  );
}

export default App;
