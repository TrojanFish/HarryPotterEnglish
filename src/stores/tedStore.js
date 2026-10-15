import { defineStore } from 'pinia'
import { TALKS, resolveVideoStreamUrl, resolveTedSubtitleUrl } from '../data/tedData.js'

const COMPLETED_TALKS_KEY = 'ted_completed_talks'

function getInitialCompletedTalks() {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(COMPLETED_TALKS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {}
  }
  return []
}

export const useTedStore = defineStore('ted', {
  state: () => ({
    // Catalog
    talks: TALKS,
    selectedTalkId: null,

    // Four-step progression (1: Vocab Preload, 2: Deep Viewing, 3: Task Studio, 4: Shadowing)
    currentStep: 1,

    // Step 1 Vocab Preload
    listenedVocabIds: new Set(),
    vocabUnlocked: false,

    // Step 2 Video Player
    videoSrc: '',
    vttSrc: '',
    videoCurrentTime: 0,
    videoDuration: 0,
    isVideoPlaying: false,
    isBlindMode: false,
    loopCueIndex: null,
    showChineseSubs: true,
    activeCueIndex: 0,
    lookupWord: null,

    // Step 3 Task Studio
    clozeAnswers: {},
    matchingAnswers: {},
    taskScore: null,

    // Step 4 Shadowing
    shadowingSegmentIndex: 0,
    shadowingPhase: 'idle',

    // Persistence
    completedTalkIds: getInitialCompletedTalks()
  }),

  getters: {
    currentTalk: (state) => {
      return state.talks.find((t) => t.id === state.selectedTalkId) || null
    },
    currentShadowingSegment: (state) => {
      const talk = state.talks.find((t) => t.id === state.selectedTalkId)
      return talk?.shadowingSegments?.[state.shadowingSegmentIndex] || null
    },
    isCurrentTalkCompleted: (state) => {
      return Boolean(state.selectedTalkId && state.completedTalkIds.includes(state.selectedTalkId))
    },
    vocabProgress: (state) => {
      const talk = state.talks.find((t) => t.id === state.selectedTalkId)
      const total = talk?.vocabSet?.length || 0
      if (total === 0) return { listened: 0, total: 0, percent: 0 }
      return {
        listened: state.listenedVocabIds.size,
        total,
        percent: Math.min(100, Math.round((state.listenedVocabIds.size / total) * 100))
      }
    }
  },

  actions: {
    selectTalk(id) {
      const talk = this.talks.find((t) => t.id === id)
      if (!talk) return

      this.selectedTalkId = talk.id
      this.currentStep = 1
      this.listenedVocabIds = new Set()
      this.vocabUnlocked = false
      this.videoSrc = resolveVideoStreamUrl(talk.videoKey)
      this.vttSrc = resolveTedSubtitleUrl(talk.vttKey)
      this.videoCurrentTime = 0
      this.videoDuration = 0
      this.isVideoPlaying = false
      this.isBlindMode = false
      this.loopCueIndex = null
      this.showChineseSubs = true
      this.activeCueIndex = 0
      this.lookupWord = null
      this.clozeAnswers = {}
      this.matchingAnswers = {}
      this.taskScore = null
      this.shadowingSegmentIndex = 0
      this.shadowingPhase = 'idle'
    },

    markVocabListened(word) {
      if (!word) return
      const clean = typeof word === 'string' ? word.trim().toLowerCase() : word
      this.listenedVocabIds.add(clean)
      const totalVocab = this.currentTalk?.vocabSet?.length || 0
      if (totalVocab > 0) {
        this.vocabUnlocked = this.listenedVocabIds.size >= totalVocab
      }
    },

    goToStep(step) {
      const targetStep = Math.max(1, Math.min(4, Math.floor(Number(step) || 1)))
      if (targetStep > 1 && !this.vocabUnlocked) {
        return
      }
      this.currentStep = targetStep
    },

    toggleBlindMode() {
      this.isBlindMode = !this.isBlindMode
    },

    toggleChineseSubs() {
      this.showChineseSubs = !this.showChineseSubs
    },

    setLoopCue(index) {
      this.loopCueIndex = index
    },

    setLookupWord(word) {
      this.lookupWord = word
    },

    submitClozeAnswer(id, answer) {
      this.clozeAnswers[id] = answer
    },

    submitMatchingAnswer(id, timestampSeconds) {
      this.matchingAnswers[id] = timestampSeconds
    },

    scoreTask() {
      const talk = this.currentTalk
      const clozeList = talk?.tasks?.cloze || []
      const matchingList = talk?.tasks?.matching || []

      let clozeScore = 0
      if (clozeList.length > 0) {
        let correctCloze = 0
        for (const item of clozeList) {
          const userAns = this.clozeAnswers[item.id]
          const targetAns = item.blanks?.[0]
          if (
            typeof userAns === 'string' &&
            typeof targetAns === 'string' &&
            userAns.trim().toLowerCase() === targetAns.trim().toLowerCase()
          ) {
            correctCloze++
          }
        }
        clozeScore = (correctCloze / clozeList.length) * 100
      }

      let matchingScore = 0
      if (matchingList.length > 0) {
        let correctMatching = 0
        for (const item of matchingList) {
          const userMatch = this.matchingAnswers[item.id]
          if (userMatch !== undefined && userMatch === item.timestampSeconds) {
            correctMatching++
          }
        }
        matchingScore = (correctMatching / matchingList.length) * 100
      }

      let totalScore = 0
      if (clozeList.length > 0 && matchingList.length > 0) {
        totalScore = Math.round((clozeScore + matchingScore) / 2)
      } else if (clozeList.length > 0) {
        totalScore = Math.round(clozeScore)
      } else if (matchingList.length > 0) {
        totalScore = Math.round(matchingScore)
      }

      this.taskScore = totalScore
      return totalScore
    },

    markTalkCompleted(id) {
      if (!id) return
      if (!this.completedTalkIds.includes(id)) {
        this.completedTalkIds.push(id)
      }
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(COMPLETED_TALKS_KEY, JSON.stringify(this.completedTalkIds))
        } catch {}
      }
    },

    setVideoCurrentTime(time) {
      this.videoCurrentTime = time
    },

    setVideoDuration(duration) {
      this.videoDuration = duration
    },

    setIsVideoPlaying(isPlaying) {
      this.isVideoPlaying = isPlaying
    },

    setActiveCueIndex(index) {
      this.activeCueIndex = index
    },

    setShadowingSegmentIndex(index) {
      this.shadowingSegmentIndex = index
    },

    setShadowingPhase(phase) {
      this.shadowingPhase = phase
    }
  }
})
