<template>
  <div class="flex-1 min-h-0 overflow-y-auto bg-[#fbf9f5] p-4 sm:p-6 lg:p-8 space-y-6 select-none font-sans">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8ddd0] pb-5">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0">
          <Award class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              魔法成就图鉴大厅
            </h1>
            <span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-sans font-bold">
              <Sparkles :size="12" class="text-amber-700" />
              <span>巫师荣誉画廊</span>
            </span>
          </div>
          <p class="text-xs text-stone-500 font-reading mt-0.5">
            记录魔法英语研习征程中的每一项卓越造诣与里程碑勋章
          </p>
        </div>
      </div>

      <!-- Quick Summary Status -->
      <div class="flex items-center gap-3 bg-[#f5efe6] border border-[#e8ddd0] px-4 py-2.5 rounded-2xl shrink-0">
        <div>
          <p class="text-[11px] text-stone-500 font-medium">全境成就进度</p>
          <p class="text-xs font-serif font-bold text-stone-900">
            已点亮 {{ unlockedCount }} / {{ allBadges.length }} 项荣誉
          </p>
        </div>
        <div class="w-24 sm:w-32 bg-stone-200 h-2 rounded-full overflow-hidden shrink-0">
          <div
            class="h-full bg-gradient-to-r from-amber-600 to-amber-700 rounded-full transition-all duration-500"
            :style="{ width: `${overallProgressPercent}%` }"
          ></div>
        </div>
        <span class="text-xs font-mono font-bold text-amber-900 tabular-nums shrink-0">
          {{ overallProgressPercent }}%
        </span>
      </div>
    </div>

    <!-- Category Filter Tabs -->
    <div class="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar" role="tablist" aria-label="成就类别筛选">
      <button
        v-for="tab in CATEGORY_TABS"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="selectedCategory === tab.id"
        @click="selectedCategory = tab.id"
        class="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap transition-all touch-manipulation active:scale-95 border cursor-pointer"
        :class="selectedCategory === tab.id ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-none font-bold' : 'bg-white text-stone-600 border-[#e8ddd0] hover:bg-[#faf6ee] hover:text-stone-900'"
        :aria-label="`筛选类别: ${tab.label}`"
      >
        <component :is="tab.icon" class="w-4 h-4 shrink-0" />
        <span>{{ tab.label }}</span>
        <span
          class="ml-1 text-[11px] px-1.5 py-0.5 rounded-full font-mono font-bold tabular-nums"
          :class="selectedCategory === tab.id ? 'bg-amber-200/80 text-amber-900' : 'bg-stone-100 text-stone-500 border border-stone-200'"
        >
          {{ getCategoryCount(tab.id) }}
        </span>
      </button>
    </div>

    <!-- Responsive Badge Cards Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="badge in filteredBadges"
        :key="badge.id"
        @click="openDetail(badge)"
        @keydown.enter="openDetail(badge)"
        @keydown.space.prevent="openDetail(badge)"
        tabindex="0"
        role="button"
        :aria-label="`查看徽章详情: ${badge.name}`"
        class="min-h-[44px] min-w-[44px] relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 touch-manipulation cursor-pointer group active:scale-[0.98] select-none"
        :class="getBadgeCardClass(badge)"
      >
        <!-- Rarity tag & Status badge -->
        <div class="flex items-center justify-between gap-1 mb-2">
          <span
            class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
            :class="getRarityTagClass(badge.rarity)"
          >
            {{ getRarityName(badge.rarity) }}
          </span>
          <span
            v-if="badge.isUnlocked"
            class="text-[10px] font-medium text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono"
          >
            <Check class="w-3 h-3 stroke-[2.5]" />
            <span>点亮</span>
          </span>
          <span
            v-else
            class="text-[10px] text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono"
          >
            <Lock class="w-3 h-3" />
            <span>未解锁</span>
          </span>
        </div>

        <!-- Icon Emblem Container -->
        <div class="my-2 flex flex-col items-center">
          <div
            class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 border relative"
            :class="getIconContainerClass(badge)"
          >
            <component
              :is="resolveIcon(badge.icon)"
              class="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]"
              :class="badge.isUnlocked ? getIconGlowClass(badge.rarity) : 'text-stone-400 opacity-60'"
            />
            <div
              v-if="!badge.isUnlocked"
              class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-500 shadow-none"
            >
              <Lock class="w-3 h-3" />
            </div>
          </div>

          <h3 class="text-xs sm:text-sm font-bold font-serif text-stone-900 mt-2.5 text-center leading-snug line-clamp-1">
            {{ badge.name }}
          </h3>
          <p class="text-[11px] text-stone-600 mt-0.5 text-center line-clamp-2 leading-relaxed">
            {{ badge.desc }}
          </p>
        </div>

        <!-- Card Bottom: Unlock date or Progress Bar -->
        <div class="mt-2 pt-2 border-t border-[#e8ddd0]">
          <div v-if="badge.isUnlocked" class="flex items-center justify-center gap-1 text-[11px] text-stone-600 font-mono">
            <span class="text-stone-400">获勋:</span>
            <span class="font-medium">{{ formatUnlockDate(badge.unlockedAt) }}</span>
          </div>
          <div v-else class="space-y-1">
            <div class="flex items-center justify-between text-[10px] text-stone-500 font-mono">
              <span>进度</span>
              <span class="tabular-nums">{{ getProgressMetricText(badge) }}</span>
            </div>
            <div class="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                class="h-full bg-amber-600 rounded-full transition-all duration-300"
                :style="{ width: `${badge.progress || 0}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Badge Detail Inspector Modal Overlay -->
    <div
      v-if="selectedBadge"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
      @click.self="closeDetail"
    >
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="`徽章详情: ${selectedBadge.name}`"
        class="relative w-full max-w-md bg-[#fbf9f5] border-2 border-amber-300 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-7 text-stone-900 focus:outline-none"
        tabindex="-1"
      >
        <!-- Close button with Apple HIG 44px -->
        <button
          type="button"
          @click="closeDetail"
          aria-label="关闭详情"
          class="absolute top-4 right-4 min-h-[44px] min-w-[44px] p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-[#f5efe6] flex items-center justify-center transition-all touch-manipulation active:scale-95 cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>

        <!-- Top Badge Emblem -->
        <div class="flex flex-col items-center text-center">
          <div
            class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center border-2 shadow-sm relative mb-3"
            :class="getIconContainerClass(selectedBadge)"
          >
            <component
              :is="resolveIcon(selectedBadge.icon)"
              class="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]"
              :class="selectedBadge.isUnlocked ? getIconGlowClass(selectedBadge.rarity) : 'text-stone-400 opacity-60'"
            />
            <div
              v-if="!selectedBadge.isUnlocked"
              class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-500"
            >
              <Lock class="w-3.5 h-3.5" />
            </div>
          </div>

          <!-- Badge Title & Rarity + Category Tags -->
          <h3 class="text-xl sm:text-2xl font-bold font-serif text-stone-900 tracking-wide">
            {{ selectedBadge.name }}
          </h3>
          <div class="flex items-center gap-2 mt-2">
            <span
              class="text-xs font-bold px-2.5 py-0.5 rounded-full border font-mono"
              :class="getRarityTagClass(selectedBadge.rarity)"
            >
              {{ getRarityName(selectedBadge.rarity) }}品质
            </span>
            <span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              {{ getCategoryName(selectedBadge.category) }}
            </span>
          </div>
        </div>

        <!-- Badge Lore & Story -->
        <div class="mt-4 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-stone-700 text-xs leading-relaxed font-reading">
          <div class="flex items-center gap-1.5 text-amber-900 font-bold mb-1">
            <Sparkles class="w-3.5 h-3.5 text-amber-700" />
            <span>魔法典故与荣耀</span>
          </div>
          <p>{{ selectedBadge.desc }}</p>
        </div>

        <!-- Unlock Requirements -->
        <div class="mt-3.5 space-y-2 text-xs">
          <div class="flex items-center justify-between text-stone-600 font-medium">
            <span>获勋契约</span>
            <span class="font-mono">{{ getProgressMetricText(selectedBadge) }}</span>
          </div>
          <div class="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-amber-600 to-amber-700 rounded-full transition-all duration-300"
              :style="{ width: `${selectedBadge.progress || (selectedBadge.isUnlocked ? 100 : 0)}%` }"
            />
          </div>
          <p class="text-[11px] text-stone-500">
            {{ selectedBadge.requirementDesc || '在魔法英语世界中持续坚持精听与跟读即可解锁该项成就' }}
          </p>
        </div>

        <!-- Rewards & Status -->
        <div class="mt-4 pt-3.5 border-t border-[#e8ddd0] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1 text-xs font-mono text-amber-900">
              <Trophy class="w-4 h-4 text-amber-700" />
              <span>+{{ selectedBadge.housePoints || 10 }} 学院分</span>
            </div>
            <div class="flex items-center gap-1 text-xs font-mono text-stone-600">
              <Sparkles class="w-4 h-4 text-amber-600" />
              <span>+{{ selectedBadge.xp || 50 }} 经验</span>
            </div>
          </div>

          <span
            v-if="selectedBadge.isUnlocked"
            class="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1"
          >
            <Check class="w-3.5 h-3.5" />
            <span>已获得</span>
          </span>
          <span
            v-else
            class="text-xs font-mono text-stone-500 bg-stone-100 border border-stone-300 px-3 py-1 rounded-full flex items-center gap-1"
          >
            <Lock class="w-3.5 h-3.5" />
            <span>努力解锁中</span>
          </span>
        </div>

        <div class="mt-5">
          <button
            type="button"
            @click="closeDetail"
            class="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-amber-50 font-bold text-xs flex items-center justify-center transition-all touch-manipulation active:scale-[0.98] cursor-pointer"
          >
            返回图鉴大厅
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGamificationStore } from '../../stores/gamificationStore.js'
import {
  Award,
  Lock,
  Unlock,
  Sparkles,
  Flame,
  BookOpen,
  Heart,
  Crown,
  Mic,
  Volume2,
  Headphones,
  BookMarked,
  PenTool,
  Check,
  X,
  GraduationCap,
  Shield,
  Filter,
  Wand2,
  Compass,
  Trophy
} from 'lucide-vue-next'

const store = useGamificationStore()

const ICON_MAP = {
  Award,
  Lock,
  Unlock,
  Sparkles,
  Flame,
  BookOpen,
  Heart,
  Crown,
  Mic,
  Volume2,
  Headphones,
  BookMarked,
  PenTool,
  Check,
  X,
  GraduationCap,
  Shield,
  Filter,
  Wand2,
  Compass,
  Trophy
}

function resolveIcon(iconName) {
  return ICON_MAP[iconName] || Award
}

const CATEGORY_TABS = [
  { id: 'all', label: '全部', icon: Filter },
  { id: 'journey', label: '魔法征程', icon: Compass },
  { id: 'skill', label: '语言造诣', icon: Wand2 },
  { id: 'grit', label: '坚韧修行', icon: Flame },
  { id: 'owls', label: 'O.W.L.s 优异', icon: GraduationCap }
]

const RARITY_MAP = {
  bronze: '青铜',
  silver: '白银',
  gold: '黄金',
  legendary: '传奇'
}

function getRarityName(rarity) {
  return RARITY_MAP[rarity] || '青铜'
}

function getCategoryName(category) {
  const tab = CATEGORY_TABS.find((t) => t.id === category)
  return tab ? tab.label : '综合'
}

const selectedCategory = ref('all')
const selectedBadge = ref(null)

const allBadges = computed(() => {
  return store.allBadgesWithStatus || []
})

const unlockedCount = computed(() => {
  if (typeof store.unlockedCount === 'number') {
    return store.unlockedCount
  }
  return allBadges.value.filter((b) => b.isUnlocked).length
})

const overallProgressPercent = computed(() => {
  if (!allBadges.value.length) return 0
  return Math.min(100, Math.round((unlockedCount.value / allBadges.value.length) * 100))
})

const filteredBadges = computed(() => {
  if (selectedCategory.value === 'all') {
    return allBadges.value
  }
  return allBadges.value.filter((b) => b.category === selectedCategory.value)
})

function getCategoryCount(catId) {
  if (catId === 'all') {
    return allBadges.value.length
  }
  return allBadges.value.filter((b) => b.category === catId).length
}

function openDetail(badge) {
  selectedBadge.value = badge
}

function closeDetail() {
  selectedBadge.value = null
}

function formatUnlockDate(ts) {
  if (!ts) return '今日'
  try {
    const d = new Date(ts)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  } catch {
    return '已获勋'
  }
}

function getProgressMetricText(badge) {
  if (badge.isUnlocked) return '100%'
  if (badge.currentMetric !== undefined && badge.targetMetric !== undefined) {
    return `${badge.currentMetric} / ${badge.targetMetric}`
  }
  return `${badge.progress || 0}%`
}

function getBadgeCardClass(badge) {
  if (badge.isUnlocked) {
    switch (badge.rarity) {
      case 'legendary':
        return 'bg-gradient-to-b from-amber-50 to-[#faf6ee] border-amber-400 hover:border-amber-500 hover:shadow-sm'
      case 'gold':
        return 'bg-gradient-to-b from-amber-50/70 to-[#faf6ee] border-amber-300 hover:border-amber-400 hover:shadow-sm'
      case 'silver':
        return 'bg-gradient-to-b from-stone-50 to-[#faf6ee] border-stone-300 hover:border-stone-400 hover:shadow-sm'
      default:
        return 'bg-white border-[#e8ddd0] hover:border-amber-300 hover:shadow-sm'
    }
  }
  return 'bg-stone-50/70 border-stone-200/80 opacity-75 hover:opacity-100 hover:border-stone-300'
}

function getRarityTagClass(rarity) {
  switch (rarity) {
    case 'legendary':
      return 'bg-amber-100 text-amber-900 border-amber-300'
    case 'gold':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'silver':
      return 'bg-stone-100 text-stone-700 border-stone-300'
    default:
      return 'bg-orange-50 text-orange-800 border-orange-200'
  }
}

function getIconContainerClass(badge) {
  if (!badge.isUnlocked) {
    return 'bg-stone-100 border-stone-300 text-stone-400'
  }
  switch (badge.rarity) {
    case 'legendary':
      return 'bg-amber-500/20 border-amber-400 text-amber-800 shadow-sm'
    case 'gold':
      return 'bg-amber-500/15 border-amber-300 text-amber-700 shadow-xs'
    case 'silver':
      return 'bg-stone-200/60 border-stone-300 text-stone-700'
    default:
      return 'bg-orange-100/60 border-orange-300 text-orange-800'
  }
}

function getIconGlowClass(rarity) {
  switch (rarity) {
    case 'legendary':
      return 'text-amber-800'
    case 'gold':
      return 'text-amber-700'
    case 'silver':
      return 'text-stone-700'
    default:
      return 'text-orange-800'
  }
}
</script>
