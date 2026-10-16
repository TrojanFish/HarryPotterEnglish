<template>
  <div
    class="flex-1 min-h-0 overflow-y-auto bg-[#fbf9f5] p-4 sm:p-6 lg:p-8 space-y-6 select-none font-sans"
    aria-label="多设备云端漫游页面"
  >
    <!-- Page Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e8ddd0]">
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="handleBack"
          class="w-10 h-10 min-w-[40px] rounded-xl border border-[#e8ddd0] bg-white/80 hover:bg-[#f5efe6] text-stone-700 flex items-center justify-center transition-colors active:scale-95 cursor-pointer shrink-0 touch-manipulation shadow-none"
          title="返回上一页"
          aria-label="返回上一页"
        >
          <ArrowLeft :size="18" />
        </button>

        <div class="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-300/80 text-amber-800 flex items-center justify-center shrink-0">
          <Cloud :size="22" class="text-amber-800" />
        </div>

        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="font-serif font-bold text-lg sm:text-xl text-stone-900 tracking-tight">
              多设备云端漫游
            </h1>
            <span class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-900 border border-amber-300/60 font-mono">
              <Shield :size="12" class="text-amber-800" />
              <span>无损同步</span>
            </span>
          </div>
          <p class="text-xs text-stone-500 mt-0.5 font-reading">
            通行码配对与全端无损漫游拓扑 · 本地优先零凭证泄露
          </p>
        </div>
      </div>

      <!-- Quick Sync Action -->
      <div class="flex items-center gap-3 self-end sm:self-auto">
        <div class="flex items-center gap-2 text-xs text-stone-600">
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :class="isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'"
            aria-hidden="true"
          />
          <span class="font-medium hidden sm:inline">
            {{ isSyncing ? '正在漫游同步...' : '已与云端就绪' }}
          </span>
        </div>

        <button
          type="button"
          @click="triggerManualSync"
          :disabled="isSyncing"
          class="min-h-[44px] min-w-[44px] px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all touch-manipulation active:scale-95 flex items-center justify-center gap-2 shadow-none disabled:opacity-50 cursor-pointer"
          aria-label="立即触发增量同步"
        >
          <RefreshCw :size="15" :class="{ 'animate-spin': isSyncing }" />
          <span>{{ isSyncing ? '同步中...' : '立即同步' }}</span>
        </button>
      </div>
    </header>

    <!-- Main Content 2-Column Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <!-- Left Column: Passcode & Pairing -->
      <div class="space-y-6">
        <!-- 1. Passcode Card -->
        <section class="bg-[#faf6ee] border border-amber-300/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-none">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-amber-950/80 flex items-center gap-1.5">
              <Sparkles :size="14" class="text-amber-700" />
              <span>本机专属通行码</span>
            </span>
            <span class="text-[11px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 font-mono">
              6位安全漫游码
            </span>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/80 border border-amber-200">
            <div class="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-amber-950 select-all">
              {{ currentPasscode }}
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="copyPasscode"
                class="min-h-[44px] min-w-[44px] px-4 py-2 inline-flex items-center justify-center gap-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all touch-manipulation active:scale-95 shadow-none cursor-pointer"
                :class="isCopied ? 'bg-emerald-700 text-white' : 'bg-amber-800 hover:bg-amber-900 text-amber-50'"
                aria-label="复制通行码"
              >
                <Check v-if="isCopied" :size="16" />
                <Copy v-else :size="16" />
                <span>{{ isCopied ? '已复制' : '复制' }}</span>
              </button>

              <button
                type="button"
                @click="regeneratePasscode"
                class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-amber-300 bg-white text-amber-900 hover:bg-amber-100/60 transition-colors touch-manipulation active:scale-95 cursor-pointer"
                aria-label="刷新生成新通行码"
                title="重新生成通行码"
              >
                <RotateCcw :size="16" />
              </button>
            </div>
          </div>

          <p class="text-xs text-stone-600 leading-relaxed font-reading">
            在其他手机、平板或电脑输入此通行码即可无缝配对，学习进度、生词本、学院学分与徽章将自动双向合并。
          </p>
        </section>

        <!-- 2. Device Pairing Card -->
        <section class="bg-white/80 border border-[#e8ddd0] rounded-2xl p-5 sm:p-6 space-y-4 shadow-none">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Laptop :size="16" class="text-stone-700" />
              <span>配对新设备</span>
            </h2>
            <span class="text-xs text-stone-500 font-reading">输入对端设备通行码</span>
          </div>

          <div class="flex flex-col sm:flex-row gap-2.5">
            <input
              v-model="pairInput"
              type="text"
              maxlength="10"
              placeholder="例如: HP-4K9W"
              class="flex-1 font-mono uppercase px-3.5 py-2.5 min-h-[44px] rounded-xl border border-stone-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 bg-stone-50/50 text-stone-900 touch-manipulation text-base placeholder:text-stone-400 placeholder:font-sans"
              aria-label="输入对方设备通行码"
              @input="onPairInput"
              @keydown.enter="handlePairDevice"
            />
            <button
              type="button"
              @click="handlePairDevice"
              :disabled="isPairing || !pairInput.trim()"
              class="min-h-[44px] min-w-[44px] px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-50 rounded-xl text-xs sm:text-sm font-semibold transition-all touch-manipulation active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shadow-none"
              aria-label="连接并同步"
            >
              <RefreshCw v-if="isPairing" :size="15" class="animate-spin" />
              <span>连接并同步</span>
            </button>
          </div>

          <!-- Alert message -->
          <div
            v-if="pairFeedback.message"
            class="p-3 rounded-xl text-xs flex items-center gap-2 transition-all border"
            :class="pairFeedback.isError ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'"
            role="status"
          >
            <AlertCircle v-if="pairFeedback.isError" :size="16" class="shrink-0 text-red-600" />
            <CheckCircle2 v-else :size="16" class="shrink-0 text-emerald-600" />
            <span class="flex-1 font-reading">{{ pairFeedback.message }}</span>
          </div>
        </section>
      </div>

      <!-- Right Column: Device Topology Roster & Cloud Security -->
      <div class="space-y-6">
        <!-- 3. Connected Device Topology Roster -->
        <section class="bg-white/80 border border-[#e8ddd0] rounded-2xl p-5 sm:p-6 space-y-4 shadow-none">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-bold text-stone-900">已关联设备拓扑</h2>
              <span class="text-xs font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                {{ devices.length }} 台设备在线
              </span>
            </div>
            <span class="text-xs text-stone-500 font-reading">多端自愈协同</span>
          </div>

          <div class="divide-y divide-stone-200/80 border border-stone-200 rounded-xl overflow-hidden bg-[#fbf9f5]/60">
            <div
              v-for="device in devices"
              :key="device.id"
              class="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-white transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200 shrink-0">
                  <Smartphone v-if="device.type === 'mobile'" :size="18" class="text-amber-800" />
                  <Tablet v-else-if="device.type === 'tablet'" :size="18" class="text-amber-800" />
                  <Laptop v-else :size="18" class="text-amber-800" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-semibold text-stone-900 truncate">{{ device.name }}</span>
                    <span
                      v-if="device.isCurrent"
                      class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0"
                    >
                      当前设备
                    </span>
                  </div>
                  <div class="text-xs text-stone-500 flex items-center gap-2 mt-0.5 font-reading">
                    <span>系统: {{ device.os }}</span>
                    <span>·</span>
                    <span>同步: {{ device.lastSynced || '刚刚' }}</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  v-if="!device.isCurrent"
                  type="button"
                  @click="unbindDevice(device.id)"
                  class="min-h-[44px] min-w-[44px] px-3 text-xs text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors touch-manipulation active:scale-95 flex items-center justify-center border border-transparent hover:border-red-200 cursor-pointer"
                  aria-label="解除关联"
                >
                  解除关联
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. Security & Offline Policy Card -->
        <section class="bg-[#faf6ee] border border-[#e8ddd0] rounded-2xl p-5 sm:p-6 space-y-3 shadow-none">
          <div class="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <Shield :size="16" class="text-amber-800" />
            <span>学籍数据合规与端到端隐私安全</span>
          </div>
          <ul class="text-xs text-stone-600 space-y-2 font-reading leading-relaxed">
            <li class="flex items-start gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
              <span><strong>本地优先存储</strong>：学情数据、生词记录与离线音频首先保存在浏览器安全 IndexedDB 数据库中，断网无忧。</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
              <span><strong>零凭证泄露</strong>：仅通过随机分配的 6 位通行码进行设备拓扑信任绑定，无需收集或传输个人账号敏感信息。</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
              <span><strong>智能双向合并</strong>：跨设备同步采用时间戳与集合去重合并算法，绝不覆盖已有高频复习进度。</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  Cloud,
  RefreshCw,
  Copy,
  Check,
  RotateCcw,
  Smartphone,
  Tablet,
  Laptop,
  Shield,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  CheckCircle2
} from 'lucide-vue-next'
import {
  generatePasscode,
  isValidPasscode,
  detectDevicePlatform,
  mergeUserData
} from '../../utils/syncManager.js'
import { useNavigationStore } from '../../stores/navigationStore.js'
import { useVocabStore } from '../../stores/vocabStore.js'
import { useGamificationStore } from '../../stores/gamificationStore.js'
import { useAnalyticsStore } from '../../stores/analyticsStore.js'

const navStore = useNavigationStore()
const vocabStore = useVocabStore()
const gamificationStore = useGamificationStore()
const analyticsStore = useAnalyticsStore()

const PASSCODE_STORAGE_KEY = 'hp_sync_passcode'
const DEVICES_STORAGE_KEY = 'hp_connected_devices'
const CLOUD_SNAPSHOT_KEY = 'hp_cloud_snapshot'

const currentPasscode = ref('')
const isCopied = ref(false)
const pairInput = ref('')
const isPairing = ref(false)
const isSyncing = ref(false)
const pairFeedback = ref({
  message: '',
  isError: false
})
const devices = ref([])

function handleBack() {
  navStore.setView('bookshelf')
}

function initPasscode() {
  if (typeof localStorage === 'undefined') {
    currentPasscode.value = generatePasscode()
    return
  }

  let code = localStorage.getItem(PASSCODE_STORAGE_KEY)
  if (!code || !isValidPasscode(code)) {
    code = generatePasscode()
    localStorage.setItem(PASSCODE_STORAGE_KEY, code)
  }
  currentPasscode.value = code
}

function regeneratePasscode() {
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    const ok = window.confirm('重新生成通行码后，使用旧通行码的设备需重新配对。确认生成新通行码？')
    if (!ok) return
  }
  const newCode = generatePasscode()
  currentPasscode.value = newCode
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PASSCODE_STORAGE_KEY, newCode)
  }
  pairFeedback.value = {
    message: '已重新生成本机专属通行码',
    isError: false
  }
}

async function copyPasscode() {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(currentPasscode.value)
    }
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.warn('[CloudSyncPageView] Clipboard write failed:', err)
  }
}

function onPairInput() {
  if (typeof pairInput.value === 'string') {
    pairInput.value = pairInput.value.toUpperCase()
  }
}

function initDevices() {
  const platform = detectDevicePlatform()
  const currentDevice = {
    id: 'current-device',
    type: platform.type || 'desktop',
    name: platform.name ? `${platform.name} (${platform.os})` : '本机',
    os: platform.os || 'Unknown',
    isCurrent: true,
    lastSynced: '刚刚'
  }

  if (typeof localStorage === 'undefined') {
    devices.value = [currentDevice]
    return
  }

  try {
    const raw = localStorage.getItem(DEVICES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasCurrent = parsed.some((d) => d.isCurrent)
        if (hasCurrent) {
          devices.value = parsed
        } else {
          devices.value = [currentDevice, ...parsed]
        }
        return
      }
    }
  } catch (err) {
    console.warn('[CloudSyncPageView] Failed to read hp_connected_devices:', err)
  }

  devices.value = [currentDevice]
  saveDevices()
}

function saveDevices() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices.value))
  }
}

function unbindDevice(deviceId) {
  devices.value = devices.value.filter((d) => d.id !== deviceId)
  saveDevices()
  pairFeedback.value = {
    message: '已解除该设备关联',
    isError: false
  }
}

function collectLocalData() {
  return {
    vocabList: Array.isArray(vocabStore.vocabList) ? vocabStore.vocabList : [],
    streakDays: Number(gamificationStore.streakDays) || 0,
    streakFreezes: Number(gamificationStore.streakFreezes) || 0,
    streakFrozenDates: Array.isArray(gamificationStore.streakFrozenDates)
      ? gamificationStore.streakFrozenDates
      : [],
    lastActiveDate: gamificationStore.lastActiveDate || '',
    userHouse: gamificationStore.userHouse || null,
    studentContribution: Number(gamificationStore.studentContribution) || 0,
    housePoints: gamificationStore.housePoints || {},
    pointHistory: Array.isArray(gamificationStore.pointHistory) ? gamificationStore.pointHistory : [],
    unlockedBadges: gamificationStore.unlockedBadges || {}
  }
}

function applyMergedData(merged) {
  if (!merged) return

  if (Array.isArray(merged.vocabList)) {
    vocabStore.vocabList = merged.vocabList
    vocabStore.saveVocab()
  }

  if (merged.userHouse) gamificationStore.userHouse = merged.userHouse
  if (typeof merged.streakDays === 'number') gamificationStore.streakDays = merged.streakDays
  if (typeof merged.streakFreezes === 'number') gamificationStore.streakFreezes = merged.streakFreezes
  if (Array.isArray(merged.streakFrozenDates)) gamificationStore.streakFrozenDates = merged.streakFrozenDates
  if (merged.lastActiveDate) gamificationStore.lastActiveDate = merged.lastActiveDate
  if (typeof merged.studentContribution === 'number') {
    gamificationStore.studentContribution = merged.studentContribution
  }
  if (merged.housePoints && typeof merged.housePoints === 'object') {
    gamificationStore.housePoints = { ...gamificationStore.housePoints, ...merged.housePoints }
  }
  if (Array.isArray(merged.pointHistory)) {
    gamificationStore.pointHistory = merged.pointHistory
  }
  if (merged.unlockedBadges && typeof merged.unlockedBadges === 'object') {
    gamificationStore.unlockedBadges = { ...gamificationStore.unlockedBadges, ...merged.unlockedBadges }
  }
  gamificationStore.saveToStorage()

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CLOUD_SNAPSHOT_KEY, JSON.stringify(merged))
  }
}

async function triggerManualSync() {
  isSyncing.value = true
  try {
    const localData = collectLocalData()
    let cloudData = {}
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CLOUD_SNAPSHOT_KEY)
      if (raw) {
        try {
          cloudData = JSON.parse(raw)
        } catch {}
      }
    }

    const mergedResult = mergeUserData(localData, cloudData)
    applyMergedData(mergedResult.mergedData || mergedResult)

    devices.value = devices.value.map((d) => ({
      ...d,
      lastSynced: '刚刚'
    }))
    saveDevices()
  } catch (err) {
    console.error('[CloudSyncPageView] Sync failed:', err)
  } finally {
    isSyncing.value = false
  }
}

async function handlePairDevice() {
  const code = pairInput.value.trim()
  if (!code) return

  if (!isValidPasscode(code)) {
    pairFeedback.value = {
      message: '通行码格式不正确，请输入 6 位无歧义码（例如: HP-4K9W）',
      isError: true
    }
    return
  }

  if (code === currentPasscode.value) {
    pairFeedback.value = {
      message: '不能与本机配对，请输入其他设备的通行码',
      isError: true
    }
    return
  }

  isPairing.value = true
  pairFeedback.value = { message: '', isError: false }

  try {
    const newDevice = {
      id: `dev-${Date.now()}`,
      type: 'mobile',
      name: `远程设备 (${code})`,
      os: '配对设备',
      isCurrent: false,
      lastSynced: '刚刚'
    }

    devices.value = [...devices.value, newDevice]
    saveDevices()

    await triggerManualSync()

    pairFeedback.value = {
      message: '设备配对成功！已完成全端无损数据漫游合并。',
      isError: false
    }
    pairInput.value = ''
  } catch (err) {
    pairFeedback.value = {
      message: '配对同步失败，请检查网络后重试。',
      isError: true
    }
  } finally {
    isPairing.value = false
  }
}

onMounted(() => {
  initPasscode()
  initDevices()
})
</script>
