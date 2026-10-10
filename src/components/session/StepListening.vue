<template>
  <div class="h-full w-full flex flex-col md:flex-row overflow-hidden bg-white">
    <!-- Left Column: Reading Subtitle Stream (Full width on mobile, 65% on desktop) -->
    <div
      ref="scrollContainerRef"
      class="flex-1 md:flex-[1.2] flex flex-col min-w-0 border-r border-[#e4e4e7] overflow-y-auto p-4 sm:p-6 pb-32 sm:pb-36 space-y-3 sm:space-y-3.5"
    >
      <!-- Subtitle Control Strip -->
      <div class="flex items-center justify-between pb-3 border-b border-[#e4e4e7] text-xs text-[#71717a] shrink-0">
        <span class="px-2 py-0.5 bg-[#f4f4f5] rounded border border-[#e4e4e7] font-mono text-[11px]">
          共 {{ subtitleStore.cues.length }} 句
        </span>
        <button
          type="button"
          @click="toggleBlindMode"
          class="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-[#f4f4f5] flex items-center justify-center transition-colors active:scale-95 touch-manipulation cursor-pointer"
          :title="player.isBlindMode ? '盲听模式开启中（点击取消模糊）' : '开启盲听模式（模糊字幕专注听力）'"
          :aria-label="player.isBlindMode ? '取消盲听模式' : '开启盲听模式'"
        >
          <EyeOff v-if="player.isBlindMode" class="w-5 h-5 text-[#2563eb]" />
          <Eye v-else class="w-5 h-5 text-[#71717a] hover:text-[#18181b]" />
        </button>
      </div>

      <!-- Empty state when no cues loaded -->
      <div
        v-if="subtitleStore.cues.length === 0"
        class="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#71717a]"
      >
        <BookOpen class="w-8 h-8 text-[#a1a1aa] mb-2" />
        <p class="text-sm font-medium text-[#18181b]">正在加载原版音频字幕...</p>
        <p class="text-xs text-[#a1a1aa] mt-1">请稍候或检查网络连接</p>
      </div>

      <!-- Cue Cards Stream -->
      <div
        v-for="(cue, idx) in subtitleStore.cues"
        :key="cue.id || idx"
        :id="'cue-' + idx"
        @click="jumpToCue(cue, idx)"
        :class="[
          'cue-card group p-4 sm:p-5 rounded-xl border transition-all cursor-pointer select-text',
          idx === subtitleStore.activeCueIndex
            ? 'border-[#2563eb] bg-[#f8f8f6] border-l-4 border-l-[#2563eb]'
            : 'border-[#e4e4e7] hover:border-[#a1a1aa] bg-white'
        ]"
      >
        <!-- Time and Index -->
        <div class="flex items-center justify-between text-[11px] font-mono mb-2">
          <span :class="idx === subtitleStore.activeCueIndex ? 'text-[#2563eb] font-semibold' : 'text-[#71717a]'">
            {{ formatTime(cue.start) }} - {{ formatTime(cue.end) }} · #{{ String(idx + 1).padStart(2, '0') }}
          </span>
        </div>

        <!-- English Sentence with word-level tap (supports Blind Mode Blur) -->
        <p
          :class="[
            'font-serif text-lg sm:text-xl leading-[2.0] tracking-wide transition-all',
            idx === subtitleStore.activeCueIndex ? 'text-[#18181b] font-medium' : 'text-[#27272a]',
            player.isBlindMode ? 'filter blur-[7px] select-none opacity-40 group-hover:filter-none group-hover:opacity-100' : ''
          ]"
        >
          <span
            v-for="(token, tIdx) in tokenizeText(cue.text)"
            :key="tIdx"
            @click.stop="handleWordClick(token, cue.text)"
            class="token hover:text-[#2563eb] hover:underline cursor-pointer inline-block mr-[0.35em] transition-colors"
          >{{ token }}</span>
        </p>

        <!-- Chinese Translation (supports Blind Mode Blur) -->
        <p
          v-if="cue.translation"
          :class="[
            'text-xs sm:text-sm text-[#52525b] mt-2 pt-2 border-t border-[#e4e4e7]/60 leading-relaxed font-sans transition-all',
            player.isBlindMode ? 'filter blur-[7px] select-none opacity-40 group-hover:filter-none group-hover:opacity-100' : ''
          ]"
        >
          {{ cue.translation }}
        </p>
      </div>
    </div>

    <!-- Right Column: Focus Insight & Word Details (Desktop only) -->
    <div class="hidden md:flex md:flex-[0.8] flex-col p-6 bg-[#f8f8f6] overflow-y-auto space-y-5">
      <div>
        <h3 class="text-xs font-mono font-bold tracking-wider text-[#71717a] uppercase mb-2">
          当前精听句核心词汇
        </h3>
        <div class="space-y-2">
          <div
            v-for="word in currentCueVocab"
            :key="word.word"
            class="p-3 bg-white border border-[#e4e4e7] rounded-xl"
          >
            <div class="flex items-center justify-between">
              <span class="font-serif font-bold text-sm text-[#18181b]">{{ word.word }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-[#2563eb] font-mono">
                {{ word.tag }}
              </span>
            </div>
            <p class="text-xs text-[#52525b] mt-1">{{ word.definition }}</p>
          </div>
          <div v-if="currentCueVocab.length === 0" class="p-4 bg-white border border-[#e4e4e7] rounded-xl text-center text-xs text-[#71717a]">
            点击左侧任意单词可快速收录至生词本
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-xs font-mono font-bold tracking-wider text-[#71717a] uppercase mb-2">
          下一步：进阶跟读
        </h3>
        <div class="p-4 bg-white border border-[#e4e4e7] rounded-xl space-y-3">
          <p class="text-xs text-[#52525b] leading-relaxed">
            听完本段录音后，点击下方按钮切换到 <strong>步骤 2 影子跟读</strong>，进行单句 A/B 录音比对练习。
          </p>
          <button
            type="button"
            @click="sessionStore.setStep(2)"
            class="w-full min-h-[44px] px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
          >
            <span>跟读本句</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Word Added Toast Notification -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="toastMsg"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#18181b] text-white text-xs font-mono rounded-full border border-[#e4e4e7]/30 flex items-center gap-2 pointer-events-none"
      >
        <Sparkles class="w-3.5 h-3.5 text-[#2563eb]" />
        <span>{{ toastMsg }}</span>
      </div>
    </Transition>

    <!-- Word Lookup Modal -->
    <WordLookupModal
      :is-open="isLookupOpen"
      :word="lookupWordTarget"
      :context-quote="lookupQuote"
      @close="isLookupOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Eye, EyeOff, BookOpen, ChevronRight, Sparkles } from 'lucide-vue-next'
import { useSubtitleStore } from '../../stores/subtitleStore.js'
import { usePlayerStore } from '../../stores/playerStore.js'
import { useVocabStore } from '../../stores/vocabStore.js'
import { useSessionStore } from '../../stores/sessionStore.js'
import WordLookupModal from '../common/WordLookupModal.vue'

const subtitleStore = useSubtitleStore()
const player = usePlayerStore()
const vocabStore = useVocabStore()
const sessionStore = useSessionStore()

const scrollContainerRef = ref(null)
const toastMsg = ref('')
let toastTimer = null

const isLookupOpen = ref(false)
const lookupWordTarget = ref('')
const lookupQuote = ref('')

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function toggleBlindMode() {
  player.toggleBlindMode()
}

function tokenizeText(text) {
  if (!text) return []
  return text.trim().split(/\s+/)
}

function handleWordClick(token, fullSentence) {
  const clean = token ? token.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '') : ''
  if (!clean || clean.length < 2) return
  if (player.isPlaying) {
    player.pause()
  } else {
    player.pause()
  }
  lookupWordTarget.value = token
  lookupQuote.value = fullSentence || ''
  isLookupOpen.value = true
}

function showToast(word, msg) {
  if (toastTimer) clearTimeout(toastTimer)
  toastMsg.value = `"${word}" · ${msg}`
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
  }, 2000)
}

function jumpToCue(cue, idx) {
  subtitleStore.activeCueIndex = idx
  player.seek(cue.start)
}

// Extract vocabulary keywords from current active cue
const currentCueVocab = computed(() => {
  const cur = subtitleStore.currentCue
  if (!cur || !cur.text) return []
  const text = cur.text.toLowerCase()
  const list = []
  if (text.includes('privet') || text.includes('dursley')) {
    list.push({ word: 'Privet', tag: '专有名词', definition: 'n. 女贞树；Privet Drive 即女贞路' })
  }
  if (text.includes('proud')) {
    list.push({ word: 'proud', tag: '中考重点', definition: 'adj. 骄傲的，自豪的' })
  }
  if (text.includes('perfectly')) {
    list.push({ word: 'perfectly', tag: '核心副词', definition: 'adv. 完全地；无可挑剔地' })
  }
  if (text.includes('peculiar')) {
    list.push({ word: 'peculiar', tag: '高考拓展', definition: 'adj. 奇怪的，古怪的；特殊的' })
  }
  return list
})

// Auto scroll active cue into view
watch(
  () => subtitleStore.activeCueIndex,
  (idx) => {
    nextTick(() => {
      const el = document.getElementById('cue-' + idx)
      if (el && scrollContainerRef.value) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    })
  }
)
</script>
