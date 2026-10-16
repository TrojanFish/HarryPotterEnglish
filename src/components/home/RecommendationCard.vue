<template>
  <section
    class="w-full rounded-2xl bg-[#fbf9f5] border border-[#e8ddd0] p-4 sm:p-6 transition-all"
    aria-label="今日校长推荐研习卡片"
    role="region"
  >
    <!-- Header Section -->
    <header v-if="showHeader" class="mb-4 sm:mb-5">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-2.5">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
            <Compass class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
              今日校长推荐 · 黄金研习组合
            </h2>
            <p class="text-xs text-stone-500 font-medium">
              基于 SLA 二语习得 i+1 动力学算法精选
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-100/70 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
          <Sparkles class="w-3.5 h-3.5 text-amber-700" />
          <span>个性化匹配度 {{ matchScore }}%</span>
        </div>
      </div>

      <!-- Transparent Pedagogical Rationale Banner -->
      <div
        class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-900 w-full sm:w-auto"
        role="status"
        aria-label="推荐理由"
      >
        <span class="font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
          {{ categoryLabel }}
        </span>
        <span class="text-stone-700 leading-relaxed break-words">
          {{ recommendation.rationale }}
        </span>
      </div>
    </header>

    <!-- Dual-Card Grid Layout (Mobile: 1-col, Tablet/Desktop: 2-col) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Left Card: HP 有声书原著精读 -->
      <article
        class="flex flex-col justify-between rounded-xl bg-[#faf6ee] border border-[#e8ddd0] p-4 sm:p-5 hover:border-amber-300 transition-colors"
        aria-label="哈利波特原著精读推荐"
      >
        <div>
          <!-- Tag & CEFR row -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
              <BookOpen class="w-3.5 h-3.5 text-amber-700" />
              <span>原著有声精读</span>
            </span>

            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono"
              :class="getCefrBadgeClass(recommendation.hpChapter.cefr)"
            >
              CEFR {{ recommendation.hpChapter.cefr }}
            </span>
          </div>

          <!-- Titles -->
          <h3 class="text-base sm:text-lg font-bold text-stone-900 leading-snug mb-1">
            {{ recommendation.hpChapter.bookCode }} · {{ recommendation.hpChapter.titleZh }}
          </h3>
          <p class="text-xs sm:text-sm text-stone-600 line-clamp-1 mb-3">
            Chapter {{ recommendation.hpChapter.chapterNumber }} · {{ recommendation.hpChapter.title }}
          </p>

          <!-- Book & Difficulty Meta -->
          <div class="flex items-center gap-2 text-xs text-stone-500 mb-4">
            <span class="inline-flex items-center gap-1 font-mono">
              <Award class="w-3.5 h-3.5 text-amber-600" />
              <span>SLA 匹配分: {{ Math.round(recommendation.hpChapter.score || 95) }}</span>
            </span>
            <span class="text-stone-300">·</span>
            <span>官方精校原声</span>
          </div>
        </div>

        <!-- Primary CTA: 立即精听 -->
        <button
          type="button"
          class="w-full min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl bg-stone-900 text-amber-100 hover:bg-stone-800 active:scale-95 transition-all touch-manipulation font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
          aria-label="立即精听哈利波特推荐章节"
          @click="handleOpenChapter"
        >
          <span>立即精听</span>
          <ChevronRight class="w-4 h-4 text-amber-300" />
        </button>
      </article>

      <!-- Right Card: TED 思想演说拓展 -->
      <article
        class="flex flex-col justify-between rounded-xl bg-[#faf6ee] border border-[#e8ddd0] p-4 sm:p-5 hover:border-amber-300 transition-colors"
        aria-label="TED 思想拓展推荐"
      >
        <div>
          <!-- Tag & CEFR row -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
              <Video class="w-3.5 h-3.5 text-red-600" />
              <span>TED 思想拓展</span>
            </span>

            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono"
              :class="getCefrBadgeClass(recommendation.tedTalk.cefr)"
            >
              CEFR {{ recommendation.tedTalk.cefr }}
            </span>
          </div>

          <!-- Titles -->
          <h3 class="text-base sm:text-lg font-bold text-stone-900 leading-snug mb-1 line-clamp-1">
            {{ recommendation.tedTalk.titleCn || recommendation.tedTalk.title }}
          </h3>
          <p class="text-xs sm:text-sm text-stone-600 line-clamp-1 mb-3">
            {{ recommendation.tedTalk.title }}
          </p>

          <!-- Speaker & Duration & Topic Tags -->
          <div class="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-3">
            <span class="font-medium text-stone-700">
              {{ recommendation.tedTalk.speaker }}
            </span>
            <span class="text-stone-300">·</span>
            <span class="inline-flex items-center gap-1 font-mono">
              <Clock class="w-3.5 h-3.5 text-stone-400" />
              <span>{{ Math.round((recommendation.tedTalk.durationSeconds || 0) / 60) }} 分钟</span>
            </span>
          </div>

          <!-- Topic Chips -->
          <div
            v-if="recommendation.tedTalk.topicTags && recommendation.tedTalk.topicTags.length > 0"
            class="flex flex-wrap gap-1.5 mb-4"
          >
            <span
              v-for="tag in recommendation.tedTalk.topicTags.slice(0, 3)"
              :key="tag"
              class="px-2 py-0.5 rounded bg-amber-50/90 text-amber-800 border border-amber-200/70 text-[11px] font-medium"
            >
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- Primary CTA: 开启 TED -->
        <button
          type="button"
          class="w-full min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl bg-amber-700 text-amber-50 hover:bg-amber-800 active:scale-95 transition-all touch-manipulation font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
          aria-label="开启 TED 思想演说拓展"
          @click="handleOpenTed"
        >
          <span>开启 TED</span>
          <ChevronRight class="w-4 h-4 text-amber-200" />
        </button>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import {
  Sparkles,
  BookOpen,
  Video,
  Clock,
  ChevronRight,
  Award,
  Compass
} from 'lucide-vue-next'
import { computeNextStepRecommendation } from '../../utils/recommendationEngine.js'
import { useAnalyticsStore } from '../../stores/analyticsStore.js'
import { useVocabStore } from '../../stores/vocabStore.js'
import { useCatalogStore } from '../../stores/catalogStore.js'
import { useNavigationStore } from '../../stores/navigationStore.js'

// Props & Emits interface
const props = defineProps({
  showHeader: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['open-chapter', 'open-ted'])

// Stores
const analyticsStore = useAnalyticsStore()
const vocabStore = useVocabStore()
const catalogStore = useCatalogStore()
const navigationStore = useNavigationStore()

// Reactive Recommendation calculation via SLA Engine
const recommendation = computed(() => {
  return computeNextStepRecommendation({
    cefrLevel: analyticsStore.cefrLevel || 'A2',
    totalListeningSeconds: analyticsStore.totalListeningSeconds || analyticsStore.listeningSeconds || 0,
    shadowingAverage: analyticsStore.shadowingAverage || 0,
    vocabList: vocabStore.vocabList || [],
    completedChapters: analyticsStore.completedChapters || []
  })
})

// Pedagogical Category badge label
const categoryLabel = computed(() => {
  const cat = recommendation.value?.category
  const map = {
    starter: '[魔法启程]',
    vocab: '[核心词汇强化]',
    progress: '[进度承接]',
    challenge: '[进阶挑战]'
  }
  return map[cat] || '[魔法启程]'
})

// Match score display
const matchScore = computed(() => {
  const hpScore = Number(recommendation.value?.hpChapter?.score) || 95
  const tedScore = Number(recommendation.value?.tedTalk?.score) || 92
  return Math.min(100, Math.max(80, Math.round((hpScore + tedScore) / 2)))
})

// CEFR badge color mapping (A2 emerald, B1 amber, B2 blue, C1 purple)
function getCefrBadgeClass(level) {
  const norm = String(level || 'A2').trim().toUpperCase()
  if (norm === 'C1') return 'bg-purple-100 text-purple-900 border-purple-300'
  if (norm === 'B2') return 'bg-blue-100 text-blue-900 border-blue-300'
  if (norm === 'B1') return 'bg-amber-100 text-amber-900 border-amber-300'
  return 'bg-emerald-100 text-emerald-800 border-emerald-300' // A2
}

// Action Handlers
function handleOpenChapter() {
  const hp = recommendation.value.hpChapter
  if (!hp) return

  catalogStore.selectBook(hp.bookId)
  catalogStore.selectChapter(hp.chapterId)
  navigationStore.setView('player')
  emit('open-chapter', hp)
}

function handleOpenTed() {
  const ted = recommendation.value.tedTalk
  if (!ted) return

  if (typeof catalogStore.selectTedTalk === 'function') {
    catalogStore.selectTedTalk(ted.id)
  }
  navigationStore.setView('ted')
  emit('open-ted', ted)
}
</script>
