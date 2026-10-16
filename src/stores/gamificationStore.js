import { defineStore } from 'pinia'
import { BADGE_DEFINITIONS } from '../data/badgeDefinitions.js'
import { useAnalyticsStore } from './analyticsStore.js'
import { useVocabStore } from './vocabStore.js'

export const STORAGE_KEY_GAMIFICATION = 'hp_gamification_state'

export const HOUSES = {
  gryffindor: {
    id: 'gryffindor',
    name: '格兰芬多',
    enName: 'Gryffindor',
    qualities: '勇气、魄力、骑士风范',
    gemName: '红宝石 (Ruby)',
    gemColor: '#991b1b',
    primaryColor: '#b91c1c',
    bgColor: '#fef2f2',
    borderColor: '#fca5a5',
    icon: 'Flame',
    quote: 'Where dwell the brave at heart, their daring, nerve, and chivalry set Gryffindors apart.'
  },
  ravenclaw: {
    id: 'ravenclaw',
    name: '拉文克劳',
    enName: 'Ravenclaw',
    qualities: '睿智、学识、敏锐洞察',
    gemName: '蓝宝石 (Sapphire)',
    gemColor: '#1e40af',
    primaryColor: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#93c5fd',
    icon: 'BookOpen',
    quote: 'Where those of wit and learning, will always find their kind.'
  },
  hufflepuff: {
    id: 'hufflepuff',
    name: '赫奇帕奇',
    enName: 'Hufflepuff',
    qualities: '正直、坚韧、忠诚不渝',
    gemName: '黄晶石 (Topaz)',
    gemColor: '#b45309',
    primaryColor: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fcd34d',
    icon: 'Heart',
    quote: 'Where they are just and loyal, those patient Hufflepuffs are true and unafraid of toil.'
  },
  slytherin: {
    id: 'slytherin',
    name: '斯莱特林',
    enName: 'Slytherin',
    qualities: '雄心、谋略、追求卓越',
    gemName: '祖母绿 (Emerald)',
    gemColor: '#166534',
    primaryColor: '#15803d',
    bgColor: '#f0fdf4',
    borderColor: '#86efac',
    icon: 'Crown',
    quote: "Where you'll make your real friends, those cunning folk use any means to achieve their ends."
  }
}

/**
 * Format Date to YYYY-MM-DD in local time
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

/**
 * Get date string for day before given YYYY-MM-DD
 * @param {string} dateStr
 * @returns {string}
 */
export function getPreviousDateStr(dateStr) {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() - 1)
    return formatDate(d)
  } catch {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return formatDate(d)
  }
}

function loadFromStorage() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GAMIFICATION)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.warn('[GamificationStore] Failed to parse hp_gamification_state:', e)
    return null
  }
}

export const useGamificationStore = defineStore('gamification', {
  state: () => {
    const loaded = loadFromStorage() || {}
    return {
      userHouse: loaded.userHouse || null,
      sortedAt: loaded.sortedAt || null,
      housePoints: loaded.housePoints && typeof loaded.housePoints === 'object'
        ? {
            gryffindor: Number(loaded.housePoints.gryffindor) || 180,
            ravenclaw: Number(loaded.housePoints.ravenclaw) || 175,
            hufflepuff: Number(loaded.housePoints.hufflepuff) || 165,
            slytherin: Number(loaded.housePoints.slytherin) || 190
          }
        : {
            gryffindor: 180,
            ravenclaw: 175,
            hufflepuff: 165,
            slytherin: 190
          },
      studentContribution: Number(loaded.studentContribution) || 0,
      pointHistory: Array.isArray(loaded.pointHistory) ? loaded.pointHistory : [],
      streakDays: typeof loaded.streakDays === 'number' && !isNaN(loaded.streakDays) ? loaded.streakDays : 0,
      lastActiveDate: loaded.lastActiveDate || null,
      dailyGoalSeconds: typeof loaded.dailyGoalSeconds === 'number' ? loaded.dailyGoalSeconds : 300,
      streakFreezes: typeof loaded.streakFreezes === 'number' ? loaded.streakFreezes : 1,
      streakFrozenDates: Array.isArray(loaded.streakFrozenDates) ? loaded.streakFrozenDates : [],
      unlockedBadges: loaded.unlockedBadges && typeof loaded.unlockedBadges === 'object' ? loaded.unlockedBadges : {},
      pendingToasts: [],
      todayListeningSeconds: 0
    }
  },

  getters: {
    currentHouseInfo: (state) => {
      return state.userHouse ? (HOUSES[state.userHouse] || null) : null
    },

    houseRankings: (state) => {
      const houseKeys = ['gryffindor', 'ravenclaw', 'hufflepuff', 'slytherin']
      const list = houseKeys.map(id => {
        const meta = HOUSES[id] || {}
        const points = Number(state.housePoints[id]) || 0
        return {
          id,
          name: meta.name || id,
          enName: meta.enName || id,
          points,
          gemColor: meta.gemColor || '#991b1b',
          gemName: meta.gemName || '',
          primaryColor: meta.primaryColor || '#b91c1c',
          bgColor: meta.bgColor || '#fef2f2',
          borderColor: meta.borderColor || '#fca5a5',
          icon: meta.icon || 'Flame',
          isUserHouse: state.userHouse === id
        }
      })

      list.sort((a, b) => b.points - a.points)

      const leaderPoints = list.length > 0 ? list[0].points : 1
      const maxPoints = Math.max(leaderPoints, 1)

      return list.map((item, index) => {
        const rank = index + 1
        const gapFromLeader = Math.max(0, leaderPoints - item.points)
        const hourglassHeight = Math.max(15, Math.min(130, Math.round((item.points / maxPoints) * 120)))
        return {
          ...item,
          rank,
          gapFromLeader,
          hourglassHeight
        }
      })
    },

    allBadgesWithStatus: (state) => {
      return BADGE_DEFINITIONS.map(badge => {
        const unlockedInfo = state.unlockedBadges[badge.id]
        const isUnlocked = !!unlockedInfo
        const unlockedAt = unlockedInfo?.unlockedAt || null
        const seen = !!unlockedInfo?.seen

        let progress = 0
        if (isUnlocked) {
          progress = 100
        } else {
          if (badge.id === 'sorting-ceremony') {
            progress = state.userHouse ? 100 : 0
          } else if (badge.id === 'patronus-shield') {
            progress = state.streakFrozenDates && state.streakFrozenDates.length > 0 ? 100 : 0
          } else if (badge.target && typeof badge.target === 'number') {
            progress = Math.min(100, Math.max(0, Math.round(((state.streakDays || 0) / badge.target) * 100)))
          } else if (badge.targetMinutes && typeof badge.targetMinutes === 'number') {
            let totalMinutes = 0
            try {
              const analytics = useAnalyticsStore()
              const sec = Number(analytics?.listeningSeconds || analytics?.totalListeningSeconds) || 0
              totalMinutes = sec / 60
            } catch {}
            progress = Math.min(100, Math.max(0, Math.round((totalMinutes / badge.targetMinutes) * 100)))
          } else if (badge.targetVocab && typeof badge.targetVocab === 'number') {
            let vCount = 0
            try {
              const vocab = useVocabStore()
              vCount = Array.isArray(vocab?.vocabList) ? vocab.vocabList.length : 0
            } catch {}
            progress = Math.min(100, Math.max(0, Math.round((vCount / badge.targetVocab) * 100)))
          } else if (badge.targetL4 && typeof badge.targetL4 === 'number') {
            let l4Count = 0
            try {
              const vocab = useVocabStore()
              if (Array.isArray(vocab?.vocabList)) {
                l4Count = vocab.vocabList.filter(w => w.acquisition?.l4).length
              }
            } catch {}
            progress = Math.min(100, Math.max(0, Math.round((l4Count / badge.targetL4) * 100)))
          } else {
            progress = 0
          }
        }

        return {
          ...badge,
          isUnlocked,
          unlockedAt,
          seen,
          progress
        }
      })
    },

    unlockedCount: (state) => Object.keys(state.unlockedBadges || {}).length,

    isDailyGoalAchieved: (state) => {
      if (state.todayListeningSeconds >= state.dailyGoalSeconds) return true
      try {
        const analytics = useAnalyticsStore()
        const today = formatDate(new Date())
        const sec = (analytics?.dailyListening && Number(analytics.dailyListening[today])) || 0
        if (sec >= state.dailyGoalSeconds) return true
      } catch {}
      return state.lastActiveDate === formatDate(new Date())
    }
  },

  actions: {
    selectHouse(houseId) {
      if (!HOUSES[houseId]) {
        console.warn(`[GamificationStore] Invalid houseId: ${houseId}`)
        return
      }

      this.userHouse = houseId
      this.sortedAt = Date.now()

      // Award initial 20 points for sorting ceremony
      this.awardPoints(20, '分院仪式入席')

      // Unlock sorting-ceremony badge
      this.unlockBadge('sorting-ceremony')

      this.saveToStorage()
    },

    awardPoints(points, reason = '学分奖励') {
      const pts = Number(points) || 0
      if (pts <= 0) return

      if (this.userHouse && this.housePoints[this.userHouse] !== undefined) {
        this.housePoints[this.userHouse] += pts
      }
      this.studentContribution += pts

      this.pointHistory.unshift({
        id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        points: pts,
        reason,
        timestamp: Date.now()
      })

      if (this.pointHistory.length > 50) {
        this.pointHistory = this.pointHistory.slice(0, 50)
      }

      this.pendingToasts.push({
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'points',
        title: `学院学分 +${pts}`,
        subtitle: reason,
        icon: 'Sparkles',
        house: this.userHouse
      })

      this.saveToStorage()
    },

    checkInDaily(todayListeningSec = 0, overrideDate = null) {
      const todayStr = overrideDate || formatDate(new Date())
      const yesterdayStr = getPreviousDateStr(todayStr)

      this.todayListeningSeconds = Math.max(this.todayListeningSeconds || 0, Number(todayListeningSec) || 0)

      if (!this.lastActiveDate) {
        // Initial first check-in
        this.streakDays = 1
        this.lastActiveDate = todayStr
      } else if (this.lastActiveDate === todayStr) {
        // Idempotent: already checked in today
      } else if (this.lastActiveDate === yesterdayStr) {
        // Consecutive day
        this.streakDays += 1
        this.lastActiveDate = todayStr
      } else {
        // Gap > 1 day (yesterday was skipped)
        if (this.streakFreezes > 0) {
          this.streakFreezes -= 1
          if (!this.streakFrozenDates.includes(yesterdayStr)) {
            this.streakFrozenDates.push(yesterdayStr)
          }
          this.streakDays += 1
          this.unlockBadge('patronus-shield')
          this.pendingToasts.push({
            id: `toast-freeze-${Date.now()}`,
            type: 'freeze',
            title: '呼神护卫守护',
            subtitle: `已消耗 1 枚守护神冷冻符，保住第 ${this.streakDays} 天连续打卡`,
            icon: 'Sparkles'
          })
          this.lastActiveDate = todayStr
        } else {
          this.streakDays = 1
          this.lastActiveDate = todayStr
        }
      }

      // 7-day milestone rewards 1 additional freeze up to cap 2
      if (this.streakDays > 0 && this.streakDays % 7 === 0) {
        if (this.streakFreezes < 2) {
          this.streakFreezes += 1
          this.pendingToasts.push({
            id: `toast-freeze-reward-${Date.now()}`,
            type: 'freeze_reward',
            title: '连续打卡奖励',
            subtitle: `已达成 ${this.streakDays} 天连续修行，补充 1 枚守护神冷冻符`,
            icon: 'Shield'
          })
        }
      }

      // Check streak milestone badges
      if (this.streakDays >= 30) {
        this.unlockBadge('streak-30')
      }
      if (this.streakDays >= 7) {
        this.unlockBadge('streak-7')
      }
      if (this.streakDays >= 3) {
        this.unlockBadge('streak-3')
      }

      this.saveToStorage()
    },

    consumeStreakFreeze() {
      if (this.streakFreezes > 0) {
        this.streakFreezes -= 1
        const yesterday = getPreviousDateStr(formatDate(new Date()))
        if (!this.streakFrozenDates.includes(yesterday)) {
          this.streakFrozenDates.push(yesterday)
        }
        this.unlockBadge('patronus-shield')
        this.saveToStorage()
        return true
      }
      return false
    },

    unlockBadge(badgeId) {
      if (!badgeId || this.unlockedBadges[badgeId]) return false
      const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId)
      if (!badge) return false

      this.unlockedBadges[badgeId] = {
        unlockedAt: Date.now(),
        seen: false
      }

      this.pendingToasts.push({
        id: `toast-badge-${Date.now()}-${badgeId}`,
        type: 'badge',
        badgeId: badge.id,
        title: `解锁成就：${badge.name}`,
        subtitle: badge.desc,
        icon: badge.icon
      })

      this.saveToStorage()
      return true
    },

    checkAndUnlockBadges(context = {}) {
      // 1. sorting-ceremony
      if (this.userHouse !== null) {
        this.unlockBadge('sorting-ceremony')
      }

      // 2. first-journey
      if (
        context.chapterCompleted ||
        (Array.isArray(context.completedChapters) && context.completedChapters.length > 0)
      ) {
        this.unlockBadge('first-journey')
      } else {
        try {
          const analytics = useAnalyticsStore()
          if (Array.isArray(analytics?.completedChapters) && analytics.completedChapters.length > 0) {
            this.unlockBadge('first-journey')
          }
        } catch {}
      }

      // 3. streak badges
      const streak = typeof context.streakDays === 'number' ? context.streakDays : this.streakDays
      if (streak >= 3) this.unlockBadge('streak-3')
      if (streak >= 7) this.unlockBadge('streak-7')
      if (streak >= 30) this.unlockBadge('streak-30')

      // 4. patronus-shield
      if (this.streakFrozenDates.length > 0 || context.usedFreeze) {
        this.unlockBadge('patronus-shield')
      }

      // 5. ear-master badges
      let totalMinutes = typeof context.listeningMinutes === 'number' ? context.listeningMinutes : 0
      if (!totalMinutes && typeof context.listeningSeconds === 'number') {
        totalMinutes = context.listeningSeconds / 60
      }
      if (!totalMinutes) {
        try {
          const analytics = useAnalyticsStore()
          const sec = Number(analytics?.listeningSeconds || analytics?.totalListeningSeconds) || 0
          totalMinutes = sec / 60
        } catch {}
      }
      if (totalMinutes >= 60) this.unlockBadge('ear-master-1')
      if (totalMinutes >= 600) this.unlockBadge('ear-master-10')

      // 6. shadowing-85
      if (typeof context.shadowingScore === 'number' && context.shadowingScore >= 85) {
        this.unlockBadge('shadowing-85')
      } else {
        try {
          const analytics = useAnalyticsStore()
          if (Array.isArray(analytics?.shadowingHistory) && analytics.shadowingHistory.some(s => Number(s.score) >= 85)) {
            this.unlockBadge('shadowing-85')
          }
        } catch {}
      }

      // 7. vocab-50 & vocab-l4-20
      let vCount = typeof context.vocabCount === 'number' ? context.vocabCount : null
      let l4Count = typeof context.l4Count === 'number' ? context.l4Count : null
      if (vCount === null || l4Count === null) {
        try {
          const vocab = useVocabStore()
          if (Array.isArray(vocab?.vocabList)) {
            if (vCount === null) vCount = vocab.vocabList.length
            if (l4Count === null) l4Count = vocab.vocabList.filter(w => w.acquisition?.l4).length
          }
        } catch {}
      }
      if (typeof vCount === 'number' && vCount >= 50) this.unlockBadge('vocab-50')
      if (typeof l4Count === 'number' && l4Count >= 20) this.unlockBadge('vocab-l4-20')

      // 8. dictation-ace
      const isDictationAce =
        context.dictationAce === true ||
        context.dictationAccuracy === 100 ||
        (typeof context.dictationTotal === 'number' &&
          context.dictationTotal > 0 &&
          context.dictationCorrect === context.dictationTotal)
      if (isDictationAce) {
        this.unlockBadge('dictation-ace')
      } else {
        try {
          const analytics = useAnalyticsStore()
          if (
            Array.isArray(analytics?.dictationHistory) &&
            analytics.dictationHistory.some(d => Number(d.totalCount) > 0 && Number(d.correctCount) === Number(d.totalCount))
          ) {
            this.unlockBadge('dictation-ace')
          }
        } catch {}
      }

      // 9. owls-pass & owls-outstanding
      if (context.owlsExamCompleted || context.owlsGrade) {
        this.unlockBadge('owls-pass')
      } else {
        try {
          const analytics = useAnalyticsStore()
          if (Array.isArray(analytics?.examHistory) && analytics.examHistory.length > 0) {
            this.unlockBadge('owls-pass')
          }
        } catch {}
      }

      const isOutstanding =
        context.owlsGrade === 'O' ||
        context.cefrResult === 'O' ||
        context.owlsOutstanding === true
      if (isOutstanding) {
        this.unlockBadge('owls-outstanding')
      } else {
        try {
          const analytics = useAnalyticsStore()
          if (
            Array.isArray(analytics?.examHistory) &&
            analytics.examHistory.some(e => e.grade === 'O' || e.rating === 'O' || e.cefrResult === 'O' || e.title?.includes('卓越'))
          ) {
            this.unlockBadge('owls-outstanding')
          }
        } catch {}
      }
    },

    popToast() {
      return this.pendingToasts.shift() || null
    },

    markBadgeSeen(badgeId) {
      if (this.unlockedBadges[badgeId]) {
        this.unlockedBadges[badgeId].seen = true
        this.saveToStorage()
      }
    },

    saveToStorage() {
      if (typeof localStorage === 'undefined') return
      try {
        const data = {
          userHouse: this.userHouse,
          sortedAt: this.sortedAt,
          housePoints: this.housePoints,
          studentContribution: this.studentContribution,
          pointHistory: this.pointHistory,
          streakDays: this.streakDays,
          lastActiveDate: this.lastActiveDate,
          dailyGoalSeconds: this.dailyGoalSeconds,
          streakFreezes: this.streakFreezes,
          streakFrozenDates: this.streakFrozenDates,
          unlockedBadges: this.unlockedBadges
        }
        localStorage.setItem(STORAGE_KEY_GAMIFICATION, JSON.stringify(data))
      } catch (e) {
        console.warn('[GamificationStore] Failed to save hp_gamification_state:', e)
      }
    }
  }
})
