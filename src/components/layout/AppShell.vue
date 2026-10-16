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
      @open-house-cup="openHouseCup"
      @open-badges="openBadges"
      @open-cloud-sync="openCloudSync"
    />

    <!-- Middle flex: sidebar navigation + main content stage -->
    <div class="flex-1 min-h-0 flex overflow-hidden">
      <!-- Tablet icon rail: 768px - 1023px (hidden on mobile and desktop) -->
      <TabletRailVue
        @open-vocab="openVocab"
        @open-analytics="openAnalytics"
        @open-storage="openStorage"
        @open-house-cup="openHouseCup"
        @open-badges="openBadges"
        @open-cloud-sync="openCloudSync"
        @change-study-mode="handleStudyModeChange"
      />

      <!-- Desktop sidebar: >= 1024px (hidden on mobile and tablet) -->
      <DesktopSidebarVue
        @open-vocab="handleToggleVocab"
        @open-analytics="openAnalytics"
        @open-storage="openStorage"
        @open-legal="handleOpenLegal"
        @open-house-cup="openHouseCup"
        @open-badges="openBadges"
        @open-cloud-sync="openCloudSync"
        @change-study-mode="handleStudyModeChange"
      />

      <!-- Bookshelf Drawer (Desktop in-flow sub-sidebar / Mobile teleported to body) -->
      <BookshelfDrawer />

      <!-- Ebbinghaus 5-Box Vocabulary Drawer (Desktop in-flow sub-sidebar / Mobile teleported to body) -->
      <VocabularyDrawer
        :is-open="isVocabOpen"
        @close="closeVocab"
      />

      <!-- Right Stage Column: Main Stage View + Docked SmartAudioPlayer -->
      <div class="flex-1 min-w-0 flex flex-col overflow-hidden relative">
        <main class="flex-1 min-w-0 overflow-hidden relative flex flex-col" role="main">
          <!-- Step tab bar: HP sessions only, docked in right-side main stage header so left sidebar stays full height -->
          <StepTabBar v-if="navStore.currentView === 'player'" />

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

          <AssessmentHub v-if="navStore.currentView === 'assessment'" />
          <BookshelfPageView v-else-if="navStore.currentView === 'bookshelf'" />
          <VocabularyPageView v-else-if="navStore.currentView === 'vocab'" />
          <AnalyticsPageView v-else-if="navStore.currentView === 'analytics'" />
          <StoragePageView v-else-if="navStore.currentView === 'storage'" />
          <BadgesPageView v-else-if="navStore.currentView === 'badges'" />
          <CloudSyncPageView v-else-if="navStore.currentView === 'sync'" />
          <HouseCupPageView v-else-if="navStore.currentView === 'house_cup'" @open-sorting="openSorting" @back="closeHouseCup" />
          <slot v-else />
        </main>

        <!-- Persistent smart audio player bar: docked to right column so width matches right page -->
        <SmartAudioPlayer class="shrink-0 mb-[calc(56px+env(safe-area-inset-bottom,0px))] md:mb-0" />
      </div>
    </div>

    <!-- Bottom navigation bar: mobile only (hidden on md and up) -->
    <MobileBottomNavVue class="md:hidden" />

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


    <!-- Achievement Badges Gallery Modal -->
    <AchievementBadgesModal
      :is-open="isBadgesOpen"
      @close="closeBadges"
    />

    <!-- Sorting Ceremony Modal -->
    <SortingCeremonyModal
      :is-open="isSortingOpen"
      @close="closeSorting"
      @sorted="closeSorting"
    />

    <!-- Multi-Device Cloud Sync Modal -->
    <CloudSyncModal
      :is-open="isCloudSyncOpen"
      @close="closeCloudSync"
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
import { useGamificationStore } from '../../stores/gamificationStore.js'
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
import AssessmentHub from '../assessment/AssessmentHub.vue'
import AchievementBadgesModal from '../gamification/AchievementBadgesModal.vue'
import SortingCeremonyModal from '../gamification/SortingCeremonyModal.vue'
import CloudSyncModal from '../sync/CloudSyncModal.vue'
import BookshelfPageView from '../views/BookshelfPageView.vue'
import VocabularyPageView from '../views/VocabularyPageView.vue'
import AnalyticsPageView from '../views/AnalyticsPageView.vue'
import StoragePageView from '../views/StoragePageView.vue'
import BadgesPageView from '../views/BadgesPageView.vue'
import CloudSyncPageView from '../views/CloudSyncPageView.vue'
import HouseCupPageView from '../views/HouseCupPageView.vue'

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
const gamificationStore = useGamificationStore()
const breakpoint = useBreakpointVue()

const isVocabOpen = ref(false)
const isAnalyticsOpen = ref(false)
const isStorageOpen = ref(false)
const isShortcutsOpen = ref(false)
const isBadgesOpen = ref(false)
const isSortingOpen = ref(false)
const isCloudSyncOpen = ref(false)

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
  if (isVocabOpen.value) {
    isVocabOpen.value = false
  }
  player.toggleBookshelf(true)
}

function handleOpenLegal() {
  isShortcutsOpen.value = true
}

function handleToggleVocab() {
  openVocab()
}

function openVocab() {
  if (player.isBookshelfOpen) {
    player.toggleBookshelf(false)
  }
  if (navStore.currentView && !['vocab', 'analytics', 'storage', 'bookshelf'].includes(navStore.currentView)) {
    previousView = navStore.currentView
  }
  isVocabOpen.value = false
  navStore.setView('vocab')
}

function openAnalytics() {
  if (player.isBookshelfOpen) {
    player.toggleBookshelf(false)
  }
  if (navStore.currentView && !['vocab', 'analytics', 'storage', 'bookshelf'].includes(navStore.currentView)) {
    previousView = navStore.currentView
  }
  isAnalyticsOpen.value = false
  navStore.setView('analytics')
}

function openStorage() {
  if (player.isBookshelfOpen) {
    player.toggleBookshelf(false)
  }
  if (navStore.currentView && !['vocab', 'analytics', 'storage', 'bookshelf'].includes(navStore.currentView)) {
    previousView = navStore.currentView
  }
  isStorageOpen.value = false
  navStore.setView('storage')
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

function openHouseCup() {
  if (player.isBookshelfOpen) {
    player.toggleBookshelf(false)
  }
  if (navStore.currentView && !['vocab', 'analytics', 'storage', 'bookshelf', 'badges', 'sync', 'house_cup'].includes(navStore.currentView)) {
    previousView = navStore.currentView
  }
  navStore.setView('house_cup')
}

function closeHouseCup() {
  if (navStore.currentView === 'house_cup') {
    navStore.setView(previousView || 'player')
  }
}

function openBadges() {
  if (player.isBookshelfOpen) {
    player.toggleBookshelf(false)
  }
  if (navStore.currentView && !['vocab', 'analytics', 'storage', 'bookshelf', 'badges'].includes(navStore.currentView)) {
    previousView = navStore.currentView
  }
  isBadgesOpen.value = false
  navStore.setView('badges')
}

function closeBadges() {
  isBadgesOpen.value = false
  if (navStore.currentView === 'badges') {
    navStore.setView(previousView || 'player')
  }
}

function openSorting() {
  isSortingOpen.value = true
}

function closeSorting() {
  isSortingOpen.value = false
}

function openCloudSync() {
  if (player.isBookshelfOpen) {
    player.toggleBookshelf(false)
  }
  if (navStore.currentView && !['vocab', 'analytics', 'storage', 'bookshelf', 'badges', 'sync'].includes(navStore.currentView)) {
    previousView = navStore.currentView
  }
  isCloudSyncOpen.value = false
  navStore.setView('sync')
}

function closeCloudSync() {
  isCloudSyncOpen.value = false
  if (navStore.currentView === 'sync') {
    navStore.setView(previousView || 'player')
  }
}

watch(
  () => navStore.currentView,
  (newView, oldView) => {
    if (oldView && !['vocab', 'analytics', 'storage', 'bookshelf', 'badges', 'sync'].includes(oldView)) {
      previousView = oldView
    }
    if (newView !== 'player') {
      player.toggleBookshelf(false)
      isVocabOpen.value = false
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
