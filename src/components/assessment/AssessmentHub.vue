<template>
  <div class="h-full w-full bg-[#fbf9f5] overflow-y-auto p-4 md:p-6 lg:p-8" data-testid="assessment-hub">
    <div class="max-w-7xl mx-auto space-y-6">
      
      <!-- Top header banner -->
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e8ddd0] pb-4">
        <div>
          <div class="flex items-center gap-2">
            <Award class="w-6 h-6 text-amber-700 shrink-0" />
            <h1 class="text-xl md:text-2xl font-bold font-serif text-stone-900 tracking-tight">能力评定大厅 · O.W.L.s 魔法评定</h1>
          </div>
          <p class="text-xs md:text-sm text-stone-600 mt-1">基于欧洲语言共同参考框架（CEFR）与霍格沃茨学业水准的五维全景能力图谱</p>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border" :class="cefrColorClass">
            <Shield class="w-3.5 h-3.5" />
            <span>{{ analyticsStore.cefrLevel }} 等级认证</span>
          </span>
        </div>
      </header>

      <!-- Three-Device Layout: Mobile (1-col), Tablet (2-col), Desktop (3-col) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        
        <!-- COLUMN 1: Hero Wizard Rank Card & 3-Tier Action Pyramid -->
        <section class="space-y-6 flex flex-col">
          <!-- Hero Rank Card -->
          <div class="bg-[#f5efe6] border border-[#e8ddd0] rounded-2xl p-5 md:p-6 flex flex-col gap-4">
            <div class="flex items-start justify-between">
              <div class="space-y-1">
                <span class="text-xs font-medium uppercase tracking-wider text-amber-800">当前魔法资质</span>
                <h2 class="text-2xl font-bold font-serif text-stone-900">{{ analyticsStore.wizardTitle }}</h2>
              </div>
              <div class="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                <Sparkles class="w-6 h-6" />
              </div>
            </div>

            <!-- CEFR Badge & Level Description -->
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-md text-xs font-bold border" :class="cefrColorClass">
                {{ analyticsStore.cefrLevel }}
              </span>
              <span class="text-xs text-stone-600 font-medium">
                {{ cefrDescription }}
              </span>
            </div>

            <!-- Progression bar to next level -->
            <div class="space-y-1.5 pt-2 border-t border-[#e8ddd0]/60">
              <div class="flex justify-between items-center text-xs">
                <span class="text-stone-600">晋升至下一阶阶位</span>
                <span class="font-bold text-amber-900">{{ analyticsStore.nextLevelProgress }}%</span>
              </div>
              <div class="w-full bg-[#e8ddd0] rounded-full h-2.5 overflow-hidden">
                <div
                  class="bg-amber-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  :style="{ width: `${analyticsStore.nextLevelProgress}%` }"
                  role="progressbar"
                  :aria-valuenow="analyticsStore.nextLevelProgress"
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
              <p class="text-[11px] text-stone-500 text-right">
                {{ nextLevelTargetText }}
              </p>
            </div>
          </div>

          <!-- 3-Tier Action Pyramid -->
          <div class="bg-white/60 border border-[#e8ddd0] rounded-2xl p-5 space-y-3">
            <div class="text-xs font-semibold text-stone-600 uppercase tracking-wider">评定与考核行动</div>
            
            <!-- Tier 1: Dominant Primary Action -->
            <button
              type="button"
              @click="showExamModal = true"
              class="w-full bg-amber-700 hover:bg-amber-800 active:scale-[0.98] text-amber-50 font-medium py-3 px-4 rounded-xl min-h-[44px] min-w-[44px] touch-manipulation flex items-center justify-center gap-2 transition-transform shadow-none"
            >
              <Sparkles class="w-5 h-5 text-amber-200" />
              <span class="font-bold">开启 O.W.L.s 等级评定考核</span>
            </button>

            <!-- Tier 2: Secondary Action -->
            <button
              type="button"
              @click="showCertModal = true"
              class="w-full bg-[#fbf9f5] hover:bg-[#f2ece2] border border-[#e8ddd0] active:scale-[0.98] text-stone-800 font-medium py-2.5 px-4 rounded-xl min-h-[44px] min-w-[44px] touch-manipulation flex items-center justify-center gap-2 transition-transform"
            >
              <Printer class="w-4 h-4 text-amber-700" />
              <span>查看/打印羊皮纸成绩单</span>
            </button>

            <!-- Tier 3: Tertiary Action / Info Link -->
            <button
              type="button"
              @click="showCefrInfo = !showCefrInfo"
              class="w-full text-stone-600 hover:text-stone-900 active:scale-[0.98] text-xs py-2 px-3 rounded-lg min-h-[44px] min-w-[44px] touch-manipulation flex items-center justify-center gap-1.5 transition-colors"
            >
              <Info class="w-3.5 h-3.5" />
              <span>{{ showCefrInfo ? '收起 CEFR 阶梯说明' : '了解 CEFR 阶梯与评定标准' }}</span>
            </button>

            <!-- CEFR Explanatory Info Card (Collapsible) -->
            <div v-if="showCefrInfo" class="mt-2 p-3 bg-[#f5efe6] border border-[#e8ddd0] rounded-xl text-xs space-y-2 text-stone-700">
              <div class="font-bold text-amber-950 flex items-center gap-1.5">
                <Shield class="w-3.5 h-3.5 text-amber-700" />
                <span>欧洲语言共同参考标准 (CEFR) 魔法对照表</span>
              </div>
              <ul class="space-y-1.5 text-[11px] leading-relaxed text-stone-600">
                <li><strong class="text-emerald-800">A2 魔法学徒</strong>：掌握听辨简易指令与中考基础词汇</li>
                <li><strong class="text-amber-800">B1 魔法探索者</strong>：无障碍理解原著主线，具备流利口语复述</li>
                <li><strong class="text-amber-900">B2 魔法进阶者</strong>：自如把握复杂语境与高级从句，精准听写</li>
                <li><strong class="text-purple-900">C1 傲罗精通</strong>：深度领悟文化隐喻与修辞，纯熟输出</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- COLUMN 2: Pure SVG 5-Axis Radar Chart & Dimension Scores -->
        <section class="bg-white/60 border border-[#e8ddd0] rounded-2xl p-5 md:p-6 flex flex-col items-center">
          <div class="w-full flex items-center justify-between border-b border-[#e8ddd0] pb-3 mb-4">
            <div class="flex items-center gap-2">
              <Shield class="w-5 h-5 text-amber-700" />
              <h2 class="text-base font-bold text-stone-900">五维能力雷达图</h2>
            </div>
            <span class="text-xs text-stone-500">满分 100 分制</span>
          </div>

          <!-- SVG Radar Chart Container -->
          <div class="w-full max-w-[340px] aspect-square flex items-center justify-center relative">
            <svg
              viewBox="0 0 400 400"
              class="w-full h-full overflow-visible"
              role="img"
              aria-label="五维能力雷达图"
            >
              <!-- 5 Concentric Grid Polygons (20%, 40%, 60%, 80%, 100%) -->
              <polygon
                v-for="(gridPts, gIdx) in concentricGrids"
                :key="gIdx"
                :points="gridPts"
                fill="none"
                stroke="#e8ddd0"
                stroke-width="1"
                :stroke-dasharray="gIdx === 4 ? '' : '3 3'"
              />

              <!-- 5 Axis Lines from Center (200, 200) to Vertices -->
              <line
                v-for="axis in axisVertices"
                :key="'line-' + axis.key"
                x1="200"
                y1="200"
                :x2="axis.x"
                :y2="axis.y"
                stroke="#d5c7b5"
                stroke-width="1"
                stroke-dasharray="2 2"
              />

              <!-- Dynamic User Data Polygon -->
              <polygon
                :points="analyticsStore.radarPolygonPoints(200, 200, 140)"
                fill="rgba(245, 158, 11, 0.28)"
                stroke="#d97706"
                stroke-width="2.5"
                class="transition-all duration-700 ease-out"
              />

              <!-- Vertex Score Marker Circles -->
              <circle
                v-for="(pt, pIdx) in dimensionPoints"
                :key="'pt-' + pIdx"
                :cx="pt.x"
                :cy="pt.y"
                r="4.5"
                fill="#d97706"
                stroke="#fbf9f5"
                stroke-width="2"
              />

              <!-- Dimension Labels at Vertices -->
              <text
                v-for="axis in axisVertices"
                :key="'text-' + axis.key"
                :x="axis.labelX"
                :y="axis.labelY"
                :text-anchor="axis.anchor"
                dominant-baseline="central"
                class="text-[12px] font-semibold fill-stone-700 select-none"
              >
                {{ axis.name }}
              </text>
            </svg>
          </div>

          <!-- Dimension Scores Breakdown Bar List -->
          <div class="w-full mt-4 space-y-2.5 border-t border-[#e8ddd0] pt-4">
            <div
              v-for="axis in axisVertices"
              :key="'bar-' + axis.key"
              class="flex items-center justify-between text-xs"
            >
              <div class="flex items-center gap-1.5 w-24">
                <component :is="axis.icon" class="w-3.5 h-3.5 text-stone-500" />
                <span class="text-stone-700 font-medium">{{ axis.name }}</span>
              </div>
              <div class="flex-1 mx-3 bg-[#e8ddd0] rounded-full h-2 overflow-hidden">
                <div
                  class="bg-amber-600 h-2 rounded-full transition-all duration-500"
                  :style="{ width: `${analyticsStore.radarDimensions[axis.key] || 0}%` }"
                />
              </div>
              <span class="font-mono font-bold text-stone-900 w-8 text-right">
                {{ analyticsStore.radarDimensions[axis.key] || 0 }}
              </span>
            </div>
          </div>
        </section>

        <!-- COLUMN 3: 3-Card Metrics Overview & Milestones -->
        <section class="space-y-4 flex flex-col md:col-span-2 lg:col-span-1">
          <!-- Metric Card 1: 听力总时长 -->
          <div class="bg-white/60 border border-[#e8ddd0] rounded-2xl p-5 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Volume2 class="w-5 h-5 text-amber-700" />
                <h3 class="text-sm font-bold text-stone-900">听力总时长</h3>
              </div>
              <span class="text-xs text-stone-500">累计磨耳朵</span>
            </div>
            <div class="flex items-baseline gap-2 pt-1">
              <span class="text-3xl font-bold font-serif text-stone-900">
                {{ Math.round((analyticsStore.listeningSeconds || 0) / 60) }}
              </span>
              <span class="text-xs text-stone-600 font-medium">分钟 (约 {{ analyticsStore.totalHours }} 小时)</span>
            </div>
            <p class="text-xs text-stone-500 flex items-center gap-1 pt-1 border-t border-[#e8ddd0]/60">
              <Clock class="w-3.5 h-3.5" />
              <span>已完成 {{ analyticsStore.listeningSessionsCount }} 次沉浸式听读训练会话</span>
            </p>
          </div>

          <!-- Metric Card 2: 词汇六维分布 -->
          <div class="bg-white/60 border border-[#e8ddd0] rounded-2xl p-5 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <BookOpen class="w-5 h-5 text-amber-700" />
                <h3 class="text-sm font-bold text-stone-900">词汇六维分布</h3>
              </div>
              <span class="text-xs text-stone-500">掌握生词</span>
            </div>
            <div class="flex items-baseline gap-2 pt-1">
              <span class="text-3xl font-bold font-serif text-stone-900">
                {{ vocabStore.vocabList.length }}
              </span>
              <span class="text-xs text-stone-600 font-medium">总收录单词</span>
            </div>
            <!-- L1 - L4 Acquisition Breakdown -->
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[#e8ddd0]/60 text-xs">
              <div class="flex items-center justify-between p-1.5 rounded-lg bg-[#f5efe6]">
                <span class="text-stone-600">L1 辨音识别</span>
                <span class="font-bold text-stone-900">{{ vocabBreakdown.l1 }}</span>
              </div>
              <div class="flex items-center justify-between p-1.5 rounded-lg bg-[#f5efe6]">
                <span class="text-stone-600">L2 词义理解</span>
                <span class="font-bold text-stone-900">{{ vocabBreakdown.l2 }}</span>
              </div>
              <div class="flex items-center justify-between p-1.5 rounded-lg bg-[#f5efe6]">
                <span class="text-stone-600">L3 拼写回想</span>
                <span class="font-bold text-stone-900">{{ vocabBreakdown.l3 }}</span>
              </div>
              <div class="flex items-center justify-between p-1.5 rounded-lg bg-[#f5efe6]">
                <span class="text-stone-600">L4 造句产出</span>
                <span class="font-bold text-stone-900">{{ vocabBreakdown.l4 }}</span>
              </div>
            </div>
          </div>

          <!-- Metric Card 3: 产出表现 -->
          <div class="bg-white/60 border border-[#e8ddd0] rounded-2xl p-5 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Mic class="w-5 h-5 text-amber-700" />
                <h3 class="text-sm font-bold text-stone-900">产出表现</h3>
              </div>
              <span class="text-xs text-stone-500">口语与拼写</span>
            </div>
            <div class="grid grid-cols-2 gap-3 pt-1">
              <div class="p-2.5 rounded-xl bg-[#f5efe6] border border-[#e8ddd0]">
                <div class="text-[11px] text-stone-500 flex items-center gap-1">
                  <Mic class="w-3 h-3 text-amber-700" />
                  <span>跟读平均分</span>
                </div>
                <div class="text-2xl font-bold font-serif text-stone-900 mt-1">
                  {{ shadowingAvgScore }} <span class="text-xs font-normal text-stone-600">分</span>
                </div>
              </div>
              <div class="p-2.5 rounded-xl bg-[#f5efe6] border border-[#e8ddd0]">
                <div class="text-[11px] text-stone-500 flex items-center gap-1">
                  <PenTool class="w-3 h-3 text-amber-700" />
                  <span>听写精准率</span>
                </div>
                <div class="text-2xl font-bold font-serif text-stone-900 mt-1">
                  {{ dictationAccuracy }}<span class="text-xs font-normal text-stone-600">%</span>
                </div>
              </div>
            </div>
            <p class="text-[11px] text-stone-500 pt-1 border-t border-[#e8ddd0]/60">
              综合产出水平决定 O.W.L.s 等级评估的高阶晋升门禁。
            </p>
          </div>
        </section>

      </div>
    </div>

    <!-- O.W.L.s Exam Modal -->
    <OwlsExamModal
      :is-open="showExamModal"
      @close="showExamModal = false"
      @exam-completed="handleExamCompleted"
    />

    <!-- O.W.L.s Certificate Modal -->
    <OwlsCertificateModal
      :is-open="showCertModal"
      :exam-record="latestExamRecord"
      @close="showCertModal = false"
      @start-exam="handleStartExamFromCert"
    />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Award,
  Shield,
  BookOpen,
  Volume2,
  Mic,
  PenTool,
  Printer,
  Sparkles,
  Clock,
  Info,
  Ear
} from 'lucide-vue-next'
import { useAnalyticsStore } from '../../stores/analyticsStore.js'
import { useVocabStore } from '../../stores/vocabStore.js'
import OwlsExamModal from './OwlsExamModal.vue'
import OwlsCertificateModal from './OwlsCertificateModal.vue'

// Stores
const analyticsStore = useAnalyticsStore()
const vocabStore = useVocabStore()

// Modal bindings & state toggles (OwlsExamModal and OwlsCertificateModal)
const showExamModal = ref(false)
const showCertModal = ref(false)
const showCefrInfo = ref(false)
const latestExamRecord = ref(null)

// CEFR Level Color Badge Class
const cefrColorClass = computed(() => {
  const level = analyticsStore.cefrLevel
  if (level === 'C1') {
    return 'bg-purple-100 text-purple-900 border-purple-300'
  }
  if (level === 'B1' || level === 'B2') {
    return 'bg-amber-100 text-amber-900 border-amber-300'
  }
  return 'bg-emerald-100 text-emerald-800 border-emerald-300'
})

// CEFR Level Description
const cefrDescription = computed(() => {
  const level = analyticsStore.cefrLevel
  const map = {
    A1: '初阶入门 · 建立语音感知与日常高频词汇',
    A2: '魔法学徒 · 掌握听辨简易指令与中考核心词汇',
    B1: '魔法探索者 · 理解原著主线，具备流利口语表达',
    B2: '魔法进阶者 · 把握复杂语境与高级从句，精准听写',
    C1: '傲罗精通 · 深度理解隐喻修辞，产出纯正无碍'
  }
  return map[level] || map.A2
})

// Next Level Progress Helper Text
const nextLevelTargetText = computed(() => {
  const level = analyticsStore.cefrLevel
  if (level === 'C1') return '已达最高荣誉阶段 (傲罗精通)'
  if (level === 'B2') return '目标 C1：需积累 180 分钟听力、300 词汇及跟读 85 分'
  if (level === 'B1') return '目标 B2：需积累 120 分钟听力、160 词汇及跟读 80 分'
  return '目标 B1：需积累 90 分钟听力、80 词汇及跟读 70 分'
})

// Concentric 5-layer grid polygons (20%, 40%, 60%, 80%, 100%)
const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]
const concentricGrids = computed(() => {
  const cx = 200
  const cy = 200
  const maxR = 140

  return gridLevels.map((frac) => {
    const r = maxR * frac
    const pts = []
    for (let i = 0; i < 5; i++) {
      const angleDeg = -90 + i * 72
      const angleRad = (angleDeg * Math.PI) / 180
      const x = Number((cx + r * Math.cos(angleRad)).toFixed(1))
      const y = Number((cy + r * Math.sin(angleRad)).toFixed(1))
      pts.push(`${x},${y}`)
    }
    return pts.join(' ')
  })
})

// 5 Axes vertices & labels
const axisVertices = computed(() => {
  const cx = 200
  const cy = 200
  const r = 140
  const dims = [
    { name: '听音辨析', key: 'auditory', anchor: 'middle', offsetR: 26, icon: Ear },
    { name: '词汇深度', key: 'vocabDepth', anchor: 'start', offsetR: 28, icon: BookOpen },
    { name: '语境理解', key: 'comprehension', anchor: 'start', offsetR: 26, icon: Shield },
    { name: '口语流利', key: 'shadowing', anchor: 'end', offsetR: 26, icon: Mic },
    { name: '拼写产出', key: 'production', anchor: 'end', offsetR: 28, icon: PenTool }
  ]

  return dims.map((dim, i) => {
    const angleDeg = -90 + i * 72
    const angleRad = (angleDeg * Math.PI) / 180
    const x = Number((cx + r * Math.cos(angleRad)).toFixed(1))
    const y = Number((cy + r * Math.sin(angleRad)).toFixed(1))
    const labelX = Number((cx + (r + dim.offsetR) * Math.cos(angleRad)).toFixed(1))
    const labelY = Number((cy + (r + dim.offsetR) * Math.sin(angleRad)).toFixed(1))

    return {
      ...dim,
      x,
      y,
      labelX,
      labelY
    }
  })
})

// Dimension Data Points for vertex dots
const dimensionPoints = computed(() => {
  const cx = 200
  const cy = 200
  const radius = 140
  const dims = analyticsStore.radarDimensions
  const keys = ['auditory', 'vocabDepth', 'comprehension', 'shadowing', 'production']

  return keys.map((key, i) => {
    const score = Math.min(100, Math.max(0, dims[key] ?? 50))
    const angleDeg = -90 + i * 72
    const angleRad = (angleDeg * Math.PI) / 180
    const scaledR = radius * (score / 100)
    const x = Number((cx + scaledR * Math.cos(angleRad)).toFixed(1))
    const y = Number((cy + scaledR * Math.sin(angleRad)).toFixed(1))
    return { x, y, score }
  })
})

// Vocab L1-L4 breakdown
const vocabBreakdown = computed(() => {
  const list = vocabStore.vocabList || []
  return {
    l1: list.filter((w) => w.acquisition?.l1).length,
    l2: list.filter((w) => w.acquisition?.l2).length,
    l3: list.filter((w) => w.acquisition?.l3).length,
    l4: list.filter((w) => w.acquisition?.l4).length
  }
})

// Output metrics calculations
const shadowingAvgScore = computed(() => {
  const hist = analyticsStore.shadowingHistory || []
  if (hist.length === 0) return 60
  const sum = hist.reduce((acc, h) => acc + (Number(h.score) || 0), 0)
  return Math.round(sum / hist.length)
})

const dictationAccuracy = computed(() => {
  const hist = analyticsStore.dictationHistory || []
  if (hist.length === 0) return 50
  let correct = 0
  let total = 0
  for (const item of hist) {
    correct += Number(item.correctCount) || 0
    total += Number(item.totalCount) || 0
  }
  if (total === 0) return 50
  return Math.round((correct / total) * 100)
})

function handleExamCompleted(record) {
  latestExamRecord.value = record
  showExamModal.value = false
  showCertModal.value = true
}

function handleStartExamFromCert() {
  showCertModal.value = false
  showExamModal.value = true
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
