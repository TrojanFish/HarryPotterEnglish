<template>
  <div class="h-screen flex flex-col bg-[#fbf9f5] text-[#1e1610] overflow-hidden select-none">
    <!-- Hidden native audio element managed via shallowRef -->
    <audio
      ref="audioRef"
      :src="audioSource"
      preload="metadata"
      @timeupdate="onTimeUpdate"
      @durationchange="onDurationChange"
      @play="player.play()"
      @pause="player.pause()"
      @ended="onAudioEnded"
      @error="onAudioError"
      class="hidden"
    ></audio>

    <!-- Top Navigation Bar -->
    <header
      class="h-16 shrink-0 bg-[#fbf9f5]/90 backdrop-blur-md border-b border-[#e8ddd0] px-4 flex items-center justify-between z-20"
      role="banner"
    >
      <!-- Brand & Title -->
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center text-[#d97706]">
          <Sparkles class="w-5 h-5" />
        </div>
        <div>
          <h1 class="font-serif text-sm sm:text-base font-bold text-[#1e1610] leading-none">
            Hogwarts Audio
          </h1>
          <p class="text-[10px] text-[#78695d] font-mono mt-0.5">
            Vue 3 · 原版沉浸精听
          </p>
        </div>
      </div>

      <!-- Center: Current Chapter Capsule (Click to open Bookshelf) -->
      <button
        type="button"
        @click="player.toggleBookshelf(true)"
        class="min-h-[44px] px-3.5 py-1.5 bg-[#f4ebe1] hover:bg-[#ebdccb] border border-[#e8ddd0] rounded-full flex items-center gap-2 text-xs font-serif font-medium text-[#1e1610] transition-colors active:scale-95"
        aria-label="打开书架选择章节"
      >
        <BookOpen class="w-4 h-4 text-[#d97706]" />
        <span>{{ currentChapterLabel }}</span>
      </button>

      <!-- Right: Navigation Action Buttons (>= 44px) -->
      <div class="flex items-center gap-1 sm:gap-2">
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
    </header>

    <!-- Main Content Area: Subtitle Viewer protected by Error Boundary -->
    <main class="flex-1 flex flex-col overflow-hidden relative" role="main">
      <MagicErrorBoundary>
        <SubtitleViewer />
      </MagicErrorBoundary>
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
import { parseVTT } from './utils/vttParser.js'
import { SAMPLE_CHAPTER_1_VTT, SAMPLE_AUDIO_URL } from './data/chapters.js'
import AudioPlayer from './components/AudioPlayer.vue'
import SubtitleViewer from './components/SubtitleViewer.vue'
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
  Library
} from 'lucide-vue-next'

const player = usePlayerStore()
const subtitleStore = useSubtitleStore()

// Native HTMLAudioElement held in shallowRef to avoid Proxy traps
const audioRef = shallowRef(null)

// Interactive modal/drawer states
const isShadowingOpen = ref(false)
const isDictationOpen = ref(false)
const isVocabOpen = ref(false)
const isAnalyticsOpen = ref(false)
const isStorageOpen = ref(false)
const isShortcutsOpen = ref(false)

// Current Chapter Display Label
const currentChapterLabel = computed(() => {
  const ch = player.currentChapterId || 'hp1-01'
  return `HP1 · ${ch}`
})

// Audio streaming source (uses local sample audio or R2 stream)
const audioSource = computed(() => {
  return SAMPLE_AUDIO_URL
})

// Audio event handlers
function onTimeUpdate() {
  if (!audioRef.value) return
  player.currentTime = audioRef.value.currentTime
  subtitleStore.updateActiveCue(audioRef.value.currentTime)
}

function onDurationChange() {
  if (!audioRef.value) return
  player.duration = audioRef.value.duration || 0
}

function onAudioEnded() {
  player.pause()
}

function onAudioError(e) {
  console.warn('[App Audio] Audio loading warning, audio element triggered error:', e)
  player.pause()
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
  }
)

watch(
  () => player.currentTime,
  (newTime) => {
    if (!audioRef.value) return
    if (Math.abs(audioRef.value.currentTime - newTime) > 0.6) {
      audioRef.value.currentTime = newTime
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
  // Load sample VTT on start
  if (SAMPLE_CHAPTER_1_VTT) {
    const parsed = parseVTT(SAMPLE_CHAPTER_1_VTT)
    subtitleStore.setCues(parsed)
  }

  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>
