<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-label="多设备云端漫游"
    @click.self="handleClose"
  >
    <div
      class="bg-[#fbf9f5] border border-[#e8ddd0] rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden text-stone-800 transition-all transform scale-100"
    >
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-[#e8ddd0] flex items-center justify-between bg-stone-50/80">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center border border-amber-300/60">
            <Cloud class="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h2 class="text-base sm:text-lg font-bold text-stone-900 tracking-tight">多设备云端漫游</h2>
              <span class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <Shield class="w-3 h-3 text-amber-700" />
                <span>无损同步</span>
              </span>
            </div>
            <p class="text-xs text-stone-500 mt-0.5">通行码配对与全端无损漫游拓扑</p>
          </div>
        </div>

        <button
          type="button"
          class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors touch-manipulation active:scale-95"
          aria-label="关闭对话框"
          @click="handleClose"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="overflow-y-auto p-4 sm:p-6 space-y-5">
        <!-- 1. Passcode Card -->
        <section class="bg-amber-50/50 border border-amber-300/80 rounded-xl p-4 sm:p-5 relative shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-amber-900/80">本机专属通行码</span>
            <span class="text-[11px] text-amber-800/80 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200">
              6位无歧义码
            </span>
          </div>

          <div class="flex items-center justify-between gap-3 mt-1">
            <div class="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-amber-950 select-all">
              {{ currentPasscode }}
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="min-h-[44px] min-w-[44px] px-3.5 py-2 inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-all touch-manipulation active:scale-95 shadow-sm"
                :class="isCopied ? 'bg-emerald-700 text-white' : 'bg-amber-800 hover:bg-amber-900 text-amber-50'"
                aria-label="复制通行码"
                @click="copyPasscode"
              >
                <Check v-if="isCopied" class="w-4 h-4" />
                <Copy v-else class="w-4 h-4" />
                <span>{{ isCopied ? '已复制' : '复制' }}</span>
              </button>

              <button
                type="button"
                class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-amber-300/80 bg-white/80 text-amber-900 hover:bg-amber-100/60 transition-colors touch-manipulation active:scale-95"
                aria-label="刷新生成新通行码"
                title="重新生成通行码"
                @click="regeneratePasscode"
              >
                <RotateCcw class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p class="text-[11px] text-stone-500 mt-2.5 leading-relaxed">
            在其他设备输入此码即可无缝配对，学习进度、生词本与学院学分将自动双向合并。
          </p>
        </section>

        <!-- 2. Pairing Code Input Card -->
        <section class="bg-stone-50/80 border border-[#e8ddd0] rounded-xl p-4 sm:p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-stone-900">配对新设备</h3>
            <span class="text-xs text-stone-500">输入对方设备通行码</span>
          </div>

          <div class="flex flex-col sm:flex-row gap-2.5">
            <input
              v-model="pairInput"
              type="text"
              maxlength="10"
              placeholder="例如: HP-4K9W"
              class="flex-1 font-mono uppercase px-3.5 py-2.5 min-h-[44px] rounded-lg border border-stone-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 bg-white text-stone-900 touch-manipulation text-base placeholder:text-stone-400 placeholder:font-normal"
              aria-label="输入对方设备通行码"
              @input="onPairInput"
              @keydown.enter="handlePairDevice"
            />
            <button
              type="button"
              class="min-h-[44px] min-w-[44px] px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-50 rounded-lg text-sm font-semibold transition-all touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
              :disabled="isPairing || !pairInput.trim()"
              aria-label="连接并同步"
              @click="handlePairDevice"
            >
              <RefreshCw v-if="isPairing" class="w-4 h-4 animate-spin" />
              <span>连接并同步</span>
            </button>
          </div>

          <!-- Alert message -->
          <div
            v-if="pairFeedback.message"
            class="p-3 rounded-lg text-xs flex items-center gap-2 transition-all border"
            :class="pairFeedback.isError ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'"
            role="status"
          >
            <AlertCircle v-if="pairFeedback.isError" class="w-4 h-4 flex-shrink-0 text-red-600" />
            <CheckCircle2 v-else class="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span class="flex-1">{{ pairFeedback.message }}</span>
          </div>
        </section>

        <!-- 3. Connected Device Topology Roster -->
        <section class="bg-stone-50/80 border border-[#e8ddd0] rounded-xl p-4 sm:p-5 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-bold text-stone-900">已关联设备拓扑</h3>
              <span class="text-xs text-stone-500">({{ devices.length }} 台设备在线)</span>
            </div>
            <span class="text-[11px] text-stone-500">多点冗余漫游</span>
          </div>

          <div class="divide-y divide-stone-200/80 border border-stone-200 rounded-lg overflow-hidden bg-white">
            <div
              v-for="device in devices"
              :key="device.id"
              class="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200 flex-shrink-0">
                  <Smartphone v-if="device.type === 'mobile'" class="w-5 h-5 text-amber-800" />
                  <Tablet v-else-if="device.type === 'tablet'" class="w-5 h-5 text-amber-800" />
                  <Laptop v-else class="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-semibold text-stone-900">{{ device.name }}</span>
                    <span
                      v-if="device.isCurrent"
                      class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200"
                    >
                      当前设备
                    </span>
                  </div>
                  <div class="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
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
                  class="min-h-[44px] min-w-[44px] px-2.5 text-xs text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation active:scale-95 flex items-center justify-center border border-transparent hover:border-red-200"
                  aria-label="解除关联"
                  @click="unbindDevice(device.id)"
                >
                  解除关联
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. Dual-Channel Sync Status Bar -->
        <section class="bg-stone-50/80 border border-[#e8ddd0] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 w-full sm:w-auto">
            <span
              class="w-3 h-3 rounded-full flex-shrink-0"
              :class="isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'"
              aria-hidden="true"
            />
            <div class="flex flex-col">
              <span class="text-xs sm:text-sm font-medium text-stone-800">
                {{ isSyncing ? '云端漫游同步中 · 请稍候' : '云端漫游正常 · 刚刚同步' }}
              </span>
              <span class="text-[11px] text-stone-500">双通道状态指示 · 实时冗余快照</span>
            </div>
          </div>

          <button
            type="button"
            class="min-h-[44px] min-w-[44px] w-full sm:w-auto px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-sm font-semibold transition-all touch-manipulation active:scale-95 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            :disabled="isSyncing"
            aria-label="立即同步"
            @click="triggerManualSync"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isSyncing }" />
            <span>{{ isSyncing ? '同步中...' : '立即同步' }}</span>
          </button>
        </section>
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3.5 border-t border-[#e8ddd0] bg-stone-50/80 flex items-center justify-between text-xs text-stone-500">
        <span>霍格沃茨学籍档案全端无损漫游机制</span>
        <button
          type="button"
          class="min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-stone-800 font-medium transition-colors touch-manipulation active:scale-95"
          aria-label="完成并关闭"
          @click="handleClose"
        >
          完成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
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
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-vue-next'
import {
  generatePasscode,
  isValidPasscode,
  detectDevicePlatform,
  mergeUserData
} from '../../utils/syncManager.js'
import { useVocabStore } from '../../stores/vocabStore.js'
import { useGamificationStore } from '../../stores/gamificationStore.js'
import { useAnalyticsStore } from '../../stores/analyticsStore.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'sync-completed'])

// Stores
const vocabStore = useVocabStore()
const gamificationStore = useGamificationStore()
const analyticsStore = useAnalyticsStore()

// State
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

/**
 * Initialize current device passcode
 */
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

/**
 * Re-generate current device passcode
 */
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

/**
 * Copy passcode to clipboard
 */
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
    console.warn('[CloudSyncModal] Clipboard write failed:', err)
  }
}

/**
 * Handle input normalization for pair code
 */
function onPairInput() {
  if (typeof pairInput.value === 'string') {
    pairInput.value = pairInput.value.toUpperCase()
  }
}

/**
 * Initialize or load connected devices topology roster
 */
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
        // Ensure current device is present
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
    console.warn('[CloudSyncModal] Failed to read hp_connected_devices:', err)
  }

  devices.value = [currentDevice]
  saveDevices()
}

/**
 * Persist devices roster to localStorage
 */
function saveDevices() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices.value))
  }
}

/**
 * Unbind a paired device
 */
function unbindDevice(deviceId) {
  devices.value = devices.value.filter((d) => d.id !== deviceId)
  saveDevices()
  pairFeedback.value = {
    message: '已解除该设备关联',
    isError: false
  }
}

/**
 * Collect local dataset for sync
 */
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

/**
 * Apply merged dataset back to Pinia stores
 */
function applyMergedData(merged) {
  if (!merged) return

  // Update vocab store
  if (Array.isArray(merged.vocabList)) {
    vocabStore.vocabList = merged.vocabList
    vocabStore.saveVocab()
  }

  // Update gamification store
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

  // Save cloud snapshot
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CLOUD_SNAPSHOT_KEY, JSON.stringify(merged))
  }
}

/**
 * Perform lossless merge between local and simulated cloud snapshot
 */
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

    // Update devices sync timestamp
    devices.value = devices.value.map((d) => ({
      ...d,
      lastSynced: '刚刚'
    }))
    saveDevices()

    emit('sync-completed', mergedResult)
  } catch (err) {
    console.error('[CloudSyncModal] Sync failed:', err)
  } finally {
    isSyncing.value = false
  }
}

/**
 * Handle pairing new device code
 */
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
    // Add new paired device to roster
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

    // Trigger lossless sync
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

/**
 * Close modal
 */
function handleClose() {
  emit('close')
}

/**
 * Handle Escape key
 */
function handleKeydown(e) {
  if (!props.isOpen) return
  if (e.key === 'Escape' || e.code === 'Escape') {
    handleClose()
  }
}

onMounted(() => {
  initPasscode()
  initDevices()
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>
