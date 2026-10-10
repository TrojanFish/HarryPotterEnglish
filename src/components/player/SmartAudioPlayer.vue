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

      <!-- Right: Next Step Flow Button (Guaranteed non-wrapping single line) -->
      <div class="flex items-center shrink-0">
        <button
          type="button"
          @click="advanceStep"
          class="min-h-[44px] px-3.5 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1 transition-all active:scale-95 touch-manipulation cursor-pointer"
          aria-label="进入下一步骤"
        >
          <span class="whitespace-nowrap">{{ nextStepButtonLabel }}</span>
          <ChevronRight class="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw, Repeat1, ChevronRight } from 'lucide-vue-next'
import { usePlayerStore } from '../../stores/playerStore.js'
import { useSubtitleStore } from '../../stores/subtitleStore.js'
import { useSessionStore } from '../../stores/sessionStore.js'

const player = usePlayerStore()
const subtitleStore = useSubtitleStore()
const sessionStore = useSessionStore()

const progressBarRef = ref(null)
const isLooping = ref(false)

const rates = [0.75, 1.0, 1.25, 1.5]

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
}

function jumpToPrevCue() {
  subtitleStore.jumpToPrevCue()
  const cue = subtitleStore.currentCue
  if (cue && cue.start !== undefined) {
    player.seek(cue.start)
  }
}

function jumpToNextCue() {
  subtitleStore.jumpToNextCue()
  const cue = subtitleStore.currentCue
  if (cue && cue.start !== undefined) {
    player.seek(cue.start)
  }
}

// Single sentence loop watcher
watch(
  () => player.currentTime,
  (t) => {
    if (isLooping.value && subtitleStore.currentCue) {
      const cue = subtitleStore.currentCue
      if (cue.end !== undefined && t >= cue.end) {
        player.seek(cue.start || 0)
      }
    }
  }
)

const nextStepButtonLabel = computed(() => {
  switch (sessionStore.currentStep) {
    case 1:
      return '跟读'
    case 2:
      return '听写'
    case 3:
      return '词汇'
    case 4:
      return '完成课时'
    default:
      return '下一步'
  }
})

function advanceStep() {
  sessionStore.advanceStep()
}
</script>
