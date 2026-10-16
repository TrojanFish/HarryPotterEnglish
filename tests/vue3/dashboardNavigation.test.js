import { test, describe } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

function readComponent(relPath) {
  const fullPath = path.resolve(process.cwd(), relPath)
  return fs.readFileSync(fullPath, 'utf-8')
}

describe('Dashboard Navigation Architecture Verification', () => {
  describe('1. Dedicated Page View components (Bookshelf, Badges)', () => {
    test('BookshelfPageView.vue exists, renders 7 books, CEFR pills, and chapter browser', () => {
      const content = readComponent('src/components/views/BookshelfPageView.vue')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'Must declare warm parchment canvas')
      assert.ok(content.includes('border-[#e8ddd0]'), 'Must declare standard parchment border')
      assert.ok(content.includes('BOOKS'), 'Must import or iterate BOOKS catalog')
      assert.ok(content.includes('min-h-[44px]'), 'Must enforce Apple HIG 44px touch targets')
      assert.ok(content.includes('touch-manipulation'), 'Must include touch-manipulation')
      const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
      assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
    })

    test('BadgesPageView.vue exists, renders badge categories, honor gallery, and Apple HIG touch targets', () => {
      const content = readComponent('src/components/views/BadgesPageView.vue')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'Must declare warm parchment canvas')
      assert.ok(content.includes('border-[#e8ddd0]'), 'Must declare standard parchment border')
      assert.ok(content.includes('魔法成就图鉴大厅'), 'Must declare Wizard Honor Gallery title')
      assert.ok(content.includes('min-h-[44px]'), 'Must enforce Apple HIG 44px touch targets')
      assert.ok(content.includes('touch-manipulation'), 'Must include touch-manipulation')
      const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
      assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
    })
  })

  describe('2. AppShell clean page view routing without redundant popups', () => {
    test('AppShell renders BookshelfPageView, VocabularyPageView, AnalyticsPageView, StoragePageView, BadgesPageView without modal watcher triggers', () => {
      const content = readComponent('src/components/layout/AppShell.vue')
      
      // Main stage view mounting
      assert.ok(content.includes('<BookshelfPageView'), 'AppShell must mount BookshelfPageView')
      assert.ok(content.includes('<VocabularyPageView'), 'AppShell must mount VocabularyPageView')
      assert.ok(content.includes('<AnalyticsPageView'), 'AppShell must mount AnalyticsPageView')
      assert.ok(content.includes('<StoragePageView'), 'AppShell must mount StoragePageView')
      assert.ok(content.includes('<BadgesPageView'), 'AppShell must mount BadgesPageView')
      
      // StepTabBar only for player view
      assert.ok(
        content.includes("navStore.currentView === 'player'") && !content.includes("navStore.currentView === 'player' || navStore.currentView === 'bookshelf'"),
        'StepTabBar must only be visible when currentView is player (not bookshelf)'
      )

      // Watcher must not trigger unwanted modals on view change
      assert.ok(
        !content.includes('isAnalyticsOpen.value = true') || !content.includes('newView === \'analytics\''),
        'AppShell must not force open AnalyticsDashboard modal when switching to analytics view'
      )
      assert.ok(
        !content.includes('isStorageOpen.value = true') || !content.includes('newView === \'storage\''),
        'AppShell must not force open StorageManagerModal when switching to storage view'
      )
    })

    test('AppShell docks StepTabBar inside main stage so sidebar is not pushed down', () => {
      const content = readComponent('src/components/layout/AppShell.vue')
      const mainIdx = content.indexOf('<main')
      const stepTabIdx = content.indexOf('<StepTabBar')
      assert.ok(mainIdx !== -1 && stepTabIdx !== -1, 'main and StepTabBar must exist in AppShell')
      assert.ok(stepTabIdx > mainIdx, 'StepTabBar must be inside main so DesktopSidebarVue remains full height')
    })
  })

  describe('3. App.vue session step isolation', () => {
    test('App.vue renders HP audio session steps only when currentView is player', () => {
      const content = readComponent('src/App.vue')
      assert.ok(
        content.includes("navStore.currentView === 'player'"),
        'App.vue must isolate HP audio steps to player view'
      )
      assert.ok(
        !content.includes("navStore.currentView === 'player' || navStore.currentView === 'bookshelf'"),
        'App.vue must not render StepListening when user is on bookshelf view'
      )
    })
  })
})
