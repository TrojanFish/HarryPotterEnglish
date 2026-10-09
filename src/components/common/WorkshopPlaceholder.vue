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
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        @click="$emit('close')"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="bg-[#fbf9f5] border border-[#e8ddd0] rounded-2xl p-6 max-w-sm w-full text-center"
          @click.stop
        >
          <div class="w-12 h-12 bg-amber-50 text-[#d97706] rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-200">
            <Sparkles class="w-6 h-6" />
          </div>
          <h3 class="font-serif text-base font-semibold text-[#1e1610] mb-1">
            {{ title || '魔法工坊升级中' }}
          </h3>
          <p class="text-xs text-[#78695d] mb-5 leading-relaxed">
            Vue 3 核心架构第一阶段（流媒体精听 + 英雄聚焦）已就绪。该工坊将在后续阶段完成迁移！
          </p>
          <button
            type="button"
            @click="$emit('close')"
            class="min-h-[44px] w-full py-2.5 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-medium rounded-xl transition-colors active:scale-95 shadow-sm"
          >
            知道了
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { Sparkles } from 'lucide-vue-next'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  }
})

defineEmits(['close'])
</script>
