<template>
  <div
    class="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto pb-36 sm:pb-40 pb-safe focus:outline-none"
    tabindex="0"
    role="region"
    aria-label="WebVTT 精听字幕多模态区"
  >
    <!-- Loading State Skeleton -->
    <div v-if="subtitleStore.isLoading" class="space-y-4 py-8 animate-pulse">
      <div v-for="n in 6" :key="n" class="h-20 bg-[#e8ddd0]/50 rounded-2xl"></div>
    </div>

    <!-- Empty State / Missing VTT (Pure Audio Fallback) -->
    <div
      v-else-if="!subtitleStore.cues || subtitleStore.cues.length === 0"
      class="text-center py-16 px-6 bg-[#f4ebe1]/60 border border-[#e8ddd0] rounded-3xl my-8 max-w-lg mx-auto"
    >
      <div class="w-14 h-14 rounded-2xl bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center text-[#d97706] mx-auto mb-4">
        <Headphones class="w-7 h-7" />
      </div>
      <h3 class="font-serif text-base sm:text-lg font-semibold text-[#1e1610] mb-2">
        原版原声 · 纯音频磨耳朵模式
      </h3>
      <p class="text-xs sm:text-sm text-[#78695d] max-w-sm mx-auto leading-relaxed mb-6 font-reading">
        当前章节正在以母带级音质播放。可在此开启隐身斗篷模式沉浸泛听，或在书架中切换至含时间轴字幕的章节。
      </p>
      <button
        type="button"
        @click="player.toggleBookshelf(true)"
        class="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-semibold inline-flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
      >
        <BookOpen class="w-4 h-4" />
        <span>打开魔法书架挑章节</span>
      </button>
    </div>

    <!-- Subtitle Cues List -->
    <div v-else class="space-y-3 sm:space-y-3.5">
      <div
        v-for="(cue, idx) in subtitleStore.cues"
        :key="cue.id"
        :ref="(el) => setCueRef(el, idx)"
        @click="onCueClick(cue)"
        :class="[
          'relative p-4 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer select-text border group',
          idx === subtitleStore.activeCueIndex
            ? 'reading-hero-sentence bg-[#f5ede2]/90 border-l-4 border-[#d97706] border-y-[#e8ddd0] border-r-[#e8ddd0] ring-1 ring-[#d97706]/20 shadow-sm'
            : 'reading-inactive-sentence border-transparent hover:border-[#e8ddd0] hover:bg-[#f4ebe1]/50 text-[#78695d]'
        ]"
      >
        <!-- Time badge & Lumos prompt -->
        <div class="flex items-center justify-between mb-2 text-[11px] font-mono text-[#a89a8c]">
          <span class="flex items-center gap-1.5 font-medium">
            <Volume2 v-if="idx === subtitleStore.activeCueIndex" class="w-3.5 h-3.5 text-[#d97706] animate-pulse" />
            <span :class="idx === subtitleStore.activeCueIndex ? 'text-[#92400e]' : ''">
              {{ formatTime(cue.start) }} - {{ formatTime(cue.end) }}
            </span>
          </span>

          <span
            v-if="idx === subtitleStore.activeCueIndex"
            class="text-[#d97706] font-medium flex items-center gap-1 text-[11px]"
          >
            <Sparkles class="w-3 h-3" />
            <span>Lumos 专注</span>
          </span>
        </div>

        <!-- English Text with Blind Mode blur option -->
        <p
          :class="[
            'text-base sm:text-lg leading-[1.8] font-serif transition-all',
            idx === subtitleStore.activeCueIndex
              ? 'text-[#1e1610] font-semibold tracking-wide'
              : 'text-[#4a3b32]',
            player.isBlindMode && idx !== subtitleStore.activeCueIndex
              ? 'filter blur-[5px] select-none opacity-40'
              : ''
          ]"
        >
          {{ cue.text }}
        </p>

        <!-- Chinese translation if available -->
        <p
          v-if="cue.translation"
          :class="[
            'text-xs sm:text-sm text-[#78695d] mt-2 sm:mt-2.5 font-sans leading-relaxed',
            player.isBlindMode && idx !== subtitleStore.activeCueIndex
              ? 'filter blur-[4px] select-none opacity-30'
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
import { BookOpen, Volume2, Sparkles, Headphones } from 'lucide-vue-next'

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
