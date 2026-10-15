<template>
  <div v-if="hasError" class="p-6 bg-[#f8f8f6] border border-[#e4e4e7] rounded-2xl max-w-lg mx-auto my-12 text-center">
    <div class="w-12 h-12 bg-blue-50 text-[#2563eb] border border-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
      <AlertTriangle class="w-6 h-6" />
    </div>
    <h3 class="font-serif text-lg font-semibold text-[#18181b] mb-2">
      触发了防护魔法
    </h3>
    <p class="text-sm text-[#71717a] mb-4">
      界面组件遇到了一些异常波动：{{ errorMsg || '未知异常' }}
    </p>
    <div class="flex items-center justify-center gap-3">
      <button
        type="button"
        @click="resetError"
        class="min-h-[44px] px-5 py-2 bg-[#18181b] hover:bg-[#27272a] text-white text-sm font-medium rounded-xl transition-colors active:scale-95 cursor-pointer"
      >
        重试复原
      </button>
      <button
        type="button"
        @click="reloadPage"
        class="min-h-[44px] px-5 py-2 bg-white hover:bg-[#f4f4f5] border border-[#e4e4e7] text-[#18181b] text-sm font-medium rounded-xl transition-colors active:scale-95 cursor-pointer"
      >
        重载刷新
      </button>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'

const hasError = ref(false)
const errorMsg = ref('')

onErrorCaptured((err) => {
  console.error('[MagicErrorBoundary Caught]:', err)
  hasError.value = true
  errorMsg.value = err.message || String(err)
  return false
})

function resetError() {
  hasError.value = false
  errorMsg.value = ''
}

function reloadPage() {
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}
</script>
