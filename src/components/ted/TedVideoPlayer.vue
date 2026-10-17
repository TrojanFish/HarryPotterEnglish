<template>
  <div
    ref="playerContainerRef"
    class="flex flex-col md:flex-row h-full w-full bg-[#fbf9f5] overflow-hidden select-none"
  >
    <!-- Left panel: Video + Controls + Mobile Subtitle Flow -->
    <div class="flex-[3] flex flex-col min-w-0 h-full bg-stone-950/95 relative overflow-hidden">
      <!-- Video Container with 16:9 Aspect Ratio and Floating Hover Controls -->
      <div class="relative w-full aspect-video bg-black flex items-center justify-center shrink-0 group">
        <video
          ref="videoRef"
          :src="tedStore.videoSrc"
          @click="togglePlay"
          @dblclick="toggleFullscreen"
          @timeupdate="onTimeUpdate"
          @loadedmetadata="onMetadata"
          @play="tedStore.setIsVideoPlaying(true)"
          @pause="tedStore.setIsVideoPlaying(false)"
          @ended="onEnded"
          preload="metadata"
          playsinline
          class="w-full aspect-video bg-black object-contain cursor-pointer"
        ></video>

        <!-- Loop Sentinel Badge Overlay when Looping -->
        <div
          v-if="tedStore.loopCueIndex !== null && !tedStore.isBlindMode"
          class="absolute top-3 left-3 bg-[#1e1610]/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 z-10"
        >
          <Repeat class="w-3.5 h-3.5 animate-spin-slow text-amber-400" aria-hidden="true" />
          <span>单句循环模式中</span>
          <button
            type="button"
            @click.stop="clearLoop"
            class="ml-1 text-amber-200 hover:text-white text-[11px] underline min-h-[44px] min-w-[44px] inline-flex items-center justify-center touch-manipulation cursor-pointer"
            aria-label="取消循环"
          >
            取消
          </button>
        </div>

        <!-- Floating On-Video Quick Controls (Visible on hover, disappears during playback) -->
        <div
          v-if="!tedStore.isBlindMode"
          class="absolute bottom-2 inset-x-3 py-1.5 px-3 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 flex items-center justify-between text-xs text-amber-100 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto"
        >
          <div class="flex items-center gap-1">
            <button
              type="button"
              @click.stop="skip(-5)"
              class="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-white/10 text-amber-200 active:scale-95 transition-all touch-manipulation cursor-pointer"
              aria-label="后退5秒"
            >
              <SkipBack class="w-4 h-4 stroke-[2]" aria-hidden="true" />
            </button>
            <button
              type="button"
              @click.stop="togglePlay"
              class="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-white/10 text-amber-300 font-bold active:scale-95 transition-all touch-manipulation cursor-pointer"
              :aria-label="tedStore.isVideoPlaying ? '暂停视频' : '播放视频'"
            >
              <Pause v-if="tedStore.isVideoPlaying" class="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
              <Play v-else class="w-4 h-4 stroke-[2.2] ml-0.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              @click.stop="skip(5)"
              class="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-white/10 text-amber-200 active:scale-95 transition-all touch-manipulation cursor-pointer"
              aria-label="快进5秒"
            >
              <SkipForward class="w-4 h-4 stroke-[2]" aria-hidden="true" />
            </button>
          </div>

          <div class="flex items-center gap-1.5">
            <select
              :value="playbackRate"
              @change="onChangeSpeed"
              class="min-h-[44px] bg-black/60 text-amber-200 border border-amber-900/60 rounded-xl px-2 text-xs font-mono font-bold hover:bg-[#34261e] focus:outline-none cursor-pointer transition-colors touch-manipulation"
              aria-label="播放倍速"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>

            <button
              type="button"
              @click.stop="cycleSubtitleMode"
              class="min-h-[44px] px-2.5 rounded-xl flex items-center justify-center gap-1.5 bg-black/50 hover:bg-white/10 text-amber-200 transition-all touch-manipulation cursor-pointer"
              :aria-label="`切换字幕模式：当前为${currentSubtitleModeLabel}`"
            >
              <Subtitles class="w-4 h-4 stroke-[2]" aria-hidden="true" />
              <span class="text-xs font-mono font-bold">{{ currentSubtitleModeLabel }}</span>
            </button>

            <button
              type="button"
              @click.stop="toggleFullscreen"
              class="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-amber-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all touch-manipulation cursor-pointer"
              :aria-label="isFullscreen ? '退出全屏' : '全屏显示'"
            >
              <Minimize v-if="isFullscreen" class="w-4 h-4 stroke-[2]" aria-hidden="true" />
              <Maximize v-else class="w-4 h-4 stroke-[2]" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Immersive Blind Mode Frosted Glass Overlay on Video Container -->
        <div
          v-if="tedStore.isBlindMode"
          class="absolute inset-0 backdrop-blur-md bg-stone-950/85 z-20 flex flex-col items-center justify-center text-center p-4 transition-all select-none"
        >
          <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 mb-3">
            <Headphones class="w-6 h-6 stroke-[2]" aria-hidden="true" />
          </div>
          <p class="text-base font-bold text-amber-100">盲听沉浸模式 · 专注纯正听感</p>
          <p class="text-xs text-stone-400 mt-1 max-w-xs leading-relaxed">
            遮蔽画面与字幕，激发纯正语感
          </p>
          <button
            type="button"
            @click="toggleBlindMode"
            class="mt-4 min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer touch-manipulation shadow-none"
            aria-label="退出盲听模式"
          >
            <Eye class="w-4 h-4 stroke-[2]" aria-hidden="true" />
            <span>退出盲听</span>
          </button>
        </div>
      </div>

      <!-- Mobile In-Flow Subtitle Stream (Visible only on smaller screens) -->
      <div class="md:hidden flex-1 overflow-y-auto p-4 bg-[#fbf9f5] border-t border-[#e8ddd0]">
        <!-- Mobile Subtitle Header with Speaker Badge -->
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#e8ddd0]/80">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-lg">
            <Mic class="w-3.5 h-3.5 text-amber-800 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ currentSpeaker }}</span>
          </div>
          <span class="text-xs font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
            {{ enCues.length }} 句
          </span>
        </div>

        <!-- Blind mode overlay for mobile -->
        <div
          v-if="tedStore.isBlindMode"
          class="flex flex-col items-center justify-center py-8 text-center"
        >
          <EyeOff class="w-8 h-8 text-stone-400 mb-2" aria-hidden="true" />
          <p class="text-sm font-bold text-amber-950">盲听专注模式已开启</p>
          <p class="text-xs text-stone-500 mt-1">字幕已隐去，点击底部眼睛图标显现</p>
        </div>

        <!-- Subtitle Off State for mobile -->
        <div
          v-else-if="subtitleMode === 'off'"
          class="flex flex-col items-center justify-center py-8 text-center text-stone-400"
        >
          <Subtitles class="w-8 h-8 text-stone-300 mb-2 stroke-[1.5]" aria-hidden="true" />
          <p class="text-sm font-medium text-amber-950">字幕已关闭</p>
          <p class="text-xs text-stone-400 mt-1">点击底部字幕按钮即可切换模式</p>
        </div>

        <!-- Mobile Cue List -->
        <div v-else class="space-y-3">
          <div
            v-for="(cue, i) in enCues"
            :key="cue.id ?? i"
            @click="setLoopCue(i)"
            class="p-3 rounded-xl transition-all border cursor-pointer"
            :class="[
              tedStore.activeCueIndex === i
                ? 'border-l-4 border-amber-400 bg-amber-500/10'
                : 'border-transparent opacity-40 hover:opacity-80'
            ]"
          >
            <p
              v-if="subtitleMode === 'bilingual' || subtitleMode === 'en'"
              class="text-lg leading-[1.75] font-reading text-amber-950"
            >
              <template v-for="(token, tIdx) in tokenizeSentence(cue.text)" :key="tIdx">
                <span
                  v-if="token.isWord"
                  @click.stop="handleWordClick(token.text, cue.text)"
                  class="cursor-pointer hover:underline hover:text-amber-700 active:text-amber-800 transition-colors inline word-token"
                >{{ token.text }}</span>
                <span v-else>{{ token.text }}</span>
              </template>
            </p>
            <p
              v-if="(subtitleMode === 'bilingual' || subtitleMode === 'zh') && !tedStore.isBlindMode"
              class="text-sm text-stone-500 mt-1"
            >
              {{ getZhText(i, cue) }}
            </p>
          </div>
        </div>

        <!-- Mobile 前往任务 CTA -->
        <div class="pt-4 pb-2">
          <button
            type="button"
            @click="goToStep(3)"
            class="w-full min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-none touch-manipulation"
            aria-label="前往任务演练"
          >
            <span>前往任务</span>
            <ArrowRight class="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <!-- Right panel subtitle list (Desktop and Tablet): hidden md:flex flex-col w-72 lg:w-80 shrink-0 overflow-y-auto border-l border-[#e8ddd0] -->
    <div
      ref="subtitleListContainerRef"
      class="hidden md:flex flex-col w-72 lg:w-80 shrink-0 overflow-y-auto border-l border-[#e8ddd0] bg-[#fbf9f5] relative"
    >
      <!-- Subtitle Panel Header -->
      <div class="p-3 border-b border-[#e8ddd0]/80 bg-[#fbf9f5] flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm gap-2">
        <div class="min-w-0">
          <h3 class="text-xs font-bold text-amber-950 uppercase tracking-wider">双语对齐字幕</h3>
          <p class="text-[11px] text-stone-500">点击句子循环 · 点击单词查词</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-lg">
            <Mic class="w-3.5 h-3.5 text-amber-800 shrink-0" aria-hidden="true" />
            <span class="truncate max-w-[120px]">{{ currentSpeaker }}</span>
          </div>
          <span class="text-xs font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
            {{ enCues.length }} 句
          </span>
        </div>
      </div>

      <!-- Blind Mode Overlay for Desktop Subtitle Panel: v-if="isBlindMode" covering subtitle panel with bg-[#fbf9f5]/95 backdrop-blur-sm -->
      <div
        v-if="tedStore.isBlindMode"
        class="absolute inset-0 bg-[#fbf9f5]/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center select-none"
      >
        <div class="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 mb-3">
          <EyeOff class="w-6 h-6 stroke-[2]" aria-hidden="true" />
        </div>
        <p class="text-base font-bold text-amber-950">盲听专注模式已开启</p>
        <p class="text-xs text-stone-500 mt-1 max-w-xs leading-relaxed">
          字幕已隐去，锻炼纯正听感。随时点击下方按钮退出盲听。
        </p>
        <button
          type="button"
          @click="toggleBlindMode"
          class="mt-4 min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer touch-manipulation shadow-none"
        >
          <Eye class="w-4 h-4" aria-hidden="true" />
          <span>显现字幕</span>
        </button>
      </div>

      <!-- Empty state when no cues loaded -->
      <div
        v-if="!enCues || enCues.length === 0"
        class="flex-1 flex flex-col items-center justify-center p-6 text-center text-stone-400"
      >
        <p class="text-xs font-medium">字幕解析中或暂无字幕</p>
      </div>

      <!-- Subtitle Off state in desktop panel -->
      <div
        v-else-if="subtitleMode === 'off'"
        class="flex-1 flex flex-col items-center justify-center p-6 text-center text-stone-400"
      >
        <Subtitles class="w-8 h-8 text-stone-300 mb-2 stroke-[1.5]" aria-hidden="true" />
        <p class="text-sm font-medium text-amber-950">字幕已关闭</p>
        <p class="text-xs text-stone-400 mt-1">点击底部字幕按钮即可切换模式</p>
      </div>

      <!-- Subtitle Cue Items -->
      <div v-else class="flex-1 p-3 space-y-2.5">
        <div
          v-for="(cue, i) in enCues"
          :key="cue.id ?? i"
          :ref="(el) => setCueRef(el, i)"
          @click="setLoopCue(i)"
          class="p-3 rounded-xl transition-all border cursor-pointer select-text"
          :class="[
            tedStore.activeCueIndex === i
              ? 'border-l-4 border-amber-400 bg-amber-500/10 opacity-100'
              : 'border-transparent opacity-40 hover:opacity-80'
          ]"
        >
          <!-- Cue header: timestamp & loop active tag -->
          <div class="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1 select-none">
            <span>{{ formatTime(cue.startTime) }} - {{ formatTime(cue.endTime) }}</span>
            <span
              v-if="tedStore.loopCueIndex === i"
              class="flex items-center gap-1 text-[10px] font-sans font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300"
            >
              <Repeat class="w-3 h-3 text-amber-700" aria-hidden="true" />
              <span>循环中</span>
            </span>
          </div>

          <!-- English Subtitle: text-lg leading-[1.75] (K12 typography standard) -->
          <p
            v-if="subtitleMode === 'bilingual' || subtitleMode === 'en'"
            class="text-lg leading-[1.75] font-reading text-amber-950"
          >
            <template v-for="(token, tIdx) in tokenizeSentence(cue.text)" :key="tIdx">
              <span
                v-if="token.isWord"
                @click.stop="handleWordClick(token.text, cue.text)"
                class="cursor-pointer hover:underline hover:text-amber-700 active:text-amber-800 transition-colors inline word-token"
              >{{ token.text }}</span>
              <span v-else>{{ token.text }}</span>
            </template>
          </p>

          <!-- Chinese Subtitle: text-sm text-stone-500 mt-1 shown only when (subtitleMode === 'bilingual' || subtitleMode === 'zh') && !isBlindMode -->
          <p
            v-if="(subtitleMode === 'bilingual' || subtitleMode === 'zh') && !tedStore.isBlindMode"
            class="text-sm text-stone-500 mt-1 leading-normal"
          >
            {{ getZhText(i, cue) }}
          </p>
        </div>
      </div>

      <!-- Sticky bottom CTA panel: 前往任务 CTA calling goToStep(3) -->
      <div class="p-3 bg-[#fbf9f5] border-t border-[#e8ddd0] sticky bottom-0 z-10">
        <button
          type="button"
          @click="goToStep(3)"
          class="w-full min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-none touch-manipulation"
          aria-label="前往任务演练"
        >
          <span>前往任务</span>
          <ArrowRight class="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Word Lookup Modal integration -->
    <WordLookupModal
      :is-open="Boolean(tedStore.lookupWord)"
      :word="tedStore.lookupWord || ''"
      :context-quote="activeContextQuote"
      :source="'ted'"
      @close="closeLookupModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Subtitles,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Repeat,
  ArrowRight,
  Headphones,
  Mic
} from 'lucide-vue-next'
import { useTedStore } from '../../stores/tedStore.js'
import { parseBilingualVtt } from '../../data/tedData.js'
import { tokenizeSentence, formatTime } from '../../utils/vttParser.js'
import WordLookupModal from '../common/WordLookupModal.vue'

const tedStore = useTedStore()

const activeContextQuote = ref('')

const currentSpeaker = computed(() => {
  return tedStore.selectedTalk?.speaker || '演讲者'
})

const videoRef = ref(null)
const playerContainerRef = ref(null)
const subtitleListContainerRef = ref(null)
const cueElementRefs = ref([])

const enCues = ref([])
const zhCues = ref([])
const playbackRate = ref(1)
const isFullscreen = ref(false)

// Subtitle modes: 'bilingual' | 'en' | 'zh' | 'off'
const SUBTITLE_MODES = [
  { key: 'bilingual', label: '双语' },
  { key: 'en', label: '英文' },
  { key: 'zh', label: '中文' },
  { key: 'off', label: '关闭' }
]
const subtitleMode = ref('bilingual')

const currentSubtitleModeLabel = computed(() => {
  const found = SUBTITLE_MODES.find((m) => m.key === subtitleMode.value)
  return found ? found.label : '双语'
})

function cycleSubtitleMode() {
  const currentIndex = SUBTITLE_MODES.findIndex((m) => m.key === subtitleMode.value)
  const nextIndex = (currentIndex + 1) % SUBTITLE_MODES.length
  subtitleMode.value = SUBTITLE_MODES[nextIndex].key
  if (subtitleMode.value === 'bilingual' || subtitleMode.value === 'zh') {
    tedStore.showChineseSubs = true
  } else {
    tedStore.showChineseSubs = false
  }
}

function setSubtitleMode(mode) {
  if (SUBTITLE_MODES.some((m) => m.key === mode)) {
    subtitleMode.value = mode
    tedStore.showChineseSubs = (mode === 'bilingual' || mode === 'zh')
  }
}

function toggleChineseSubs() {
  cycleSubtitleMode()
}

function setCueRef(el, index) {
  if (el) {
    cueElementRefs.value[index] = el
  }
}

// VTT Loading
async function loadVtt(src) {
  if (!src) {
    enCues.value = []
    zhCues.value = []
    return
  }
  try {
    const res = await fetch(src)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    const parsed = parseBilingualVtt(text)
    enCues.value = parsed.enCues || []
    zhCues.value = parsed.zhCues || []
  } catch (err) {
    console.warn('[TedVideoPlayer] Failed to load VTT:', err?.message)
  }
}

watch(
  () => tedStore.vttSrc,
  (newSrc) => {
    loadVtt(newSrc)
  },
  { immediate: true }
)

// Autoscroll active cue in desktop subtitle list
watch(
  () => tedStore.activeCueIndex,
  (newIdx) => {
    if (newIdx !== -1 && cueElementRefs.value[newIdx]) {
      try {
        cueElementRefs.value[newIdx].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      } catch {}
    }
  }
)

function getZhText(index, cue) {
  if (!cue) return ''
  // 1. Proximity matching
  const match = zhCues.value.find(
    (zh) => Math.abs(zh.startTime - cue.startTime) < 0.35
  )
  if (match) return match.text
  // 2. Direct index fallback if reasonably close in time (< 1s)
  const direct = zhCues.value[index]
  if (direct && Math.abs(direct.startTime - cue.startTime) < 1.0) {
    return direct.text
  }
  return ''
}

// Timeupdate handler with Single sentence Loop boundary
function onTimeUpdate() {
  if (!videoRef.value) return
  const currentTime = videoRef.value.currentTime || 0
  tedStore.setVideoCurrentTime(currentTime)

  // Determine active cue index
  const index = enCues.value.findIndex(
    (c) => currentTime >= c.startTime && currentTime < c.endTime
  )
  if (index !== -1 && index !== tedStore.activeCueIndex) {
    tedStore.setActiveCueIndex(index)
  }

  // Single sentence loop boundary check
  if (tedStore.loopCueIndex !== null && enCues.value[tedStore.loopCueIndex]) {
    const loopCue = enCues.value[tedStore.loopCueIndex]
    if (currentTime >= loopCue.endTime) {
      videoRef.value.currentTime = loopCue.startTime
      tedStore.setVideoCurrentTime(loopCue.startTime)
    }
  }
}

function onMetadata() {
  if (videoRef.value) {
    tedStore.setVideoDuration(videoRef.value.duration || 0)
    videoRef.value.playbackRate = playbackRate.value
  }
}

function onEnded() {
  tedStore.setIsVideoPlaying(false)
}

function togglePlay() {
  if (!videoRef.value) return
  if (videoRef.value.paused) {
    videoRef.value.play().catch(() => {})
  } else {
    videoRef.value.pause()
  }
}

function skip(seconds) {
  if (!videoRef.value) return
  const current = videoRef.value.currentTime || 0
  const max = tedStore.videoDuration || videoRef.value.duration || 0
  const target = Math.max(0, Math.min(max, current + seconds))
  videoRef.value.currentTime = target
  tedStore.setVideoCurrentTime(target)
}

function onSeek(event) {
  const target = parseFloat(event.target.value) || 0
  if (videoRef.value) {
    videoRef.value.currentTime = target
  }
  tedStore.setVideoCurrentTime(target)
}

function onChangeSpeed(event) {
  const speed = parseFloat(event.target.value) || 1
  playbackRate.value = speed
  if (videoRef.value) {
    videoRef.value.playbackRate = speed
  }
}

// Cue loop selection
function setLoopCue(index) {
  if (tedStore.loopCueIndex === index) {
    tedStore.setLoopCue(null)
  } else {
    tedStore.setLoopCue(index)
    const cue = enCues.value[index]
    if (cue && videoRef.value) {
      videoRef.value.currentTime = cue.startTime
      tedStore.setVideoCurrentTime(cue.startTime)
      if (videoRef.value.paused) {
        videoRef.value.play().catch(() => {})
      }
    }
  }
}

function toggleActiveCueLoop() {
  if (tedStore.loopCueIndex !== null) {
    tedStore.setLoopCue(null)
  } else if (tedStore.activeCueIndex !== -1 && enCues.value[tedStore.activeCueIndex]) {
    setLoopCue(tedStore.activeCueIndex)
  }
}

function clearLoop() {
  tedStore.setLoopCue(null)
}

// Actions wrappers for bindings
function toggleBlindMode() {
  tedStore.toggleBlindMode()
}

function handleWordClick(word, contextQuote = '') {
  if (!word) return
  activeContextQuote.value = (contextQuote || '').trim()
  tedStore.setLookupWord(word)
}

function setLookupWord(word, contextQuote = '') {
  handleWordClick(word, contextQuote)
}

function closeLookupModal() {
  tedStore.setLookupWord(null)
  activeContextQuote.value = ''
}

function goToStep(step) {
  tedStore.goToStep(step)
}

function onFullscreenChange() {
  if (typeof document === 'undefined') return
  isFullscreen.value = Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  )
}

function toggleFullscreen() {
  if (typeof document === 'undefined') return
  const container = playerContainerRef.value || videoRef.value
  if (!container) return
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (container.requestFullscreen) {
      container.requestFullscreen().catch(() => {})
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {})
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    }
  }
}

// Sync store speed with local video
watch(
  () => tedStore.playbackRate,
  (newRate) => {
    if (newRate && newRate !== playbackRate.value) {
      playbackRate.value = newRate
      if (videoRef.value) {
        videoRef.value.playbackRate = newRate
      }
    }
  }
)

// Sync store subtitle mode with local player
watch(
  () => tedStore.subtitleMode,
  (newMode) => {
    if (newMode && newMode !== subtitleMode.value) {
      setSubtitleMode(newMode)
    }
  }
)

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
  }
  tedStore.setVideoController({
    play: () => videoRef.value?.play()?.catch(() => {}),
    pause: () => videoRef.value?.pause(),
    togglePlay,
    seek: (target) => {
      if (videoRef.value) {
        videoRef.value.currentTime = target
      }
      tedStore.setVideoCurrentTime(target)
    },
    skip,
    setRate: (rate) => {
      playbackRate.value = rate
      if (videoRef.value) {
        videoRef.value.playbackRate = rate
      }
    },
    setSubtitleMode,
    toggleFullscreen,
    jumpCue: (delta) => {
      const nextIdx = tedStore.activeCueIndex + delta
      if (nextIdx >= 0 && nextIdx < enCues.value.length) {
        setLoopCue(nextIdx)
      }
    },
    toggleLoop: toggleActiveCueLoop
  })
})

onBeforeUnmount(() => {
  tedStore.setVideoController(null)
  if (typeof document !== 'undefined') {
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
  }
  if (videoRef.value && !videoRef.value.paused) {
    try {
      videoRef.value.pause()
    } catch {}
  }
})
</script>
