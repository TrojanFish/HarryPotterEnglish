<template>
  <footer
    class="shrink-0 w-full bg-white border-t border-[#e4e4e7] px-4 sm:px-8 py-2.5 pb-safe z-20 select-none"
    role="region"
    aria-label="流媒体音频播放控制栏"
  >
    <div class="max-w-4xl mx-auto flex flex-col gap-1.5 sm:gap-2">
      <!-- Top Micro-status Row (R2 status / Buffering indicator) -->
      <div class="flex items-center justify-between text-[10px] font-mono text-[#71717a] px-1 select-none">
        <div class="flex items-center gap-1.5">
          <span
            v-if="player.isOfflineFallback"
            class="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 flex items-center gap-1"
          >
            <WifiOff class="w-3 h-3 text-zinc-500" />
            <span>离线备用音频通道</span>
          </span>
          <span
            v-else
            class="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1"
          >
            <Radio class="w-3 h-3 text-[#2563eb]" />
            <span>R2 原版母带流媒体</span>
          </span>

          <span
            v-if="player.isBuffering || player.isAudioLoading"
            class="px-1.5 py-0.5 rounded-full bg-blue-50 text-[#1d4ed8] border border-blue-200 flex items-center gap-1 animate-pulse"
          >
            <Loader2 class="w-2.5 h-2.5 animate-spin text-[#2563eb]" />
            <span>缓冲装载中...</span>
          </span>
        </div>

        <span class="text-[11px] text-[#71717a] hidden sm:inline">
          Space 播放 · ←/→ 快退进
        </span>
      </div>

      <!-- Progress Track & Time indicators -->
      <div class="flex items-center gap-2.5 sm:gap-3 w-full">
        <span class="text-xs font-mono text-[#71717a] w-12 text-right tabular-nums select-none shrink-0">
          {{ formatTime(displayTime) }}
        </span>

        <div class="relative flex-1 flex items-center group py-2.5">
          <!-- Background Bar -->
          <div class="w-full h-1.5 sm:h-2 bg-[#e4e4e7] rounded-full overflow-hidden">
            <div
              class="h-full bg-[#18181b] transition-[width] duration-75 rounded-full relative"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>

          <!-- Thumb indicator that follows progress -->
          <div
            class="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#18181b] border-2 border-white rounded-full shadow-sm pointer-events-none -translate-x-1/2 transition-transform group-hover:scale-125"
            :style="{ left: `${progressPercent}%` }"
          ></div>

          <!-- Native Accessible Range Input for smooth touch dragging -->
          <input
            type="range"
            min="0"
            :max="player.duration || 100"
            step="0.1"
            :value="displayTime"
            @input="onSliderInput"
            @change="onSliderChange"
            aria-label="音频进度调节"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <span class="text-xs font-mono text-[#71717a] w-12 tabular-nums select-none shrink-0">
          {{ formatTime(player.duration) }}
        </span>
      </div>

      <!-- Action Buttons Pyramid (Apple HIG >= 44px) -->
      <div class="flex items-center justify-between">
        <!-- Left: Blind Mode & Volume Control -->
        <div class="flex items-center gap-1 sm:gap-2">
          <!-- Blind Mode Toggle -->
          <button
            type="button"
            @click="player.toggleBlindMode()"
            :class="[
              'min-h-[44px] min-w-[44px] px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-colors border active:scale-95',
              player.isBlindMode
                ? 'bg-blue-50 border-[#2563eb] text-[#2563eb]'
                : 'border-[#e4e4e7] text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#18181b]'
            ]"
            :aria-pressed="player.isBlindMode"
            aria-label="隐身斗篷盲听模式开关"
            title="盲听模式（模糊未播字幕，专注听力输入）"
          >
            <component :is="player.isBlindMode ? EyeOff : Eye" class="w-4 h-4 shrink-0" />
            <span class="hidden sm:inline">{{ player.isBlindMode ? '盲听中' : '盲听' }}</span>
          </button>

          <!-- Volume Toggle & Mini Slider Popover -->
          <div class="relative flex items-center">
            <button
              type="button"
              @click="toggleVolumeMute"
              class="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-[#e4e4e7] hover:bg-[#f4f4f5] text-[#71717a] hover:text-[#18181b] flex items-center justify-center transition-colors active:scale-95"
              :aria-label="player.volume === 0 ? '解除静音' : '静音调节'"
              title="音量调节"
            >
              <VolumeX v-if="player.volume === 0" class="w-4 h-4 text-stone-400" />
              <Volume1 v-else-if="player.volume < 0.5" class="w-4 h-4 text-[#18181b]" />
              <Volume2 v-else class="w-4 h-4 text-[#18181b]" />
            </button>
          </div>
        </div>

        <!-- Center: Primary Playback Controls -->
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Rewind 5s -->
          <button
            type="button"
            @click="skip(-5)"
            class="min-h-[44px] min-w-[44px] p-2 rounded-full flex items-center justify-center text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] transition-colors active:scale-95"
            aria-label="快退 5 秒"
            title="快退 5 秒"
          >
            <RotateCcw class="w-5 h-5" />
          </button>

          <!-- Master Play / Pause Button with Buffering state -->
          <button
            type="button"
            @click="player.togglePlay()"
            class="min-h-[48px] min-w-[48px] sm:min-h-[50px] sm:min-w-[50px] p-3 rounded-full bg-[#18181b] hover:bg-[#27272a] text-white flex items-center justify-center shadow-sm transition-transform active:scale-95"
            :aria-label="player.isPlaying ? '暂停音频' : '播放音频'"
          >
            <Loader2 v-if="player.isBuffering || player.isAudioLoading" class="w-6 h-6 animate-spin" />
            <component v-else :is="player.isPlaying ? Pause : Play" class="w-6 h-6 fill-current" />
          </button>

          <!-- Fast-forward 5s -->
          <button
            type="button"
            @click="skip(5)"
            class="min-h-[44px] min-w-[44px] p-2 rounded-full flex items-center justify-center text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] transition-colors active:scale-95"
            aria-label="快进 5 秒"
            title="快进 5 秒"
          >
            <RotateCw class="w-5 h-5" />
          </button>
        </div>

        <!-- Right: Playback Rate Selector (0.8x ~ 2.0x) -->
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            @click="cycleRate"
            class="min-h-[44px] min-w-[44px] px-2.5 sm:px-3 rounded-xl border border-[#e4e4e7] hover:bg-[#f4f4f5] text-[#18181b] flex items-center gap-1 text-xs font-mono font-medium transition-colors active:scale-95"
            aria-label="切换播放倍速"
            title="切换播放倍速"
          >
            <Gauge class="w-4 h-4 shrink-0 text-[#2563eb]" />
            <span>{{ player.playbackRate.toFixed(1) }}x</span>
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/playerStore.js'
import { formatTime } from '../utils/formatTime.js'
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Gauge,
  Eye,
  EyeOff,
  Volume2,
  Volume1,
  VolumeX,
  Radio,
  WifiOff,
  Loader2
} from 'lucide-vue-next'

const player = usePlayerStore()

const isDragging = ref(false)
const dragTime = ref(0)
const lastNonZeroVolume = ref(1.0)

const displayTime = computed(() => {
  return isDragging.value ? dragTime.value : player.currentTime
})

const progressPercent = computed(() => {
  if (!player.duration || player.duration <= 0) return 0
  return Math.min(100, Math.max(0, (displayTime.value / player.duration) * 100))
})

function onSliderInput(e) {
  isDragging.value = true
  dragTime.value = Number(e.target.value)
}

function onSliderChange(e) {
  const targetTime = Number(e.target.value)
  player.seek(targetTime)
  isDragging.value = false
}

function skip(seconds) {
  player.seek(player.currentTime + seconds)
}

function toggleVolumeMute() {
  if (player.volume > 0) {
    lastNonZeroVolume.value = player.volume
    player.setVolume(0)
  } else {
    player.setVolume(lastNonZeroVolume.value || 1.0)
  }
}

const rates = [0.8, 1.0, 1.2, 1.5, 2.0]
function cycleRate() {
  const idx = rates.indexOf(player.playbackRate)
  const nextIdx = (idx + 1) % rates.length
  player.setPlaybackRate(rates[nextIdx])
}
</script>
