<template>
  <aside
    class="overflow-y-auto flex flex-col bg-[#fbf9f5] border-r border-[#e8ddd0] select-none"
    role="region"
    aria-label="TED 演讲列表"
  >
    <!-- Header / Title -->
    <div class="p-3.5 border-b border-[#e8ddd0] flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2 min-w-0">
        <h3 class="text-sm font-bold font-magical text-amber-950 tracking-wider truncate">
          TED 演讲精选
        </h3>
        <span class="text-xs text-stone-500 font-mono shrink-0">
          {{ tedStore.talks.length }} 篇
        </span>
      </div>
      <div class="flex items-center gap-1">
        <button
          type="button"
          @click="refreshTalks"
          class="min-h-[44px] min-w-[44px] p-2 rounded-xl text-stone-500 hover:text-amber-800 hover:bg-amber-100/50 transition-colors flex items-center justify-center touch-manipulation cursor-pointer"
          :title="tedStore.isLoadingTalks ? '正在识别R2视频...' : '刷新R2视频目录'"
          :aria-label="tedStore.isLoadingTalks ? '正在识别R2视频...' : '刷新R2视频目录'"
        >
          <RotateCw
            class="w-3.5 h-3.5"
            :class="{ 'animate-spin text-amber-700': tedStore.isLoadingTalks }"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          @click="$emit('toggle-collapse')"
          class="hidden lg:flex min-h-[44px] min-w-[44px] p-2 rounded-xl text-stone-500 hover:text-amber-800 hover:bg-amber-100/50 transition-colors items-center justify-center touch-manipulation cursor-pointer"
          title="折叠目录"
          aria-label="折叠目录"
        >
          <PanelLeftClose class="w-4 h-4 text-stone-600" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Empty State in List -->
    <div
      v-if="tedStore.talks.length === 0"
      class="p-6 text-center text-stone-400 text-xs flex flex-col items-center justify-center gap-2"
    >
      <VideoOff class="w-8 h-8 text-stone-300 stroke-[1.5]" aria-hidden="true" />
      <span>R2 存储桶中暂未发现视频文件</span>
    </div>

    <!-- Talks List -->
    <ul
      v-else
      class="flex flex-col divide-y divide-[#e8ddd0]/60"
      role="list"
    >
      <li
        v-for="talk in tedStore.talks"
        :key="talk.id"
        class="w-full"
      >
        <button
          type="button"
          @click="selectTalk(talk.id)"
          class="w-full text-left px-4 py-3 min-h-[44px] touch-manipulation transition-colors duration-150 flex flex-col gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
          :class="[
            isSelected(talk.id)
              ? 'bg-amber-500/10 border-l-4 border-amber-500'
              : 'border-l-4 border-transparent hover:bg-stone-100/60'
          ]"
          :aria-current="isSelected(talk.id) ? 'true' : undefined"
          :aria-label="`${talk.title} - ${talk.speaker}`"
        >
          <!-- Top Row: Speaker & Badges (CEFR, Duration, Completed) -->
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs text-stone-400 truncate">
              {{ talk.speaker }}
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
              <!-- CEFR Level Badge -->
              <span
                class="text-xs font-mono border rounded px-1 border-amber-300 bg-amber-50 text-amber-800"
              >
                {{ talk.cefrLevel }}
              </span>

              <!-- Duration -->
              <span class="text-xs text-stone-400 font-mono flex items-center gap-0.5">
                <Clock class="w-3 h-3 text-stone-400" aria-hidden="true" />
                {{ formatDuration(talk.durationSeconds) }}
              </span>

              <!-- Completed Checkmark -->
              <CheckCircle2
                v-if="isCompleted(talk.id)"
                class="w-4 h-4 text-emerald-600 stroke-[2.2]"
                aria-label="已完成"
              />
            </div>
          </div>

          <!-- Title: English + Chinese -->
          <div class="text-sm font-bold text-amber-950 line-clamp-2">
            {{ talk.title }}
          </div>
          <div
            v-if="talk.titleCn"
            class="text-xs text-stone-500 line-clamp-1"
          >
            {{ talk.titleCn }}
          </div>
        </button>
      </li>
    </ul>
  </aside>
</template>

<script setup>
import { CheckCircle2, Clock, RotateCw, VideoOff, PanelLeftClose } from 'lucide-vue-next'
import { useTedStore } from '../../stores/tedStore.js'

defineEmits(['toggle-collapse'])

const tedStore = useTedStore()

function isSelected(id) {
  return tedStore.selectedTalkId === id
}

function isCompleted(id) {
  return Array.isArray(tedStore.completedTalkIds) && tedStore.completedTalkIds.includes(id)
}

function selectTalk(id) {
  tedStore.selectTalk(id)
}

function refreshTalks() {
  tedStore.fetchRemoteTalks()
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}
</script>
