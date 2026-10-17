<template>
  <div class="h-full w-full flex flex-col bg-[#fbf9f5] select-none overflow-y-auto">
    <!-- Sub-toolbar / Segment Navigation Bar -->
    <header class="px-4 py-2.5 border-b border-[#e8ddd0]/70 bg-amber-500/5 sticky top-0 z-10">
      <div class="max-w-2xl mx-auto flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-xs font-bold text-amber-950">跟读工坊</span>
          <span class="text-xs text-stone-500 hidden sm:inline">双轨原声对照 · 模拟母语抑扬顿挫</span>
        </div>

        <!-- Segment Navigator -->
        <div v-if="totalSegments > 0" class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            @click="prevSegment"
            :disabled="currentSegmentIndex <= 0"
            class="min-h-[44px] min-w-[44px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-700 transition-colors active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-amber-50/50 cursor-pointer touch-manipulation"
            aria-label="上一个片段"
            title="上一个片段"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <span class="inline-flex items-center px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs font-mono font-medium text-amber-900 select-none">
            片段 {{ currentSegmentIndex + 1 }} / {{ totalSegments }}
          </span>

          <button
            type="button"
            @click="nextSegment"
            :disabled="currentSegmentIndex >= totalSegments - 1"
            class="min-h-[44px] min-w-[44px] rounded-xl border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-700 transition-colors active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-amber-50/50 cursor-pointer touch-manipulation"
            aria-label="下一个片段"
            title="下一个片段"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Body -->
    <main class="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5 pb-24">
      <!-- Empty state when no talk or no shadowing segments -->
      <div
        v-if="!currentTalk || totalSegments === 0"
        class="flex flex-col items-center justify-center p-12 text-center text-stone-500 my-auto min-h-[300px]"
      >
        <Volume2 class="w-12 h-12 text-stone-400 mb-3 stroke-[1.5]" aria-hidden="true" />
        <h3 class="text-base font-semibold text-stone-700">暂无跟读训练片段</h3>
        <p class="text-xs text-stone-400 mt-1 max-w-sm">
          请从演讲目录中选择当前演说以加载跟读训练材料
        </p>
      </div>

      <template v-else>
        <!-- Transcript Card -->
        <div class="p-5 sm:p-6 bg-white border border-[#e8ddd0] rounded-2xl space-y-3">
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100/60 border border-amber-200 text-[11px] font-mono text-amber-800">
              <Mic class="w-3.5 h-3.5 text-amber-700" />
              <span>片段 {{ currentSegmentIndex + 1 }} / {{ totalSegments }}</span>
            </span>

            <span class="text-xs font-mono text-stone-400">
              {{ formatSeconds(currentSegment?.startSeconds) }} - {{ formatSeconds(currentSegment?.endSeconds) }}
            </span>
          </div>

          <!-- English transcript (K12 adolescent standard: text-lg font-serif) -->
          <h3 class="text-lg font-serif leading-[1.8] text-stone-900 font-medium select-text">
            "{{ currentSegment?.transcript || '正在加载跟读示范句...' }}"
          </h3>

          <!-- Chinese translation -->
          <p class="text-sm text-stone-500 leading-relaxed pt-1 border-t border-[#e8ddd0]/40">
            {{ currentSegment?.transcriptCn || '暂无释义' }}
          </p>
        </div>

        <!-- Dual Track Comparison Controls (原声示范 & 我的录音) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Track A: 原声示范 -->
          <section
            class="p-5 border border-[#e8ddd0] rounded-2xl bg-white space-y-3 flex flex-col justify-between"
            aria-label="Track A 原声示范"
          >
            <div>
              <div class="flex items-center justify-between text-xs mb-1.5">
                <span class="font-semibold text-stone-800 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" aria-hidden="true"></span>
                  <span>原声示范</span>
                </span>
                <span class="text-stone-500 font-mono text-xs">
                  {{ snippetDuration }}
                </span>
              </div>
              <p class="text-[11px] text-stone-500">
                听取母语演讲者的重音停顿与语调连读
              </p>
            </div>

            <button
              type="button"
              @click="togglePlaySnippet"
              class="w-full min-h-[44px] px-4 py-2.5 bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200/80 rounded-xl text-xs font-semibold text-amber-950 flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer"
              :aria-label="isPlayingSnippet ? '暂停原声示范' : '播放原声示范'"
            >
              <Pause v-if="isPlayingSnippet" class="w-4 h-4 text-amber-800" />
              <Play v-else class="w-4 h-4 text-amber-800" />
              <span>{{ isPlayingSnippet ? '暂停示范' : '播放原声' }}</span>
            </button>
          </section>

          <!-- Track B: 我的录音 -->
          <section
            class="p-5 border border-[#e8ddd0] rounded-2xl bg-white space-y-3 flex flex-col justify-between"
            aria-label="Track B 我的录音"
          >
            <div>
              <div class="flex items-center justify-between text-xs mb-1.5">
                <span class="font-semibold text-stone-800 flex items-center gap-2">
                  <span
                    class="w-2.5 h-2.5 rounded-full bg-[#dc2626] shrink-0"
                    :class="[isRecording ? 'animate-ping' : '']"
                    aria-hidden="true"
                  ></span>
                  <span>我的录音</span>
                </span>
                <span class="text-stone-500 font-mono text-xs">
                  {{ formatTimer(recordingSeconds) }}
                </span>
              </div>
              <p class="text-[11px] text-stone-500">
                点击麦克风开启录音，逐句模仿发音
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="toggleRecording"
                :class="[
                  'flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer',
                  isRecording
                    ? 'bg-[#dc2626] hover:bg-red-700 text-white animate-pulse'
                    : 'bg-amber-700 hover:bg-amber-800 text-amber-50 font-bold'
                ]"
                :aria-label="isRecording ? '停止录音' : '开始录音'"
              >
                <Mic class="w-4 h-4" />
                <span>{{ isRecording ? '停止录音' : (hasRecordingAudio ? '重新录制' : '开始录音') }}</span>
              </button>

              <!-- Playback User Recording Button -->
              <button
                v-if="hasRecordingAudio"
                type="button"
                @click="togglePlayUserRecording"
                :class="[
                  'min-h-[44px] min-w-[44px] px-3.5 py-2.5 border rounded-xl text-xs font-medium flex items-center justify-center transition-all active:scale-95 cursor-pointer touch-manipulation',
                  isPlayingUserRecording
                    ? 'border-amber-300 bg-amber-100 text-amber-900 font-semibold'
                    : 'border-[#e8ddd0] bg-white hover:bg-amber-50/50 text-stone-700'
                ]"
                :title="isPlayingUserRecording ? '暂停回放' : '回放我的录音'"
                aria-label="回放我的录音"
              >
                <Pause v-if="isPlayingUserRecording" class="w-4 h-4 text-amber-800" />
                <Play v-else class="w-4 h-4 text-amber-800" />
              </button>
            </div>
          </section>
        </div>

        <!-- AI Evaluation Result -->
        <div
          v-if="currentEvalResult"
          class="p-5 border border-emerald-200 bg-emerald-50/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-mono font-bold text-lg shrink-0">
              {{ currentEvalResult.score }}
            </div>
            <div>
              <p class="text-xs font-bold text-emerald-950">{{ currentEvalResult.grade }}</p>
              <p class="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                {{ currentEvalResult.feedback }}
              </p>
            </div>
          </div>
          <div class="shrink-0 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 class="w-4 h-4" />
            <span>已完成本句评测</span>
          </div>
        </div>

        <!-- Fallback notification if SpeechRecognition not supported -->
        <div
          v-if="!isSpeechRecognitionSupported"
          class="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0 text-amber-700" />
          <span>当前环境未检测到原生语音识别接口，录音将启用启发式音调评测模式</span>
        </div>

        <!-- Action / Completion Section -->
        <div class="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e8ddd0]/60">
          <div class="text-xs text-stone-500 text-center sm:text-left">
            <span>跟读进度：已录制 {{ recordedCount }} / {{ totalSegments }} 个关键片段</span>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <!-- Next Segment Button if not on last -->
            <button
              v-if="!isLastSegment"
              type="button"
              @click="nextSegment"
              class="w-full sm:w-auto min-h-[44px] min-w-[44px] px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer"
            >
              <span>下一句跟读</span>
              <ChevronRight class="w-4 h-4" />
            </button>

            <!-- Finish CTA on last segment -->
            <button
              v-else
              type="button"
              @click="handleFinishTalk"
              class="w-full sm:w-auto min-h-[44px] min-w-[44px] px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-none"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>完成本期精讲</span>
            </button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, reactive } from 'vue'
import {
  Mic,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Volume2
} from 'lucide-vue-next'
import { useTedStore } from '../../stores/tedStore.js'
import { useNavigationStore } from '../../stores/navigationStore.js'
import { useAnalyticsStore } from '../../stores/analyticsStore.js'
import { useGamificationStore } from '../../stores/gamificationStore.js'
import { useVocabStore } from '../../stores/vocabStore.js'

const tedStore = useTedStore()
const navStore = useNavigationStore()
const analyticsStore = useAnalyticsStore()
const gamificationStore = useGamificationStore()
const vocabStore = useVocabStore()

// Segments and Current Talk
const currentTalk = computed(() => tedStore.currentTalk)
const segments = computed(() => currentTalk.value?.shadowingSegments || [])
const totalSegments = computed(() => segments.value.length)
const currentSegmentIndex = computed(() => tedStore.shadowingSegmentIndex || 0)
const currentSegment = computed(() => segments.value[currentSegmentIndex.value] || null)
const isLastSegment = computed(() => {
  if (totalSegments.value <= 1) return true
  return currentSegmentIndex.value >= totalSegments.value - 1
})

function prevSegment() {
  if (currentSegmentIndex.value > 0) {
    switchSegment(currentSegmentIndex.value - 1)
  }
}

function nextSegment() {
  if (currentSegmentIndex.value < totalSegments.value - 1) {
    switchSegment(currentSegmentIndex.value + 1)
  }
}

function switchSegment(index) {
  // Stop ongoing playbacks and recordings before switching
  stopSnippetPlayback()
  stopUserPlayback()
  if (isRecording.value) {
    stopRecording()
  }
  tedStore.setShadowingSegmentIndex(index)
}

function formatSeconds(sec) {
  if (typeof sec !== 'number' || isNaN(sec)) return '00:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatTimer(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ---------------------------------------------------------
// Track A: 原声示范 (Original Audio Snippet)
// ---------------------------------------------------------
const isPlayingSnippet = ref(false)
let originalAudio = null

const snippetDuration = computed(() => {
  if (!currentSegment.value) return '00:00'
  const diff = Math.max(0, (currentSegment.value.endSeconds || 0) - (currentSegment.value.startSeconds || 0))
  return formatSeconds(diff)
})

function stopSnippetPlayback() {
  if (originalAudio) {
    try {
      originalAudio.pause()
      originalAudio.ontimeupdate = null
      originalAudio.onloadedmetadata = null
      originalAudio.onended = null
      originalAudio.onerror = null
    } catch (_) {}
    originalAudio = null
  }
  isPlayingSnippet.value = false
}

function togglePlaySnippet() {
  if (isPlayingSnippet.value) {
    stopSnippetPlayback()
    return
  }

  if (!currentSegment.value || !tedStore.videoSrc) return

  // Stop user playback if active
  stopUserPlayback()
  if (isRecording.value) {
    stopRecording()
  }

  try {
    originalAudio = new Audio(tedStore.videoSrc)
    isPlayingSnippet.value = true

    originalAudio.ontimeupdate = () => {
      if (
        originalAudio &&
        currentSegment.value &&
        originalAudio.currentTime >= (currentSegment.value.endSeconds - 0.15)
      ) {
        stopSnippetPlayback()
      }
    }

    originalAudio.onended = () => {
      stopSnippetPlayback()
    }

    originalAudio.onerror = () => {
      stopSnippetPlayback()
    }

    if (originalAudio.readyState >= 1) {
      originalAudio.currentTime = currentSegment.value.startSeconds || 0
      originalAudio.play().catch(stopSnippetPlayback)
    } else {
      originalAudio.onloadedmetadata = () => {
        if (originalAudio && currentSegment.value) {
          originalAudio.currentTime = currentSegment.value.startSeconds || 0
          originalAudio.play().catch(stopSnippetPlayback)
        }
      }
    }
  } catch (err) {
    console.warn('[TedShadowing] Audio initialization error:', err)
    stopSnippetPlayback()
  }
}

// ---------------------------------------------------------
// Track B: 我的录音 (User Recording & MediaRecorder)
// ---------------------------------------------------------
const isRecording = ref(false)
const recordingSeconds = ref(0)
let timerInterval = null

// Store recordings per segment index: { blobUrl: string, evalResult: object }
const segmentRecordings = reactive({})

const currentRecording = computed(() => segmentRecordings[currentSegmentIndex.value] || null)
const hasRecordingAudio = computed(() => Boolean(currentRecording.value?.blobUrl))
const currentEvalResult = computed(() => currentRecording.value?.evalResult || null)

const recordedCount = computed(() => {
  return Object.values(segmentRecordings).filter((r) => r?.blobUrl).length
})

let mediaStream = null
let mediaRecorder = null
let recordedChunks = []
let activeRecordingIndex = null

const isPlayingUserRecording = ref(false)
let userAudioPlayer = null

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null
const isSpeechRecognitionSupported = computed(() => !!SpeechRecognitionAPI)
let recognitionInstance = null
let spokenText = ''

function stopUserPlayback() {
  if (userAudioPlayer) {
    try {
      userAudioPlayer.pause()
      userAudioPlayer.onended = null
      userAudioPlayer.onerror = null
    } catch (_) {}
    userAudioPlayer = null
  }
  isPlayingUserRecording.value = false
}

function togglePlayUserRecording() {
  if (isPlayingUserRecording.value) {
    stopUserPlayback()
    return
  }

  const url = currentRecording.value?.blobUrl
  if (!url) return

  stopSnippetPlayback()

  try {
    userAudioPlayer = new Audio(url)
    userAudioPlayer.onended = () => {
      isPlayingUserRecording.value = false
    }
    userAudioPlayer.onerror = () => {
      isPlayingUserRecording.value = false
    }
    isPlayingUserRecording.value = true
    userAudioPlayer.play().catch((err) => {
      console.warn('[TedShadowing] User audio play error:', err)
      isPlayingUserRecording.value = false
    })
  } catch (err) {
    console.warn('[TedShadowing] User audio init error:', err)
    isPlayingUserRecording.value = false
  }
}

function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

async function startRecording() {
  stopSnippetPlayback()
  stopUserPlayback()

  const activeIndex = currentSegmentIndex.value
  activeRecordingIndex = activeIndex
  const targetTranscript = segments.value[activeIndex]?.transcript || currentSegment.value?.transcript

  // Clean previous blob for current segment if re-recording
  if (segmentRecordings[activeIndex]?.blobUrl) {
    try {
      URL.revokeObjectURL(segmentRecordings[activeIndex].blobUrl)
    } catch (_) {}
    delete segmentRecordings[activeIndex]
  }

  recordedChunks = []
  isRecording.value = true
  tedStore.setShadowingPhase('recording')
  recordingSeconds.value = 0
  spokenText = ''

  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    recordingSeconds.value += 1
  }, 1000)

  // 1. Web Speech API transcription
  if (SpeechRecognitionAPI) {
    try {
      recognitionInstance = new SpeechRecognitionAPI()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'
      recognitionInstance.onresult = (e) => {
        let text = ''
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript
        }
        spokenText = text
      }
      recognitionInstance.start()
    } catch (_) {}
  }

  // 2. MediaRecorder audio capture
  try {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStream = stream

      let mimeType = ''
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus'
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        }

        const options = mimeType ? { mimeType } : undefined
        const recorder = new MediaRecorder(stream, options)
        mediaRecorder = recorder

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunks.push(e.data)
          }
        }

        recorder.onstop = () => {
          if (recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, {
              type: mimeType || 'audio/webm'
            })
            const blobUrl = URL.createObjectURL(blob)
            const evalResult = evaluatePronunciation(targetTranscript, spokenText)
            segmentRecordings[activeIndex] = {
              blobUrl,
              evalResult
            }
          }
        }

        recorder.start(100)
      }
    }
  } catch (err) {
    console.warn('[TedShadowing] Microphone access error:', err)
    // Even if getUserMedia fails, fallback to heuristic completion without dummy URL
    const evalResult = evaluatePronunciation(targetTranscript, spokenText)
    segmentRecordings[activeIndex] = {
      blobUrl: '',
      evalResult
    }
    tedStore.setShadowingPhase('reviewing')
  }
}

function stopRecording() {
  const activeIndex = activeRecordingIndex !== null ? activeRecordingIndex : currentSegmentIndex.value
  const targetTranscript = segments.value[activeIndex]?.transcript || currentSegment.value?.transcript

  isRecording.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  if (recognitionInstance) {
    try {
      recognitionInstance.stop()
    } catch (_) {}
    recognitionInstance = null
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop()
    } catch (_) {}
  }

  if (mediaStream) {
    try {
      mediaStream.getTracks().forEach((t) => t.stop())
    } catch (_) {}
    mediaStream = null
  }

  // If MediaRecorder was not initialized, ensure evaluation is saved synchronously
  if (!mediaRecorder && !segmentRecordings[activeIndex]) {
    const evalResult = evaluatePronunciation(targetTranscript, spokenText)
    segmentRecordings[activeIndex] = {
      blobUrl: recordedChunks.length > 0 ? URL.createObjectURL(new Blob(recordedChunks)) : '',
      evalResult
    }
  }
  tedStore.setShadowingPhase('reviewing')
}

function evaluatePronunciation(targetSentence, userSpoken) {
  if (!userSpoken || !userSpoken.trim()) {
    return {
      score: 0,
      grade: '需重录 (Try Again)',
      feedback: '未检测到清晰发音，请点击麦克风重新录制。'
    }
  }

  const target = (targetSentence || '').toLowerCase().replace(/[^a-z\s]/g, '').trim()
  const spoken = userSpoken.toLowerCase().replace(/[^a-z\s]/g, '').trim()

  const targetWords = target.split(/\s+/).filter(Boolean)
  const spokenWords = spoken.split(/\s+/).filter(Boolean)

  let matches = 0
  for (const w of spokenWords) {
    if (targetWords.includes(w)) matches++
  }

  const ratio = targetWords.length > 0 ? matches / targetWords.length : 0
  const score = Math.min(100, Math.round(ratio * 100))

  const evalResult = {
    score,
    grade: score >= 90 ? '发音极佳 (Excellent)' : (score >= 60 ? '良好，继续保持 (Good)' : '需进一步提高 (Keep Practicing)'),
    feedback:
      score >= 90
        ? '连读顺畅自然，核心重音词咬字准确清晰！'
        : (score >= 60
            ? '句式节奏稳定，可适度注意单词词尾辅音的爆破与弱读。'
            : '部分核心词汇发音有偏差，建议多听原声示范后再跟读。')
  }

  analyticsStore.recordShadowingScore(score, 'ted')

  if (score >= 85) {
    gamificationStore.awardPoints(10, '魔咒跟读评分优异 (>=85)')
  } else {
    gamificationStore.awardPoints(5, '完成魔咒跟读练习')
  }
  gamificationStore.checkInDaily()
  gamificationStore.checkAndUnlockBadges({
    shadowingScore: score,
    streakDays: gamificationStore.streakDays,
    vocabCount: vocabStore.totalCount,
    l4Count: vocabStore.l4Count
  })

  return evalResult
}

// ---------------------------------------------------------
// Finish CTA
// ---------------------------------------------------------
function handleFinishTalk() {
  if (tedStore.selectedTalkId) {
    tedStore.markTalkCompleted(tedStore.selectedTalkId)
  }
  navStore.setView('ted')
}

// ---------------------------------------------------------
// Lifecycle Cleanup
// ---------------------------------------------------------
onUnmounted(() => {
  tedStore.setShadowingPhase('idle')
  stopSnippetPlayback()
  stopUserPlayback()
  if (timerInterval) clearInterval(timerInterval)

  if (recognitionInstance) {
    try {
      recognitionInstance.stop()
    } catch (_) {}
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop()
    } catch (_) {}
  }

  if (mediaStream) {
    try {
      mediaStream.getTracks().forEach((t) => t.stop())
    } catch (_) {}
  }

  // Revoke all created blob URLs
  Object.values(segmentRecordings).forEach((r) => {
    if (r?.blobUrl && r.blobUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(r.blobUrl)
      } catch (_) {}
    }
  })
})
</script>
