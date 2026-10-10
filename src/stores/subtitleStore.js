import { defineStore } from 'pinia'
import { parseVTT } from '../utils/vttParser.js'

export const useSubtitleStore = defineStore('subtitle', {
  state: () => ({
    cues: [],
    activeCueIndex: -1,
    isLoading: false,
    error: null
  }),

  getters: {
    currentCue: (state) => {
      if (state.activeCueIndex >= 0 && state.activeCueIndex < state.cues.length) {
        return state.cues[state.activeCueIndex]
      }
      return null
    },
    effectiveCue: (state) => {
      if (state.activeCueIndex >= 0 && state.activeCueIndex < state.cues.length) {
        return state.cues[state.activeCueIndex]
      }
      return state.cues[0] || null
    },
    effectiveCueIndex: (state) => {
      if (state.cues.length === 0) return 0
      return state.activeCueIndex >= 0 ? state.activeCueIndex : 0
    }
  },

  actions: {
    setCues(rawCues) {
      if (!Array.isArray(rawCues)) {
        this.cues = []
        this.activeCueIndex = -1
        return
      }

      // Normalize cue structure to guarantee start/end/text
      this.cues = rawCues.map((c, index) => ({
        id: c.id ?? index + 1,
        start: c.start ?? c.startTime ?? 0,
        end: c.end ?? c.endTime ?? 0,
        text: c.text || '',
        translation: c.translation || ''
      }))
      this.activeCueIndex = -1
      this.error = null
    },

    updateActiveCue(time) {
      const list = this.cues
      if (!list || list.length === 0) {
        this.activeCueIndex = -1
        return
      }

      // Optimization: check if current cue is still active
      const cur = this.activeCueIndex
      if (cur >= 0 && cur < list.length) {
        if (time >= list[cur].start && time < list[cur].end) {
          return
        }
        // Check next immediate cue
        if (cur + 1 < list.length && time >= list[cur + 1].start && time < list[cur + 1].end) {
          this.activeCueIndex = cur + 1
          return
        }
      }

      // Binary search for jumps/seeks
      let low = 0
      let high = list.length - 1
      let found = -1

      while (low <= high) {
        const mid = (low + high) >> 1
        const cue = list[mid]
        if (time < cue.start) {
          high = mid - 1
        } else if (time >= cue.end) {
          low = mid + 1
        } else {
          found = mid
          break
        }
      }

      this.activeCueIndex = found
    },

    async loadVtt(url) {
      if (!url) {
        this.setCues([])
        return
      }

      this.isLoading = true
      this.error = null

      try {
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`Failed to load VTT: ${res.status} ${res.statusText}`)
        }
        const text = await res.text()
        const parsed = parseVTT(text)
        this.setCues(parsed)
      } catch (err) {
        console.warn('[SubtitleStore] VTT loading warning (fallback to pure audio):', err.message)
        this.error = err.message
        this.setCues([])
      } finally {
        this.isLoading = false
      }
    },

    jumpToNextCue() {
      if (this.activeCueIndex < this.cues.length - 1) {
        this.activeCueIndex++
      }
    },

    jumpToPrevCue() {
      if (this.activeCueIndex > 0) {
        this.activeCueIndex--
      }
    }
  }
})
