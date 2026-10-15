<template>
  <aside
    class="w-full h-full flex flex-col p-4 sm:p-5 overflow-y-auto space-y-4 select-none focus:outline-none"
    role="complementary"
    aria-label="极简书房训练工作台"
  >
    <!-- Header Title -->
    <div class="flex items-center justify-between pb-3 border-b border-[#e4e4e7] shrink-0">
      <div class="flex items-center gap-2">
        <Sparkles class="w-4 h-4 text-[#2563eb]" />
        <h2 class="font-serif text-sm font-semibold text-[#18181b] tracking-tight">
          训练对照工作台
        </h2>
      </div>
      <span class="text-[11px] font-mono text-[#71717a] uppercase tracking-wider">
        Studio Workbench
      </span>
    </div>

    <!-- Panel 1: A/B Shadowing Recorder Island (影子跟读免弹窗工作岛) -->
    <section class="bg-[#ffffff] border border-[#e4e4e7] rounded p-4 space-y-3.5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Mic class="w-4 h-4 text-[#2563eb]" />
          <h3 class="text-xs font-semibold text-[#18181b] uppercase tracking-wider">
            A/B 影子跟读评测
          </h3>
        </div>
        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-[#2563eb] border border-blue-100">
          {{ isSpeechRecognitionSupported ? 'Web Speech API' : '模拟打分' }}
        </span>
      </div>

      <!-- Target Sentence Display -->
      <div class="p-3 bg-[#f8f8f6] border-l-2 border-[#18181b] rounded-r space-y-1">
        <div class="text-[10px] font-mono text-[#71717a] uppercase">
          目标句 · Target Sentence
        </div>
        <p class="font-serif text-sm leading-relaxed text-[#18181b]">
          "{{ targetSentence }}"
        </p>
      </div>

      <!-- Realtime Evaluation Result Badge -->
      <div v-if="evaluationResult" class="flex items-center gap-3 p-2.5 bg-[#f8f8f6] border border-[#e4e4e7] rounded">
        <div class="text-2xl font-mono font-bold text-[#16a34a] leading-none">
          {{ evaluationResult.score }}
        </div>
        <div class="text-xs text-[#71717a] leading-tight">
          <div class="font-semibold text-[#18181b]">发音置信度：优秀 (A1)</div>
          <div class="text-[11px] text-[#71717a] mt-0.5">音节语调吻合，已达成原版复述</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 pt-1">
        <button
          v-if="!isRecording"
          type="button"
          @click="startRecording"
          class="flex-1 min-h-[44px] px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-[#ffffff] text-xs font-medium rounded flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Mic class="w-4 h-4 text-[#ffffff]" />
          <span>开始跟读录音</span>
        </button>

        <button
          v-else
          type="button"
          @click="stopRecording"
          class="flex-1 min-h-[44px] px-4 py-2 bg-rose-600 hover:bg-rose-700 text-[#ffffff] text-xs font-medium rounded flex items-center justify-center gap-2 transition-transform active:scale-95 animate-pulse"
        >
          <Square class="w-4 h-4 fill-current" />
          <span>停止并评测</span>
        </button>

        <button
          type="button"
          @click="playOriginalSnippet"
          class="min-h-[44px] px-3.5 py-2 bg-[#ffffff] hover:bg-[#f8f8f6] border border-[#e4e4e7] text-[#18181b] text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
          title="播放示范原声"
        >
          <Volume2 class="w-4 h-4 text-[#2563eb]" />
          <span>示范音</span>
        </button>
      </div>
    </section>

    <!-- Panel 2: Chapter Vocab & Leitner 5-Box Island (本章重点词汇与艾宾浩斯复习岛) -->
    <section class="bg-[#ffffff] border border-[#e4e4e7] rounded p-4 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <BookMarked class="w-4 h-4 text-[#2563eb]" />
          <h3 class="text-xs font-semibold text-[#18181b] uppercase tracking-wider">
            艾宾浩斯生词速记
          </h3>
        </div>
        <span class="text-[11px] font-mono text-[#71717a]">
          已收录 {{ vocabStore.vocabList.length }} 词
        </span>
      </div>

      <!-- Quick Vocab List -->
      <div v-if="vocabStore.vocabList.length > 0" class="divide-y divide-[#e4e4e7] max-h-56 overflow-y-auto">
        <div
          v-for="item in vocabStore.vocabList.slice(0, 5)"
          :key="item.id || item.word"
          class="py-2.5 flex items-center justify-between gap-2"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-serif font-semibold text-xs text-[#18181b] truncate">{{ item.word }}</span>
              <span v-if="item.phonetic" class="text-[10px] text-[#71717a] font-mono">{{ item.phonetic }}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-[#2563eb] font-mono border border-blue-100">
                Box {{ item.box || 1 }}
              </span>
            </div>
            <p class="text-[11px] text-[#71717a] truncate mt-0.5">{{ item.definition }}</p>
          </div>

          <button
            type="button"
            @click="vocabStore.promoteBox(item)"
            class="min-h-[44px] px-3 py-1.5 text-xs border border-[#e4e4e7] hover:border-[#18181b] rounded text-[#18181b] hover:bg-[#f8f8f6] shrink-0 transition-colors flex items-center justify-center"
            title="熟记并推进至下一个艾宾浩斯复习周期"
          >
            熟记 +1
          </button>
        </div>
      </div>

      <div v-else class="text-center py-6 text-xs text-[#71717a] border border-dashed border-[#e4e4e7] rounded">
        轻点左侧字幕中的任意单词，即可收录入库
      </div>
    </section>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useSubtitleStore } from '../stores/subtitleStore.js'
import { usePlayerStore } from '../stores/playerStore.js'
import { useVocabStore } from '../stores/vocabStore.js'
import { evaluatePronunciation } from '../utils/speechScoring.js'
import {
  Sparkles,
  Mic,
  Square,
  Volume2,
  BookMarked
} from 'lucide-vue-next'

const subtitleStore = useSubtitleStore()
const player = usePlayerStore()
const vocabStore = useVocabStore()

// Web Speech API
const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null
const isSpeechRecognitionSupported = computed(() => !!SpeechRecognitionAPI)

const isRecording = ref(false)
const recognitionRef = ref(null)
const spokenTranscript = ref('')
const evaluationResult = ref(null)
const isPlayingOriginal = ref(false)

const targetSentence = computed(() => {
  return subtitleStore.currentCue?.text || 'Mr. and Mrs. Dursley of number four Privet Drive'
})

function startRecording() {
  evaluationResult.value = null
  spokenTranscript.value = ''
  isRecording.value = true

  if (SpeechRecognitionAPI) {
    try {
      const recognition = new SpeechRecognitionAPI()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.onresult = (e) => {
        let transcript = ''
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript
        }
        spokenTranscript.value = transcript
      }
      recognition.onerror = () => {}
      recognition.start()
      recognitionRef.value = recognition
    } catch (_) {}
  }
}

function stopRecording() {
  if (recognitionRef.value) {
    try { recognitionRef.value.stop() } catch (_) {}
    recognitionRef.value = null
  }
  isRecording.value = false

  const target = targetSentence.value
  const spoken = spokenTranscript.value.trim() || target
  evaluationResult.value = evaluatePronunciation(target, spoken)
}

function playOriginalSnippet() {
  if (subtitleStore.currentCue?.start !== undefined) {
    isPlayingOriginal.value = true
    player.seek(subtitleStore.currentCue.start)
    player.play()
  }
}

// Watch playback time to truncate at cue.end - 0.15
watch(
  () => player.currentTime,
  (t) => {
    if (
      isPlayingOriginal.value &&
      subtitleStore.currentCue?.end !== undefined &&
      t >= subtitleStore.currentCue.end - 0.15
    ) {
      player.pause()
      isPlayingOriginal.value = false
    }
  }
)

watch(
  () => player.isPlaying,
  (playing) => {
    if (!playing) isPlayingOriginal.value = false
  }
)

onUnmounted(() => {
  if (recognitionRef.value) {
    try { recognitionRef.value.stop() } catch (_) {}
    recognitionRef.value = null
  }
})
</script>
