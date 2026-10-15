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
        v-if="player.isBookshelfOpen"
        class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        @click="player.toggleBookshelf(false)"
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
        v-if="player.isBookshelfOpen"
        class="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#f8f8f6] border-l border-[#e4e4e7] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="霍格沃茨书架与章节目录"
      >
        <!-- Header -->
        <div class="p-4 border-b border-[#e4e4e7] bg-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <BookMarked class="w-5 h-5 text-[#2563eb]" />
            <h2 class="font-serif text-base font-semibold text-[#18181b]">
              原版书架 · 章节导航
            </h2>
          </div>

          <button
            type="button"
            @click="player.toggleBookshelf(false)"
            class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors"
            aria-label="关闭书架抽屉"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Book Selection Tabs (HP1 ~ HP7) with CEFR Level Pills -->
        <div class="p-3 border-b border-[#e4e4e7] bg-white flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            v-for="book in BOOKS"
            :key="book.id"
            type="button"
            @click="onSelectBook(book.id)"
            :class="[
              'min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex flex-col items-start gap-0.5 border touch-manipulation',
              activeBookId === book.id
                ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] font-semibold'
                : 'border-[#e4e4e7] text-[#71717a] hover:bg-[#f4f4f5] bg-[#f8f8f6]'
            ]"
            :aria-selected="activeBookId === book.id"
          >
            <span class="font-semibold">{{ book.code }}</span>
            <span
              :class="[
                'text-[10px] px-1.5 py-0.2 rounded-full font-sans border',
                CEFR_LEVELS[book.cefr]?.badgeClass || 'bg-blue-50 text-blue-800 border-blue-200'
              ]"
            >
              {{ CEFR_LEVELS[book.cefr]?.badgeText || book.cefr }}
            </span>
          </button>
        </div>

        <!-- Book Info Header & Chapter Search -->
        <div v-if="currentBookData" class="px-4 py-3 bg-[#f8f8f6] border-b border-[#e4e4e7] shrink-0 space-y-2">
          <div class="flex items-baseline justify-between">
            <h3 class="font-serif text-sm font-semibold text-[#18181b] leading-snug">
              {{ currentBookData.titleZh }}
            </h3>
            <span class="text-[11px] text-[#71717a] font-mono">
              共 {{ filteredChapters.length }} 章节
            </span>
          </div>
          <p class="text-[11px] text-[#71717a] font-serif italic truncate">
            {{ currentBookData.title }}
          </p>

          <!-- Search Filter -->
          <div class="relative flex items-center">
            <Search class="w-4 h-4 text-[#71717a] absolute left-3 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索章节标题或序号..."
              class="w-full min-h-[44px] pl-9 pr-8 text-xs bg-white border border-[#e4e4e7] rounded-xl text-[#18181b] placeholder-[#a1a1aa] focus:outline-none focus:border-[#2563eb]"
              autoCapitalize="none"
              autoCorrect="off"
              :spellcheck="false"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="absolute right-2 min-h-[44px] min-w-[36px] flex items-center justify-center text-[#71717a] hover:text-[#18181b]"
              aria-label="清空搜索"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Chapter List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-2">
          <div
            v-if="filteredChapters.length === 0"
            class="text-center py-12 px-4 text-xs text-[#71717a] font-serif"
          >
            未找到与 "{{ searchQuery }}" 匹配的章节
          </div>

          <button
            v-for="(chapter, idx) in filteredChapters"
            :key="chapter.id || idx"
            type="button"
            @click="onSelectChapter(chapter)"
            :class="[
              'w-full min-h-[48px] p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 group touch-manipulation',
              isCurrentActive(chapter)
                ? 'bg-blue-50/70 border-[#2563eb] border-l-4 border-l-[#2563eb] text-[#18181b]'
                : 'border-[#e4e4e7] bg-white hover:bg-[#f4f4f5] text-[#18181b]'
            ]"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span
                :class="[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold shrink-0',
                  isCurrentActive(chapter)
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-[#f4f4f5] text-[#71717a]'
                ]"
              >
                <Volume2 v-if="isCurrentActive(chapter) && player.isPlaying" class="w-3.5 h-3.5 animate-pulse text-white" />
                <span v-else>{{ chapter.number || idx + 1 }}</span>
              </span>

              <div class="truncate">
                <p class="text-xs sm:text-sm font-medium truncate font-serif">
                  {{ chapter.title || `Chapter ${chapter.number || idx + 1}` }}
                </p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span v-if="chapter.cnTitle" class="text-[11px] text-[#71717a] truncate">
                    {{ chapter.cnTitle }}
                  </span>
                  <span v-if="chapter.duration" class="text-[10px] text-[#a1a1aa] flex items-center gap-1 font-mono shrink-0">
                    <Clock class="w-3 h-3" />
                    <span>{{ chapter.duration }}</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <span
                v-if="isCurrentActive(chapter)"
                class="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-100 text-[#2563eb] border border-blue-200 hidden sm:inline"
              >
                当前播放
              </span>
              <ChevronRight
                :class="[
                  'w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5',
                  isCurrentActive(chapter) ? 'text-[#2563eb]' : 'text-[#a1a1aa]'
                ]"
              />
            </div>
          </button>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 border-t border-[#e4e4e7] bg-white flex items-center justify-between text-xs shrink-0">
          <span class="text-xs text-[#71717a] font-serif">Hogwarts Audio · 沉浸原版研读</span>
          <span class="text-[10px] text-[#a1a1aa] font-mono">v1.0.0-prod</span>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/playerStore.js'
import { useCatalogStore } from '../stores/catalogStore.js'
import { BOOKS, CEFR_LEVELS } from '../utils/booksData.js'
import { BookMarked, X, Clock, ChevronRight, Volume2, Search } from 'lucide-vue-next'

const player = usePlayerStore()
const catalog = useCatalogStore()

const searchQuery = ref('')
const activeBookId = ref(player.currentBookId || 'book1')

const currentBookData = computed(() => {
  return (
    BOOKS.find(
      (b) => b.id === activeBookId.value || b.altIds?.includes(activeBookId.value)
    ) || BOOKS[0]
  )
})

const currentCatBook = computed(() => {
  return (
    catalog.books.find(
      (cb) => cb.id === activeBookId.value || currentBookData.value?.altIds?.includes(cb.id)
    ) || catalog.currentBook
  )
})

// Real chapters derived from catalog with fallback
const bookChapters = computed(() => {
  if (currentCatBook.value?.chapters && currentCatBook.value.chapters.length > 0) {
    return currentCatBook.value.chapters.map((ch, idx) => ({
      id: ch.id,
      number: ch.number || idx + 1,
      title: ch.title || `Chapter ${ch.number || idx + 1}`,
      cnTitle: ch.cnTitle || '',
      duration: ch.duration || '20:00',
      durationSeconds: ch.durationSeconds || 1200,
      audioKey: ch.audioKey,
      subtitleKey: ch.subtitleKey
    }))
  }

  const count = currentBookData.value?.chaptersCount || 17
  const bookCode = currentBookData.value?.code?.toLowerCase() || 'hp1'
  return Array.from({ length: count }, (_, i) => {
    const num = i + 1
    const epId = num < 10 ? `0${num}` : `${num}`
    return {
      id: `${bookCode}_ep${epId}`,
      number: num,
      title: `Chapter ${num}`,
      cnTitle: '',
      duration: '15:00',
      durationSeconds: 900
    }
  })
})

const filteredChapters = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return bookChapters.value
  return bookChapters.value.filter(
    (ch) =>
      ch.title.toLowerCase().includes(q) ||
      (ch.cnTitle && ch.cnTitle.toLowerCase().includes(q)) ||
      String(ch.number).includes(q)
  )
})

function isCurrentActive(chapter) {
  return (
    catalog.selectedChapterId === chapter.id ||
    player.currentChapterId === chapter.id
  )
}

function onSelectBook(bookId) {
  activeBookId.value = bookId
  const catBook = catalog.books.find(
    (cb) => cb.id === bookId || BOOKS.find((b) => b.id === bookId)?.altIds?.includes(cb.id)
  )
  if (catBook) {
    catalog.selectBook(catBook.id)
  }
}

function onSelectChapter(chapter) {
  const bookId = currentBookData.value?.id || 'book1'
  const catBook = currentCatBook.value || catalog.currentBook
  if (catBook) {
    catalog.selectBook(catBook.id)
    catalog.selectChapter(chapter.id)
  }
  player.switchChapter(bookId, chapter.id)
  player.toggleBookshelf(false)
}
</script>
