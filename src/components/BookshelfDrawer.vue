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
        class="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#fbf9f5] border-l border-[#e8ddd0] shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="霍格沃茨书架与章节目录"
      >
        <!-- Header -->
        <div class="p-4 border-b border-[#e8ddd0] flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <BookMarked class="w-5 h-5 text-[#d97706]" />
            <h2 class="font-serif text-base font-semibold text-[#1e1610]">
              魔法书架 · 章节导航
            </h2>
          </div>

          <button
            type="button"
            @click="player.toggleBookshelf(false)"
            class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors"
            aria-label="关闭书架抽屉"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Book Selection Tabs (HP1 ~ HP7) with CEFR Level Pills -->
        <div class="p-3 border-b border-[#e8ddd0] flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            v-for="book in BOOKS"
            :key="book.id"
            type="button"
            @click="activeBookId = book.id"
            :class="[
              'min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex flex-col items-start gap-0.5 border',
              activeBookId === book.id
                ? 'bg-[#d97706]/15 border-[#d97706] text-[#92400e] shadow-sm'
                : 'border-[#e8ddd0] text-[#78695d] hover:bg-[#f4ebe1]'
            ]"
            :aria-selected="activeBookId === book.id"
          >
            <span class="font-semibold">{{ book.code }}</span>
            <span
              :class="[
                'text-[10px] px-1.5 py-0.2 rounded-full font-sans border',
                CEFR_LEVELS[book.cefr]?.badgeClass || 'bg-amber-50 text-amber-800 border-amber-300/60'
              ]"
            >
              {{ CEFR_LEVELS[book.cefr]?.badgeText || book.cefr }}
            </span>
          </button>
        </div>

        <!-- Book Info Header -->
        <div v-if="currentBookData" class="px-4 py-3 bg-[#f4ebe1]/40 border-b border-[#e8ddd0] shrink-0">
          <h3 class="font-serif text-sm font-semibold text-[#1e1610] leading-snug">
            {{ currentBookData.titleZh }}
          </h3>
          <p class="text-[11px] text-[#78695d] font-serif italic mt-0.5">
            {{ currentBookData.title }}
          </p>
        </div>

        <!-- Chapter List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-2">
          <button
            v-for="(chapter, idx) in bookChapters"
            :key="chapter.id || idx"
            type="button"
            @click="onSelectChapter(chapter)"
            :class="[
              'w-full min-h-[48px] p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 group',
              isCurrentActive(chapter)
                ? 'bg-[#d97706]/10 border-[#d97706] text-[#1e1610] shadow-sm'
                : 'border-[#e8ddd0] bg-white/60 hover:bg-[#f4ebe1]/70 text-[#4a3b32]'
            ]"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span
                :class="[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold shrink-0',
                  isCurrentActive(chapter)
                    ? 'bg-[#d97706] text-white'
                    : 'bg-[#e8ddd0] text-[#78695d]'
                ]"
              >
                {{ chapter.number || idx + 1 }}
              </span>

              <div class="truncate">
                <p class="text-sm font-medium truncate">
                  {{ chapter.title || `Chapter ${idx + 1}` }}
                </p>
                <p v-if="chapter.duration" class="text-[11px] text-[#a89a8c] flex items-center gap-1 font-mono mt-0.5">
                  <Clock class="w-3 h-3" />
                  <span>{{ chapter.duration }}</span>
                </p>
              </div>
            </div>

            <ChevronRight
              :class="[
                'w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5',
                isCurrentActive(chapter) ? 'text-[#d97706]' : 'text-[#a89a8c]'
              ]"
            />
          </button>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/playerStore.js'
import { BOOKS, CEFR_LEVELS } from '../utils/booksData.js'
import { BookMarked, X, Clock, ChevronRight } from 'lucide-vue-next'

const player = usePlayerStore()

const activeBookId = ref(player.currentBookId || 'book1')

const currentBookData = computed(() => {
  return (
    BOOKS.find(
      (b) => b.id === activeBookId.value || b.altIds?.includes(activeBookId.value)
    ) || BOOKS[0]
  )
})

// Generate simulated or catalog-based chapter list
const bookChapters = computed(() => {
  const count = currentBookData.value?.chaptersCount || 17
  const bookCode = currentBookData.value?.code?.toLowerCase() || 'hp1'
  return Array.from({ length: count }, (_, i) => {
    const num = i + 1
    const epId = num < 10 ? `0${num}` : `${num}`
    return {
      id: `${bookCode}_ep${epId}`,
      number: num,
      title: `Chapter ${num}`,
      duration: '15:00'
    }
  })
})

function isCurrentActive(chapter) {
  return player.currentChapterId === chapter.id
}

function onSelectChapter(chapter) {
  const bookId = currentBookData.value?.id || 'book1'
  player.switchChapter(bookId, chapter.id)
  player.toggleBookshelf(false)
}
</script>
