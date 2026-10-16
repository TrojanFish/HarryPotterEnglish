<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style="padding-top: max(1rem, env(safe-area-inset-top, 0px)); padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));"
    >
      <!-- Backdrop with blur -->
      <div
        class="fixed inset-0 bg-stone-900/65 backdrop-blur-sm transition-opacity"
        @click="closeModal"
        aria-hidden="true"
      />

      <!-- Modal Dialog Window -->
      <div
        role="dialog"
        aria-modal="true"
        aria-label="魔法成就徽章图鉴"
        class="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#fbf9f5] border-2 border-[#e8ddd0] rounded-2xl sm:rounded-3xl shadow-2xl text-[#1c1917] p-4 sm:p-7 flex flex-col z-10 transition-all focus:outline-none"
        tabindex="-1"
      >
        <!-- Modal Top Bar -->
        <div class="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#e8ddd0]/80">
          <div class="flex items-center gap-2.5 sm:gap-3">
            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shadow-xs">
              <Award class="w-5 h-5 sm:w-6 sm:h-6 text-amber-700 stroke-[2.2]" />
            </div>
            <div>
              <h2 class="text-base sm:text-xl font-bold font-serif tracking-wide text-stone-900 flex items-center gap-2">
                魔法成就图鉴大厅 · 巫师荣誉画廊
                <Sparkles class="w-4 h-4 text-amber-600 hidden sm:inline-block" />
              </h2>
              <p class="text-xs text-stone-600 font-sans mt-0.5">
                记录魔法英语学习征途中的每一项非凡荣誉与里程碑
              </p>
            </div>
          </div>

          <!-- Close Button with Apple HIG min 44x44px touch target -->
          <button
            type="button"
            @click="closeModal"
            aria-label="关闭魔法成就徽章图鉴"
            class="min-h-[44px] min-w-[44px] p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 flex items-center justify-center transition-all touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <X class="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        <!-- Header Stats Banner -->
        <div class="mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-stone-100/60 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-500/15 rounded-xl text-amber-800">
              <Sparkles class="w-5 h-5" />
            </div>
            <div>
              <div class="text-xs font-semibold text-stone-600 uppercase tracking-wider">
                全境成就收录进展
              </div>
              <div class="text-sm sm:text-base font-bold font-serif text-stone-900">
                已点亮 {{ unlockedCount }} / {{ allBadges.length }} 项荣誉
              </div>
            </div>
          </div>

          <!-- Overall Progress Bar + percentage -->
          <div class="flex items-center gap-3 w-full sm:w-60">
            <div class="flex-1 bg-stone-200/80 rounded-full h-2.5 overflow-hidden">
              <div
                class="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500"
                :style="{ width: `${overallProgressPercent}%` }"
              />
            </div>
            <span class="text-xs font-bold text-amber-900 tabular-nums">
              {{ overallProgressPercent }}%
            </span>
          </div>
        </div>

        <!-- Category Filter Tabs -->
        <div class="mt-4 flex items-center gap-2 overflow-x-auto py-1 scrollbar-none" role="tablist" aria-label="成就类别筛选">
          <button
            v-for="tab in CATEGORY_TABS"
            :key="tab.id"
            type="button"
            role="tab"
            :aria-selected="selectedCategory === tab.id"
            @click="selectedCategory = tab.id"
            class="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap transition-all touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 border"
            :class="selectedCategory === tab.id ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs font-semibold' : 'bg-white/80 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'"
            :aria-label="`筛选类别: ${tab.label}`"
          >
            <component :is="tab.icon" class="w-4 h-4 flex-shrink-0" />
            <span>{{ tab.label }}</span>
            <span
              class="ml-1 text-[11px] px-1.5 py-0.5 rounded-full font-bold tabular-nums"
              :class="selectedCategory === tab.id ? 'bg-amber-200/80 text-amber-900' : 'bg-stone-200 text-stone-600'"
            >
              {{ getCategoryCount(tab.id) }}
            </span>
          </button>
        </div>

        <!-- Responsive Badge Grid -->
        <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pb-2">
          <div
            v-for="badge in filteredBadges"
            :key="badge.id"
            @click="openDetail(badge)"
            @keydown.enter="openDetail(badge)"
            tabindex="0"
            role="button"
            :aria-label="`查看徽章详情: ${badge.name}`"
            class="min-h-[44px] min-w-[44px] relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 touch-manipulation cursor-pointer group active:scale-[0.98] select-none"
            :class="getBadgeCardClass(badge)"
          >
            <!-- Rarity tag & Status badge -->
            <div class="flex items-center justify-between gap-1 mb-2">
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                :class="getRarityTagClass(badge.rarity)"
              >
                {{ getRarityName(badge.rarity) }}
              </span>
              <span
                v-if="badge.isUnlocked"
                class="text-[10px] font-medium text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.5 rounded-full flex items-center gap-1"
              >
                <Check class="w-3 h-3 stroke-[2.5]" />
                点亮
              </span>
              <span
                v-else
                class="text-[10px] text-stone-500 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
              >
                <Lock class="w-3 h-3" />
                未解锁
              </span>
            </div>

            <!-- Icon Emblem Container -->
            <div class="my-2 flex flex-col items-center">
              <div
                class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 border shadow-xs relative"
                :class="getIconContainerClass(badge)"
              >
                <component
                  :is="resolveIcon(badge.icon)"
                  class="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]"
                  :class="badge.isUnlocked ? getIconGlowClass(badge.rarity) : 'text-stone-400 opacity-60'"
                />
                <div
                  v-if="!badge.isUnlocked"
                  class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-500 shadow-xs"
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
            <div class="mt-2 pt-2 border-t border-stone-200/60">
              <div v-if="badge.isUnlocked" class="flex items-center justify-center gap-1 text-[11px] text-stone-600">
                <span class="text-stone-400">授勋:</span>
                <span class="font-sans font-medium">{{ formatUnlockDate(badge.unlockedAt) }}</span>
              </div>
              <div v-else class="space-y-1">
                <div class="flex items-center justify-between text-[10px] text-stone-500 font-medium">
                  <span>进度</span>
                  <span class="tabular-nums">{{ getProgressMetricText(badge) }}</span>
                </div>
                <div class="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-amber-500 rounded-full transition-all duration-300"
                    :style="{ width: `${badge.progress || 0}%` }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Badge Detail Inspector (徽章典故详情弹层) -->
        <div
          v-if="selectedBadge"
          class="fixed inset-0 z-20 flex items-center justify-center p-3 sm:p-6 bg-stone-950/60 backdrop-blur-xs"
          @click.self="closeDetail"
        >
          <div
            role="dialog"
            aria-modal="true"
            :aria-label="`徽章详情: ${selectedBadge.name}`"
            class="relative w-full max-w-md bg-[#fbf9f5] border-2 border-amber-300/80 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 text-stone-900 animate-in fade-in zoom-in-95 duration-200 focus:outline-none"
            tabindex="-1"
          >
            <!-- Close button with Apple HIG 44px -->
            <button
              type="button"
              @click="closeDetail"
              aria-label="关闭详情"
              class="absolute top-4 right-4 min-h-[44px] min-w-[44px] p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 flex items-center justify-center transition-all touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <X class="w-5 h-5" />
            </button>

            <!-- Top Badge Emblem -->
            <div class="flex flex-col items-center text-center">
              <div
                class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center border-2 shadow-md relative mb-3"
                :class="getIconContainerClass(selectedBadge)"
              >
                <component
                  :is="resolveIcon(selectedBadge.icon)"
                  class="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]"
                  :class="selectedBadge.isUnlocked ? getIconGlowClass(selectedBadge.rarity) : 'text-stone-400 opacity-60'"
                />
                <div
                  v-if="!selectedBadge.isUnlocked"
                  class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-500 shadow-xs"
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
                  class="text-xs font-bold px-2.5 py-0.5 rounded-full border"
                  :class="getRarityTagClass(selectedBadge.rarity)"
                >
                  {{ getRarityName(selectedBadge.rarity) }}品质
                </span>
                <span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                  {{ getCategoryName(selectedBadge.category) }}
                </span>
              </div>
            </div>

            <!-- Lore Quote Box (典故引言) -->
            <div class="mt-5 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-stone-800 text-xs sm:text-sm leading-relaxed font-serif relative">
              <div class="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles class="w-3.5 h-3.5" />
                典故引言 · 魔法卷轴
              </div>
              <p class="italic text-stone-700">
                {{ selectedBadge.lore || '霍格沃茨魔法英语学者专属授勋徽章。' }}
              </p>
            </div>

            <!-- Requirements & Condition Details -->
            <div class="mt-4 space-y-2">
              <div class="text-xs font-semibold text-stone-500">
                达成条件
              </div>
              <p class="text-xs sm:text-sm text-stone-800 font-medium">
                {{ selectedBadge.desc }}
              </p>

              <!-- Status Indicator -->
              <div class="pt-2">
                <div v-if="selectedBadge.isUnlocked" class="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                  <Check class="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>已点亮授勋 · 达成于 {{ formatUnlockDate(selectedBadge.unlockedAt) }}</span>
                </div>
                <div v-else class="space-y-1.5 p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-xs">
                  <div class="flex items-center justify-between text-stone-600 font-medium">
                    <span class="flex items-center gap-1 text-stone-700">
                      <Lock class="w-3.5 h-3.5" />
                      当前进度
                    </span>
                    <span class="font-bold text-amber-800 tabular-nums">
                      {{ getProgressMetricText(selectedBadge) }} ({{ selectedBadge.progress || 0 }}%)
                    </span>
                  </div>
                  <div class="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-amber-500 rounded-full transition-all duration-300"
                      :style="{ width: `${selectedBadge.progress || 0}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Action button to dismiss inspector with min 44px touch target -->
            <div class="mt-5">
              <button
                type="button"
                @click="closeDetail"
                aria-label="返回图鉴列表"
                class="w-full min-h-[44px] min-w-[44px] py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-amber-50 font-medium text-sm flex items-center justify-center transition-all touch-manipulation active:scale-[0.98] shadow-xs"
              >
                返回荣誉画廊
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useGamificationStore } from '../../stores/gamificationStore.js'
import { useAnalyticsStore } from '../../stores/analyticsStore.js'
import { useVocabStore } from '../../stores/vocabStore.js'
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
  Info,
  Wand2,
  Compass,
  Trophy
} from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

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
  Info,
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
  const tab = CATEGORY_TABS.find(t => t.id === category)
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
  return allBadges.value.filter(b => b.isUnlocked).length
})

const overallProgressPercent = computed(() => {
  if (!allBadges.value.length) return 0
  return Math.min(100, Math.round((unlockedCount.value / allBadges.value.length) * 100))
})

const filteredBadges = computed(() => {
  if (selectedCategory.value === 'all') {
    return allBadges.value
  }
  return allBadges.value.filter(b => b.category === selectedCategory.value)
})

function getCategoryCount(catId) {
  if (catId === 'all') {
    return allBadges.value.length
  }
  return allBadges.value.filter(b => b.category === catId).length
}

function openDetail(badge) {
  selectedBadge.value = badge
}

function closeDetail() {
  selectedBadge.value = null
}

function closeModal() {
  if (selectedBadge.value) {
    selectedBadge.value = null
  }
  emit('close')
}

function formatUnlockDate(ts) {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    if (isNaN(d.getTime())) return ''
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

function getProgressMetricText(badge) {
  if (badge.isUnlocked) return '已达成'
  if (badge.target) {
    const current = Math.min(badge.target, store.streakDays || 0)
    return `${current} / ${badge.target} 天`
  }
  if (badge.targetMinutes) {
    let currentMins = 0
    try {
      const analytics = useAnalyticsStore()
      currentMins = Math.round((Number(analytics?.listeningSeconds || analytics?.totalListeningSeconds) || 0) / 60)
    } catch {}
    return `${currentMins} / ${badge.targetMinutes} 分钟`
  }
  if (badge.targetVocab) {
    let vCount = 0
    try {
      const vocab = useVocabStore()
      vCount = Array.isArray(vocab?.vocabList) ? vocab.vocabList.length : 0
    } catch {}
    return `${vCount} / ${badge.targetVocab} 词`
  }
  if (badge.targetL4) {
    let l4Count = 0
    try {
      const vocab = useVocabStore()
      l4Count = Array.isArray(vocab?.vocabList) ? vocab.vocabList.filter(w => w.acquisition?.l4).length : 0
    } catch {}
    return `${l4Count} / ${badge.targetL4} 词`
  }
  if (badge.targetScore) {
    return `${badge.targetScore} 分达成`
  }
  return `${badge.progress || 0}%`
}

function getBadgeCardClass(badge) {
  if (!badge.isUnlocked) {
    return 'border-stone-200/80 bg-stone-50/40 opacity-75 hover:opacity-100 hover:border-stone-300'
  }
  switch (badge.rarity) {
    case 'bronze':
      return 'border-[#decbb8] hover:border-amber-600/70 bg-[#fffdfa] shadow-xs'
    case 'silver':
      return 'border-[#cbd5e1] hover:border-slate-500 bg-[#f8fafc]/80 shadow-xs'
    case 'gold':
      return 'border-[#fcd34d] hover:border-amber-500 bg-[#fffbeb]/90 shadow-xs ring-1 ring-amber-300/30'
    case 'legendary':
      return 'border-[#c084fc] hover:border-purple-500 bg-[#faf5ff]/90 shadow-xs ring-1 ring-purple-300/40'
    default:
      return 'border-stone-200 bg-white'
  }
}

function getRarityTagClass(rarity) {
  switch (rarity) {
    case 'bronze':
      return 'bg-amber-100 text-amber-900 border-amber-300'
    case 'silver':
      return 'bg-slate-100 text-slate-800 border-slate-300'
    case 'gold':
      return 'bg-amber-200 text-amber-950 border-amber-400'
    case 'legendary':
      return 'bg-purple-100 text-purple-900 border-purple-300'
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200'
  }
}

function getIconContainerClass(badge) {
  if (!badge.isUnlocked) {
    return 'bg-stone-100 text-stone-400 border-stone-200'
  }
  switch (badge.rarity) {
    case 'bronze':
      return 'bg-amber-100/80 text-amber-800 border-amber-300'
    case 'silver':
      return 'bg-slate-100 text-slate-700 border-slate-300'
    case 'gold':
      return 'bg-amber-200/90 text-amber-900 border-amber-400'
    case 'legendary':
      return 'bg-purple-100 text-purple-800 border-purple-300'
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200'
  }
}

function getIconGlowClass(rarity) {
  switch (rarity) {
    case 'bronze':
      return 'text-amber-700'
    case 'silver':
      return 'text-slate-600'
    case 'gold':
      return 'text-amber-600'
    case 'legendary':
      return 'text-purple-600'
    default:
      return 'text-stone-700'
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    if (selectedBadge.value) {
      selectedBadge.value = null
    } else if (props.isOpen) {
      closeModal()
    }
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeydown)
    }
  } else {
    selectedBadge.value = null
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown)
    }
  }
}, { immediate: true })

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>
