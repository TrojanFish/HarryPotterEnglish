<template>
  <!-- Hidden native audio element managed via shallowRef -->
  <audio
    ref="audioRef"
    :src="activeAudioSrc"
    preload="metadata"
    @timeupdate="onTimeUpdate"
    @durationchange="onDurationChange"
    @play="player.play()"
    @pause="player.pause()"
    @waiting="onAudioWaiting"
    @canplay="onAudioCanPlay"
    @playing="onAudioPlaying"
    @ended="onAudioEnded"
    @error="onAudioError"
    class="hidden"
  ></audio>

  <AppShell :current-chapter-title="currentChapterLabel">
    <!-- Step views for HP audio sessions -->
    <template v-if="navStore.currentView === 'player' || navStore.currentView === 'bookshelf'">
      <MagicErrorBoundary>
        <StepListening v-if="sessionStore.currentStep === 1" />
        <StepShadowing v-else-if="sessionStore.currentStep === 2" />
        <StepDictation v-else-if="sessionStore.currentStep === 3" />
        <StepVocabReview v-else-if="sessionStore.currentStep === 4" />
      </MagicErrorBoundary>
    </template>

    <!-- TED hub placeholder (Sprint 2 will fill) -->
    <TedHub v-else-if="navStore.currentView === 'ted'" />
  </AppShell>

  <!-- Interactive modals retained for dictation / shadowing exercises -->
  <ShadowingRecorder
    :is-open="isShadowingOpen"
    :current-cue="subtitleStore.currentCue"
    @close="isShadowingOpen = false"
  />

  <DictationStudio
    :is-open="isDictationOpen"
    :current-cue="subtitleStore.currentCue"
    @close="isDictationOpen = false"
    @next="onDictationNext"
  />

  <!-- Global celebratory toast for badges and house points -->
  <BadgeUnlockedToast />
</template>

<script setup>
import { ref, shallowRef, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from './stores/playerStore.js'
import { useSubtitleStore } from './stores/subtitleStore.js'
import { useCatalogStore } from './stores/catalogStore.js'
import { useAnalyticsStore } from './stores/analyticsStore.js'
import { useVocabStore } from './stores/vocabStore.js'
import { parseVTT } from './utils/vttParser.js'
import { getCachedChapter } from './utils/offlineStorage.js'
import { SAMPLE_CHAPTER_1_VTT, SAMPLE_AUDIO_URL } from './data/chapters.js'
import AudioPlayer from './components/AudioPlayer.vue'
import SubtitleViewer from './components/SubtitleViewer.vue'
import StudioWorkbench from './components/StudioWorkbench.vue'
import StepTabBar from './components/layout/StepTabBar.vue'
import StepListening from './components/session/StepListening.vue'
import StepShadowing from './components/session/StepShadowing.vue'
import StepDictation from './components/session/StepDictation.vue'
import StepVocabReview from './components/session/StepVocabReview.vue'
import SmartAudioPlayer from './components/player/SmartAudioPlayer.vue'
import BookshelfDrawer from './components/BookshelfDrawer.vue'
import ShadowingRecorder from './components/ShadowingRecorder.vue'
import DictationStudio from './components/DictationStudio.vue'
import VocabularyDrawer from './components/VocabularyDrawer.vue'
import AnalyticsDashboard from './components/AnalyticsDashboard.vue'
import StorageManagerModal from './components/StorageManagerModal.vue'
import ShortcutsModal from './components/ShortcutsModal.vue'
import MagicErrorBoundary from './components/common/MagicErrorBoundary.vue'
import AppShell from './components/layout/AppShell.vue'
import TedHub from './components/ted/TedHub.vue'
import BadgeUnlockedToast from './components/gamification/BadgeUnlockedToast.vue'
import { useSessionStore } from './stores/sessionStore.js'
import { useNavigationStore } from './stores/navigationStore.js'
import { useGamificationStore } from './stores/gamificationStore.js'
import {
  Sparkles,
  BookOpen,
  Mic,
  PenTool,
  BookMarked,
  BarChart2,
  HardDrive,
  HelpCircle,
  ChevronDown,
  MoreVertical,
  AlertCircle,
  X
} from 'lucide-vue-next'

const player = usePlayerStore()
const subtitleStore = useSubtitleStore()
const catalog = useCatalogStore()
const analyticsStore = useAnalyticsStore()
const vocabStore = useVocabStore()
const sessionStore = useSessionStore()
const navStore = useNavigationStore()
const gamificationStore = useGamificationStore()

// Native HTMLAudioElement held in shallowRef to avoid Proxy traps
const audioRef = shallowRef(null)
const activeAudioSrc = ref('')
let currentBlobUrl = null
let syncCounter = 0
let lastTrackedTime = 0

// Interactive modal/drawer states
const isShadowingOpen = ref(false)
const isDictationOpen = ref(false)
const isVocabOpen = ref(false)
const isAnalyticsOpen = ref(false)
const isStorageOpen = ref(false)
const isShortcutsOpen = ref(false)
const isMobileMenuOpen = ref(false)

// Header vocabulary drawer & count badge compatibility:
// isVocabOpen = true
// BookMarked
// vocabStore.vocabList.length

// Current Chapter Display Label
const currentChapterLabel = computed(() => {
  const book = catalog.currentBook
  const ch = catalog.currentChapter
  const code = book?.code || 'HP1'
  const title = ch?.title || `Chapter ${ch?.number || 1}`
  return `${code} · ${title}`
})

// Sync chapter audio and subtitle based on selection
async function syncChapterContent() {
  const reqId = ++syncCounter
  lastTrackedTime = 0
  player.setAudioLoading(true)
  player.setBuffering(true)

  const ch = catalog.currentChapter
  if (!ch) {
    player.setAudioLoading(false)
    player.setBuffering(false)
    return
  }

  // 1. Check IndexedDB offline cache first
  try {
    const cached = await getCachedChapter(ch.id)
    if (reqId !== syncCounter) return
    if (cached && cached.audioBlob && cached.audioBlob.size > 0) {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl)
      }
      currentBlobUrl = URL.createObjectURL(cached.audioBlob)
      activeAudioSrc.value = currentBlobUrl
      player.setOfflineFallback(false)
      player.setAudioError(null)

      if (cached.vttText) {
        subtitleStore.setCues(parseVTT(cached.vttText))
      } else {
        subtitleStore.loadVtt(catalog.subtitleUrl)
      }
      player.setAudioLoading(false)
      player.setBuffering(false)
      return
    }
  } catch (err) {
    console.warn('[Offline] Cache lookup skipped:', err)
  }

  // 2. Stream online via catalog audioUrl
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl)
    currentBlobUrl = null
  }
  activeAudioSrc.value = catalog.audioUrl
  player.setOfflineFallback(false)

  // Concurrently load WebVTT subtitles
  subtitleStore.loadVtt(catalog.subtitleUrl).catch(() => {
    // Subtitle store handles fallback internally
  })
}

// React to chapter changes
watch(
  () => [catalog.selectedBookId, catalog.selectedChapterId],
  () => {
    syncChapterContent()
  },
  { immediate: true }
)

// Audio event handlers
function onTimeUpdate() {
  if (!audioRef.value) return
  player.currentTime = audioRef.value.currentTime
  subtitleStore.updateActiveCue(audioRef.value.currentTime)

  // Track elapsed listening playback in analytics store (~15s threshold)
  if (Math.abs(audioRef.value.currentTime - lastTrackedTime) >= 15) {
    if (sessionStore.currentStep !== 1) {
      analyticsStore.recordListening(15)
      gamificationStore.checkInDaily()
      gamificationStore.checkAndUnlockBadges({
        listeningSeconds: analyticsStore.totalListeningSeconds,
        streakDays: gamificationStore.streakDays
      })
    }
    lastTrackedTime = audioRef.value.currentTime
  }
}

function onDurationChange() {
  if (!audioRef.value) return
  player.duration = audioRef.value.duration || 0
}

function onAudioWaiting() {
  player.setBuffering(true)
}

function onAudioCanPlay() {
  player.setBuffering(false)
  player.setAudioLoading(false)
}

function onAudioPlaying() {
  player.setBuffering(false)
  player.setAudioLoading(false)
}

function onAudioEnded() {
  if (catalog.selectedChapterId) {
    analyticsStore.markChapterComplete(catalog.selectedChapterId)
  }

  // If Sleep Timer is set to "end_of_chapter", stop here
  if (player.handleChapterEndSleepTimer()) {
    return
  }

  // Automatically advance to next chapter if available
  const book = catalog.currentBook
  if (book && book.chapters) {
    const curIdx = book.chapters.findIndex((c) => c.id === catalog.selectedChapterId)
    if (curIdx >= 0 && curIdx + 1 < book.chapters.length) {
      const nextCh = book.chapters[curIdx + 1]
      catalog.selectChapter(nextCh.id)
      player.switchChapter(book.id, nextCh.id)
      player.play()
      return
    }
  }
  player.pause()
}

function onAudioError(e) {
  console.warn('[App Audio] Stream loading notice, triggering fallback:', e)
  player.setBuffering(false)
  player.setAudioLoading(false)

  if (activeAudioSrc.value !== SAMPLE_AUDIO_URL) {
    player.setOfflineFallback(true)
    player.setAudioError('原版音频流加载受阻，已启用纯享磨耳朵备用音频通道')
    activeAudioSrc.value = SAMPLE_AUDIO_URL
  } else {
    player.pause()
  }
}

function onDictationNext() {
  subtitleStore.jumpToNextCue()
  const next = subtitleStore.currentCue
  if (next) {
    player.seek(next.start)
  }
}

// Reactivity watchers linking Pinia state to HTMLAudioElement
watch(
  () => player.isPlaying,
  (shouldPlay) => {
    if (!audioRef.value) return
    if (shouldPlay) {
      audioRef.value.play().catch((err) => {
        console.warn('[App Audio] Play prevented by browser autoplay policy:', err)
        player.pause()
      })
    } else {
      audioRef.value.pause()
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = shouldPlay ? 'playing' : 'paused'
    }
  }
)

watch(
  () => player.seekTimestamp,
  () => {
    if (audioRef.value) {
      audioRef.value.currentTime = player.currentTime
    }
  }
)

watch(
  () => player.currentTime,
  (newTime) => {
    if (!audioRef.value) return
    if (Math.abs(audioRef.value.currentTime - newTime) > 0.6) {
      audioRef.value.currentTime = newTime
    }
    if (
      typeof navigator !== 'undefined' &&
      'mediaSession' in navigator &&
      'setPositionState' in navigator.mediaSession &&
      player.duration > 0 &&
      Number.isFinite(player.duration) &&
      Number.isFinite(newTime)
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(player.duration, 0),
          playbackRate: player.playbackRate || 1.0,
          position: Math.min(Math.max(newTime, 0), player.duration)
        })
      } catch (_) {}
    }
  }
)

watch(
  () => player.playbackRate,
  (newRate) => {
    if (!audioRef.value) return
    audioRef.value.playbackRate = newRate
  }
)

watch(
  () => player.volume,
  (vol) => {
    if (!audioRef.value) return
    audioRef.value.volume = Math.max(0, Math.min(1, vol))
  },
  { immediate: true }
)

// W3C MediaSession setup for lock screen & headphones controls
function setupMediaSession() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
  try {
    if (window.MediaMetadata) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentChapterLabel.value,
        artist: `${catalog.currentBook?.title || 'Harry Potter'} · J.K. Rowling`,
        album: 'Hogwarts Audio · 原版沉浸精听',
        artwork: [
          { src: '/icon.svg', sizes: '192x192', type: 'image/svg+xml' }
        ]
      })
    }
    navigator.mediaSession.setActionHandler('play', () => player.play())
    navigator.mediaSession.setActionHandler('pause', () => player.pause())
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const offset = details.seekOffset || 5
      player.seek(player.currentTime - offset)
    })
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const offset = details.seekOffset || 5
      player.seek(player.currentTime + offset)
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      subtitleStore.jumpToPrevCue()
      if (subtitleStore.currentCue) player.seek(subtitleStore.currentCue.start)
    })
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      subtitleStore.jumpToNextCue()
      if (subtitleStore.currentCue) player.seek(subtitleStore.currentCue.start)
    })
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) player.seek(details.seekTime)
    })
  } catch (err) {
    console.warn('[MediaSession] Setup error:', err)
  }
}

// Keyboard shortcuts (Space: Play/Pause, ArrowLeft/Right: Seek 5s)
function onKeyDown(e) {
  const targetTag = e.target?.tagName?.toLowerCase()
  if (targetTag === 'input' || targetTag === 'textarea') return

  if (e.code === 'Space') {
    e.preventDefault()
    player.togglePlay()
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault()
    player.seek(player.currentTime - 5)
  } else if (e.code === 'ArrowRight') {
    e.preventDefault()
    player.seek(player.currentTime + 5)
  } else if (e.key === '?') {
    isShortcutsOpen.value = true
  }
}

onMounted(() => {
  setupMediaSession()
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl)
    currentBlobUrl = null
  }
})
</script>
