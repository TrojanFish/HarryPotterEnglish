<template>
  <div
    class="flex-1 w-full max-w-3xl mx-auto px-4 py-6 overflow-y-auto pb-36 sm:pb-40 pb-safe focus:outline-none"
    tabindex="0"
    role="region"
    aria-label="WebVTT 精听字幕多模态区"
  >
    <!-- Loading State Skeleton -->
    <div v-if="subtitleStore.isLoading" class="space-y-4 py-8 animate-pulse">
      <div v-for="n in 6" :key="n" class="h-16 bg-[#e8ddd0]/50 rounded-xl"></div>
    </div>

    <!-- Empty State / Missing VTT (Pure Audio Fallback) -->
    <div
      v-else-if="!subtitleStore.cues || subtitleStore.cues.length === 0"
      class="text-center py-16 px-4 bg-[#f4ebe1]/50 border border-[#e8ddd0] rounded-2xl my-8"
    >
      <BookOpen class="w-12 h-12 text-[#78695d] mx-auto mb-3" />
      <h3 class="font-serif text-base font-semibold text-[#1e1610] mb-1">
        纯音频磨耳朵模式
      </h3>
      <p class="text-sm text-[#78695d] max-w-md mx-auto">
        当前章节未检测到精听时间轴字幕，依然可以纯享原版原声音频磨耳朵。
      </p>
    </div>

    <!-- Subtitle Cues List -->
    <div v-else class="space-y-3">
      <div
        v-for="(cue, idx) in subtitleStore.cues"
        :key="cue.id"
        :ref="(el) => setCueRef(el, idx)"
        @click="onCueClick(cue)"
        :class="[
          'relative p-4 rounded-xl transition-all duration-200 cursor-pointer select-text border',
          idx === subtitleStore.activeCueIndex
            ? 'reading-hero-sentence bg-[#d97706]/10 border-l-4 border-[#d97706] border-y-[#e8ddd0] border-r-[#e8ddd0] shadow-sm'
            : 'reading-inactive-sentence border-transparent hover:border-[#e8ddd0] hover:bg-[#f4ebe1]/60 text-[#78695d]'
        ]"
      >
        <!-- Time badge & Lumos prompt -->
        <div class="flex items-center justify-between mb-1 text-[11px] font-mono text-[#a89a8c]">
          <span class="flex items-center gap-1">
            <Volume2 v-if="idx === subtitleStore.activeCueIndex" class="w-3.5 h-3.5 text-[#d97706]" />
            <span>{{ formatTime(cue.start) }}</span>
          </span>
          <span v-if="idx === subtitleStore.activeCueIndex" class="text-[#d97706] font-medium flex items-center gap-1">
            <Sparkles class="w-3 h-3" />
            <span>Lumos 聚焦</span>
          </span>
        </div>

        <!-- English Text with Blind Mode blur option -->
        <p
          :class="[
            'text-base leading-[1.85] font-serif transition-all',
            idx === subtitleStore.activeCueIndex
              ? 'text-[#1e1610] font-medium'
              : 'text-[#4a3b32]',
            player.isBlindMode && idx !== subtitleStore.activeCueIndex
              ? 'filter blur-[5px] select-none'
              : ''
          ]"
        >
          {{ cue.text }}
        </p>

        <!-- Chinese translation if available -->
        <p
          v-if="cue.translation"
          :class="[
            'text-xs text-[#78695d] mt-2 font-sans',
            player.isBlindMode && idx !== subtitleStore.activeCueIndex
              ? 'filter blur-[4px] select-none'
              : ''
          ]"
        >
          {{ cue.translation }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useSubtitleStore } from '../stores/subtitleStore.js'
import { usePlayerStore } from '../stores/playerStore.js'
import { formatTime } from '../utils/formatTime.js'
import { BookOpen, Volume2, Sparkles } from 'lucide-vue-next'

const subtitleStore = useSubtitleStore()
const player = usePlayerStore()

const cueRefs = ref([])

function setCueRef(el, idx) {
  if (el) {
    cueRefs.value[idx] = el
  }
}

function onCueClick(cue) {
  player.seek(cue.start)
  player.play()
}

// Auto-scroll when active cue index changes
watch(
  () => subtitleStore.activeCueIndex,
  (newIdx) => {
    if (newIdx >= 0 && cueRefs.value[newIdx]) {
      nextTick(() => {
        const el = cueRefs.value[newIdx]
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }
      })
    }
  }
)
</script>
