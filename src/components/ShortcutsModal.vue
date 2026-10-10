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
        aria-label="操作快捷键与手势指南"
      >
        <div
          class="bg-[#f8f8f6] border border-[#e4e4e7] rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="px-5 py-4 border-b border-[#e4e4e7] bg-white flex items-center justify-between shrink-0">
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
          <div class="flex-1 overflow-y-auto p-5 space-y-3">
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
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { Keyboard, X } from 'lucide-vue-next'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const shortcuts = [
  { key: 'Space', desc: '播放 / 暂停音频' },
  { key: '← (Left)', desc: '快退 5 秒' },
  { key: '→ (Right)', desc: '快进 5 秒' },
  { key: '轻点字幕', desc: '跳转至对应句子起播' },
  { key: '盲听模式', desc: '开启迷雾遮罩强制听音辨意' }
]
</script>
