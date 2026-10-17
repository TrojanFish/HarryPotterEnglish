<template>
  <div class="flex flex-col h-full bg-[#fbf9f5] select-none">
    <!-- Sub-status bar inside content (compact and subtle, eliminates double header) -->
    <div class="px-4 py-2.5 bg-amber-500/5 border-b border-[#e8ddd0]/50 flex items-center justify-between shrink-0">
      <p class="text-xs text-stone-600 font-medium">
        听完下方所有重点词汇读音，即可解锁视频精看
      </p>
      <div class="flex items-center gap-2 text-xs font-mono font-bold text-amber-900 shrink-0">
        <span>已预热 {{ progress.listened }} / {{ progress.total }}</span>
      </div>
    </div>

    <!-- Scrollable card flow -->
    <div class="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
      <!-- Empty state when no vocab available -->
      <div
        v-if="!vocabList || vocabList.length === 0"
        class="flex flex-col items-center justify-center p-8 text-center text-stone-500 min-h-[200px]"
      >
        <BookOpen class="w-10 h-10 text-stone-400 mb-2 stroke-[1.5]" aria-hidden="true" />
        <p class="text-sm font-medium">本篇演讲暂无预热词汇</p>
        <p class="text-xs text-stone-400 mt-1">系统已为你自动解锁，可直接点击下方「前往精看」进入视频学习</p>
      </div>

      <!-- Vocab cards list -->
      <article
        v-for="(vocab, index) in vocabList"
        :key="vocab.word || index"
        class="rounded-2xl p-4 space-y-2 transition-all duration-200 border"
        :class="[
          isListened(vocab.word)
            ? 'border-amber-500 bg-amber-500/5'
            : 'border-[#e8ddd0] bg-white'
        ]"
      >
        <!-- Header row: Listen button, Word, IPA, POS, and Listened indicator -->
        <div class="flex items-center gap-3">
          <!-- Volume2 Listen button with 44px touch target -->
          <button
            type="button"
            @click="playVocabAudio(vocab)"
            class="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-150 touch-manipulation focus:outline-none shrink-0"
            :class="[
              isListened(vocab.word)
                ? 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
                : 'bg-amber-100/70 text-amber-900 hover:bg-amber-200/80 active:scale-95'
            ]"
            :aria-label="`播放发音: ${vocab.word}`"
          >
            <Volume2 class="w-5 h-5 stroke-[2]" aria-hidden="true" />
          </button>

          <!-- Word, IPA, POS -->
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2 flex-wrap">
              <h3 class="text-lg font-bold text-amber-950 truncate">
                {{ vocab.word }}
              </h3>
              <span v-if="vocab.ipa" class="text-sm font-mono text-stone-500">
                {{ vocab.ipa }}
              </span>
              <span v-if="vocab.pos" class="text-sm italic text-stone-500">
                {{ vocab.pos }}
              </span>
            </div>
          </div>

          <!-- Listened badge / Skip button -->
          <div class="shrink-0 flex items-center gap-1.5">
            <span
              v-if="isListened(vocab.word)"
              class="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1"
            >
              <CheckCircle2 class="w-4 h-4 text-emerald-600 stroke-[2.2]" aria-hidden="true" />
              <span>已听</span>
            </span>
            <button
              v-else
              type="button"
              @click="markVocabListened(vocab.word)"
              class="min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-all touch-manipulation focus:outline-none flex items-center justify-center gap-1"
              :aria-label="`标记已知: ${vocab.word}`"
            >
              <Check class="w-3.5 h-3.5" aria-hidden="true" />
              <span>已知</span>
            </button>
          </div>
        </div>

        <!-- Badges row: cefrLevel + examTag -->
        <div
          v-if="vocab.cefrLevel || vocab.examTag"
          class="flex items-center gap-2 pt-0.5"
        >
          <span
            v-if="vocab.cefrLevel"
            class="text-xs font-mono border border-[#e8ddd0] rounded px-1.5 py-0.5 text-stone-600 bg-stone-50"
          >
            {{ vocab.cefrLevel }}
          </span>
          <span
            v-if="vocab.examTag"
            class="text-xs font-mono border border-[#e8ddd0] rounded px-1.5 py-0.5 text-amber-800 bg-amber-50"
          >
            {{ vocab.examTag }}
          </span>
        </div>

        <!-- Definition row -->
        <p class="text-sm text-stone-700 font-medium leading-normal">
          {{ vocab.definitionCn }}
        </p>

        <!-- Example sentence row -->
        <p
          v-if="vocab.exampleSentence"
          class="text-sm text-stone-500 italic leading-relaxed bg-[#fbf9f5] border border-[#e8ddd0]/60 rounded-xl p-2.5"
        >
          {{ vocab.exampleSentence }}
        </p>
      </article>
    </div>

    <!-- Sticky footer bar -->
    <footer
      class="sticky bottom-0 bg-[#fbf9f5] border-t border-[#e8ddd0] p-4 flex items-center justify-between gap-4 z-10"
    >
      <div class="flex flex-col gap-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-amber-950">
            预热进度 {{ progress.listened }} / {{ progress.total }}
          </span>
          <span
            v-if="tedStore.vocabUnlocked"
            class="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 rounded px-1.5 py-0.5"
          >
            已解锁
          </span>
          <span
            v-else
            class="text-[11px] text-stone-500"
          >
            未解锁
          </span>
        </div>
        <!-- Progress bar -->
        <div class="w-28 sm:w-44 h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-amber-500 transition-all duration-300"
            :style="{ width: `${progress.percent}%` }"
          />
        </div>
      </div>

      <!-- Unlock CTA Button calling goToStep(2) -->
      <button
        type="button"
        :disabled="!tedStore.vocabUnlocked"
        @click="goToStep(2)"
        class="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all duration-200 touch-manipulation focus:outline-none shrink-0"
        :class="[
          tedStore.vocabUnlocked
            ? 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95 shadow-none cursor-pointer'
            : 'bg-stone-200 text-stone-400 opacity-50 cursor-not-allowed'
        ]"
        aria-label="进入精看精听"
      >
        <span>前往精看</span>
        <ArrowRight class="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
      </button>
    </footer>
  </div>
</template>

<script setup>
import { computed, onUnmounted } from 'vue'
import { Volume2, CheckCircle2, ArrowRight, Check, BookOpen } from 'lucide-vue-next'
import { useTedStore } from '../../stores/tedStore.js'
import { resolveVideoStreamUrl } from '../../data/tedData.js'

const tedStore = useTedStore()

const vocabList = computed(() => tedStore.currentTalk?.vocabSet || [])
const progress = computed(() => tedStore.vocabProgress)

let currentAudio = null

function isListened(word) {
  const _ = tedStore.listenedVocabIds.size
  if (!word) return false
  const clean = typeof word === 'string' ? word.trim().toLowerCase() : word
  return tedStore.listenedVocabIds.has(clean)
}

function markVocabListened(word) {
  tedStore.markVocabListened(word)
}

function playVocabAudio(vocab) {
  if (!vocab?.word) return
  tedStore.markVocabListened(vocab.word)

  if (currentAudio) {
    try {
      currentAudio.pause()
      currentAudio.currentTime = 0
    } catch {}
    currentAudio = null
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch {}
  }

  if (vocab.audioKey) {
    const audioUrl = resolveVideoStreamUrl(vocab.audioKey)
    if (audioUrl && typeof Audio !== 'undefined') {
      try {
        currentAudio = new Audio(audioUrl)
        currentAudio.play().catch((err) => {
          console.debug('[TedVocabPreload] Audio playback failed, falling back to speech synthesis:', err?.message)
          fallbackSpeech(vocab.word)
        })
        return
      } catch {
        fallbackSpeech(vocab.word)
        return
      }
    }
  }

  fallbackSpeech(vocab.word)
}

function fallbackSpeech(word) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    } catch {}
  }
}

function goToStep(step) {
  tedStore.goToStep(step)
}

onUnmounted(() => {
  if (currentAudio) {
    try {
      currentAudio.pause()
    } catch {}
    currentAudio = null
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch {}
  }
})
</script>
