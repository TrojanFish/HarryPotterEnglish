<template>
  <Teleport to="body">
    <div
      class="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[100] max-w-sm sm:max-w-md w-[calc(100%-2rem)] pointer-events-none"
      style="padding-top: env(safe-area-inset-top, 0px);"
    >
      <Transition name="toast-slide">
        <div
          v-if="activeToast"
          role="status"
          aria-live="polite"
          class="pointer-events-auto relative flex items-center gap-3.5 bg-[#faf6ee] border-2 rounded-2xl shadow-lg p-3.5 sm:p-4 text-stone-900 transition-all duration-300 active:scale-[0.98] ring-1 ring-amber-400/20"
          :class="houseBorderClass"
        >
          <!-- Celebratory Icon Badge -->
          <div
            class="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm"
            :class="houseIconClass"
          >
            <component :is="resolvedIcon" class="w-6 h-6 stroke-[2.25]" />
          </div>

          <!-- Toast Content -->
          <div class="flex-1 min-w-0 pr-1">
            <h4 class="text-sm sm:text-base font-bold font-serif text-stone-900 leading-snug truncate">
              {{ activeToast.title }}
            </h4>
            <p v-if="activeToast.subtitle" class="text-xs text-stone-600 mt-0.5 line-clamp-2 leading-relaxed">
              {{ activeToast.subtitle }}
            </p>
          </div>

          <!-- Dismiss Button with Apple HIG 44px touch target -->
          <button
            type="button"
            @click="dismissToast"
            aria-label="关闭提示"
            class="flex-shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200/50 active:scale-95 transition-all touch-manipulation focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useGamificationStore } from '../../stores/gamificationStore.js'
import {
  Award,
  Flame,
  Sparkles,
  Trophy,
  Crown,
  Shield,
  BookOpen,
  Volume2,
  Headphones,
  Mic,
  BookMarked,
  PenTool,
  Check,
  GraduationCap,
  Wand2,
  Compass,
  Heart,
  X
} from 'lucide-vue-next'

const ICON_MAP = {
  Award,
  Flame,
  Sparkles,
  Trophy,
  Crown,
  Shield,
  BookOpen,
  Volume2,
  Headphones,
  Mic,
  BookMarked,
  PenTool,
  Check,
  GraduationCap,
  Wand2,
  Compass,
  Heart
}

const store = useGamificationStore()
const activeToast = ref(null)
const isTransitioning = ref(false)
let timer = null
let nextToastTimer = null

const resolvedIcon = computed(() => {
  if (!activeToast.value || !activeToast.value.icon) return Sparkles
  return ICON_MAP[activeToast.value.icon] || Sparkles
})

const houseBorderClass = computed(() => {
  const house = activeToast.value?.house
  if (house === 'gryffindor') return 'border-red-500 shadow-red-950/10'
  if (house === 'ravenclaw') return 'border-blue-500 shadow-blue-950/10'
  if (house === 'hufflepuff') return 'border-amber-500 shadow-amber-950/10'
  if (house === 'slytherin') return 'border-emerald-600 shadow-emerald-950/10'
  return 'border-amber-400 shadow-amber-950/10'
})

const houseIconClass = computed(() => {
  const house = activeToast.value?.house
  if (house === 'gryffindor') return 'bg-red-100 text-red-700 border-red-200'
  if (house === 'ravenclaw') return 'bg-blue-100 text-blue-700 border-blue-200'
  if (house === 'hufflepuff') return 'bg-amber-100 text-amber-800 border-amber-200'
  if (house === 'slytherin') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  return 'bg-amber-100 text-amber-800 border-amber-200'
})

function showNextToast() {
  if (isTransitioning.value || activeToast.value) return
  if (!store.pendingToasts || store.pendingToasts.length === 0) return

  activeToast.value = store.pendingToasts[0]
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    dismissToast()
  }, 3500)
}

function dismissToast() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (!activeToast.value && (!store.pendingToasts || store.pendingToasts.length === 0)) {
    return
  }

  activeToast.value = null
  store.popToast()

  if (nextToastTimer) {
    clearTimeout(nextToastTimer)
    nextToastTimer = null
  }

  if (store.pendingToasts && store.pendingToasts.length > 0) {
    isTransitioning.value = true
    nextToastTimer = setTimeout(() => {
      isTransitioning.value = false
      showNextToast()
    }, 250)
  }
}

watch(
  () => store.pendingToasts?.length,
  (len) => {
    if (len > 0 && !activeToast.value && !isTransitioning.value) {
      showNextToast()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  if (nextToastTimer) clearTimeout(nextToastTimer)
})
</script>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.96);
}
</style>
