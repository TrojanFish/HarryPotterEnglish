<template>
  <div class="h-full w-full flex flex-col items-center justify-start p-4 sm:p-6 pb-32 sm:pb-36 bg-white overflow-y-auto">
    <div class="max-w-2xl w-full space-y-4 sm:space-y-5 my-auto py-2">

      <!-- Header & Game Mode Switcher -->
      <div class="p-5 sm:p-6 bg-[#f8f8f6] border border-[#e4e4e7] rounded-2xl space-y-3.5">
        <!-- Top bar: sentence index & game badge -->
        <div class="flex items-center justify-between">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e4e4e7] text-[11px] font-mono text-[#71717a]">
            <Gamepad2 class="w-3.5 h-3.5 text-[#2563eb]" />
            <span>{{ cueNumber }} / {{ subtitleStore.cues.length || 1 }} 句</span>
          </div>

          <!-- Combo Badge -->
          <div
            v-if="comboCount > 1"
            class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-mono font-semibold text-[#2563eb]"
          >
            <Sparkles class="w-3 h-3 text-[#2563eb]" />
            <span>{{ comboCount }} 连胜</span>
          </div>
        </div>

        <!-- 3-Tier Game Mode Tabs -->
        <div class="grid grid-cols-3 gap-1.5 p-1 bg-white border border-[#e4e4e7] rounded-xl text-xs">
          <button
            type="button"
            @click="switchMode('scramble')"
            :class="[
              'min-h-[44px] py-2 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              activeMode === 'scramble'
                ? 'bg-[#18181b] text-white'
                : 'text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5]'
            ]"
          >
            <Puzzle class="w-3.5 h-3.5" />
            <span>词块拼图</span>
          </button>

          <button
            type="button"
            @click="switchMode('cloze')"
            :class="[
              'min-h-[44px] py-2 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              activeMode === 'cloze'
                ? 'bg-[#18181b] text-white'
                : 'text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5]'
            ]"
          >
            <PenLine class="w-3.5 h-3.5" />
            <span>重点挖空</span>
          </button>

          <button
            type="button"
            @click="switchMode('full')"
            :class="[
              'min-h-[44px] py-2 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              activeMode === 'full'
                ? 'bg-[#18181b] text-white'
                : 'text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5]'
            ]"
          >
            <FileText class="w-3.5 h-3.5" />
            <span>全句精听</span>
          </button>
        </div>

        <!-- Audio Snippet Controller (Single sentence loop guard) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <p class="text-xs text-[#71717a] leading-relaxed">
            {{ modeDescription }}
          </p>

          <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <!-- Normal 1.0x Snippet -->
            <button
              type="button"
              @click="togglePlaySnippet(1.0)"
              :class="[
                'flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer',
                isPlayingSnippet && currentSnippetRate === 1.0
                  ? 'bg-blue-50 border-[#2563eb] text-[#2563eb]'
                  : 'bg-white border-[#e4e4e7] hover:bg-[#f4f4f5] text-[#18181b]'
              ]"
              aria-label="播放原声单句"
            >
              <Volume2 :class="['w-4 h-4 text-[#2563eb]', isPlayingSnippet && currentSnippetRate === 1.0 ? 'animate-pulse' : '']" />
              <span>单句原速</span>
            </button>

            <!-- Slow 0.8x Snippet -->
            <button
              type="button"
              @click="togglePlaySnippet(0.8)"
              :class="[
                'flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer',
                isPlayingSnippet && currentSnippetRate === 0.8
                  ? 'bg-blue-50 border-[#2563eb] text-[#2563eb]'
                  : 'bg-white border-[#e4e4e7] hover:bg-[#f4f4f5] text-[#18181b]'
              ]"
              aria-label="0.8x 慢放辨音"
            >
              <RotateCcw :class="['w-4 h-4 text-[#2563eb]', isPlayingSnippet && currentSnippetRate === 0.8 ? 'animate-spin' : '']" />
              <span>0.8x 慢放</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- GAME 1: WORD SCRAMBLE (入门难度: 词块拼图)               -->
      <!-- ========================================================= -->
      <div v-if="activeMode === 'scramble'" class="space-y-4">
        <!-- Answer Construction Area -->
        <div class="p-5 sm:p-6 bg-white border border-[#e4e4e7] rounded-2xl min-h-[96px] space-y-2">
          <div class="text-[11px] font-mono text-[#a1a1aa] flex items-center justify-between">
            <span>点击词块组装句子：</span>
            <button
              v-if="scramblePlaced.length > 0 && !hasChecked"
              type="button"
              @click="resetScramble"
              class="text-xs text-[#71717a] hover:text-[#18181b] underline cursor-pointer"
            >
              清空
            </button>
          </div>

          <!-- Assembled word tiles -->
          <div class="flex flex-wrap gap-2 min-h-[44px] items-center">
            <span
              v-if="scramblePlaced.length === 0"
              class="text-xs text-[#a1a1aa] italic"
            >
              点选下方词块...
            </span>
            <button
              v-for="(tok, idx) in scramblePlaced"
              :key="tok.uid"
              type="button"
              @click="unplaceToken(idx)"
              :disabled="hasChecked"
              class="min-h-[44px] px-3.5 py-2 bg-[#f4f4f5] hover:bg-[#e4e4e7] border border-[#e4e4e7] rounded-xl text-sm font-serif text-[#18181b] flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:cursor-default"
            >
              <span>{{ tok.raw }}</span>
              <X v-if="!hasChecked" class="w-3 h-3 text-[#71717a]" />
            </button>
          </div>
        </div>

        <!-- Available Token Bank -->
        <div class="p-5 sm:p-6 bg-[#f8f8f6] border border-[#e4e4e7] rounded-2xl space-y-2">
          <div class="text-[11px] font-mono text-[#71717a]">
            候选词块：
          </div>

          <div class="flex flex-wrap gap-2 min-h-[44px]">
            <button
              v-for="tok in unplacedTokens"
              :key="tok.uid"
              type="button"
              @click="placeToken(tok)"
              :disabled="hasChecked"
              class="min-h-[44px] px-3.5 py-2 bg-white hover:bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl text-sm font-serif text-[#18181b] cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              {{ tok.raw }}
            </button>
          </div>
        </div>

        <!-- Action Bar -->
        <div class="flex items-center justify-end">
          <button
            type="button"
            @click="checkScramble"
            :disabled="scramblePlaced.length === 0 || hasChecked"
            class="min-h-[44px] px-6 py-2.5 bg-[#2563eb] hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-medium transition-all active:scale-95 cursor-pointer"
          >
            提交
          </button>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- GAME 2: CLOZE KEY WORDS (进阶难度: 重点词挖空)            -->
      <!-- ========================================================= -->
      <div v-if="activeMode === 'cloze'" class="space-y-4">
        <div class="p-5 sm:p-6 bg-white border border-[#e4e4e7] rounded-2xl space-y-4">
          <div class="text-[11px] font-mono text-[#a1a1aa] flex items-center justify-between">
            <span>补全生词：</span>
            <button
              type="button"
              @click="showClozeHint = !showClozeHint"
              class="text-xs text-[#2563eb] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle class="w-3.5 h-3.5" />
              <span>{{ showClozeHint ? '隐藏' : '提示' }}</span>
            </button>
          </div>

          <!-- Sentence with interactive input blanks -->
          <div class="font-serif text-base sm:text-lg leading-loose text-[#18181b]">
            <template v-for="(tok, idx) in clozeTokens" :key="idx">
              <span v-if="!tok.isBlank" class="mr-1.5">{{ tok.raw }}</span>
              <span v-else class="inline-block mr-1.5 align-middle">
                <input
                  v-model="clozeInputs[tok.blankIndex]"
                  type="text"
                  :placeholder="showClozeHint ? `${tok.clean[0]}...` : '____'"
                  :disabled="hasChecked"
                  class="min-h-[44px] px-2.5 py-1 text-center font-serif text-base bg-[#f8f8f6] border border-[#e4e4e7] focus:border-[#2563eb] focus:bg-white rounded-lg outline-none w-28 text-[#18181b]"
                  autocapitalize="none"
                  autocomplete="off"
                  spellcheck="false"
                  @keydown.enter="checkCloze"
                />
              </span>
            </template>
          </div>
        </div>

        <!-- Action Bar -->
        <div class="flex items-center justify-end">
          <button
            type="button"
            @click="checkCloze"
            :disabled="hasChecked"
            class="min-h-[44px] px-6 py-2.5 bg-[#2563eb] hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-medium transition-all active:scale-95 cursor-pointer"
          >
            提交
          </button>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- GAME 3: FULL DICTATION (大师难度: 全句精听)               -->
      <!-- ========================================================= -->
      <div v-if="activeMode === 'full'" class="space-y-3">
        <textarea
          ref="inputRef"
          v-model="userInput"
          rows="3"
          placeholder="盲听单句原声，键入完整英文句子..."
          :disabled="hasChecked"
          @keydown.enter.prevent="checkFullDictation"
          class="w-full p-4 border border-[#e4e4e7] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded-2xl font-serif text-base sm:text-lg leading-relaxed outline-none transition-all resize-none text-[#18181b] bg-white disabled:bg-[#f8f8f6]"
          autocapitalize="none"
          autocomplete="off"
          spellcheck="false"
        ></textarea>

        <div class="flex items-center justify-end">
          <button
            type="button"
            @click="checkFullDictation"
            :disabled="!userInput.trim() || hasChecked"
            class="min-h-[44px] px-6 py-2.5 bg-[#2563eb] hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-medium transition-all active:scale-95 cursor-pointer"
          >
            提交
          </button>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- RESULT EVALUATION CARD (反馈与星级评定)                   -->
      <!-- ========================================================= -->
      <div
        v-if="hasChecked"
        class="p-5 sm:p-6 border border-[#e4e4e7] rounded-2xl bg-[#f8f8f6] space-y-4"
      >
        <!-- Result Header with Stars -->
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-1.5 font-medium">
            <CheckCircle2 v-if="isAnswerCorrect" class="w-4 h-4 text-[#059669]" />
            <XCircle v-else class="w-4 h-4 text-[#dc2626]" />
            <span :class="isAnswerCorrect ? 'text-[#059669]' : 'text-[#dc2626]'">
              {{ isAnswerCorrect ? '完全正确！' : '存在差异，对照原句巩固：' }}
            </span>
          </div>

          <!-- Stars Rating -->
          <div class="flex items-center gap-1">
            <Star
              v-for="s in 3"
              :key="s"
              :class="[
                'w-4 h-4',
                s <= starRating ? 'text-[#2563eb] fill-[#2563eb]' : 'text-[#d4d4d8]'
              ]"
            />
          </div>
        </div>

        <!-- Tokenized Diff (shown in Full or when error) -->
        <div v-if="diffTokens.length > 0" class="p-3 bg-white border border-[#e4e4e7] rounded-xl font-serif text-base leading-relaxed select-text">
          <span
            v-for="(tok, idx) in diffTokens"
            :key="idx"
            :class="[
              'inline-block mr-1.5',
              tok.matched ? 'text-[#059669] font-medium' : 'text-[#dc2626] line-through decoration-1'
            ]"
          >
            {{ tok.text }}
          </span>
        </div>

        <!-- Target Standard Sentence -->
        <div class="text-xs text-[#52525b] space-y-1">
          <p class="font-serif text-sm text-[#18181b] italic">
            "{{ targetSentence }}"
          </p>
          <p v-if="subtitleStore.effectiveCue?.translation" class="text-xs text-[#71717a]">
            {{ subtitleStore.effectiveCue.translation }}
          </p>
        </div>

        <!-- Bottom Controls: Retry / Next Sentence -->
        <div class="flex items-center justify-between pt-2 border-t border-[#e4e4e7]/60">
          <button
            type="button"
            @click="retryCurrentSentence"
            class="min-h-[44px] px-3.5 py-1.5 border border-[#e4e4e7] rounded-lg text-xs text-[#71717a] hover:text-[#18181b] hover:bg-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>重练</span>
          </button>

          <div class="flex items-center gap-2">
            <button
              v-if="subtitleStore.activeCueIndex < subtitleStore.cues.length - 1"
              type="button"
              @click="nextSentence"
              class="min-h-[44px] px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
            >
              <span>下一句</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="sessionStore.setStep(4)"
              class="min-h-[44px] px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>词汇复习</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  Gamepad2,
  Puzzle,
  PenLine,
  FileText,
  Volume2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Star,
  Sparkles,
  HelpCircle,
  X,
  ChevronRight
} from 'lucide-vue-next'
import { useSubtitleStore } from '../../stores/subtitleStore.js'
import { usePlayerStore } from '../../stores/playerStore.js'
import { useSessionStore } from '../../stores/sessionStore.js'

const subtitleStore = useSubtitleStore()
const player = usePlayerStore()
const sessionStore = useSessionStore()

// Game mode selection: 'scramble' | 'cloze' | 'full'
const activeMode = ref('scramble')

// Gameplay state
const hasChecked = ref(false)
const isAnswerCorrect = ref(false)
const starRating = ref(0)
const comboCount = ref(0)
const retryAttempts = ref(0)

// Audio Snippet playback control
const isPlayingSnippet = ref(false)
const currentSnippetRate = ref(1.0)

// Game 1: Word Scramble
const scramblePool = ref([])
const scramblePlaced = ref([])

// Game 2: Cloze Key Words
const clozeTokens = ref([])
const clozeInputs = ref([])
const showClozeHint = ref(false)

// Game 3: Full Dictation
const inputRef = ref(null)
const userInput = ref('')
const diffTokens = ref([])

const cueNumber = computed(() => subtitleStore.effectiveCueIndex + 1)
const targetSentence = computed(() => subtitleStore.effectiveCue?.text || '')

const modeDescription = computed(() => {
  switch (activeMode.value) {
    case 'scramble':
      return '入门：听原声将散落词块按语序重排拼装'
    case 'cloze':
      return '进阶：听原声拼写补全句子核心关键生词'
    case 'full':
      return '大师：纯盲听听写全句，考查精细辨音'
    default:
      return ''
  }
})

// Unplaced tokens in scramble mode
const unplacedTokens = computed(() => {
  const placedUids = new Set(scramblePlaced.value.map((t) => t.uid))
  return scramblePool.value.filter((t) => !placedUids.has(t.uid))
})

// Clean word utility
function cleanWord(str) {
  return (str || '').toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '')
}

// Single-sentence audio toggle
function togglePlaySnippet(rate = 1.0) {
  const cue = subtitleStore.effectiveCue
  if (!cue || cue.start === undefined) return

  if (isPlayingSnippet.value && currentSnippetRate.value === rate) {
    player.pause()
    isPlayingSnippet.value = false
    return
  }

  currentSnippetRate.value = rate
  player.setPlaybackRate(rate)
  isPlayingSnippet.value = true
  player.seek(cue.start)
  player.play()
}

// Single-sentence loop cutoff watcher: strictly pause when reaching cue.end - 0.15s
watch(
  () => player.currentTime,
  (t) => {
    const cue = subtitleStore.effectiveCue
    if (
      isPlayingSnippet.value &&
      cue?.end !== undefined &&
      t >= cue.end - 0.15
    ) {
      player.pause()
      isPlayingSnippet.value = false
    }
  }
)

watch(
  () => player.isPlaying,
  (playing) => {
    if (!playing) isPlayingSnippet.value = false
  }
)

// Setup Game 1: Word Scramble
function initScramble() {
  const sentence = targetSentence.value.trim()
  if (!sentence) {
    scramblePool.value = []
    scramblePlaced.value = []
    return
  }
  const rawWords = sentence.split(/\s+/).filter(Boolean)
  const tokens = rawWords.map((word, idx) => ({
    uid: `tok-${idx}-${word}`,
    raw: word,
    clean: cleanWord(word),
    targetIdx: idx
  }))

  // Shuffle tokens
  const shuffled = [...tokens].sort(() => Math.random() - 0.5)
  scramblePool.value = shuffled
  scramblePlaced.value = []
}

function placeToken(tok) {
  if (hasChecked.value) return
  scramblePlaced.value.push(tok)
}

function unplaceToken(idx) {
  if (hasChecked.value) return
  scramblePlaced.value.splice(idx, 1)
}

function resetScramble() {
  scramblePlaced.value = []
}

function checkScramble() {
  const targetWords = targetSentence.value.trim().split(/\s+/).filter(Boolean)
  const isLengthMatch = scramblePlaced.value.length === targetWords.length
  let allMatch = isLengthMatch

  if (isLengthMatch) {
    for (let i = 0; i < targetWords.length; i++) {
      if (cleanWord(scramblePlaced.value[i].raw) !== cleanWord(targetWords[i])) {
        allMatch = false
        break
      }
    }
  }

  isAnswerCorrect.value = allMatch
  hasChecked.value = true
  evaluateStarRating(allMatch)
}

// Setup Game 2: Cloze Key Words
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'of', 'in', 'to', 'is', 'was', 'it', 'on',
  'at', 'by', 'as', 'he', 'she', 'his', 'her', 'they', 'them', 'for', 'with', 'that'
])

function initCloze() {
  const sentence = targetSentence.value.trim()
  if (!sentence) {
    clozeTokens.value = []
    clozeInputs.value = []
    return
  }

  const rawWords = sentence.split(/\s+/).filter(Boolean)
  // Identify candidates for blanking
  const candidates = []
  rawWords.forEach((word, idx) => {
    const clean = cleanWord(word)
    if (clean.length >= 4 && !STOPWORDS.has(clean)) {
      candidates.push(idx)
    }
  })

  // Pick up to 2 blanks
  const chosenIndices = new Set()
  if (candidates.length > 0) {
    const shuffled = [...candidates].sort(() => Math.random() - 0.5)
    chosenIndices.add(shuffled[0])
    if (shuffled.length > 2) chosenIndices.add(shuffled[1])
  } else if (rawWords.length > 0) {
    chosenIndices.add(0)
  }

  let blankCounter = 0
  const tokens = []
  const inputs = []

  rawWords.forEach((word, idx) => {
    const isBlank = chosenIndices.has(idx)
    if (isBlank) {
      tokens.push({
        raw: word,
        clean: cleanWord(word),
        isBlank: true,
        blankIndex: blankCounter
      })
      inputs.push('')
      blankCounter++
    } else {
      tokens.push({
        raw: word,
        clean: cleanWord(word),
        isBlank: false
      })
    }
  })

  clozeTokens.value = tokens
  clozeInputs.value = inputs
  showClozeHint.value = false
}

function checkCloze() {
  let allCorrect = true
  clozeTokens.value.forEach((tok) => {
    if (tok.isBlank) {
      const userInputVal = cleanWord(clozeInputs.value[tok.blankIndex])
      if (userInputVal !== tok.clean) {
        allCorrect = false
      }
    }
  })

  isAnswerCorrect.value = allCorrect
  hasChecked.value = true
  evaluateStarRating(allCorrect)
}

// Setup Game 3: Full Dictation
function checkFullDictation() {
  const input = userInput.value.trim()
  if (!input) return

  const target = targetSentence.value.trim()
  const targetWords = target.split(/\s+/).filter(Boolean)
  const userWords = input.split(/\s+/).filter(Boolean)

  let matchedCount = 0
  const result = []

  targetWords.forEach((word, idx) => {
    const cleanTarget = cleanWord(word)
    const userWord = userWords[idx] || ''
    const cleanUser = cleanWord(userWord)

    const matched = cleanTarget === cleanUser
    if (matched) matchedCount++
    result.push({
      text: word,
      matched
    })
  })

  diffTokens.value = result
  const perfect = matchedCount === targetWords.length
  isAnswerCorrect.value = perfect
  hasChecked.value = true
  evaluateStarRating(perfect)
}

// Backward-compatible alias
function checkDictation() {
  checkFullDictation()
}

function evaluateStarRating(correct) {
  if (correct) {
    if (retryAttempts.value === 0 && !showClozeHint.value) {
      starRating.value = 3
    } else if (retryAttempts.value <= 1) {
      starRating.value = 2
    } else {
      starRating.value = 1
    }
    comboCount.value++
  } else {
    starRating.value = 0
    comboCount.value = 0
  }
}

function switchMode(mode) {
  activeMode.value = mode
  resetCurrentGameState()
}

function resetCurrentGameState() {
  hasChecked.value = false
  isAnswerCorrect.value = false
  diffTokens.value = []
  userInput.value = ''
  retryAttempts.value = 0

  if (activeMode.value === 'scramble') {
    initScramble()
  } else if (activeMode.value === 'cloze') {
    initCloze()
  }
}

function retryCurrentSentence() {
  hasChecked.value = false
  isAnswerCorrect.value = false
  diffTokens.value = []
  retryAttempts.value++

  if (activeMode.value === 'scramble') {
    scramblePlaced.value = []
  } else if (activeMode.value === 'cloze') {
    clozeInputs.value = clozeInputs.value.map(() => '')
  } else if (activeMode.value === 'full') {
    userInput.value = ''
    if (inputRef.value) inputRef.value.focus()
  }
  togglePlaySnippet(1.0)
}

function nextSentence() {
  subtitleStore.jumpToNextCue()
  resetCurrentGameState()
  togglePlaySnippet(1.0)
}

// Watch cue index or sentence text to reinitialize active mode
watch(
  [() => subtitleStore.effectiveCueIndex, () => targetSentence.value],
  () => {
    resetCurrentGameState()
  },
  { immediate: true }
)

onUnmounted(() => {
  if (isPlayingSnippet.value) {
    player.pause()
    isPlayingSnippet.value = false
  }
})
</script>
