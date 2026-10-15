<template>
  <div
    class="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-y-auto pb-8 focus:outline-none"
    tabindex="0"
    role="region"
    aria-label="WebVTT 精听字幕多模态区"
  >
    <!-- Reader Header (03 极简书房) -->
    <div class="mb-5 pb-3 border-b border-[#e4e4e7] flex items-center justify-between">
      <div>
        <h2 class="font-serif text-base sm:text-lg font-semibold text-[#18181b]">
          原版有声精听字幕流
        </h2>
        <p class="text-xs text-[#71717a] font-reading mt-0.5">
          轻点单词即刻收录生词本 · 点击句子直接跳转原声
        </p>
      </div>
      <span class="text-xs font-mono text-[#71717a] hidden sm:inline">
        {{ subtitleStore.cues?.length || 0 }} 句
      </span>
    </div>

    <!-- Loading State Skeleton -->
    <div v-if="subtitleStore.isLoading" class="space-y-4 py-8 animate-pulse">
      <div v-for="n in 6" :key="n" class="h-20 bg-[#e4e4e7]/60 rounded-xl"></div>
    </div>

    <!-- Empty State / Missing VTT (Pure Audio Fallback) -->
    <div
      v-else-if="!subtitleStore.cues || subtitleStore.cues.length === 0"
      class="text-center py-16 px-6 bg-[#f8f8f6] border border-[#e4e4e7] rounded-2xl my-8 max-w-lg mx-auto"
    >
      <div class="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563eb] mx-auto mb-4">
        <Headphones class="w-7 h-7" />
      </div>
      <h3 class="font-serif text-base sm:text-lg font-semibold text-[#18181b] mb-2">
        原版原声 · 纯音频磨耳朵模式
      </h3>
      <p class="text-xs sm:text-sm text-[#71717a] max-w-sm mx-auto leading-relaxed mb-6 font-reading">
        当前章节正在以母带级音质播放。可在此开启隐身斗篷模式沉浸泛听，或在书架中切换至含时间轴字幕的章节。
      </p>
      <button
        type="button"
        @click="player.toggleBookshelf(true)"
        class="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-white text-xs font-semibold inline-flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
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
          'relative p-4 sm:p-5 rounded-xl transition-all duration-200 cursor-pointer select-text border group',
          idx === subtitleStore.activeCueIndex
            ? 'reading-hero-sentence bg-white border border-[#2563eb] border-l-4 border-l-[#2563eb]'
            : 'reading-inactive-sentence bg-[#f8f8f6] hover:bg-white border border-[#e4e4e7] hover:border-[#a1a1aa] text-[#52525b]'
        ]"
      >
        <!-- Time badge & Lumos prompt -->
        <div class="flex items-center justify-between mb-2 text-[11px] font-mono text-[#a1a1aa]">
          <span class="flex items-center gap-1.5 font-medium">
            <Volume2 v-if="idx === subtitleStore.activeCueIndex" class="w-3.5 h-3.5 text-[#2563eb] animate-pulse" />
            <span :class="idx === subtitleStore.activeCueIndex ? 'text-[#2563eb] font-semibold' : ''">
              {{ formatTime(cue.start) }} - {{ formatTime(cue.end) }}
            </span>
          </span>

          <span
            v-if="idx === subtitleStore.activeCueIndex"
            class="text-[#2563eb] font-medium flex items-center gap-1 text-[11px]"
          >
            <Sparkles class="w-3 h-3 text-[#2563eb]" />
            <span>专注精听</span>
          </span>
        </div>

        <!-- English Text with Blind Mode blur option & word-tap -->
        <p
          :class="[
            'text-base sm:text-lg leading-[1.8] font-serif transition-all',
            idx === subtitleStore.activeCueIndex
              ? 'text-[#18181b] font-medium tracking-wide'
              : 'text-[#52525b]',
            player.isBlindMode && idx !== subtitleStore.activeCueIndex
              ? 'filter blur-[5px] select-none opacity-40'
              : ''
          ]"
        >
          <span
            v-for="(token, tokenIdx) in tokenizeText(cue.text)"
            :key="tokenIdx"
            @click.stop="handleWordClick(token, cue.text)"
            class="inline-block mr-1.5 hover:text-[#2563eb] hover:underline hover:decoration-dotted cursor-pointer transition-colors"
          >{{ token }}</span>
        </p>

        <!-- Chinese translation if available -->
        <p
          v-if="cue.translation"
          :class="[
            'text-xs sm:text-sm text-[#71717a] mt-2 sm:mt-2.5 font-sans leading-relaxed',
            player.isBlindMode && idx !== subtitleStore.activeCueIndex
              ? 'filter blur-[4px] select-none opacity-30'
              : ''
          ]"
        >
          {{ cue.translation }}
        </p>
      </div>
    </div>

    <!-- Word added toast notification -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="toastWord"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#18181b] text-[#f8f8f6] text-xs font-mono rounded-lg border border-[#27272a] flex items-center gap-2 pointer-events-none"
      >
        <Sparkles class="w-3.5 h-3.5 text-[#3b82f6]" />
        <span>{{ toastWord }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useSubtitleStore } from '../stores/subtitleStore.js'
import { usePlayerStore } from '../stores/playerStore.js'
import { useVocabStore } from '../stores/vocabStore.js'
import { formatTime } from '../utils/formatTime.js'
import { BookOpen, Volume2, Sparkles, Headphones, Check } from 'lucide-vue-next'

const subtitleStore = useSubtitleStore()
const player = usePlayerStore()
const vocabStore = useVocabStore()

const toastWord = ref('')
let toastTimer = null

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

function tokenizeText(text) {
  if (!text) return []
  return text.trim().split(/\s+/)
}

function handleWordClick(token, fullSentence) {
  const clean = token.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '')
  if (!clean || clean.length < 2) return
  const added = vocabStore.addWord(clean, fullSentence)
  showToast(clean, added ? '已收录至生词本' : '已在生词本中')
}

function showToast(word, msg) {
  if (toastTimer) clearTimeout(toastTimer)
  toastWord.value = `${word} · ${msg}`
  toastTimer = setTimeout(() => {
    toastWord.value = ''
  }, 1800)
}

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer)
})

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
