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
            class="pointer-events-auto bg-[#f8f8f6] border-t border-x sm:border border-[#e4e4e7] rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:pb-0"
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
              <div class="w-10 h-1.5 rounded-full bg-stone-300"></div>
            </div>

            <!-- Header -->
            <div
              class="px-5 sm:px-6 py-3 sm:py-4 border-b border-[#e4e4e7] bg-white flex items-center justify-between shrink-0 select-none touch-none"
              @touchstart="onTouchStart"
              @touchmove="handleDragTouchMove"
              @touchend="onTouchEnd"
            >
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563eb]">
                  <BarChart2 class="w-4 h-4" />
                </div>
                <h2 class="font-serif text-base font-semibold text-[#18181b]">
                  魔法学业分析仪表盘
                </h2>
              </div>

              <button
                type="button"
                @click="$emit('close')"
                class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors cursor-pointer"
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
              <div class="p-3.5 bg-white border border-[#e4e4e7] rounded-xl flex flex-col gap-1">
                <div class="flex items-center gap-1.5 text-xs text-[#71717a]">
                  <Flame class="w-4 h-4 text-[#2563eb]" />
                  <span>连续打卡</span>
                </div>
                <div class="text-xl font-bold font-mono text-[#18181b]">
                  {{ analyticsStore.streakDays }} <span class="text-xs font-normal text-[#71717a]">天</span>
                </div>
              </div>

              <!-- Total Listening Hours -->
              <div class="p-3.5 bg-white border border-[#e4e4e7] rounded-xl flex flex-col gap-1">
                <div class="flex items-center gap-1.5 text-xs text-[#71717a]">
                  <Clock class="w-4 h-4 text-[#2563eb]" />
                  <span>总听时长</span>
                </div>
                <div class="text-xl font-bold font-mono text-[#18181b]">
                  {{ analyticsStore.totalHours }} <span class="text-xs font-normal text-[#71717a]">小时</span>
                </div>
              </div>

              <!-- Completed Chapters -->
              <div class="p-3.5 bg-white border border-[#e4e4e7] rounded-xl flex flex-col gap-1">
                <div class="flex items-center gap-1.5 text-xs text-[#71717a]">
                  <BookOpen class="w-4 h-4 text-[#2563eb]" />
                  <span>通读章节</span>
                </div>
                <div class="text-xl font-bold font-mono text-[#18181b]">
                  {{ analyticsStore.completedChaptersCount }} <span class="text-xs font-normal text-[#71717a]">章</span>
                </div>
              </div>

              <!-- Accuracy Score -->
              <div class="p-3.5 bg-white border border-[#e4e4e7] rounded-xl flex flex-col gap-1">
                <div class="flex items-center gap-1.5 text-xs text-[#71717a]">
                  <Award class="w-4 h-4 text-[#2563eb]" />
                  <span>听写平均</span>
                </div>
                <div class="text-xl font-bold font-mono text-[#18181b]">
                  {{ analyticsStore.accuracyScore }} <span class="text-xs font-normal text-[#71717a]">%</span>
                </div>
              </div>
            </div>

            <!-- Weekly Listening Minutes SVG Chart -->
            <div class="p-5 bg-white border border-[#e4e4e7] rounded-xl space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-serif text-sm font-semibold text-[#18181b]">
                    过去 7 天学习分钟趋势
                  </h3>
                  <p class="text-[11px] text-[#71717a]">
                    每日坚持精听 15 分钟，激活大脑语感回路
                  </p>
                </div>
                <span class="text-xs font-mono font-medium text-[#2563eb] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  本周累计: {{ weeklyTotalMinutes }} 分钟
                </span>
              </div>

              <!-- Pure SVG Bar Chart -->
              <div class="w-full h-44 pt-2">
                <svg viewBox="0 0 350 140" class="w-full h-full select-none" preserveAspectRatio="none">
                  <!-- Horizontal Grid Lines -->
                  <line x1="20" y1="20" x2="330" y2="20" stroke="#f4f4f5" stroke-width="1" stroke-dasharray="3 3" />
                  <line x1="20" y1="60" x2="330" y2="60" stroke="#f4f4f5" stroke-width="1" stroke-dasharray="3 3" />
                  <line x1="20" y1="100" x2="330" y2="100" stroke="#e4e4e7" stroke-width="1" />

                  <!-- Bars -->
                  <g v-for="(day, idx) in weeklyData" :key="idx">
                    <!-- Bar Column -->
                    <rect
                      :x="35 + idx * 42"
                      :y="100 - day.height"
                      width="24"
                      :height="day.height"
                      rx="4"
                      :fill="day.isToday ? '#2563eb' : '#e4e4e7'"
                      class="transition-all duration-300 hover:fill-blue-700"
                    />
                    <!-- Minutes Label on Top -->
                    <text
                      :x="47 + idx * 42"
                      :y="92 - day.height"
                      text-anchor="middle"
                      font-size="9"
                      fill="#71717a"
                      font-family="monospace"
                    >
                      {{ day.minutes }}
                    </text>
                    <!-- Day Label at Bottom -->
                    <text
                      :x="47 + idx * 42"
                      y="118"
                      text-anchor="middle"
                      font-size="10"
                      :fill="day.isToday ? '#2563eb' : '#71717a'"
                      font-weight="500"
                    >
                      {{ day.name }}
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            <!-- Time-Turner Protection Sentinel Banner -->
            <div class="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <ShieldCheck class="w-6 h-6 text-[#2563eb] shrink-0" />
                <div>
                  <h4 class="font-serif text-sm font-semibold text-blue-950">
                    时间转换器 · 打卡守护结界
                  </h4>
                  <p class="text-xs text-blue-800/90 mt-0.5">
                    已有 1 次免断签护盾。若某日因故未能学习，将自动消耗结界保住连续记录。
                  </p>
                </div>
              </div>

              <span class="text-xs font-mono font-bold text-[#2563eb] px-2.5 py-1 bg-white rounded-lg border border-blue-200 shrink-0">
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
  return weeklyDays.value.map((d) => ({
    ...d,
    height: Math.max(6, Math.round(((d.minutes || 0) / maxMins) * 75))
  }))
})
</script>
