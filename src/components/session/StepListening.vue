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
      <!-- Section: Core Vocabulary of Current Cue -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-mono font-bold tracking-wider text-[#71717a] uppercase flex items-center gap-1.5">
            <span>当前精听句核心词汇</span>
            <span
              v-if="currentCueVocab.length > 0"
              class="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200"
            >
              {{ currentCueVocab.length }} 词
            </span>
          </h3>

          <span
            v-if="savedVocabCountInCurrentCue > 0"
            class="text-[11px] font-mono text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
          >
            已收录 {{ savedVocabCountInCurrentCue }}/{{ currentCueVocab.length }}
          </span>
        </div>

        <!-- Vocabulary Cards List -->
        <div class="space-y-2.5">
          <div
            v-for="word in currentCueVocab"
            :key="word.word"
            @click="openWordDetails(word)"
            class="group p-3.5 bg-white border border-[#e4e4e7] hover:border-[#2563eb]/60 rounded-xl transition-all cursor-pointer select-text"
          >
            <!-- Word Header row -->
            <div class="flex items-center justify-between">
              <div class="flex items-baseline gap-2">
                <span class="font-serif font-bold text-base text-[#18181b] group-hover:text-[#2563eb] transition-colors">
                  {{ word.word }}
                </span>
                <span v-if="word.phonetic" class="text-xs font-mono text-[#71717a]">
                  {{ word.phonetic }}
                </span>
              </div>

              <!-- Action buttons row: Pronunciation + Vocab Toggle -->
              <div class="flex items-center gap-1 shrink-0" @click.stop>
                <!-- TTS Pronunciation Button -->
                <button
                  type="button"
                  @click="speakWord(word.word)"
                  class="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-[#f4f4f5] text-[#71717a] hover:text-[#18181b] flex items-center justify-center transition-colors active:scale-95 touch-manipulation cursor-pointer"
                  title="朗读发音"
                  aria-label="朗读发音"
                >
                  <Volume2 class="w-4 h-4" />
                </button>

                <!-- One-click Vocab Toggle Button -->
                <button
                  type="button"
                  @click="toggleVocabWord(word)"
                  class="min-h-[44px] min-w-[44px] p-2 rounded-lg flex items-center justify-center transition-colors active:scale-95 touch-manipulation cursor-pointer"
                  :class="vocabStore.hasWord(word.word)
                    ? 'text-[#2563eb] hover:bg-blue-50'
                    : 'text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#18181b]'"
                  :title="vocabStore.hasWord(word.word) ? '已在生词本中（点击移除）' : '收录至生词本'"
                  :aria-label="vocabStore.hasWord(word.word) ? '已在生词本中' : '收录至生词本'"
                >
                  <BookmarkCheck v-if="vocabStore.hasWord(word.word)" class="w-4 h-4 text-[#2563eb]" />
                  <BookMarked v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Definition & Tag -->
            <div class="mt-1.5 flex items-center justify-between gap-2">
              <p class="text-xs text-[#52525b] leading-relaxed line-clamp-2">
                {{ word.definition }}
              </p>
              <span :class="['text-[10px] px-1.5 py-0.5 rounded border font-mono shrink-0', getTagBadgeClass(word.tag)]">
                {{ word.tag }}
              </span>
            </div>
          </div>

          <!-- Empty State when sentence only has basic words -->
          <div
            v-if="currentCueVocab.length === 0"
            class="p-5 bg-white border border-[#e4e4e7] rounded-xl text-center space-y-1.5"
          >
            <div class="w-8 h-8 mx-auto rounded-full bg-[#f4f4f5] flex items-center justify-center text-[#71717a]">
              <Sparkles class="w-4 h-4 text-[#2563eb]" />
            </div>
            <p class="text-xs font-medium text-[#18181b]">本句为基础短句，无难点生词</p>
            <p class="text-[11px] text-[#71717a]">
              点击左侧字幕中的任意单词，即可随时呼出词典查词与收录
            </p>
          </div>
        </div>
      </div>

      <!-- Section: Sentence Content Word Chips Cloud -->
      <div v-if="sentenceContentTokens.length > 0">
        <h3 class="text-xs font-mono font-bold tracking-wider text-[#71717a] uppercase mb-2">
          全句单词速查
        </h3>
        <div class="p-3.5 bg-white border border-[#e4e4e7] rounded-xl">
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="(chip, cIdx) in sentenceContentTokens"
              :key="cIdx"
              type="button"
              @click="handleWordClick(chip.clean, subtitleStore.currentCue?.text)"
              class="px-2.5 py-1 text-xs font-mono rounded-lg border transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              :class="vocabStore.hasWord(chip.clean)
                ? 'bg-blue-50 border-blue-200 text-[#2563eb] font-semibold'
                : 'bg-[#f4f4f5] border-[#e4e4e7] text-[#52525b] hover:bg-white hover:border-[#2563eb]/60'"
            >
              <span>{{ chip.clean }}</span>
              <BookmarkCheck v-if="vocabStore.hasWord(chip.clean)" class="w-3 h-3 text-[#2563eb]" />
            </button>
          </div>
        </div>
      </div>

      <!-- Section: Next Step (Shadowing) -->
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
import {
  Eye,
  EyeOff,
  BookOpen,
  ChevronRight,
  Sparkles,
  Volume2,
  BookMarked,
  BookmarkCheck
} from 'lucide-vue-next'
import { useSubtitleStore } from '../../stores/subtitleStore.js'
import { usePlayerStore } from '../../stores/playerStore.js'
import { useVocabStore } from '../../stores/vocabStore.js'
import { useSessionStore } from '../../stores/sessionStore.js'
import { extractSentenceKeywords, STOP_WORDS, cleanWordToken } from '../../data/dictionaryData.js'
import { getTagBadgeClass } from '../../utils/tagTheme.js'
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
  }
  lookupWordTarget.value = token
  lookupQuote.value = fullSentence || ''
  isLookupOpen.value = true
}

function openWordDetails(item) {
  if (!item || !item.word) return
  if (player.isPlaying) {
    player.pause()
  }
  lookupWordTarget.value = item.word
  lookupQuote.value = subtitleStore.currentCue?.text || ''
  isLookupOpen.value = true
}

function speakWord(wordText) {
  if (!wordText || typeof window === 'undefined' || !window.speechSynthesis) return
  try {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(wordText)
    utter.lang = 'en-GB'
    utter.rate = 0.95
    window.speechSynthesis.speak(utter)
  } catch (err) {}
}

function toggleVocabWord(item) {
  if (!item || !item.word) return
  const quote = subtitleStore.currentCue?.text || ''
  const isAdded = vocabStore.toggleWord(
    {
      word: item.word,
      phonetic: item.phonetic || '',
      pos: item.pos || '',
      definition: item.definition || '生词本收录',
      tag: item.tag || '重点生词'
    },
    quote
  )
  showToast(item.word, isAdded ? '已加入生词本' : '已从生词本移除')
}

function showToast(word, msg) {
  if (toastTimer) clearTimeout(toastTimer)
  toastMsg.value = `${word} · ${msg}`
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
  }, 1800)
}

function jumpToCue(cue, idx) {
  subtitleStore.activeCueIndex = idx
  player.seek(cue.start)
}

// Dynamically extract core vocabulary keywords from current active cue
const currentCueVocab = computed(() => {
  const cur = subtitleStore.currentCue
  if (!cur || !cur.text) return []
  return extractSentenceKeywords(cur.text, 5)
})

// Count how many extracted keywords of the current cue are saved in vocabStore
const savedVocabCountInCurrentCue = computed(() => {
  return currentCueVocab.value.filter((w) => vocabStore.hasWord(w.word)).length
})

// Extract content tokens in current cue for the interactive word chips cloud
const sentenceContentTokens = computed(() => {
  const cur = subtitleStore.currentCue
  if (!cur || !cur.text) return []
  const tokens = cur.text.trim().split(/\s+/)
  const seen = new Set()
  const res = []
  for (const t of tokens) {
    const clean = cleanWordToken(t)
    if (!clean || clean.length < 2) continue
    if (STOP_WORDS.has(clean)) continue
    if (seen.has(clean)) continue
    seen.add(clean)
    res.push({ raw: t, clean })
  }
  return res
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
