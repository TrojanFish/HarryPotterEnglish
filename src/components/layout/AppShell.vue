<template>
  <div class="h-full w-full flex flex-col bg-[#fbf9f5] overflow-hidden select-none font-sans">
    <!-- Top bar: mobile only (hidden on md and up) -->
    <MobileTopBarVue
      class="md:hidden"
      :current-chapter-title="computedChapterTitle"
      @open-chapter-drawer="handleOpenBookshelf"
      @open-vocab="openVocab"
      @open-analytics="openAnalytics"
      @open-storage="openStorage"
    />

    <!-- Step tab bar: HP sessions only, hidden on TED view -->
    <StepTabBar v-if="navStore.currentView === 'player' || navStore.currentView === 'bookshelf'" />

    <!-- Global audio error notice banner (shared) -->
    <div
      v-if="player.audioError"
      class="mx-3 sm:mx-4 mt-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-800 shrink-0 transition-all z-10"
      role="alert"
    >
      <div class="flex items-center gap-2 min-w-0">
        <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
        <span class="truncate">{{ player.audioError }}</span>
      </div>
      <button
        type="button"
        @click="player.setAudioError(null)"
        class="p-1 rounded-lg text-rose-800 hover:bg-rose-100 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 cursor-pointer touch-manipulation"
        aria-label="关闭提示"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Middle flex: sidebar navigation + main content stage -->
    <div class="flex-1 min-h-0 flex overflow-hidden">
      <!-- Tablet icon rail: 768px - 1023px (hidden on mobile and desktop) -->
      <TabletRailVue
        @open-vocab="openVocab"
        @open-analytics="openAnalytics"
        @open-storage="openStorage"
        @change-study-mode="handleStudyModeChange"
      />

      <!-- Desktop sidebar: >= 1024px (hidden on mobile and tablet) -->
      <DesktopSidebarVue
        @open-vocab="openVocab"
        @open-analytics="openAnalytics"
        @open-storage="openStorage"
        @open-legal="handleOpenLegal"
        @change-study-mode="handleStudyModeChange"
      />

      <!-- Main content stage slot -->
      <main class="flex-1 min-w-0 overflow-hidden relative flex flex-col" role="main">
        <slot />
      </main>
    </div>

    <!-- Bottom navigation bar: mobile only (hidden on md and up) -->
    <MobileBottomNavVue class="md:hidden" />

    <!-- Persistent smart audio player bar -->
    <SmartAudioPlayer class="mb-[calc(56px+env(safe-area-inset-bottom,0px))] md:mb-0" />

    <!-- Bookshelf Drawer -->
    <BookshelfDrawer />

    <!-- Ebbinghaus 5-Box Vocabulary Drawer -->
    <VocabularyDrawer
      :is-open="isVocabOpen"
      @close="closeVocab"
    />

    <!-- Magic Analytics Dashboard Modal -->
    <AnalyticsDashboard
      :is-open="isAnalyticsOpen"
      @close="closeAnalytics"
    />

    <!-- Offline Storage Modal -->
    <StorageManagerModal
      :is-open="isStorageOpen"
      @close="closeStorage"
    />

    <!-- Shortcuts Guide Modal -->
    <ShortcutsModal
      :is-open="isShortcutsOpen"
      @close="closeShortcuts"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { AlertCircle, X } from 'lucide-vue-next'
import { useNavigationStore } from '../../stores/navigationStore.js'
import { usePlayerStore } from '../../stores/playerStore.js'
import { useCatalogStore } from '../../stores/catalogStore.js'
import { useSessionStore } from '../../stores/sessionStore.js'
import { useBreakpointVue } from '../../utils/useBreakpointVue.js'

import MobileTopBarVue from '../navigation/MobileTopBarVue.vue'
import TabletRailVue from '../navigation/TabletRailVue.vue'
import DesktopSidebarVue from '../navigation/DesktopSidebarVue.vue'
import MobileBottomNavVue from '../navigation/MobileBottomNavVue.vue'
import StepTabBar from './StepTabBar.vue'
import SmartAudioPlayer from '../player/SmartAudioPlayer.vue'

import BookshelfDrawer from '../BookshelfDrawer.vue'
import VocabularyDrawer from '../VocabularyDrawer.vue'
import AnalyticsDashboard from '../AnalyticsDashboard.vue'
import StorageManagerModal from '../StorageManagerModal.vue'
import ShortcutsModal from '../ShortcutsModal.vue'

const props = defineProps({
  currentChapterTitle: {
    type: String,
    default: undefined
  }
})

const navStore = useNavigationStore()
const player = usePlayerStore()
const catalogStore = useCatalogStore()
const sessionStore = useSessionStore()
const breakpoint = useBreakpointVue()

const isVocabOpen = ref(false)
const isAnalyticsOpen = ref(false)
const isStorageOpen = ref(false)
const isShortcutsOpen = ref(false)

let previousView = 'player'

const computedChapterTitle = computed(() => {
  if (props.currentChapterTitle) {
    return props.currentChapterTitle
  }
  const book = catalogStore.currentBook
  const ch = catalogStore.currentChapter
  const code = book?.code || 'HP1'
  const title = ch?.title || `Chapter ${ch?.number || 1}`
  return `${code} · ${title}`
})

function handleStudyModeChange(mode) {
  if (mode === 'blind') {
    player.isBlindMode = true
    sessionStore.setStep(1)
  } else if (mode === 'dictation') {
    player.isBlindMode = false
    sessionStore.setStep(3)
  } else {
    player.isBlindMode = false
    sessionStore.setStep(1)
  }
  navStore.setView('player')
}

function handleOpenBookshelf() {
  player.toggleBookshelf(true)
}

function handleOpenLegal() {
  isShortcutsOpen.value = true
}

function openVocab() {
  if (navStore.currentView && !['vocab', 'analytics', 'storage'].includes(navStore.currentView)) {
    previousView = navStore.currentView
  }
  isVocabOpen.value = true
}

function openAnalytics() {
  if (navStore.currentView && !['vocab', 'analytics', 'storage'].includes(navStore.currentView)) {
    previousView = navStore.currentView
  }
  isAnalyticsOpen.value = true
}

function openStorage() {
  if (navStore.currentView && !['vocab', 'analytics', 'storage'].includes(navStore.currentView)) {
    previousView = navStore.currentView
  }
  isStorageOpen.value = true
}

function closeVocab() {
  isVocabOpen.value = false
  if (navStore.currentView === 'vocab') {
    navStore.setView(previousView || 'player')
  }
}

function closeAnalytics() {
  isAnalyticsOpen.value = false
  if (navStore.currentView === 'analytics') {
    navStore.setView(previousView || 'player')
  }
}

function closeStorage() {
  isStorageOpen.value = false
  if (navStore.currentView === 'storage') {
    navStore.setView(previousView || 'player')
  }
}

function closeShortcuts() {
  isShortcutsOpen.value = false
}

watch(
  () => navStore.currentView,
  (newView, oldView) => {
    if (newView === 'vocab') {
      if (oldView && !['vocab', 'analytics', 'storage'].includes(oldView)) {
        previousView = oldView
      }
      isVocabOpen.value = true
    } else if (newView === 'analytics') {
      if (oldView && !['vocab', 'analytics', 'storage'].includes(oldView)) {
        previousView = oldView
      }
      isAnalyticsOpen.value = true
    } else if (newView === 'storage') {
      if (oldView && !['vocab', 'analytics', 'storage'].includes(oldView)) {
        previousView = oldView
      }
      isStorageOpen.value = true
    } else if (newView === 'bookshelf' && oldView !== undefined && oldView !== 'bookshelf') {
      player.toggleBookshelf(true)
    }
  }
)

watch(
  () => player.isBookshelfOpen,
  (isOpen) => {
    if (!isOpen && navStore.currentView === 'bookshelf') {
      navStore.setView('player')
    }
  }
)

function handleKeyDown(e) {
  const targetTag = e.target?.tagName?.toLowerCase()
  if (targetTag === 'input' || targetTag === 'textarea') return
  if (e.key === '?') {
    isShortcutsOpen.value = true
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown)
  }
})
</script>
