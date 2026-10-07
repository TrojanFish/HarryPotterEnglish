import { useState, useEffect, useRef, useCallback } from 'react';
import { HP_BOOKS, SAMPLE_CHAPTER_1_VTT } from '../data/chapters';
import { parseVTT } from '../utils/vttParser';
import { getCachedChapter, getOfflineStorageInfo } from '../utils/offlineStorage';

const API_BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Resolves the optimal streaming URL for a given chapter audio key.
 * Hierarchy:
 * 1. Cloudflare R2 Public CDN Domain (if configured via VITE_R2_PUBLIC_DOMAIN or window.__HP_CDN_DOMAIN__)
 * 2. API Streaming endpoint (/api/stream/audio/:key)
 *
 * @param {string} audioKey - e.g. "podcasts/hp-book-1/episodes/ep01/audio.mp3"
 * @param {string} [apiBase=''] - API base URL prefix
 * @param {string} [customCdnDomain] - Optional custom CDN domain
 * @returns {string} - Direct streaming URL
 */
export function resolveAudioStreamUrl(audioKey, apiBase = '', customCdnDomain = null) {
  if (!audioKey) return '';

  const cdn = customCdnDomain || 
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_R2_PUBLIC_DOMAIN) ||
    (typeof window !== 'undefined' && window.__HP_CDN_DOMAIN__) ||
    '';

  if (cdn) {
    const cleanDomain = cdn.replace(/\/+$/, '');
    const cleanKey = audioKey.replace(/^\/+/, '');
    const prefix = cleanDomain.startsWith('http') ? cleanDomain : `https://${cleanDomain}`;
    return `${prefix}/${cleanKey}`;
  }

  const streamKey = audioKey.replace(/\.(mp3|m4a|wav|aac|ogg|flac)$/i, '');
  const cleanApiBase = apiBase ? apiBase.replace(/\/+$/, '') : '';
  return `${cleanApiBase}/api/stream/audio/${streamKey}`;
}

/**
 * useCatalog Hook
 * Manages book catalog fetching, chapter selection, audio source resolution
 * (IndexedDB offline blob vs streaming URL), subtitle parsing, and storage statistics.
 */
export function useCatalog() {
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

  const [cues, setCues] = useState([]);
  const [audioUrl, setAudioUrl] = useState(() => {
    try {
      const initBookId = (typeof localStorage !== 'undefined' && localStorage.getItem('hp_last_played_book')) || 'hp-book-1';
      const initChapterId = (typeof localStorage !== 'undefined' && localStorage.getItem('hp_last_played_chapter')) || 'hp-book-1_ep01';
      const bObj = HP_BOOKS.find(b => b.id === initBookId) || HP_BOOKS[0];
      const chObj = (bObj?.chapters || []).find(c => c.id === initChapterId) || (bObj?.chapters || [])[0];
      const audioKey = chObj?.audioKey || `podcasts/${initBookId}/episodes/${chObj?.epId || 'ep01'}/audio.mp3`;
      return resolveAudioStreamUrl(audioKey, API_BASE);
    } catch {
      return resolveAudioStreamUrl('podcasts/hp-book-1/episodes/ep01/audio.mp3', API_BASE);
    }
  });
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOfflinePlaying, setIsOfflinePlaying] = useState(false);
  const [isOfflineUncached, setIsOfflineUncached] = useState(false);
  const [cachedChaptersCount, setCachedChaptersCount] = useState(0);

  const previousBlobUrlRef = useRef(null);

  // Synchronize book and chapter selection to localStorage
  useEffect(() => {
    try {
      if (selectedBook) localStorage.setItem('hp_last_played_book', selectedBook);
      if (selectedChapter) localStorage.setItem('hp_last_played_chapter', selectedChapter);
    } catch {}
  }, [selectedBook, selectedChapter]);

  // Derived current book & chapter
  const currentBookObj = books.find(b => b.id === selectedBook) || books[0] || HP_BOOKS[0];
  const currentChapterObj = (currentBookObj?.chapters || []).find(c => c.id === selectedChapter) || (currentBookObj?.chapters || [])[0];

  // Refresh offline cached count
  const refreshOfflineCount = useCallback(async () => {
    try {
      const info = await getOfflineStorageInfo();
      setCachedChaptersCount(info.chapters ? info.chapters.length : 0);
    } catch (err) {
      console.warn('[Storage] Failed to query offline info:', err);
    }
  }, []);

  // Fetch catalog from backend R2 auto-discovery scanner
  const fetchCatalog = useCallback(async (forceRefresh = false) => {
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
          const booksWithAudio = data.books.filter(b => b.chapters && b.chapters.length > 0);
          if (booksWithAudio.length > 0) {
            setBooks(booksWithAudio);
            // If current selected book is not in the list, fallback to first
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
      console.warn('[Catalog] API offline, using fallback:', err.message);
    } finally {
      if (forceRefresh) setIsRefreshing(false);
    }
  }, [selectedBook]);

  // Initial load
  useEffect(() => {
    fetchCatalog(false);
    refreshOfflineCount();
    return () => {
      if (previousBlobUrlRef.current) {
        URL.revokeObjectURL(previousBlobUrlRef.current);
      }
    };
  }, [fetchCatalog, refreshOfflineCount]);

  // Load chapter audio & subtitles (IndexedDB cache -> Stream fallback)
  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      if (!currentChapterObj) return;
      setIsLoadingContent(true);

      // Clean up previous Blob URL
      if (previousBlobUrlRef.current) {
        URL.revokeObjectURL(previousBlobUrlRef.current);
        previousBlobUrlRef.current = null;
      }

      // Check IndexedDB cache first
      try {
        const cached = await getCachedChapter(currentChapterObj.id);
        if (cached && cached.audioBlob && !cancelled) {
          const blobUrl = URL.createObjectURL(cached.audioBlob);
          previousBlobUrlRef.current = blobUrl;
          setAudioUrl(blobUrl);
          setIsOfflinePlaying(true);
          setIsOfflineUncached(false);

          if (cached.vttText) {
            setCues(parseVTT(cached.vttText));
          } else {
            setCues(parseVTT(SAMPLE_CHAPTER_1_VTT));
          }
          setIsLoadingContent(false);
          return;
        }
      } catch (cacheErr) {
        console.warn('[Offline] Cache lookup failed:', cacheErr);
      }

      // Check if completely offline and chapter not cached
      const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (isDeviceOffline) {
        setIsOfflineUncached(true);
      } else {
        setIsOfflineUncached(false);
      }

      // Online streaming: Instant URL resolution without blocking 24MB blob fetch
      setIsOfflinePlaying(false);
      const audioKey = currentChapterObj.audioKey || `podcasts/${selectedBook}/episodes/${currentChapterObj.epId || 'ep01'}/audio.mp3`;
      const subKey = currentChapterObj.subtitleKey || `podcasts/${selectedBook}/episodes/${currentChapterObj.epId || 'ep01'}/subtitle.vtt`;

      const streamAudioUrl = resolveAudioStreamUrl(audioKey, API_BASE);
      const newVttUrl = `${API_BASE}/api/subtitles/${subKey}`;

      // Immediately bind audio stream URL so browser <audio> begins HTTP Range streaming without delay
      if (!cancelled) {
        setAudioUrl(streamAudioUrl);
      }

      // Fetch subtitles concurrently (subtitles are lightweight text < 30KB)
      try {
        const res = await fetch(newVttUrl);
        if (res.ok && !cancelled) {
          const vttText = await res.text();
          setCues(parseVTT(vttText));
        } else if (!cancelled) {
          setCues(parseVTT(SAMPLE_CHAPTER_1_VTT));
        }
      } catch (err) {
        if (!cancelled) {
          setCues(parseVTT(SAMPLE_CHAPTER_1_VTT));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingContent(false);
        }
      }
    }

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [currentChapterObj, selectedBook]);

  const selectBook = useCallback((bookId) => {
    setSelectedBook(bookId);
    const b = books.find(x => x.id === bookId);
    if (b && b.chapters && b.chapters.length > 0) {
      setSelectedChapter(b.chapters[0].id);
    }
  }, [books]);

  const selectChapter = useCallback((chapterId) => {
    setSelectedChapter(chapterId);
  }, []);

  return {
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
  };
}
