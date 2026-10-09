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
        @click="$emit('close')"
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
        class="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-[#fbf9f5] border-l border-[#e8ddd0] shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="艾宾浩斯生词本"
      >
        <!-- Header -->
        <div class="p-4 border-b border-[#e8ddd0] flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <BookMarked class="w-5 h-5 text-[#d97706]" />
            <h2 class="font-serif text-base font-semibold text-[#1e1610]">
              艾宾浩斯生词本 ({{ vocabList.length }})
            </h2>
          </div>

          <button
            type="button"
            @click="$emit('close')"
            class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors"
            aria-label="关闭生词本"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- 3-Tier Action Pyramid Toolbar -->
        <div class="p-4 border-b border-[#e8ddd0] bg-white/60 space-y-2 shrink-0">
          <!-- Primary CTA: Print A4 Cut-out Flashcards PDF -->
          <button
            type="button"
            @click="handlePrintCards"
            class="min-h-[44px] w-full py-2.5 px-4 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Printer class="w-4 h-4" />
            <span>打印羊皮纸单词卡 (PDF)</span>
          </button>

          <!-- Secondary Actions -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="handleExportAnki"
              class="min-h-[44px] flex-1 py-2 px-3 bg-[#f4ebe1] hover:bg-[#ebdccb] border border-[#e8ddd0] text-[#1e1610] text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-95"
            >
              <Download class="w-4 h-4 text-[#d97706]" />
              <span>导出 Anki (TSV)</span>
            </button>

            <button
              type="button"
              @click="handleClearVocab"
              class="min-h-[44px] px-3 py-2 text-[#b91c1c] hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Trash2 class="w-4 h-4" />
              <span>清空</span>
            </button>
          </div>
        </div>

        <!-- Leitner 5-Box Distribution Tabs -->
        <div class="p-3 border-b border-[#e8ddd0] flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            @click="activeBox = null"
            :class="[
              'min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border',
              activeBox === null
                ? 'bg-[#d97706]/15 border-[#d97706] text-[#92400e]'
                : 'border-transparent text-[#78695d] hover:bg-[#f4ebe1]'
            ]"
          >
            全部 ({{ vocabList.length }})
          </button>

          <button
            v-for="b in 5"
            :key="b"
            type="button"
            @click="activeBox = b"
            :class="[
              'min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border',
              activeBox === b
                ? 'bg-[#d97706]/15 border-[#d97706] text-[#92400e]'
                : 'border-transparent text-[#78695d] hover:bg-[#f4ebe1]'
            ]"
          >
            Box {{ b }} ({{ getBoxCount(b) }})
          </button>
        </div>

        <!-- Vocabulary Cards List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <div
            v-if="filteredList.length === 0"
            class="text-center py-16 text-sm text-[#78695d]"
          >
            当前分类暂无生词
          </div>

          <div
            v-for="item in filteredList"
            :key="item.id || item.word"
            class="p-4 bg-white/70 border border-[#e8ddd0] rounded-xl space-y-2 hover:border-[#d97706]/40 transition-colors"
          >
            <!-- Word Header -->
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-serif text-base font-bold text-[#1e1610]">
                  {{ item.word }}
                </h3>
                <span class="text-xs font-mono text-[#a89a8c]">
                  {{ item.phonetic || item.ipa || '' }}
                </span>
              </div>

              <!-- Box Pill -->
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                Box {{ item.box || 1 }}
              </span>
            </div>

            <!-- Meaning -->
            <p class="text-xs text-[#4a3b32] font-sans">
              {{ item.definition || item.meaning || '' }}
            </p>

            <!-- Context Quote -->
            <p v-if="item.contextQuote" class="text-xs text-[#78695d] font-serif italic border-l-2 border-[#e8ddd0] pl-2 mt-1">
              "{{ item.contextQuote }}"
            </p>

            <!-- Card Actions -->
            <div class="pt-2 flex items-center justify-between border-t border-[#f4ebe1]">
              <span class="text-[10px] text-[#a89a8c] font-mono">
                {{ getBoxInterval(item.box || 1) }}
              </span>

              <div class="flex items-center gap-1">
                <button
                  type="button"
                  @click="promoteBox(item)"
                  class="min-h-[44px] px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="提升至下一个记忆盒"
                >
                  熟记 +1
                </button>
                <button
                  type="button"
                  @click="deleteWord(item)"
                  class="min-h-[44px] px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
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
import { ref, computed } from 'vue'
import { generateAnkiTSV, downloadAnkiFile } from '../utils/ankiExport.js'
import { generatePrintableParchmentHTML } from '../utils/parchmentPdfGenerator.js'
import {
  BookMarked,
  Printer,
  Download,
  Trash2,
  X
} from 'lucide-vue-next'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const STORAGE_KEY = 'hp_vocab_list'

// Initial Seed Words for Harry Potter study
const initialSeeds = [
  {
    id: 1,
    word: 'cloak',
    phonetic: '/kləʊk/',
    definition: 'n. 斗篷，披风',
    contextQuote: 'He was wearing an emerald-green cloak.',
    box: 1
  },
  {
    id: 2,
    word: 'peculiar',
    phonetic: '/pɪˈkjuːliə(r)/',
    definition: 'adj. 奇怪的，古怪的',
    contextQuote: 'It was on the corner that he noticed something peculiar.',
    box: 2
  },
  {
    id: 3,
    word: 'quill',
    phonetic: '/kwɪl/',
    definition: 'n. 羽毛笔',
    contextQuote: 'He took out a long quill and a roll of parchment.',
    box: 3
  }
]

function loadVocab() {
  if (typeof localStorage === 'undefined') return initialSeeds
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : initialSeeds
  } catch (e) {
    return initialSeeds
  }
}

const vocabList = ref(loadVocab())
const activeBox = ref(null)

function saveVocab() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vocabList.value))
  }
}

const filteredList = computed(() => {
  if (activeBox.value === null) return vocabList.value
  return vocabList.value.filter((item) => (item.box || 1) === activeBox.value)
})

function getBoxCount(boxNum) {
  return vocabList.value.filter((item) => (item.box || 1) === boxNum).length
}

function getBoxInterval(box) {
  const map = { 1: '1天复习', 2: '3天复习', 3: '7天复习', 4: '14天复习', 5: '30天复习' }
  return map[box] || '1天复习'
}

function promoteBox(item) {
  if (!item.box) item.box = 1
  if (item.box < 5) {
    item.box += 1
    saveVocab()
  }
}

function deleteWord(item) {
  vocabList.value = vocabList.value.filter((w) => w.word !== item.word)
  saveVocab()
}

function handleClearVocab() {
  if (window.confirm('确认清空生词本中的所有单词吗？此操作无法撤销。')) {
    vocabList.value = []
    saveVocab()
  }
}

function handleExportAnki() {
  const tsv = generateAnkiTSV(vocabList.value, { deckName: 'Hogwarts Magic English' })
  downloadAnkiFile(tsv, 'hogwarts_anki_deck.tsv')
}

function handlePrintCards() {
  const html = generatePrintableParchmentHTML(vocabList.value, {
    title: '霍格沃茨魔法生词卡 (A4 可剪裁打印版)'
  })
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
</script>
