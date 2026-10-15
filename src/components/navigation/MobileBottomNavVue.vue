<template>
  <nav
    class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#fbf9f5] border-t border-[#e8ddd0] flex items-stretch select-none"
    style="padding-bottom: env(safe-area-inset-bottom); box-sizing: content-box;"
    aria-label="移动端底部导航"
  >
    <button
      v-for="item in navItems"
      :key="item.id"
      type="button"
      @click="handleSelect(item.view)"
      :aria-label="item.label"
      :aria-current="navigationStore.currentView === item.view ? 'page' : undefined"
      :aria-selected="navigationStore.currentView === item.view"
      class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[44px] touch-manipulation transition-colors cursor-pointer select-none active:scale-95"
      :class="navigationStore.currentView === item.view ? 'bg-amber-500/15 text-amber-700 font-bold' : 'text-stone-500 hover:text-stone-700'"
    >
      <div class="relative flex items-center justify-center">
        <component :is="item.icon" :size="22" class="shrink-0" />
        <span
          v-if="item.id === 'vocab' && vocabCount > 0"
          class="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 rounded-full bg-amber-600 text-white font-mono font-bold text-[9px] flex items-center justify-center leading-none shadow-none"
        >
          {{ vocabCount > 99 ? '99+' : vocabCount }}
        </span>
      </div>
      <span class="text-[11px] font-bold leading-tight">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import {
  Library,
  Video,
  Bookmark,
  BarChart2,
  HardDrive
} from 'lucide-vue-next'
import { useNavigationStore } from '../../stores/navigationStore.js'
import { useVocabStore } from '../../stores/vocabStore.js'

const emit = defineEmits(['change-view'])

const navigationStore = useNavigationStore()
const vocabStore = useVocabStore()

const vocabCount = computed(() => vocabStore.vocabList?.length || 0)

const navItems = [
  { id: 'bookshelf', label: '书架', icon: Library, view: 'bookshelf' },
  { id: 'ted', label: 'TED', icon: Video, view: 'ted' },
  { id: 'vocab', label: '生词本', icon: Bookmark, view: 'vocab' },
  { id: 'analytics', label: '学情', icon: BarChart2, view: 'analytics' },
  { id: 'storage', label: '离线', icon: HardDrive, view: 'storage' }
]

function handleSelect(view) {
  navigationStore.setView(view)
  emit('change-view', view)
}
</script>
