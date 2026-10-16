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
        aria-label="学院杯学分竞赛"
        class="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#fbf9f5] border-2 border-[#e8ddd0] rounded-2xl sm:rounded-3xl shadow-2xl text-[#1c1917] p-4 sm:p-7 flex flex-col z-10 transition-all focus:outline-none"
        tabindex="-1"
      >
        <!-- Modal Top Bar -->
        <div class="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#e8ddd0]/80">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shadow-xs">
              <Trophy class="w-5 h-5 text-amber-700 stroke-[2.2]" />
            </div>
            <div>
              <h2 class="text-lg sm:text-xl font-bold font-serif tracking-wide text-stone-900 flex items-center gap-2">
                霍格沃茨学院杯
                <Sparkles class="w-4 h-4 text-amber-600" />
              </h2>
              <p class="text-xs text-stone-600 font-sans">
                四院学分沙漏与排名榜 · 勤勉修习为学院争光
              </p>
            </div>
          </div>

          <!-- Close Button with Apple HIG min 44x44px touch target -->
          <button
            type="button"
            @click="closeModal"
            aria-label="关闭学院杯学分竞赛"
            class="min-h-[44px] min-w-[44px] p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 flex items-center justify-center transition-all touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <X class="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        <div class="space-y-6 pt-4 pb-2">
          <!-- SECTION 1: Four Gemstone Hourglasses (四院宝石沙漏) -->
          <section aria-label="四院宝石沙漏">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold font-serif text-stone-900 flex items-center gap-2">
                <Hourglass class="w-4 h-4 text-amber-700" />
                礼堂巨型宝石沙漏
              </h3>
              <span class="text-xs text-stone-500">
                实时学分计量
              </span>
            </div>

            <!-- Hourglasses Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-stone-900/5 rounded-2xl border border-[#e8ddd0]/70">
              <div
                v-for="house in fourHourglasses"
                :key="house.id"
                class="flex flex-col items-center p-3 rounded-xl transition-all"
                :class="[
                  house.isUserHouse ? 'bg-white shadow-sm ring-2 ring-amber-400/80' : 'bg-white/60 border border-stone-200/60'
                ]"
              >
                <!-- User house badge tag -->
                <div class="h-5 flex items-center justify-center mb-1">
                  <span
                    v-if="house.isUserHouse"
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300"
                  >
                    我的学院
                  </span>
                </div>

                <!-- Hourglass Body Visual -->
                <div class="relative w-16 sm:w-20 h-52 flex flex-col items-center justify-between py-1">
                  <!-- Brass Cap -->
                  <div class="w-14 sm:w-16 h-2 rounded-t-md bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800 border-b border-amber-950/40 shadow-xs" />

                  <!-- Hourglass Glass Container -->
                  <div class="relative w-12 sm:w-14 flex-1 flex flex-col items-center justify-between bg-stone-100/50 border border-stone-300/80 rounded-2xl overflow-hidden shadow-inner backdrop-blur-[1px]">
                    <!-- Upper Chamber (transparent glass with subtle glow) -->
                    <div class="w-full h-12 flex items-center justify-center relative overflow-hidden bg-white/20">
                      <!-- Subtle glass reflection highlight -->
                      <div class="absolute inset-y-0 left-1 w-1 bg-white/40 rounded-full" />
                      <component
                        :is="house.iconComponent"
                        class="w-4 h-4 opacity-30"
                        :style="{ color: house.gemColor }"
                      />
                    </div>

                    <!-- Hourglass Neck -->
                    <div class="w-4 h-2 bg-stone-300/60 border-y border-stone-400/40 flex items-center justify-center z-10">
                      <div class="w-0.5 h-full bg-amber-500/60 animate-pulse" />
                    </div>

                    <!-- Lower Chamber with Dynamic Gemstone Column -->
                    <div class="relative w-full h-32 flex flex-col justify-end overflow-hidden bg-stone-50/60 border-t border-stone-200/30">
                      <!-- Gemstone fill column (height dynamic math formula) -->
                      <div
                        class="w-full rounded-b-xl transition-all duration-700 ease-out relative overflow-hidden shadow-sm"
                        :style="{
                          height: `${house.fillHeight}px`,
                          background: `linear-gradient(to top, ${house.gemColor}, ${house.gemSecondary})`
                        }"
                      >
                        <!-- Gemstone internal facets & sparkles -->
                        <div class="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.8),transparent)]" />
                        <div class="absolute top-1 left-2 w-1.5 h-1.5 bg-white/60 rounded-full blur-[0.5px]" />
                        <div class="absolute top-2 right-2 w-1 h-1 bg-white/70 rounded-full" />
                      </div>
                    </div>
                  </div>

                  <!-- Brass Base -->
                  <div class="w-14 sm:w-16 h-2 rounded-b-md bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800 border-t border-amber-950/40 shadow-xs" />
                </div>

                <!-- House Label & Points Info -->
                <div class="mt-2 text-center w-full">
                  <div class="flex items-center justify-center gap-1">
                    <component
                      :is="house.iconComponent"
                      class="w-3.5 h-3.5 stroke-[2.2]"
                      :style="{ color: house.gemColor }"
                    />
                    <span class="text-xs font-bold text-stone-900 font-serif">
                      {{ house.name }}
                    </span>
                  </div>
                  <div class="text-[11px] font-medium text-stone-500 mt-0.5">
                    {{ house.gemName }}
                  </div>
                  <div
                    class="text-sm sm:text-base font-extrabold mt-1 tracking-tight"
                    :style="{ color: house.gemColor }"
                  >
                    {{ house.points }} <span class="text-[10px] font-normal text-stone-600">分</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- SECTION 2: House Rankings Board (学院积分排行榜 1st - 4th) -->
          <section aria-label="学院积分排行榜">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold font-serif text-stone-900 flex items-center gap-2">
                <Trophy class="w-4 h-4 text-amber-700" />
                四院积分排行榜
              </h3>
              <span class="text-xs text-stone-500">
                依总积分排序
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                v-for="item in gamificationStore.houseRankings"
                :key="item.id"
                class="p-3.5 rounded-xl border flex items-center justify-between transition-all"
                :class="[
                  getRankCardClasses(item.rank),
                  item.isUserHouse ? 'ring-2 ring-amber-500/80 shadow-xs' : ''
                ]"
              >
                <!-- Left: Rank Indicator + House Crest + Name -->
                <div class="flex items-center gap-3">
                  <!-- Rank Indicator -->
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center font-serif font-black text-sm shadow-xs border"
                    :class="getRankBadgeClasses(item.rank)"
                  >
                    <Trophy v-if="item.rank === 1" class="w-4 h-4 text-amber-800 stroke-[2.2]" />
                    <span v-else>{{ item.rank }}</span>
                  </div>

                  <!-- House Crest & Info -->
                  <div>
                    <div class="flex items-center gap-1.5">
                      <component
                        :is="getHouseIcon(item.id)"
                        class="w-4 h-4 stroke-[2]"
                        :style="{ color: item.gemColor }"
                      />
                      <span class="text-sm font-bold text-stone-900 font-serif">
                        {{ item.name }}
                      </span>
                      <span
                        v-if="item.isUserHouse"
                        class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300"
                      >
                        我的学院
                      </span>
                    </div>
                    <div class="text-[11px] text-stone-500 font-sans">
                      {{ item.enName }} · {{ item.gemName }}
                    </div>
                  </div>
                </div>

                <!-- Right: Points & Gap from Leader -->
                <div class="text-right">
                  <div class="text-base font-extrabold text-stone-900 font-mono">
                    {{ item.points }} <span class="text-xs font-normal text-stone-500">分</span>
                  </div>
                  <div class="text-[11px] font-medium">
                    <span
                      v-if="item.rank === 1"
                      class="text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold"
                    >
                      领跑中
                    </span>
                    <span
                      v-else
                      class="text-stone-500 text-[10px]"
                    >
                      落后领跑者 {{ item.gapFromLeader }} 分差距
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- SECTION 3: Personal Contribution Overview (个人学业贡献) -->
          <section aria-label="个人学业贡献">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold font-serif text-stone-900 flex items-center gap-2">
                <Award class="w-4 h-4 text-amber-700" />
                个人学业贡献
              </h3>
              <span class="text-xs text-stone-500">
                巫师个人修习成就
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <!-- Card 1: Total Points Contributed -->
              <div class="p-3.5 rounded-xl bg-white border border-[#e8ddd0] shadow-xs flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center shrink-0">
                  <Sparkles class="w-5 h-5 text-amber-700 stroke-[2]" />
                </div>
                <div>
                  <div class="text-xs text-stone-500 font-medium">
                    累计学分贡献
                  </div>
                  <div class="text-lg font-bold text-stone-900 font-mono">
                    +{{ gamificationStore.studentContribution }} <span class="text-xs font-normal text-stone-500">分</span>
                  </div>
                </div>
              </div>

              <!-- Card 2: Streak Days -->
              <div class="p-3.5 rounded-xl bg-white border border-[#e8ddd0] shadow-xs flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-orange-100 text-orange-900 border border-orange-200 flex items-center justify-center shrink-0">
                  <Flame class="w-5 h-5 text-orange-600 stroke-[2]" />
                </div>
                <div>
                  <div class="text-xs text-stone-500 font-medium">
                    连续修习天数
                  </div>
                  <div class="text-lg font-bold text-stone-900 font-mono">
                    {{ gamificationStore.streakDays }} <span class="text-xs font-normal text-stone-500">天</span>
                  </div>
                </div>
              </div>

              <!-- Card 3: Streak Freezes -->
              <div class="p-3.5 rounded-xl bg-white border border-[#e8ddd0] shadow-xs flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-sky-100 text-sky-900 border border-sky-200 flex items-center justify-center shrink-0">
                  <Shield class="w-5 h-5 text-sky-700 stroke-[2]" />
                </div>
                <div>
                  <div class="text-xs text-stone-500 font-medium">
                    守护神冷冻符
                  </div>
                  <div class="text-lg font-bold text-stone-900 font-mono">
                    {{ gamificationStore.streakFreezes }} <span class="text-xs font-normal text-stone-500">枚可用</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- SECTION 4: Recent Points History (学分明细流水) -->
          <section aria-label="学分明细流水">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold font-serif text-stone-900 flex items-center gap-2">
                <History class="w-4 h-4 text-amber-700" />
                近期学分流水
              </h3>
              <span class="text-xs text-stone-500">
                最近 50 条记录
              </span>
            </div>

            <!-- List or Empty State -->
            <div class="bg-white/70 border border-[#e8ddd0] rounded-xl overflow-hidden shadow-xs">
              <div
                v-if="gamificationStore.pointHistory && gamificationStore.pointHistory.length > 0"
                class="divide-y divide-[#e8ddd0]/60 max-h-48 overflow-y-auto"
              >
                <div
                  v-for="(record, rIdx) in gamificationStore.pointHistory"
                  :key="record.id || `${record.timestamp}-${rIdx}`"
                  class="p-2.5 sm:p-3 flex items-center justify-between text-xs hover:bg-stone-50/80 transition-colors"
                >
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
                      <Sparkles class="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div class="font-medium text-stone-800">
                        {{ record.reason || '学业优异表现' }}
                      </div>
                      <div class="text-[10px] text-stone-600 font-mono">
                        {{ formatPointTime(record.timestamp) }}
                      </div>
                    </div>
                  </div>

                  <div class="font-bold font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    +{{ record.points }}
                  </div>
                </div>
              </div>

              <!-- Empty State Fallback -->
              <div
                v-else
                class="p-6 text-center text-xs text-stone-500 flex flex-col items-center justify-center gap-2"
              >
                <Clock class="w-6 h-6 text-stone-600 stroke-[1.8]" />
                <p>暂无学分记录，开始学习为学院争光吧！</p>
              </div>
            </div>
          </section>
        </div>

        <!-- Modal Footer Actions -->
        <div class="pt-4 mt-2 border-t border-[#e8ddd0]/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <!-- Re-sorting CTA Button with Apple HIG touch target -->
          <button
            type="button"
            @click="onOpenSorting"
            aria-label="重新分院或更换学院"
            class="w-full sm:w-auto min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl border border-stone-300 bg-white/90 hover:bg-stone-100 text-stone-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 touch-manipulation active:scale-95 transition-all shadow-xs"
          >
            <RotateCcw class="w-4 h-4 text-stone-500" />
            <span>重新分院 / 更换学院</span>
          </button>

          <!-- Close Modal Primary Button -->
          <button
            type="button"
            @click="closeModal"
            aria-label="关闭看板"
            class="w-full sm:w-auto min-h-[44px] min-w-[44px] px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-amber-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 touch-manipulation active:scale-95 transition-all shadow-sm"
          >
            <span>返回学习</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, watch, onUnmounted } from 'vue'
import {
  Trophy,
  Sparkles,
  X,
  Hourglass,
  Flame,
  BookOpen,
  Heart,
  Crown,
  Award,
  Shield,
  History,
  Clock,
  RotateCcw
} from 'lucide-vue-next'
import { useGamificationStore, HOUSES } from '../../stores/gamificationStore.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'open-sorting'])

const gamificationStore = useGamificationStore()

// House definition metadata for hourglasses
const HOUSE_METAS = [
  {
    id: 'gryffindor',
    name: '格兰芬多',
    enName: 'Gryffindor',
    gemName: '红宝石 (Ruby)',
    gemColor: '#991b1b',
    gemSecondary: '#ef4444',
    iconComponent: Flame
  },
  {
    id: 'ravenclaw',
    name: '拉文克劳',
    enName: 'Ravenclaw',
    gemName: '蓝宝石 (Sapphire)',
    gemColor: '#1e40af',
    gemSecondary: '#3b82f6',
    iconComponent: BookOpen
  },
  {
    id: 'hufflepuff',
    name: '赫奇帕奇',
    enName: 'Hufflepuff',
    gemName: '黄晶石 (Topaz)',
    gemColor: '#b45309',
    gemSecondary: '#f59e0b',
    iconComponent: Heart
  },
  {
    id: 'slytherin',
    name: '斯莱特林',
    enName: 'Slytherin',
    gemName: '祖母绿 (Emerald)',
    gemColor: '#166534',
    gemSecondary: '#10b981',
    iconComponent: Crown
  }
]

// Gemstone fill height calculation math formula:
// H = max(15, min(130, round((points / max(allPoints, 200)) * 120)))
function computeHourglassHeight(points) {
  const pointsList = Object.values(gamificationStore.housePoints || {}).map(Number)
  const allPointsMax = Math.max(...pointsList, 200)
  return Math.max(15, Math.min(130, Math.round(((Number(points) || 0) / allPointsMax) * 120)))
}

// Four hourglasses dynamic data
const fourHourglasses = computed(() => {
  return HOUSE_METAS.map(meta => {
    const points = Number(gamificationStore.housePoints?.[meta.id]) || 0
    const fillHeight = computeHourglassHeight(points)
    const isUserHouse = gamificationStore.userHouse === meta.id
    return {
      ...meta,
      points,
      fillHeight,
      isUserHouse
    }
  })
})

// House crest icon helper
function getHouseIcon(houseId) {
  switch (houseId) {
    case 'gryffindor':
      return Flame
    case 'ravenclaw':
      return BookOpen
    case 'hufflepuff':
      return Heart
    case 'slytherin':
      return Crown
    default:
      return Flame
  }
}

// Rank card styling tokens
function getRankCardClasses(rank) {
  switch (rank) {
    case 1:
      return 'bg-amber-100 text-amber-900 border-amber-300'
    case 2:
      return 'bg-stone-100 text-stone-800 border-stone-300'
    case 3:
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 4:
    default:
      return 'bg-stone-50 text-stone-600 border-stone-200'
  }
}

// Rank badge styling tokens
function getRankBadgeClasses(rank) {
  switch (rank) {
    case 1:
      return 'bg-amber-200/80 text-amber-900 border-amber-400'
    case 2:
      return 'bg-stone-200/90 text-stone-800 border-stone-300'
    case 3:
      return 'bg-amber-100/90 text-amber-900 border-amber-300'
    case 4:
    default:
      return 'bg-stone-200/60 text-stone-600 border-stone-300'
  }
}

// Format point history timestamp
function formatPointTime(ts) {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    if (isToday) {
      return `今天 ${hours}:${minutes}`
    }
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    return `${month}-${date} ${hours}:${minutes}`
  } catch {
    return ''
  }
}

// Actions
function closeModal() {
  emit('close')
}

function onOpenSorting() {
  emit('open-sorting')
  emit('close')
}

// Esc key accessibility listener
function handleKeydown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    closeModal()
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeydown)
      }
    } else {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeydown)
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>
