import { defineStore } from 'pinia'

const STORAGE_KEY = 'hp_last_position'

function loadSavedPosition() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    console.warn('[PlayerStore] Failed to parse saved position:', e)
    return null
  }
}

export const usePlayerStore = defineStore('player', {
  state: () => {
    const saved = loadSavedPosition()
    return {
      currentBookId: saved?.bookId || 'hp1',
      currentChapterId: saved?.chapterId || 'hp1-01',
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1.0,
      volume: 1.0,
      isBlindMode: false,
      isBookshelfOpen: false,
      isBuffering: false,
      audioSrc: ''
    }
  },

  actions: {
    play() {
      this.isPlaying = true
    },

    pause() {
      this.isPlaying = false
      this.persistPosition()
    },

    togglePlay() {
      if (this.isPlaying) {
        this.pause()
      } else {
        this.play()
      }
    },

    seek(seconds) {
      const target = Math.max(0, Math.min(seconds, this.duration || Infinity))
      this.currentTime = target
    },

    setPlaybackRate(rate) {
      this.playbackRate = Number(rate) || 1.0
    },

    setVolume(vol) {
      this.volume = Math.max(0, Math.min(1, Number(vol) || 0))
    },

    toggleBlindMode() {
      this.isBlindMode = !this.isBlindMode
    },

    toggleBookshelf(open) {
      this.isBookshelfOpen = typeof open === 'boolean' ? open : !this.isBookshelfOpen
    },

    switchChapter(bookId, chapterId) {
      this.currentBookId = bookId
      this.currentChapterId = chapterId
      this.currentTime = 0
      this.duration = 0
      this.persistPosition()
    },

    persistPosition() {
      if (typeof localStorage === 'undefined') return
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          bookId: this.currentBookId,
          chapterId: this.currentChapterId,
          time: Math.floor(this.currentTime),
          updatedAt: Date.now()
        }))
      } catch (e) {
        console.warn('[PlayerStore] Failed to persist position:', e)
      }
    }
  }
})
