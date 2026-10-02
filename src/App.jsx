import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BookShelfDrawer } from './components/BookShelfDrawer';
import { AudioPlayer } from './components/AudioPlayer';
import { SubtitleViewer } from './components/SubtitleViewer';
import { DictationStudio } from './components/DictationStudio';
import { WordModal } from './components/WordModal';
import { VocabularyDrawer } from './components/VocabularyDrawer';
import { ShadowingRecorder } from './components/ShadowingRecorder';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { StorageManagerModal } from './components/StorageManagerModal';
import { HP_BOOKS, SAMPLE_CHAPTER_1_VTT } from './data/chapters';
import { parseVTT } from './utils/vttParser';
import { lookupWord } from './data/hpDictionary';
import { 
  recordListeningSeconds, 
  markChapterCompleted, 
  getAnalyticsSummary 
} from './utils/analyticsStore';
import { 
  getCachedChapter, 
  getOfflineStorageInfo 
} from './utils/offlineStorage';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export function App() {
  // Theme & Modes (Default to eye-protecting bright academy parchment for students)
  const [isParchment, setIsParchment] = useState(() => {
    try {
      const saved = localStorage.getItem('hp_theme_parchment');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (isParchment) {
      document.body.classList.add('theme-parchment');
    } else {
      document.body.classList.remove('theme-parchment');
    }
    try {
      localStorage.setItem('hp_theme_parchment', String(isParchment));
    } catch {}
  }, [isParchment]);

  const [studyMode, setStudyMode] = useState('normal'); // 'normal' | 'blind' | 'dictation'
  const [showTranslation, setShowTranslation] = useState(true);

  // Books catalog (dynamically discovered from R2)
  const [books, setBooks] = useState(HP_BOOKS);
  const [selectedBook, setSelectedBook] = useState('hp-book-1');
  const [selectedChapter, setSelectedChapter] = useState('hp-book-1_ep01');
  const [cues, setCues] = useState([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  // Audio Playback
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(0.85);
  const [isLoopSentence, setIsLoopSentence] = useState(false);
  const [activeCueIndex, setActiveCueIndex] = useState(0);

  // Modals & Drawers
  const [isShelfOpen, setIsShelfOpen] = useState(false);
  const [selectedWordData, setSelectedWordData] = useState(null);
  const [activeWordSentence, setActiveWordSentence] = useState(null);
  const [isVocabOpen, setIsVocabOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [currentRecordCue, setCurrentRecordCue] = useState(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [cachedChaptersCount, setCachedChaptersCount] = useState(0);
  const [isOfflinePlaying, setIsOfflinePlaying] = useState(false);
  const previousBlobUrlRef = useRef(null);
  const [analyticsSummary, setAnalyticsSummary] = useState(() => {
    try {
      return getAnalyticsSummary();
    } catch {
      return null;
    }
  });

  // Query offline storage count
  const refreshOfflineCount = async () => {
    try {
      const info = await getOfflineStorageInfo();
      setCachedChaptersCount(info.chapters ? info.chapters.length : 0);
    } catch (err) {
      console.warn('Failed to query offline info:', err);
    }
  };

  useEffect(() => {
    refreshOfflineCount();
    return () => {
      if (previousBlobUrlRef.current) {
        URL.revokeObjectURL(previousBlobUrlRef.current);
      }
    };
  }, []);

  // Active listening duration tracking
  const listeningSecondsAccumulator = useRef(0);
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        listeningSecondsAccumulator.current += 1;
        // Batch flush every 5 seconds of active listening
        if (listeningSecondsAccumulator.current >= 5) {
          recordListeningSeconds(listeningSecondsAccumulator.current);
          listeningSecondsAccumulator.current = 0;
          setAnalyticsSummary(getAnalyticsSummary());
        }
      }, 1000);
    } else {
      // Flush any accumulated seconds upon pausing
      if (listeningSecondsAccumulator.current > 0) {
        recordListeningSeconds(listeningSecondsAccumulator.current);
        listeningSecondsAccumulator.current = 0;
        setAnalyticsSummary(getAnalyticsSummary());
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (listeningSecondsAccumulator.current > 0) {
        recordListeningSeconds(listeningSecondsAccumulator.current);
        listeningSecondsAccumulator.current = 0;
      }
    };
  }, [isPlaying]);

  // Flush remaining listening seconds on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (listeningSecondsAccumulator.current > 0) {
        recordListeningSeconds(listeningSecondsAccumulator.current);
        listeningSecondsAccumulator.current = 0;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Vocabulary list in localStorage
  const [vocabList, setVocabList] = useState(() => {
    try {
      const saved = localStorage.getItem('hp_vocab_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save vocab to localStorage
  useEffect(() => {
    localStorage.setItem('hp_vocab_list', JSON.stringify(vocabList));
  }, [vocabList]);

  // PWA Install Event Listener
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

  // 1. Fetch Dynamic Catalog from R2
  const fetchCatalog = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    try {
      const url = forceRefresh ? `${API_BASE}/api/catalog?refresh=1` : `${API_BASE}/api/catalog`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.books && data.books.length > 0) {
          setBooks(data.books);
          // If current selected book doesn't exist, pick first
          if (!data.books.some(b => b.id === selectedBook)) {
            const firstBook = data.books[0];
            setSelectedBook(firstBook.id);
            if (firstBook.chapters && firstBook.chapters.length > 0) {
              setSelectedChapter(firstBook.chapters[0].id);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Backend catalog API offline, using fallback:', err);
    } finally {
      if (forceRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCatalog(false);
  }, []);

  // Find active book & chapter objects
  const currentBookObj = books.find(b => b.id === selectedBook) || books[0] || HP_BOOKS[0];
  const currentChapterObj = (currentBookObj.chapters || []).find(c => c.id === selectedChapter) || (currentBookObj.chapters || [])[0];

  // 2. Load Chapter Audio and Subtitles (checks offline IndexedDB cache first, then backend proxy)
  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      if (!currentChapterObj) return;
      setIsLoadingContent(true);

      // Clean up previous blob URL if any to prevent memory leaks
      if (previousBlobUrlRef.current) {
        URL.revokeObjectURL(previousBlobUrlRef.current);
        previousBlobUrlRef.current = null;
      }

      // Check if this chapter is already cached locally in IndexedDB
      try {
        const cached = await getCachedChapter(currentChapterObj.id);
        if (cached && cached.audioBlob && !cancelled) {
          const blobUrl = URL.createObjectURL(cached.audioBlob);
          previousBlobUrlRef.current = blobUrl;
          setAudioUrl(blobUrl);
          setIsOfflinePlaying(true);

          if (cached.vttText) {
            setCues(parseVTT(cached.vttText));
          } else {
            setCues(parseVTT(SAMPLE_CHAPTER_1_VTT));
          }
          setIsLoadingContent(false);
          return;
        }
      } catch (cacheErr) {
        console.warn('Offline cache lookup error:', cacheErr);
      }

      // Online playback fallback through backend proxy
      setIsOfflinePlaying(false);
      const audioKey = currentChapterObj.audioKey || `podcasts/${selectedBook}/episodes/${currentChapterObj.epId || 'ep01'}/audio.mp3`;
      const subKey = currentChapterObj.subtitleKey || `podcasts/${selectedBook}/episodes/${currentChapterObj.epId || 'ep01'}/subtitle.vtt`;

      const newAudioUrl = `${API_BASE}/api/media/${audioKey}`;
      const newVttUrl = `${API_BASE}/api/subtitles/${subKey}`;

      if (!cancelled) setAudioUrl(newAudioUrl);

      try {
        const res = await fetch(newVttUrl);
        if (res.ok) {
          const text = await res.text();
          if (!cancelled) setCues(parseVTT(text));
        } else {
          console.warn(`Subtitle fetch returned ${res.status}, using sample`);
          if (!cancelled) setCues(parseVTT(SAMPLE_CHAPTER_1_VTT));
        }
      } catch (err) {
        console.error('Error fetching VTT:', err);
        if (!cancelled) setCues(parseVTT(SAMPLE_CHAPTER_1_VTT));
      } finally {
        if (!cancelled) setIsLoadingContent(false);
      }
    }

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [selectedChapter, selectedBook]);

  // Audio Events & Sync
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const curTime = audioRef.current.currentTime;
    setCurrentTime(curTime);

    if (cues.length > 0) {
      const activeCue = cues[activeCueIndex];

      // Single sentence loop
      if (isLoopSentence && activeCue) {
        if (curTime >= activeCue.endTime - 0.15) {
          audioRef.current.currentTime = activeCue.startTime;
          return;
        }
      }

      // Check if cue still valid
      if (!activeCue || curTime < activeCue.startTime || curTime >= activeCue.endTime) {
        const foundIdx = cues.findIndex(c => curTime >= c.startTime && curTime < c.endTime);
        if (foundIdx !== -1 && foundIdx !== activeCueIndex) {
          setActiveCueIndex(foundIdx);
        }
      }
    }

    // Hook chapter completion near audio end
    if (duration > 0 && curTime >= duration - 1.5 && selectedChapter) {
      markChapterCompleted(selectedChapter);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (selectedChapter) {
      markChapterCompleted(selectedChapter);
      setAnalyticsSummary(getAnalyticsSummary());
    }
  };

  // Play / Pause Toggle
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
      });
    }
  };

  // Seek
  const handleSeek = (time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Seek to specific cue
  const handleSeekToCue = (cue) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = cue.startTime;
    setCurrentTime(cue.startTime);
    const idx = cues.findIndex(c => c.id === cue.id);
    if (idx !== -1) setActiveCueIndex(idx);
    if (!isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.warn(e));
    }
  };

  // Prev / Next Sentence
  const handlePrevSentence = () => {
    if (activeCueIndex > 0) {
      const prevCue = cues[activeCueIndex - 1];
      handleSeekToCue(prevCue);
    }
  };

  const handleNextSentence = () => {
    if (activeCueIndex < cues.length - 1) {
      const nextCue = cues[activeCueIndex + 1];
      handleSeekToCue(nextCue);
    }
  };

  // Replay Current Sentence
  const handleReplayCurrentSentence = () => {
    const curCue = cues[activeCueIndex];
    if (curCue && audioRef.current) {
      audioRef.current.currentTime = curCue.startTime;
      setCurrentTime(curCue.startTime);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.warn(e));
      }
    }
  };

  // Speed change
  const handleChangePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Volume change
  const handleChangeVolume = (vol) => {
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  // Word Click -> Open Dictionary Modal
  const handleWordClick = async (rawWord, sentenceCue) => {
    const lookupResult = await lookupWord(rawWord);
    if (lookupResult) {
      setSelectedWordData(lookupResult);
      setActiveWordSentence(sentenceCue);
    }
  };

  // Save to Vocabulary Notebook
  const handleSaveToVocab = (wordData, sentenceCue) => {
    const exists = vocabList.some(v => v.word.toLowerCase() === wordData.word.toLowerCase());
    if (exists) {
      setVocabList(prev => prev.filter(v => v.word.toLowerCase() !== wordData.word.toLowerCase()));
    } else {
      const newEntry = {
        id: Date.now().toString(),
        word: wordData.word,
        front: wordData.word,
        phonetic: wordData.phonetic || '',
        pos: wordData.pos || '',
        partOfSpeech: wordData.pos || '',
        translation: wordData.translation || '',
        definition: wordData.translation || wordData.explanation || '',
        explanation: wordData.explanation || '',
        lore: wordData.lore || '',
        isHpLore: wordData.isHpLore || false,
        context: sentenceCue ? sentenceCue.text : '',
        contextQuote: sentenceCue ? sentenceCue.text : '',
        startTime: sentenceCue ? sentenceCue.startTime : undefined,
        endTime: sentenceCue ? sentenceCue.endTime : undefined,
        chapterId: selectedChapter || '',
        bookId: selectedBook || '',
        chapterTitle: currentChapterObj ? currentChapterObj.title : '',
        tags: [selectedBook, selectedChapter].filter(Boolean),
        dateAdded: new Date().toLocaleDateString()
      };
      setVocabList(prev => [newEntry, ...prev]);
    }
  };

  // Remove word from vocab list
  const handleRemoveVocabWord = (word) => {
    setVocabList(prev => prev.filter(v => v.word.toLowerCase() !== word.toLowerCase()));
  };

  // Shadowing record trigger
  const handleRecordCue = (cue) => {
    setCurrentRecordCue(cue);
    setIsRecorderOpen(true);
  };

  // Play original snippet for shadowing recorder
  const handlePlayOriginalSnippet = (cue) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = cue.startTime;
    audioRef.current.play();
    setIsPlaying(true);

    const checkSnippetEnd = () => {
      if (audioRef.current && audioRef.current.currentTime >= cue.endTime) {
        audioRef.current.pause();
        setIsPlaying(false);
        audioRef.current.removeEventListener('timeupdate', checkSnippetEnd);
      }
    };
    audioRef.current.addEventListener('timeupdate', checkSnippetEnd);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
          e.preventDefault();
          handleReplayCurrentSentence();
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
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        handleChangeVolume(Math.min(1, volume + 0.1));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleChangeVolume(Math.max(0, volume - 0.1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, activeCueIndex, cues, isLoopSentence, volume, studyMode]);

  const activeCue = cues[activeCueIndex];
  const isWordSaved = selectedWordData 
    ? vocabList.some(v => v.word.toLowerCase() === selectedWordData.word.toLowerCase())
    : false;

  return (
    <div className={`h-screen overflow-hidden flex flex-col transition-colors duration-300 ${
      isParchment ? 'theme-parchment' : 'bg-[#0f172a] text-slate-100'
    }`}>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Top Header */}
      <Header
        books={books}
        selectedBook={selectedBook}
        setSelectedBook={setSelectedBook}
        selectedChapter={selectedChapter}
        setSelectedChapter={setSelectedChapter}
        studyMode={studyMode}
        setStudyMode={setStudyMode}
        isParchment={isParchment}
        setIsParchment={setIsParchment}
        onOpenVocab={() => setIsVocabOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenShelf={() => setIsShelfOpen(true)}
        onRefreshCatalog={() => fetchCatalog(true)}
        isRefreshing={isRefreshing}
        onInstallPwa={handleInstallPwa}
        canInstallPwa={canInstallPwa}
        vocabCount={vocabList.length}
        onOpenAnalytics={() => {
          setAnalyticsSummary(getAnalyticsSummary());
          setIsAnalyticsOpen(true);
        }}
        streakDays={analyticsSummary?.streakDays || 0}
        onOpenStorageManager={() => {
          refreshOfflineCount();
          setIsStorageOpen(true);
        }}
        cachedChaptersCount={cachedChaptersCount}
      />


      {/* ── Two-column body: Sidebar + Main Content ─────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Left Sidebar — book cover + chapter list (hidden on mobile) */}
        <Sidebar
          currentBook={currentBookObj}
          currentChapter={currentChapterObj}
          onSelectChapter={setSelectedChapter}
          onOpenShelf={() => setIsShelfOpen(true)}
          onRefreshCatalog={() => fetchCatalog(true)}
          isRefreshing={isRefreshing}
          isParchment={isParchment}
          isOfflinePlaying={isOfflinePlaying}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {isLoadingContent ? (
            <div className="flex-1 flex items-center justify-center py-32 text-[#f3d38c]">
              <div className="flex flex-col items-center space-y-3">
                <span className="text-4xl animate-spin">⚡</span>
                <span className="font-magical text-base text-gold-glow">
                  正在从 R2 调取霍格沃茨原声与精听字幕...
                </span>
              </div>
            </div>
          ) : studyMode === 'dictation' ? (
            // Mode 3: Interactive Dictation & Typing Studio
            <DictationStudio
              cues={cues}
              activeCueIndex={activeCueIndex}
              onSeekToCue={handleSeekToCue}
              onPlayPause={togglePlayPause}
              isPlaying={isPlaying}
              isParchment={isParchment}
              onNextCue={handleNextSentence}
              onPrevCue={handlePrevSentence}
              chapterId={selectedChapter}
              chapterTitle={currentChapterObj ? currentChapterObj.title : ''}
              onRecordResult={() => setAnalyticsSummary(getAnalyticsSummary())}
            />
          ) : (
            // Mode 1 & 2: Subtitle Viewer with Lumos Focus & Term Beacon
            <SubtitleViewer
              cues={cues}
              activeCueIndex={activeCueIndex}
              onSeekToCue={handleSeekToCue}
              onWordClick={handleWordClick}
              studyMode={studyMode}
              showTranslation={showTranslation}
              setShowTranslation={setShowTranslation}
              isLoopSentence={isLoopSentence}
              onToggleLoopSentence={() => setIsLoopSentence(!isLoopSentence)}
              onRecordCue={handleRecordCue}
              isParchment={isParchment}
              onSaveToVocab={handleSaveToVocab}
            />
          )}
        </main>
      </div>


      {/* Fixed Bottom Audio Player with Elder Wand & Cover Art */}
      <AudioPlayer
        currentBook={currentBookObj}
        currentChapter={currentChapterObj}
        audioSrc={audioUrl}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        onSeek={handleSeek}
        onPrevSentence={handlePrevSentence}
        onNextSentence={handleNextSentence}
        onReplayCurrentSentence={handleReplayCurrentSentence}
        isLoopSentence={isLoopSentence}
        onToggleLoopSentence={() => setIsLoopSentence(!isLoopSentence)}
        playbackRate={playbackRate}
        onChangePlaybackRate={handleChangePlaybackRate}
        volume={volume}
        onChangeVolume={handleChangeVolume}
        activeCue={activeCue}
        totalCues={cues.length}
        activeCueIndex={activeCueIndex}
        isParchment={isParchment}
        onToggleRecorder={() => {
          if (activeCue) handleRecordCue(activeCue);
        }}
        isRecordingActive={isRecorderOpen}
      />

      {/* Hogwarts Library Bookshelf Drawer */}
      <BookShelfDrawer
        isOpen={isShelfOpen}
        onClose={() => setIsShelfOpen(false)}
        books={books}
        selectedBookId={selectedBook}
        onSelectBook={(bookId) => {
          setSelectedBook(bookId);
          const b = books.find(x => x.id === bookId);
          if (b && b.chapters && b.chapters.length > 0) {
            setSelectedChapter(b.chapters[0].id);
          }
        }}
        onRefreshCatalog={() => fetchCatalog(true)}
        isRefreshing={isRefreshing}
        isParchment={isParchment}
      />

      {/* Dictionary Popover Modal */}
      <WordModal
        wordData={selectedWordData}
        currentSentence={activeWordSentence}
        onClose={() => setSelectedWordData(null)}
        onSaveToVocab={handleSaveToVocab}
        isSaved={isWordSaved}
        isParchment={isParchment}
      />

      {/* Vocabulary Drawer */}
      <VocabularyDrawer
        isOpen={isVocabOpen}
        onClose={() => setIsVocabOpen(false)}
        vocabList={vocabList}
        onRemoveWord={handleRemoveVocabWord}
        onClearAll={() => setVocabList([])}
        isParchment={isParchment}
      />

      {/* Shadowing Recorder */}
      <ShadowingRecorder
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        currentCue={currentRecordCue}
        onPlayOriginalSnippet={handlePlayOriginalSnippet}
        isParchment={isParchment}
      />

      {/* Shortcuts Guide Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        isParchment={isParchment}
      />

      {/* Visual Learning Analytics Dashboard Modal */}
      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        isParchment={isParchment}
        vocabCount={vocabList.length}
      />

      {/* Complete Offline Chapter Caching (Storage Manager Modal) */}
      <StorageManagerModal
        isOpen={isStorageOpen}
        onClose={() => {
          setIsStorageOpen(false);
          refreshOfflineCount();
        }}
        isParchment={isParchment}
        currentBook={currentBookObj}
        currentChapter={currentChapterObj}
        onPlayChapter={(chapterId) => {
          let foundBook = null;
          for (const b of books) {
            const ch = (b.chapters || []).find(c => c.id === chapterId);
            if (ch) {
              foundBook = b;
              break;
            }
          }
          if (foundBook && foundBook.id !== selectedBook) {
            setSelectedBook(foundBook.id);
          }
          setSelectedChapter(chapterId);
          setIsStorageOpen(false);
        }}
      />
    </div>
  );
}

export default App;
