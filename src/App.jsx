import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { BookshelfView } from './components/BookshelfView';
import { Sidebar } from './components/Sidebar';
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
import { HP_BOOKS, SAMPLE_CHAPTER_1_VTT } from './data/chapters';
import { parseVTT } from './utils/vttParser';
import { lookupWord } from './data/hpDictionary';
import { ensureSrsMetadata, getDueWords } from './utils/srsEngine';
import { 
  recordListeningSeconds, 
  markChapterCompleted, 
  getAnalyticsSummary,
  checkAndApplyTimeTurnerProtection 
} from './utils/analyticsStore';
import { 
  getCachedChapter, 
  getOfflineStorageInfo 
} from './utils/offlineStorage';
import { useBreakpoint } from './utils/useBreakpoint';
import { DesktopSidebar } from './components/navigation/DesktopSidebar';
import { TabletRail } from './components/navigation/TabletRail';
import { MobileTopBar } from './components/navigation/MobileTopBar';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import { MobileMiniPlayer } from './components/navigation/MobileMiniPlayer';
import { ReaderTopBar } from './components/navigation/ReaderTopBar';
import { Loader2, Eye, WifiOff } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export function App() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  // Theme: Exclusively eye-protecting bright academy parchment for students
  const isParchment = true;

  useEffect(() => {
    document.body.classList.add('theme-parchment');
  }, []);

  // Offline status tracking (W3C Network API)
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  // Adolescent 35-minute eye-care reminder state (20-20-20 rule)
  const [showEyeCarePrompt, setShowEyeCarePrompt] = useState(false);
  const continuousListeningSecondsRef = useRef(0);
  const hasShownEyeCarePromptRef = useRef(false);

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

  const [studyMode, setStudyMode] = useState('normal'); // 'normal' | 'blind' | 'dictation'
  const [showTranslation, setShowTranslation] = useState(true);

  // View mode: 'bookshelf' (iBooks-style library homepage) | 'player' (full interactive player)
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

  // Books catalog (dynamically discovered from R2)
  const [books, setBooks] = useState(HP_BOOKS);
  const [selectedBook, setSelectedBook] = useState(() => {
    try {
      const saved = localStorage.getItem('hp_last_played_book');
      return saved || 'hp-book-1';
    } catch {
      return 'hp-book-1';
    }
  });
  const [selectedChapter, setSelectedChapter] = useState(() => {
    try {
      const saved = localStorage.getItem('hp_last_played_chapter');
      return saved || 'hp-book-1_ep01';
    } catch {
      return 'hp-book-1_ep01';
    }
  });

  useEffect(() => {
    try {
      if (selectedBook) localStorage.setItem('hp_last_played_book', selectedBook);
      if (selectedChapter) localStorage.setItem('hp_last_played_chapter', selectedChapter);
    } catch {}
  }, [selectedBook, selectedChapter]);

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
  const [isSrsOpen, setIsSrsOpen] = useState(false);
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
    try {
      checkAndApplyTimeTurnerProtection();
      setAnalyticsSummary(getAnalyticsSummary());
    } catch {}
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

  // Vocabulary list in localStorage with SRS metadata scaffolding
  const [vocabList, setVocabList] = useState(() => {
    try {
      const saved = localStorage.getItem('hp_vocab_list');
      const list = saved ? JSON.parse(saved) : [];
      return Array.isArray(list) ? list.map(ensureSrsMetadata) : [];
    } catch {
      return [];
    }
  });

  // Save vocab to localStorage
  useEffect(() => {
    localStorage.setItem('hp_vocab_list', JSON.stringify(vocabList));
  }, [vocabList]);

  // Duolingo SRS: count words due for review today
  const dueWordsCount = getDueWords(vocabList).length;

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.books && data.books.length > 0) {
          // Strictly filter out any books/folders that have no audio files or 0 chapters
          const booksWithAudio = data.books.filter(b => b.chapters && b.chapters.length > 0);
          if (booksWithAudio.length > 0) {
            setBooks(booksWithAudio);
            // If current selected book doesn't exist, pick first valid book with audio
            if (!booksWithAudio.some(b => b.id === selectedBook)) {
              const firstBook = booksWithAudio[0];
              setSelectedBook(firstBook.id);
              if (firstBook.chapters && firstBook.chapters.length > 0) {
                setSelectedChapter(firstBook.chapters[0].id);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Backend catalog API offline, using fallback:', err.message);
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

      // Online playback: fetch in-memory Blob to prevent IDM hijacking and secure media
      setIsOfflinePlaying(false);
      const audioKey = currentChapterObj.audioKey || `podcasts/${selectedBook}/episodes/${currentChapterObj.epId || 'ep01'}/audio.mp3`;
      const subKey = currentChapterObj.subtitleKey || `podcasts/${selectedBook}/episodes/${currentChapterObj.epId || 'ep01'}/subtitle.vtt`;

      // Strip .mp3 extension to bypass IDM file-extension auto-intercept
      const streamKey = audioKey.replace(/\.(mp3|m4a|wav|aac|ogg|flac)$/i, '');
      const streamAudioUrl = `${API_BASE}/api/stream/audio/${streamKey}`;
      const newVttUrl = `${API_BASE}/api/subtitles/${subKey}`;

      // Concurrently fetch VTT subtitles and in-memory audio Blob
      const subPromise = (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const res = await fetch(newVttUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const text = await res.text();
            if (!cancelled) setCues(parseVTT(text));
          } else {
            console.warn(`Subtitle fetch returned ${res.status}, using sample`);
            if (!cancelled) setCues(parseVTT(SAMPLE_CHAPTER_1_VTT));
          }
        } catch (err) {
          console.warn('VTT fetch timed out or failed, using local chapter sample:', err.message);
          if (!cancelled) setCues(parseVTT(SAMPLE_CHAPTER_1_VTT));
        }
      })();

      const audioPromise = (async () => {
        try {
          const audioRes = await fetch(streamAudioUrl, {
            headers: { 'X-Requested-With': 'HogwartsAudioPlayer' }
          });
          if (audioRes.ok) {
            const audioBlob = await audioRes.blob();
            if (!cancelled) {
              const blobUrl = URL.createObjectURL(audioBlob);
              previousBlobUrlRef.current = blobUrl;
              setAudioUrl(blobUrl);
              return;
            }
          }
          // Fallback to obfuscated stream URL if blob conversion was not completed
          if (!cancelled) setAudioUrl(streamAudioUrl);
        } catch (err) {
          console.warn('In-memory audio blob fetch failed, falling back to stream URL:', err.message);
          if (!cancelled) setAudioUrl(streamAudioUrl);
        }
      })();

      await Promise.all([subPromise, audioPromise]);
      if (!cancelled) setIsLoadingContent(false);
    }

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [selectedChapter, selectedBook]);

  // Throttle timestamp for scrubber UI (update at most every 250ms to reduce re-renders)
  const lastTimeUpdateRef = useRef(0);

  // Audio Events & Sync
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    const curTime = audioRef.current.currentTime;

    if (cues.length > 0) {
      const activeCue = cues[activeCueIndex];

      // Single sentence loop
      if (isLoopSentence && activeCue) {
        if (curTime >= activeCue.endTime - 0.15) {
          audioRef.current.currentTime = activeCue.startTime;
          return;
        }
      }

      // Check if cue still valid — run every frame for accurate sync
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

    // Throttle scrubber state update to every 250ms to avoid excessive re-renders
    const now = performance.now();
    if (now - lastTimeUpdateRef.current >= 250) {
      lastTimeUpdateRef.current = now;
      setCurrentTime(curTime);

      // Adolescent Visual Health: Track continuous listening duration for 35min reminder
      if (isPlaying) {
        continuousListeningSecondsRef.current += 0.25;
        if (continuousListeningSecondsRef.current >= 2100 && !hasShownEyeCarePromptRef.current) {
          hasShownEyeCarePromptRef.current = true;
          setShowEyeCarePrompt(true);
        }
      }
    }
  }, [cues, activeCueIndex, isLoopSentence, duration, selectedChapter, isPlaying]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (selectedChapter) {
      markChapterCompleted(selectedChapter);
      setAnalyticsSummary(getAnalyticsSummary());
    }
  }, [selectedChapter]);

  // Play / Pause Toggle
  const togglePlayPause = useCallback(() => {
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
  }, [isPlaying]);

  // Seek
  const handleSeek = useCallback((time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  // Seek to specific cue with audio engineering soft seek volume transition (prevent headphone pop/click)
  const handleSeekToCue = useCallback((cue) => {
    if (!audioRef.current) return;
    if (isPlaying) {
      const origVol = audioRef.current.volume;
      audioRef.current.volume = 0;
      audioRef.current.currentTime = cue.startTime;
      setCurrentTime(cue.startTime);
      setTimeout(() => {
        if (audioRef.current) audioRef.current.volume = origVol;
      }, 20);
    } else {
      audioRef.current.currentTime = cue.startTime;
      setCurrentTime(cue.startTime);
    }
    const idx = cues.findIndex(c => c.id === cue.id);
    if (idx !== -1) setActiveCueIndex(idx);
    if (!isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.warn(e));
    }
  }, [cues, isPlaying]);

  // Prev / Next Sentence
  const handlePrevSentence = useCallback(() => {
    if (activeCueIndex > 0) {
      const prevCue = cues[activeCueIndex - 1];
      handleSeekToCue(prevCue);
    }
  }, [activeCueIndex, cues, handleSeekToCue]);

  const handleNextSentence = useCallback(() => {
    if (activeCueIndex < cues.length - 1) {
      const nextCue = cues[activeCueIndex + 1];
      handleSeekToCue(nextCue);
    }
  }, [activeCueIndex, cues, handleSeekToCue]);

  // Replay Current Sentence
  const handleReplayCurrentSentence = useCallback(() => {
    const curCue = cues[activeCueIndex];
    if (curCue && audioRef.current) {
      audioRef.current.currentTime = curCue.startTime;
      setCurrentTime(curCue.startTime);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.warn(e));
      }
    }
  }, [cues, activeCueIndex, isPlaying]);

  // Speed change
  const handleChangePlaybackRate = useCallback((rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  // Volume change
  const handleChangeVolume = useCallback((vol) => {
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  }, []);

  // Apple Web & iOS Media Session API (Lock screen, Dynamic Island, Control Center, AirPods)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentBookObj && currentChapter) {
      const chapterTitle = currentChapter.title || currentBookObj.cnTitle || '魔法英语精听';
      const artistName = 'J.K. Rowling · 霍格沃茨魔法学院';
      const albumName = currentBookObj.cnTitle || currentBookObj.title || '哈利·波特原版有声书';
      const origin = window.location.origin;
      const coverUrl = currentBookObj.id 
        ? `${origin}/api/raw/podcasts/${currentBookObj.id}/cover.jpg` 
        : `${origin}/apple-touch-icon.png`;

      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: chapterTitle,
          artist: artistName,
          album: albumName,
          artwork: [
            { src: coverUrl, sizes: '512x512', type: 'image/jpeg' },
            { src: `${origin}/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' },
            { src: `${origin}/icon-192.png`, sizes: '192x192', type: 'image/png' },
            { src: `${origin}/icon-512.png`, sizes: '512x512', type: 'image/png' }
          ]
        });
      } catch (e) {
        console.warn('MediaSession metadata error:', e);
      }
    }

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 5;
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(audioRef.current.currentTime - offset, 0);
        }
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 5;
        if (audioRef.current) {
          audioRef.current.currentTime = Math.min(audioRef.current.currentTime + offset, audioRef.current.duration || 9999);
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        handlePrevSentence();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handleNextSentence();
      });
    } catch (e) {
      console.warn('MediaSession actions error:', e);
    }
  }, [currentBookObj, currentChapter, audioUrl, handlePrevSentence, handleNextSentence]);

  // Sync playbackState to MediaSession
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // W3C Screen Wake Lock API: Prevent mobile screen timeout during active audiobook listening
  const wakeLockRef = useRef(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      try {
        if (!wakeLockRef.current) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        // Fail silently if battery saver restricts or unsupported
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {}
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [isPlaying, requestWakeLock, releaseWakeLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying, requestWakeLock]);

  // Resilient Audio Stalled / Waiting Auto-Recovery
  const stallTimeoutRef = useRef(null);

  const handleWaiting = useCallback(() => {
    if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
    // If audio stalls/waits for data for over 3 seconds during active playback, trigger light recovery
    stallTimeoutRef.current = setTimeout(() => {
      if (isPlaying && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    }, 3000);
  }, [isPlaying]);

  const handleCanPlay = useCallback(() => {
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = null;
    }
  }, []);

  const handleAudioError = useCallback((e) => {
    console.warn('Audio transient streaming error, attempting recovery:', e);
    if (audioRef.current && isPlaying && currentTime > 0) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.currentTime = currentTime;
          audioRef.current.play().catch(() => {});
        }
      }, 1000);
    }
  }, [isPlaying, currentTime]);

  // Word Click -> Open Dictionary Modal
  const handleWordClick = useCallback(async (rawWord, sentenceCue) => {
    const lookupResult = await lookupWord(rawWord);
    if (lookupResult) {
      setSelectedWordData(lookupResult);
      setActiveWordSentence(sentenceCue);
    }
  }, []);

  // Save to Vocabulary Notebook
  const handleSaveToVocab = useCallback((wordData, sentenceCue) => {
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
  }, [vocabList, selectedChapter, selectedBook, currentChapterObj]);

  // Remove word from vocab list
  const handleRemoveVocabWord = useCallback((word) => {
    setVocabList(prev => prev.filter(v => v.word.toLowerCase() !== word.toLowerCase()));
  }, []);

  // Shadowing record trigger
  const handleRecordCue = useCallback((cue) => {
    setCurrentRecordCue(cue);
    setIsRecorderOpen(true);
  }, []);

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

      if (e.key === 'Escape') {
        if (selectedWordData) {
          setSelectedWordData(null);
          return;
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isStorageOpen) {
          setIsStorageOpen(false);
          return;
        }
        if (isAnalyticsOpen) {
          setIsAnalyticsOpen(false);
          return;
        }
        if (isVocabOpen) {
          setIsVocabOpen(false);
          return;
        }
        if (isBookShelfDrawerOpen) {
          setIsBookShelfDrawerOpen(false);
          return;
        }
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
  }, [isPlaying, activeCueIndex, cues, isLoopSentence, volume, studyMode, selectedWordData, isShortcutsOpen, isStorageOpen, isAnalyticsOpen, isVocabOpen, isBookShelfDrawerOpen]);

  const activeCue = cues[activeCueIndex];
  const isWordSaved = selectedWordData 
    ? vocabList.some(v => v.word.toLowerCase() === selectedWordData.word.toLowerCase())
    : false;

  return (
    <div className={`h-screen overflow-hidden flex flex-col md:flex-row transition-colors duration-300 ${
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
          setAnalyticsSummary(getAnalyticsSummary());
          setIsAnalyticsOpen(true);
        }}
        onOpenStorage={() => {
          refreshOfflineCount();
          setIsStorageOpen(true);
        }}
        canInstallPwa={canInstallPwa}
        onInstallPwa={handleInstallPwa}
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
          setAnalyticsSummary(getAnalyticsSummary());
          setIsAnalyticsOpen(true);
        }}
        onOpenStorage={() => {
          refreshOfflineCount();
          setIsStorageOpen(true);
        }}
      />

      {/* ── 3. Main Workspace Area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Mobile Minimal Top Bar (< 768px) */}
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
            setAnalyticsSummary(getAnalyticsSummary());
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

        {/* ── Content Viewport: Bookshelf vs Player Studio ── */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
          {currentView === 'bookshelf' ? (
            <BookshelfView
              books={books}
              selectedBook={selectedBook}
              selectedChapter={selectedChapter}
              onSelectBook={(bookId) => {
                setSelectedBook(bookId);
                const b = books.find(x => x.id === bookId);
                if (b && b.chapters && b.chapters.length > 0) {
                  setSelectedChapter(b.chapters[0].id);
                }
              }}
              onSelectChapter={(chapterId, shouldPlay = true) => {
                setSelectedChapter(chapterId);
                setCurrentView('player');
                if (shouldPlay) {
                  setTimeout(() => {
                    if (audioRef.current) audioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }, 350);
                }
              }}
              onEnterPlayer={() => {
                setCurrentView('player');
                if (!isPlaying && audioRef.current) {
                  audioRef.current.play().catch(() => {});
                  setIsPlaying(true);
                }
              }}
              isPlaying={isPlaying}
              onTogglePlay={togglePlayPause}
              currentTime={currentTime}
              duration={duration}
              activeCue={activeCue}
              streakDays={analyticsSummary?.streakDays || 0}
              vocabCount={vocabList.length}
              cachedChaptersCount={cachedChaptersCount}
              todayListeningSeconds={analyticsSummary?.todayListeningSeconds || 0}
              timeTurnersCount={analyticsSummary?.timeTurnersCount ?? 1}
              dueWordsCount={dueWordsCount}
              isParchment={isParchment}
              onOpenVocab={() => setIsVocabOpen(true)}
              onOpenSrs={() => setIsSrsOpen(true)}
              onOpenAnalytics={() => {
                setAnalyticsSummary(getAnalyticsSummary());
                setIsAnalyticsOpen(true);
              }}
              onOpenStorage={() => {
                refreshOfflineCount();
                setIsStorageOpen(true);
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Desktop/Tablet Clean Contextual Reading Bar (No duplicate sidebars or headers) */}
              <div className="hidden md:block">
                <ReaderTopBar
                  currentBook={currentBookObj}
                  currentChapter={currentChapterObj}
                  onOpenShelf={() => setIsShelfOpen(true)}
                  studyMode={studyMode}
                  setStudyMode={setStudyMode}
                  showTranslation={showTranslation}
                  setShowTranslation={setShowTranslation}
                  onOpenShortcuts={() => setIsShortcutsOpen(true)}
                />
              </div>

              {/* Main Content Area: Centered, spacious, calm */}
              <main className="flex-1 overflow-y-auto min-w-0 pb-28 md:pb-24">
                {isLoadingContent ? (
                  <div className="flex-1 flex items-center justify-center py-32 text-amber-600">
                    <div className="flex flex-col items-center space-y-3">
                      <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                      <span className="font-magical text-base text-amber-950 font-bold">
                        正在调取霍格沃茨原声与精听字幕...
                      </span>
                    </div>
                  </div>
                ) : studyMode === 'dictation' ? (
                  <DictationStudio
                    cues={cues}
                    activeCueIndex={activeCueIndex}
                    onSeekToCue={handleSeekToCue}
                    onPlayPause={togglePlayPause}
                    isPlaying={isPlaying}
                    playbackRate={playbackRate}
                    onChangePlaybackRate={handleChangePlaybackRate}
                    isParchment={isParchment}
                    onNextCue={handleNextSentence}
                    onPrevCue={handlePrevSentence}
                    chapterId={selectedChapter}
                    chapterTitle={currentChapterObj ? currentChapterObj.title : ''}
                    onRecordResult={() => setAnalyticsSummary(getAnalyticsSummary())}
                  />
                ) : (
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
          )}
        </div>

        {/* Fixed Bottom Audio Player with Elder Wand & Cover Art (in player view, or on desktop/tablet) */}
        {(currentView === 'player' || !isMobile) && (
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
        )}

        {/* Mobile Floating Mini-Player (in bookshelf view on mobile when chapter exists) */}
        {isMobile && currentView !== 'player' && (
          <MobileMiniPlayer
            currentBook={currentBookObj}
            currentChapter={currentChapterObj}
            isPlaying={isPlaying}
            onTogglePlay={togglePlayPause}
            onNextSentence={handleNextSentence}
            onEnterPlayer={() => {
              setCurrentView('player');
              if (!isPlaying && audioRef.current) {
                audioRef.current.play().catch(() => {});
                setIsPlaying(true);
              }
            }}
            currentTime={currentTime}
            duration={duration}
          />
        )}

        {/* Mobile Native Bottom Navigation Bar (< 768px, shown in bookshelf view) */}
        {isMobile && currentView === 'bookshelf' && (
          <MobileBottomNav
            currentView={currentView}
            onSwitchView={setCurrentView}
            vocabCount={vocabList.length}
            onOpenVocab={() => setIsVocabOpen(true)}
            onOpenAnalytics={() => {
              setAnalyticsSummary(getAnalyticsSummary());
              setIsAnalyticsOpen(true);
            }}
          />
        )}
      </div>

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
        onOpenSrs={() => setIsSrsOpen(true)}
      />

      {/* Duolingo SRS Flashcard Spaced Repetition Modal */}
      <SrsFlashcardModal
        isOpen={isSrsOpen}
        onClose={() => setIsSrsOpen(false)}
        vocabList={vocabList}
        onUpdateVocabList={setVocabList}
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

      {/* ── Adolescent Visual Health Sentinel (20-20-20 Eye Care Standard) ── */}
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
            onClick={() => setShowEyeCarePrompt(false)}
            className="shrink-0 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-all cursor-pointer"
          >
            我知道啦
          </button>
        </div>
      )}

      {/* ── Offline Network Status Notification (W3C Network API) ── */}
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
