<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden">
      <!-- Backdrop -->
      <Transition
        appear
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm"
          @click="$emit('close')"
          aria-hidden="true"
        ></div>
      </Transition>

      <!-- Bottom Sheet Modal Container -->
      <div
        class="fixed inset-0 pointer-events-none flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <Transition
          appear
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="translate-y-full sm:translate-y-4 opacity-0 sm:opacity-0"
          enter-to-class="translate-y-0 opacity-100 sm:opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-full sm:translate-y-4 opacity-0"
        >
          <div
            v-if="isOpen"
            class="pointer-events-auto bg-[#f5efe6] border-t border-x sm:border border-[#e8ddd0] rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:pb-0 text-stone-900"
            :style="sheetStyle"
            @click.stop
            role="dialog"
            aria-modal="true"
            aria-label="魔法学业分析仪表盘"
          >
            <!-- Pull Handle (Mobile only) -->
            <div
              class="pt-3 pb-1 sm:hidden flex justify-center cursor-grab active:cursor-grabbing touch-none shrink-0"
              @touchstart="onTouchStart"
              @touchmove="handleDragTouchMove"
              @touchend="onTouchEnd"
            >
              <div class="w-10 h-1.5 rounded-full bg-[#e8ddd0]"></div>
            </div>

            <!-- Header -->
            <div
              class="px-5 sm:px-6 py-3 sm:py-4 border-b border-[#e8ddd0] bg-white/70 flex items-center justify-between shrink-0 select-none touch-none"
              @touchstart="onTouchStart"
              @touchmove="handleDragTouchMove"
              @touchend="onTouchEnd"
            >
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900">
                  <BarChart2 class="w-4 h-4" />
                </div>
                <h2 class="font-serif text-base font-semibold text-stone-900">
                  魔法学业分析仪表盘
                </h2>
              </div>

              <button
                type="button"
                @click="$emit('close')"
                class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-[#f5efe6] flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
                aria-label="关闭仪表盘"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Main Scrollable Content -->
            <div
              ref="scrollContainerRef"
              class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 sm:space-y-6 ios-scroll"
              @touchstart="onTouchStart"
              @touchmove="handleContentTouchMove"
              @touchend="onTouchEnd"
            >
            <!-- 4 Core Metric Stat Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <!-- Streak Days -->
              <div class="p-3.5 bg-white/80 border border-[#e8ddd0] rounded-xl flex flex-col gap-1 text-stone-900">
                <div class="flex items-center gap-1.5 text-xs text-stone-600">
                  <Flame class="w-4 h-4 text-amber-700" />
                  <span>连续打卡</span>
                </div>
                <div class="text-xl font-bold font-mono text-stone-900">
                  {{ analyticsStore.streakDays }} <span class="text-xs font-normal text-stone-500">天</span>
                </div>
              </div>

              <!-- Total Listening Hours -->
              <div class="p-3.5 bg-white/80 border border-[#e8ddd0] rounded-xl flex flex-col gap-1 text-stone-900">
                <div class="flex items-center gap-1.5 text-xs text-stone-600">
                  <Clock class="w-4 h-4 text-amber-700" />
                  <span>总听时长</span>
                </div>
                <div class="text-xl font-bold font-mono text-stone-900">
                  {{ analyticsStore.totalHours }} <span class="text-xs font-normal text-stone-500">小时</span>
                </div>
              </div>

              <!-- Completed Chapters -->
              <div class="p-3.5 bg-white/80 border border-[#e8ddd0] rounded-xl flex flex-col gap-1 text-stone-900">
                <div class="flex items-center gap-1.5 text-xs text-stone-600">
                  <BookOpen class="w-4 h-4 text-amber-700" />
                  <span>通读章节</span>
                </div>
                <div class="text-xl font-bold font-mono text-stone-900">
                  {{ analyticsStore.completedChaptersCount }} <span class="text-xs font-normal text-stone-500">章</span>
                </div>
              </div>

              <!-- Accuracy Score -->
              <div class="p-3.5 bg-white/80 border border-[#e8ddd0] rounded-xl flex flex-col gap-1 text-stone-900">
                <div class="flex items-center gap-1.5 text-xs text-stone-600">
                  <Award class="w-4 h-4 text-amber-700" />
                  <span>听写平均</span>
                </div>
                <div class="text-xl font-bold font-mono text-stone-900">
                  {{ analyticsStore.accuracyScore }} <span class="text-xs font-normal text-stone-500">%</span>
                </div>
              </div>
            </div>

            <!-- Weekly Listening Minutes SVG Chart -->
            <div class="p-5 bg-white/80 border border-[#e8ddd0] rounded-xl space-y-3 text-stone-900">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-serif text-sm font-semibold text-stone-900">
                    过去 7 天学习分钟趋势
                  </h3>
                  <p class="text-[11px] text-stone-500">
                    每日坚持精听 15 分钟，激活大脑语感回路
                  </p>
                </div>
                <span class="text-xs font-mono font-medium text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300">
                  本周累计: {{ weeklyTotalMinutes }} 分钟
                </span>
              </div>

              <!-- Responsive Weekly Trend Bar Chart -->
              <div class="w-full pt-4 pb-1">
                <!-- Chart Canvas Area with baseline and reference gridlines -->
                <div class="relative w-full h-36 flex items-end justify-between gap-1.5 sm:gap-3 px-1 sm:px-3 pb-2 border-b border-[#e8ddd0]">
                  <!-- Background Grid Lines -->
                  <div class="absolute inset-x-0 top-0 bottom-2 flex flex-col justify-between pointer-events-none px-1 sm:px-3">
                    <div class="border-b border-dashed border-[#e8ddd0]/60 w-full"></div>
                    <div class="border-b border-dashed border-[#e8ddd0]/60 w-full"></div>
                    <div class="h-0 w-full"></div>
                  </div>

                  <!-- 7 Day Columns -->
                  <div
                    v-for="(day, idx) in weeklyData"
                    :key="idx"
                    class="flex-1 flex flex-col items-center justify-end h-full z-10 group"
                  >
                    <!-- Minutes Label on Top -->
                    <span
                      class="text-[10px] sm:text-xs font-mono tabular-nums mb-1 transition-colors leading-none"
                      :class="day.isToday ? 'text-amber-800 font-semibold' : 'text-stone-500 group-hover:text-stone-800'"
                    >
                      {{ day.minutes }}
                    </span>

                    <!-- Bar Pillar Container -->
                    <div class="w-full flex justify-center items-end h-24">
                      <div
                        class="w-full max-w-[24px] sm:max-w-[32px] rounded-t-md transition-all duration-300"
                        :style="{ height: `${day.heightPercent}%` }"
                        :class="day.isToday ? 'bg-amber-700 hover:bg-amber-800' : 'bg-[#e8ddd0] hover:bg-stone-300'"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- Day Names Axis Row -->
                <div class="flex items-center justify-between gap-1.5 sm:gap-3 px-1 sm:px-3 pt-2">
                  <div
                    v-for="(day, idx) in weeklyData"
                    :key="idx"
                    class="flex-1 text-center"
                  >
                    <span
                      class="text-[11px] sm:text-xs font-medium transition-colors"
                      :class="day.isToday ? 'text-amber-900 font-bold' : 'text-stone-600'"
                    >
                      {{ day.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Time-Turner Protection Sentinel Banner -->
            <div class="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <ShieldCheck class="w-6 h-6 text-amber-700 shrink-0" />
                <div>
                  <h4 class="font-serif text-sm font-semibold text-amber-950">
                    时间转换器 · 打卡守护结界
                  </h4>
                  <p class="text-xs text-amber-900/90 mt-0.5">
                    已有 1 次免断签护盾。若某日因故未能学习，将自动消耗结界保住连续记录。
                  </p>
                </div>
              </div>

              <span class="text-xs font-mono font-bold text-amber-900 px-2.5 py-1 bg-white/90 rounded-lg border border-amber-300 shrink-0">
                存量: 1
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAnalyticsStore } from '../stores/analyticsStore.js'
import { useBottomSheet } from '../composables/useBottomSheet.js'
import {
  BarChart2,
  Flame,
  Clock,
  BookOpen,
  Award,
  ShieldCheck,
  X
} from 'lucide-vue-next'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const scrollContainerRef = ref(null)

const {
  sheetStyle,
  onTouchStart,
  onTouchMove,
  onTouchEnd
} = useBottomSheet({
  threshold: 80,
  onClose: () => emit('close')
})

function handleDragTouchMove(e) {
  onTouchMove(e, 0)
}

function handleContentTouchMove(e) {
  const st = scrollContainerRef.value ? scrollContainerRef.value.scrollTop : 0
  onTouchMove(e, st)
}

const analyticsStore = useAnalyticsStore()

const weeklyDays = computed(() => analyticsStore.weeklyDays || [])

const weeklyTotalMinutes = computed(() => {
  return weeklyDays.value.reduce((acc, cur) => acc + (cur.minutes || 0), 0)
})

const weeklyData = computed(() => {
  const maxMins = Math.max(...weeklyDays.value.map((d) => d.minutes || 0), 45)
  return weeklyDays.value.map((d) => {
    const percent = Math.max(8, Math.min(100, Math.round(((d.minutes || 0) / maxMins) * 100)))
    return {
      ...d,
      heightPercent: percent,
      height: Math.max(6, Math.round(((d.minutes || 0) / maxMins) * 75))
    }
  })
})
</script>
