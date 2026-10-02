/**
 * Complete Offline Chapter Caching
 * Hogwarts Audio English Learning Platform
 *
 * Implements client-side offline storage via IndexedDB (HogwartsOfflineDB)
 * storing full chapter audio MP3 as binary Blobs and WebVTT subtitles,
 * real-time download progress tracking via ReadableStream, storage space management,
 * and seamless offline playback.
 */

const DB_NAME = 'HogwartsOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'chapters';

/**
 * Open or initialize the IndexedDB instance for offline storage.
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined' && typeof globalThis.indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }
    const idb = globalThis.indexedDB || indexedDB;
    const req = idb.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'chapterId' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Save an entire chapter (audio MP3 Blob and WebVTT subtitle text) for offline use.
 * Supports streaming download progress (0–100%) via ReadableStream.
 *
 * @param {object} chapterObj - Chapter metadata and assets (audioBlob, vttText, or audioUrl, vttUrl)
 * @param {Function} [onProgress] - Callback for download progress: ({ progress, receivedBytes, totalBytes }) => void
 * @returns {Promise<void>}
 */
export async function saveChapterOffline(chapterObj, onProgress) {
  if (!chapterObj || !chapterObj.chapterId) {
    throw new Error('Invalid chapter object: chapterId required');
  }

  let audioBlob = chapterObj.audioBlob;
  let vttText = chapterObj.vttText;
  let audioSize = 0;
  let vttSize = 0;

  // 1. Fetch audio if URL provided and blob not already present
  if (!audioBlob && chapterObj.audioUrl) {
    const fetchFn = globalThis.fetch || fetch;
    const res = await fetchFn(chapterObj.audioUrl);
    if (!res.ok && res.status !== 0) {
      throw new Error(`Failed to fetch audio stream: HTTP ${res.status}`);
    }
    const contentLength = Number(res.headers.get('Content-Length')) || 0;
    let received = 0;

    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
        if (onProgress && contentLength > 0) {
          const progress = Math.min(95, Math.round((received / contentLength) * 90));
          onProgress({ progress, receivedBytes: received, totalBytes: contentLength });
        }
      }
      audioBlob = new Blob(chunks, { type: 'audio/mpeg' });
      audioSize = received;
    } else {
      audioBlob = await res.blob();
      audioSize = audioBlob.size;
    }
  } else if (audioBlob) {
    audioSize = audioBlob.size || 0;
  }

  // 2. Fetch VTT subtitle text if URL provided and text not already present
  if (!vttText && chapterObj.vttUrl) {
    const fetchFn = globalThis.fetch || fetch;
    const res = await fetchFn(chapterObj.vttUrl);
    if (!res.ok && res.status !== 0) {
      throw new Error(`Failed to fetch subtitle file: HTTP ${res.status}`);
    }
    vttText = await res.text();
    vttSize = typeof Buffer !== 'undefined' ? Buffer.byteLength(vttText) : (vttText.length || 0);
  } else if (vttText) {
    vttSize = typeof Buffer !== 'undefined' ? Buffer.byteLength(vttText) : (vttText.length || 0);
  }

  const totalBytes = audioSize + vttSize;

  // Signal completion of download
  if (onProgress) {
    onProgress({ progress: 100, receivedBytes: totalBytes, totalBytes });
  }

  const record = {
    chapterId: chapterObj.chapterId,
    title: chapterObj.title || `Chapter ${chapterObj.chapterId}`,
    audioBlob: audioBlob || new Blob([], { type: 'audio/mpeg' }),
    vttText: vttText || '',
    totalBytes,
    downloadedAt: Date.now()
  };

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error('Failed to save chapter to IndexedDB'));
  });
}

/**
 * Retrieve cached chapter audio Blob and subtitle text from IndexedDB.
 *
 * @param {string} chapterId - Chapter identifier
 * @returns {Promise<{ audioBlob: Blob, vttText: string } | null>}
 */
export async function getCachedChapter(chapterId) {
  if (!chapterId) return null;
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(chapterId);

    req.onsuccess = () => {
      const res = req.result;
      if (!res) {
        resolve(null);
      } else {
        resolve({
          audioBlob: res.audioBlob,
          vttText: res.vttText
        });
      }
    };
    req.onerror = () => reject(req.error || new Error('Failed to read from IndexedDB'));
  });
}

/**
 * Check whether a chapter has been saved locally for offline playback.
 *
 * @param {string} chapterId - Chapter identifier
 * @returns {Promise<boolean>}
 */
export async function isChapterCached(chapterId) {
  if (!chapterId) return false;
  const record = await getCachedChapter(chapterId);
  return record !== null;
}

/**
 * Delete a cached chapter from offline storage.
 *
 * @param {string} chapterId - Chapter identifier
 * @returns {Promise<void>}
 */
export async function deleteCachedChapter(chapterId) {
  if (!chapterId) return;
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(chapterId);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error('Failed to delete chapter from IndexedDB'));
  });
}

/**
 * Inspect offline storage quota, used space, and cached chapters metadata.
 *
 * @returns {Promise<{
 *   usedBytes: number,
 *   quotaBytes: number,
 *   chapters: Array<{ chapterId: string, title: string, totalBytes: number, downloadedAt: number }>
 * }>}
 */
export async function getOfflineStorageInfo() {
  const db = await openDatabase();

  const chapters = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const all = req.result || [];
      resolve(all.map(c => ({
        chapterId: c.chapterId,
        title: c.title,
        totalBytes: c.totalBytes || (c.audioBlob ? c.audioBlob.size : 0),
        downloadedAt: c.downloadedAt
      })));
    };
    req.onerror = () => reject(req.error || new Error('Failed to retrieve all chapters'));
  });

  const usedBytes = chapters.reduce((sum, c) => sum + (c.totalBytes || 0), 0);

  let quotaBytes = 1024 * 1024 * 1024 * 2; // Default fallback: 2GB
  if (globalThis.navigator && globalThis.navigator.storage && typeof globalThis.navigator.storage.estimate === 'function') {
    try {
      const est = await globalThis.navigator.storage.estimate();
      if (est.quota) quotaBytes = est.quota;
    } catch (e) {
      // Keep default fallback
    }
  }

  return {
    usedBytes,
    quotaBytes,
    chapters
  };
}
