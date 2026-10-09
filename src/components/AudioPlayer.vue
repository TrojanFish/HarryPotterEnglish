<template>
  <footer
    class="fixed bottom-0 left-0 right-0 z-30 bg-[#fbf9f5]/95 backdrop-blur-md border-t border-[#e8ddd0] px-4 py-3 shadow-[0_-4px_16px_rgba(30,22,16,0.04)]"
    role="region"
    aria-label="流媒体音频播放控制栏"
  >
    <div class="max-w-4xl mx-auto flex flex-col gap-2">
      <!-- Progress Track & Time indicators -->
      <div class="flex items-center gap-3 w-full">
        <span class="text-xs font-mono text-[#78695d] w-12 text-right tabular-nums select-none">
          {{ formatTime(displayTime) }}
        </span>

        <div class="relative flex-1 flex items-center group py-2">
          <!-- Background Bar -->
          <div class="w-full h-1.5 bg-[#e8ddd0] rounded-full overflow-hidden">
            <div
              class="h-full bg-[#d97706] transition-[width] duration-75 rounded-full"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>

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

        <span class="text-xs font-mono text-[#78695d] w-12 tabular-nums select-none">
          {{ formatTime(player.duration) }}
        </span>
      </div>

      <!-- Action Buttons Pyramid (Apple HIG >= 44px) -->
      <div class="flex items-center justify-between">
        <!-- Left: Blind Mode Toggle -->
        <button
          type="button"
          @click="player.toggleBlindMode()"
          :class="[
            'min-h-[44px] min-w-[44px] px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors border',
            player.isBlindMode
              ? 'bg-[#d97706]/15 border-[#d97706] text-[#92400e]'
              : 'border-[#e8ddd0] text-[#78695d] hover:bg-[#f4ebe1] hover:text-[#1e1610]'
          ]"
          :aria-pressed="player.isBlindMode"
          aria-label="隐身斗篷盲听模式开关"
        >
          <component :is="player.isBlindMode ? EyeOff : Eye" class="w-4 h-4 shrink-0" />
          <span class="hidden sm:inline">{{ player.isBlindMode ? '盲听中' : '盲听' }}</span>
        </button>

        <!-- Center: Primary Playback Controls -->
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Rewind 5s -->
          <button
            type="button"
            @click="skip(-5)"
            class="min-h-[44px] min-w-[44px] p-2 rounded-full flex items-center justify-center text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] transition-colors active:scale-95"
            aria-label="快退 5 秒"
          >
            <RotateCcw class="w-5 h-5" />
          </button>

          <!-- Master Play / Pause Button -->
          <button
            type="button"
            @click="player.togglePlay()"
            class="min-h-[48px] min-w-[48px] p-3 rounded-full bg-[#d97706] hover:bg-[#b45309] text-white flex items-center justify-center shadow-sm transition-transform active:scale-95"
            :aria-label="player.isPlaying ? '暂停音频' : '播放音频'"
          >
            <component :is="player.isPlaying ? Pause : Play" class="w-6 h-6 fill-current" />
          </button>

          <!-- Fast-forward 5s -->
          <button
            type="button"
            @click="skip(5)"
            class="min-h-[44px] min-w-[44px] p-2 rounded-full flex items-center justify-center text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] transition-colors active:scale-95"
            aria-label="快进 5 秒"
          >
            <RotateCw class="w-5 h-5" />
          </button>
        </div>

        <!-- Right: Playback Rate Selector -->
        <button
          type="button"
          @click="cycleRate"
          class="min-h-[44px] min-w-[44px] px-3 rounded-lg border border-[#e8ddd0] hover:bg-[#f4ebe1] text-[#78695d] hover:text-[#1e1610] flex items-center gap-1 text-xs font-mono font-medium transition-colors active:scale-95"
          aria-label="切换播放倍速"
        >
          <Gauge class="w-4 h-4 shrink-0" />
          <span>{{ player.playbackRate.toFixed(1) }}x</span>
        </button>
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
  EyeOff
} from 'lucide-vue-next'

const player = usePlayerStore()

const isDragging = ref(false)
const dragTime = ref(0)

const displayTime = computed(() => {
  return isDragging.value ? dragTime.value : player.currentTime
})

const progressPercent = computed(() => {
  if (!player.duration || player.duration <= 0) return 0
  return Math.min(100, (displayTime.value / player.duration) * 100)
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

const rates = [0.8, 1.0, 1.2, 1.5]
function cycleRate() {
  const idx = rates.indexOf(player.playbackRate)
  const nextIdx = (idx + 1) % rates.length
  player.setPlaybackRate(rates[nextIdx])
}
</script>
