<template>
  <Teleport to="body" :disabled="isDesktop">
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
        class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        @click="handleClose"
        aria-hidden="true"
      ></div>
    </Transition>

    <!-- Drawer Panel / Desktop Sub-sidebar -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="isOpen"
        class="fixed top-0 left-0 bottom-0 z-50 w-full max-w-lg lg:max-w-[380px] xl:max-w-[420px] lg:static lg:z-auto lg:h-full bg-[#fbf9f5] border-r border-[#e8ddd0] flex flex-col shrink-0"
        :style="isDesktop ? undefined : sheetStyle"
        role="dialog"
        aria-modal="true"
        aria-label="艾宾浩斯生词本"
      >
        <!-- Pull Handle (Mobile only) -->
        <div
          class="min-h-[44px] flex items-center justify-center sm:hidden cursor-grab active:cursor-grabbing touch-none shrink-0 border-b border-[#e8ddd0] bg-white/70"
          @touchstart="onTouchStart"
          @touchmove="handleDragTouchMove"
          @touchend="onTouchEnd"
        >
          <div class="w-10 h-1.5 rounded-full bg-[#e8ddd0]"></div>
        </div>

        <!-- Header (Unified h-16 baseline) -->
        <div class="h-16 px-4 border-b border-[#e8ddd0] bg-white/70 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <BookMarked class="w-5 h-5 text-amber-700" />
            <h2 class="font-serif text-base font-semibold text-stone-900">
              艾宾浩斯生词本 ({{ vocabStore.vocabList.length }})
            </h2>
          </div>

          <button
            type="button"
            @click="handleClose"
            class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-[#f5efe6] flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
            aria-label="关闭生词本"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Search Input Bar -->
        <div class="p-3 border-b border-[#e8ddd0] bg-[#f5efe6] shrink-0">
          <div class="relative flex items-center">
            <Search class="absolute left-3 w-4 h-4 text-stone-500 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索生词或中文释义..."
              class="w-full h-11 pl-9 pr-9 bg-white/90 border border-[#e8ddd0] rounded-xl text-base sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-colors"
              aria-label="搜索生词本单词"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="absolute right-1.5 min-h-[44px] min-w-[44px] p-2 text-stone-400 hover:text-stone-900 flex items-center justify-center rounded-lg transition-colors cursor-pointer touch-manipulation"
              aria-label="清空搜索内容"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 3-Tier Action Pyramid Toolbar -->
        <div class="p-4 border-b border-[#e8ddd0] bg-white/70 space-y-2 shrink-0">
          <!-- Primary CTA: Print A4 Cut-out Flashcards PDF -->
          <button
            type="button"
            @click="handlePrintCards"
            class="min-h-[44px] w-full py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-amber-50 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer touch-manipulation"
          >
            <Printer class="w-4 h-4" />
            <span>打印羊皮纸单词卡 (PDF)</span>
          </button>

          <!-- Secondary Actions -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="handleExportAnki"
              class="min-h-[44px] flex-1 py-2 px-3 bg-white/80 hover:bg-[#fbf9f5] border border-[#e8ddd0] text-stone-800 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer touch-manipulation"
            >
              <Download class="w-4 h-4 text-amber-700" />
              <span>导出 Anki (TSV)</span>
            </button>

            <button
              type="button"
              @click="handleClearVocab"
              class="min-h-[44px] px-3 py-2 text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
            >
              <Trash2 class="w-4 h-4" />
              <span>清空</span>
            </button>
          </div>
        </div>

        <!-- Leitner 5-Box Distribution Tabs -->
        <div class="p-3 border-b border-[#e8ddd0] bg-white/70 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            @click="activeBox = null"
            :class="[
              'min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer touch-manipulation',
              activeBox === null
                ? 'bg-amber-700 text-amber-50 font-bold border-amber-800'
                : 'border-[#e8ddd0] text-stone-700 hover:bg-[#f5efe6] bg-white/80'
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
              'min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer touch-manipulation',
              activeBox === b
                ? 'bg-amber-700 text-amber-50 font-bold border-amber-800'
                : 'border-[#e8ddd0] text-stone-700 hover:bg-[#f5efe6] bg-white/80'
            ]"
          >
            Box {{ b }} ({{ getBoxCount(b) }})
          </button>
        </div>

        <!-- CEFR Filter Tabs -->
        <div class="px-3 py-2 border-b border-[#e8ddd0] bg-[#fbf9f5] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span class="text-xs font-medium text-stone-600 shrink-0 mr-1">CEFR分级:</span>
          <button
            v-for="tab in cefrTabs"
            :key="tab.value"
            type="button"
            @click="activeCefr = tab.value"
            :class="[
              'min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer touch-manipulation',
              activeCefr === tab.value
                ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                : 'border-[#e8ddd0] text-stone-700 hover:bg-[#f5efe6] bg-white/80'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Box 5 Guard Alert Banner -->
        <div
          v-if="boxGuardAlert"
          role="alert"
          class="mx-4 mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2 shadow-sm shrink-0"
        >
          <div class="flex items-center gap-2">
            <AlertCircle class="w-4 h-4 text-amber-600 shrink-0" />
            <span>{{ boxGuardAlert }}</span>
          </div>
          <button
            type="button"
            @click="boxGuardAlert = ''"
            class="min-h-[44px] min-w-[44px] p-2 text-amber-700 hover:text-amber-900 flex items-center justify-center rounded-lg touch-manipulation cursor-pointer"
            aria-label="关闭提示"
          >
            <X class="w-4 h-4" />
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
            class="text-center py-16 text-sm text-stone-500"
          >
            {{ searchQuery ? '未找到匹配的生词' : '当前分类暂无生词' }}
          </div>

          <div
            v-for="item in filteredList"
            :key="item.id || item.word"
            class="p-4 bg-white/90 border border-[#e8ddd0] rounded-xl space-y-2.5 hover:border-amber-300 transition-colors"
          >
            <!-- Word Header -->
            <div class="space-y-1.5">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap min-w-0">
                  <h3 class="font-serif text-base font-bold text-stone-900 truncate">
                    {{ item.word }}
                  </h3>
                  <!-- Audio pronunciation button -->
                  <button
                    type="button"
                    @click="playPronunciation(item.word)"
                    class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-[#f5efe6] flex items-center justify-center transition-colors cursor-pointer active:scale-95 touch-manipulation"
                    :aria-label="'朗读发音 ' + item.word"
                    title="朗读发音"
                  >
                    <Volume2 class="w-4 h-4" />
                  </button>
                  <span v-if="item.phonetic || item.ipa" class="text-xs font-mono text-stone-500">
                    {{ item.phonetic || item.ipa }}
                  </span>
                </div>

                <!-- Badges & Pills -->
                <div class="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  <!-- Source badge -->
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#e8ddd0] bg-[#f5efe6] text-stone-600 shrink-0">
                    {{ item.sourceType === 'ted' ? 'TED精讲' : 'HP原著' }}
                  </span>
                  <!-- CEFR badge -->
                  <span :class="['text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold shrink-0', getCefrBadgeClass(resolveCefr(item))]">
                    {{ resolveCefr(item) }}
                  </span>
                  <!-- Tag badge -->
                  <span
                    v-if="resolveTag(item)"
                    :class="['text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0', getTagBadgeClass(resolveTag(item))]"
                  >
                    {{ resolveTag(item) }}
                  </span>
                  <!-- Box badge -->
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 shrink-0">
                    Box {{ item.box || 1 }}
                  </span>
                </div>
              </div>

              <!-- Depth meter row -->
              <div class="flex items-center justify-between pt-0.5">
                <VocabDepthMeter :acquisition="item.acquisition" size="compact" />
              </div>
            </div>

            <!-- Meaning -->
            <p class="text-xs text-stone-700 font-sans">
              {{ item.definition || item.meaning || '' }}
            </p>

            <!-- Context Quote -->
            <p v-if="item.contextQuote" class="text-xs text-stone-600 font-serif italic border-l-2 border-[#e8ddd0] pl-2 mt-1">
              "{{ item.contextQuote }}"
            </p>

            <!-- Card Actions -->
            <div class="pt-2 flex items-center justify-between border-t border-[#e8ddd0]">
              <span class="text-[10px] text-stone-500 font-mono">
                {{ getBoxInterval(item.box || 1) }}
              </span>

              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="promoteBox(item)"
                  :class="[
                    'min-h-[44px] px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer touch-manipulation flex items-center gap-1',
                    item.box === 4 && !item.acquisition?.l4
                      ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  ]"
                  :title="item.box === 4 && !item.acquisition?.l4 ? '升级至Box 5需先掌握L4产出' : '提升至下一个记忆盒'"
                >
                  <Lock v-if="item.box === 4 && !item.acquisition?.l4" class="w-3 h-3 text-amber-700" />
                  <span>{{ item.box === 4 && !item.acquisition?.l4 ? '熟记 +1 (需L4)' : '熟记 +1' }}</span>
                </button>
                <button
                  type="button"
                  @click="deleteWord(item)"
                  class="min-h-[44px] px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer touch-manipulation"
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
import { lookupWord, getCefrLevel } from '../data/dictionaryData.js'
import { getTagBadgeClass } from '../utils/tagTheme.js'
import { generateAnkiTSV, downloadAnkiFile } from '../utils/ankiExport.js'
import { generatePrintableParchmentHTML } from '../utils/parchmentPdfGenerator.js'
import { useBottomSheet } from '../composables/useBottomSheet.js'
import { useBreakpointVue } from '../utils/useBreakpointVue.js'
import VocabDepthMeter from './common/VocabDepthMeter.vue'
import {
  BookMarked,
  Printer,
  Download,
  Trash2,
  X,
  Search,
  Volume2,
  Lock,
  AlertCircle
} from 'lucide-vue-next'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const breakpoint = useBreakpointVue()
const isDesktop = computed(() => breakpoint.isDesktop.value)

const vocabStore = useVocabStore()
const activeBox = ref(null)
const activeCefr = ref('all')
const searchQuery = ref('')
const scrollContainerRef = ref(null)
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
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  if (level === 'B1' || level === 'B2') {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }
  if (level === 'C1' || level === 'C2') {
    return 'bg-purple-50 text-purple-700 border-purple-200'
  }
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function matchesCefr(item, filter) {
  if (!filter || filter === 'all') return true
  const lvl = resolveCefr(item)
  if (filter === 'A1/A2') return lvl === 'A1' || lvl === 'A2'
  if (filter === 'B1/B2') return lvl === 'B1' || lvl === 'B2'
  if (filter === 'C1') return lvl === 'C1' || lvl === 'C2'
  return true
}

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
  vocabStore.recordAcquisition(word, 'l1')
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
    if (!matchesCefr(item, activeCefr.value)) {
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
  const res = vocabStore.promoteBox(item)
  if (res && !res.promoted && res.reason === 'NEED_L4_PRODUCTION') {
    boxGuardAlert.value = res.message || '需完成听写拼写或造句跟读(L4)方可进入永久记忆盒(Box 5)'
    if (guardTimer) clearTimeout(guardTimer)
    guardTimer = setTimeout(() => {
      boxGuardAlert.value = ''
    }, 4000)
    return
  }
  boxGuardAlert.value = ''
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
  if (guardTimer) {
    clearTimeout(guardTimer)
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch (_) {}
  }
})
</script>
