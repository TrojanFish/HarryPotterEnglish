<template>
  <div class="h-full w-full flex flex-col md:flex-row overflow-hidden bg-[#fbf9f5]">
    <!-- Left Column: Reading Subtitle Stream (Full width on mobile, 65% on desktop) -->
    <div
      ref="scrollContainerRef"
      class="flex-1 md:flex-[1.2] max-w-3xl flex flex-col min-w-0 border-r border-[#e8ddd0] overflow-y-auto p-4 sm:p-6 pb-32 sm:pb-36 space-y-3 sm:space-y-3.5"
    >
      <!-- Subtitle Control Strip -->
      <div class="flex items-center justify-between pb-3 border-b border-[#e8ddd0] text-xs text-stone-600 shrink-0">
        <span class="px-2 py-0.5 bg-[#f5efe6] rounded-md border border-[#e8ddd0] font-mono text-[11px] text-stone-700">
          共 {{ subtitleStore.cues.length }} 句
        </span>
        <button
          type="button"
          @click="toggleBlindMode"
          class="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-[#f2ece2] flex items-center justify-center transition-colors active:scale-95 touch-manipulation cursor-pointer"
          :title="player.isBlindMode ? '盲听模式开启中（点击取消模糊）' : '开启盲听模式（模糊字幕专注听力）'"
          :aria-label="player.isBlindMode ? '取消盲听模式' : '开启盲听模式'"
        >
          <EyeOff v-if="player.isBlindMode" class="w-5 h-5 text-amber-700" />
          <Eye v-else class="w-5 h-5 text-stone-500 hover:text-stone-800" />
        </button>
      </div>

      <!-- Empty state when no cues loaded -->
      <div
        v-if="subtitleStore.cues.length === 0"
        class="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500"
      >
        <BookOpen class="w-8 h-8 text-stone-400 mb-2" />
        <p class="text-sm font-medium text-stone-900">正在加载原版音频字幕...</p>
        <p class="text-xs text-stone-400 mt-1">请稍候或检查网络连接</p>
      </div>

      <!-- Cue Cards Stream -->
      <div
        v-for="(cue, idx) in subtitleStore.cues"
        :key="cue.id || idx"
        :id="'cue-' + idx"
        @click="jumpToCue(cue, idx)"
        :class="[
          'cue-card group p-4 sm:p-5 rounded-xl border transition-all cursor-pointer select-text touch-manipulation',
          idx === subtitleStore.activeCueIndex
            ? 'border-l-4 border-l-amber-600 border-[#e8ddd0] bg-amber-500/10'
            : 'border-[#e8ddd0] hover:border-amber-300 bg-white/75'
        ]"
      >
        <!-- Time and Index -->
        <div class="flex items-center justify-between text-[11px] font-mono mb-2">
          <span :class="idx === subtitleStore.activeCueIndex ? 'text-amber-800 font-semibold' : 'text-stone-400 font-mono'">
            {{ formatTime(cue.start) }} - {{ formatTime(cue.end) }} · #{{ String(idx + 1).padStart(2, '0') }}
          </span>
        </div>

        <!-- English Sentence with word-level tap (supports Blind Mode Blur) -->
        <p
          :class="[
            'text-lg sm:text-xl leading-[2.0] tracking-wide transition-all',
            idx === subtitleStore.activeCueIndex ? 'text-stone-900 font-medium font-serif' : 'text-stone-800 font-serif',
            player.isBlindMode ? 'filter blur-[7px] select-none opacity-40 group-hover:filter-none group-hover:opacity-100' : ''
          ]"
        >
          <span
            v-for="(token, tIdx) in tokenizeText(cue.text)"
            :key="tIdx"
            @click.stop="handleWordClick(token, cue.text)"
            class="token hover:text-amber-700 hover:underline cursor-pointer inline-block mr-[0.35em] transition-colors touch-manipulation"
          >{{ token }}</span>
        </p>

        <!-- Chinese Translation (supports Blind Mode Blur) -->
        <p
          v-if="cue.translation"
          :class="[
            'text-sm sm:text-base text-stone-600 mt-2 pt-2 border-t border-[#e8ddd0]/60 leading-relaxed font-sans transition-all',
            player.isBlindMode ? 'filter blur-[7px] select-none opacity-40 group-hover:filter-none group-hover:opacity-100' : ''
          ]"
        >
          {{ cue.translation }}
        </p>
      </div>
    </div>

    <!-- Right Column: Focus Insight & Word Details (Desktop only) -->
    <div class="hidden md:flex md:w-80 lg:w-72 shrink-0 flex-col p-6 bg-[#f5efe6] overflow-y-auto space-y-5">
      <!-- Section: Core Vocabulary of Current Cue -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-mono font-bold tracking-wider text-stone-800 uppercase flex items-center gap-1.5">
            <span>当前精听句核心词汇</span>
            <span
              v-if="currentCueVocab.length > 0"
              class="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-mono"
            >
              {{ currentCueVocab.length }} 词
            </span>
          </h3>

          <span
            v-if="savedVocabCountInCurrentCue > 0"
            class="text-[11px] font-mono text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300"
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
            class="group p-3.5 bg-white/80 border border-[#e8ddd0] rounded-xl hover:border-amber-400 transition-colors cursor-pointer select-text touch-manipulation"
          >
            <!-- Word Header row -->
            <div class="flex items-center justify-between">
              <div class="flex items-baseline gap-2">
                <span class="font-serif font-bold text-base text-stone-900 group-hover:text-amber-800 transition-colors">
                  {{ word.word }}
                </span>
                <span v-if="word.pos" class="text-xs font-semibold text-amber-800 font-mono">
                  {{ word.pos }}
                </span>
                <span v-if="word.phonetic" class="text-xs font-mono text-stone-500">
                  {{ word.phonetic }}
                </span>
              </div>

              <!-- Action buttons row: Pronunciation + Vocab Toggle -->
              <div class="flex items-center gap-1 shrink-0" @click.stop>
                <!-- TTS Pronunciation Button -->
                <button
                  type="button"
                  @click="speakWord(word.word)"
                  class="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-[#f2ece2] text-stone-600 hover:text-stone-900 flex items-center justify-center transition-colors active:scale-95 touch-manipulation cursor-pointer"
                  title="朗读发音"
                  aria-label="朗读发音"
                >
                  <Volume2 class="w-4 h-4" />
                </button>

                <!-- One-click Vocab Toggle Button -->
                <button
                  type="button"
                  @click="toggleVocabWord(word)"
                  class="min-h-[44px] min-w-[44px] p-2 rounded-lg flex items-center justify-center transition-colors active:scale-95 touch-manipulation cursor-pointer hover:bg-[#f2ece2]"
                  :class="vocabStore.hasWord(word.word)
                    ? 'text-amber-700'
                    : 'text-stone-500 hover:text-stone-800'"
                  :title="vocabStore.hasWord(word.word) ? '已在生词本中（点击移除）' : '收录至生词本'"
                  :aria-label="vocabStore.hasWord(word.word) ? '已在生词本中' : '收录至生词本'"
                >
                  <BookmarkCheck v-if="vocabStore.hasWord(word.word)" class="w-4 h-4 text-amber-700" />
                  <BookMarked v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Definition & Tag -->
            <div class="mt-1.5 flex items-center justify-between gap-2">
              <p class="text-xs text-stone-600 leading-relaxed line-clamp-2">
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
            class="p-5 bg-white/80 border border-[#e8ddd0] rounded-xl text-center space-y-1.5"
          >
            <div class="w-8 h-8 mx-auto rounded-full bg-[#f5efe6] flex items-center justify-center text-amber-700">
              <Sparkles class="w-4 h-4 text-amber-700" />
            </div>
            <p class="text-xs font-medium text-stone-900">本句为基础短句，无难点生词</p>
            <p class="text-[11px] text-stone-500">
              点击左侧字幕中的任意单词，即可随时呼出词典查词与收录
            </p>
          </div>
        </div>
      </div>

      <!-- Section: Sentence Content Word Chips Cloud -->
      <div v-if="sentenceContentTokens.length > 0">
        <h3 class="text-xs font-mono font-bold tracking-wider text-stone-800 uppercase mb-2">
          全句单词速查
        </h3>
        <div class="p-3.5 bg-white/80 border border-[#e8ddd0] rounded-xl">
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="(chip, cIdx) in sentenceContentTokens"
              :key="cIdx"
              type="button"
              @click="handleWordClick(chip.clean, subtitleStore.currentCue?.text)"
              class="min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs font-mono rounded-lg border transition-all active:scale-95 touch-manipulation cursor-pointer flex items-center gap-1"
              :class="vocabStore.hasWord(chip.clean)
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                : 'bg-[#f5efe6] border-[#e8ddd0] text-stone-600 hover:bg-white hover:border-amber-400'"
            >
              <span>{{ chip.clean }}</span>
              <BookmarkCheck v-if="vocabStore.hasWord(chip.clean)" class="w-3 h-3 text-amber-700" />
            </button>
          </div>
        </div>
      </div>

      <!-- Section: Next Step (Shadowing) -->
      <div>
        <h3 class="text-xs font-mono font-bold tracking-wider text-stone-800 uppercase mb-2">
          下一步：进阶跟读
        </h3>
        <div class="p-4 bg-white/80 border border-[#e8ddd0] rounded-xl space-y-3">
          <p class="text-xs text-stone-600 leading-relaxed">
            听完本段录音后，点击下方按钮切换到 <strong>步骤 2 影子跟读</strong>，进行单句 A/B 录音比对练习。
          </p>
          <button
            type="button"
            @click="sessionStore.setStep(2)"
            class="w-full min-h-[44px] px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-50 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors active:scale-95 touch-manipulation cursor-pointer"
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
        class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-stone-900 text-stone-100 text-xs font-mono rounded-full border border-[#e8ddd0]/30 flex items-center gap-2 pointer-events-none"
      >
        <Sparkles class="w-3.5 h-3.5 text-amber-400" />
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
import { useAnalyticsStore } from '../../stores/analyticsStore.js'
import { useGamificationStore, formatDate } from '../../stores/gamificationStore.js'
import { extractSentenceKeywords, STOP_WORDS, cleanWordToken } from '../../data/dictionaryData.js'
import { getTagBadgeClass } from '../../utils/tagTheme.js'
import WordLookupModal from '../common/WordLookupModal.vue'

const subtitleStore = useSubtitleStore()
const player = usePlayerStore()
const vocabStore = useVocabStore()
const sessionStore = useSessionStore()
const analyticsStore = useAnalyticsStore()
const gamificationStore = useGamificationStore()

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

// Listening telemetry: accumulate playback seconds
let lastTrackedTime = player.currentTime || 0

watch(
  () => player.currentTime,
  (newTime) => {
    if (!player.isPlaying) {
      lastTrackedTime = newTime
      return
    }
    const diff = newTime - lastTrackedTime
    if (diff >= 5 && diff < 30) {
      analyticsStore.recordListeningTime(Math.round(diff))
      lastTrackedTime = newTime

      // Gamification telemetry & badges
      gamificationStore.checkInDaily()

      const todayStr = formatDate(new Date())
      const todayListening = (analyticsStore.dailyListening && analyticsStore.dailyListening[todayStr]) || 0
      const contractAlreadyAwardedToday = gamificationStore.pointHistory.some(
        (p) => p.reason === '完成每日 5 分钟听力契约' && formatDate(new Date(p.timestamp)) === todayStr
      )
      if (
        (todayListening >= 300 ||
          analyticsStore.totalListeningSeconds >= 300 ||
          gamificationStore.todayListeningSeconds >= 300) &&
        !contractAlreadyAwardedToday
      ) {
        gamificationStore.awardPoints(10, '完成每日 5 分钟听力契约')
      }

      gamificationStore.checkAndUnlockBadges({
        listeningSeconds: analyticsStore.totalListeningSeconds,
        streakDays: gamificationStore.streakDays,
        vocabCount: vocabStore.totalCount,
        l4Count: vocabStore.l4Count
      })
    } else if (diff < 0 || diff >= 30) {
      lastTrackedTime = newTime
    }
  }
)

watch(
  () => player.isPlaying,
  (playing) => {
    if (playing) {
      lastTrackedTime = player.currentTime || 0
    }
  }
)
</script>
