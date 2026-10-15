<template>
  <aside
    class="hidden md:flex lg:hidden w-16 shrink-0 flex-col items-center justify-between border-r border-[#e8ddd0] bg-[#fbf9f5] py-4 px-2 select-none h-full"
    aria-label="平板端侧边导航"
  >
    <!-- Top Section: Brand Icon & Vertical Navigation -->
    <div class="flex flex-col items-center gap-4 w-full">
      <!-- Brand amber icon -->
      <button
        type="button"
        @click="handleSelectView('bookshelf')"
        class="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white active:scale-95 cursor-pointer touch-manipulation transition-transform"
        title="霍格沃茨魔法英语"
        aria-label="霍格沃茨魔法英语"
      >
        <Sparkles :size="20" class="text-white stroke-[2.5]" />
      </button>

      <!-- Vertical nav of 8 icon buttons -->
      <nav class="flex flex-col items-center gap-2 w-full" aria-label="快捷导航">
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          @click="handleItemClick(item)"
          :title="item.title"
          :aria-label="item.title"
          :aria-current="isItemActive(item) ? 'page' : undefined"
          class="relative w-11 h-11 rounded-2xl flex items-center justify-center transition-colors touch-manipulation cursor-pointer active:scale-95"
          :class="isItemActive(item)
            ? 'bg-amber-500 text-white border border-amber-600'
            : 'text-stone-500 hover:text-amber-950 hover:bg-white border border-transparent hover:border-[#e8ddd0]'"
        >
          <component :is="item.icon" :size="20" />
          <span
            v-if="item.id === 'vocab' && vocabCount > 0"
            class="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-600 text-white font-mono font-bold text-[9px] flex items-center justify-center border border-white leading-none shadow-none"
          >
            {{ vocabCount > 99 ? '99+' : vocabCount }}
          </span>
          <span
            v-else-if="item.id === 'storage' && cachedChaptersCount > 0"
            class="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-600 text-white font-mono font-bold text-[9px] flex items-center justify-center border border-white leading-none shadow-none"
          >
            {{ cachedChaptersCount > 99 ? '99+' : cachedChaptersCount }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Bottom: Flame streak badge -->
    <button
      type="button"
      @click="handleStreakClick"
      class="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer p-1.5 rounded-xl hover:bg-white text-orange-600 font-mono font-bold text-xs touch-manipulation transition-transform active:scale-95"
      :title="`连续打卡 ${streakDays} 天`"
      :aria-label="`连续打卡 ${streakDays} 天`"
    >
      <Flame :size="18" class="fill-orange-500 text-orange-500" />
      <span class="text-[11px] font-mono text-orange-600">{{ streakDays }}d</span>
    </button>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import {
  Sparkles,
  Headphones,
  Library,
  Video,
  EyeOff,
  Zap,
  Bookmark,
  BarChart2,
  HardDrive,
  Flame
} from 'lucide-vue-next'
import { useNavigationStore } from '../../stores/navigationStore.js'
import { useVocabStore } from '../../stores/vocabStore.js'
import { useAnalyticsStore } from '../../stores/analyticsStore.js'

const props = defineProps({
  studyMode: {
    type: String,
    default: 'normal'
  },
  cachedChaptersCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['change-view', 'change-study-mode'])

const navigationStore = useNavigationStore()
const vocabStore = useVocabStore()
const analyticsStore = useAnalyticsStore()

const vocabCount = computed(() => vocabStore.vocabList?.length || 0)
const streakDays = computed(() => analyticsStore.streakDays || 0)
const todayListeningSeconds = computed(() => {
  if (typeof analyticsStore.todayListeningSeconds === 'number') {
    return analyticsStore.todayListeningSeconds
  }
  const todayStr = new Date().toISOString().slice(0, 10)
  return Number(analyticsStore.dailyListening?.[todayStr]) || 0
})

const navItems = [
  {
    id: 'bookshelf',
    title: '魔法书架',
    icon: Library,
    view: 'bookshelf'
  },
  {
    id: 'ted',
    title: 'TED演讲',
    icon: Video,
    view: 'ted'
  },
  {
    id: 'player_reader',
    title: '原著精听',
    icon: Headphones,
    view: 'player',
    studyMode: 'normal'
  },
  {
    id: 'player_blind',
    title: '魔法磨耳朵',
    icon: EyeOff,
    view: 'player',
    studyMode: 'blind'
  },
  {
    id: 'player_dictation',
    title: '拼写大闯关',
    icon: Zap,
    view: 'player',
    studyMode: 'dictation'
  },
  {
    id: 'vocab',
    title: '生词本',
    icon: Bookmark,
    view: 'vocab'
  },
  {
    id: 'analytics',
    title: '学业罗盘',
    icon: BarChart2,
    view: 'analytics'
  },
  {
    id: 'storage',
    title: '离线管理',
    icon: HardDrive,
    view: 'storage'
  }
]

function isItemActive(item) {
  if (item.view !== navigationStore.currentView) {
    return false
  }
  if (item.view === 'player' && item.studyMode) {
    return (props.studyMode || 'normal') === item.studyMode
  }
  return true
}

function handleSelectView(view) {
  navigationStore.setView(view)
  emit('change-view', view)
}

function handleItemClick(item) {
  navigationStore.setView(item.view)
  emit('change-view', item.view)
  if (item.studyMode) {
    emit('change-study-mode', item.studyMode)
  }
}

function handleStreakClick() {
  handleSelectView('analytics')
}
</script>
