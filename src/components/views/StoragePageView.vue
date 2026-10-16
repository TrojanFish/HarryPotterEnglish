<template>
  <div class="flex-1 min-h-0 overflow-y-auto bg-[#fbf9f5] p-4 sm:p-6 lg:p-8 space-y-6 select-none font-sans">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8ddd0] pb-5">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0">
          <HardDrive class="w-5 h-5" />
        </div>
        <div>
          <h1 class="font-serif text-xl sm:text-2xl font-bold text-stone-900">
            离线音频与存储管理
          </h1>
          <p class="text-xs text-stone-500 font-reading mt-0.5">
            本地优先存储 · 离线音频预载 · 0ms 闪电秒开与零流量研习
          </p>
        </div>
      </div>

      <button
        type="button"
        @click="refreshStorage"
        class="min-h-[44px] px-3.5 py-2 bg-white hover:bg-[#faf6ee] border border-[#e8ddd0] text-stone-800 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer touch-manipulation self-start sm:self-auto"
      >
        <RefreshCw class="w-4 h-4 text-amber-700" />
        <span>刷新存储占用</span>
      </button>
    </div>

    <!-- Storage Quota Status Card -->
    <div class="p-6 bg-white border border-[#e8ddd0] rounded-2xl space-y-3 shadow-none">
      <div class="flex items-center justify-between text-xs">
        <span class="font-medium text-stone-700">浏览器 IndexedDB 离线存储配额</span>
        <span class="font-mono text-stone-500">
          {{ formatBytes(storageInfo.usedBytes) }} / {{ formatBytes(storageInfo.quotaBytes) }}
        </span>
      </div>

      <!-- Storage Bar -->
      <div class="w-full h-3 bg-[#e8ddd0] rounded-full overflow-hidden">
        <div
          class="h-full bg-amber-700 rounded-full transition-all duration-300"
          :style="{ width: `${quotaPercent}%` }"
        ></div>
      </div>

      <div class="flex items-center justify-between text-[11px] text-stone-400 font-mono">
        <span>当前占用 {{ quotaPercent.toFixed(1) }}%</span>
        <span>最大支持 2.0 GB 离线原版音频</span>
      </div>
    </div>

    <!-- Cached Chapters List -->
    <div class="p-6 bg-white border border-[#e8ddd0] rounded-2xl space-y-4 shadow-none">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-serif text-base font-bold text-stone-900">
            已缓存章节 ({{ storageInfo.chapters?.length || 0 }})
          </h2>
          <p class="text-xs text-stone-500 mt-0.5">
            已下载音频与同步字幕，断网状态下仍可完整精听、影子跟读与听写
          </p>
        </div>
      </div>

      <div v-if="!storageInfo.chapters || storageInfo.chapters.length === 0" class="text-center py-12 text-xs text-stone-400 bg-[#faf6ee]/50 rounded-xl border border-[#e8ddd0]">
        暂无离线章节，点击下方章节卡片即可快速预下载
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="ch in storageInfo.chapters"
          :key="ch.chapterId"
          class="p-4 bg-[#fbf9f5] border border-[#e8ddd0] rounded-xl flex items-center justify-between gap-3 text-stone-900"
        >
          <div class="min-w-0">
            <h3 class="text-xs font-serif font-bold text-stone-900 truncate">
              {{ ch.title || `Chapter ${ch.chapterId}` }}
            </h3>
            <div class="flex items-center gap-2 mt-1 text-[11px] font-mono text-stone-500">
              <span>{{ formatBytes(ch.size) }}</span>
              <span>·</span>
              <span>{{ new Date(ch.cachedAt).toLocaleDateString() }}</span>
            </div>
          </div>

          <button
            type="button"
            @click="removeCached(ch.chapterId)"
            class="min-h-[44px] min-w-[44px] p-2 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
            title="移除离线缓存"
            aria-label="移除离线缓存"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Available Book Chapters for Download -->
    <div class="p-6 bg-white border border-[#e8ddd0] rounded-2xl space-y-4 shadow-none">
      <div>
        <h2 class="font-serif text-base font-bold text-stone-900">
          《哈利·波特》全书章节离线预载 ({{ availableChapters.length }} 章节)
        </h2>
        <p class="text-xs text-stone-500 mt-0.5">
          一键预载至本地，通勤地铁零卡顿流畅研读
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div
          v-for="ch in availableChapters"
          :key="ch.id"
          class="p-4 bg-[#fbf9f5] border border-[#e8ddd0] rounded-xl flex items-center justify-between gap-3 text-stone-900"
        >
          <div class="min-w-0">
            <h3 class="text-xs font-serif font-medium text-stone-900 truncate">
              {{ ch.title }}
            </h3>
            <p v-if="ch.cnTitle" class="text-[11px] text-stone-500 truncate mt-0.5">
              {{ ch.cnTitle }}
            </p>
          </div>

          <div class="shrink-0 flex items-center gap-2">
            <span
              v-if="isChapterCached(ch.id)"
              class="px-2.5 py-1 text-[11px] font-mono font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1"
            >
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-700" />
              <span>已离线</span>
            </span>

            <span
              v-else-if="downloadingMap[ch.id] !== undefined"
              class="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-amber-900 bg-amber-100 border border-amber-300 rounded-lg min-h-[44px]"
            >
              <Loader2 class="w-4 h-4 text-amber-700 animate-spin" />
              <span>下载中</span>
            </span>

            <button
              v-else
              type="button"
              @click="downloadChapter(ch)"
              class="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-white hover:bg-amber-50 active:scale-95 text-xs font-medium text-stone-800 border border-[#e8ddd0] rounded-lg flex items-center gap-1.5 transition-all cursor-pointer touch-manipulation"
              title="下载至本地"
              aria-label="下载至本地"
            >
              <Download class="w-4 h-4 text-amber-700" />
              <span>下载</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCatalogStore, resolveAudioStreamUrl, resolveSubtitleUrl } from '../../stores/catalogStore.js'
import {
  getOfflineStorageInfo,
  saveChapterOffline,
  deleteCachedChapter
} from '../../utils/offlineStorage.js'
import {
  HardDrive,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
  RefreshCw
} from 'lucide-vue-next'

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

    const [audioRes, vttRes] = await Promise.all([
      fetch(audioUrl),
      fetch(vttUrl)
    ])

    if (!audioRes.ok || !vttRes.ok) {
      throw new Error('下载音频或字幕文件失败')
    }

    const audioBlob = await audioRes.blob()
    const vttText = await vttRes.text()

    await saveChapterOffline({
      chapterId: ch.id,
      title: ch.title,
      audioBlob,
      vttText
    })

    await refreshStorage()
  } catch (err) {
    console.error('[StoragePage] Download error:', err)
  } finally {
    delete downloadingMap.value[ch.id]
  }
}

async function removeCached(id) {
  try {
    await deleteCachedChapter(id)
    await refreshStorage()
  } catch (err) {
    console.error('[StoragePage] Remove cache error:', err)
  }
}

onMounted(() => {
  refreshStorage()
})
</script>
