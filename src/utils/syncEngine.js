/**
 * Hogwarts Local-First Sync Engine
 * 100% Offline-First client-side synchronization:
 * - Immediate local writes (0ms latency, zero blocking)
 * - Last-Write-Wins (LWW) conflict resolution using millisecond timestamps
 * - Reactive network awakening (window.addEventListener('online'))
 * - Cross-device pairing via 6-digit sync passcodes (e.g., 'HP-8F29')
 */

const SYNC_META_KEY = 'hp_sync_meta';
const DIRTY_VOCAB_KEY = 'hp_dirty_vocab_keys';
const DIRTY_ANALYTICS_KEY = 'hp_dirty_analytics_dates';
const VOCAB_STORAGE_KEY = 'hp_vocab_list';
const ANALYTICS_STORAGE_KEY = 'hp_study_analytics';

class SyncEngine {
  constructor() {
    this.isSyncing = false;
    this.syncTimer = null;
    this.listeners = new Set();
    this.status = 'idle'; // 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
    this.lastSyncError = null;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setStatus('idle');
        this.scheduleSync(800);
      });
      window.addEventListener('offline', () => {
        this.setStatus('offline');
      });
    }
  }

  /**
   * Get or initialize client device sync metadata
   */
  getMeta() {
    try {
      const raw = localStorage.getItem(SYNC_META_KEY);
      if (raw) {
        const meta = JSON.parse(raw);
        if (meta.userId && meta.deviceId) return meta;
      }
    } catch {}

    const newMeta = {
      userId: 'usr_' + Math.random().toString(36).substring(2, 10),
      deviceId: 'dev_' + Math.random().toString(36).substring(2, 10),
      syncCode: 'HP-INIT',
      lastSyncedAt: 0
    };
    try {
      localStorage.setItem(SYNC_META_KEY, JSON.stringify(newMeta));
    } catch {}
    return newMeta;
  }

  /**
   * Update sync metadata in storage
   */
  updateMeta(updates) {
    const meta = { ...this.getMeta(), ...updates };
    try {
      localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
    } catch {}
    return meta;
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    callback({ status: this.status, meta: this.getMeta(), error: this.lastSyncError });
    return () => this.listeners.delete(callback);
  }

  setStatus(status, error = null) {
    this.status = status;
    this.lastSyncError = error;
    const meta = this.getMeta();
    this.listeners.forEach(cb => {
      try { cb({ status, meta, error }); } catch {}
    });
  }

  /**
   * Mark a word as dirty for background sync
   */
  markVocabDirty(word) {
    if (!word) return;
    try {
      const set = new Set(JSON.parse(localStorage.getItem(DIRTY_VOCAB_KEY) || '[]'));
      set.add(word.trim().toLowerCase());
      localStorage.setItem(DIRTY_VOCAB_KEY, JSON.stringify([...set]));
    } catch {}
    this.scheduleSync(2000);
  }

  /**
   * Mark a learning date as dirty for background sync
   */
  markAnalyticsDirty(dateStr) {
    if (!dateStr) return;
    try {
      const set = new Set(JSON.parse(localStorage.getItem(DIRTY_ANALYTICS_KEY) || '[]'));
      set.add(dateStr);
      localStorage.setItem(DIRTY_ANALYTICS_KEY, JSON.stringify([...set]));
    } catch {}
    this.scheduleSync(2000);
  }

  /**
   * Debounced schedule sync
   */
  scheduleSync(delayMs = 2000) {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.triggerSync().catch(() => {});
    }, delayMs);
  }

  /**
   * Perform bidirectional incremental sync
   */
  async triggerSync() {
    if (this.isSyncing) return { status: 'busy' };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return { status: 'offline' };
    }

    this.isSyncing = true;
    this.setStatus('syncing');

    try {
      const meta = this.getMeta();

      // Read local vocab
      let localVocab = [];
      try {
        localVocab = JSON.parse(localStorage.getItem(VOCAB_STORAGE_KEY) || '[]');
      } catch {}

      // Read local analytics
      let localAnalytics = null;
      try {
        localAnalytics = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || 'null');
      } catch {}

      // Get dirty keys
      let dirtyVocabKeys = new Set();
      try {
        dirtyVocabKeys = new Set(JSON.parse(localStorage.getItem(DIRTY_VOCAB_KEY) || '[]'));
      } catch {}

      // If initial sync (lastSyncedAt === 0), push all local items
      const vocabChanges = meta.lastSyncedAt === 0
        ? localVocab
        : localVocab.filter(v => dirtyVocabKeys.has((v.word || '').toLowerCase()));

      const analyticsChanges = [];
      if (localAnalytics) {
        analyticsChanges.push({
          dateStr: localAnalytics.date || new Date().toISOString().split('T')[0],
          listeningSeconds: localAnalytics.todayListeningSeconds || 0,
          completedGoal: (localAnalytics.todayListeningSeconds || 0) >= 300 ? 1 : 0,
          streakDays: localAnalytics.streakDays || 0,
          timeTurners: localAnalytics.timeTurners !== undefined ? localAnalytics.timeTurners : 1,
          updatedAt: localAnalytics.updatedAt || Date.now()
        });
      }

      const payload = {
        userId: meta.userId,
        deviceId: meta.deviceId,
        lastSyncedAt: meta.lastSyncedAt || 0,
        changes: {
          vocab: vocabChanges,
          analytics: analyticsChanges
        }
      };

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Sync HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.status !== 'ok') {
        throw new Error(data.message || 'Sync failed');
      }

      // 1. Merge server vocab into local with Last-Write-Wins (LWW)
      if (Array.isArray(data.serverChanges?.vocab) && data.serverChanges.vocab.length > 0) {
        const mergedVocab = this.mergeVocabLww(localVocab, data.serverChanges.vocab);
        try {
          localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(mergedVocab));
          window.dispatchEvent(new CustomEvent('hp_vocab_synced', { detail: mergedVocab }));
        } catch {}
      }

      // 2. Merge server analytics into local
      if (Array.isArray(data.serverChanges?.analytics) && data.serverChanges.analytics.length > 0) {
        const latestServer = data.serverChanges.analytics[data.serverChanges.analytics.length - 1];
        if (latestServer && localAnalytics) {
          if ((latestServer.updatedAt || 0) > (localAnalytics.updatedAt || 0)) {
            const mergedAnalytics = {
              ...localAnalytics,
              todayListeningSeconds: Math.max(localAnalytics.todayListeningSeconds || 0, latestServer.listeningSeconds || 0),
              streakDays: Math.max(localAnalytics.streakDays || 0, latestServer.streakDays || 0),
              timeTurners: latestServer.timeTurners !== undefined ? latestServer.timeTurners : localAnalytics.timeTurners,
              updatedAt: latestServer.updatedAt
            };
            try {
              localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(mergedAnalytics));
              window.dispatchEvent(new CustomEvent('hp_analytics_synced', { detail: mergedAnalytics }));
            } catch {}
          }
        }
      }

      // 3. Clear dirty keys that have been synced
      try {
        localStorage.removeItem(DIRTY_VOCAB_KEY);
        localStorage.removeItem(DIRTY_ANALYTICS_KEY);
      } catch {}

      // 4. Update sync timestamp and syncCode
      const updatedMeta = this.updateMeta({
        lastSyncedAt: data.serverTime || Date.now(),
        syncCode: data.syncCode || meta.syncCode
      });

      this.setStatus('synced');
      return { status: 'ok', meta: updatedMeta, syncedCount: data.syncedCount };
    } catch (err) {
      console.warn('[SyncEngine] Sync error:', err.message);
      this.setStatus('error', err.message);
      return { status: 'error', error: err.message };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Merge server items into local items using Last-Write-Wins (LWW)
   */
  mergeVocabLww(localList, serverList) {
    const map = new Map(localList.map(item => [(item.word || '').toLowerCase(), item]));

    for (const serverItem of serverList) {
      if (!serverItem || !serverItem.word) continue;
      const key = serverItem.word.toLowerCase();
      const localItem = map.get(key);

      const serverUpdated = serverItem.updatedAt || 0;
      const localUpdated = localItem?.updatedAt || 0;

      if (!localItem || serverUpdated >= localUpdated) {
        if (serverItem.isDeleted) {
          map.delete(key);
        } else {
          map.set(key, {
            ...localItem,
            ...serverItem,
            updatedAt: serverUpdated
          });
        }
      }
    }

    return Array.from(map.values());
  }

  /**
   * Pair with another device using its 6-character sync code (e.g. 'HP-8F29')
   */
  async pairDevice(targetSyncCode) {
    if (!targetSyncCode || targetSyncCode.trim().length < 4) {
      throw new Error('请输入有效的通行码（例如 HP-8F29）');
    }

    const cleanCode = targetSyncCode.trim().toUpperCase();
    const meta = this.getMeta();

    const res = await fetch('/api/sync/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentUserId: meta.userId,
        deviceId: meta.deviceId,
        targetSyncCode: cleanCode
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || '配对请求失败');
    }

    const data = await res.json();
    if (data.status !== 'ok') {
      throw new Error(data.message || '配对失败');
    }

    // Update userId and reset lastSyncedAt to 0 so we pull full profile
    this.updateMeta({
      userId: data.targetUserId,
      syncCode: data.syncCode || cleanCode,
      lastSyncedAt: 0
    });

    // Trigger full sync immediately
    await this.triggerSync();
    return data;
  }
}

// Global Singleton Instance
export const syncEngine = new SyncEngine();
export default syncEngine;
