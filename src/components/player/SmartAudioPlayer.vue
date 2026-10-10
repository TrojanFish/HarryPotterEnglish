<template>
  <footer
    class="shrink-0 w-full bg-white border-t border-[#e4e4e7] px-3 sm:px-6 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] flex flex-col justify-center z-20"
    role="region"
    aria-label="音频智能控制台"
  >
    <!-- Top Progress Bar (Scrubber) -->
    <div class="w-full flex items-center gap-2 sm:gap-3 mb-1">
      <span class="text-[11px] font-mono text-[#71717a] w-10 text-right shrink-0">
        {{ formatTime(player.currentTime) }}
      </span>
      <div
        ref="progressBarRef"
        @click="seekAudio"
        class="flex-1 h-1.5 sm:h-2 bg-[#e4e4e7] rounded-full overflow-hidden cursor-pointer relative touch-manipulation group"
        role="slider"
        :aria-valuenow="progressPercent"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="播放进度条"
      >
        <div
          class="h-full bg-[#2563eb] transition-all group-hover:bg-blue-600"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <span class="text-[11px] font-mono text-[#71717a] w-10 shrink-0">
        {{ formatTime(player.duration) }}
      </span>
    </div>

    <!-- Controls Row -->
    <div class="flex items-center justify-between gap-1 sm:gap-4">
      <!-- Left: Auxiliary controls (Loop & Speed) -->
      <div class="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          type="button"
          @click="toggleLoop"
          :class="[
            'min-h-[44px] px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 touch-manipulation active:scale-95 cursor-pointer',
            isLooping
              ? 'bg-blue-100 text-[#2563eb] font-semibold'
              : 'text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5]'
          ]"
          :title="isLooping ? '单句循环锁定已开启' : '开启单句循环锁定'"
          aria-label="单句循环"
        >
          <Repeat1 class="w-4 h-4" />
          <span class="hidden md:inline">单句循环</span>
        </button>

        <button
          type="button"
          @click="cycleRate"
          class="min-h-[44px] px-2.5 py-1 text-xs font-mono font-medium text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] rounded-lg transition-colors touch-manipulation active:scale-95 cursor-pointer"
          title="切换播放倍速"
          aria-label="切换播放倍速"
        >
          {{ player.playbackRate.toFixed(2).replace(/\.00$/, '') }}x
        </button>
      </div>

      <!-- Center: Core Playback cluster -->
      <div class="flex items-center gap-1 sm:gap-3">
        <!-- Prev Cue -->
        <button
          type="button"
          @click="jumpToPrevCue"
          class="min-h-[44px] min-w-[44px] p-2 text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] rounded-full transition-colors flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
          title="上一句"
          aria-label="上一句"
        >
          <SkipBack class="w-5 h-5" />
        </button>

        <!-- Seek -10s (Hidden on small mobile to give breathing room to CTA button) -->
        <button
          type="button"
          @click="player.seekRel(-10)"
          class="hidden sm:flex min-h-[44px] min-w-[44px] p-2 text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] rounded-full transition-colors items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
          title="快退 10 秒"
          aria-label="快退 10 秒"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <!-- Play / Pause Main CTA Button -->
        <button
          type="button"
          @click="player.togglePlay()"
          class="w-11 h-11 rounded-full bg-[#18181b] hover:bg-[#27272a] text-white flex items-center justify-center transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm"
          :title="player.isPlaying ? '暂停' : '播放'"
          :aria-label="player.isPlaying ? '暂停' : '播放'"
        >
          <Pause v-if="player.isPlaying" class="w-5 h-5 fill-current" />
          <Play v-else class="w-5 h-5 fill-current ml-0.5" />
        </button>

        <!-- Seek +10s (Hidden on small mobile to give breathing room to CTA button) -->
        <button
          type="button"
          @click="player.seekRel(10)"
          class="hidden sm:flex min-h-[44px] min-w-[44px] p-2 text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] rounded-full transition-colors items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
          title="快进 10 秒"
          aria-label="快进 10 秒"
        >
          <RotateCw class="w-4 h-4" />
        </button>

        <!-- Next Cue -->
        <button
          type="button"
          @click="jumpToNextCue"
          class="min-h-[44px] min-w-[44px] p-2 text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] rounded-full transition-colors flex items-center justify-center active:scale-95 touch-manipulation cursor-pointer"
          title="下一句"
          aria-label="下一句"
        >
          <SkipForward class="w-5 h-5" />
        </button>
      </div>

      <!-- Right: Sleep Timer Button (Borderless matching other auxiliary controls) -->
      <div class="flex items-center shrink-0">
        <button
          type="button"
          @click="isSleepMenuOpen = true"
          :class="[
            'min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer',
            player.sleepTimerMode
              ? 'text-[#2563eb] font-semibold bg-blue-50/80'
              : 'text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5]'
          ]"
          :title="player.sleepTimerMode ? `睡眠定时进行中: ${sleepTimerDisplay}` : '设置睡眠定时'"
          aria-label="设置睡眠定时"
        >
          <Moon class="w-4 h-4" />
          <span v-if="player.sleepTimerMode" class="font-mono text-xs">{{ sleepTimerDisplay }}</span>
          <span v-else class="hidden md:inline">睡眠定时</span>
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
              class="pointer-events-auto bg-[#f8f8f6] border-t border-x sm:border border-[#e4e4e7] rounded-t-2xl sm:rounded-2xl max-w-sm w-full p-5 space-y-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] sm:pb-5 flex flex-col overflow-hidden"
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
                <div class="w-10 h-1.5 rounded-full bg-stone-300"></div>
              </div>

              <!-- Header -->
              <div
                class="flex items-center justify-between shrink-0 select-none touch-none"
                @touchstart="onTouchStart"
                @touchmove="handleDragTouchMove"
                @touchend="onTouchEnd"
              >
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563eb]">
                    <Moon class="w-4 h-4" />
                  </div>
                  <h3 class="font-serif text-sm font-semibold text-[#18181b]">睡眠定时</h3>
                </div>
                <button
                  type="button"
                  @click="isSleepMenuOpen = false"
                  class="min-h-[44px] min-w-[44px] p-2 text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] rounded-lg flex items-center justify-center transition-colors cursor-pointer"
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
                      ? 'bg-blue-50 border-blue-300 text-[#2563eb]'
                      : 'bg-white hover:bg-[#f4f4f5] border-[#e4e4e7] text-[#18181b]'
                  ]"
                >
                  <span>{{ opt.label }}</span>
                  <Check v-if="isOptionActive(opt.value)" class="w-4 h-4 text-[#2563eb]" />
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
  X,
  Check
} from 'lucide-vue-next'
import { usePlayerStore } from '../../stores/playerStore.js'
import { useSubtitleStore } from '../../stores/subtitleStore.js'
import { useBottomSheet } from '../../composables/useBottomSheet.js'

const player = usePlayerStore()
const subtitleStore = useSubtitleStore()

const progressBarRef = ref(null)
const isLooping = ref(false)
const lockedLoopCue = ref(null)
const isSleepMenuOpen = ref(false)

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
  if (!player.duration || player.duration === 0) return 0
  return Math.min(100, Math.max(0, (player.currentTime / player.duration) * 100))
})

function seekAudio(e) {
  if (!progressBarRef.value || !player.duration) return
  const rect = progressBarRef.value.getBoundingClientRect()
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  player.seek(pct * player.duration)
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

// Single sentence loop watcher: cleanly loops locked cue before sentence boundary
watch(
  () => player.currentTime,
  (t) => {
    if (isLooping.value) {
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
