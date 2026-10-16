<template>
  <div class="flex-1 min-h-0 overflow-y-auto bg-[#fbf9f5] p-4 sm:p-6 lg:p-8 space-y-6 select-none font-sans">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8ddd0] pb-5">
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="handleBack"
          class="w-10 h-10 rounded-xl border border-[#e8ddd0] bg-white hover:bg-[#faf6ee] text-stone-600 hover:text-stone-900 flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95 shadow-none shrink-0"
          title="返回原著精听"
          aria-label="返回原著精听"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>

        <div class="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0">
          <Trophy class="w-5 h-5 text-amber-700 stroke-[2.2]" />
        </div>

        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              霍格沃茨学院杯
            </h1>
            <span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-sans font-bold">
              <Sparkles :size="12" class="text-amber-700" />
              <span>四院学分沙漏榜</span>
            </span>
          </div>
          <p class="text-xs text-stone-500 font-reading mt-0.5">
            四院学分沙漏与排名榜 · 勤勉修习为学院争光
          </p>
        </div>
      </div>

      <!-- Quick Summary Status -->
      <div class="flex items-center gap-3 bg-[#f5efe6] border border-[#e8ddd0] px-4 py-2.5 rounded-2xl shrink-0">
        <div class="text-right sm:text-left">
          <p class="text-[11px] text-stone-500 font-medium">当前所属学院</p>
          <p class="text-xs font-serif font-bold text-stone-900">
            {{ currentHouseInfo ? `${currentHouseInfo.name} · 贡献 ${studentContribution} 分` : '尚未分院' }}
          </p>
        </div>
        <button
          type="button"
          @click="handleOpenSorting"
          class="min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 cursor-pointer shadow-none shrink-0"
          title="重新分院或更换学院"
          aria-label="重新分院"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>{{ currentHouseInfo ? '更换学院' : '参加分院仪式' }}</span>
        </button>
      </div>
    </div>

    <!-- SECTION 1: Four Gemstone Hourglasses (礼堂巨型宝石沙漏) -->
    <section aria-label="礼堂巨型宝石沙漏">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold font-serif text-stone-900 flex items-center gap-2">
          <Hourglass class="w-4 h-4 text-amber-700" />
          礼堂巨型宝石沙漏
        </h2>
        <span class="text-xs text-stone-500 font-reading">
          实时学分计量 · 刻录四院荣誉
        </span>
      </div>

      <!-- Hourglasses Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 bg-white/60 rounded-2xl border border-[#e8ddd0]">
        <div
          v-for="house in fourHourglasses"
          :key="house.id"
          class="flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all"
          :class="[
            house.isUserHouse ? 'bg-white shadow-xs border-2 border-amber-400/90 ring-2 ring-amber-100' : 'bg-[#faf6ee] border border-[#e8ddd0]'
          ]"
        >
          <!-- User house badge tag -->
          <div class="h-6 flex items-center justify-center mb-1">
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
              <!-- Upper Chamber -->
              <div class="w-full h-12 flex items-center justify-center relative overflow-hidden bg-white/20">
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
                <div
                  class="w-full rounded-b-xl transition-all duration-700 ease-out relative overflow-hidden shadow-xs"
                  :style="{
                    height: `${house.fillHeight}px`,
                    background: `linear-gradient(to top, ${house.gemColor}, ${house.gemSecondary})`
                  }"
                >
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
            <div class="text-[11px] font-medium text-stone-500 mt-0.5 font-reading">
              {{ house.gemName }}
            </div>
            <div
              class="text-sm sm:text-base font-extrabold mt-1 tracking-tight font-mono"
              :style="{ color: house.gemColor }"
            >
              {{ house.points }} <span class="text-[10px] font-normal text-stone-600">分</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: House Rankings Board (四院积分排行榜 1st - 4th) -->
    <section aria-label="四院积分排行榜">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold font-serif text-stone-900 flex items-center gap-2">
          <Trophy class="w-4 h-4 text-amber-700" />
          四院积分排行榜
        </h2>
        <span class="text-xs text-stone-500 font-reading">
          依总积分排序 · 争夺学年学院杯
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          v-for="item in gamificationStore.houseRankings"
          :key="item.id"
          class="p-4 rounded-xl border flex items-center justify-between transition-all"
          :class="[
            getRankCardClasses(item.rank),
            item.isUserHouse ? 'ring-2 ring-amber-400/80 shadow-xs' : ''
          ]"
        >
          <!-- Left: Rank Indicator + House Crest + Name -->
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center font-serif font-black text-sm shadow-xs border"
              :class="getRankBadgeClasses(item.rank)"
            >
              <Trophy v-if="item.rank === 1" class="w-4 h-4 text-amber-800 stroke-[2.2]" />
              <span v-else>{{ item.rank }}</span>
            </div>

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
            <div class="text-[11px] font-medium mt-0.5">
              <span
                v-if="item.rank === 1"
                class="text-amber-900 bg-amber-200/80 border border-amber-300/80 px-2 py-0.5 rounded text-[10px] font-bold"
              >
                领跑中
              </span>
              <span
                v-else
                class="text-stone-500 text-[10px]"
              >
                落后 {{ item.gapFromLeader }} 分
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 3: Personal Contribution Overview (个人学业贡献) -->
    <section aria-label="个人学业贡献">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold font-serif text-stone-900 flex items-center gap-2">
          <Award class="w-4 h-4 text-amber-700" />
          个人学业贡献
        </h2>
        <span class="text-xs text-stone-500 font-reading">
          巫师修习成就与连续契约
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Card 1: Total Points Contributed -->
        <div class="p-4 rounded-xl bg-white border border-[#e8ddd0] shadow-xs flex items-center gap-3">
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
        <div class="p-4 rounded-xl bg-white border border-[#e8ddd0] shadow-xs flex items-center gap-3">
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
        <div class="p-4 rounded-xl bg-white border border-[#e8ddd0] shadow-xs flex items-center gap-3">
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
        <h2 class="text-sm font-bold font-serif text-stone-900 flex items-center gap-2">
          <History class="w-4 h-4 text-amber-700" />
          近期学分明细
        </h2>
        <span class="text-xs text-stone-500 font-reading">
          记录最近 50 条研习学分流向
        </span>
      </div>

      <div class="bg-white rounded-xl border border-[#e8ddd0] overflow-hidden shadow-xs">
        <div
          v-if="gamificationStore.pointHistory && gamificationStore.pointHistory.length > 0"
          class="divide-y divide-[#e8ddd0]/60 max-h-56 overflow-y-auto"
        >
          <div
            v-for="(record, rIdx) in gamificationStore.pointHistory"
            :key="record.id || `${record.timestamp}-${rIdx}`"
            class="p-3 flex items-center justify-between text-xs hover:bg-[#faf6ee] transition-colors"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
                <Sparkles class="w-3.5 h-3.5" />
              </div>
              <div>
                <div class="font-medium text-stone-800">
                  {{ record.reason || '学业优异表现' }}
                </div>
                <div class="text-[10px] text-stone-500 font-mono">
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
          class="p-8 text-center text-xs text-stone-500 flex flex-col items-center justify-center gap-2 bg-[#faf6ee]/50"
        >
          <Clock class="w-6 h-6 text-stone-400 stroke-[1.8]" />
          <p>暂无学分记录，开始原著精听或完成闯关为学院争光吧！</p>
        </div>
      </div>
    </section>

    <!-- Bottom Actions -->
    <div class="pt-2 border-t border-[#e8ddd0] flex flex-col sm:flex-row items-center justify-between gap-3">
      <button
        type="button"
        @click="handleOpenSorting"
        class="w-full sm:w-auto min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 touch-manipulation active:scale-95 transition-all shadow-none cursor-pointer"
        aria-label="重新分院或更换学院"
      >
        <RotateCcw class="w-4 h-4 text-stone-500" />
        <span>重新分院 / 更换学院</span>
      </button>

      <button
        type="button"
        @click="handleBack"
        class="w-full sm:w-auto min-h-[44px] min-w-[44px] px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-amber-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 touch-manipulation active:scale-95 transition-all shadow-none cursor-pointer"
        aria-label="返回原著精听"
      >
        <span>返回原著精听</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Trophy,
  Sparkles,
  ArrowLeft,
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
import { useGamificationStore } from '../../stores/gamificationStore.js'
import { useNavigationStore } from '../../stores/navigationStore.js'

const emit = defineEmits(['open-sorting', 'back'])

const gamificationStore = useGamificationStore()
const navigationStore = useNavigationStore()

const currentHouseInfo = computed(() => gamificationStore.currentHouseInfo)
const studentContribution = computed(() => gamificationStore.studentContribution || 0)

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

function computeHourglassHeight(points) {
  const pointsList = Object.values(gamificationStore.housePoints || {}).map(Number)
  const allPointsMax = Math.max(...pointsList, 200)
  return Math.max(15, Math.min(130, Math.round(((Number(points) || 0) / allPointsMax) * 120)))
}

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

function getRankCardClasses(rank) {
  switch (rank) {
    case 1:
      return 'bg-amber-100/90 text-amber-950 border-amber-300'
    case 2:
      return 'bg-stone-100/80 text-stone-900 border-stone-300'
    case 3:
      return 'bg-amber-50/80 text-amber-900 border-amber-200'
    case 4:
    default:
      return 'bg-stone-50/70 text-stone-700 border-stone-200'
  }
}

function getRankBadgeClasses(rank) {
  switch (rank) {
    case 1:
      return 'bg-amber-200 text-amber-950 border-amber-400'
    case 2:
      return 'bg-stone-200 text-stone-900 border-stone-300'
    case 3:
      return 'bg-amber-100 text-amber-900 border-amber-300'
    case 4:
    default:
      return 'bg-stone-100 text-stone-600 border-stone-200'
  }
}

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

function handleBack() {
  navigationStore.setView('player')
  emit('back')
}

function handleOpenSorting() {
  emit('open-sorting')
}
</script>
