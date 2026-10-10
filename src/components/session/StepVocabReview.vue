<template>
  <div class="h-full w-full flex flex-col items-center justify-start p-4 sm:p-8 pb-36 sm:pb-40 bg-white overflow-y-auto">
    <div class="max-w-xl w-full space-y-6 my-auto py-2">
      <!-- Leitner 5-box Level Indicators -->
      <div class="p-4 bg-[#f8f8f6] border border-[#e4e4e7] rounded-xl space-y-2.5">
        <div class="flex items-center justify-between text-xs">
          <div class="font-medium text-[#18181b] flex items-center gap-1.5">
            <BookMarked class="w-4 h-4 text-[#2563eb]" />
            <span>艾宾浩斯 5 盒认知系统</span>
          </div>
          <span class="text-[11px] font-mono text-[#71717a]">共 {{ activeList.length }} 词</span>
        </div>

        <div class="grid grid-cols-5 gap-1.5 font-mono text-xs">
          <button
            v-for="boxNum in 5"
            :key="boxNum"
            type="button"
            @click="currentBox = boxNum"
            :class="[
              'py-1.5 px-1 rounded-lg text-center transition-colors touch-manipulation cursor-pointer',
              currentBox === boxNum
                ? 'bg-[#18181b] text-white font-medium'
                : 'bg-white border border-[#e4e4e7] text-[#71717a] hover:bg-[#f4f4f5]'
            ]"
            :title="`切换查看 Box ${boxNum}`"
          >
            B{{ boxNum }}: {{ getBoxCount(boxNum) }}
          </button>
        </div>
      </div>

      <!-- Flashcard or Empty state -->
      <div v-if="currentCard" class="space-y-4">
        <!-- 3D Flashcard Container -->
        <div
          class="perspective w-full h-64 cursor-pointer select-none"
          @click="flipCard"
        >
          <div
            :class="[
              'relative w-full h-full transition-transform duration-500 transform-style-3d',
              isFlipped ? 'rotate-y-180' : ''
            ]"
          >
            <!-- Front of Card -->
            <div
              class="absolute inset-0 p-6 sm:p-8 bg-white border border-[#e4e4e7] rounded-2xl flex flex-col items-center justify-center text-center space-y-2 backface-hidden"
            >
              <span class="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563eb] text-[10px] font-mono border border-blue-200">
                点击翻转查看释义
              </span>
              <h3 class="font-serif font-bold text-3xl sm:text-4xl text-[#18181b]">
                {{ currentCard.word }}
              </h3>
              <p v-if="currentCard.phonetic" class="font-mono text-xs text-[#71717a]">
                {{ currentCard.phonetic }}
              </p>
              <p v-if="currentCard.contextQuote" class="text-xs text-[#52525b] italic pt-3 border-t border-[#e4e4e7] max-w-sm line-clamp-2">
                "{{ currentCard.contextQuote }}"
              </p>
            </div>

            <!-- Back of Card -->
            <div
              class="absolute inset-0 p-6 sm:p-8 bg-[#f8f8f6] border border-[#2563eb] rounded-2xl flex flex-col items-center justify-center text-center space-y-3 backface-hidden rotate-y-180"
            >
              <span class="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#2563eb] text-[10px] font-mono font-medium">
                中文释义与笔记
              </span>
              <h3 class="font-bold text-lg sm:text-xl text-[#18181b]">
                {{ currentCard.definition }}
              </h3>
              <p class="text-xs text-[#52525b] leading-relaxed max-w-sm">
                当前所在学习盒：Box {{ currentCard.box || 1 }} / 5 · 连续熟记可进阶提升
              </p>
            </div>
          </div>
        </div>

        <!-- Leitner Review Actions -->
        <div class="grid grid-cols-2 gap-4">
          <button
            type="button"
            @click="handleForgot"
            class="min-h-[44px] px-4 py-3 border border-[#e4e4e7] hover:bg-[#f4f4f5] rounded-xl text-xs font-medium text-[#71717a] hover:text-[#18181b] flex items-center justify-center gap-2 transition-colors active:scale-95 touch-manipulation"
          >
            <X class="w-4 h-4 text-[#dc2626]" />
            <span>遗忘 (回退 Box 1)</span>
          </button>
          <button
            type="button"
            @click="handlePromote"
            class="min-h-[44px] px-4 py-3 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors active:scale-95 touch-manipulation"
          >
            <Check class="w-4 h-4" />
            <span>熟记 +1 (升级下一盒)</span>
          </button>
        </div>

        <!-- Card Index Navigation -->
        <div class="flex items-center justify-between text-xs text-[#71717a] pt-1">
          <span>卡片 {{ currentIndex + 1 }} / {{ activeList.length }}</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="currentIndex === 0"
              @click="prevCard"
              class="px-2 py-1 border border-[#e4e4e7] rounded hover:bg-[#f4f4f5] disabled:opacity-40"
            >
              上一张
            </button>
            <button
              type="button"
              :disabled="currentIndex >= activeList.length - 1"
              @click="nextCard"
              class="px-2 py-1 border border-[#e4e4e7] rounded hover:bg-[#f4f4f5] disabled:opacity-40"
            >
              下一张
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state when no words collected -->
      <div v-else class="p-8 bg-[#f8f8f6] border border-[#e4e4e7] rounded-2xl text-center space-y-3">
        <BookMarked class="w-8 h-8 text-[#a1a1aa] mx-auto" />
        <h3 class="font-bold text-sm text-[#18181b]">生词本暂无待复习单词</h3>
        <p class="text-xs text-[#52525b] max-w-sm mx-auto">
          在【步骤 1 精听】中点击任意英文生词，即可自动收录至此进行艾宾浩斯复习。
        </p>
      </div>

      <!-- Export Actions & Session Complete Banner -->
      <div class="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span class="font-bold text-blue-950">今日 4 步 Session 学习达成</span>
          <p class="text-[11px] text-blue-800 mt-0.5">
            总收录生词 {{ vocabStore.vocabList.length }} 词 · 支持全量导出至外部工具
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="exportAnkiTSV"
            class="min-h-[44px] px-3 py-1.5 border border-blue-200 bg-white hover:bg-blue-50 text-blue-900 rounded-lg font-medium flex items-center gap-1 transition-colors"
          >
            <Download class="w-3.5 h-3.5 text-[#2563eb]" />
            <span>Anki</span>
          </button>
          <button
            type="button"
            @click="sessionStore.setStep(1)"
            class="min-h-[44px] px-3.5 py-1.5 bg-[#2563eb] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            完成课时
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { BookMarked, Download, Check, X } from 'lucide-vue-next'
import { useVocabStore } from '../../stores/vocabStore.js'
import { useSessionStore } from '../../stores/sessionStore.js'

const vocabStore = useVocabStore()
const sessionStore = useSessionStore()

const currentBox = ref(1)
const currentIndex = ref(0)
const isFlipped = ref(false)

const activeList = computed(() => {
  return vocabStore.vocabList || []
})

const currentCard = computed(() => {
  if (activeList.value.length === 0) return null
  return activeList.value[currentIndex.value] || activeList.value[0]
})

function getBoxCount(box) {
  return (vocabStore.vocabList || []).filter(w => (w.box || 1) === box).length
}

function flipCard() {
  isFlipped.value = !isFlipped.value
}

function handlePromote() {
  if (currentCard.value) {
    vocabStore.promoteBox(currentCard.value)
  }
  isFlipped.value = false
  nextCard()
}

function handleForgot() {
  isFlipped.value = false
  nextCard()
}

function nextCard() {
  if (currentIndex.value < activeList.value.length - 1) {
    currentIndex.value += 1
  } else {
    currentIndex.value = 0
  }
}

function prevCard() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1
  }
}

function exportAnkiTSV() {
  const list = vocabStore.vocabList || []
  if (list.length === 0) return
  const tsv = list.map(item => `${item.word}\t${item.phonetic || ''}\t${item.definition}\t${item.contextQuote || ''}`).join('\n')
  const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hogwarts-vocab-anki-${Date.now()}.tsv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.perspective {
  perspective: 1000px;
}
.transform-style-3d {
  transform-style: preserve-3d;
}
.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.rotate-y-180 {
  transform: rotateY(180deg);
}
</style>
