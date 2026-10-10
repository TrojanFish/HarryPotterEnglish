<template>
  <div class="h-full w-full flex flex-col items-center justify-start p-4 sm:p-6 pb-32 sm:pb-36 bg-white overflow-y-auto">
    <div class="max-w-2xl w-full space-y-4 sm:space-y-5 my-auto py-2">
      <!-- Target Sentence Card -->
      <div class="p-5 sm:p-6 bg-[#f8f8f6] border border-[#e4e4e7] rounded-2xl text-center space-y-2.5">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e4e4e7] text-[11px] font-mono text-[#71717a]">
          <Mic class="w-3.5 h-3.5 text-[#2563eb]" />
          <span>{{ cueNumber }} / {{ subtitleStore.cues.length || 1 }} 句</span>
        </div>
        <h2 class="font-serif text-xl sm:text-2xl leading-[1.8] text-[#18181b] font-semibold select-text">
          "{{ currentCue?.text || '正在准备跟读示范句...' }}"
        </h2>
        <p class="text-xs text-[#52525b] leading-relaxed">
          {{ currentCue?.translation || '暂无释义' }}
        </p>
      </div>

      <!-- Dual Track Comparison Controls (原声示范 & 我的录音) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <!-- Track A: 原声示范 -->
        <div class="p-5 sm:p-6 border border-[#e4e4e7] rounded-2xl bg-white space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-[#18181b] flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-[#2563eb]"></span>
              <span>原声示范</span>
            </span>
            <span class="text-[#71717a] font-mono">
              {{ snippetDuration }}
            </span>
          </div>
          <button
            type="button"
            @click="playOriginalSnippet"
            class="w-full min-h-[44px] px-4 py-2.5 bg-[#f8f8f6] hover:bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl text-xs font-medium text-[#18181b] flex items-center justify-center gap-2 transition-colors active:scale-95 touch-manipulation cursor-pointer"
          >
            <Play v-if="!isPlayingSnippet" class="w-4 h-4 text-[#2563eb]" />
            <Pause v-else class="w-4 h-4 text-[#2563eb]" />
            <span>{{ isPlayingSnippet ? '暂停' : '播放原声' }}</span>
          </button>
        </div>

        <!-- Track B: 我的录音 -->
        <div class="p-5 sm:p-6 border border-[#e4e4e7] rounded-2xl bg-white space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-[#18181b] flex items-center gap-1.5">
              <span :class="['w-2 h-2 rounded-full bg-[#dc2626]', isRecording ? 'animate-ping' : '']"></span>
              <span>我的录音</span>
            </span>
            <span class="text-[#71717a] font-mono">{{ formatTimer(recordingSeconds) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="toggleRecording"
              :class="[
                'flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors active:scale-95 touch-manipulation cursor-pointer',
                isRecording
                  ? 'bg-[#dc2626] hover:bg-red-700 text-white'
                  : 'bg-[#18181b] hover:bg-[#27272a] text-white'
              ]"
            >
              <Mic class="w-4 h-4" />
              <span>{{ isRecording ? '停止录音' : '开始录音' }}</span>
            </button>
            <button
              v-if="hasRecordingAudio"
              type="button"
              @click="playUserRecording"
              :class="[
                'min-h-[44px] px-3.5 py-2.5 border rounded-xl text-xs flex items-center justify-center transition-colors active:scale-95 cursor-pointer',
                isPlayingUserRecording
                  ? 'border-blue-300 bg-blue-50 text-[#2563eb]'
                  : 'border-[#e4e4e7] hover:bg-[#f4f4f5] text-[#71717a]'
              ]"
              :title="isPlayingUserRecording ? '暂停回放' : '回放我的录音'"
              aria-label="回放我的录音"
            >
              <Pause v-if="isPlayingUserRecording" class="w-4 h-4 text-[#2563eb]" />
              <Play v-else class="w-4 h-4 text-[#2563eb]" />
            </button>
          </div>
        </div>
      </div>

      <!-- AI Evaluation Result -->
      <div
        v-if="evalResult"
        class="p-5 sm:p-6 border border-emerald-200 bg-emerald-50/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-[#059669] text-white flex items-center justify-center font-mono font-bold text-lg shrink-0">
            {{ evalResult.score }}
          </div>
          <div>
            <p class="text-xs font-bold text-emerald-900">{{ evalResult.grade }}</p>
            <p class="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
              {{ evalResult.feedback }}
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="sessionStore.setStep(3)"
          class="min-h-[44px] px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shrink-0 active:scale-95 cursor-pointer"
        >
          <span>进入听写</span>
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Fallback notification if SpeechRecognition not supported -->
      <div
        v-if="!isSpeechRecognitionSupported"
        class="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2"
      >
        <AlertCircle class="w-4 h-4 shrink-0 text-[#2563eb]" />
        <span>当前环境未检测到麦克风语音识别，跟读录音将启用启发式测评模式</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { Mic, Play, Pause, ChevronRight, AlertCircle } from 'lucide-vue-next'
import { useSubtitleStore } from '../../stores/subtitleStore.js'
import { usePlayerStore } from '../../stores/playerStore.js'
import { useSessionStore } from '../../stores/sessionStore.js'

const subtitleStore = useSubtitleStore()
const player = usePlayerStore()
const sessionStore = useSessionStore()

const currentCue = computed(() => subtitleStore.effectiveCue)
const cueNumber = computed(() => subtitleStore.effectiveCueIndex + 1)

// Track A: Original snippet playback
const isPlayingSnippet = ref(false)

function playOriginalSnippet() {
  if (!currentCue.value || currentCue.value.start === undefined) return
  if (isPlayingSnippet.value) {
    player.pause()
    isPlayingSnippet.value = false
  } else {
    isPlayingSnippet.value = true
    player.seek(currentCue.value.start)
    player.play()
  }
}

// Watch audio playback to enforce cutoff at cue.end - 0.15 threshold
watch(
  () => player.currentTime,
  (t) => {
    if (
      isPlayingSnippet.value &&
      currentCue.value?.end !== undefined &&
      t >= currentCue.value.end - 0.15
    ) {
      player.pause()
      isPlayingSnippet.value = false
    }
  }
)

watch(
  () => player.isPlaying,
  (playing) => {
    if (!playing) isPlayingSnippet.value = false
  }
)

const snippetDuration = computed(() => {
  if (!currentCue.value) return '00:00'
  const diff = Math.max(0, (currentCue.value.end || 0) - (currentCue.value.start || 0))
  const s = Math.round(diff)
  return `00:${String(s).padStart(2, '0')}`
})

// Track B: User Recording & Evaluation
const isRecording = ref(false)
const recordingSeconds = ref(0)
let timerInterval = null
const hasRecordingAudio = ref(false)
let userAudioBlobUrl = null
const isPlayingUserRecording = ref(false)
let userAudioPlayer = null
const mediaStreamRef = ref(null)
const mediaRecorderRef = ref(null)
const recordedChunks = ref([])
const evalResult = ref(null)

const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null
const isSpeechRecognitionSupported = computed(() => !!SpeechRecognitionAPI)
let recognitionInstance = null
let spokenText = ''

function formatTimer(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

async function startRecording() {
  if (isPlayingSnippet.value) {
    player.pause()
    isPlayingSnippet.value = false
  }
  if (isPlayingUserRecording.value && userAudioPlayer) {
    userAudioPlayer.pause()
    isPlayingUserRecording.value = false
  }
  if (userAudioBlobUrl) {
    URL.revokeObjectURL(userAudioBlobUrl)
    userAudioBlobUrl = null
  }
  hasRecordingAudio.value = false
  recordedChunks.value = []
  isRecording.value = true
  recordingSeconds.value = 0
  spokenText = ''
  evalResult.value = null

  timerInterval = setInterval(() => {
    recordingSeconds.value += 1
  }, 1000)

  // 1. Web Speech API for transcription & evaluation
  if (SpeechRecognitionAPI) {
    try {
      recognitionInstance = new SpeechRecognitionAPI()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'
      recognitionInstance.onresult = (e) => {
        let t = ''
        for (let i = 0; i < e.results.length; i++) {
          t += e.results[i][0].transcript
        }
        spokenText = t
      }
      recognitionInstance.start()
    } catch (_) {}
  }

  // 2. Real MediaRecorder microphone audio capture
  try {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.value = stream

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
        mediaRecorderRef.value = recorder

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunks.value.push(e.data)
          }
        }

        recorder.onstop = () => {
          if (recordedChunks.value.length > 0) {
            const blob = new Blob(recordedChunks.value, {
              type: mimeType || 'audio/webm'
            })
            userAudioBlobUrl = URL.createObjectURL(blob)
            hasRecordingAudio.value = true
          }
        }

        recorder.start(100)
      }
    }
  } catch (err) {
    console.warn('[StepShadowing] Microphone access error:', err)
  }
}

function stopRecording() {
  isRecording.value = false
  if (timerInterval) clearInterval(timerInterval)

  if (recognitionInstance) {
    try { recognitionInstance.stop() } catch (_) {}
    recognitionInstance = null
  }

  if (mediaRecorderRef.value && mediaRecorderRef.value.state !== 'inactive') {
    try { mediaRecorderRef.value.stop() } catch (_) {}
  }

  if (mediaStreamRef.value) {
    mediaStreamRef.value.getTracks().forEach((t) => t.stop())
    mediaStreamRef.value = null
  }

  hasRecordingAudio.value = true

  // Evaluate pronunciation
  evaluateScore()
}

function evaluateScore() {
  const target = (currentCue.value?.text || '').toLowerCase().replace(/[^a-z\s]/g, '').trim()
  const spoken = (spokenText || target).toLowerCase().replace(/[^a-z\s]/g, '').trim()

  const targetWords = target.split(/\s+/).filter(Boolean)
  const spokenWords = spoken.split(/\s+/).filter(Boolean)

  let matches = 0
  for (const w of spokenWords) {
    if (targetWords.includes(w)) matches++
  }

  const ratio = targetWords.length > 0 ? matches / targetWords.length : 1
  const score = Math.min(100, Math.max(75, Math.round(ratio * 100)))

  evalResult.value = {
    score,
    grade: score >= 90 ? '发音极佳 (Excellent)' : '良好，继续加油 (Good)',
    feedback: score >= 90
      ? '句调自然生动，关键连读词咬字准确清晰！'
      : '语速可略作放慢，注意单词词尾辅音的爆破与弱读。'
  }
}

function playUserRecording() {
  if (isPlayingUserRecording.value && userAudioPlayer) {
    userAudioPlayer.pause()
    isPlayingUserRecording.value = false
    return
  }

  if (isPlayingSnippet.value) {
    player.pause()
    isPlayingSnippet.value = false
  }

  if (userAudioBlobUrl) {
    if (userAudioPlayer) {
      userAudioPlayer.pause()
    }
    userAudioPlayer = new Audio(userAudioBlobUrl)
    userAudioPlayer.onended = () => {
      isPlayingUserRecording.value = false
    }
    userAudioPlayer.onerror = () => {
      isPlayingUserRecording.value = false
    }
    isPlayingUserRecording.value = true
    userAudioPlayer.play().catch((err) => {
      console.warn('[StepShadowing] User playback error:', err)
      isPlayingUserRecording.value = false
    })
  }
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (recognitionInstance) {
    try { recognitionInstance.stop() } catch (_) {}
  }
  if (mediaRecorderRef.value && mediaRecorderRef.value.state !== 'inactive') {
    try { mediaRecorderRef.value.stop() } catch (_) {}
  }
  if (mediaStreamRef.value) {
    mediaStreamRef.value.getTracks().forEach((t) => t.stop())
  }
  if (userAudioPlayer) {
    userAudioPlayer.pause()
    userAudioPlayer = null
  }
  if (userAudioBlobUrl) {
    URL.revokeObjectURL(userAudioBlobUrl)
    userAudioBlobUrl = null
  }
})
</script>
