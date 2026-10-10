<template>
  <div class="h-full w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-white overflow-y-auto">
    <div class="max-w-2xl w-full space-y-6 my-auto">
      <!-- Cue Prompt Header -->
      <div class="p-6 bg-[#f8f8f6] border border-[#e4e4e7] rounded-2xl text-center space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#e4e4e7] text-[11px] font-mono text-[#71717a]">
          <PenTool class="w-3.5 h-3.5 text-[#2563eb]" />
          <span>盲听听写 · 第 {{ subtitleStore.activeCueIndex + 1 }} / {{ subtitleStore.cues.length || 1 }} 句</span>
        </div>
        <p class="text-xs text-[#52525b] max-w-md mx-auto leading-relaxed">
          点击下方按钮重听原声，在输入框中拼写出你听到的英文句子，按回车 (Enter) 快速校对：
        </p>
        <button
          type="button"
          @click="playSnippet"
          class="min-h-[44px] px-4 py-2 bg-white hover:bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl text-xs font-medium text-[#18181b] inline-flex items-center gap-2 transition-colors active:scale-95 touch-manipulation"
          aria-label="重听当前句子音频"
        >
          <Volume2 class="w-4 h-4 text-[#2563eb]" />
          <span>重听本句音频 (Tab 快捷键)</span>
        </button>
      </div>

      <!-- Input Area (Prevent iOS Zoom 16px font-base) -->
      <div class="space-y-3">
        <textarea
          ref="inputRef"
          v-model="userInput"
          rows="3"
          placeholder="在此键入你听到的英文句子..."
          @keydown.enter.prevent="checkDictation"
          @keydown.tab.prevent="playSnippet"
          class="w-full p-4 border border-[#e4e4e7] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded-2xl font-serif text-base sm:text-lg leading-relaxed outline-none transition-all resize-none text-[#18181b] bg-white"
          autocapitalize="none"
          autocomplete="off"
          spellcheck="false"
        ></textarea>
        <div class="flex items-center justify-between text-xs">
          <span class="text-[#71717a]">按回车 (Enter) 提交校对</span>
          <button
            type="button"
            @click="checkDictation"
            class="min-h-[44px] px-5 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-medium transition-all active:scale-95 touch-manipulation"
          >
            提交校对
          </button>
        </div>
      </div>

      <!-- Diff Comparison Card (Shown on submit) -->
      <div
        v-if="hasChecked"
        class="p-5 border border-[#e4e4e7] rounded-2xl bg-[#f8f8f6] space-y-4"
      >
        <div class="text-xs font-mono text-[#71717a] flex items-center justify-between">
          <span>拼写校对结果</span>
          <span :class="accuracyScore >= 80 ? 'text-emerald-700 font-bold' : 'text-amber-800 font-bold'">
            匹配度: {{ accuracyScore }}%
          </span>
        </div>

        <!-- Tokenized Diff -->
        <div class="p-3 bg-white border border-[#e4e4e7] rounded-xl font-serif text-base leading-relaxed select-text">
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
          <p class="font-mono text-[11px] text-[#71717a]">原著示范标音：</p>
          <p class="font-serif text-sm text-[#18181b] italic">
            "{{ targetSentence }}"
          </p>
        </div>

        <!-- Bottom Actions -->
        <div class="flex items-center justify-between pt-2 border-t border-[#e4e4e7]/60">
          <button
            type="button"
            @click="retrySentence"
            class="min-h-[44px] px-3.5 py-1.5 border border-[#e4e4e7] rounded-lg text-xs text-[#71717a] hover:text-[#18181b] hover:bg-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>重新听写</span>
          </button>
          <div class="flex items-center gap-2">
            <button
              v-if="subtitleStore.activeCueIndex < subtitleStore.cues.length - 1"
              type="button"
              @click="nextSentence"
              class="min-h-[44px] px-3.5 py-1.5 border border-[#e4e4e7] hover:bg-white rounded-lg text-xs font-medium text-[#18181b] transition-colors"
            >
              下一句
            </button>
            <button
              type="button"
              @click="sessionStore.setStep(4)"
              class="min-h-[44px] px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <span>前往词汇复习</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { PenTool, Volume2, RotateCcw, ChevronRight } from 'lucide-vue-next'
import { useSubtitleStore } from '../../stores/subtitleStore.js'
import { usePlayerStore } from '../../stores/playerStore.js'
import { useSessionStore } from '../../stores/sessionStore.js'

const subtitleStore = useSubtitleStore()
const player = usePlayerStore()
const sessionStore = useSessionStore()

const inputRef = ref(null)
const userInput = ref('')
const hasChecked = ref(false)
const diffTokens = ref([])
const accuracyScore = ref(0)

const targetSentence = computed(() => subtitleStore.currentCue?.text || '')

function playSnippet() {
  const cue = subtitleStore.currentCue
  if (cue && cue.start !== undefined) {
    player.seek(cue.start)
    player.play()
  }
}

function checkDictation() {
  const input = userInput.value.trim()
  if (!input) return

  const target = targetSentence.value.trim()
  const targetWords = target.split(/\s+/).filter(Boolean)
  const userWords = input.split(/\s+/).filter(Boolean)

  let matchedCount = 0
  const result = []

  targetWords.forEach((word, idx) => {
    const cleanTarget = word.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '')
    const userWord = userWords[idx] || ''
    const cleanUser = userWord.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '')

    const matched = cleanTarget === cleanUser
    if (matched) matchedCount++
    result.push({
      text: word,
      matched
    })
  })

  diffTokens.value = result
  accuracyScore.value = targetWords.length > 0 ? Math.round((matchedCount / targetWords.length) * 100) : 100
  hasChecked.value = true
}

function retrySentence() {
  userInput.value = ''
  hasChecked.value = false
  diffTokens.value = []
  if (inputRef.value) inputRef.value.focus()
}

function nextSentence() {
  subtitleStore.jumpToNextCue()
  userInput.value = ''
  hasChecked.value = false
  diffTokens.value = []
  playSnippet()
}

// Reset when active cue changes
watch(
  () => subtitleStore.activeCueIndex,
  () => {
    userInput.value = ''
    hasChecked.value = false
    diffTokens.value = []
  }
)
</script>
