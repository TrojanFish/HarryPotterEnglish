<template>
  <div
    ref="playerContainerRef"
    class="flex flex-col md:flex-row h-full w-full bg-[#fbf9f5] overflow-hidden select-none"
  >
    <!-- Left panel: Video + Controls + Mobile Subtitle Flow -->
    <div class="flex-[3] flex flex-col min-w-0 h-full bg-stone-950/95 relative overflow-hidden">
      <!-- Video Container with 16:9 Aspect Ratio -->
      <div class="relative w-full aspect-video bg-black flex items-center justify-center shrink-0">
        <video
          ref="videoRef"
          :src="tedStore.videoSrc"
          @timeupdate="onTimeUpdate"
          @loadedmetadata="onMetadata"
          @play="tedStore.setIsVideoPlaying(true)"
          @pause="tedStore.setIsVideoPlaying(false)"
          @ended="onEnded"
          preload="metadata"
          playsinline
          class="w-full aspect-video bg-black object-contain"
        ></video>

        <!-- Loop Sentinel Badge Overlay when Looping -->
        <div
          v-if="tedStore.loopCueIndex !== null"
          class="absolute top-3 left-3 bg-[#1e1610]/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 z-10"
        >
          <Repeat class="w-3.5 h-3.5 animate-spin-slow text-amber-400" aria-hidden="true" />
          <span>单句循环模式中</span>
          <button
            type="button"
            @click.stop="clearLoop"
            class="ml-1 text-amber-200 hover:text-white text-[11px] underline"
            aria-label="取消循环"
          >
            取消
          </button>
        </div>

        <!-- Blind mode water-screen banner on video (subtle badge) -->
        <div
          v-if="tedStore.isBlindMode"
          class="absolute top-3 right-3 bg-indigo-950/80 backdrop-blur-md border border-indigo-400/40 text-indigo-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 z-10"
        >
          <EyeOff class="w-3.5 h-3.5 text-indigo-300" aria-hidden="true" />
          <span>盲听模式已开启</span>
        </div>
      </div>

      <!-- Mobile In-Flow Subtitle Stream (Visible only on smaller screens) -->
      <div class="md:hidden flex-1 overflow-y-auto p-4 bg-[#fbf9f5] border-t border-[#e8ddd0]">
        <!-- Blind mode overlay for mobile -->
        <div
          v-if="tedStore.isBlindMode"
          class="flex flex-col items-center justify-center py-8 text-center"
        >
          <EyeOff class="w-8 h-8 text-stone-400 mb-2" aria-hidden="true" />
          <p class="text-sm font-bold text-amber-950">盲听专注模式已开启</p>
          <p class="text-xs text-stone-500 mt-1">字幕已隐去，点击底部眼睛图标显现</p>
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
            <p class="text-lg leading-[1.75] font-reading text-amber-950">
              <template v-for="(token, tIdx) in tokenizeSentence(cue.text)" :key="tIdx">
                <span
                  v-if="token.isWord"
                  @click.stop="setLookupWord(token.text)"
                  class="cursor-pointer hover:underline hover:text-amber-700 active:text-amber-800 transition-colors inline"
                >{{ token.text }}</span>
                <span v-else>{{ token.text }}</span>
              </template>
            </p>
            <p
              v-if="tedStore.showChineseSubs && !tedStore.isBlindMode"
              class="text-sm text-stone-500 mt-1"
            >
              {{ getZhText(i, cue) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Video Control Bar (Fixed/sticky bottom with dark theme bg-[#1e1610]/90) -->
      <div class="mt-auto bg-[#1e1610]/90 backdrop-blur-md border-t border-amber-900/40 p-3 sm:p-4 z-20 flex flex-col gap-2">
        <!-- Progress Bar and Timestamps -->
        <div class="flex items-center gap-3">
          <span class="text-[11px] font-mono text-amber-200/80 w-11 text-right shrink-0">
            {{ formatTime(tedStore.videoCurrentTime) }}
          </span>
          <input
            type="range"
            min="0"
            :max="tedStore.videoDuration || 100"
            step="0.1"
            :value="tedStore.videoCurrentTime"
            @input="onSeek"
            class="flex-1 h-1.5 accent-amber-500 cursor-pointer rounded-lg bg-stone-700"
            aria-label="视频播放进度"
          />
          <span class="text-[11px] font-mono text-stone-400 w-11 shrink-0">
            {{ formatTime(tedStore.videoDuration) }}
          </span>
        </div>

        <!-- Controls Row -->
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <!-- Left Controls: SkipBack, Play/Pause, SkipForward, Speed -->
          <div class="flex items-center gap-1.5 sm:gap-2">
            <!-- SkipBack (Seek back 5 seconds) -->
            <button
              type="button"
              @click="skip(-5)"
              class="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-amber-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all touch-manipulation focus:outline-none"
              aria-label="后退5秒"
            >
              <SkipBack class="w-5 h-5 stroke-[2]" aria-hidden="true" />
            </button>

            <!-- Play / Pause Button -->
            <button
              type="button"
              @click="togglePlay"
              class="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center active:scale-95 transition-all touch-manipulation focus:outline-none shadow-none"
              :aria-label="tedStore.isVideoPlaying ? '暂停视频' : '播放视频'"
            >
              <Pause v-if="tedStore.isVideoPlaying" class="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
              <Play v-else class="w-5 h-5 stroke-[2.2] ml-0.5" aria-hidden="true" />
            </button>

            <!-- SkipForward (Seek forward 5 seconds) -->
            <button
              type="button"
              @click="skip(5)"
              class="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-amber-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all touch-manipulation focus:outline-none"
              aria-label="快进5秒"
            >
              <SkipForward class="w-5 h-5 stroke-[2]" aria-hidden="true" />
            </button>

            <!-- Playback Speed Selector -->
            <div class="relative flex items-center">
              <select
                :value="playbackRate"
                @change="onChangeSpeed"
                class="min-h-[44px] min-w-[44px] bg-[#2a1f18] text-amber-200 border border-amber-900/60 rounded-xl px-2 text-xs font-mono font-bold hover:bg-[#34261e] focus:outline-none cursor-pointer transition-colors"
                aria-label="播放倍速"
              >
                <option value="0.75">0.75x</option>
                <option value="1">1.0x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2.0x</option>
              </select>
            </div>
          </div>

          <!-- Right Controls: Loop state, Subtitles, Blind Mode, Maximize -->
          <div class="flex items-center gap-1.5 sm:gap-2">
            <!-- Single sentence loop toggle for active cue -->
            <button
              type="button"
              @click="toggleActiveCueLoop"
              class="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all touch-manipulation focus:outline-none"
              :class="[
                tedStore.loopCueIndex !== null
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'text-amber-200/70 hover:text-white hover:bg-white/10'
              ]"
              :aria-label="tedStore.loopCueIndex !== null ? '退出单句循环' : '开启当前句循环'"
            >
              <Repeat class="w-5 h-5 stroke-[2]" aria-hidden="true" />
            </button>

            <!-- Bilingual / Chinese Subtitles toggle -->
            <button
              type="button"
              @click="toggleChineseSubs"
              class="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all touch-manipulation focus:outline-none"
              :class="[
                tedStore.showChineseSubs
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-white/10'
              ]"
              :aria-label="tedStore.showChineseSubs ? '隐藏中文释义' : '显示中文释义'"
            >
              <Subtitles class="w-5 h-5 stroke-[2]" aria-hidden="true" />
            </button>

            <!-- Blind mode toggle -->
            <button
              type="button"
              @click="toggleBlindMode"
              class="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all touch-manipulation focus:outline-none"
              :class="[
                tedStore.isBlindMode
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/50'
                  : 'text-amber-200/70 hover:text-white hover:bg-white/10'
              ]"
              :aria-label="tedStore.isBlindMode ? '退出盲听模式' : '开启盲听模式'"
            >
              <EyeOff v-if="tedStore.isBlindMode" class="w-5 h-5 stroke-[2]" aria-hidden="true" />
              <Eye v-else class="w-5 h-5 stroke-[2]" aria-hidden="true" />
            </button>

            <!-- Fullscreen / Maximize toggle -->
            <button
              type="button"
              @click="toggleFullscreen"
              class="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-amber-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all touch-manipulation focus:outline-none"
              aria-label="全屏显示"
            >
              <Maximize class="w-5 h-5 stroke-[2]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Right panel subtitle list (Desktop and Tablet): hidden md:flex flex-col w-72 lg:w-80 shrink-0 overflow-y-auto border-l border-[#e8ddd0] -->
    <div
      ref="subtitleListContainerRef"
      class="hidden md:flex flex-col w-72 lg:w-80 shrink-0 overflow-y-auto border-l border-[#e8ddd0] bg-[#fbf9f5] relative"
    >
      <!-- Subtitle Panel Header -->
      <div class="p-3 border-b border-[#e8ddd0]/80 bg-[#fbf9f5] flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
        <div>
          <h3 class="text-xs font-bold text-amber-950 uppercase tracking-wider">双语对齐字幕</h3>
          <p class="text-[11px] text-stone-500">点击句子循环 · 点击单词查词</p>
        </div>
        <span class="text-xs font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
          {{ enCues.length }} 句
        </span>
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
          class="mt-4 min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
          <p class="text-lg leading-[1.75] font-reading text-amber-950">
            <template v-for="(token, tIdx) in tokenizeSentence(cue.text)" :key="tIdx">
              <span
                v-if="token.isWord"
                @click.stop="setLookupWord(token.text)"
                class="cursor-pointer hover:underline hover:text-amber-700 active:text-amber-800 transition-colors inline"
              >{{ token.text }}</span>
              <span v-else>{{ token.text }}</span>
            </template>
          </p>

          <!-- Chinese Subtitle: text-sm text-stone-500 mt-1 shown only when showChineseSubs && !isBlindMode -->
          <p
            v-if="tedStore.showChineseSubs && !tedStore.isBlindMode"
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
      @close="tedStore.setLookupWord(null)"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Subtitles,
  Eye,
  EyeOff,
  Maximize,
  Repeat,
  ArrowRight
} from 'lucide-vue-next'
import { useTedStore } from '../../stores/tedStore.js'
import { parseBilingualVtt } from '../../data/tedData.js'
import { tokenizeSentence, formatTime } from '../../utils/vttParser.js'
import WordLookupModal from '../common/WordLookupModal.vue'

const tedStore = useTedStore()

const videoRef = ref(null)
const playerContainerRef = ref(null)
const subtitleListContainerRef = ref(null)
const cueElementRefs = ref([])

const enCues = ref([])
const zhCues = ref([])
const playbackRate = ref(1)

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
  if (zhCues.value[index]?.text) {
    return zhCues.value[index].text
  }
  if (cue) {
    const matched = zhCues.value.find((z) => Math.abs(z.startTime - cue.startTime) < 0.3)
    if (matched) return matched.text
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
  const max = tedStore.videoDuration || 0
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

function toggleChineseSubs() {
  tedStore.toggleChineseSubs()
}

function setLookupWord(word) {
  if (!word) return
  tedStore.setLookupWord(word)
}

function goToStep(step) {
  tedStore.goToStep(step)
}

function toggleFullscreen() {
  const container = playerContainerRef.value || videoRef.value
  if (!container) return
  if (!document.fullscreenElement) {
    if (container.requestFullscreen) {
      container.requestFullscreen().catch(() => {})
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {})
    }
  }
}

onBeforeUnmount(() => {
  if (videoRef.value && !videoRef.value.paused) {
    try {
      videoRef.value.pause()
    } catch {}
  }
})
</script>
