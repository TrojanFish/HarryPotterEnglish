import { defineStore } from 'pinia'

export const STORAGE_KEY = 'hp_analytics_log'

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

function loadFromStorage() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.warn('[AnalyticsStore] Failed to load from localStorage:', e)
    return null
  }
}

export const useAnalyticsStore = defineStore('analytics', {
  state: () => {
    const loaded = loadFromStorage()
    return {
      totalListeningSeconds:
        typeof loaded?.totalListeningSeconds === 'number' && !isNaN(loaded.totalListeningSeconds)
          ? loaded.totalListeningSeconds
          : 0,
      completedChapters: Array.isArray(loaded?.completedChapters) ? loaded.completedChapters : [],
      dailyListening:
        loaded?.dailyListening && typeof loaded.dailyListening === 'object' && !Array.isArray(loaded.dailyListening)
          ? loaded.dailyListening
          : {}
    }
  },

  getters: {
    streakDays: (state) => {
      const daily = state.dailyListening
      if (!daily || typeof daily !== 'object' || Object.keys(daily).length === 0) {
        return 0
      }

      const now = new Date()
      const todayStr = formatDate(now)
      let count = 0

      // If today has listening activity, calculate streak starting today
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

      // If today is not logged yet, calculate streak ending yesterday
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
      const sec = Number(state.totalListeningSeconds) || 0
      return (sec / 3600).toFixed(1)
    },

    completedChaptersCount: (state) => {
      return Array.isArray(state.completedChapters) ? state.completedChapters.length : 0
    },

    accuracyScore: () => 95,

    weeklyDays: (state) => {
      const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      const now = new Date()
      const dayOfWeek = (now.getDay() + 6) % 7 // Monday = 0, Sunday = 6
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
    recordListening(seconds = 30) {
      const sec = Number(seconds) || 0
      if (sec <= 0) return

      this.totalListeningSeconds = (this.totalListeningSeconds || 0) + sec
      const today = formatDate(new Date())
      if (!this.dailyListening || typeof this.dailyListening !== 'object') {
        this.dailyListening = {}
      }
      this.dailyListening[today] = (this.dailyListening[today] || 0) + sec
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
        const payload = {
          totalListeningSeconds: this.totalListeningSeconds || 0,
          completedChapters: this.completedChapters || [],
          dailyListening: this.dailyListening || {}
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch (e) {
        console.warn('[AnalyticsStore] Failed to save to localStorage:', e)
      }
    },

    clearStorage() {
      this.totalListeningSeconds = 0
      this.completedChapters = []
      this.dailyListening = {}
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {}
      }
    }
  }
})
