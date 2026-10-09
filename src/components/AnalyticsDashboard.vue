<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        @click="$emit('close')"
        role="dialog"
        aria-modal="true"
        aria-label="魔法学业分析仪表盘"
      >
        <div
          class="bg-[#fbf9f5] border border-[#e8ddd0] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-[#e8ddd0] flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center text-[#d97706]">
                <BarChart2 class="w-4 h-4" />
              </div>
              <h2 class="font-serif text-base font-semibold text-[#1e1610]">
                魔法学业分析仪表盘
              </h2>
            </div>

            <button
              type="button"
              @click="$emit('close')"
              class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors"
              aria-label="关闭仪表盘"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Main Scrollable Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- 4 Core Metric Stat Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <!-- Streak Days -->
              <div class="p-3.5 bg-white/70 border border-[#e8ddd0] rounded-xl flex flex-col gap-1">
                <div class="flex items-center gap-1.5 text-xs text-[#78695d]">
                  <Flame class="w-4 h-4 text-[#d97706]" />
                  <span>连续打卡</span>
                </div>
                <div class="text-xl font-bold font-mono text-[#1e1610]">
                  {{ analyticsStore.streakDays }} <span class="text-xs font-normal text-[#78695d]">天</span>
                </div>
              </div>

              <!-- Total Listening Hours -->
              <div class="p-3.5 bg-white/70 border border-[#e8ddd0] rounded-xl flex flex-col gap-1">
                <div class="flex items-center gap-1.5 text-xs text-[#78695d]">
                  <Clock class="w-4 h-4 text-[#d97706]" />
                  <span>总听时长</span>
                </div>
                <div class="text-xl font-bold font-mono text-[#1e1610]">
                  {{ analyticsStore.totalHours }} <span class="text-xs font-normal text-[#78695d]">小时</span>
                </div>
              </div>

              <!-- Completed Chapters -->
              <div class="p-3.5 bg-white/70 border border-[#e8ddd0] rounded-xl flex flex-col gap-1">
                <div class="flex items-center gap-1.5 text-xs text-[#78695d]">
                  <BookOpen class="w-4 h-4 text-[#d97706]" />
                  <span>通读章节</span>
                </div>
                <div class="text-xl font-bold font-mono text-[#1e1610]">
                  {{ analyticsStore.completedChaptersCount }} <span class="text-xs font-normal text-[#78695d]">章</span>
                </div>
              </div>

              <!-- Accuracy Score -->
              <div class="p-3.5 bg-white/70 border border-[#e8ddd0] rounded-xl flex flex-col gap-1">
                <div class="flex items-center gap-1.5 text-xs text-[#78695d]">
                  <Award class="w-4 h-4 text-[#d97706]" />
                  <span>听写平均</span>
                </div>
                <div class="text-xl font-bold font-mono text-[#1e1610]">
                  {{ analyticsStore.accuracyScore }} <span class="text-xs font-normal text-[#78695d]">%</span>
                </div>
              </div>
            </div>

            <!-- Weekly Listening Minutes SVG Chart -->
            <div class="p-5 bg-white/70 border border-[#e8ddd0] rounded-xl space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-serif text-sm font-semibold text-[#1e1610]">
                    过去 7 天学习分钟趋势
                  </h3>
                  <p class="text-[11px] text-[#78695d]">
                    每日坚持精听 15 分钟，激活大脑语感回路
                  </p>
                </div>
                <span class="text-xs font-mono font-medium text-[#d97706] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  本周累计: {{ weeklyTotalMinutes }} 分钟
                </span>
              </div>

              <!-- Pure SVG Bar Chart -->
              <div class="w-full h-44 pt-2">
                <svg viewBox="0 0 350 140" class="w-full h-full select-none" preserveAspectRatio="none">
                  <!-- Horizontal Grid Lines -->
                  <line x1="20" y1="20" x2="330" y2="20" stroke="#f4ebe1" stroke-width="1" stroke-dasharray="3 3" />
                  <line x1="20" y1="60" x2="330" y2="60" stroke="#f4ebe1" stroke-width="1" stroke-dasharray="3 3" />
                  <line x1="20" y1="100" x2="330" y2="100" stroke="#e8ddd0" stroke-width="1" />

                  <!-- Bars -->
                  <g v-for="(day, idx) in weeklyData" :key="idx">
                    <!-- Bar Column -->
                    <rect
                      :x="35 + idx * 42"
                      :y="100 - day.height"
                      width="24"
                      :height="day.height"
                      rx="4"
                      :fill="day.isToday ? '#d97706' : '#ebdccb'"
                      class="transition-all duration-300 hover:fill-[#b45309]"
                    />
                    <!-- Minutes Label on Top -->
                    <text
                      :x="47 + idx * 42"
                      :y="92 - day.height"
                      text-anchor="middle"
                      font-size="9"
                      fill="#78695d"
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
                      :fill="day.isToday ? '#d97706' : '#78695d'"
                      font-weight="500"
                    >
                      {{ day.name }}
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            <!-- Time-Turner Protection Sentinel Banner -->
            <div class="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <ShieldCheck class="w-6 h-6 text-[#d97706] shrink-0" />
                <div>
                  <h4 class="font-serif text-sm font-semibold text-amber-950">
                    时间转换器 · 打卡守护结界
                  </h4>
                  <p class="text-xs text-amber-800/90 mt-0.5">
                    已有 1 次免断签护盾。若某日因故未能学习，将自动消耗结界保住连续记录。
                  </p>
                </div>
              </div>

              <span class="text-xs font-mono font-bold text-[#d97706] px-2.5 py-1 bg-white rounded-lg border border-amber-300 shrink-0">
                存量: 1
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useAnalyticsStore } from '../stores/analyticsStore.js'
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

defineEmits(['close'])

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
