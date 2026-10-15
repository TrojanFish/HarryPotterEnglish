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
      currentBookId: saved?.bookId || 'hp-book-1',
      currentChapterId: saved?.chapterId || 'hp-book-1_ep01',
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1.0,
      volume: 1.0,
      isBlindMode: false,
      isBookshelfOpen: false,
      isBuffering: false,
      isAudioLoading: false,
      audioError: null,
      isOfflineFallback: false,
      audioSrc: '',
      sleepTimerMode: null,
      sleepTimerRemaining: null,
      sleepTimerTargetTimestamp: null,
      seekTimestamp: 0
    }
  },

  actions: {
    setBuffering(val) {
      this.isBuffering = Boolean(val)
    },

    setAudioLoading(val) {
      this.isAudioLoading = Boolean(val)
    },

    setAudioError(err) {
      this.audioError = err || null
    },

    setOfflineFallback(val) {
      this.isOfflineFallback = Boolean(val)
    },

    setAudioSrc(src) {
      this.audioSrc = src || ''
    },
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
      this.seekTimestamp = Date.now()
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

    setSleepTimer(mode) {
      if (!mode || mode === 'off') {
        this.sleepTimerMode = null
        this.sleepTimerRemaining = null
        this.sleepTimerTargetTimestamp = null
        return
      }
      if (mode === 'end_of_chapter') {
        this.sleepTimerMode = 'end_of_chapter'
        this.sleepTimerRemaining = null
        this.sleepTimerTargetTimestamp = null
        return
      }
      const mins = Number(mode)
      if (mins > 0) {
        this.sleepTimerMode = mins
        this.sleepTimerRemaining = mins * 60
        this.sleepTimerTargetTimestamp = Date.now() + mins * 60 * 1000
      }
    },

    tickSleepTimer() {
      if (typeof this.sleepTimerMode === 'number' && this.sleepTimerTargetTimestamp) {
        const rem = Math.max(0, Math.ceil((this.sleepTimerTargetTimestamp - Date.now()) / 1000))
        this.sleepTimerRemaining = rem
        if (rem <= 0) {
          this.pause()
          this.setSleepTimer(null)
        }
      }
    },

    handleChapterEndSleepTimer() {
      if (this.sleepTimerMode === 'end_of_chapter') {
        this.setSleepTimer(null)
        this.pause()
        return true
      }
      return false
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
