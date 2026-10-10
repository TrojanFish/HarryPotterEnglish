<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        @click="handleClose"
        aria-hidden="true"
      ></div>
    </Transition>

    <!-- Drawer Panel -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="isOpen"
        class="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-[#f8f8f6] border-l border-[#e4e4e7] flex flex-col"
        :style="sheetStyle"
        role="dialog"
        aria-modal="true"
        aria-label="艾宾浩斯生词本"
      >
        <!-- Pull Handle (Mobile only) -->
        <div
          class="min-h-[44px] flex items-center justify-center sm:hidden cursor-grab active:cursor-grabbing touch-none shrink-0 border-b border-[#e4e4e7] bg-white"
          @touchstart="onTouchStart"
          @touchmove="handleDragTouchMove"
          @touchend="onTouchEnd"
        >
          <div class="w-10 h-1.5 rounded-full bg-[#d4d4d8]"></div>
        </div>

        <!-- Header -->
        <div class="p-4 border-b border-[#e4e4e7] bg-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <BookMarked class="w-5 h-5 text-[#2563eb]" />
            <h2 class="font-serif text-base font-semibold text-[#18181b]">
              艾宾浩斯生词本 ({{ vocabStore.vocabList.length }})
            </h2>
          </div>

          <button
            type="button"
            @click="handleClose"
            class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="关闭生词本"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Search Input Bar -->
        <div class="p-3 border-b border-[#e4e4e7] bg-white shrink-0">
          <div class="relative flex items-center">
            <Search class="absolute left-3 w-4 h-4 text-[#71717a] pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索生词或中文释义..."
              class="w-full h-11 pl-9 pr-9 bg-[#f8f8f6] border border-[#e4e4e7] rounded-xl text-base sm:text-sm text-[#18181b] placeholder-[#a1a1aa] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-colors"
              aria-label="搜索生词本单词"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="absolute right-1.5 min-h-[44px] min-w-[44px] p-2 text-[#a1a1aa] hover:text-[#18181b] flex items-center justify-center rounded-lg transition-colors cursor-pointer"
              aria-label="清空搜索内容"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 3-Tier Action Pyramid Toolbar -->
        <div class="p-4 border-b border-[#e4e4e7] bg-white space-y-2 shrink-0">
          <!-- Primary CTA: Print A4 Cut-out Flashcards PDF -->
          <button
            type="button"
            @click="handlePrintCards"
            class="min-h-[44px] w-full py-2.5 px-4 bg-[#18181b] hover:bg-[#27272a] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Printer class="w-4 h-4" />
            <span>打印羊皮纸单词卡 (PDF)</span>
          </button>

          <!-- Secondary Actions -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="handleExportAnki"
              class="min-h-[44px] flex-1 py-2 px-3 bg-[#f4f4f5] hover:bg-[#e4e4e7] border border-[#e4e4e7] text-[#18181b] text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
            >
              <Download class="w-4 h-4 text-[#2563eb]" />
              <span>导出 Anki (TSV)</span>
            </button>

            <button
              type="button"
              @click="handleClearVocab"
              class="min-h-[44px] px-3 py-2 text-[#b91c1c] hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 class="w-4 h-4" />
              <span>清空</span>
            </button>
          </div>
        </div>

        <!-- Leitner 5-Box Distribution Tabs -->
        <div class="p-3 border-b border-[#e4e4e7] bg-white/70 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            @click="activeBox = null"
            :class="[
              'min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer',
              activeBox === null
                ? 'bg-blue-50 border-[#2563eb] text-[#2563eb]'
                : 'border-transparent text-[#71717a] hover:bg-[#f4f4f5]'
            ]"
          >
            全部 ({{ vocabStore.vocabList.length }})
          </button>

          <button
            v-for="b in 5"
            :key="b"
            type="button"
            @click="activeBox = b"
            :class="[
              'min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer',
              activeBox === b
                ? 'bg-blue-50 border-[#2563eb] text-[#2563eb]'
                : 'border-transparent text-[#71717a] hover:bg-[#f4f4f5]'
            ]"
          >
            Box {{ b }} ({{ getBoxCount(b) }})
          </button>
        </div>

        <!-- Vocabulary Cards List -->
        <div
          ref="scrollContainerRef"
          class="flex-1 overflow-y-auto p-4 space-y-3"
          @touchstart="onTouchStart"
          @touchmove="handleContentTouchMove"
          @touchend="onTouchEnd"
        >
          <div
            v-if="filteredList.length === 0"
            class="text-center py-16 text-sm text-[#71717a]"
          >
            {{ searchQuery ? '未找到匹配的生词' : '当前分类暂无生词' }}
          </div>

          <div
            v-for="item in filteredList"
            :key="item.id || item.word"
            class="p-4 bg-white border border-[#e4e4e7] rounded-xl space-y-2 hover:border-blue-300 transition-colors"
          >
            <!-- Word Header -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap min-w-0">
                <h3 class="font-serif text-base font-bold text-[#18181b] truncate">
                  {{ item.word }}
                </h3>
                <!-- Audio pronunciation button -->
                <button
                  type="button"
                  @click="playPronunciation(item.word)"
                  class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                  :aria-label="'朗读发音 ' + item.word"
                  title="朗读发音"
                >
                  <Volume2 class="w-4 h-4" />
                </button>
                <span v-if="item.phonetic || item.ipa" class="text-xs font-mono text-[#a1a1aa]">
                  {{ item.phonetic || item.ipa }}
                </span>
              </div>

              <!-- Box Pill -->
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563eb] shrink-0">
                Box {{ item.box || 1 }}
              </span>
            </div>

            <!-- Meaning -->
            <p class="text-xs text-[#52525b] font-sans">
              {{ item.definition || item.meaning || '' }}
            </p>

            <!-- Context Quote -->
            <p v-if="item.contextQuote" class="text-xs text-[#71717a] font-serif italic border-l-2 border-[#e4e4e7] pl-2 mt-1">
              "{{ item.contextQuote }}"
            </p>

            <!-- Card Actions -->
            <div class="pt-2 flex items-center justify-between border-t border-[#f4f4f5]">
              <span class="text-[10px] text-[#a1a1aa] font-mono">
                {{ getBoxInterval(item.box || 1) }}
              </span>

              <div class="flex items-center gap-1">
                <button
                  type="button"
                  @click="promoteBox(item)"
                  class="min-h-[44px] px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  title="提升至下一个记忆盒"
                >
                  熟记 +1
                </button>
                <button
                  type="button"
                  @click="deleteWord(item)"
                  class="min-h-[44px] px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="删除生词"
                >
                  移除
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useVocabStore } from '../stores/vocabStore.js'
import { generateAnkiTSV, downloadAnkiFile } from '../utils/ankiExport.js'
import { generatePrintableParchmentHTML } from '../utils/parchmentPdfGenerator.js'
import { useBottomSheet } from '../composables/useBottomSheet.js'
import {
  BookMarked,
  Printer,
  Download,
  Trash2,
  X,
  Search,
  Volume2
} from 'lucide-vue-next'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const vocabStore = useVocabStore()
const activeBox = ref(null)
const searchQuery = ref('')
const scrollContainerRef = ref(null)

function handleClose() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch (_) {}
  }
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

function playPronunciation(word) {
  if (!word) return
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(word)
      utt.lang = 'en-GB'
      utt.rate = 0.85
      window.speechSynthesis.speak(utt)
    } catch (_) {}
  }
}

const filteredList = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return vocabStore.vocabList.filter((item) => {
    if (activeBox.value !== null && (item.box || 1) !== activeBox.value) {
      return false
    }
    if (!q) return true
    const matchesWord = item.word && item.word.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesDef = (item.definition && item.definition.includes(searchQuery.value)) || (item.definition && item.definition.toLowerCase().includes(q)) || (item.meaning && item.meaning.toLowerCase().includes(q))
    return Boolean(matchesWord || matchesDef)
  })
})

function getBoxCount(boxNum) {
  return vocabStore.vocabList.filter((item) => (item.box || 1) === boxNum).length
}

function getBoxInterval(box) {
  const map = { 1: '1天复习', 2: '3天复习', 3: '7天复习', 4: '14天复习', 5: '30天复习' }
  return map[box] || '1天复习'
}

function promoteBox(item) {
  vocabStore.promoteBox(item)
}

function deleteWord(item) {
  vocabStore.deleteWord(item)
}

function handleClearVocab() {
  if (typeof window !== 'undefined' && window.confirm('确认清空生词本中的所有单词吗？此操作无法撤销。')) {
    vocabStore.clearAll()
  }
}

function handleExportAnki() {
  const tsv = generateAnkiTSV(vocabStore.vocabList, { deckName: 'Hogwarts Magic English' })
  downloadAnkiFile(tsv, 'hogwarts_anki_deck.tsv')
}

function handlePrintCards() {
  const html = generatePrintableParchmentHTML(vocabStore.vocabList, {
    title: '霍格沃茨魔法生词卡 (A4 可剪裁打印版)'
  })
  if (typeof window !== 'undefined') {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }
}

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch (_) {}
  }
})
</script>
