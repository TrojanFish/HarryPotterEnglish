/**
 * syncManager.js
 * Hogwarts Audio Multi-Device Sync and Lossless Merge Engine
 *
 * Responsibilities:
 * 1. 6-character unambiguous passcode generation and validation
 * 2. User-Agent device platform sensing (mobile, tablet, desktop)
 * 3. Lossless multi-device data merging (LWW + Union algorithm)
 */

export const PASSCODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

/**
 * Generate a 6-character unambiguous Hogwarts sync passcode (e.g., 'HP-8A3B').
 * Prefixed with 'HP-', followed by 4 uppercase alphanumeric characters
 * strictly excluding ambiguous glyphs (0, O, 1, I, L).
 * Total alphanumeric length: 6 characters.
 *
 * @returns {string} Formatted passcode, e.g. 'HP-7892'
 */
export function generatePasscode() {
  const chars = []
  const alphabetLength = PASSCODE_ALPHABET.length

  // Use web crypto API if available, fallback to Math.random
  const cryptoObj = typeof globalThis !== 'undefined' && globalThis.crypto ? globalThis.crypto : null

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const randomBytes = new Uint8Array(4)
    cryptoObj.getRandomValues(randomBytes)
    for (let i = 0; i < 4; i++) {
      chars.push(PASSCODE_ALPHABET[randomBytes[i] % alphabetLength])
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * alphabetLength)
      chars.push(PASSCODE_ALPHABET[idx])
    }
  }

  return `HP-${chars.join('')}`
}

/**
 * Validate a sync passcode.
 * Normalizes by trimming whitespace, stripping hyphens, and uppercasing.
 * Checks for exact 6 alphanumeric characters belonging to the unambiguous alphabet.
 *
 * @param {any} code
 * @returns {boolean}
 */
export function isValidPasscode(code) {
  if (typeof code !== 'string') return false
  const normalized = code.trim().replace(/[-\s]/g, '').toUpperCase()
  if (normalized.length !== 6) return false

  // All 6 characters must be in the unambiguous alphabet
  // Note: 'H' and 'P' are part of PASSCODE_ALPHABET
  const validRegex = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/
  return validRegex.test(normalized)
}

/**
 * Detect client device topology from User-Agent string.
 *
 * @param {string} [customUserAgent='']
 * @returns {{ type: 'mobile' | 'tablet' | 'desktop', label: string, name: string, os: string }}
 */
export function detectDevicePlatform(customUserAgent = '') {
  let ua = customUserAgent
  if (!ua && typeof navigator !== 'undefined' && navigator.userAgent) {
    ua = navigator.userAgent
  }
  if (!ua || typeof ua !== 'string') {
    return {
      type: 'desktop',
      label: '桌面端',
      name: '桌面端',
      os: 'Unknown'
    }
  }

  const uaLower = ua.toLowerCase()

  // Detect Operating System
  let os = 'Unknown'
  if (/ipad/.test(uaLower)) {
    os = 'iPadOS'
  } else if (/iphone|ipod/.test(uaLower)) {
    os = 'iOS'
  } else if (/macintosh|mac os x/.test(uaLower)) {
    os = 'macOS'
  } else if (/windows nt|windows/.test(uaLower)) {
    os = 'Windows'
  } else if (/android/.test(uaLower)) {
    os = 'Android'
  } else if (/cros/.test(uaLower)) {
    os = 'ChromeOS'
  } else if (/linux/.test(uaLower)) {
    os = 'Linux'
  }

  // Detect Device Category (Tablet -> Mobile -> Desktop)
  const isTablet =
    /ipad/.test(uaLower) ||
    (/android/.test(uaLower) && !/mobile/.test(uaLower)) ||
    /tablet|silk|playbook/.test(uaLower)

  if (isTablet) {
    return {
      type: 'tablet',
      label: '平板端',
      name: '平板端',
      os: os === 'Unknown' ? 'Tablet OS' : os
    }
  }

  const isMobile =
    /iphone|ipod/.test(uaLower) ||
    (/android/.test(uaLower) && /mobile/.test(uaLower)) ||
    /mobile|webos|blackberry|iemobile|opera mini/.test(uaLower)

  if (isMobile) {
    return {
      type: 'mobile',
      label: '手机端',
      name: '手机端',
      os: os === 'Unknown' ? 'Mobile OS' : os
    }
  }

  return {
    type: 'desktop',
    label: '桌面端',
    name: '桌面端',
    os: os === 'Unknown' ? 'Desktop OS' : os
  }
}

/**
 * Lossless multi-device user data merge engine.
 * Merges local and cloud records with zero data loss:
 * - Highest streak preservation
 * - Max streak freeze count (capped at 2)
 * - Union of streak frozen dates
 * - Later lastActiveDate
 * - Union of vocabulary entries, promoting Leitner box and preserving L1-L4 mastery
 * - Gamification: userHouse preservation, max studentContribution, max housePoints
 * - Point history: deduplicated by id/timestamp, sorted descending, limited to 50
 * - Badges: union, preserving earliest unlockedAt
 *
 * @param {Object} [localData={}]
 * @param {Object} [cloudData={}]
 * @returns {Object} Merged data with dual-interface compatibility
 */
export function mergeUserData(localData = {}, cloudData = {}) {
  const local = localData && typeof localData === 'object' ? localData : {}
  const cloud = cloudData && typeof cloudData === 'object' ? cloudData : {}

  // 1. Streak & Freezes
  const streakDays = Math.max(Number(local.streakDays) || 0, Number(cloud.streakDays) || 0)
  const streakFreezes = Math.min(2, Math.max(Number(local.streakFreezes) || 0, Number(cloud.streakFreezes) || 0))

  const localFrozenDates = Array.isArray(local.streakFrozenDates) ? local.streakFrozenDates : []
  const cloudFrozenDates = Array.isArray(cloud.streakFrozenDates) ? cloud.streakFrozenDates : []
  const streakFrozenDates = Array.from(new Set([...localFrozenDates, ...cloudFrozenDates])).sort()

  const lDate = typeof local.lastActiveDate === 'string' ? local.lastActiveDate : ''
  const cDate = typeof cloud.lastActiveDate === 'string' ? cloud.lastActiveDate : ''
  let lastActiveDate = ''
  if (lDate && cDate) {
    lastActiveDate = lDate >= cDate ? lDate : cDate
  } else {
    lastActiveDate = lDate || cDate || ''
  }

  // 2. Vocab List & Mastery Depth
  const localVocabList = Array.isArray(local.vocabList) ? local.vocabList : []
  const cloudVocabList = Array.isArray(cloud.vocabList) ? cloud.vocabList : []

  const vocabMap = new Map()

  // Helper to normalize and add vocab entries
  const processVocabItem = (item) => {
    if (!item || !item.word || typeof item.word !== 'string') return
    const key = item.word.toLowerCase()

    if (!vocabMap.has(key)) {
      vocabMap.set(key, {
        ...item,
        box: Math.max(1, Number(item.box) || 1),
        acquisition: { ...(item.acquisition || {}) },
        updatedAt: Number(item.updatedAt) || 0
      })
    } else {
      const existing = vocabMap.get(key)
      const existingUpdated = Number(existing.updatedAt) || 0
      const currentUpdated = Number(item.updatedAt) || 0

      // Fresher item provides baseline fields
      const base = currentUpdated >= existingUpdated ? { ...existing, ...item } : { ...item, ...existing }

      // Union acquisition mastery flags (l1, l2, l3, l4, etc.)
      const mergedAcquisition = {
        ...(existing.acquisition || {}),
        ...(item.acquisition || {})
      }
      const acqKeys = new Set([
        ...Object.keys(existing.acquisition || {}),
        ...Object.keys(item.acquisition || {})
      ])
      for (const k of acqKeys) {
        mergedAcquisition[k] = Boolean(existing.acquisition?.[k] || item.acquisition?.[k])
      }

      vocabMap.set(key, {
        ...base,
        box: Math.max(Number(existing.box) || 1, Number(item.box) || 1),
        acquisition: mergedAcquisition,
        updatedAt: Math.max(existingUpdated, currentUpdated)
      })
    }
  }

  for (const item of localVocabList) {
    processVocabItem(item)
  }
  for (const item of cloudVocabList) {
    processVocabItem(item)
  }

  const mergedVocabList = Array.from(vocabMap.values())

  // 3. Gamification & House Points
  const userHouse = local.userHouse || cloud.userHouse || null
  const studentContribution = Math.max(
    Number(local.studentContribution) || 0,
    Number(cloud.studentContribution) || 0
  )

  const standardHouses = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff']
  const allHouses = new Set([
    ...standardHouses,
    ...Object.keys(local.housePoints || {}),
    ...Object.keys(cloud.housePoints || {})
  ])

  const housePoints = {}
  for (const h of allHouses) {
    const lPoints = Number(local.housePoints?.[h]) || 0
    const cPoints = Number(cloud.housePoints?.[h]) || 0
    housePoints[h] = Math.max(lPoints, cPoints)
  }

  // Point History: Deduplicate by id or timestamp, sort descending, limit 50
  const combinedHistory = [
    ...(Array.isArray(local.pointHistory) ? local.pointHistory : []),
    ...(Array.isArray(cloud.pointHistory) ? cloud.pointHistory : [])
  ]

  const historyMap = new Map()
  for (const item of combinedHistory) {
    if (!item) continue
    const key = item.id ? `id_${item.id}` : `ts_${item.timestamp}_${item.action || ''}`
    if (!historyMap.has(key)) {
      historyMap.set(key, item)
    } else {
      const existing = historyMap.get(key)
      if ((item.timestamp || 0) >= (existing.timestamp || 0)) {
        historyMap.set(key, { ...existing, ...item })
      }
    }
  }

  const pointHistory = Array.from(historyMap.values())
    .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0))
    .slice(0, 50)

  // 4. Unlocked Badges (Union, keep earliest unlockedAt)
  const localBadges = local.unlockedBadges && typeof local.unlockedBadges === 'object' ? local.unlockedBadges : {}
  const cloudBadges = cloud.unlockedBadges && typeof cloud.unlockedBadges === 'object' ? cloud.unlockedBadges : {}
  const allBadgeKeys = new Set([...Object.keys(localBadges), ...Object.keys(cloudBadges)])

  const unlockedBadges = {}
  for (const key of allBadgeKeys) {
    const lBadge = localBadges[key]
    const cBadge = cloudBadges[key]
    if (lBadge && cBadge) {
      const lTime = typeof lBadge.unlockedAt === 'number' ? lBadge.unlockedAt : (new Date(lBadge.unlockedAt || 0).getTime() || Infinity)
      const cTime = typeof cBadge.unlockedAt === 'number' ? cBadge.unlockedAt : (new Date(cBadge.unlockedAt || 0).getTime() || Infinity)
      unlockedBadges[key] = lTime <= cTime ? { ...cBadge, ...lBadge } : { ...lBadge, ...cBadge }
    } else {
      unlockedBadges[key] = { ...(lBadge || cBadge) }
    }
  }

  // Construct mergedData payload
  const mergedData = {
    vocabList: mergedVocabList,
    streakDays,
    streakFreezes,
    streakFrozenDates,
    lastActiveDate,
    userHouse,
    studentContribution,
    housePoints,
    pointHistory,
    unlockedBadges
  }

  // Calculate statistics
  const localVocabCount = localVocabList.length
  const newVocabAdded = Math.max(0, mergedVocabList.length - localVocabCount)
  const badgesCount = Object.keys(unlockedBadges).length

  const stats = {
    vocabCount: mergedVocabList.length,
    newVocabAdded,
    badgesCount
  }

  // Detect whether merged state contains changes relative to localData
  const hasChanges = detectHasChanges(local, mergedData)

  return {
    ...mergedData,
    mergedData,
    hasChanges,
    stats
  }
}

/**
 * Determine if mergedData has modified or expanded the local dataset.
 *
 * @private
 * @param {Object} local
 * @param {Object} merged
 * @returns {boolean}
 */
function detectHasChanges(local, merged) {
  if (!local || Object.keys(local).length === 0) {
    return (
      merged.vocabList.length > 0 ||
      merged.streakDays > 0 ||
      merged.streakFreezes > 0 ||
      merged.streakFrozenDates.length > 0 ||
      Boolean(merged.lastActiveDate) ||
      Boolean(merged.userHouse) ||
      merged.studentContribution > 0 ||
      Object.keys(merged.unlockedBadges).length > 0 ||
      merged.pointHistory.length > 0
    )
  }

  if (merged.streakDays !== (Number(local.streakDays) || 0)) return true
  if (merged.streakFreezes !== (Number(local.streakFreezes) || 0)) return true
  if (merged.studentContribution !== (Number(local.studentContribution) || 0)) return true
  if (merged.userHouse !== (local.userHouse || null)) return true
  if (merged.lastActiveDate !== (local.lastActiveDate || '')) return true

  const localFrozen = Array.isArray(local.streakFrozenDates) ? local.streakFrozenDates : []
  if (merged.streakFrozenDates.length !== localFrozen.length) return true

  const localVocab = Array.isArray(local.vocabList) ? local.vocabList : []
  if (merged.vocabList.length !== localVocab.length) return true

  const localBadges = local.unlockedBadges && typeof local.unlockedBadges === 'object' ? local.unlockedBadges : {}
  if (Object.keys(merged.unlockedBadges).length !== Object.keys(localBadges).length) return true

  const localHistory = Array.isArray(local.pointHistory) ? local.pointHistory : []
  if (merged.pointHistory.length !== localHistory.length) return true

  // Check house points differences
  const localHouses = local.housePoints || {}
  for (const h of Object.keys(merged.housePoints)) {
    if (merged.housePoints[h] !== (Number(localHouses[h]) || 0)) return true
  }

  // Check vocab differences
  const localVocabMap = new Map()
  for (const v of localVocab) {
    if (v?.word) localVocabMap.set(v.word.toLowerCase(), v)
  }
  for (const v of merged.vocabList) {
    const lv = localVocabMap.get(v.word.toLowerCase())
    if (!lv) return true
    if (v.box !== (Number(lv.box) || 1)) return true
    if (v.updatedAt !== (Number(lv.updatedAt) || 0)) return true

    const vAcq = v.acquisition || {}
    const lvAcq = lv.acquisition || {}
    for (const key of Object.keys(vAcq)) {
      if (Boolean(vAcq[key]) !== Boolean(lvAcq[key])) return true
    }
  }

  // Check badges differences
  for (const bKey of Object.keys(merged.unlockedBadges)) {
    const lb = localBadges[bKey]
    if (!lb) return true
    if (merged.unlockedBadges[bKey].unlockedAt !== lb.unlockedAt) return true
  }

  return false
}
