<template>
  <div class="h-full w-full flex flex-col bg-[#fbf9f5] text-[#1e1610] overflow-hidden select-none">
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

    <!-- Top Navigation Bar (Responsive & Apple HIG Ergonomics) -->
    <header
      class="h-16 shrink-0 bg-[#fbf9f5]/90 backdrop-blur-md border-b border-[#e8ddd0] px-3 sm:px-4 flex items-center justify-between z-20 gap-1.5 sm:gap-2"
      role="banner"
    >
      <!-- Brand & Title -->
      <div class="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
        <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center text-[#d97706] shrink-0">
          <Sparkles class="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div class="min-w-0">
          <h1 class="font-serif text-xs sm:text-base font-bold text-[#1e1610] leading-none truncate">
            Hogwarts Audio
          </h1>
          <p class="text-[9px] sm:text-[10px] text-[#78695d] font-mono mt-0.5 hidden sm:block truncate">
            Vue 3 · 原版沉浸精听
          </p>
        </div>
      </div>

      <!-- Center: Current Chapter Capsule (Click to open Bookshelf) -->
      <button
        type="button"
        @click="player.toggleBookshelf(true)"
        class="min-h-[44px] max-w-[140px] sm:max-w-[260px] px-2.5 sm:px-3.5 py-1.5 bg-[#f4ebe1] hover:bg-[#ebdccb] border border-[#e8ddd0] rounded-full flex items-center gap-1.5 sm:gap-2 text-xs font-serif font-medium text-[#1e1610] transition-colors active:scale-95 truncate shrink"
        aria-label="打开书架选择章节"
      >
        <BookOpen class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d97706] shrink-0" />
        <span class="truncate">{{ currentChapterLabel }}</span>
      </button>

      <!-- Right Desktop (md:flex): Full 7 Action Buttons -->
      <div class="hidden md:flex items-center gap-1 sm:gap-2 shrink-0">
        <!-- 1. A/B Shadowing Recorder -->
        <button
          type="button"
          @click="isShadowingOpen = true"
          class="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors"
          title="A/B 影子跟读工坊"
          aria-label="影子跟读工坊"
        >
          <Mic class="w-5 h-5" />
        </button>

        <!-- 2. Dictation Studio -->
        <button
          type="button"
          @click="isDictationOpen = true"
          class="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors"
          title="拼写听写工坊"
          aria-label="拼写听写工坊"
        >
          <PenTool class="w-5 h-5" />
        </button>

        <!-- 3. Vocabulary Drawer (Leitner 5-box & Anki/PDF) -->
        <button
          type="button"
          @click="isVocabOpen = true"
          class="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors"
          title="艾宾浩斯生词本"
          aria-label="艾宾浩斯生词本"
        >
          <BookMarked class="w-5 h-5" />
        </button>

        <!-- 4. Analytics Dashboard -->
        <button
          type="button"
          @click="isAnalyticsOpen = true"
          class="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors"
          title="学业分析仪表盘"
          aria-label="学业分析仪表盘"
        >
          <BarChart2 class="w-5 h-5" />
        </button>

        <!-- 5. Offline Storage Bag -->
        <button
          type="button"
          @click="isStorageOpen = true"
          class="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors"
          title="离线行囊"
          aria-label="离线行囊"
        >
          <HardDrive class="w-5 h-5" />
        </button>

        <!-- 6. Shortcuts Help -->
        <button
          type="button"
          @click="isShortcutsOpen = true"
          class="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors"
          title="快捷键与指南"
          aria-label="快捷键指南"
        >
          <HelpCircle class="w-5 h-5" />
        </button>

        <!-- 7. Bookshelf Drawer Toggle Button -->
        <button
          type="button"
          @click="player.toggleBookshelf(true)"
          class="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-[#d97706]/10 hover:bg-[#d97706]/20 text-[#d97706] border border-[#d97706]/30 flex items-center justify-center transition-colors active:scale-95"
          aria-label="打开书架抽屉"
        >
          <Library class="w-5 h-5" />
        </button>
      </div>

      <!-- Right Mobile (md:hidden): Compact Ergonomic Tools + More Menu -->
      <div class="flex md:hidden items-center gap-1 shrink-0 relative">
        <!-- 1. A/B Shadowing Recorder -->
        <button
          type="button"
          @click="isShadowingOpen = true"
          class="min-h-[44px] min-w-[44px] p-2 rounded-xl text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors active:scale-95"
          title="A/B 影子跟读工坊"
          aria-label="影子跟读工坊"
        >
          <Mic class="w-5 h-5" />
        </button>

        <!-- 2. Vocabulary Drawer -->
        <button
          type="button"
          @click="isVocabOpen = true"
          class="min-h-[44px] min-w-[44px] p-2 rounded-xl text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors active:scale-95"
          title="艾宾浩斯生词本"
          aria-label="艾宾浩斯生词本"
        >
          <BookMarked class="w-5 h-5" />
        </button>

        <!-- 3. More Tools Menu -->
        <button
          type="button"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="min-h-[44px] min-w-[44px] p-2 rounded-xl text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors active:scale-95"
          title="更多魔法工具"
          aria-label="更多魔法工具"
        >
          <MoreVertical class="w-5 h-5" />
        </button>

        <!-- Mobile More Menu Dropdown -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div
            v-if="isMobileMenuOpen"
            class="absolute right-0 top-12 z-50 w-52 bg-[#fbf9f5] border border-[#e8ddd0] rounded-2xl p-2 space-y-1"
          >
            <button
              type="button"
              @click="isDictationOpen = true; isMobileMenuOpen = false"
              class="w-full min-h-[44px] px-3 rounded-xl flex items-center gap-2.5 text-xs text-[#1e1610] hover:bg-[#f4ebe1] transition-colors"
            >
              <PenTool class="w-4 h-4 text-[#d97706]" />
              <span>拼写听写工坊</span>
            </button>
            <button
              type="button"
              @click="isAnalyticsOpen = true; isMobileMenuOpen = false"
              class="w-full min-h-[44px] px-3 rounded-xl flex items-center gap-2.5 text-xs text-[#1e1610] hover:bg-[#f4ebe1] transition-colors"
            >
              <BarChart2 class="w-4 h-4 text-[#d97706]" />
              <span>学业分析仪表盘</span>
            </button>
            <button
              type="button"
              @click="isStorageOpen = true; isMobileMenuOpen = false"
              class="w-full min-h-[44px] px-3 rounded-xl flex items-center gap-2.5 text-xs text-[#1e1610] hover:bg-[#f4ebe1] transition-colors"
            >
              <HardDrive class="w-4 h-4 text-[#d97706]" />
              <span>离线魔法行囊</span>
            </button>
            <button
              type="button"
              @click="isShortcutsOpen = true; isMobileMenuOpen = false"
              class="w-full min-h-[44px] px-3 rounded-xl flex items-center gap-2.5 text-xs text-[#1e1610] hover:bg-[#f4ebe1] transition-colors"
            >
              <HelpCircle class="w-4 h-4 text-[#d97706]" />
              <span>快捷手势指南</span>
            </button>
            <button
              type="button"
              @click="player.toggleBookshelf(true); isMobileMenuOpen = false"
              class="w-full min-h-[44px] px-3 rounded-xl flex items-center gap-2.5 text-xs text-[#1e1610] hover:bg-[#f4ebe1] transition-colors border-t border-[#e8ddd0] pt-1"
            >
              <Library class="w-4 h-4 text-[#d97706]" />
              <span>打开魔法书架</span>
            </button>
          </div>
        </Transition>
      </div>
    </header>

    <!-- Global Notice Banner (e.g. Offline fallback notice) -->
    <div
      v-if="player.audioError"
      class="mx-3 sm:mx-4 mt-2 px-3 py-1.5 bg-amber-50/95 border border-amber-300/80 rounded-xl flex items-center justify-between text-xs text-[#92400e] shadow-sm shrink-0 transition-all z-10"
      role="alert"
    >
      <div class="flex items-center gap-2 min-w-0">
        <AlertCircle class="w-4 h-4 text-[#d97706] shrink-0" />
        <span class="truncate">{{ player.audioError }}</span>
      </div>
      <button
        type="button"
        @click="player.setAudioError(null)"
        class="p-1 rounded-lg text-[#92400e] hover:bg-amber-100/80 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
        aria-label="关闭提示"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Main Content Area: Split-Pane Workbench (方案 B: 55% 字幕流 + 45% 交互工作台) -->
    <main class="flex-1 flex flex-col md:flex-row overflow-hidden relative" role="main">
      <!-- Left Column: Full Chapter Subtitle Stream (55%) -->
      <section class="flex-1 md:flex-[1.15] flex flex-col overflow-hidden min-w-0">
        <MagicErrorBoundary>
          <SubtitleViewer />
        </MagicErrorBoundary>
      </section>

      <!-- Right Column: Permanent Interactive Training Studio Workbench (45%) -->
      <section class="hidden md:flex md:flex-[0.85] overflow-hidden bg-[#f8f8f6]/60 border-l border-[#e4e4e7]">
        <StudioWorkbench />
      </section>
    </main>

    <!-- Bottom Audio Player Scrubber -->
    <AudioPlayer />

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
import { parseVTT } from './utils/vttParser.js'
import { getCachedChapter } from './utils/offlineStorage.js'
import { SAMPLE_CHAPTER_1_VTT, SAMPLE_AUDIO_URL } from './data/chapters.js'
import AudioPlayer from './components/AudioPlayer.vue'
import SubtitleViewer from './components/SubtitleViewer.vue'
import StudioWorkbench from './components/StudioWorkbench.vue'
import BookshelfDrawer from './components/BookshelfDrawer.vue'
import ShadowingRecorder from './components/ShadowingRecorder.vue'
import DictationStudio from './components/DictationStudio.vue'
import VocabularyDrawer from './components/VocabularyDrawer.vue'
import AnalyticsDashboard from './components/AnalyticsDashboard.vue'
import StorageManagerModal from './components/StorageManagerModal.vue'
import ShortcutsModal from './components/ShortcutsModal.vue'
import MagicErrorBoundary from './components/common/MagicErrorBoundary.vue'
import {
  Sparkles,
  BookOpen,
  Mic,
  PenTool,
  BookMarked,
  BarChart2,
  HardDrive,
  HelpCircle,
  Library,
  MoreVertical,
  AlertCircle,
  X
} from 'lucide-vue-next'

const player = usePlayerStore()
const subtitleStore = useSubtitleStore()
const catalog = useCatalogStore()
const analyticsStore = useAnalyticsStore()

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
