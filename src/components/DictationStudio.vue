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
        aria-label="拼写听写工坊"
      >
        <div
          class="bg-[#f8f8f6] border border-[#e4e4e7] rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="px-5 py-4 border-b border-[#e4e4e7] bg-white flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563eb]">
                <PenTool class="w-4 h-4" />
              </div>
              <h2 class="font-serif text-base font-semibold text-[#18181b]">
                拼写听写工坊
              </h2>
            </div>

            <button
              type="button"
              @click="$emit('close')"
              class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="关闭听写工坊"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Main Scrollable Area -->
          <div class="flex-1 overflow-y-auto p-5 space-y-4">
            <!-- Audio Playback Buttons Card -->
            <div class="p-4 bg-white border border-[#e4e4e7] rounded-xl flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-semibold text-[#18181b]">
                  盲听本句音频
                </p>
                <p class="text-[11px] text-[#71717a] mt-0.5">
                  仔细辨音，输入听到的原版英文句子
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="playSnippet(1.0)"
                  :class="[
                    'min-h-[44px] px-3.5 py-2 border rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer',
                    isPlayingSnippet && currentRate === 1.0
                      ? 'bg-blue-50 border-[#2563eb] text-[#2563eb]'
                      : 'bg-white border-[#e4e4e7] text-[#18181b] hover:bg-[#f4f4f5]'
                  ]"
                >
                  <Volume2 :class="['w-4 h-4 text-[#2563eb]', isPlayingSnippet && currentRate === 1.0 ? 'animate-pulse' : '']" />
                  <span>原速</span>
                </button>

                <button
                  type="button"
                  @click="playSnippet(0.8)"
                  :class="[
                    'min-h-[44px] px-3.5 py-2 border rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer',
                    isPlayingSnippet && currentRate === 0.8
                      ? 'bg-blue-50 border-[#2563eb] text-[#2563eb]'
                      : 'bg-white border-[#e4e4e7] text-[#18181b] hover:bg-[#f4f4f5]'
                  ]"
                >
                  <RotateCcw :class="['w-4 h-4 text-[#2563eb]', isPlayingSnippet && currentRate === 0.8 ? 'animate-spin' : '']" />
                  <span>0.8x 慢放</span>
                </button>
              </div>
            </div>

            <!-- Dictation Input Area (Strict 16px text-base for iOS zoom prevention) -->
            <div class="space-y-2">
              <label for="dictation-input" class="text-xs font-medium text-[#71717a] block">
                你的听写输入：
              </label>

              <textarea
                id="dictation-input"
                v-model="userText"
                rows="3"
                placeholder="在此输入听到的原版英文句子..."
                class="w-full text-base p-3.5 bg-white border border-[#e4e4e7] rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] text-[#18181b] leading-relaxed resize-none transition-all placeholder:text-[#a1a1aa]"
              ></textarea>
            </div>

            <!-- Hint & Feedback Area -->
            <div class="flex items-center justify-between">
              <!-- Feather Quill Hint Button -->
              <button
                type="button"
                @click="showHint = !showHint"
                class="min-h-[44px] px-3 py-2 text-xs text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] rounded-lg border border-[#e4e4e7] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HelpCircle class="w-4 h-4 text-[#2563eb]" />
                <span>{{ showHint ? '隐藏羽毛笔提示' : '羽毛笔提示' }}</span>
              </button>

              <!-- Check Answer Button -->
              <button
                type="button"
                @click="checkAnswer"
                class="min-h-[44px] px-5 py-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
              >
                <CheckCircle2 class="w-4 h-4" />
                <span>提交校验</span>
              </button>
            </div>

            <!-- Hint Box -->
            <div v-if="showHint" class="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed font-serif">
              <span class="font-semibold">提示首词：</span>
              <span>{{ hintText }}</span>
            </div>

            <!-- Validation Result Card -->
            <div
              v-if="checked"
              class="p-4 rounded-xl border"
              :class="
                isCorrect
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50/80 border-rose-300 text-rose-900'
              "
            >
              <div class="flex items-start gap-2.5">
                <component
                  :is="isCorrect ? CheckCircle2 : XCircle"
                  class="w-5 h-5 shrink-0 mt-0.5"
                  :class="isCorrect ? 'text-emerald-700' : 'text-rose-700'"
                />
                <div class="space-y-1">
                  <p class="text-sm font-semibold">
                    {{ isCorrect ? '拼写完全正确！' : '存在拼写差异，对照原句重练：' }}
                  </p>
                  <p class="text-xs font-serif leading-relaxed" :class="isCorrect ? 'text-emerald-800' : 'text-rose-800'">
                    原句：{{ targetSentence }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Footer Navigation -->
          <div class="p-4 border-t border-[#e4e4e7] bg-white shrink-0 flex items-center justify-between">
            <span class="text-xs text-[#71717a]">
              听写训练 · 单句精进
            </span>

            <button
              type="button"
              @click="nextSentence"
              class="min-h-[44px] px-4 py-2 bg-[#f4f4f5] hover:bg-[#e4e4e7] border border-[#e4e4e7] text-[#18181b] text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
            >
              <span>下一句</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { usePlayerStore } from '../stores/playerStore.js'
import {
  X,
  PenTool,
  Volume2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight
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

const emit = defineEmits(['close', 'next'])

const player = usePlayerStore()

const userText = ref('')
const checked = ref(false)
const isCorrect = ref(false)
const showHint = ref(false)
const isPlayingSnippet = ref(false)
const currentRate = ref(1.0)

const targetSentence = computed(() => {
  return props.currentCue?.text || 'Mr. and Mrs. Dursley of number four Privet Drive'
})

const hintText = computed(() => {
  const words = targetSentence.value.split(/\s+/)
  return words.slice(0, 3).join(' ') + ' ...'
})

function playSnippet(rate = 1.0) {
  if (props.currentCue?.start !== undefined) {
    if (isPlayingSnippet.value && currentRate.value === rate) {
      player.pause()
      isPlayingSnippet.value = false
      return
    }
    currentRate.value = rate
    player.setPlaybackRate(rate)
    isPlayingSnippet.value = true
    player.seek(props.currentCue.start)
    player.play()
  }
}

watch(
  () => player.currentTime,
  (t) => {
    if (
      isPlayingSnippet.value &&
      props.currentCue?.end !== undefined &&
      t >= props.currentCue.end - 0.15
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

function cleanStr(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function checkAnswer() {
  const cleanedTarget = cleanStr(targetSentence.value)
  const cleanedUser = cleanStr(userText.value)

  isCorrect.value = cleanedTarget === cleanedUser
  checked.value = true
}

function nextSentence() {
  userText.value = ''
  checked.value = false
  isCorrect.value = false
  showHint.value = false
  emit('next')
}

onUnmounted(() => {
  if (isPlayingSnippet.value) {
    player.pause()
    isPlayingSnippet.value = false
  }
})
</script>
