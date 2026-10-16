<template>
  <div class="h-full w-full flex flex-col items-center justify-start p-4 sm:p-6 pb-32 sm:pb-36 bg-[#fbf9f5] overflow-y-auto">
    <div class="max-w-2xl w-full space-y-4 sm:space-y-5 my-auto py-2">
      <!-- Leitner 5-box Level Indicators -->
      <div class="p-5 sm:p-6 bg-[#f5efe6] border border-[#e8ddd0] rounded-2xl space-y-2.5">
        <div class="flex items-center justify-between text-xs">
          <div class="font-medium text-stone-800 flex items-center gap-1.5">
            <BookMarked class="w-4 h-4 text-amber-700" />
            <span>艾宾浩斯复习盒</span>
          </div>
          <span class="text-[11px] font-mono text-stone-500">共 {{ activeList.length }} 词</span>
        </div>

        <div class="grid grid-cols-5 gap-1.5 font-mono text-xs">
          <button
            v-for="boxNum in 5"
            :key="boxNum"
            type="button"
            @click="selectBox(boxNum)"
            :class="[
              'min-h-[44px] min-w-[44px] py-1.5 px-1 rounded-lg text-center transition-colors touch-manipulation cursor-pointer flex items-center justify-center',
              currentBox === boxNum
                ? 'bg-amber-700 text-amber-50 font-bold shadow-sm'
                : 'bg-white/80 border border-[#e8ddd0] text-stone-700 hover:bg-[#fbf9f5]'
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
          class="perspective w-full h-64 sm:h-72 cursor-pointer select-none touch-manipulation"
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
              class="absolute inset-0 p-5 sm:p-6 bg-white/90 border border-[#e8ddd0] rounded-2xl flex flex-col items-center justify-center text-center space-y-2 backface-hidden shadow-sm"
            >
              <h3 class="font-serif font-bold text-3xl sm:text-4xl text-stone-900">
                {{ currentCard.word }}
              </h3>
              <p v-if="currentCard.phonetic" class="font-mono text-xs text-stone-500">
                {{ currentCard.phonetic }}
              </p>
              <p v-if="currentCard.contextQuote" class="text-xs text-stone-600 italic pt-3 border-t border-[#e8ddd0] max-w-sm line-clamp-2">
                "{{ currentCard.contextQuote }}"
              </p>
            </div>

            <!-- Back of Card -->
            <div
              class="absolute inset-0 p-5 sm:p-6 bg-[#faf6ee] border border-amber-500/50 rounded-2xl flex flex-col items-center justify-center text-center space-y-2.5 backface-hidden rotate-y-180 overflow-y-auto shadow-sm"
            >
              <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-medium">
                Box {{ currentCard.box || 1 }}
              </span>
              <h3 class="font-bold text-base sm:text-lg text-stone-900">
                {{ currentCard.definition }}
              </h3>
              <div class="w-full pt-1">
                <VocabDepthMeter :acquisition="currentCard.acquisition" size="full" />
              </div>
            </div>
          </div>
        </div>

        <!-- Box 5 L4 Production Guard Notice Banner -->
        <div
          v-if="l4Notice"
          role="alert"
          class="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-2 shadow-sm"
        >
          <div class="flex items-center gap-2">
            <AlertCircle class="w-4 h-4 text-amber-600 shrink-0" />
            <span>{{ l4Notice }}</span>
          </div>
          <button
            type="button"
            @click="l4Notice = ''"
            class="min-h-[44px] min-w-[44px] p-2 text-amber-700 hover:text-amber-900 flex items-center justify-center rounded-lg touch-manipulation cursor-pointer"
            aria-label="关闭提示"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Leitner Review Actions -->
        <div class="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            @click="handleForgot"
            class="min-h-[44px] px-4 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors active:scale-95 touch-manipulation cursor-pointer shadow-sm"
          >
            <X class="w-4 h-4 text-rose-700" />
            <span>没记住</span>
          </button>
          <button
            type="button"
            @click="handlePromote"
            class="min-h-[44px] px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors active:scale-95 touch-manipulation cursor-pointer shadow-sm"
          >
            <Check class="w-4 h-4" />
            <span>已掌握</span>
          </button>
        </div>

        <!-- Card Index Navigation -->
        <div class="flex items-center justify-between text-xs text-stone-500 font-mono pt-1">
          <span>卡片 {{ currentIndex + 1 }} / {{ activeList.length }}</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="currentIndex === 0"
              @click="prevCard"
              class="min-h-[44px] min-w-[44px] px-3 py-1 bg-[#fbf9f5] hover:bg-[#f2ece2] border border-[#e8ddd0] text-stone-800 rounded-xl touch-manipulation cursor-pointer disabled:opacity-40 flex items-center justify-center transition-colors"
            >
              上一张
            </button>
            <button
              type="button"
              :disabled="currentIndex >= activeList.length - 1"
              @click="nextCard"
              class="min-h-[44px] min-w-[44px] px-3 py-1 bg-[#fbf9f5] hover:bg-[#f2ece2] border border-[#e8ddd0] text-stone-800 rounded-xl touch-manipulation cursor-pointer disabled:opacity-40 flex items-center justify-center transition-colors"
            >
              下一张
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state when no words collected -->
      <div v-else class="p-5 sm:p-6 bg-[#f5efe6] border border-[#e8ddd0] rounded-2xl text-center space-y-4 shadow-sm">
        <BookMarked class="w-8 h-8 text-stone-400 mx-auto" />
        <h3 class="font-bold text-sm text-stone-800">生词本暂无待复习单词</h3>
        <p class="text-xs text-stone-600 max-w-sm mx-auto">
          在【步骤 1 精听】中点击任意英文生词，即可自动收录至此进行艾宾浩斯复习。
        </p>
        <div class="pt-1">
          <button
            type="button"
            @click="sessionStore.setStep(1)"
            class="min-h-[44px] px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-amber-50 font-bold rounded-xl text-xs inline-flex items-center justify-center gap-1.5 transition-colors touch-manipulation cursor-pointer shadow-sm"
          >
            <span>前往精听收集生词</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { BookMarked, Check, X, AlertCircle } from 'lucide-vue-next'
import { useVocabStore } from '../../stores/vocabStore.js'
import { useSessionStore } from '../../stores/sessionStore.js'
import { useGamificationStore } from '../../stores/gamificationStore.js'
import VocabDepthMeter from '../common/VocabDepthMeter.vue'

const vocabStore = useVocabStore()
const sessionStore = useSessionStore()
const gamificationStore = useGamificationStore()

const currentBox = ref(1)
const currentIndex = ref(0)
const isFlipped = ref(false)
const l4Notice = ref('')

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

function selectBox(boxNum) {
  currentBox.value = boxNum
  l4Notice.value = ''
}

function flipCard() {
  isFlipped.value = !isFlipped.value
}

function handlePromote() {
  if (!currentCard.value) return

  // 1. Mark L3 acquisition on successful active recall
  vocabStore.recordAcquisition(currentCard.value.word, 'l3')

  // 2. Attempt Leitner box promotion
  const res = vocabStore.promoteBox(currentCard.value)

  // 3. Award gamification house points & badges
  gamificationStore.awardPoints(5, '完成艾宾浩斯生词复习')
  gamificationStore.checkInDaily()
  gamificationStore.checkAndUnlockBadges({
    vocabCount: vocabStore.totalCount,
    l4Count: vocabStore.l4Count,
    streakDays: gamificationStore.streakDays
  })

  // 4. Handle Box 5 Gate Guard (NEED_L4_PRODUCTION)
  if (res && !res.promoted && res.reason === 'NEED_L4_PRODUCTION') {
    l4Notice.value = '已达 Box 4！在听写或造句跟读中正确拼写(L4)后即可晋升 Box 5 永久记忆盒。'
    return
  }

  l4Notice.value = ''
  isFlipped.value = false
  nextCard()
}

function handleForgot() {
  l4Notice.value = ''
  isFlipped.value = false
  nextCard()
}

function nextCard() {
  l4Notice.value = ''
  if (currentIndex.value < activeList.value.length - 1) {
    currentIndex.value += 1
  } else {
    currentIndex.value = 0
  }
}

function prevCard() {
  l4Notice.value = ''
  if (currentIndex.value > 0) {
    currentIndex.value -= 1
  }
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
