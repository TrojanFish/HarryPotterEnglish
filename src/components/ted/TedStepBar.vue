<template>
  <nav
    class="flex items-center gap-2 px-4 py-3 border-b border-[#e8ddd0] bg-[#fbf9f5] w-full select-none"
    aria-label="TED 学习步骤"
  >
    <template v-for="(step, index) in STEPS" :key="step.id">
      <!-- Step Button -->
      <button
        type="button"
        :disabled="isLocked(step.id)"
        @click="goToStep(step.id)"
        class="min-h-[44px] min-w-[44px] px-3 py-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 touch-manipulation focus:outline-none"
        :class="[
          isActive(step.id)
            ? 'bg-amber-700 text-white rounded-2xl font-bold shadow-none'
            : isLocked(step.id)
            ? 'text-stone-400 opacity-50 cursor-not-allowed'
            : isCompleted(step.id)
            ? 'text-stone-700 hover:text-stone-900 rounded-2xl hover:bg-stone-100/60'
            : 'text-stone-600 hover:text-stone-900 rounded-2xl hover:bg-stone-100/60'
        ]"
        :aria-current="isActive(step.id) ? 'step' : undefined"
        :aria-label="`步骤 ${step.id}: ${step.label}${isActive(step.id) ? ' (当前)' : isCompleted(step.id) ? ' (已完成)' : isLocked(step.id) ? ' (已锁定)' : ''}`"
      >
        <!-- Icon / Badge -->
        <div class="flex items-center justify-center">
          <CheckCircle2
            v-if="isCompleted(step.id)"
            class="w-4 h-4 text-emerald-600 stroke-[2.2]"
            aria-hidden="true"
          />
          <Lock
            v-else-if="isLocked(step.id)"
            class="w-4 h-4 text-stone-400 stroke-[2]"
            aria-hidden="true"
          />
          <span
            v-else
            class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
            :class="isActive(step.id) ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-600'"
            aria-hidden="true"
          >
            {{ step.id }}
          </span>
        </div>

        <!-- Label -->
        <span
          class="text-xs font-bold whitespace-nowrap"
          :class="isActive(step.id) ? 'text-white' : ''"
        >
          {{ step.label }}
        </span>
      </button>

      <!-- Connector Line between steps -->
      <div
        v-if="index < STEPS.length - 1"
        class="flex-1 h-0.5 transition-colors duration-200"
        :class="isConnectorCompleted(step.id) ? 'bg-amber-400' : 'bg-[#e8ddd0]'"
        aria-hidden="true"
      />
    </template>
  </nav>
</template>

<script setup>
import { CheckCircle2, Lock } from 'lucide-vue-next'
import { useTedStore } from '../../stores/tedStore.js'

const tedStore = useTedStore()

const STEPS = [
  { id: 1, label: '词汇预热' },
  { id: 2, label: '精看精听' },
  { id: 3, label: '理解任务' },
  { id: 4, label: '演讲跟读' }
]

function isActive(stepId) {
  return tedStore.currentStep === stepId
}

function isLocked(stepId) {
  return stepId > 1 && !tedStore.vocabUnlocked
}

function isCompleted(stepId) {
  if (isActive(stepId)) return false
  if (tedStore.isCurrentTalkCompleted) return true
  if (tedStore.maxStepReached > stepId) return true
  return false
}

function isConnectorCompleted(stepId) {
  if (tedStore.isCurrentTalkCompleted) return true
  const highest = Math.max(tedStore.currentStep, tedStore.maxStepReached || 1)
  if (stepId === 1) {
    return highest > 1 || tedStore.vocabUnlocked
  }
  return highest > stepId
}

function goToStep(stepId) {
  if (isLocked(stepId)) return
  tedStore.goToStep(stepId)
}
</script>
