<template>
  <div class="h-full w-full flex flex-col bg-[#f8f8f6] text-[#18181b] overflow-hidden select-none font-sans">
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

    <!-- Top Navigation Bar (03 极简书房) -->
    <header
      class="h-14 shrink-0 bg-white border-b border-[#e4e4e7] px-4 sm:px-6 flex items-center justify-between z-20 gap-2"
      role="banner"
    >
      <!-- Brand & Title -->
      <div class="flex items-center gap-2.5 shrink-0 min-w-0">
        <div class="w-8 h-8 rounded-lg bg-[#18181b] text-white flex items-center justify-center shrink-0">
          <Sparkles class="w-4 h-4 text-white" />
        </div>
        <div class="min-w-0">
          <h1 class="font-serif text-sm sm:text-base font-bold text-[#18181b] leading-none truncate">
            Hogwarts Audio
          </h1>
          <p class="text-[10px] text-[#71717a] font-mono mt-0.5 hidden sm:block truncate">
            03 极简书房 · 原版沉浸精听
          </p>
        </div>
      </div>

      <!-- Center: Current Chapter Selector (Opens Bookshelf Drawer) -->
      <button
        type="button"
        @click="player.toggleBookshelf(true)"
        class="min-h-[44px] max-w-[200px] sm:max-w-[320px] px-3.5 py-1.5 bg-[#f8f8f6] hover:bg-[#f4f4f5] border border-[#e4e4e7] rounded-full flex items-center gap-2 text-xs font-serif font-medium text-[#18181b] transition-colors active:scale-95 truncate shrink cursor-pointer"
        aria-label="打开书架选择章节"
      >
        <BookOpen class="w-4 h-4 text-[#2563eb] shrink-0" />
        <span class="truncate">{{ currentChapterLabel }}</span>
        <ChevronDown class="w-3.5 h-3.5 text-[#71717a] shrink-0" />
      </button>

      <!-- Right: Utility Tools -->
      <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <!-- Vocabulary Notebook Drawer -->
        <button
          type="button"
          @click="isVocabOpen = true"
          class="relative min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors cursor-pointer"
          title="生词本"
          aria-label="打开生词本"
        >
          <BookMarked class="w-5 h-5" />
          <span
            v-if="vocabStore.vocabList.length > 0"
            class="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#2563eb] text-white text-[10px] font-mono flex items-center justify-center pointer-events-none"
          >{{ vocabStore.vocabList.length }}</span>
        </button>

        <!-- Analytics Dashboard -->
        <button
          type="button"
          @click="isAnalyticsOpen = true"
          class="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors cursor-pointer"
          title="学业分析仪表盘"
          aria-label="学业分析仪表盘"
        >
          <BarChart2 class="w-5 h-5" />
        </button>

        <!-- Offline Storage Bag -->
        <button
          type="button"
          @click="isStorageOpen = true"
          class="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors cursor-pointer"
          title="离线行囊"
          aria-label="离线行囊"
        >
          <HardDrive class="w-5 h-5" />
        </button>

        <!-- Shortcuts Help -->
        <button
          type="button"
          @click="isShortcutsOpen = true"
          class="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors hidden sm:flex cursor-pointer"
          title="快捷键与指南"
          aria-label="快捷键指南"
        >
          <HelpCircle class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- Step Flow Navigation Bar -->
    <StepTabBar />

    <!-- Global Notice Banner (e.g. Offline fallback notice) -->
    <div
      v-if="player.audioError"
      class="mx-3 sm:mx-4 mt-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-800 shrink-0 transition-all z-10"
      role="alert"
    >
      <div class="flex items-center gap-2 min-w-0">
        <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
        <span class="truncate">{{ player.audioError }}</span>
      </div>
      <button
        type="button"
        @click="player.setAudioError(null)"
        class="p-1 rounded-lg text-rose-800 hover:bg-rose-100 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
        aria-label="关闭提示"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Main Content Area: Dynamic 4-Step Session Stage View -->
    <main class="flex-1 min-h-0 flex flex-col overflow-hidden relative" role="main">
      <MagicErrorBoundary>
        <StepListening v-if="sessionStore.currentStep === 1" />
        <StepShadowing v-else-if="sessionStore.currentStep === 2" />
        <StepDictation v-else-if="sessionStore.currentStep === 3" />
        <StepVocabReview v-else-if="sessionStore.currentStep === 4" />
      </MagicErrorBoundary>
    </main>

    <!-- Bottom Audio Player Scrubber -->
    <SmartAudioPlayer />

    <!-- Bookshelf Drawer -->
    <BookshelfDrawer />

    <!-- A/B Shadowing Recorder Modal -->
    <ShadowingRecorder
      :is-open="isShadowingOpen"
      :current-cue="subtitleStore.currentCue"
      @close="isShadowingOpen = false"
    />

    <!-- Dictation Studio Modal -->
    <DictationStudio
      :is-open="isDictationOpen"
      :current-cue="subtitleStore.currentCue"
      @close="isDictationOpen = false"
      @next="onDictationNext"
    />

    <!-- Ebbinghaus 5-Box Vocabulary Drawer -->
    <VocabularyDrawer
      :is-open="isVocabOpen"
      @close="isVocabOpen = false"
    />

    <!-- Magic Analytics Dashboard Modal -->
    <AnalyticsDashboard
      :is-open="isAnalyticsOpen"
      @close="isAnalyticsOpen = false"
    />

    <!-- Offline Storage Modal -->
    <StorageManagerModal
      :is-open="isStorageOpen"
      @close="isStorageOpen = false"
    />

    <!-- Shortcuts Guide Modal -->
    <ShortcutsModal
      :is-open="isShortcutsOpen"
      @close="isShortcutsOpen = false"
    />
  </div>
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
import { useSessionStore } from './stores/sessionStore.js'
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
    analyticsStore.recordListening(15)
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
