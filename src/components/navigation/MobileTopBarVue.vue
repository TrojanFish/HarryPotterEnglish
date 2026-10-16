<template>
  <header
    class="h-14 shrink-0 bg-[#fbf9f5] border-b border-[#e8ddd0] px-4 flex items-center justify-between z-20 select-none"
    style="padding-top: env(safe-area-inset-top); box-sizing: content-box;"
  >
    <!-- Left: Brand Identity (K12-Optimised, Subtitle Hidden on Mobile) -->
    <div class="flex items-center gap-2.5 min-w-0">
      <div
        class="w-10 h-10 min-w-[40px] rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80 flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        <Sparkles :size="20" class="text-amber-700" />
      </div>
      <h1 class="font-magical font-bold text-base text-amber-950 truncate tracking-wide">
        霍格沃茨英语
      </h1>
    </div>

    <!-- Center: Chapter Selector Button -->
    <button
      type="button"
      @click="handleChapterClick"
      class="min-h-[44px] px-3 rounded-full border border-[#e8ddd0] bg-white flex items-center gap-2 text-sm font-medium touch-manipulation text-amber-950 hover:border-amber-400 active:scale-95 transition-all cursor-pointer select-none"
      title="选择章节"
      aria-label="选择章节"
    >
      <BookOpen :size="15" class="text-amber-700 shrink-0" />
      <span class="truncate max-w-[110px] sm:max-w-[150px]">
        {{ currentChapterTitle || '选择章节' }}
      </span>
      <ChevronDown :size="14" class="text-stone-400 shrink-0" />
    </button>

    <!-- Right: Quick Tools (Streak/House Cup, Vocab, Analytics, Storage) -->
    <div class="flex items-center gap-1.5 shrink-0">
      <!-- Streak Flame Pill Button -->
      <button
        type="button"
        @click="handleStreakClick"
        class="min-h-[44px] min-w-[44px] px-2 flex items-center justify-center gap-1 rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] hover:bg-white text-orange-600 active:scale-95 transition-all touch-manipulation cursor-pointer"
        :title="`连续打卡 ${streakDays} 天 · 点击查看学院杯`"
        :aria-label="`连续打卡 ${streakDays} 天`"
      >
        <Flame :size="16" class="fill-orange-500 text-orange-500 shrink-0" />
        <span class="text-xs font-mono font-bold text-orange-600 leading-none">{{ streakDays }}d</span>
      </button>

      <!-- Vocabulary Button with K12 text-xs Badge -->
      <button
        type="button"
        @click="handleVocabClick"
        class="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] hover:bg-white text-stone-600 hover:text-amber-950 active:scale-95 transition-all touch-manipulation cursor-pointer"
        title="生词本"
        aria-label="打开生词本"
      >
        <BookMarked :size="18" class="text-stone-700" />
        <span
          v-if="vocabCount > 0"
          class="absolute -top-1 -right-1 bg-amber-600 text-white text-xs font-bold font-mono px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight shadow-none border border-white"
        >
          {{ vocabCount }}
        </span>
      </button>

      <!-- Analytics Button -->
      <button
        type="button"
        @click="handleAnalyticsClick"
        class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] hover:bg-white text-stone-600 hover:text-amber-950 active:scale-95 transition-all touch-manipulation cursor-pointer"
        title="学情罗盘"
        aria-label="打开学情分析"
      >
        <BarChart2 :size="18" class="text-stone-700" />
      </button>

      <!-- Storage Button -->
      <button
        type="button"
        @click="handleStorageClick"
        class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] hover:bg-white text-stone-600 hover:text-amber-950 active:scale-95 transition-all touch-manipulation cursor-pointer"
        title="离线缓存"
        aria-label="打开存储管理"
      >
        <HardDrive :size="18" class="text-stone-700" />
      </button>

      <!-- Cloud Sync Button -->
      <button
        type="button"
        @click="handleCloudSyncClick"
        class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] hover:bg-white text-stone-600 hover:text-amber-950 active:scale-95 transition-all touch-manipulation cursor-pointer"
        title="云端漫游"
        aria-label="打开云端漫游"
      >
        <Cloud :size="18" class="text-stone-700" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import {
  Sparkles,
  BookOpen,
  ChevronDown,
  BookMarked,
  BarChart2,
  HardDrive,
  Flame,
  Cloud
} from 'lucide-vue-next'
import { useNavigationStore } from '../../stores/navigationStore.js'
import { useVocabStore } from '../../stores/vocabStore.js'
import { useGamificationStore } from '../../stores/gamificationStore.js'
import { useAnalyticsStore } from '../../stores/analyticsStore.js'

const props = defineProps({
  currentChapterTitle: {
    type: String,
    default: '选择章节'
  }
})

const emit = defineEmits([
  'open-chapter-drawer',
  'open-vocab',
  'open-analytics',
  'open-storage',
  'open-house-cup',
  'open-badges',
  'open-cloud-sync'
])

const navigationStore = useNavigationStore()
const vocabStore = useVocabStore()
const gamificationStore = useGamificationStore()
const analyticsStore = useAnalyticsStore()

const vocabCount = computed(() => vocabStore.vocabList?.length || 0)
const streakDays = computed(() => gamificationStore.streakDays || analyticsStore.streakDays || 0)

function handleChapterClick() {
  emit('open-chapter-drawer')
}

function handleStreakClick() {
  emit('open-house-cup')
}

function handleVocabClick() {
  navigationStore.setView('vocab')
  emit('open-vocab')
}

function handleAnalyticsClick() {
  navigationStore.setView('analytics')
  emit('open-analytics')
}

function handleStorageClick() {
  navigationStore.setView('storage')
  emit('open-storage')
}

function handleCloudSyncClick() {
  emit('open-cloud-sync')
}
</script>
