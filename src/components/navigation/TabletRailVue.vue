<template>
  <aside
    class="hidden md:flex lg:hidden w-16 shrink-0 flex-col items-center justify-between border-r border-[#e8ddd0] bg-[#fbf9f5] select-none h-full"
    aria-label="平板端侧边导航"
  >
    <!-- Top Section: Brand Icon (Unified h-16 baseline) & Vertical Navigation -->
    <div class="flex flex-col items-center w-full">
      <!-- Brand Row (Unified h-16 baseline) -->
      <div class="h-16 flex items-center justify-center w-full border-b border-[#e8ddd0] shrink-0">
        <button
          type="button"
          @click="handleSelectView('bookshelf')"
          class="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-white active:scale-95 cursor-pointer touch-manipulation transition-transform"
          title="霍格沃茨魔法英语"
          aria-label="霍格沃茨魔法英语"
        >
          <Sparkles :size="20" class="text-white stroke-[2.5]" />
        </button>
      </div>

      <!-- Vertical nav of 8 icon buttons -->
      <nav class="flex flex-col items-center gap-2 w-full p-2 pt-3" aria-label="快捷导航">
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

    <!-- Bottom: Flame streak badge & Badges button -->
    <div class="flex flex-col items-center gap-2 p-2 pb-3.5 border-t border-[#e8ddd0] w-full">
      <button
        type="button"
        @click="handleStreakClick"
        class="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer p-1.5 rounded-xl hover:bg-white text-orange-600 font-mono font-bold text-xs touch-manipulation transition-transform active:scale-95"
        :title="`连续打卡 ${streakDays} 天 · 查看学院杯`"
        :aria-label="`连续打卡 ${streakDays} 天`"
      >
        <Flame :size="18" class="fill-orange-500 text-orange-500" />
        <span class="text-[11px] font-mono text-orange-600">{{ streakDays }}d</span>
      </button>

      <button
        type="button"
        @click="handleBadgesClick"
        class="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer p-1.5 rounded-xl hover:bg-white text-amber-700 font-mono font-bold text-xs touch-manipulation transition-transform active:scale-95"
        title="魔法成就徽章"
        aria-label="查看魔法成就徽章"
      >
        <Award :size="18" class="text-amber-700" />
        <span class="text-[10px] font-mono text-amber-700">{{ unlockedCount }}</span>
      </button>

      <!-- Cloud Roaming Button -->
      <button
        type="button"
        @click="handleCloudSyncClick"
        class="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer p-1.5 rounded-xl hover:bg-white text-amber-800 font-mono font-bold text-xs touch-manipulation transition-transform active:scale-95"
        title="云端漫游与通行码配对"
        aria-label="打开云端漫游"
      >
        <Cloud :size="18" class="text-amber-800" />
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import {
  Sparkles,
  Headphones,
  Library,
  Video,
  Bookmark,
  BarChart2,
  HardDrive,
  Flame,
  Award,
  Cloud
} from 'lucide-vue-next'
import { useNavigationStore } from '../../stores/navigationStore.js'
import { useVocabStore } from '../../stores/vocabStore.js'
import { useAnalyticsStore } from '../../stores/analyticsStore.js'
import { useGamificationStore } from '../../stores/gamificationStore.js'

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

const emit = defineEmits([
  'change-view',
  'change-study-mode',
  'open-vocab',
  'open-analytics',
  'open-storage',
  'open-house-cup',
  'open-badges',
  'open-cloud-sync'
])

const navigationStore = useNavigationStore()
const vocabStore = useVocabStore()
const analyticsStore = useAnalyticsStore()
const gamificationStore = useGamificationStore()

const vocabCount = computed(() => vocabStore.vocabList?.length || 0)
const streakDays = computed(() => gamificationStore.streakDays || analyticsStore.streakDays || 0)
const unlockedCount = computed(() => gamificationStore.unlockedCount || 0)
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
    id: 'assessment',
    title: '能力评定',
    icon: Award,
    view: 'assessment'
  },
  {
    id: 'player_reader',
    title: '原著精听',
    icon: Headphones,
    view: 'player',
    studyMode: 'normal'
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
  if (item.id === 'vocab') emit('open-vocab')
  if (item.id === 'analytics') emit('open-analytics')
  if (item.id === 'storage') emit('open-storage')
}

function handleStreakClick() {
  emit('open-house-cup')
}

function handleBadgesClick() {
  handleSelectView('badges')
  emit('open-badges')
}

function handleCloudSyncClick() {
  handleSelectView('sync')
  emit('open-cloud-sync')
}
</script>
