import { defineStore } from 'pinia'
import { useVocabStore } from './vocabStore.js'

export const STORAGE_KEY = 'hp_analytics_log'
export const STORAGE_KEY_STATE = 'hp_analytics_state'

/**
 * Format a Date object to YYYY-MM-DD in local time.
 * @param {Date|number|string} [d]
 * @returns {string}
 */
export function formatDate(d = new Date()) {
  try {
    const date = d instanceof Date ? d : new Date(d)
    if (isNaN(date.getTime())) {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
}

function clamp(value, min = 0, max = 100) {
  const n = typeof value === 'number' && !isNaN(value) ? value : min
  return Math.min(max, Math.max(min, Math.round(n)))
}

function loadFromStorage() {
  if (typeof localStorage === 'undefined') return null
  let stateData = null
  let logData = null

  try {
    const rawState = localStorage.getItem(STORAGE_KEY_STATE)
    if (rawState) {
      stateData = JSON.parse(rawState)
    }
  } catch (e) {
    console.warn('[AnalyticsStore] Failed to load from hp_analytics_state:', e)
  }

  try {
    const rawLog = localStorage.getItem(STORAGE_KEY)
    if (rawLog) {
      logData = JSON.parse(rawLog)
    }
  } catch (e) {
    console.warn('[AnalyticsStore] Failed to load from hp_analytics_log:', e)
  }

  return {
    ...logData,
    ...stateData
  }
}

export const useAnalyticsStore = defineStore('analytics', {
  state: () => {
    const loaded = loadFromStorage() || {}
    const listeningSec = typeof loaded.listeningSeconds === 'number' && !isNaN(loaded.listeningSeconds)
      ? loaded.listeningSeconds
      : (typeof loaded.totalListeningSeconds === 'number' && !isNaN(loaded.totalListeningSeconds)
        ? loaded.totalListeningSeconds
        : 0)

    return {
      // Telemetry & Assessment state
      listeningSeconds: listeningSec,
      listeningSessionsCount: typeof loaded.listeningSessionsCount === 'number' && !isNaN(loaded.listeningSessionsCount)
        ? loaded.listeningSessionsCount
        : 0,
      shadowingHistory: Array.isArray(loaded.shadowingHistory) ? loaded.shadowingHistory : [],
      dictationHistory: Array.isArray(loaded.dictationHistory) ? loaded.dictationHistory : [],
      examHistory: Array.isArray(loaded.examHistory) ? loaded.examHistory : [],

      // Legacy & backwards compatible state
      totalListeningSeconds: listeningSec,
      completedChapters: Array.isArray(loaded.completedChapters) ? loaded.completedChapters : [],
      dailyListening: loaded.dailyListening && typeof loaded.dailyListening === 'object' && !Array.isArray(loaded.dailyListening)
        ? loaded.dailyListening
        : {}
    }
  },

  getters: {
    cefrLevel: (state) => {
      // If exam history has records, return highest achieved level
      if (Array.isArray(state.examHistory) && state.examHistory.length > 0) {
        const order = ['A2', 'B1', 'B2', 'C1']
        let best = 'A2'
        for (const ex of state.examHistory) {
          if (order.indexOf(ex.cefrResult) > order.indexOf(best)) {
            best = ex.cefrResult
          }
        }
        return best
      }

      // Otherwise derive from cumulative metrics
      let vocabCount = 0
      let l3Count = 0
      let l4Count = 0
      try {
        const vocabStore = useVocabStore()
        if (vocabStore && Array.isArray(vocabStore.vocabList)) {
          vocabCount = vocabStore.vocabList.length
          l3Count = vocabStore.vocabList.filter(w => w.acquisition?.l3).length
          l4Count = vocabStore.vocabList.filter(w => w.acquisition?.l4).length
        }
      } catch {}

      const totalSec = state.listeningSeconds || state.totalListeningSeconds || 0
      const listeningMinutes = totalSec / 60
      const shadowingAvg = Array.isArray(state.shadowingHistory) && state.shadowingHistory.length > 0
        ? state.shadowingHistory.reduce((acc, h) => acc + (Number(h.score) || 0), 0) / state.shadowingHistory.length
        : 0

      if (vocabCount >= 300 && l4Count >= 100 && shadowingAvg >= 85 && listeningMinutes >= 180) {
        return 'C1'
      }
      if (vocabCount >= 160 && (l4Count >= 40 || shadowingAvg >= 80) && listeningMinutes >= 120) {
        return 'B2'
      }
      if (vocabCount >= 80 && (l3Count >= 30 || shadowingAvg >= 70) && listeningMinutes >= 90) {
        return 'B1'
      }

      return 'A2'
    },

    wizardTitle: function (state) {
      const titles = {
        A2: '魔法学徒',
        B1: '魔法探索者',
        B2: '魔法进阶者',
        C1: '傲罗精通'
      }

      if (Array.isArray(state.examHistory) && state.examHistory.length > 0) {
        const latest = state.examHistory[state.examHistory.length - 1]
        if (latest?.title) {
          return latest.title
        }
      }

      return titles[this.cefrLevel] || '魔法学徒'
    },

    nextLevelProgress: function (state) {
      const current = this.cefrLevel || 'A2'
      if (current === 'C1') return 100

      const totalSec = state.listeningSeconds || state.totalListeningSeconds || 0
      const mins = totalSec / 60
      let vocabCount = 0
      try {
        const vocabStore = useVocabStore()
        if (vocabStore && Array.isArray(vocabStore.vocabList)) {
          vocabCount = vocabStore.vocabList.length
        }
      } catch {}

      const shadowingAvg = Array.isArray(state.shadowingHistory) && state.shadowingHistory.length > 0
        ? state.shadowingHistory.reduce((acc, h) => acc + (Number(h.score) || 0), 0) / state.shadowingHistory.length
        : 60

      let targetMins = 90
      let targetVocab = 80
      let targetShadow = 70

      if (current === 'B1') {
        targetMins = 120
        targetVocab = 160
        targetShadow = 80
      } else if (current === 'B2') {
        targetMins = 180
        targetVocab = 300
        targetShadow = 85
      }

      const pMins = Math.min(100, (mins / targetMins) * 100)
      const pVocab = Math.min(100, (vocabCount / targetVocab) * 100)
      const pShadow = Math.min(100, (shadowingAvg / targetShadow) * 100)
      const progress = Math.round(pMins * 0.4 + pVocab * 0.3 + pShadow * 0.3)

      return clamp(progress, 0, 100)
    },

    radarDimensions: (state) => {
      // If latest exam exists and has dimensions, prefer those
      if (Array.isArray(state.examHistory) && state.examHistory.length > 0) {
        const latest = state.examHistory[state.examHistory.length - 1]
        if (latest && latest.dimensions && typeof latest.dimensions === 'object') {
          return {
            auditory: clamp(latest.dimensions.auditory ?? 60),
            vocabDepth: clamp(latest.dimensions.vocabDepth ?? 60),
            comprehension: clamp(latest.dimensions.comprehension ?? 60),
            shadowing: clamp(latest.dimensions.shadowing ?? 60),
            production: clamp(latest.dimensions.production ?? 60)
          }
        }
      }

      // 1. Auditory recognition (listening minutes + session counts)
      const totalSec = state.listeningSeconds || state.totalListeningSeconds || 0
      const mins = totalSec / 60
      const sessions = state.listeningSessionsCount || 0
      const auditoryScore = clamp(Math.round(25 + mins * 0.5 + sessions * 1.5), 0, 100)

      // 2. Vocabulary depth (L3 & L4 ratio from vocabStore)
      let vocabScore = 30
      try {
        const vocabStore = useVocabStore()
        if (vocabStore && Array.isArray(vocabStore.vocabList) && vocabStore.vocabList.length > 0) {
          const total = vocabStore.vocabList.length
          const l3 = vocabStore.vocabList.filter(w => w.acquisition?.l3).length
          const l4 = vocabStore.vocabList.filter(w => w.acquisition?.l4).length
          const depthRatio = ((l3 * 0.4 + l4 * 0.6) / total) * 100
          vocabScore = clamp(Math.round(depthRatio), 0, 100)
        }
      } catch {}

      // 3. Contextual comprehension (completed chapters + activity)
      const chaptersCount = Array.isArray(state.completedChapters) ? state.completedChapters.length : 0
      const comprehensionScore = clamp(Math.round(30 + chaptersCount * 10 + sessions * 2), 0, 100)

      // 4. Oral shadowing (rolling average score, default baseline 60)
      let shadowingScore = 60
      if (Array.isArray(state.shadowingHistory) && state.shadowingHistory.length > 0) {
        const sum = state.shadowingHistory.reduce((acc, h) => acc + (Number(h.score) || 0), 0)
        shadowingScore = clamp(Math.round(sum / state.shadowingHistory.length), 0, 100)
      }

      // 5. Written production (dictation correct ratio, default baseline 50)
      let productionScore = 50
      if (Array.isArray(state.dictationHistory) && state.dictationHistory.length > 0) {
        let correct = 0
        let total = 0
        for (const item of state.dictationHistory) {
          correct += Number(item.correctCount) || 0
          total += Number(item.totalCount) || 0
        }
        if (total > 0) {
          productionScore = clamp(Math.round((correct / total) * 100), 0, 100)
        }
      }

      return {
        auditory: auditoryScore,
        vocabDepth: vocabScore,
        comprehension: comprehensionScore,
        shadowing: shadowingScore,
        production: productionScore
      }
    },

    radarPolygonPoints: function () {
      return (cx = 200, cy = 200, r = 150) => {
        const center_x = typeof cx === 'number' && !isNaN(cx) ? cx : 200
        const center_y = typeof cy === 'number' && !isNaN(cy) ? cy : 200
        const radius = typeof r === 'number' && !isNaN(r) ? r : 150

        const dims = this.radarDimensions
        const keys = ['auditory', 'vocabDepth', 'comprehension', 'shadowing', 'production']

        // 5-vertex polar projection: theta_i = -90 deg + i * 72 deg
        const points = keys.map((key, i) => {
          const score = clamp(dims[key] ?? 50, 0, 100)
          const angleDeg = -90 + i * 72
          const angleRad = (angleDeg * Math.PI) / 180
          const scaledRadius = radius * (score / 100)

          const x = center_x + scaledRadius * Math.cos(angleRad)
          const y = center_y + scaledRadius * Math.sin(angleRad)

          const safeX = isNaN(x) ? center_x : Number(x.toFixed(1))
          const safeY = isNaN(y) ? center_y : Number(y.toFixed(1))

          return `${safeX},${safeY}`
        })

        return points.join(' ')
      }
    },

    // Backwards compatible getters
    streakDays: (state) => {
      const daily = state.dailyListening
      if (!daily || typeof daily !== 'object' || Object.keys(daily).length === 0) {
        return 0
      }

      const now = new Date()
      const todayStr = formatDate(now)
      let count = 0

      if ((Number(daily[todayStr]) || 0) > 0) {
        const checkDate = new Date(now)
        while (true) {
          const dStr = formatDate(checkDate)
          if ((Number(daily[dStr]) || 0) > 0) {
            count++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            break
          }
        }
        return count
      }

      const checkDate = new Date(now)
      checkDate.setDate(checkDate.getDate() - 1)
      const yestStr = formatDate(checkDate)
      if ((Number(daily[yestStr]) || 0) > 0) {
        while (true) {
          const dStr = formatDate(checkDate)
          if ((Number(daily[dStr]) || 0) > 0) {
            count++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            break
          }
        }
        return count
      }

      return 0
    },

    totalHours: (state) => {
      const sec = Number(state.listeningSeconds || state.totalListeningSeconds) || 0
      return (sec / 3600).toFixed(1)
    },

    completedChaptersCount: (state) => {
      return Array.isArray(state.completedChapters) ? state.completedChapters.length : 0
    },

    accuracyScore: () => 95,

    weeklyDays: (state) => {
      const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      const now = new Date()
      const dayOfWeek = (now.getDay() + 6) % 7
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
      const todayStr = formatDate(now)

      return dayNames.map((name, idx) => {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx)
        const dateStr = formatDate(d)
        const seconds = (state.dailyListening && Number(state.dailyListening[dateStr])) || 0
        const minutes = Math.round(seconds / 60)
        return {
          name,
          minutes,
          isToday: dateStr === todayStr
        }
      })
    }
  },

  actions: {
    recordListeningTime(seconds = 30, isNewSession = false) {
      const sec = Number(seconds) || 0
      if (sec <= 0) return

      this.listeningSeconds = (this.listeningSeconds || 0) + sec
      this.totalListeningSeconds = (this.totalListeningSeconds || 0) + sec
      if (isNewSession || !this.listeningSessionsCount) {
        this.listeningSessionsCount = (this.listeningSessionsCount || 0) + 1
      }

      const today = formatDate(new Date())
      if (!this.dailyListening || typeof this.dailyListening !== 'object') {
        this.dailyListening = {}
      }
      this.dailyListening[today] = (this.dailyListening[today] || 0) + sec
      this.saveToStorage()
    },

    recordListening(seconds = 30, isNewSession = false) {
      this.recordListeningTime(seconds, isNewSession)
    },

    recordShadowingScore(score, type = 'hp') {
      const num = typeof score === 'number' && !isNaN(score) ? clamp(score, 0, 100) : 0
      if (!Array.isArray(this.shadowingHistory)) {
        this.shadowingHistory = []
      }

      this.shadowingHistory.push({
        id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        score: num,
        type: type || 'hp',
        timestamp: Date.now()
      })

      if (this.shadowingHistory.length > 50) {
        this.shadowingHistory = this.shadowingHistory.slice(-50)
      }

      this.saveToStorage()
    },

    recordDictationResult(correctCount, totalCount) {
      const correct = typeof correctCount === 'number' && !isNaN(correctCount)
        ? Math.max(0, Math.round(correctCount))
        : 0
      const total = typeof totalCount === 'number' && !isNaN(totalCount)
        ? Math.max(correct, Math.round(totalCount))
        : correct

      if (!Array.isArray(this.dictationHistory)) {
        this.dictationHistory = []
      }

      this.dictationHistory.push({
        id: `dict-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        correctCount: correct,
        totalCount: total,
        timestamp: Date.now()
      })

      if (this.dictationHistory.length > 50) {
        this.dictationHistory = this.dictationHistory.slice(-50)
      }

      this.saveToStorage()
    },

    saveExamResult(examData) {
      if (!examData || typeof examData !== 'object') return
      if (!Array.isArray(this.examHistory)) {
        this.examHistory = []
      }

      const cefrResult = examData.cefrResult || 'A2'
      const titles = {
        A2: '魔法学徒',
        B1: '魔法探索者',
        B2: '魔法进阶者',
        C1: '傲罗精通'
      }

      const entry = {
        id: examData.id || `owls-${Date.now()}`,
        timestamp: examData.timestamp || Date.now(),
        cefrResult,
        title: examData.title || titles[cefrResult] || '魔法学徒',
        compositeScore: typeof examData.compositeScore === 'number' && !isNaN(examData.compositeScore)
          ? examData.compositeScore
          : 0,
        dimensions: examData.dimensions && typeof examData.dimensions === 'object'
          ? {
              auditory: clamp(examData.dimensions.auditory ?? 60),
              vocabDepth: clamp(examData.dimensions.vocabDepth ?? 60),
              comprehension: clamp(examData.dimensions.comprehension ?? 60),
              shadowing: clamp(examData.dimensions.shadowing ?? 60),
              production: clamp(examData.dimensions.production ?? 60)
            }
          : { auditory: 60, vocabDepth: 60, comprehension: 60, shadowing: 60, production: 60 },
        mentorFeedback: typeof examData.mentorFeedback === 'string' ? examData.mentorFeedback : ''
      }

      this.examHistory.push(entry)

      if (this.examHistory.length > 20) {
        this.examHistory = this.examHistory.slice(-20)
      }

      this.saveToStorage()
    },

    markChapterComplete(chapterId) {
      if (!chapterId || typeof chapterId !== 'string') return
      if (!Array.isArray(this.completedChapters)) {
        this.completedChapters = []
      }
      if (!this.completedChapters.includes(chapterId)) {
        this.completedChapters.push(chapterId)
        this.saveToStorage()
      }
    },

    saveToStorage() {
      if (typeof localStorage === 'undefined') return
      try {
        const fullPayload = {
          listeningSeconds: this.listeningSeconds || 0,
          listeningSessionsCount: this.listeningSessionsCount || 0,
          shadowingHistory: this.shadowingHistory || [],
          dictationHistory: this.dictationHistory || [],
          examHistory: this.examHistory || [],
          totalListeningSeconds: this.totalListeningSeconds || this.listeningSeconds || 0,
          completedChapters: this.completedChapters || [],
          dailyListening: this.dailyListening || {}
        }
        localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(fullPayload))

        // Backwards compatible storage key
        const compatPayload = {
          totalListeningSeconds: this.totalListeningSeconds || this.listeningSeconds || 0,
          completedChapters: this.completedChapters || [],
          dailyListening: this.dailyListening || {}
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compatPayload))
      } catch (e) {
        console.warn('[AnalyticsStore] Failed to save to localStorage:', e)
      }
    },

    clearStorage() {
      this.listeningSeconds = 0
      this.listeningSessionsCount = 0
      this.shadowingHistory = []
      this.dictationHistory = []
      this.examHistory = []
      this.totalListeningSeconds = 0
      this.completedChapters = []
      this.dailyListening = {}
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(STORAGE_KEY_STATE)
          localStorage.removeItem(STORAGE_KEY)
        } catch {}
      }
    }
  }
})
