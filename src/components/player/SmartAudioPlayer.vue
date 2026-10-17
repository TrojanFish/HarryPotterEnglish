<template>
  <footer
    v-if="shouldShowPlayer"
    class="shrink-0 w-full bg-[#fbf9f5] border-t border-[#e8ddd0] px-3 sm:px-6 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] flex flex-col justify-center z-20"
    role="region"
    aria-label="音频智能控制台"
  >
    <!-- Top Progress Bar (Scrubber) -->
    <div class="w-full flex items-center gap-2 sm:gap-3 mb-1">
      <span class="text-[11px] font-mono text-stone-500 w-10 text-right shrink-0">
        {{ formatTime(activeCurrentTime) }}
      </span>
      <div
        ref="progressBarRef"
        @click="handleSeekAudio"
        class="flex-1 h-1.5 sm:h-2 bg-[#e8ddd0] rounded-full overflow-hidden cursor-pointer relative touch-manipulation group"
        role="slider"
        :aria-valuenow="progressPercent"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="播放进度条"
      >
        <div
          class="h-full bg-amber-600 transition-all group-hover:bg-amber-700"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <span class="text-[11px] font-mono text-stone-500 w-10 shrink-0">
        {{ formatTime(activeDuration) }}
      </span>
    </div>

    <!-- Controls Row: Symmetrical 3-column Grid (1fr auto 1fr) ensures Play button is DEAD-CENTER -->
    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-4 w-full">
      <!-- Left: Auxiliary controls (Loop & Speed) -->
      <div class="flex items-center justify-start gap-1 sm:gap-2 min-w-0">
        <button
          type="button"
          @click="handleToggleLoop"
          :class="[
            'min-h-[44px] px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 touch-manipulation active:scale-95 cursor-pointer',
            activeIsLooping
              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-[#f5efe6]'
          ]"
          :title="activeIsLooping ? '单句循环锁定已开启' : '开启单句循环锁定'"
          aria-label="单句循环"
        >
          <Repeat1 class="w-4 h-4 shrink-0" />
          <span class="hidden md:inline">单句循环</span>
        </button>

        <button
          type="button"
          @click="handleCycleRate"
          class="min-h-[44px] px-2.5 py-1 text-xs font-mono font-medium text-stone-600 hover:text-stone-900 hover:bg-[#f5efe6] rounded-lg transition-colors touch-manipulation active:scale-95 cursor-pointer"
          title="切换播放倍速"
          aria-label="切换播放倍速"
        >
          {{ activePlaybackRate.toFixed(2).replace(/\.00$/, '') }}x
        </button>
      </div>

      <!-- Center: Core Playback cluster (Pure Mathematical & Visual Center) -->
      <div class="flex items-center justify-center gap-1 sm:gap-3 shrink-0">
        <!-- Prev Cue -->
        <button
          type="button"
          @click="handleJumpPrev"
          class="min-h-[44px] min-w-[44px] p-2 text-stone-600 hover:text-stone-900 hover:bg-[#f5efe6] rounded-full transition-colors flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
          title="上一句"
          aria-label="上一句"
        >
          <SkipBack class="w-5 h-5" />
        </button>

        <!-- Seek -5s/-10s (Hidden on small mobile to give breathing room to CTA button) -->
        <button
          type="button"
          @click="handleSeekRel(isTedMode ? -5 : -10)"
          class="hidden sm:flex min-h-[44px] min-w-[44px] p-2 text-stone-600 hover:text-stone-900 hover:bg-[#f5efe6] rounded-full transition-colors items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
          :title="isTedMode ? '快退 5 秒' : '快退 10 秒'"
          :aria-label="isTedMode ? '快退 5 秒' : '快退 10 秒'"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <!-- Play / Pause Main CTA Button -->
        <button
          type="button"
          @click="handleTogglePlay"
          class="w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-amber-700 hover:bg-amber-800 text-amber-50 shadow-sm flex items-center justify-center transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0"
          :title="activeIsPlaying ? '暂停' : '播放'"
          :aria-label="activeIsPlaying ? '暂停' : '播放'"
        >
          <Pause v-if="activeIsPlaying" class="w-5 h-5 fill-current" />
          <Play v-else class="w-5 h-5 fill-current ml-0.5" />
        </button>

        <!-- Seek +5s/+10s (Hidden on small mobile to give breathing room to CTA button) -->
        <button
          type="button"
          @click="handleSeekRel(isTedMode ? 5 : 10)"
          class="hidden sm:flex min-h-[44px] min-w-[44px] p-2 text-stone-600 hover:text-stone-900 hover:bg-[#f5efe6] rounded-full transition-colors items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
          :title="isTedMode ? '快进 5 秒' : '快进 10 秒'"
          :aria-label="isTedMode ? '快进 5 秒' : '快进 10 秒'"
        >
          <RotateCw class="w-4 h-4" />
        </button>

        <!-- Next Cue -->
        <button
          type="button"
          @click="handleJumpNext"
          class="min-h-[44px] min-w-[44px] p-2 text-stone-600 hover:text-stone-900 hover:bg-[#f5efe6] rounded-full transition-colors flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
          title="下一句"
          aria-label="下一句"
        >
          <SkipForward class="w-5 h-5" />
        </button>
      </div>

      <!-- Right: Auxiliary controls (Symmetrical to Left) -->
      <div class="flex items-center justify-end gap-1 sm:gap-2 min-w-0">
        <!-- TED Mode: Subtitle Mode Toggle -->
        <button
          v-if="isTedMode"
          type="button"
          @click="handleCycleSubtitleMode"
          class="min-h-[44px] px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer text-stone-600 hover:text-stone-900 hover:bg-[#f5efe6]"
          :title="`切换字幕模式：当前为${currentSubtitleLabel}`"
          aria-label="切换字幕模式"
        >
          <Subtitles class="w-4 h-4 shrink-0 text-amber-800" />
          <span class="font-mono text-xs font-semibold">{{ currentSubtitleLabel }}</span>
        </button>

        <!-- Blind Mode Toggle (Shared for both HP and TED) -->
        <button
          type="button"
          @click="handleToggleBlindMode"
          :class="[
            'min-h-[44px] px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 touch-manipulation active:scale-95 cursor-pointer',
            activeIsBlindMode
              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-[#f5efe6]'
          ]"
          :title="activeIsBlindMode ? '盲听模式开启中（点击取消模糊）' : '开启盲听模式（专注听力输入）'"
          :aria-label="activeIsBlindMode ? '取消盲听模式' : '开启盲听模式'"
        >
          <EyeOff v-if="activeIsBlindMode" class="w-4 h-4 shrink-0 text-amber-800" />
          <Eye v-else class="w-4 h-4 shrink-0" />
          <span class="hidden md:inline">{{ activeIsBlindMode ? '盲听中' : '盲听' }}</span>
        </button>

        <!-- TED Mode: Fullscreen Toggle -->
        <button
          v-if="isTedMode"
          type="button"
          @click="handleToggleFullscreen"
          class="min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer text-stone-600 hover:text-stone-900 hover:bg-[#f5efe6]"
          title="全屏切换"
          aria-label="全屏切换"
        >
          <Maximize class="w-4 h-4 shrink-0" />
          <span class="hidden md:inline">全屏</span>
        </button>

        <!-- HP Mode: Sleep Timer -->
        <button
          v-if="!isTedMode"
          type="button"
          @click="isSleepMenuOpen = true"
          :class="[
            'min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer',
            player.sleepTimerMode
              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-[#f5efe6]'
          ]"
          :title="player.sleepTimerMode ? `睡眠定时进行中: ${sleepTimerDisplay}` : '设置睡眠定时'"
          aria-label="设置睡眠定时"
        >
          <Moon class="w-4 h-4 shrink-0" />
          <span v-if="player.sleepTimerMode" class="font-mono text-xs">{{ sleepTimerDisplay }}</span>
          <span v-else class="hidden md:inline">睡眠</span>
        </button>
      </div>
    </div>

    <!-- Sleep Timer iOS Bottom Sheet Modal -->
    <Teleport to="body">
      <div v-if="isSleepMenuOpen" class="fixed inset-0 z-50 overflow-hidden">
        <!-- Backdrop Fade Transition -->
        <Transition
          appear
          enter-active-class="transition-opacity duration-300 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            class="fixed inset-0 bg-black/50 backdrop-blur-sm"
            @click="isSleepMenuOpen = false"
            aria-hidden="true"
          ></div>
        </Transition>

        <!-- Bottom Sheet Modal Container -->
        <div
          class="fixed inset-0 pointer-events-none flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <Transition
            appear
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="translate-y-full sm:translate-y-4 opacity-0 sm:opacity-0"
            enter-to-class="translate-y-0 opacity-100 sm:opacity-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="translate-y-0 opacity-100"
            leave-to-class="translate-y-full sm:translate-y-4 opacity-0"
          >
            <div
              v-if="isSleepMenuOpen"
              class="pointer-events-auto bg-[#f5efe6] border-t border-x sm:border border-[#e8ddd0] rounded-t-2xl sm:rounded-2xl max-w-sm w-full p-5 space-y-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] sm:pb-5 flex flex-col overflow-hidden"
              :style="sheetStyle"
              @click.stop
              role="dialog"
              aria-modal="true"
              aria-label="睡眠定时选择"
            >
              <!-- Pull Handle (Mobile only) -->
              <div
                class="pt-1 pb-2 sm:hidden flex justify-center cursor-grab active:cursor-grabbing touch-none shrink-0"
                @touchstart="onTouchStart"
                @touchmove="handleDragTouchMove"
                @touchend="onTouchEnd"
              >
                <div class="w-10 h-1.5 rounded-full bg-[#e8ddd0]"></div>
              </div>

              <!-- Header -->
              <div
                class="flex items-center justify-between shrink-0 select-none touch-none"
                @touchstart="onTouchStart"
                @touchmove="handleDragTouchMove"
                @touchend="onTouchEnd"
              >
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900">
                    <Moon class="w-4 h-4" />
                  </div>
                  <h3 class="font-serif text-sm font-semibold text-stone-900">睡眠定时</h3>
                </div>
                <button
                  type="button"
                  @click="isSleepMenuOpen = false"
                  class="min-h-[44px] min-w-[44px] p-2 text-stone-600 hover:text-stone-900 hover:bg-[#fbf9f5] rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="关闭定时器选择"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              <!-- Presets List -->
              <div class="space-y-1.5">
                <button
                  v-for="opt in sleepOptions"
                  :key="opt.label"
                  type="button"
                  @click="selectSleepTimer(opt.value)"
                  :class="[
                    'w-full min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between border transition-all cursor-pointer active:scale-95 touch-manipulation',
                    isOptionActive(opt.value)
                      ? 'bg-amber-100 border border-amber-300 text-amber-900 font-bold'
                      : 'bg-white/80 hover:bg-[#fbf9f5] border-[#e8ddd0] text-stone-800'
                  ]"
                >
                  <span>{{ opt.label }}</span>
                  <Check v-if="isOptionActive(opt.value)" class="w-4 h-4 text-amber-700" />
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Teleport>
  </footer>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Repeat1,
  Moon,
  Eye,
  EyeOff,
  Subtitles,
  Maximize,
  Minimize,
  X,
  Check
} from 'lucide-vue-next'
import { usePlayerStore } from '../../stores/playerStore.js'
import { useSubtitleStore } from '../../stores/subtitleStore.js'
import { useNavigationStore } from '../../stores/navigationStore.js'
import { useTedStore } from '../../stores/tedStore.js'
import { useBottomSheet } from '../../composables/useBottomSheet.js'

const player = usePlayerStore()
const subtitleStore = useSubtitleStore()
const navStore = useNavigationStore()
const tedStore = useTedStore()

const progressBarRef = ref(null)
const isLooping = ref(false)
const lockedLoopCue = ref(null)
const isSleepMenuOpen = ref(false)

const isTedMode = computed(() => navStore.currentView === 'ted')
const shouldShowPlayer = computed(() => {
  if (isTedMode.value) {
    return tedStore.currentStep === 2
  }
  return true
})

const activeCurrentTime = computed(() => {
  return isTedMode.value ? tedStore.videoCurrentTime : player.currentTime
})

const activeDuration = computed(() => {
  return isTedMode.value ? tedStore.videoDuration : player.duration
})

const activeIsPlaying = computed(() => {
  return isTedMode.value ? tedStore.isVideoPlaying : player.isPlaying
})

const activeIsLooping = computed(() => {
  return isTedMode.value ? tedStore.loopCueIndex !== null : isLooping.value
})

const activePlaybackRate = computed(() => {
  return isTedMode.value ? (tedStore.playbackRate || 1) : player.playbackRate
})

const activeIsBlindMode = computed(() => {
  return isTedMode.value ? tedStore.isBlindMode : player.isBlindMode
})

const SUBTITLE_LABELS = {
  bilingual: '双语',
  en: '英文',
  zh: '中文',
  off: '关闭'
}

const currentSubtitleLabel = computed(() => {
  return SUBTITLE_LABELS[tedStore.subtitleMode] || '双语'
})

const {
  sheetStyle,
  onTouchStart,
  onTouchMove,
  onTouchEnd
} = useBottomSheet({
  threshold: 80,
  onClose: () => { isSleepMenuOpen.value = false }
})

function handleDragTouchMove(e) {
  onTouchMove(e, 0)
}

const sleepOptions = [
  { label: '关闭定时', value: null },
  { label: '15 分钟', value: 15 },
  { label: '30 分钟', value: 30 },
  { label: '45 分钟', value: 45 },
  { label: '60 分钟', value: 60 },
  { label: '本章节播完', value: 'end_of_chapter' }
]

function isOptionActive(val) {
  return player.sleepTimerMode === val
}

function selectSleepTimer(val) {
  player.setSleepTimer(val)
  isSleepMenuOpen.value = false
}

const sleepTimerDisplay = computed(() => {
  if (player.sleepTimerMode === 'end_of_chapter') {
    return '本集'
  }
  if (!player.sleepTimerRemaining) return ''
  const m = Math.floor(player.sleepTimerRemaining / 60)
  const s = player.sleepTimerRemaining % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

let timerTickInterval = null
onMounted(() => {
  timerTickInterval = setInterval(() => {
    player.tickSleepTimer()
  }, 1000)
})

onUnmounted(() => {
  if (timerTickInterval) clearInterval(timerTickInterval)
})

const rates = [0.8, 1.0, 1.25, 1.5, 2.0]

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const progressPercent = computed(() => {
  const dur = activeDuration.value
  if (!dur || dur === 0) return 0
  return Math.min(100, Math.max(0, (activeCurrentTime.value / dur) * 100))
})

function handleSeekAudio(e) {
  if (!progressBarRef.value || !activeDuration.value) return
  const rect = progressBarRef.value.getBoundingClientRect()
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const targetTime = pct * activeDuration.value
  if (isTedMode.value) {
    tedStore.seekVideo(targetTime)
  } else {
    player.seek(targetTime)
  }
}

function seekAudio(e) {
  handleSeekAudio(e)
}

function handleTogglePlay() {
  if (isTedMode.value) {
    tedStore.togglePlayVideo()
  } else {
    player.togglePlay()
  }
}

function handleSeekRel(delta) {
  if (isTedMode.value) {
    tedStore.skipVideo(delta)
  } else {
    player.seekRel(delta)
  }
}

function handleJumpPrev() {
  if (isTedMode.value) {
    tedStore.jumpCue(-1)
  } else {
    jumpToPrevCue()
  }
}

function handleJumpNext() {
  if (isTedMode.value) {
    tedStore.jumpCue(1)
  } else {
    jumpToNextCue()
  }
}

function handleToggleLoop() {
  if (isTedMode.value) {
    tedStore.toggleLoop()
  } else {
    toggleLoop()
  }
}

function handleCycleRate() {
  if (isTedMode.value) {
    tedStore.cyclePlaybackRate()
  } else {
    cycleRate()
  }
}

function cycleRate() {
  const current = player.playbackRate
  let idx = rates.findIndex(r => Math.abs(r - current) < 0.05)
  if (idx === -1) idx = 1
  const nextRate = rates[(idx + 1) % rates.length]
  player.setPlaybackRate(nextRate)
}

function toggleLoop() {
  isLooping.value = !isLooping.value
  if (isLooping.value) {
    lockedLoopCue.value = subtitleStore.effectiveCue || subtitleStore.cues?.[0] || null
  } else {
    lockedLoopCue.value = null
  }
}

function handleToggleBlindMode() {
  if (isTedMode.value) {
    tedStore.toggleBlindMode()
  } else {
    player.toggleBlindMode()
  }
}

function handleToggleFullscreen() {
  if (isTedMode.value) {
    tedStore.toggleFullscreen()
  }
}

function handleCycleSubtitleMode() {
  if (isTedMode.value) {
    tedStore.cycleSubtitleMode()
  }
}

function jumpToPrevCue() {
  subtitleStore.jumpToPrevCue()
  const cue = subtitleStore.currentCue
  if (cue && cue.start !== undefined) {
    if (isLooping.value) lockedLoopCue.value = cue
    player.seek(cue.start)
  }
}

function jumpToNextCue() {
  subtitleStore.jumpToNextCue()
  const cue = subtitleStore.currentCue
  if (cue && cue.start !== undefined) {
    if (isLooping.value) lockedLoopCue.value = cue
    player.seek(cue.start)
  }
}

// Single sentence loop watcher: cleanly loops locked cue before sentence boundary (HP mode)
watch(
  () => player.currentTime,
  (t) => {
    if (!isTedMode.value && isLooping.value) {
      if (!lockedLoopCue.value && subtitleStore.effectiveCue) {
        lockedLoopCue.value = subtitleStore.effectiveCue
      }
      const cue = lockedLoopCue.value
      if (cue && cue.end !== undefined && t >= cue.end - 0.2) {
        player.seek(cue.start || 0)
        if (!player.isPlaying) {
          player.play()
        }
      }
    }
  }
)
</script>
