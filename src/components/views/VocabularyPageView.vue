<template>
  <div class="flex-1 min-h-0 overflow-y-auto bg-[#fbf9f5] p-4 sm:p-6 lg:p-8 space-y-6 select-none font-sans">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8ddd0] pb-5">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0">
          <BookMarked class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              艾宾浩斯生词本
            </h1>
            <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {{ vocabStore.vocabList.length }} 词
            </span>
          </div>
          <p class="text-xs text-stone-500 font-reading mt-0.5">
            基于艾宾浩斯记忆遗忘曲线 · 5阶递进式精熟管理
          </p>
        </div>
      </div>

      <!-- Action Toolbar -->
      <div class="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          @click="handlePrintCards"
          class="min-h-[44px] px-4 py-2 bg-amber-700 hover:bg-amber-800 text-amber-50 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer touch-manipulation"
        >
          <Printer class="w-4 h-4" />
          <span>打印羊皮纸单词卡 (PDF)</span>
        </button>

        <button
          type="button"
          @click="handleExportAnki"
          class="min-h-[44px] px-3.5 py-2 bg-white hover:bg-[#faf6ee] border border-[#e8ddd0] text-stone-800 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer touch-manipulation"
        >
          <Download class="w-4 h-4 text-amber-700" />
          <span>导出 Anki</span>
        </button>

        <button
          type="button"
          @click="handleClearVocab"
          class="min-h-[44px] px-3 py-2 text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
        >
          <Trash2 class="w-4 h-4" />
          <span>清空生词</span>
        </button>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
      <!-- Search Input -->
      <div class="relative flex items-center">
        <Search class="absolute left-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索生词英文原型或中文释义..."
          class="w-full h-11 pl-10 pr-10 bg-white border border-[#e8ddd0] rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-200 transition-colors"
          aria-label="搜索生词本单词"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''"
          class="absolute right-2 min-h-[44px] min-w-[36px] flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer touch-manipulation"
          aria-label="清空搜索"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- CEFR Filter Pills -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span class="text-xs text-stone-500 font-medium shrink-0 mr-1">CEFR:</span>
        <button
          v-for="c in cefrTabs"
          :key="c.value"
          type="button"
          @click="activeCefr = c.value"
          :class="[
            'min-h-[36px] px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors border cursor-pointer touch-manipulation active:scale-95',
            activeCefr === c.value
              ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
              : 'border-[#e8ddd0] bg-white text-stone-600 hover:bg-[#faf6ee]'
          ]"
        >
          {{ c.label }}
        </button>
      </div>
    </div>

    <!-- Leitner 5-Box Distribution Tabs -->
    <div class="p-3 bg-[#f5efe6] border border-[#e8ddd0] rounded-2xl flex items-center gap-2 overflow-x-auto no-scrollbar">
      <button
        type="button"
        @click="activeBox = null"
        :class="[
          'min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer touch-manipulation active:scale-95',
          activeBox === null
            ? 'bg-amber-700 text-amber-50 font-bold border-amber-800 shadow-sm'
            : 'border-[#e8ddd0] bg-white/80 text-stone-700 hover:bg-white'
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
          'min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer touch-manipulation active:scale-95 flex items-center gap-1.5',
          activeBox === b
            ? 'bg-amber-700 text-amber-50 font-bold border-amber-800 shadow-sm'
            : 'border-[#e8ddd0] bg-white/80 text-stone-700 hover:bg-white'
        ]"
      >
        <span>Box {{ b }}</span>
        <span :class="[activeBox === b ? 'bg-amber-800 text-amber-100' : 'bg-stone-100 text-stone-600', 'text-[10px] px-1.5 py-0.2 rounded-full font-mono']">
          {{ getBoxCount(b) }}
        </span>
      </button>
    </div>

    <!-- Box Guard Alert Notice -->
    <div
      v-if="boxGuardAlert"
      class="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2 transition-all animate-pulse"
      role="alert"
    >
      <AlertCircle class="w-4 h-4 text-amber-700 shrink-0" />
      <span>{{ boxGuardAlert }}</span>
    </div>

    <!-- Empty State -->
    <div
      v-if="filteredList.length === 0"
      class="py-16 text-center space-y-3 bg-white/70 border border-[#e8ddd0] rounded-2xl p-6"
    >
      <div class="w-12 h-12 mx-auto rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
        <BookMarked class="w-6 h-6" />
      </div>
      <p class="font-serif text-sm font-semibold text-stone-800">
        {{ searchQuery ? '未找到符合条件的生词' : '生词本当前为空' }}
      </p>
      <p class="text-xs text-stone-500 max-w-sm mx-auto">
        {{ searchQuery ? '请尝试输入其他单词原型或缩短搜索关键词。' : '在原版精听或 TED 演讲伴读时，轻点任意单词即可随时收藏至生词本！' }}
      </p>
    </div>

    <!-- Words Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="item in filteredList"
        :key="item.word"
        class="p-4 bg-white border border-[#e8ddd0] rounded-2xl space-y-3 hover:border-amber-400 transition-colors shadow-none flex flex-col justify-between"
      >
        <div class="space-y-2">
          <!-- Top Row: Word & Actions -->
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-baseline gap-2">
                <span class="font-serif font-bold text-lg text-stone-900">{{ item.word }}</span>
                <span v-if="item.phonetic" class="text-xs font-mono text-stone-500">{{ item.phonetic }}</span>
              </div>
            </div>

            <!-- Badges -->
            <div class="flex items-center gap-1 shrink-0 flex-wrap justify-end">
              <span
                v-if="resolveCefr(item)"
                :class="['text-[10px] font-mono px-1.5 py-0.5 rounded border', getCefrBadgeClass(resolveCefr(item))]"
              >
                {{ resolveCefr(item) }}
              </span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#e8ddd0] bg-[#faf6ee] text-stone-700">
                {{ resolveTag(item) }}
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                Box {{ item.box || 1 }}
              </span>
            </div>
          </div>

          <!-- Vocab Depth Meter -->
          <VocabDepthMeter :word="item.word" />

          <!-- Definition -->
          <p class="text-xs text-stone-700 leading-relaxed font-sans">
            {{ item.definition }}
          </p>

          <!-- Context Quote -->
          <p
            v-if="item.contextQuote"
            class="text-xs text-stone-600 font-serif italic border-l-2 border-amber-400 pl-2.5 mt-2 bg-[#faf6ee]/50 py-1 rounded-r"
          >
            "{{ item.contextQuote }}"
          </p>
        </div>

        <!-- Card Footer Actions -->
        <div class="pt-3 border-t border-[#e8ddd0] flex items-center justify-between text-xs gap-2">
          <!-- Audio Pronunciation -->
          <button
            type="button"
            @click="playWordAudio(item.word)"
            class="min-h-[44px] min-w-[44px] p-2 text-stone-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg flex items-center justify-center transition-colors touch-manipulation cursor-pointer"
            :title="`朗读 ${item.word}`"
            :aria-label="`朗读 ${item.word}`"
          >
            <Volume2 class="w-4 h-4" />
          </button>

          <div class="flex items-center gap-1.5">
            <!-- Box 5 Promotion -->
            <button
              v-if="(item.box || 1) < 5"
              type="button"
              @click="handlePromoteBox(item.word)"
              class="min-h-[44px] px-3 py-1.5 rounded-lg border border-[#e8ddd0] bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 text-xs font-medium flex items-center gap-1 transition-colors active:scale-95 cursor-pointer touch-manipulation"
              title="熟练度进阶至下一盒"
            >
              <span>熟记 +1</span>
            </button>
            <span
              v-else
              class="px-2 py-1 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
            >
              已精通
            </span>

            <!-- Delete Button -->
            <button
              type="button"
              @click="handleRemoveWord(item.word)"
              class="min-h-[44px] px-2.5 py-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer touch-manipulation text-xs"
              title="从生词本移除"
            >
              移除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVocabStore } from '../../stores/vocabStore.js'
import { lookupWord, getCefrLevel } from '../../data/dictionaryData.js'
import { getTagBadgeClass } from '../../utils/tagTheme.js'
import { generateAnkiTSV, downloadAnkiFile } from '../../utils/ankiExport.js'
import { generatePrintableParchmentHTML } from '../../utils/parchmentPdfGenerator.js'
import VocabDepthMeter from '../common/VocabDepthMeter.vue'
import {
  BookMarked,
  Printer,
  Download,
  Trash2,
  X,
  Search,
  Volume2,
  AlertCircle
} from 'lucide-vue-next'

const vocabStore = useVocabStore()
const activeBox = ref(null)
const activeCefr = ref('all')
const searchQuery = ref('')
const boxGuardAlert = ref('')
let guardTimer = null

const cefrTabs = [
  { label: '全部', value: 'all' },
  { label: 'A1/A2', value: 'A1/A2' },
  { label: 'B1/B2', value: 'B1/B2' },
  { label: 'C1/C2', value: 'C1' }
]

function resolveTag(item) {
  if (item.tag) return item.tag
  const lookedUp = lookupWord(item.word)
  return lookedUp?.tag || '拓展生词'
}

function resolveCefr(item) {
  if (item.cefrLevel) return item.cefrLevel
  return getCefrLevel(item.word, resolveTag(item))
}

function getCefrBadgeClass(level) {
  if (level === 'A1' || level === 'A2') {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  }
  if (level === 'B1' || level === 'B2') {
    return 'bg-amber-50 text-amber-900 border-amber-300'
  }
  return 'bg-purple-50 text-purple-800 border-purple-200'
}

function getBoxCount(boxNum) {
  return vocabStore.vocabList.filter((item) => (item.box || 1) === boxNum).length
}

const filteredList = computed(() => {
  return vocabStore.vocabList.filter((item) => {
    if (activeBox.value !== null && (item.box || 1) !== activeBox.value) {
      return false
    }

    if (activeCefr.value !== 'all') {
      const level = resolveCefr(item)
      if (activeCefr.value === 'A1/A2' && level !== 'A1' && level !== 'A2') return false
      if (activeCefr.value === 'B1/B2' && level !== 'B1' && level !== 'B2') return false
      if (activeCefr.value === 'C1' && level !== 'C1' && level !== 'C2') return false
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const matchWord = item.word.toLowerCase().includes(q)
      const matchDef = (item.definition || '').toLowerCase().includes(q)
      return matchWord || matchDef
    }

    return true
  })
})

function handlePromoteBox(word) {
  const result = vocabStore.promoteBox(word)
  if (result && result.blocked) {
    boxGuardAlert.value = result.reason || 'Box 5 为永久精通关卡，需通过拼写听写解锁 L4 深度！'
    clearTimeout(guardTimer)
    guardTimer = setTimeout(() => {
      boxGuardAlert.value = ''
    }, 4000)
  }
}

function handleRemoveWord(word) {
  vocabStore.removeWord(word)
}

function handleClearVocab() {
  if (typeof window !== 'undefined' && !window.confirm('确定要清空生词本中的所有单词吗？此操作无法撤销。')) {
    return
  }
  vocabStore.clearAll()
}

function playWordAudio(word) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-GB'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

function handleExportAnki() {
  const tsv = generateAnkiTSV(vocabStore.vocabList)
  downloadAnkiFile(tsv, 'Hogwarts_Vocabulary_Deck.txt')
}

function handlePrintCards() {
  const html = generatePrintableParchmentHTML(vocabStore.vocabList)
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}
</script>
