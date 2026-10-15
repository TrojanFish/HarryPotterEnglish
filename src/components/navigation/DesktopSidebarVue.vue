<template>
  <aside
    :class="[
      'hidden lg:flex shrink-0 flex-col justify-between border-r border-[#e8ddd0] bg-[#fbf9f5] select-none h-full overflow-y-auto transition-all duration-200',
      isCollapsed ? 'w-18 py-4 px-2 items-center' : 'w-60 p-4'
    ]"
    aria-label="桌面端侧边导航"
  >
    <!-- Top Brand & Navigation -->
    <div :class="['w-full space-y-4', isCollapsed ? 'flex flex-col items-center' : '']">
      <!-- Brand Row (Collapsed) -->
      <div v-if="isCollapsed" class="flex flex-col items-center gap-2.5 w-full">
        <button
          type="button"
          @click="handleSelectView('bookshelf')"
          class="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0 touch-manipulation"
          title="霍格沃茨魔法英语 · 点击返回书架"
          aria-label="霍格沃茨魔法英语 · 点击返回书架"
        >
          <Sparkles :size="20" class="text-white stroke-[2.5]" />
        </button>

        <button
          type="button"
          @click="handleToggleCollapse"
          class="min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:border-amber-400 hover:bg-amber-50 text-stone-600 hover:text-amber-950 flex items-center justify-center transition-colors active:scale-95 cursor-pointer shrink-0 touch-manipulation"
          title="展开侧边栏 (Ctrl+B)"
          aria-label="展开侧边栏"
        >
          <PanelLeftOpen :size="16" />
        </button>
      </div>

      <!-- Brand Row (Expanded) -->
      <div v-else class="space-y-2.5">
        <div class="flex items-center justify-between gap-2 px-1">
          <button
            type="button"
            @click="handleSelectView('bookshelf')"
            class="flex items-center gap-2.5 cursor-pointer group min-w-0 text-left bg-transparent border-0 p-0 touch-manipulation"
            title="返回魔法书架"
            aria-label="返回魔法书架"
          >
            <div class="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white group-hover:scale-105 active:scale-95 transition-transform shrink-0">
              <Sparkles :size="20" class="text-white stroke-[2.5]" />
            </div>
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-1.5">
                <h1 class="font-magical font-bold text-base text-amber-950 tracking-tight truncate">
                  霍格沃茨英语
                </h1>
                <span class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-800 text-amber-100 font-sans font-bold shrink-0">
                  <GraduationCap :size="10" />
                  <span>原版</span>
                </span>
              </div>
              <p class="text-[11px] font-medium text-stone-500 font-reading leading-tight mt-0.5 truncate">
                听魔法小说 · 学地道英语
              </p>
            </div>
          </button>

          <button
            type="button"
            @click="handleToggleCollapse"
            class="min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:border-amber-400 hover:bg-amber-50 text-stone-500 hover:text-amber-950 flex items-center justify-center transition-colors active:scale-95 cursor-pointer shrink-0 touch-manipulation"
            title="收起侧边栏 (Ctrl+B)"
            aria-label="收起侧边栏"
          >
            <PanelLeftClose :size="16" />
          </button>
        </div>
      </div>

      <!-- Navigation Items (Collapsed) -->
      <nav v-if="isCollapsed" class="flex flex-col items-center gap-2 w-full" aria-label="桌面精简导航">
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          @click="handleItemClick(item)"
          :title="`${item.label} · ${item.desc}`"
          :aria-label="item.label"
          :aria-current="isItemActive(item) ? 'page' : undefined"
          class="relative w-11 h-11 rounded-2xl flex items-center justify-center transition-colors cursor-pointer touch-manipulation active:scale-95"
          :class="isItemActive(item)
            ? 'bg-amber-500 text-white border border-amber-600'
            : 'text-stone-600 hover:text-amber-950 hover:bg-white border border-transparent hover:border-[#e8ddd0]'"
        >
          <span :class="[isItemActive(item) ? 'text-white' : 'text-stone-500 hover:text-amber-700', 'transition-colors']">
            <component :is="item.icon" :size="20" class="shrink-0" />
          </span>
          <span
            v-if="item.id === 'vocab' && vocabCount > 0"
            class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-600 text-white font-mono font-bold text-[9px] flex items-center justify-center border border-white leading-none shadow-none"
          >
            {{ vocabCount > 99 ? '99+' : vocabCount }}
          </span>
          <span
            v-else-if="item.id === 'storage' && cachedCount > 0"
            class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-600 text-white font-mono font-bold text-[9px] flex items-center justify-center border border-white leading-none shadow-none"
          >
            {{ cachedCount > 99 ? '99+' : cachedCount }}
          </span>
        </button>
      </nav>

      <!-- Navigation Items (Expanded) -->
      <nav v-else class="space-y-1.5 w-full" aria-label="桌面主导航">
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          @click="handleItemClick(item)"
          :title="item.desc"
          :aria-label="item.label"
          :aria-current="isItemActive(item) ? 'page' : undefined"
          class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-bold min-h-[44px] transition-colors text-left cursor-pointer group touch-manipulation active:scale-95"
          :class="isItemActive(item)
            ? 'bg-amber-500 text-white border border-amber-600'
            : 'text-stone-600 hover:text-amber-950 hover:bg-white border border-transparent hover:border-[#e8ddd0]'"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <span :class="[isItemActive(item) ? 'text-white' : 'text-stone-500 group-hover:text-amber-700', 'transition-colors']">
              <component :is="item.icon" :size="18" class="shrink-0" />
            </span>
            <span class="truncate">{{ item.label }}</span>
          </div>
          <span
            v-if="item.id === 'vocab' && vocabCount > 0"
            :class="[
              'text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0',
              isItemActive(item) ? 'bg-white/20 text-white' : 'bg-amber-500/15 text-amber-800 border border-amber-300'
            ]"
          >
            {{ vocabCount > 99 ? '99+' : vocabCount }}
          </span>
          <span
            v-else-if="item.id === 'storage' && cachedCount > 0"
            :class="[
              'text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0',
              isItemActive(item) ? 'bg-white/20 text-white' : 'bg-amber-500/15 text-amber-800 border border-amber-300'
            ]"
          >
            {{ cachedCount > 99 ? '99+' : cachedCount }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Bottom Section: Habit progress & Sync indicators -->
    <!-- Collapsed Bottom -->
    <div v-if="isCollapsed" class="flex flex-col items-center gap-2 pt-3 border-t border-[#e8ddd0] w-full">
      <button
        type="button"
        @click="handleAnalyticsClick"
        class="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer p-1.5 rounded-xl hover:bg-white text-orange-600 font-mono font-bold text-xs touch-manipulation transition-transform active:scale-95"
        :title="`连续打卡 ${streakDays} 天 · 今日已完成 ${goalMinutes}/5 分钟 (${goalPercent}%)`"
        :aria-label="`连续打卡 ${streakDays} 天`"
      >
        <Flame :size="18" class="fill-orange-500 text-orange-500" />
        <span class="text-[11px] font-mono text-orange-600 mt-0.5 leading-tight">{{ streakDays }}d</span>
      </button>

      <!-- Sync Status Indicator Dot -->
      <button
        type="button"
        @click="handleAnalyticsClick"
        class="w-6 h-6 flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px] touch-manipulation"
        title="本地优先云端同步正常 · 0ms离线可用"
        aria-label="本地优先云端同步正常"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      </button>

      <!-- Optional PWA Install -->
      <button
        v-if="canInstallPwa"
        type="button"
        @click="handleInstallPwa"
        class="min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-amber-50 text-amber-700 flex items-center justify-center cursor-pointer active:scale-95 transition-colors touch-manipulation"
        title="安装桌面快捷应用"
        aria-label="安装桌面快捷应用"
      >
        <Download :size="15" />
      </button>
    </div>

    <!-- Expanded Bottom -->
    <div v-else class="space-y-3 pt-4 border-t border-[#e8ddd0] w-full">
      <!-- Habit Progress Card -->
      <div
        @click="handleAnalyticsClick"
        class="duo-card p-3.5 space-y-2 cursor-pointer hover:border-amber-400 transition-colors bg-white rounded-2xl border border-[#e8ddd0] touch-manipulation active:scale-95"
        title="点击查看学业罗盘与听力分布"
        role="button"
        tabindex="0"
        @keydown.enter="handleAnalyticsClick"
        @keydown.space.prevent="handleAnalyticsClick"
      >
        <div class="flex items-center justify-between text-sm font-bold text-amber-950">
          <span class="flex items-center gap-1.5 text-orange-600">
            <Flame :size="16" class="fill-orange-500 text-orange-500" />
            <span>连续打卡</span>
          </span>
          <span class="font-mono font-bold text-orange-600">{{ streakDays }} 天</span>
        </div>

        <div class="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
          <div
            class="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-700"
            :style="{ width: `${goalPercent}%` }"
          />
        </div>

        <div class="flex items-center justify-between text-sm text-stone-500 font-reading">
          <span>今日契约: {{ goalMinutes }} / 5 分钟</span>
          <span class="font-mono font-bold text-amber-900">{{ goalPercent }}%</span>
        </div>
      </div>

      <!-- Local-First Sync Indicator -->
      <div
        @click="handleAnalyticsClick"
        class="flex items-center justify-between text-xs px-1 text-stone-400 hover:text-stone-600 cursor-pointer transition-colors min-h-[44px] touch-manipulation"
        title="本地优先增量同步：离线数据已安全存储，联网时自动与云端漫游"
        role="button"
        tabindex="0"
        @keydown.enter="handleAnalyticsClick"
        @keydown.space.prevent="handleAnalyticsClick"
      >
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>云端同步 · 0ms离线</span>
        </span>
        <span class="font-mono text-[11px]">D1 漫游</span>
      </div>

      <!-- Optional PWA Install Prompt -->
      <button
        v-if="canInstallPwa"
        type="button"
        @click="handleInstallPwa"
        class="w-full duo-btn-secondary min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-bold touch-manipulation active:scale-95"
        title="将应用安装至电脑桌面，支持秒开与离线学习"
      >
        <Download :size="13" class="text-amber-700" />
        <span>安装桌面快捷应用</span>
      </button>

      <!-- Legal Disclaimers & Academic Charter Entry -->
      <button
        type="button"
        @click="handleLegalClick"
        class="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-stone-400 hover:text-amber-800 transition-colors cursor-pointer min-h-[44px] touch-manipulation active:scale-95"
        title="研学公约、版权致谢与 COPPA 隐私保护声明"
        aria-label="研学公约与法律声明"
      >
        <Scale :size="14" class="shrink-0" />
        <span>研学公约与法律声明</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import {
  Sparkles,
  GraduationCap,
  Library,
  Video,
  Headphones,
  EyeOff,
  Zap,
  Bookmark,
  BarChart2,
  HardDrive,
  PanelLeftClose,
  PanelLeftOpen,
  Flame,
  Scale,
  Download
} from 'lucide-vue-next'
import { useNavigationStore } from '../../stores/navigationStore.js'
import { useVocabStore } from '../../stores/vocabStore.js'
import { useAnalyticsStore } from '../../stores/analyticsStore.js'

const props = defineProps({
  studyMode: {
    type: String,
    default: 'normal'
  },
  cachedCount: {
    type: Number,
    default: 0
  },
  cachedChaptersCount: {
    type: Number,
    default: 0
  },
  streakDays: {
    type: Number,
    default: undefined
  },
  todayListeningSeconds: {
    type: Number,
    default: undefined
  },
  vocabCount: {
    type: Number,
    default: undefined
  },
  canInstallPwa: {
    type: Boolean,
    default: false
  },
  collapsed: {
    type: Boolean,
    default: undefined
  }
})

const emit = defineEmits([
  'change-view',
  'change-study-mode',
  'toggle-collapse',
  'open-vocab',
  'open-analytics',
  'open-storage',
  'open-legal',
  'install-pwa'
])

const navigationStore = useNavigationStore()
const vocabStore = useVocabStore()
const analyticsStore = useAnalyticsStore()

const isCollapsed = computed(() => {
  if (typeof props.collapsed === 'boolean') {
    return props.collapsed
  }
  return navigationStore.isCollapsed
})

const vocabCount = computed(() => {
  if (typeof props.vocabCount === 'number') {
    return props.vocabCount
  }
  return vocabStore.vocabList?.length || 0
})

const cachedCount = computed(() => {
  if (typeof props.cachedCount === 'number' && props.cachedCount > 0) {
    return props.cachedCount
  }
  if (typeof props.cachedChaptersCount === 'number') {
    return props.cachedChaptersCount
  }
  return 0
})

const streakDays = computed(() => {
  if (typeof props.streakDays === 'number') {
    return props.streakDays
  }
  return analyticsStore.streakDays || 0
})

const todayListeningSeconds = computed(() => {
  if (typeof props.todayListeningSeconds === 'number') {
    return props.todayListeningSeconds
  }
  if (typeof analyticsStore.todayListeningSeconds === 'number') {
    return analyticsStore.todayListeningSeconds
  }
  const todayStr = new Date().toISOString().slice(0, 10)
  return Number(analyticsStore.dailyListening?.[todayStr]) || 0
})

const targetSeconds = 300 // 5-minute daily habit goal
const goalPercent = computed(() => Math.min(100, Math.round((todayListeningSeconds.value / targetSeconds) * 100)))
const goalMinutes = computed(() => (todayListeningSeconds.value / 60).toFixed(1))

const navItems = [
  {
    id: 'bookshelf',
    label: '魔法书架',
    desc: '原著书库与章节精选',
    icon: Library,
    view: 'bookshelf'
  },
  {
    id: 'ted',
    label: 'TED演讲',
    desc: '双语演讲与名家视界',
    icon: Video,
    view: 'ted'
  },
  {
    id: 'player_reader',
    label: '原著精听',
    desc: '逐句同步双语伴读',
    icon: Headphones,
    view: 'player',
    studyMode: 'normal'
  },
  {
    id: 'player_blind',
    label: '魔法磨耳朵',
    desc: '迷雾遮罩盲听精进',
    icon: EyeOff,
    view: 'player',
    studyMode: 'blind'
  },
  {
    id: 'player_dictation',
    label: '拼写大闯关',
    desc: '魔咒打字趣味通关',
    icon: Zap,
    view: 'player',
    studyMode: 'dictation'
  },
  {
    id: 'vocab',
    label: '生词本',
    desc: '难词收藏与复习',
    icon: Bookmark,
    view: 'vocab'
  },
  {
    id: 'analytics',
    label: '学业罗盘',
    desc: '连续打卡与学情趋势',
    icon: BarChart2,
    view: 'analytics'
  },
  {
    id: 'storage',
    label: '离线管理',
    desc: '离线缓存与存储占用',
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

function handleToggleCollapse() {
  navigationStore.toggleCollapsed()
  emit('toggle-collapse', navigationStore.isCollapsed)
}

function handleAnalyticsClick() {
  handleSelectView('analytics')
  emit('open-analytics')
}

function handleLegalClick() {
  emit('open-legal')
}

function handleInstallPwa() {
  emit('install-pwa')
}

function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
    e.preventDefault()
    handleToggleCollapse()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>
