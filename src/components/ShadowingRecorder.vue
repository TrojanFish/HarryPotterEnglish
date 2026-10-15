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
        @click="handleClose"
        role="dialog"
        aria-modal="true"
        aria-label="A/B 影子跟读工坊"
      >
        <div
          class="bg-[#f8f8f6] border border-[#e4e4e7] rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="px-5 py-4 border-b border-[#e4e4e7] bg-white flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563eb]">
                <Mic class="w-4 h-4" />
              </div>
              <h2 class="font-serif text-base font-semibold text-[#18181b]">
                A/B 影子跟读工坊
              </h2>
            </div>

            <button
              type="button"
              @click="handleClose"
              class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="关闭影子跟读"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Main Scrollable Content -->
          <div class="flex-1 overflow-y-auto p-5 space-y-4">
            <div
              v-if="!isSpeechRecognitionSupported"
              class="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2"
            >
              <AlertCircle class="w-4 h-4 shrink-0 text-[#2563eb]" />
              <span>当前浏览器不支持 Web Speech API，录音后将使用示范句进行模拟打分</span>
            </div>

            <!-- Target Sentence Card -->
            <div class="p-4 bg-white border border-[#e4e4e7] rounded-xl space-y-2">
              <div class="text-[11px] font-mono text-[#a1a1aa] uppercase tracking-wide">
                示范句 (Target Sentence)
              </div>

              <!-- Evaluated token stream or plain text -->
              <div v-if="evaluationResult?.words?.length" class="flex flex-wrap gap-1.5 py-1">
                <span
                  v-for="(w, idx) in evaluationResult.words"
                  :key="idx"
                  :class="[
                    'px-2 py-0.5 rounded text-sm font-serif border transition-colors',
                    w.status === 'matched'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : w.status === 'partial'
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  ]"
                >
                  {{ w.word }}
                </span>
              </div>
              <p v-else class="font-serif text-base leading-relaxed text-[#18181b]">
                {{ targetSentence }}
              </p>

              <p v-if="currentCue?.translation" class="text-xs text-[#71717a]">
                {{ currentCue.translation }}
              </p>
            </div>

            <!-- Score Banner (when evaluated) -->
            <div
              v-if="evaluationResult"
              class="p-4 rounded-xl border flex items-center justify-between"
              :class="
                evaluationResult.score >= 80
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : evaluationResult.score >= 60
                  ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                  : 'bg-rose-50/70 border-rose-200 text-rose-900'
              "
            >
              <div class="flex items-center gap-3">
                <Award class="w-6 h-6 shrink-0" />
                <div>
                  <div class="text-lg font-bold font-mono">
                    {{ Math.round(evaluationResult.score) }}分
                  </div>
                  <div class="text-xs">
                    {{ evaluationResult.score >= 80 ? '发音清晰，英音韵律极佳' : evaluationResult.score >= 60 ? '连读与部分重音可继续精进' : '建议慢速重听示范示范音' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Dual-Track Audio Comparison: Track A vs Track B -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <!-- Track A: Original Audio Snippet -->
              <div class="p-3.5 bg-white border border-[#e4e4e7] rounded-xl flex flex-col justify-between gap-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-[#18181b] flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-[#2563eb]"></span>
                    Track A 原声
                  </span>
                  <span class="text-[10px] text-[#a1a1aa] font-mono">原版英音示范</span>
                </div>

                <button
                  type="button"
                  @click="playOriginalSnippet"
                  class="min-h-[44px] w-full py-2 px-3 bg-[#f8f8f6] hover:bg-[#f4f4f5] border border-[#e4e4e7] text-[#18181b] text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
                >
                  <Volume2 class="w-4 h-4 text-[#2563eb]" />
                  <span>播放原声示范</span>
                </button>
              </div>

              <!-- Track B: User Recording -->
              <div class="p-3.5 bg-white border border-[#e4e4e7] rounded-xl flex flex-col justify-between gap-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-[#18181b] flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full" :class="recordedAudioUrl ? 'bg-emerald-600' : 'bg-zinc-400'"></span>
                    Track B 我的录音
                  </span>
                  <span class="text-[10px] text-[#a1a1aa] font-mono">
                    {{ recordedAudioUrl ? '已录制' : '等待录音' }}
                  </span>
                </div>

                <button
                  type="button"
                  @click="playUserRecording"
                  :disabled="!recordedAudioUrl"
                  class="min-h-[44px] w-full py-2 px-3 bg-[#f8f8f6] hover:bg-[#f4f4f5] disabled:opacity-40 disabled:hover:bg-[#f8f8f6] border border-[#e4e4e7] text-[#18181b] text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
                >
                  <Play class="w-4 h-4 text-emerald-600" />
                  <span>回放我的录音</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Action Bar (Microphone Control) -->
          <div class="p-4 border-t border-[#e4e4e7] bg-white shrink-0 flex items-center justify-center gap-4">
            <button
              v-if="!isRecording"
              type="button"
              @click="startRecording"
              class="min-h-[48px] px-8 py-2.5 bg-[#18181b] hover:bg-[#27272a] text-white text-sm font-semibold rounded-full flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Mic class="w-5 h-5 text-white" />
              <span>开始跟读录音</span>
            </button>

            <button
              v-else
              type="button"
              @click="stopRecording"
              class="min-h-[48px] px-8 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-full flex items-center gap-2 transition-all animate-pulse cursor-pointer"
            >
              <Square class="w-5 h-5 fill-current text-white" />
              <span>停止录音并评测</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { evaluatePronunciation } from '../utils/speechScoring.js'
import { usePlayerStore } from '../stores/playerStore.js'
import {
  X,
  Mic,
  Square,
  Play,
  Volume2,
  Award,
  AlertCircle
} from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  currentCue: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['close'])

const player = usePlayerStore()

const SpeechRecognitionAPI = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition || null) : null
const isSpeechRecognitionSupported = computed(() => !!SpeechRecognitionAPI)

const recognitionRef = ref(null)
const spokenTranscript = ref('')
const isPlayingOriginal = ref(false)

const isRecording = ref(false)
const recordedAudioUrl = ref(null)
const evaluationResult = ref(null)
const mediaStream = ref(null)
const mediaRecorder = ref(null)
const recordedChunks = ref([])

const targetSentence = computed(() => {
  return props.currentCue?.text || 'Mr. and Mrs. Dursley of number four Privet Drive'
})

function handleClose() {
  if (isPlayingOriginal.value) {
    player.pause()
    isPlayingOriginal.value = false
  }
  stopHardware()
  emit('close')
}

function stopHardware() {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((t) => t.stop())
    mediaStream.value = null
  }
  if (recognitionRef.value) {
    try { recognitionRef.value.stop() } catch (_) {}
    recognitionRef.value = null
  }
  isRecording.value = false
}

async function startRecording() {
  if (isPlayingOriginal.value) {
    player.pause()
    isPlayingOriginal.value = false
  }
  if (recordedAudioUrl.value) {
    URL.revokeObjectURL(recordedAudioUrl.value)
    recordedAudioUrl.value = null
  }
  evaluationResult.value = null
  recordedChunks.value = []
  spokenTranscript.value = ''

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
    } catch (e) {}
  }

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStream.value = stream

      const recorder = new MediaRecorder(stream)
      mediaRecorder.value = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.value.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks.value, { type: 'audio/webm' })
        recordedAudioUrl.value = URL.createObjectURL(blob)
      }

      recorder.start()
      isRecording.value = true
    } else {
      // Fallback simulation if browser environment has no mic
      isRecording.value = true
    }
  } catch (err) {
    console.warn('[Shadowing] Microphone access warning, running fallback:', err)
    isRecording.value = true
  }
}

function stopRecording() {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  }
  stopHardware()

  // Evaluate pronunciation against target sentence
  const target = targetSentence.value
  const spoken = spokenTranscript.value.trim() || target
  evaluationResult.value = evaluatePronunciation(target, spoken)
}

function playOriginalSnippet() {
  if (props.currentCue?.start !== undefined) {
    isPlayingOriginal.value = true
    player.seek(props.currentCue.start)
    player.play()
  }
}

watch(
  () => player.currentTime,
  (t) => {
    if (
      isPlayingOriginal.value &&
      props.currentCue?.end !== undefined &&
      t >= props.currentCue.end - 0.15
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

function playUserRecording() {
  if (recordedAudioUrl.value) {
    const audio = new Audio(recordedAudioUrl.value)
    audio.play().catch((e) => console.warn('[Shadowing] Playback warning:', e))
  }
}

onUnmounted(() => {
  if (isPlayingOriginal.value) {
    player.pause()
    isPlayingOriginal.value = false
  }
  stopHardware()
  if (recordedAudioUrl.value) {
    URL.revokeObjectURL(recordedAudioUrl.value)
    recordedAudioUrl.value = null
  }
})
</script>
