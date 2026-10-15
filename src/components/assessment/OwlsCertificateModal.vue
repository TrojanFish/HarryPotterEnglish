<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="羊皮纸魔法成绩单"
    >
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
          class="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
          @click="closeModal"
          aria-hidden="true"
        />
      </Transition>

      <!-- Modal Container -->
      <div class="fixed inset-0 pointer-events-none flex items-end sm:items-center justify-center p-0 sm:p-4">
        <Transition
          appear
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="translate-y-full sm:translate-y-4 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-full sm:translate-y-4 opacity-0"
        >
          <div
            v-if="isOpen"
            class="pointer-events-auto bg-[#fbf9f5] border-t border-x sm:border border-[#e8ddd0] rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:pb-0 shadow-2xl"
            @click.stop
          >
            <!-- Mobile pull handle -->
            <div class="min-h-[44px] flex items-center justify-center sm:hidden shrink-0">
              <div class="w-10 h-1.5 rounded-full bg-[#d5cbbf]" />
            </div>

            <!-- Modal Header -->
            <div class="px-5 py-4 border-b border-[#e8ddd0] bg-white/80 backdrop-blur flex items-center justify-between gap-3 shrink-0 select-none">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                  <Printer class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <h2 class="font-serif text-base sm:text-lg font-bold text-stone-900 truncate">
                    羊皮纸魔法成绩单 · O.W.L.s 认证
                  </h2>
                  <p class="text-xs text-stone-500 truncate">
                    魔法部巫术能力评定委员会官方认定单
                  </p>
                </div>
              </div>

              <!-- Close button -->
              <button
                type="button"
                @click="closeModal"
                class="p-2 text-stone-500 hover:text-stone-800 hover:bg-[#f2ece2] rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors touch-manipulation cursor-pointer"
                aria-label="关闭成绩单"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Modal Body (Scrollable) -->
            <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              
              <!-- Empty State: No Exam History Available -->
              <div
                v-if="!activeRecord"
                class="p-8 text-center bg-[#f7f2ea] border border-[#e8ddd0] rounded-2xl space-y-4"
                data-testid="empty-exam-state"
              >
                <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                  <AlertCircle class="w-7 h-7" />
                </div>
                <div class="space-y-1">
                  <h3 class="text-base font-bold font-serif text-stone-900">暂无考核认定记录</h3>
                  <p class="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                    尚未发现已完成的 O.W.L.s 等级评定档案。立即开启 10 分钟快速模拟考，生成专属于您的魔法成绩单。
                  </p>
                </div>
                <div class="pt-2">
                  <button
                    type="button"
                    @click="handleStartExam"
                    class="min-h-[44px] min-w-[44px] px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-amber-50 font-bold rounded-xl text-xs flex items-center justify-center gap-2 mx-auto touch-manipulation active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <Sparkles class="w-4 h-4 text-amber-200" />
                    <span>前往开启评定考核</span>
                  </button>
                </div>
              </div>

              <!-- Certificate Preview Card -->
              <div
                v-else
                class="bg-[#faf5ec] border-2 border-[#bfa382] rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-sm space-y-4"
                data-testid="certificate-preview"
              >
                <!-- Double Frame Line Accent -->
                <div class="border border-[#d5cbbf] p-4 rounded-xl space-y-4 bg-white/70">
                  
                  <!-- Ministry Authority Header -->
                  <div class="text-center border-b border-[#e8ddd0] pb-3 space-y-1">
                    <p class="text-[10px] uppercase font-bold tracking-widest text-amber-800">
                      MINISTRY OF MAGIC — ORDINARY WIZARDING LEVEL EXAMINATION AUTHORITY
                    </p>
                    <p class="text-xs font-bold text-stone-800 font-serif">
                      魔法部巫术能力评定委员会 · 学业测验司
                    </p>
                    <h3 class="text-lg sm:text-xl font-serif font-bold text-stone-900 mt-1">
                      O.W.L.s 魔法英语综合学业测验成绩单
                    </h3>
                  </div>

                  <!-- Candidate Info Row -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-[#f5ede1] rounded-lg text-xs border border-[#decbb8]">
                    <div>
                      <span class="text-stone-500 text-[10px] uppercase block font-semibold">考生姓名</span>
                      <span class="font-bold text-stone-900 font-serif">{{ candidateName }}</span>
                    </div>
                    <div>
                      <span class="text-stone-500 text-[10px] uppercase block font-semibold">准考编号</span>
                      <span class="font-mono font-bold text-stone-800">{{ activeRecord.id || 'OWL-DEFAULT' }}</span>
                    </div>
                    <div>
                      <span class="text-stone-500 text-[10px] uppercase block font-semibold">测验日期</span>
                      <span class="font-mono text-stone-800">{{ formattedExamDate }}</span>
                    </div>
                  </div>

                  <!-- Certified Rank & CEFR Level Badge -->
                  <div class="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-[#f7eee1] via-[#faedd9] to-[#f7eee1] border border-amber-300 rounded-xl">
                    <div class="flex items-center gap-3">
                      <div class="px-3 py-1 bg-amber-700 text-amber-50 font-bold text-sm rounded-lg shadow-sm">
                        CEFR {{ activeRecord.cefrResult || 'B1' }}
                      </div>
                      <div>
                        <div class="font-serif font-bold text-base text-stone-900">
                          {{ activeRecord.title || '魔法探索者' }}
                        </div>
                        <div class="text-[11px] text-stone-600">
                          官方认证阶位 · 成绩记录在案
                        </div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-xl font-bold font-mono text-amber-900">
                        {{ activeRecord.compositeScore || 85 }} <span class="text-xs text-stone-500">/ 100</span>
                      </div>
                      <div class="text-[10px] uppercase text-stone-500 tracking-wider">综合总评成绩</div>
                    </div>
                  </div>

                  <!-- Subject Breakdown Table -->
                  <div class="overflow-hidden border border-[#decbb8] rounded-lg">
                    <table class="w-full text-xs text-left border-collapse">
                      <thead class="bg-[#f2e7d8] text-amber-950 font-bold border-b border-[#decbb8]">
                        <tr>
                          <th class="p-2 sm:px-3">科目领域</th>
                          <th class="p-2 sm:px-3 text-center">考评得分</th>
                          <th class="p-2 sm:px-3 text-right">等第标注</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-[#efe4d6] bg-white">
                        <tr v-for="sub in subjectGrades" :key="sub.nameZh">
                          <td class="p-2 sm:px-3">
                            <span class="font-bold text-stone-900 block">{{ sub.nameZh }}</span>
                            <span class="text-[10px] text-stone-500">{{ sub.nameEn }}</span>
                          </td>
                          <td class="p-2 sm:px-3 text-center font-mono font-bold text-amber-900">
                            {{ sub.score }}
                          </td>
                          <td class="p-2 sm:px-3 text-right font-medium" :class="sub.gradeClass">
                            {{ sub.grade }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Mentor Diagnostic Feedback -->
                  <div class="p-3.5 bg-[#f6eee3] border-l-4 border-amber-700 rounded-r-lg text-xs space-y-1">
                    <div class="font-bold text-amber-900 flex items-center gap-1.5">
                      <Shield class="w-3.5 h-3.5 text-amber-700" />
                      <span>魔法导师鉴定评语及指引</span>
                    </div>
                    <p class="text-stone-700 font-serif italic leading-relaxed">
                      "{{ activeRecord.mentorFeedback || '在听辨推断与口语复述展现了出色的魔法专注力。' }}"
                    </p>
                  </div>

                  <!-- Official Stamp & Seal Decoration -->
                  <div class="flex items-center justify-between pt-2 text-[11px] text-stone-500 border-t border-[#e8ddd0]">
                    <div class="flex items-center gap-2">
                      <div class="w-9 h-9 rounded-full border border-dashed border-amber-800 text-amber-800 flex items-center justify-center font-serif text-[8px] font-bold text-center leading-none -rotate-6">
                        SEAL
                      </div>
                      <span>OFFICIAL SEAL — MINISTRY OF MAGIC EXAM BOARD</span>
                    </div>
                    <div class="font-serif italic text-stone-700">
                      Griselda Marchbanks
                    </div>
                  </div>

                </div>
              </div>

            </div>

            <!-- Modal Footer (Actions) -->
            <div class="px-5 py-4 border-t border-[#e8ddd0] bg-white/90 backdrop-blur flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                @click="closeModal"
                class="w-full sm:w-auto px-4 py-2.5 border border-[#e8ddd0] hover:bg-[#f2ece2] text-stone-700 font-medium rounded-xl text-xs min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation transition-colors cursor-pointer"
              >
                关闭
              </button>
              
              <button
                v-if="activeRecord"
                type="button"
                @click="handlePrintCertificate"
                class="w-full sm:w-auto px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-amber-50 font-bold rounded-xl text-xs min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98] transition-transform cursor-pointer shadow-sm"
              >
                <Printer class="w-4 h-4 text-amber-200" />
                <span>打印官方成绩单 (PDF)</span>
              </button>
            </div>

          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import {
  Printer,
  X,
  Award,
  Shield,
  Sparkles,
  AlertCircle,
  FileText
} from 'lucide-vue-next'
import { useAnalyticsStore } from '../../stores/analyticsStore.js'
import { generateOwlsCertificateHTML, printOwlsCertificate } from '../../utils/owlsCertificateExport.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  examRecord: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'start-exam'])

const analyticsStore = useAnalyticsStore()

/**
 * Resolve active record from prop or latest in analyticsStore
 */
const activeRecord = computed(() => {
  if (props.examRecord && typeof props.examRecord === 'object' && Object.keys(props.examRecord).length > 0) {
    return props.examRecord
  }
  const history = analyticsStore.examHistory
  if (Array.isArray(history) && history.length > 0) {
    return history[history.length - 1]
  }
  return null
})

const candidateName = computed(() => {
  return activeRecord.value?.candidateName || activeRecord.value?.studentName || 'Hogwarts Candidate'
})

const formattedExamDate = computed(() => {
  if (!activeRecord.value || !activeRecord.value.timestamp) {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
  const d = new Date(activeRecord.value.timestamp)
  if (isNaN(d.getTime())) return '2026-10-15'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

function getOwlGradeLabel(score) {
  const s = Number(score) || 0
  if (s >= 85) return { grade: 'Outstanding (O) 卓越', gradeClass: 'text-emerald-700' }
  if (s >= 70) return { grade: 'Exceeds Expectations (E) 良好', gradeClass: 'text-amber-800' }
  if (s >= 55) return { grade: 'Acceptable (A) 及格', gradeClass: 'text-indigo-700' }
  return { grade: 'Poor (P) 待提高', gradeClass: 'text-red-700' }
}

const subjectGrades = computed(() => {
  const dims = activeRecord.value?.dimensions || {
    auditory: 80,
    vocabDepth: 80,
    comprehension: 80,
    shadowing: 80,
    production: 80
  }

  return [
    {
      nameZh: '听音推断与细节',
      nameEn: 'Listening Comprehension',
      score: dims.auditory ?? 80,
      ...getOwlGradeLabel(dims.auditory ?? 80)
    },
    {
      nameZh: '核心词汇拼写产出',
      nameEn: 'Production Spelling',
      score: dims.production ?? 80,
      ...getOwlGradeLabel(dims.production ?? 80)
    },
    {
      nameZh: '名篇跟读语音流利',
      nameEn: 'Oral Shadowing',
      score: dims.shadowing ?? 80,
      ...getOwlGradeLabel(dims.shadowing ?? 80)
    },
    {
      nameZh: '语境理解与综合推理',
      nameEn: 'Contextual Reasoning',
      score: dims.comprehension ?? 80,
      ...getOwlGradeLabel(dims.comprehension ?? 80)
    },
    {
      nameZh: '词汇广度与认知深度',
      nameEn: 'Vocabulary Mastery',
      score: dims.vocabDepth ?? 80,
      ...getOwlGradeLabel(dims.vocabDepth ?? 80)
    }
  ]
})

function closeModal() {
  emit('close')
}

function handleStartExam() {
  emit('start-exam')
  closeModal()
}

function handlePrintCertificate() {
  if (!activeRecord.value) return
  printOwlsCertificate(activeRecord.value, {
    name: candidateName.value,
    candidateId: activeRecord.value.id
  })
}

// Global Escape Key Listener
function handleKeyDown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    closeModal()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown)
  }
})
</script>
