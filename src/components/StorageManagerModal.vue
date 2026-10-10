<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden">
      <!-- Backdrop -->
      <Transition
        appear
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm"
          @click="$emit('close')"
          aria-hidden="true"
        ></div>
      </Transition>

      <!-- Bottom Sheet Modal Container -->
      <div
        class="fixed inset-0 pointer-events-none flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <Transition
          appear
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="translate-y-full sm:translate-y-4 opacity-0 sm:opacity-0"
          enter-to-class="translate-y-0 opacity-100 sm:opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-full sm:translate-y-4 opacity-0"
        >
          <div
            v-if="isOpen"
            class="pointer-events-auto bg-[#f8f8f6] border-t border-x sm:border border-[#e4e4e7] rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:pb-0"
            :style="sheetStyle"
            @click.stop
            role="dialog"
            aria-modal="true"
            aria-label="离线行囊与存储管理"
          >
            <!-- Pull Handle (Mobile only) -->
            <div
              class="pt-3 pb-1 sm:hidden flex justify-center cursor-grab active:cursor-grabbing touch-none shrink-0"
              @touchstart="onTouchStart"
              @touchmove="handleDragTouchMove"
              @touchend="onTouchEnd"
            >
              <div class="w-10 h-1.5 rounded-full bg-stone-300"></div>
            </div>

            <!-- Header -->
            <div
              class="px-5 py-3 sm:py-4 border-b border-[#e4e4e7] bg-white flex items-center justify-between shrink-0 select-none touch-none"
              @touchstart="onTouchStart"
              @touchmove="handleDragTouchMove"
              @touchend="onTouchEnd"
            >
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563eb]">
                  <HardDrive class="w-4 h-4" />
                </div>
                <h2 class="font-serif text-base font-semibold text-[#18181b]">
                  离线行囊 · 本地存储
                </h2>
              </div>

              <button
                type="button"
                @click="$emit('close')"
                class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="关闭存储管理"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Content -->
            <div
              ref="scrollContainerRef"
              class="flex-1 overflow-y-auto p-5 space-y-4 ios-scroll"
              @touchstart="onTouchStart"
              @touchmove="handleContentTouchMove"
              @touchend="onTouchEnd"
            >
            <!-- Quota Bar -->
            <div class="p-4 bg-white border border-[#e4e4e7] rounded-xl space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-[#18181b]">已占用空间</span>
                <span class="font-mono text-[#71717a]">{{ formatBytes(storageInfo.usedBytes) }} / {{ formatBytes(storageInfo.quotaBytes) }}</span>
              </div>
              <div class="w-full h-2 bg-[#f4f4f5] rounded-full overflow-hidden">
                <div
                  class="h-full bg-[#2563eb] rounded-full transition-all"
                  :style="{ width: `${quotaPercent}%` }"
                ></div>
              </div>
              <p class="text-[11px] text-[#a1a1aa]">
                基于 IndexedDB 本地沙箱存储，断网离线 0ms 纯本地秒开，免除流量消耗。
              </p>
            </div>

            <!-- Cached Chapters List -->
            <div class="space-y-2">
              <h3 class="text-xs font-semibold text-[#71717a] uppercase tracking-wider">
                已离线章节 ({{ storageInfo.chapters?.length || 0 }})
              </h3>

              <div v-if="!storageInfo.chapters || storageInfo.chapters.length === 0" class="text-center py-8 text-xs text-[#a1a1aa] bg-white rounded-xl border border-[#e4e4e7]">
                暂无离线章节。可在有 Wi-Fi 时缓存音频与字幕。
              </div>

              <div
                v-for="ch in storageInfo.chapters"
                :key="ch.chapterId"
                class="p-3 bg-white border border-[#e4e4e7] rounded-xl flex items-center justify-between gap-3"
              >
                <div>
                  <h4 class="text-xs font-semibold text-[#18181b]">
                    {{ ch.title || ch.chapterId }}
                  </h4>
                  <span class="text-[10px] text-[#a1a1aa] font-mono">
                    {{ formatBytes(ch.totalBytes) }}
                  </span>
                </div>

                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    @click="deleteChapter(ch.chapterId)"
                    class="min-h-[44px] min-w-[44px] p-2 text-rose-700 hover:bg-rose-50 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="删除离线缓存"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Available Downloadable Chapters List -->
            <div class="space-y-2 pt-2 border-t border-[#e4e4e7]">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-semibold text-[#71717a] uppercase tracking-wider">
                  可下载章节 ({{ availableChapters.length }})
                </h3>
                <span class="text-[11px] text-[#a1a1aa] font-serif">
                  {{ catalogStore.currentBook?.title || '当前书籍' }}
                </span>
              </div>

              <div
                v-if="availableChapters.length === 0"
                class="text-center py-6 text-xs text-[#a1a1aa] bg-white rounded-xl border border-[#e4e4e7]"
              >
                暂无可下载章节。
              </div>

              <div
                v-for="ch in availableChapters"
                :key="ch.id"
                class="p-3 bg-white border border-[#e4e4e7] rounded-xl flex items-center justify-between gap-3"
              >
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-semibold text-[#18181b] truncate">
                    {{ ch.title || ch.id }}
                  </h4>
                  <span class="text-[10px] text-[#a1a1aa] font-mono">
                    {{ ch.duration ? `${Math.round(ch.duration / 60)} 分钟` : '标准原版' }}
                  </span>
                </div>

                <div class="shrink-0 flex items-center">
                  <!-- Already downloaded badge -->
                  <div
                    v-if="isChapterCached(ch.id)"
                    class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg min-h-[44px]"
                  >
                    <CheckCircle2 class="w-4 h-4 text-emerald-600" />
                    <span>已下载</span>
                  </div>

                  <!-- Downloading progress spinner -->
                  <div
                    v-else-if="downloadingMap[ch.id] !== undefined"
                    class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-blue-50 border border-blue-200 rounded-lg min-h-[44px]"
                  >
                    <Loader2 class="w-4 h-4 text-[#2563eb] animate-spin" />
                    <span class="font-mono">{{ downloadingMap[ch.id] }}%</span>
                  </div>

                  <!-- Download button -->
                  <button
                    v-else
                    type="button"
                    @click="downloadChapter(ch)"
                    class="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-[#f8f8f6] hover:bg-[#f4f4f5] active:scale-95 text-xs font-medium text-[#18181b] border border-[#e4e4e7] rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    :aria-label="`下载章节 ${ch.title || ch.id}`"
                  >
                    <Download class="w-4 h-4 text-[#2563eb]" />
                    <span>下载</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCatalogStore, resolveAudioStreamUrl, resolveSubtitleUrl } from '../stores/catalogStore.js'
import {
  getOfflineStorageInfo,
  deleteCachedChapter,
  saveChapterOffline
} from '../utils/offlineStorage.js'
import { useBottomSheet } from '../composables/useBottomSheet.js'
import {
  HardDrive,
  X,
  Trash2,
  Download,
  CheckCircle2,
  Loader2
} from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const scrollContainerRef = ref(null)

const {
  sheetStyle,
  onTouchStart,
  onTouchMove,
  onTouchEnd
} = useBottomSheet({
  threshold: 80,
  onClose: () => emit('close')
})

function handleDragTouchMove(e) {
  onTouchMove(e, 0)
}

function handleContentTouchMove(e) {
  const st = scrollContainerRef.value ? scrollContainerRef.value.scrollTop : 0
  onTouchMove(e, st)
}

const catalogStore = useCatalogStore()

const storageInfo = ref({
  usedBytes: 0,
  quotaBytes: 2 * 1024 * 1024 * 1024,
  chapters: []
})

const downloadingMap = ref({})

const quotaPercent = computed(() => {
  if (!storageInfo.value.quotaBytes) return 0
  return Math.min(100, (storageInfo.value.usedBytes / storageInfo.value.quotaBytes) * 100)
})

const availableChapters = computed(() => {
  return catalogStore.currentBook?.chapters || []
})

function isChapterCached(id) {
  return storageInfo.value.chapters?.some((c) => c.chapterId === id) || false
}

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

async function downloadChapter(ch) {
  if (downloadingMap.value[ch.id] !== undefined) return
  downloadingMap.value[ch.id] = 0
  try {
    const audioUrl =
      (ch.id === catalogStore.selectedChapterId ? catalogStore.audioUrl : '') ||
      resolveAudioStreamUrl(
        ch.audioKey ||
          `podcasts/${catalogStore.currentBook?.id || 'hp-book-1'}/episodes/${ch.epId || 'ep01'}/audio.mp3`
      ) ||
      catalogStore.audioUrl

    const vttUrl =
      (ch.id === catalogStore.selectedChapterId ? catalogStore.subtitleUrl : '') ||
      resolveSubtitleUrl(
        ch.subtitleKey ||
          `podcasts/${catalogStore.currentBook?.id || 'hp-book-1'}/episodes/${ch.epId || 'ep01'}/subtitle.vtt`
      ) ||
      catalogStore.subtitleUrl

    await saveChapterOffline(
      {
        chapterId: ch.id,
        title: ch.title,
        audioUrl,
        vttUrl
      },
      (progressInfo) => {
        const p = typeof progressInfo === 'number' ? progressInfo : (progressInfo?.progress || 0)
        downloadingMap.value[ch.id] = Math.round(p)
      }
    )
    await refreshStorage()
  } catch (err) {
    console.warn('[StorageManager] Download chapter warning:', err)
  } finally {
    delete downloadingMap.value[ch.id]
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
