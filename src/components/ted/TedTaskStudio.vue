<template>
  <div class="flex flex-col h-full bg-[#fbf9f5] select-none">
    <!-- Header banner -->
    <header class="px-4 pt-4 pb-3 border-b border-[#e8ddd0]/60 bg-[#fbf9f5]">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-amber-950">
            {{ currentTalk?.title ? `${currentTalk.title} · 理解练习` : '理解练习' }}
          </h2>
          <p class="text-xs text-stone-500 mt-0.5">
            完成关键句填空与时间轴观点匹配，检验听力理解成效
          </p>
        </div>
        <div v-if="hasSubmitted" class="text-right">
          <span
            class="text-sm font-mono font-bold px-2.5 py-1 rounded-lg border"
            :class="[
              (taskScore ?? 0) >= 80
                ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                : 'bg-stone-100 text-stone-800 border-stone-300'
            ]"
          >
            得分: {{ taskScore }}分
          </span>
        </div>
      </div>

      <!-- Navigation tabs between Cloze and Matching -->
      <div class="flex items-center gap-2 mt-3">
        <button
          type="button"
          @click="activeSection = 'all'"
          class="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all touch-manipulation focus:outline-none flex items-center gap-1.5"
          :class="[
            activeSection === 'all'
              ? 'bg-amber-900 text-amber-50'
              : 'bg-white text-stone-600 border border-[#e8ddd0] hover:bg-amber-50/50'
          ]"
        >
          <span>完整练习</span>
          <span class="text-[10px] opacity-80">({{ clozeList.length + matchingList.length }}题)</span>
        </button>
        <button
          type="button"
          @click="activeSection = 'cloze'"
          class="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all touch-manipulation focus:outline-none flex items-center gap-1.5"
          :class="[
            activeSection === 'cloze'
              ? 'bg-amber-900 text-amber-50'
              : 'bg-white text-stone-600 border border-[#e8ddd0] hover:bg-amber-50/50'
          ]"
        >
          <span>A. 关键句填空</span>
          <span class="text-[10px] opacity-80">({{ clozeList.length }})</span>
        </button>
        <button
          type="button"
          @click="activeSection = 'matching'"
          class="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all touch-manipulation focus:outline-none flex items-center gap-1.5"
          :class="[
            activeSection === 'matching'
              ? 'bg-amber-900 text-amber-50'
              : 'bg-white text-stone-600 border border-[#e8ddd0] hover:bg-amber-50/50'
          ]"
        >
          <span>B. 观点时间轴匹配</span>
          <span class="text-[10px] opacity-80">({{ matchingList.length }})</span>
        </button>
      </div>
    </header>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Empty state when no talk or no tasks -->
      <div
        v-if="!currentTalk || (clozeList.length === 0 && matchingList.length === 0)"
        class="flex flex-col items-center justify-center p-8 text-center text-stone-500 min-h-[200px]"
      >
        <BookOpen class="w-10 h-10 text-stone-400 mb-2 stroke-[1.5]" aria-hidden="true" />
        <p class="text-sm font-medium">暂无练习题目</p>
        <p class="text-xs text-stone-400 mt-1">请从演讲目录中选择当前演说</p>
      </div>

      <template v-else>
        <!-- Score Card after submission -->
        <section
          v-if="hasSubmitted"
          class="rounded-2xl border p-5 transition-all duration-300"
          :class="[
            (taskScore ?? 0) >= 80
              ? 'bg-amber-500/10 border-amber-300 text-amber-950'
              : 'bg-stone-50 border-[#e8ddd0] text-stone-900'
          ]"
        >
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <!-- Circular score badge -->
              <div
                class="w-16 h-16 rounded-full flex flex-col items-center justify-center shrink-0 border-2"
                :class="[
                  (taskScore ?? 0) >= 80
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : 'border-amber-800 bg-amber-900 text-amber-50'
                ]"
              >
                <span class="text-xl font-bold font-mono leading-none">{{ taskScore }}</span>
                <span class="text-[10px] uppercase font-semibold mt-0.5">SCORE</span>
              </div>

              <!-- Feedback summary & reward badge -->
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-bold">
                    {{ (taskScore ?? 0) >= 80 ? '完成出色！理解深度达标' : '练习已完成，仍有提升空间' }}
                  </h3>
                  <!-- Zap icon for high score reward -->
                  <span
                    v-if="(taskScore ?? 0) >= 80"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white"
                  >
                    <Zap class="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                    <span>魔力满格</span>
                  </span>
                </div>
                <p class="text-xs text-stone-600 mt-1">
                  填空正确: {{ clozeStats.correct }}/{{ clozeStats.total }} ·
                  时间轴匹配正确: {{ matchingStats.correct }}/{{ matchingStats.total }}
                </p>
              </div>
            </div>

            <!-- Action buttons in score card -->
            <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                @click="handleRetry"
                class="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-[#e8ddd0] hover:bg-stone-50 active:scale-95 transition-all touch-manipulation flex items-center justify-center gap-1.5"
              >
                <RefreshCw class="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
                <span>重做练习</span>
              </button>
              <button
                type="button"
                @click="tedStore.goToStep(4)"
                class="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all touch-manipulation flex items-center justify-center gap-1.5"
              >
                <span>前往跟读</span>
                <ArrowRight class="w-4 h-4 stroke-[2]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <!-- SECTION A: CLOZE -->
        <section
          v-if="activeSection === 'all' || activeSection === 'cloze'"
          class="rounded-2xl border border-[#e8ddd0] bg-white p-4 space-y-4"
        >
          <div class="flex items-center justify-between pb-2 border-b border-[#e8ddd0]/60">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                A
              </span>
              <h3 class="text-sm font-bold text-amber-950">
                关键句听力填空 (Cloze)
              </h3>
            </div>
            <span class="text-xs text-stone-500">
              共 {{ clozeList.length }} 题 · 听演讲原文填入缺失短语
            </span>
          </div>

          <!-- Cloze questions list -->
          <div class="space-y-4">
            <article
              v-for="(q, idx) in clozeList"
              :key="q.id"
              class="p-4 rounded-xl border transition-all"
              :class="[
                hasSubmitted
                  ? isClozeCorrect(q)
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-red-300 bg-red-50/20'
                  : 'border-[#e8ddd0]/80 bg-[#fcfaf7]'
              ]"
            >
              <div class="flex items-start gap-3">
                <span class="text-xs font-bold font-mono text-stone-400 mt-2 shrink-0">
                  {{ idx + 1 }}.
                </span>

                <div class="flex-1 leading-loose text-base text-stone-800">
                  <span>{{ splitSentence(q.sentenceWithBlanks).before }}</span>
                  <input
                    type="text"
                    :value="tedStore.clozeAnswers[q.id] || ''"
                    @input="onClozeInput(q.id, $event.target.value)"
                    @change="onClozeChange(q.id, $event.target.value)"
                    :disabled="hasSubmitted"
                    class="text-base border-b-2 bg-transparent min-h-[44px] min-w-[120px] max-w-[220px] px-2 py-1 mx-1 font-medium transition-colors touch-manipulation focus:outline-none"
                    :class="[
                      hasSubmitted
                        ? isClozeCorrect(q)
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-500 rounded'
                          : 'text-red-700 bg-red-50 line-through border-red-500 rounded'
                        : 'border-amber-400 focus:border-amber-600 text-stone-900'
                    ]"
                    :placeholder="hasSubmitted ? '' : '输入答案...'"
                    autocapitalize="none"
                    autocorrect="off"
                    spellcheck="false"
                    :aria-label="`填空第 ${idx + 1} 题输入框`"
                  />
                  <span>{{ splitSentence(q.sentenceWithBlanks).after }}</span>
                </div>
              </div>

              <!-- Post-submission feedback -->
              <div v-if="hasSubmitted" class="mt-2.5 ml-6 pt-2 border-t border-stone-200/60">
                <div v-if="isClozeCorrect(q)" class="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 class="w-4 h-4 text-emerald-600 stroke-[2.2]" aria-hidden="true" />
                  <span>回答正确</span>
                </div>
                <div v-else class="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                  <span class="flex items-center gap-1 text-red-600 font-semibold">
                    <XCircle class="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
                    <span>需巩固</span>
                  </span>
                  <span class="text-stone-500">正确答案:</span>
                  <span class="font-bold text-emerald-800 underline decoration-emerald-500">
                    {{ q.blanks?.[0] }}
                  </span>
                  <span v-if="q.fullSentence" class="text-stone-400 block w-full mt-1 text-[11px]">
                    整句: {{ q.fullSentence }}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- SECTION B: MATCHING -->
        <section
          v-if="activeSection === 'all' || activeSection === 'matching'"
          class="rounded-2xl border border-[#e8ddd0] bg-white p-4 space-y-4"
        >
          <div class="flex items-center justify-between pb-2 border-b border-[#e8ddd0]/60">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                B
              </span>
              <h3 class="text-sm font-bold text-amber-950">
                观点与时间轴匹配 (Matching)
              </h3>
            </div>
            <span class="text-xs text-stone-500">
              共 {{ matchingList.length }} 题 · 选中左侧观点，再点击右侧对应时间点
            </span>
          </div>

          <!-- Two-column matching grid -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
            <!-- Left Column: Shuffled / List of summary texts with radio selection -->
            <div class="md:col-span-7 space-y-2.5">
              <div class="text-xs font-semibold text-stone-500 mb-1">
                第一步：请选择演讲核心观点
              </div>
              <article
                v-for="(item, idx) in matchingList"
                :key="item.id"
                @click="onSelectSummary(item.id)"
                class="p-3.5 rounded-xl border transition-all cursor-pointer min-h-[44px] flex items-center gap-3 touch-manipulation"
                :class="[
                  selectedSummaryId === item.id
                    ? 'border-amber-500 bg-amber-500/10'
                    : tedStore.matchingAnswers[item.id] !== undefined
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-[#e8ddd0] bg-[#fcfaf7] hover:bg-stone-50'
                ]"
              >
                <!-- Radio touch target min-h-[44px] min-w-[44px] -->
                <div class="min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0">
                  <div
                    class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                    :class="[
                      selectedSummaryId === item.id
                        ? 'border-amber-600 bg-amber-600'
                        : 'border-stone-400 bg-white'
                    ]"
                  >
                    <div v-if="selectedSummaryId === item.id" class="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-bold text-amber-900 shrink-0">
                      #{{ idx + 1 }}
                    </span>
                    <p class="text-sm font-semibold text-stone-900 leading-snug">
                      {{ item.summaryText }}
                    </p>
                  </div>

                  <!-- Current matched timestamp status -->
                  <div
                    v-if="tedStore.matchingAnswers[item.id] !== undefined"
                    class="mt-1.5 flex items-center gap-2 text-xs"
                  >
                    <span class="flex items-center gap-1 font-mono text-stone-700 bg-white border border-[#e8ddd0] px-2 py-0.5 rounded-md">
                      <Clock class="w-3 h-3 text-stone-400" aria-hidden="true" />
                      <span>已配对: {{ formatSeconds(tedStore.matchingAnswers[item.id]) }}</span>
                    </span>

                    <span
                      v-if="hasSubmitted"
                      class="text-xs font-semibold"
                      :class="isMatchingCorrect(item) ? 'text-emerald-700' : 'text-red-600'"
                    >
                      {{ isMatchingCorrect(item) ? '✓ 正确' : `✗ 应为 ${item.formattedTime}` }}
                    </span>
                  </div>
                </div>
              </article>
            </div>

            <!-- Right Column: Timestamp options -->
            <div class="md:col-span-5 space-y-2.5">
              <div class="text-xs font-semibold text-stone-500 mb-1">
                第二步：选择观点出现的音频时间
              </div>
              <div class="flex flex-col gap-2">
                <button
                  v-for="ts in availableTimestamps"
                  :key="ts.timestampSeconds"
                  type="button"
                  @click="onPickTimestamp(ts.timestampSeconds)"
                  :disabled="hasSubmitted"
                  class="min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-between transition-all touch-manipulation focus:outline-none"
                  :class="[
                    isTimestampSelectedForActive(ts.timestampSeconds)
                      ? 'border-amber-500 bg-amber-500 text-white font-bold'
                      : isTimestampUsed(ts.timestampSeconds)
                        ? 'border-amber-300 bg-amber-100/60 text-amber-900'
                        : 'border-[#e8ddd0] bg-white text-stone-700 hover:bg-stone-50'
                  ]"
                  :aria-label="`时间点 ${ts.formattedTime}`"
                >
                  <span class="flex items-center gap-2 font-mono">
                    <Clock
                      class="w-4 h-4 stroke-[2]"
                      :class="isTimestampSelectedForActive(ts.timestampSeconds) ? 'text-white' : 'text-stone-400'"
                      aria-hidden="true"
                    />
                    <span>{{ ts.formattedTime }}</span>
                  </span>

                  <!-- Badge showing which item is linked to this timestamp -->
                  <span
                    v-if="getMatchedItemNumber(ts.timestampSeconds) !== null"
                    class="text-[11px] font-sans px-2 py-0.5 rounded-full"
                    :class="[
                      isTimestampSelectedForActive(ts.timestampSeconds)
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-200 text-amber-950 font-medium'
                    ]"
                  >
                    已连线 #{{ getMatchedItemNumber(ts.timestampSeconds) }}
                  </span>
                  <span v-else class="text-[11px] text-stone-400 font-sans">
                    待匹配
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Submit CTA / Footer -->
        <footer class="pt-2 pb-6 flex items-center justify-between border-t border-[#e8ddd0]/60">
          <div class="text-xs text-stone-500">
            已作答:
            <span class="font-mono font-bold text-stone-800">
              {{ answeredCount }} / {{ totalQuestionsCount }}
            </span>
          </div>

          <div class="flex items-center gap-3">
            <button
              v-if="!hasSubmitted"
              type="button"
              @click="handleSubmit"
              class="min-h-[44px] min-w-[44px] px-6 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all touch-manipulation flex items-center gap-2"
            >
              <Award class="w-4 h-4 stroke-[2]" aria-hidden="true" />
              <span>提交答案</span>
            </button>

            <button
              v-else
              type="button"
              @click="tedStore.goToStep(4)"
              class="min-h-[44px] min-w-[44px] px-6 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all touch-manipulation flex items-center gap-2"
            >
              <span>前往跟读</span>
              <ArrowRight class="w-4 h-4 stroke-[2]" aria-hidden="true" />
            </button>
          </div>
        </footer>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTedStore } from '../../stores/tedStore.js'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Award,
  ArrowRight,
  RefreshCw,
  BookOpen
} from 'lucide-vue-next'

const tedStore = useTedStore()

const activeSection = ref('all')
const selectedSummaryId = ref(null)

const currentTalk = computed(() => tedStore.currentTalk)
const clozeList = computed(() => currentTalk.value?.tasks?.cloze || [])
const matchingList = computed(() => currentTalk.value?.tasks?.matching || [])
const taskScore = computed(() => tedStore.taskScore)
const hasSubmitted = computed(() => taskScore.value !== null)

// Set default selected summary when matching list loads
watch(
  matchingList,
  (list) => {
    if (list && list.length > 0 && !selectedSummaryId.value) {
      selectedSummaryId.value = list[0].id
    }
  },
  { immediate: true }
)

// Sentence split at '___'
function splitSentence(sentence) {
  if (!sentence) return { before: '', after: '' }
  const parts = sentence.split('___')
  return {
    before: parts[0] ?? '',
    after: parts.slice(1).join('___') ?? ''
  }
}

// Cloze input handler
function onClozeInput(id, val) {
  tedStore.submitClozeAnswer(id, val)
}

function onClozeChange(id, val) {
  tedStore.submitClozeAnswer(id, val)
}

// Check cloze correctness
function isClozeCorrect(q) {
  if (!hasSubmitted.value) return false
  const userAns = tedStore.clozeAnswers[q.id]
  const targetAns = q.blanks?.[0]
  if (typeof userAns === 'string' && typeof targetAns === 'string') {
    return userAns.trim().toLowerCase() === targetAns.trim().toLowerCase()
  }
  return false
}

// Cloze stats
const clozeStats = computed(() => {
  let correct = 0
  for (const q of clozeList.value) {
    if (isClozeCorrect(q)) correct++
  }
  return { correct, total: clozeList.value.length }
})

// Matching options
const availableTimestamps = computed(() => {
  const seen = new Set()
  const result = []
  for (const item of matchingList.value) {
    if (item.timestampSeconds !== undefined && !seen.has(item.timestampSeconds)) {
      seen.add(item.timestampSeconds)
      result.push({
        timestampSeconds: item.timestampSeconds,
        formattedTime: item.formattedTime || formatSeconds(item.timestampSeconds)
      })
    }
  }
  return result
})

function onSelectSummary(id) {
  if (hasSubmitted.value) return
  selectedSummaryId.value = id
}

function onPickTimestamp(ts) {
  if (hasSubmitted.value) return
  if (selectedSummaryId.value) {
    tedStore.submitMatchingAnswer(selectedSummaryId.value, ts)
    // Advance to next unmatched summary
    const next = matchingList.value.find(
      (m) => m.id !== selectedSummaryId.value && tedStore.matchingAnswers[m.id] === undefined
    )
    if (next) {
      selectedSummaryId.value = next.id
    }
  }
}

function isTimestampSelectedForActive(ts) {
  if (!selectedSummaryId.value) return false
  return tedStore.matchingAnswers[selectedSummaryId.value] === ts
}

function isTimestampUsed(ts) {
  return Object.values(tedStore.matchingAnswers).includes(ts)
}

function getMatchedItemNumber(ts) {
  const index = matchingList.value.findIndex(
    (item) => tedStore.matchingAnswers[item.id] === ts
  )
  return index >= 0 ? index + 1 : null
}

function isMatchingCorrect(item) {
  if (!hasSubmitted.value) return false
  const userMatch = tedStore.matchingAnswers[item.id]
  return userMatch !== undefined && userMatch === item.timestampSeconds
}

const matchingStats = computed(() => {
  let correct = 0
  for (const item of matchingList.value) {
    if (isMatchingCorrect(item)) correct++
  }
  return { correct, total: matchingList.value.length }
})

function formatSeconds(secs) {
  if (!secs && secs !== 0) return '00:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Total progress
const totalQuestionsCount = computed(() => clozeList.value.length + matchingList.value.length)
const answeredCount = computed(() => {
  let count = 0
  for (const q of clozeList.value) {
    if (tedStore.clozeAnswers[q.id]?.trim()) count++
  }
  for (const item of matchingList.value) {
    if (tedStore.matchingAnswers[item.id] !== undefined) count++
  }
  return count
})

function handleSubmit() {
  tedStore.scoreTask()
}

function handleRetry() {
  tedStore.taskScore = null
  tedStore.clozeAnswers = {}
  tedStore.matchingAnswers = {}
  if (matchingList.value.length > 0) {
    selectedSummaryId.value = matchingList.value[0].id
  }
}
</script>
