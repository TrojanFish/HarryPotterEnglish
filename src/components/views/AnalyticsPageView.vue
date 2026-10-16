<template>
  <div class="flex-1 min-h-0 overflow-y-auto bg-[#fbf9f5] p-4 sm:p-6 lg:p-8 space-y-6 select-none font-sans">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8ddd0] pb-5">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0">
          <BarChart2 class="w-5 h-5" />
        </div>
        <div>
          <h1 class="font-serif text-xl sm:text-2xl font-bold text-stone-900">
            魔法学业分析仪表盘
          </h1>
          <p class="text-xs text-stone-500 font-reading mt-0.5">
            连续打卡学情追踪 · 听力分布 · SLA 语言产出量化
          </p>
        </div>
      </div>

      <!-- Quick Status Badge & Action -->
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <ShieldCheck class="w-4 h-4 text-amber-700" />
          <span>打卡护盾守护中</span>
        </span>
        <button
          type="button"
          @click="analyticsStore.fetchStats?.()"
          class="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-white hover:bg-[#faf6ee] border border-[#e8ddd0] text-stone-800 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer touch-manipulation"
          title="刷新学业数据"
          aria-label="刷新学业数据"
        >
          <RotateCw class="w-4 h-4 text-amber-700" />
          <span class="hidden sm:inline">刷新数据</span>
        </button>
      </div>
    </div>

    <!-- 4 Core Metric Stat Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Streak Days -->
      <div class="p-5 bg-white border border-[#e8ddd0] rounded-2xl flex flex-col justify-between gap-2 shadow-none hover:border-amber-400 transition-colors">
        <div class="flex items-center gap-2 text-xs text-stone-600 font-medium">
          <Flame class="w-4 h-4 text-orange-600" />
          <span>连续研习打卡</span>
        </div>
        <div class="text-3xl font-bold font-mono text-stone-900">
          {{ analyticsStore.streakDays || 0 }} <span class="text-xs font-normal text-stone-500 font-sans">天</span>
        </div>
        <p class="text-[11px] text-stone-400 font-mono">
          每日需达到 5 分钟听读目标
        </p>
      </div>

      <!-- Total Listening Hours -->
      <div class="p-5 bg-white border border-[#e8ddd0] rounded-2xl flex flex-col justify-between gap-2 shadow-none hover:border-amber-400 transition-colors">
        <div class="flex items-center gap-2 text-xs text-stone-600 font-medium">
          <Clock class="w-4 h-4 text-amber-700" />
          <span>累计沉浸听力</span>
        </div>
        <div class="text-3xl font-bold font-mono text-stone-900">
          {{ analyticsStore.totalHours || '0.0' }} <span class="text-xs font-normal text-stone-500 font-sans">小时</span>
        </div>
        <p class="text-[11px] text-stone-400 font-mono">
          包含哈利·波特与 TED 双轨
        </p>
      </div>

      <!-- Completed Chapters -->
      <div class="p-5 bg-white border border-[#e8ddd0] rounded-2xl flex flex-col justify-between gap-2 shadow-none hover:border-amber-400 transition-colors">
        <div class="flex items-center gap-2 text-xs text-stone-600 font-medium">
          <BookOpen class="w-4 h-4 text-amber-700" />
          <span>原版通读章节</span>
        </div>
        <div class="text-3xl font-bold font-mono text-stone-900">
          {{ analyticsStore.completedChaptersCount || 0 }} <span class="text-xs font-normal text-stone-500 font-sans">章</span>
        </div>
        <p class="text-[11px] text-stone-400 font-mono">
          达到 80% 以上听写完成度
        </p>
      </div>

      <!-- Accuracy Score -->
      <div class="p-5 bg-white border border-[#e8ddd0] rounded-2xl flex flex-col justify-between gap-2 shadow-none hover:border-amber-400 transition-colors">
        <div class="flex items-center gap-2 text-xs text-stone-600 font-medium">
          <Award class="w-4 h-4 text-amber-700" />
          <span>听写拼写真实正确率</span>
        </div>
        <div class="text-3xl font-bold font-mono text-stone-900">
          {{ analyticsStore.accuracyScore || 100 }} <span class="text-xs font-normal text-stone-500 font-sans">%</span>
        </div>
        <p class="text-[11px] text-stone-400 font-mono">
          智能拼写纠错加权得分
        </p>
      </div>
    </div>

    <!-- Weekly Listening Minutes Chart Card -->
    <div class="p-6 bg-white border border-[#e8ddd0] rounded-2xl space-y-4 shadow-none">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 class="font-serif text-base font-bold text-stone-900">
            过去 7 天研习时长分布 (分钟)
          </h2>
          <p class="text-xs text-stone-500 mt-0.5">
            日均达标情况可视化 · 实时同步自 IndexedDB 学习心跳
          </p>
        </div>
        <span class="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
          本周累计: {{ weeklyTotalMinutes }} 分钟
        </span>
      </div>

      <!-- Histogram Bars -->
      <div class="relative w-full h-44 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6 pb-2 border-b border-[#e8ddd0]">
        <div
          v-for="day in weeklyData"
          :key="day.date"
          class="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
        >
          <!-- Hover Minutes Tooltip -->
          <span class="text-[10px] font-mono text-stone-500 transition-opacity">
            {{ day.minutes }}m
          </span>

          <!-- Pillar Bar -->
          <div class="w-full max-w-[42px] bg-stone-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-32">
            <div
              class="w-full rounded-t-lg transition-all duration-500"
              :class="day.isToday ? 'bg-amber-700 hover:bg-amber-800' : 'bg-amber-600/40 hover:bg-amber-600/70'"
              :style="{ height: `${day.heightPercent}%` }"
            ></div>
          </div>

          <!-- Date Label -->
          <span
            class="text-xs font-mono"
            :class="day.isToday ? 'text-amber-800 font-bold' : 'text-stone-500'"
          >
            {{ day.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- Patronus Habit Shield Card -->
    <div class="p-6 bg-[#f5efe6] border border-[#e8ddd0] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-start gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-serif text-sm font-bold text-stone-900">
            守护神连续打卡冻结护盾已生效
          </h3>
          <p class="text-xs text-stone-600 mt-1 leading-relaxed max-w-xl">
            每日完成听书、影子跟读或词汇复习自动注入守护神魔法。即使因考试或旅行中断一天，护盾将自动抵扣一次缺卡，保护您的连续打卡记录不归零。
          </p>
        </div>
      </div>

      <div class="shrink-0">
        <span class="text-xs font-mono font-bold text-amber-900 px-3 py-1.5 bg-white rounded-xl border border-amber-300 inline-flex items-center gap-1.5 shadow-none">
          <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>护盾可用: 1 次</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAnalyticsStore } from '../../stores/analyticsStore.js'
import {
  BarChart2,
  Flame,
  Clock,
  BookOpen,
  Award,
  ShieldCheck,
  RotateCw
} from 'lucide-vue-next'

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
