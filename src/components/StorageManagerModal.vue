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
        aria-label="离线行囊与存储管理"
      >
        <div
          class="bg-[#fbf9f5] border border-[#e8ddd0] rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="px-5 py-4 border-b border-[#e8ddd0] flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center text-[#d97706]">
                <HardDrive class="w-4 h-4" />
              </div>
              <h2 class="font-serif text-base font-semibold text-[#1e1610]">
                离线行囊 · 本地存储
              </h2>
            </div>

            <button
              type="button"
              @click="$emit('close')"
              class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] flex items-center justify-center transition-colors"
              aria-label="关闭存储管理"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-5 space-y-4">
            <!-- Quota Bar -->
            <div class="p-4 bg-white/70 border border-[#e8ddd0] rounded-xl space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-[#1e1610]">已占用空间</span>
                <span class="font-mono text-[#78695d]">{{ formatBytes(storageInfo.usedBytes) }} / {{ formatBytes(storageInfo.quotaBytes) }}</span>
              </div>
              <div class="w-full h-2 bg-[#e8ddd0] rounded-full overflow-hidden">
                <div
                  class="h-full bg-[#d97706] rounded-full transition-all"
                  :style="{ width: `${quotaPercent}%` }"
                ></div>
              </div>
              <p class="text-[11px] text-[#a89a8c]">
                基于 IndexedDB 本地沙箱存储，断网离线 0ms 纯本地秒开，免除流量消耗。
              </p>
            </div>

            <!-- Cached Chapters List -->
            <div class="space-y-2">
              <h3 class="text-xs font-semibold text-[#78695d] uppercase tracking-wider">
                已离线章节 ({{ storageInfo.chapters?.length || 0 }})
              </h3>

              <div v-if="!storageInfo.chapters || storageInfo.chapters.length === 0" class="text-center py-8 text-xs text-[#a89a8c] bg-[#f4ebe1]/40 rounded-xl border border-[#e8ddd0]">
                暂无离线章节。可在有 Wi-Fi 时缓存音频与字幕。
              </div>

              <div
                v-for="ch in storageInfo.chapters"
                :key="ch.chapterId"
                class="p-3 bg-white/70 border border-[#e8ddd0] rounded-xl flex items-center justify-between gap-3"
              >
                <div>
                  <h4 class="text-xs font-semibold text-[#1e1610]">
                    {{ ch.title || ch.chapterId }}
                  </h4>
                  <span class="text-[10px] text-[#a89a8c] font-mono">
                    {{ formatBytes(ch.totalBytes) }}
                  </span>
                </div>

                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    @click="deleteChapter(ch.chapterId)"
                    class="min-h-[44px] min-w-[44px] p-2 text-rose-700 hover:bg-rose-50 rounded-lg flex items-center justify-center transition-colors"
                    aria-label="删除离线缓存"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getOfflineStorageInfo, deleteCachedChapter } from '../utils/offlineStorage.js'
import { HardDrive, X, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const storageInfo = ref({
  usedBytes: 0,
  quotaBytes: 2 * 1024 * 1024 * 1024,
  chapters: []
})

const quotaPercent = computed(() => {
  if (!storageInfo.value.quotaBytes) return 0
  return Math.min(100, (storageInfo.value.usedBytes / storageInfo.value.quotaBytes) * 100)
})

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

async function refreshStorage() {
  try {
    const info = await getOfflineStorageInfo()
    if (info) storageInfo.value = info
  } catch (e) {
    console.warn('[StorageManager] Query warning:', e)
  }
}

async function deleteChapter(id) {
  try {
    await deleteCachedChapter(id)
    await refreshStorage()
  } catch (e) {
    console.warn('[StorageManager] Delete warning:', e)
  }
}

onMounted(() => {
  refreshStorage()
})
</script>
