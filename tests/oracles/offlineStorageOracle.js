/**
 * Reference Oracle for R4 Offline Storage.
 * Strictly adheres to PROJECT.md § Offline Storage Contract.
 */

const DB_NAME = 'HogwartsOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'chapters';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const req = globalThis.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'chapterId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveChapterOffline(chapterObj, onProgress) {
  if (!chapterObj || !chapterObj.chapterId) {
    throw new Error('Invalid chapter object: chapterId required');
  }

  let audioBlob = chapterObj.audioBlob;
  let vttText = chapterObj.vttText;
  let audioSize = 0;
  let vttSize = 0;

  // If URLs are provided, fetch them
  if (!audioBlob && chapterObj.audioUrl) {
    const res = await (globalThis.fetch || fetch)(chapterObj.audioUrl);
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

  if (!vttText && chapterObj.vttUrl) {
    const res = await (globalThis.fetch || fetch)(chapterObj.vttUrl);
    vttText = await res.text();
    vttSize = Buffer.byteLength(vttText);
  } else if (vttText) {
    vttSize = typeof Buffer !== 'undefined' ? Buffer.byteLength(vttText) : (vttText.length || 0);
  }

  const totalBytes = audioSize + vttSize;

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
    req.onerror = () => reject(req.error);
  });
}

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
    req.onerror = () => reject(req.error);
  });
}

export async function isChapterCached(chapterId) {
  if (!chapterId) return false;
  const record = await getCachedChapter(chapterId);
  return record !== null;
}

export async function deleteCachedChapter(chapterId) {
  if (!chapterId) return;
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(chapterId);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

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
    req.onerror = () => reject(req.error);
  });

  const usedBytes = chapters.reduce((sum, c) => sum + (c.totalBytes || 0), 0);

  let quotaBytes = 1024 * 1024 * 1024 * 2; // Default 2GB
  if (globalThis.navigator && globalThis.navigator.storage && typeof globalThis.navigator.storage.estimate === 'function') {
    try {
      const est = await globalThis.navigator.storage.estimate();
      if (est.quota) quotaBytes = est.quota;
    } catch (e) {
      // Fallback
    }
  }

  return {
    usedBytes,
    quotaBytes,
    chapters
  };
}
