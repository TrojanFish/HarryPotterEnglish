<template>
  <!-- Empty State Fallback (when no talks are available) -->
  <div
    v-if="!tedStore.talks || tedStore.talks.length === 0"
    class="h-full w-full flex flex-col items-center justify-center p-6 text-center select-none bg-[#fbf9f5]"
    role="region"
    aria-label="TED 魔法精讲"
  >
    <div
      class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-300/80 flex items-center justify-center text-amber-700 mb-4"
      aria-hidden="true"
    >
      <Video :size="24" class="text-amber-700 stroke-[2.2]" />
    </div>
    <h2 class="text-lg font-bold font-magical text-amber-950 mb-2">
      TED 魔法精讲
    </h2>
    <p class="text-base text-stone-600 leading-relaxed max-w-sm mb-4">
      每期精选 TED 演讲，配词汇预热、精看任务与跟读评测，助你突破 B1 英语瓶颈。
    </p>
    <p class="text-sm text-stone-400">
      即将开放 · 敬请期待
    </p>
  </div>

  <!-- Three-Device Orchestrator View -->
  <div
    v-else
    class="h-full w-full flex flex-col lg:flex-row bg-[#fbf9f5] overflow-hidden select-none"
    role="region"
    aria-label="TED 学习工坊"
  >
    <!-- Desktop talk list sidebar (hidden below lg) -->
    <TedTalkList class="hidden lg:flex w-60 shrink-0 h-full border-r border-[#e8ddd0]" />

    <!-- Mobile / Tablet Talk Drawer Trigger Bar (hidden on lg) -->
    <div class="lg:hidden flex items-center justify-between px-4 py-2 bg-[#fbf9f5] border-b border-[#e8ddd0]/60 shrink-0">
      <button
        type="button"
        @click="isTalkDrawerOpen = true"
        class="min-h-[44px] px-3 py-1.5 rounded-xl border border-amber-300/80 bg-amber-500/10 text-amber-950 font-bold text-xs flex items-center gap-2 hover:bg-amber-500/20 active:scale-95 transition-all touch-manipulation cursor-pointer"
        aria-label="打开演讲目录"
      >
        <List class="w-4 h-4 text-amber-700" aria-hidden="true" />
        <span class="truncate max-w-[180px] sm:max-w-xs">{{ tedStore.currentTalk?.title || '选择 TED 演说' }}</span>
        <ChevronDown class="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
      </button>

      <span
        v-if="tedStore.currentTalk?.cefrLevel"
        class="text-xs font-mono border rounded px-1.5 py-0.5 border-amber-300 bg-amber-50 text-amber-800 shrink-0"
      >
        {{ tedStore.currentTalk.cefrLevel }}
      </span>
    </div>

    <!-- Mobile & Tablet Slide-over Drawer -->
    <div
      v-if="isTalkDrawerOpen"
      class="fixed inset-0 z-50 flex lg:hidden bg-stone-900/40 backdrop-blur-xs outline-none"
      tabindex="-1"
      @keydown.esc="isTalkDrawerOpen = false"
      @click.self="isTalkDrawerOpen = false"
    >
      <div class="w-4/5 max-w-xs h-full bg-[#fbf9f5] shadow-xl flex flex-col border-r border-[#e8ddd0]">
        <div class="p-3 border-b border-[#e8ddd0] flex items-center justify-between shrink-0">
          <span class="text-xs font-bold text-amber-950 font-magical">TED 演说目录</span>
          <button
            type="button"
            @click="isTalkDrawerOpen = false"
            class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors"
            aria-label="关闭"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <TedTalkList class="flex-1 w-full border-r-0" />
      </div>
    </div>

    <!-- Main Learning Stage -->
    <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
      <!-- Four-step progress bar -->
      <TedStepBar class="shrink-0" />

      <!-- Step Views Routing -->
      <div class="flex-1 overflow-y-auto">
        <TedVocabPreload v-if="tedStore.currentStep === 1" />
        <TedVideoPlayer v-else-if="tedStore.currentStep === 2" />
        <TedTaskStudio v-else-if="tedStore.currentStep === 3" />
        <TedShadowing v-else-if="tedStore.currentStep === 4" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Video, List, ChevronDown, X } from 'lucide-vue-next'
import { useTedStore } from '../../stores/tedStore.js'
import { useNavigationStore } from '../../stores/navigationStore.js'
import TedTalkList from './TedTalkList.vue'
import TedStepBar from './TedStepBar.vue'
import TedVocabPreload from './TedVocabPreload.vue'
import TedVideoPlayer from './TedVideoPlayer.vue'
import TedTaskStudio from './TedTaskStudio.vue'
import TedShadowing from './TedShadowing.vue'

const tedStore = useTedStore()
const navStore = useNavigationStore()
const isTalkDrawerOpen = ref(false)

onMounted(() => {
  if (tedStore.talks && tedStore.talks.length > 0 && !tedStore.selectedTalkId) {
    tedStore.selectTalk(tedStore.talks[0].id)
  }
})

watch(() => tedStore.selectedTalkId, () => {
  isTalkDrawerOpen.value = false
})
</script>
