<template>
  <div class="flex-1 min-h-0 overflow-y-auto bg-[#fbf9f5] p-4 sm:p-6 lg:p-8 space-y-6 select-none font-sans">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8ddd0] pb-5">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0">
          <BookOpen class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              魔法原版书架
            </h1>
            <span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-800 text-amber-100 font-sans font-bold">
              <GraduationCap :size="12" />
              <span>原版全集</span>
            </span>
          </div>
          <p class="text-xs text-stone-500 font-reading mt-0.5">
            J.K. 罗琳《哈利·波特》七部小说原著 · CEFR 渐进精读精听研习
          </p>
        </div>
      </div>

      <!-- Quick Resume Action Card -->
      <div v-if="currentChapter" class="flex items-center gap-3 bg-[#f5efe6] border border-[#e8ddd0] px-4 py-2 rounded-2xl shrink-0">
        <div class="min-w-0">
          <p class="text-[11px] text-stone-500 font-medium">上次研习进度</p>
          <p class="text-xs font-serif font-bold text-stone-900 truncate max-w-[160px] sm:max-w-[200px]">
            {{ currentBook?.code || 'HP1' }} · {{ currentChapter.title || `Chapter ${currentChapter.number || 1}` }}
          </p>
        </div>
        <button
          type="button"
          @click="resumeListening"
          class="min-h-[44px] px-4 py-2 bg-amber-700 hover:bg-amber-800 text-amber-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer touch-manipulation shrink-0"
          title="继续研习该章节"
          aria-label="继续研习该章节"
        >
          <Play :size="14" class="fill-current" />
          <span>继续伴读</span>
        </button>
      </div>
    </div>

    <!-- 7 Books Showcase Ribbon -->
    <div class="space-y-2.5">
      <div class="flex items-center justify-between">
        <h2 class="font-serif text-sm font-bold text-stone-800 flex items-center gap-1.5">
          <Layers :size="16" class="text-amber-700" />
          <span>原著全集 · 选择书籍 (HP1 ~ HP7)</span>
        </h2>
        <span class="text-xs font-mono text-stone-500">
          当前选中: {{ currentBook?.titleZh }} ({{ currentBook?.code }})
        </span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          v-for="book in BOOKS"
          :key="book.id"
          type="button"
          @click="selectBook(book.id)"
          :class="[
            'p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer touch-manipulation active:scale-95 min-h-[96px]',
            activeBookId === book.id
              ? 'bg-amber-50/90 border-amber-600 ring-2 ring-amber-500/20 shadow-none'
              : 'bg-white border-[#e8ddd0] hover:border-amber-400 hover:bg-[#faf6ee]'
          ]"
          :aria-selected="activeBookId === book.id"
        >
          <div class="flex items-center justify-between w-full">
            <span class="font-mono font-bold text-sm text-stone-900">{{ book.code }}</span>
            <span
              :class="[
                'text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold border',
                CEFR_LEVELS[book.cefr]?.badgeClass || 'bg-amber-50 text-amber-800 border-amber-200'
              ]"
            >
              {{ book.cefr }}
            </span>
          </div>

          <div class="min-w-0">
            <p class="font-serif text-xs font-bold text-stone-900 truncate">
              {{ book.titleZh }}
            </p>
            <p class="text-[10px] text-stone-500 font-reading truncate mt-0.5">
              共 {{ book.chaptersCount }} 章节
            </p>
          </div>
        </button>
      </div>
    </div>

    <!-- Smart Recommendation Card -->
    <div class="w-full">
      <RecommendationCard
        @open-chapter="handleRecommendationChapter"
        @open-ted="handleRecommendationTed"
      />
    </div>

    <!-- Chapter Selection Area -->
    <div class="p-6 bg-white border border-[#e8ddd0] rounded-2xl space-y-4 shadow-none">
      <!-- Chapter Section Header & Search Input -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e8ddd0] pb-4">
        <div>
          <h2 class="font-serif text-base font-bold text-stone-900">
            {{ currentBookData?.titleZh }} · 章节目录
          </h2>
          <p class="text-xs text-stone-500 italic mt-0.5">
            {{ currentBookData?.title }} · 共 {{ filteredChapters.length }} 章节
          </p>
        </div>

        <div class="relative flex items-center min-w-[240px]">
          <Search class="absolute left-3 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索章节标题或序号..."
            class="w-full min-h-[44px] pl-9 pr-9 bg-[#fbf9f5] border border-[#e8ddd0] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 transition-colors"
            aria-label="搜索章节"
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
      </div>

      <!-- No Matching Chapters Notice -->
      <div
        v-if="filteredChapters.length === 0"
        class="text-center py-12 text-xs text-stone-400 bg-[#faf6ee]/50 rounded-xl border border-[#e8ddd0]"
      >
        未找到与 "{{ searchQuery }}" 匹配的章节
      </div>

      <!-- Chapters Responsive Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <div
          v-for="(chapter, idx) in filteredChapters"
          :key="chapter.id || idx"
          :class="[
            'p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 bg-[#fbf9f5]',
            isCurrentActive(chapter)
              ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-400/50'
              : 'border-[#e8ddd0] hover:border-amber-400 hover:bg-[#faf6ee]'
          ]"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <span
                :class="[
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0',
                  isCurrentActive(chapter)
                    ? 'bg-amber-700 text-amber-50'
                    : 'bg-[#e8ddd0] text-stone-700'
                ]"
              >
                {{ chapter.number || idx + 1 }}
              </span>
              <div class="min-w-0">
                <h3 class="font-serif text-xs sm:text-sm font-bold text-stone-900 truncate">
                  {{ chapter.title || `Chapter ${chapter.number || idx + 1}` }}
                </h3>
                <p v-if="chapter.cnTitle" class="text-[11px] text-stone-500 truncate mt-0.5">
                  {{ chapter.cnTitle }}
                </p>
              </div>
            </div>

            <span
              v-if="isCurrentActive(chapter)"
              class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0"
            >
              当前章节
            </span>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-[#e8ddd0]/60">
            <span v-if="chapter.duration" class="text-[11px] text-stone-400 font-mono flex items-center gap-1">
              <Clock class="w-3.5 h-3.5 text-stone-400" />
              <span>{{ chapter.duration }}</span>
            </span>
            <span v-else class="text-[11px] text-stone-400 font-mono">
              原版音频伴读
            </span>

            <button
              type="button"
              @click="startStudyChapter(chapter)"
              class="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-700 hover:text-amber-50 text-stone-800 border border-[#e8ddd0] hover:border-amber-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer touch-manipulation"
              :aria-label="`进入研习 ${chapter.title || chapter.number}`"
            >
              <Play :size="13" class="fill-current text-amber-700 group-hover:text-amber-50" />
              <span>进入伴读</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCatalogStore } from '../../stores/catalogStore.js'
import { useNavigationStore } from '../../stores/navigationStore.js'
import { useSessionStore } from '../../stores/sessionStore.js'
import { usePlayerStore } from '../../stores/playerStore.js'
import { BOOKS, CEFR_LEVELS } from '../../data/books.js'
import RecommendationCard from '../home/RecommendationCard.vue'
import {
  BookOpen,
  Play,
  Clock,
  Search,
  X,
  GraduationCap,
  Layers
} from 'lucide-vue-next'

const catalogStore = useCatalogStore()
const navStore = useNavigationStore()
const sessionStore = useSessionStore()
const player = usePlayerStore()

const searchQuery = ref('')

const activeBookId = computed(() => {
  return catalogStore.selectedBookId || 'hp-book-1'
})

const currentBook = computed(() => catalogStore.currentBook)
const currentChapter = computed(() => catalogStore.currentChapter)

const currentBookData = computed(() => {
  return BOOKS.find((b) => b.id === activeBookId.value) || BOOKS[0]
})

const allChapters = computed(() => {
  const b = currentBook.value
  return b?.chapters || []
})

const filteredChapters = computed(() => {
  if (!searchQuery.value.trim()) {
    return allChapters.value
  }
  const q = searchQuery.value.toLowerCase().trim()
  return allChapters.value.filter((ch, idx) => {
    const num = String(ch.number || idx + 1)
    const en = (ch.title || '').toLowerCase()
    const cn = (ch.cnTitle || '').toLowerCase()
    return num.includes(q) || en.includes(q) || cn.includes(q)
  })
})

function isCurrentActive(chapter) {
  return chapter.id === catalogStore.selectedChapterId
}

function selectBook(bookId) {
  catalogStore.selectBook(bookId)
  searchQuery.value = ''
}

function startStudyChapter(chapter) {
  if (chapter && chapter.id) {
    catalogStore.selectChapter(chapter.id)
  }
  sessionStore.setStep(1)
  navStore.setView('player')
  player.toggleBookshelf(false)
  player.play()
}

function resumeListening() {
  sessionStore.setStep(1)
  navStore.setView('player')
  player.toggleBookshelf(false)
  player.play()
}

function handleRecommendationChapter(payload) {
  if (payload?.chapterId) {
    catalogStore.selectChapter(payload.chapterId)
  }
  sessionStore.setStep(1)
  navStore.setView('player')
  player.toggleBookshelf(false)
  player.play()
}

function handleRecommendationTed() {
  navStore.setView('ted')
}
</script>
