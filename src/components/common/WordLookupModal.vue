<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden">
      <!-- Backdrop -->
      <Transition
        appear
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm"
          @click="handleClose"
          aria-hidden="true"
        ></div>
      </Transition>

      <!-- Bottom Sheet / Modal Container -->
      <div
        class="fixed inset-0 pointer-events-none flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <Transition
          appear
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="translate-y-full sm:translate-y-4 opacity-0 sm:opacity-0"
          enter-to-class="translate-y-0 opacity-100 sm:opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-full sm:translate-y-4 opacity-0"
        >
          <div
            v-if="isOpen"
            class="pointer-events-auto bg-[#fbf9f4] border-t border-x sm:border border-[#e4e4e7] rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:pb-0"
            :style="sheetStyle"
            @click.stop
            role="dialog"
            aria-modal="true"
            aria-label="单词详情"
          >
            <!-- Pull Handle (Mobile only) -->
            <div
              class="min-h-[44px] flex items-center justify-center sm:hidden cursor-grab active:cursor-grabbing touch-none shrink-0"
              @touchstart="onTouchStart"
              @touchmove="handleDragTouchMove"
              @touchend="onTouchEnd"
            >
              <div class="w-10 h-1.5 rounded-full bg-[#d4d4d8]"></div>
            </div>

            <!-- Header -->
            <div
              class="px-5 py-4 border-b border-[#e4e4e7] bg-white flex items-start justify-between gap-3 shrink-0 select-none"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h2 class="font-serif text-2xl sm:text-3xl font-bold text-[#18181b] tracking-tight break-words">
                    {{ wordData?.word || word }}
                  </h2>

                  <!-- Pronunciation button -->
                  <button
                    type="button"
                    @click="playPronunciation"
                    class="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-[#e4e4e7] flex items-center justify-center transition-colors cursor-pointer text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] active:scale-95"
                    :class="{ 'bg-amber-50 text-amber-800 border-amber-300': isPlayingAudio }"
                    aria-label="朗读发音"
                  >
                    <Volume2 class="w-5 h-5" :class="{ 'animate-pulse': isPlayingAudio }" />
                  </button>
                </div>

                <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                  <!-- Phonetic IPA -->
                  <span
                    v-if="wordData?.phonetic"
                    class="text-stone-500 font-mono text-sm"
                  >
                    {{ wordData.phonetic }}
                  </span>

                  <!-- Exam tag badge -->
                  <span
                    v-if="wordData?.tag"
                    class="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
                  >
                    {{ wordData.tag }}
                  </span>

                  <!-- POS badge -->
                  <span
                    v-if="wordData?.pos"
                    class="px-2 py-0.5 rounded text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200"
                  >
                    {{ wordData.pos }}
                  </span>
                </div>
              </div>

              <!-- Close button -->
              <button
                type="button"
                @click="handleClose"
                class="min-h-[44px] min-w-[44px] p-2 rounded-xl text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="关闭单词弹窗"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Content Area -->
            <div
              ref="scrollContainerRef"
              class="flex-1 overflow-y-auto p-5 space-y-4 ios-scroll"
              @touchstart="onTouchStart"
              @touchmove="handleContentTouchMove"
              @touchend="onTouchEnd"
            >
              <!-- Definition Card -->
              <div class="p-4 bg-white border border-[#e4e4e7] rounded-xl space-y-1.5">
                <div class="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  释义
                </div>
                <div class="text-base font-medium text-[#18181b] leading-relaxed">
                  <span v-if="wordData?.pos" class="font-bold text-amber-800 mr-1.5">{{ wordData.pos }}</span>
                  <span>{{ wordData?.definition || '暂无释义' }}</span>
                </div>
              </div>

              <!-- Context Quote Card -->
              <div
                v-if="contextQuote"
                class="p-4 bg-[#f7f3ed] border border-[#e8ddd0] rounded-xl space-y-1.5"
              >
                <div class="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  原著例句语境
                </div>
                <p class="text-sm font-serif text-[#1e1610] leading-relaxed italic">
                  "{{ contextQuote }}"
                </p>
              </div>
            </div>

            <!-- Footer: Vocab Toggle Button -->
            <div class="p-5 border-t border-[#e4e4e7] bg-white shrink-0">
              <button
                type="button"
                @click="handleToggleVocab"
                class="w-full min-h-[48px] px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] border"
                :class="isSaved
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-500 text-stone-900 border-amber-600 hover:bg-amber-400 font-semibold'"
              >
                <template v-if="isSaved">
                  <Check class="w-4 h-4 text-emerald-600" />
                  <span>已在生词本中 (点击移除)</span>
                </template>
                <template v-else>
                  <BookMarked class="w-4 h-4" />
                  <span>收录至生词本</span>
                </template>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Volume2, BookMarked, Check, X } from 'lucide-vue-next'
import { lookupWord } from '../../data/dictionaryData.js'
import { useVocabStore } from '../../stores/vocabStore.js'
import { useBottomSheet } from '../../composables/useBottomSheet.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  word: {
    type: String,
    default: ''
  },
  contextQuote: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const vocabStore = useVocabStore()
const scrollContainerRef = ref(null)
const isPlayingAudio = ref(false)

const wordData = computed(() => {
  if (!props.word) return null
  return lookupWord(props.word)
})

const isSaved = computed(() => {
  const target = wordData.value?.word || props.word
  if (!target) return false
  return vocabStore.hasWord(target)
})

function cancelAudio() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
      isPlayingAudio.value = false
    } catch (_) {}
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      cancelAudio()
    }
  }
)

function handleClose() {
  cancelAudio()
  emit('close')
}

const {
  sheetStyle,
  onTouchStart,
  onTouchMove,
  onTouchEnd
} = useBottomSheet({
  threshold: 80,
  onClose: () => handleClose()
})

function handleDragTouchMove(e) {
  onTouchMove(e, 0)
}

function handleContentTouchMove(e) {
  const st = scrollContainerRef.value ? scrollContainerRef.value.scrollTop : 0
  onTouchMove(e, st)
}

function playPronunciation() {
  const textToSpeak = wordData.value?.word || props.word
  if (!textToSpeak) return

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(textToSpeak)
      utt.lang = 'en-GB'
      utt.rate = 0.85
      isPlayingAudio.value = true
      utt.onend = () => {
        isPlayingAudio.value = false
      }
      utt.onerror = () => {
        isPlayingAudio.value = false
      }
      window.speechSynthesis.speak(utt)
    } catch (e) {
      isPlayingAudio.value = false
    }
  }
}

function handleToggleVocab() {
  if (!wordData.value && !props.word) return
  const item = wordData.value || { word: props.word }
  vocabStore.toggleWord(item, props.contextQuote)
}

function handleKeyDown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    handleClose()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onBeforeUnmount(() => {
  cancelAudio()
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown)
  }
})
</script>
