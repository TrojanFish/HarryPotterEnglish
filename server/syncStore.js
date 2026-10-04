/**
 * Hogwarts Local-First Sync Store (Server-side Node.js / Express implementation)
 * Implements the exact same LWW (Last-Write-Wins) sync protocol as Cloudflare D1
 * Provides zero-configuration local development and test environment support.
 */

// In-memory data tables (keyed for instant lookup)
const userVocabStore = new Map();     // key: `${userId}:${word.toLowerCase()}` -> vocabRecord
const userAnalyticsStore = new Map(); // key: `${userId}:${dateStr}` -> analyticsRecord
const userDevicesStore = new Map();   // key: deviceId -> { userId, syncCode, platform, lastSyncedAt }
const syncCodeIndex = new Map();      // key: syncCode -> userId

// Generate human-friendly 6-character sync code (e.g., 'HP-8F29')
export function generateSyncCode(userId) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  let code = 'HP-';
  for (let i = 0; i < 4; i++) {
    code += chars[(hash + i * 7) % chars.length];
  }
  return code;
}

/**
 * Handle Bidirectional Incremental Sync
 * @param {Object} payload 
 * @param {string} payload.userId 
 * @param {string} payload.deviceId 
 * @param {number} payload.lastSyncedAt 
 * @param {Object} payload.changes 
 * @param {Array} payload.changes.vocab 
 * @param {Array} payload.changes.analytics 
 */
export function processSync({ userId, deviceId, lastSyncedAt = 0, changes = {} }) {
  const serverTime = Date.now();
  const safeUserId = userId || 'usr_guest';
  const safeDeviceId = deviceId || 'dev_unknown';

  // 1. Register or retrieve device pairing code
  let deviceRecord = userDevicesStore.get(safeDeviceId);
  if (!deviceRecord) {
    const syncCode = generateSyncCode(safeUserId);
    deviceRecord = {
      deviceId: safeDeviceId,
      userId: safeUserId,
      syncCode,
      lastSyncedAt: serverTime,
      createdAt: serverTime
    };
    userDevicesStore.set(safeDeviceId, deviceRecord);
    syncCodeIndex.set(syncCode, safeUserId);
  } else if (deviceRecord.userId !== safeUserId) {
    // Device migrated or paired to new userId
    deviceRecord.userId = safeUserId;
    deviceRecord.syncCode = generateSyncCode(safeUserId);
    syncCodeIndex.set(deviceRecord.syncCode, safeUserId);
  }

  const effectiveUserId = deviceRecord.userId;

  // 2. Process incoming client vocab changes with Last-Write-Wins (LWW)
  let vocabPushedCount = 0;
  if (Array.isArray(changes.vocab)) {
    for (const item of changes.vocab) {
      if (!item || !item.word) continue;
      const cleanWord = item.word.trim().toLowerCase();
      const key = `${effectiveUserId}:${cleanWord}`;
      const existing = userVocabStore.get(key);

      const incomingUpdatedAt = item.updatedAt || serverTime;
      if (!existing || incomingUpdatedAt > (existing.updatedAt || 0)) {
        userVocabStore.set(key, {
          userId: effectiveUserId,
          word: cleanWord,
          phonetic: item.phonetic || '',
          pos: item.pos || '',
          translation: item.translation || '',
          definition: item.definition || '',
          contextSentence: item.contextSentence || '',
          contextAudioKey: item.contextAudioKey || '',
          srsBox: item.srsBox !== undefined ? item.srsBox : 1,
          nextReviewAt: item.nextReviewAt || 0,
          reviewCount: item.reviewCount || 0,
          correctCount: item.correctCount || 0,
          isDeleted: item.isDeleted ? 1 : 0,
          updatedAt: incomingUpdatedAt,
          createdAt: item.createdAt || existing?.createdAt || serverTime
        });
        vocabPushedCount++;
      }
    }
  }

  // 3. Process incoming client analytics changes with LWW
  let analyticsPushedCount = 0;
  if (Array.isArray(changes.analytics)) {
    for (const item of changes.analytics) {
      if (!item || !item.dateStr) continue;
      const key = `${effectiveUserId}:${item.dateStr}`;
      const existing = userAnalyticsStore.get(key);

      const incomingUpdatedAt = item.updatedAt || serverTime;
      if (!existing || incomingUpdatedAt > (existing.updatedAt || 0)) {
        userAnalyticsStore.set(key, {
          userId: effectiveUserId,
          dateStr: item.dateStr,
          listeningSeconds: item.listeningSeconds || 0,
          completedGoal: item.completedGoal ? 1 : 0,
          streakDays: item.streakDays || 0,
          timeTurners: item.timeTurners !== undefined ? item.timeTurners : 1,
          daySummaryJson: item.daySummaryJson || '',
          updatedAt: incomingUpdatedAt
        });
        analyticsPushedCount++;
      }
    }
  }

  // 4. Collect newer server changes since client's lastSyncedAt
  const serverVocabChanges = [];
  for (const [key, record] of userVocabStore.entries()) {
    if (record.userId === effectiveUserId && record.updatedAt > lastSyncedAt) {
      serverVocabChanges.push(record);
    }
  }

  const serverAnalyticsChanges = [];
  for (const [key, record] of userAnalyticsStore.entries()) {
    if (record.userId === effectiveUserId && record.updatedAt > lastSyncedAt) {
      serverAnalyticsChanges.push(record);
    }
  }

  // Update device last synced timestamp
  deviceRecord.lastSyncedAt = serverTime;

  return {
    status: 'ok',
    serverTime,
    userId: effectiveUserId,
    syncCode: deviceRecord.syncCode,
    syncedCount: {
      vocabPushed: vocabPushedCount,
      vocabPulled: serverVocabChanges.length,
      analyticsPushed: analyticsPushedCount,
      analyticsPulled: serverAnalyticsChanges.length
    },
    serverChanges: {
      vocab: serverVocabChanges,
      analytics: serverAnalyticsChanges
    }
  };
}

/**
 * Handle Multi-Device Pairing by Passcode (e.g. 'HP-8F29')
 * Merges local device data with target device cloud profile.
 */
export function processPairing({ currentUserId, deviceId, targetSyncCode }) {
  if (!targetSyncCode) {
    return { status: 'error', message: '请提供有效的配对代码' };
  }

  const cleanCode = targetSyncCode.trim().toUpperCase();
  const targetUserId = syncCodeIndex.get(cleanCode);

  if (!targetUserId) {
    return { status: 'error', message: '未找到该通行码对应的学习档案，请核对代码' };
  }

  // If already the same user, no merge needed
  if (currentUserId === targetUserId) {
    return { status: 'ok', targetUserId, message: '设备已处于同一学习档案中' };
  }

  // Merge records from currentUserId into targetUserId with LWW
  let mergedVocab = 0;
  for (const [key, record] of userVocabStore.entries()) {
    if (record.userId === currentUserId) {
      const targetKey = `${targetUserId}:${record.word}`;
      const existing = userVocabStore.get(targetKey);
      if (!existing || record.updatedAt > existing.updatedAt) {
        userVocabStore.set(targetKey, { ...record, userId: targetUserId });
        mergedVocab++;
      }
    }
  }

  // Link device to new targetUserId
  if (deviceId && userDevicesStore.has(deviceId)) {
    const dev = userDevicesStore.get(deviceId);
    dev.userId = targetUserId;
    dev.syncCode = cleanCode;
  }

  return {
    status: 'ok',
    targetUserId,
    syncCode: cleanCode,
    mergedCount: mergedVocab,
    message: `配对成功！已连接至档案 [${cleanCode}] 并合并数据`
  };
}
