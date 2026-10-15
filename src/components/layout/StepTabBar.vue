<template>
  <nav
    class="h-12 shrink-0 bg-white border-b border-[#e4e4e7] px-3 sm:px-6 flex items-center justify-center z-10"
    role="navigation"
    aria-label="学习步骤流程"
  >
    <div class="flex items-center gap-1 sm:gap-2 max-w-xl w-full">
      <button
        v-for="item in steps"
        :key="item.id"
        type="button"
        @click="sessionStore.setStep(item.id)"
        :class="[
          'flex-1 min-h-[44px] px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all active:scale-95 touch-manipulation',
          sessionStore.currentStep === item.id
            ? 'bg-[#2563eb] text-white font-semibold'
            : 'text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5]'
        ]"
        :aria-current="sessionStore.currentStep === item.id ? 'step' : undefined"
      >
        <span
          :class="[
            'w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono',
            sessionStore.currentStep === item.id
              ? 'border-white text-white'
              : 'border-[#71717a] text-[#71717a]'
          ]"
        >
          {{ item.id }}
        </span>
        <span class="truncate">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { useSessionStore } from '../../stores/sessionStore.js'

const sessionStore = useSessionStore()

const steps = [
  { id: 1, label: '原版精听' },
  { id: 2, label: '影子跟读' },
  { id: 3, label: '拼写听写' },
  { id: 4, label: '词汇复习' }
]
</script>
