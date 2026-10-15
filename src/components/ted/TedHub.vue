<template>
  <div
    class="h-full w-full flex flex-col items-center justify-center p-6 text-center select-none"
    role="region"
    aria-label="TED 魔法精讲"
  >
    <!-- Video Icon Container (48px) -->
    <div
      class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-300/80 flex items-center justify-center text-amber-700 mb-4"
      aria-hidden="true"
    >
      <Video :size="24" class="text-amber-700 stroke-[2.2]" />
    </div>

    <!-- Title -->
    <h2 class="text-lg font-bold font-magical text-amber-950 mb-2">
      TED 魔法精讲
    </h2>

    <!-- Body Description -->
    <p class="text-base text-stone-600 leading-relaxed max-w-sm mb-4">
      每期精选 TED 演讲，配词汇预热、精看任务与跟读评测，助你突破 B1 英语瓶颈。
    </p>

    <!-- Sub-note (Status) -->
    <p class="text-sm text-stone-400">
      即将开放 · 敬请期待
    </p>
  </div>
</template>

<script setup>
import { Video } from 'lucide-vue-next'
import { useNavigationStore } from '../../stores/navigationStore.js'

const navStore = useNavigationStore()
</script>
