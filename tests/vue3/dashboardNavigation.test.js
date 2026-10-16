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
    test('CloudSyncPageView.vue exists, renders passcode, device pairing, topology roster, and Apple HIG touch targets', () => {
      const content = readComponent('src/components/views/CloudSyncPageView.vue')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'Must declare warm parchment canvas')
      assert.ok(content.includes('border-[#e8ddd0]'), 'Must declare standard parchment border')
      assert.ok(content.includes('多设备云端漫游'), 'Must declare multi-device roaming title')
      assert.ok(content.includes('currentPasscode'), 'Must render current passcode')
      assert.ok(content.includes('pairInput'), 'Must render pair input')
      assert.ok(content.includes('devices'), 'Must render devices roster')
      assert.ok(content.includes('min-h-[44px]'), 'Must enforce Apple HIG 44px touch targets')
      assert.ok(content.includes('touch-manipulation'), 'Must include touch-manipulation')
      const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
      assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
    })

    test('HouseCupPageView.vue exists, renders gemstone hourglasses, leaderboard, personal contribution, and Apple HIG touch targets', () => {
      const content = readComponent('src/components/views/HouseCupPageView.vue')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'Must declare warm parchment canvas')
      assert.ok(content.includes('border-[#e8ddd0]'), 'Must declare standard parchment border')
      assert.ok(content.includes('霍格沃茨学院杯'), 'Must declare House Cup title')
      assert.ok(content.includes('fourHourglasses'), 'Must compute gemstone hourglasses')
      assert.ok(content.includes('houseRankings'), 'Must render house rankings')
      assert.ok(content.includes('studentContribution'), 'Must render student contribution')
      assert.ok(content.includes('min-h-[44px]'), 'Must enforce Apple HIG 44px touch targets')
      assert.ok(content.includes('touch-manipulation'), 'Must include touch-manipulation')
      const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
      assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
    })
  })

  describe('2. AppShell clean page view routing without redundant popups', () => {
    test('AppShell renders BookshelfPageView, VocabularyPageView, AnalyticsPageView, StoragePageView, BadgesPageView, CloudSyncPageView, HouseCupPageView without modal watcher triggers', () => {
      const content = readComponent('src/components/layout/AppShell.vue')
      
      // Main stage view mounting
      assert.ok(content.includes('<BookshelfPageView'), 'AppShell must mount BookshelfPageView')
      assert.ok(content.includes('<VocabularyPageView'), 'AppShell must mount VocabularyPageView')
      assert.ok(content.includes('<AnalyticsPageView'), 'AppShell must mount AnalyticsPageView')
      assert.ok(content.includes('<StoragePageView'), 'AppShell must mount StoragePageView')
      assert.ok(content.includes('<BadgesPageView'), 'AppShell must mount BadgesPageView')
      assert.ok(content.includes('<CloudSyncPageView'), 'AppShell must mount CloudSyncPageView')
      assert.ok(content.includes('<HouseCupPageView'), 'AppShell must mount HouseCupPageView')
      assert.ok(content.includes("navStore.currentView === 'house_cup'"), 'AppShell must route house_cup to HouseCupPageView')
      
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

  describe('4. Sidebar cleanup and Gemini collapse button design', () => {
    test('DesktopSidebarVue removes 魔法磨耳朵 and 拼写大闯关 from navItems and uses Gemini circular collapse/expand buttons', () => {
      const content = readComponent('src/components/navigation/DesktopSidebarVue.vue')
      
      // navItems must not have player_blind or player_dictation
      assert.ok(!content.includes("id: 'player_blind'"), 'DesktopSidebar must remove player_blind (魔法磨耳朵) from navItems')
      assert.ok(!content.includes("id: 'player_dictation'"), 'DesktopSidebar must remove player_dictation (拼写大闯关) from navItems')
      assert.ok(!content.includes("label: '魔法磨耳朵'"), 'DesktopSidebar must not have 魔法磨耳朵 in navItems')
      assert.ok(!content.includes("label: '拼写大闯关'"), 'DesktopSidebar must not have 拼写大闯关 in navItems')

      // Gemini collapse button design
      // Expanded state close button: circular with PanelLeftClose and tooltip
      assert.ok(
        content.includes('PanelLeftClose') && content.includes('rounded-full'),
        'DesktopSidebar expanded close button must use PanelLeftClose in a circular rounded-full pill'
      )

      // Collapsed state expand button: circular grey button at top with PanelLeftOpen
      assert.ok(
        content.includes('PanelLeftOpen') && content.includes('rounded-full bg-stone-200'),
        'DesktopSidebar collapsed rail top button must use PanelLeftOpen in a circular rounded-full bg-stone-200 pill'
      )
    })

    test('DesktopSidebarVue prevents vertical shift on vocab selection and uses SVG keyboard guide button', () => {
      const content = readComponent('src/components/navigation/DesktopSidebarVue.vue')
      
      // Fix visual clutter: brand title must not truncate
      assert.ok(content.includes('whitespace-nowrap'), 'Brand title must use whitespace-nowrap to prevent truncation to 霍格...')

      // Zero shift: fixed height h-11 on nav item buttons
      assert.ok(content.includes('h-11') && content.includes('rounded-xl'), 'Nav item buttons must have fixed h-11 and rounded-xl to prevent vertical shift')

      // Badge must have fixed height
      assert.ok(content.includes('h-5') || content.includes('min-h-[20px]'), 'Vocab badge must have fixed height to prevent button expansion')

      // Simplifies 研学公约 to Keyboard SVG button
      assert.ok(!content.includes('研学公约与法律声明'), 'DesktopSidebar must eliminate clunky 研学公约与法律声明 text button')
      assert.ok(content.includes('Keyboard'), 'DesktopSidebar must use Keyboard SVG icon for shortcuts guide')
      assert.ok(content.includes('快捷键与手势指南'), 'Must provide clear title/aria-label for shortcuts guide')
    })

    test('TabletRailVue removes 魔法磨耳朵 and 拼写大闯关 from navItems', () => {
      const content = readComponent('src/components/navigation/TabletRailVue.vue')
      assert.ok(!content.includes("id: 'player_blind'"), 'TabletRail must remove player_blind (魔法磨耳朵) from navItems')
      assert.ok(!content.includes("id: 'player_dictation'"), 'TabletRail must remove player_dictation (拼写大闯关) from navItems')
    })
  })

  describe('5. SmartAudioPlayer right-page width docking', () => {
    test('AppShell places SmartAudioPlayer in the right content column so width follows the right stage', () => {
      const content = readComponent('src/components/layout/AppShell.vue')
      const sidebarIdx = content.indexOf('<DesktopSidebarVue')
      const mainIdx = content.indexOf('<main')
      const playerIdx = content.indexOf('<SmartAudioPlayer')

      assert.ok(sidebarIdx !== -1 && mainIdx !== -1 && playerIdx !== -1, 'Components must exist in AppShell')
      
      // SmartAudioPlayer must be grouped with main inside right column (so width follows right stage, not full screen under sidebar)
      assert.ok(playerIdx > mainIdx, 'SmartAudioPlayer must follow main inside the right content area')
      assert.ok(!content.includes('</main>\n    </div>\n\n    <!-- Bottom navigation bar'), 'SmartAudioPlayer must not be outside middle flex container')
    })
  })
})
