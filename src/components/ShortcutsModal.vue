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
          class="bg-[#fbf9f5] border border-[#e8ddd0] rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="px-5 py-4 border-b border-[#e8ddd0] flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center text-[#d97706]">
                <Keyboard class="w-4 h-4" />
              </div>
              <h2 class="font-serif text-base font-semibold text-[#1e1610]">
                快捷键与手势指南
              </h2>
            </div>

            <button
              type="button"
              @click="$emit('close')"
              class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors"
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
              class="p-3 bg-white/70 border border-[#e8ddd0] rounded-xl flex items-center justify-between gap-3"
            >
              <span class="text-xs text-[#4a3b32] font-medium">
                {{ item.desc }}
              </span>
              <kbd class="px-2.5 py-1 text-xs font-mono font-semibold bg-[#f4ebe1] border border-[#e8ddd0] text-[#1e1610] rounded-lg shadow-inner">
                {{ item.key }}
              </kbd>
            </div>
          </div>

          <!-- Footer with Legal Disclaimer -->
          <div class="px-5 py-3 border-t border-[#e8ddd0] bg-[#f4ebe1]/50 flex items-center justify-between text-xs shrink-0">
            <button
              type="button"
              @click="isLegalOpen = true"
              class="min-h-[44px] flex items-center gap-1.5 text-[#78695d] hover:text-[#1e1610] transition-colors group cursor-pointer"
              aria-label="查看研学公约与法律声明"
            >
              <Scale class="w-3.5 h-3.5 text-[#d97706] group-hover:scale-110 transition-transform" />
              <span class="text-[11px] underline">研学公约与版权声明 (Fair Use / DMCA)</span>
            </button>
            <span class="text-[10px] text-[#a89a8c] font-mono">v1.0.0-prod</span>
          </div>
        </div>
      </div>
    </Transition>

    <LegalDisclaimerModal
      :is-open="isLegalOpen"
      @close="isLegalOpen = false"
    />
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { Keyboard, X, Scale } from 'lucide-vue-next'
import LegalDisclaimerModal from './LegalDisclaimerModal.vue'

const isLegalOpen = ref(false)

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
