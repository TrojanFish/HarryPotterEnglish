<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden">
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
          class="fixed inset-0 bg-black/50 backdrop-blur-sm"
          @click="$emit('close')"
          aria-hidden="true"
        ></div>
      </Transition>

      <!-- Bottom Sheet Modal Container -->
      <div
        class="fixed inset-0 pointer-events-none flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <Transition
          appear
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="translate-y-full sm:translate-y-4 opacity-0 sm:opacity-0"
          enter-to-class="translate-y-0 opacity-100 sm:opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-full sm:translate-y-4 opacity-0"
        >
          <div
            v-if="isOpen"
            class="pointer-events-auto bg-[#f8f8f6] border-t border-x sm:border border-[#e4e4e7] rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:pb-0"
            :style="sheetStyle"
            @click.stop
            role="dialog"
            aria-modal="true"
            aria-label="操作快捷键与手势指南"
          >
            <!-- Pull Handle (Mobile only) -->
            <div
              class="pt-3 pb-1 sm:hidden flex justify-center cursor-grab active:cursor-grabbing touch-none shrink-0"
              @touchstart="onTouchStart"
              @touchmove="handleDragTouchMove"
              @touchend="onTouchEnd"
            >
              <div class="w-10 h-1.5 rounded-full bg-stone-300"></div>
            </div>

            <!-- Header -->
            <div
              class="px-5 py-3 sm:py-4 border-b border-[#e4e4e7] bg-white flex items-center justify-between shrink-0 select-none touch-none"
              @touchstart="onTouchStart"
              @touchmove="handleDragTouchMove"
              @touchend="onTouchEnd"
            >
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563eb]">
                  <Keyboard class="w-4 h-4" />
                </div>
                <h2 class="font-serif text-base font-semibold text-[#18181b]">
                  快捷键与手势指南
                </h2>
              </div>

              <button
                type="button"
                @click="$emit('close')"
                class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="关闭快捷键指南"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Shortcuts List -->
            <div
              ref="scrollContainerRef"
              class="flex-1 overflow-y-auto p-5 space-y-3 ios-scroll"
              @touchstart="onTouchStart"
              @touchmove="handleContentTouchMove"
              @touchend="onTouchEnd"
            >
              <div
                v-for="item in shortcuts"
                :key="item.key"
                class="p-3 bg-white border border-[#e4e4e7] rounded-xl flex items-center justify-between gap-3"
              >
                <span class="text-xs text-[#18181b] font-medium">
                  {{ item.desc }}
                </span>
                <kbd class="px-2.5 py-1 text-xs font-mono font-semibold bg-[#f4f4f5] border border-[#e4e4e7] text-[#18181b] rounded-lg shadow-inner">
                  {{ item.key }}
                </kbd>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-5 py-3 border-t border-[#e4e4e7] bg-white flex items-center justify-between text-xs shrink-0">
              <span class="text-xs text-[#71717a] font-serif">快捷键支持随时唤起</span>
              <span class="text-[10px] text-[#a1a1aa] font-mono">v1.0.0-prod</span>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { Keyboard, X } from 'lucide-vue-next'
import { useBottomSheet } from '../composables/useBottomSheet.js'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const scrollContainerRef = ref(null)

const {
  sheetStyle,
  onTouchStart,
  onTouchMove,
  onTouchEnd
} = useBottomSheet({
  threshold: 80,
  onClose: () => emit('close')
})

function handleDragTouchMove(e) {
  onTouchMove(e, 0)
}

function handleContentTouchMove(e) {
  const st = scrollContainerRef.value ? scrollContainerRef.value.scrollTop : 0
  onTouchMove(e, st)
}

const shortcuts = [
  { key: 'Space', desc: '播放 / 暂停音频' },
  { key: '← (Left)', desc: '快退 5 秒' },
  { key: '→ (Right)', desc: '快进 5 秒' },
  { key: '轻点字幕', desc: '跳转至对应句子起播' },
  { key: '盲听模式', desc: '开启迷雾遮罩强制听音辨意' }
]
</script>
