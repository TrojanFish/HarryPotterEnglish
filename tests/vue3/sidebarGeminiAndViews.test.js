import { test, describe } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

function readComponent(relPath) {
  const fullPath = path.resolve(process.cwd(), relPath)
  return fs.readFileSync(fullPath, 'utf-8')
}

describe('Gemini-style Sidebar and Dedicated Right-side Page Views', () => {
  describe('1. DesktopSidebarVue Gemini-style collapse button', () => {
    test('DesktopSidebarVue implements clean borderless collapse button with PanelLeft icons', () => {
      const content = readComponent('src/components/navigation/DesktopSidebarVue.vue')
      assert.ok(
        content.includes('PanelLeftClose'),
        'DesktopSidebarVue must use PanelLeftClose icon for collapsing'
      )
      assert.ok(
        content.includes('PanelLeftOpen') || content.includes('PanelLeft'),
        'DesktopSidebarVue must use PanelLeftOpen or PanelLeft icon for expanding'
      )
      assert.ok(
        content.includes('border-transparent') || content.includes('hover:bg-[#f5efe6]') || content.includes('hover:bg-amber-50'),
        'DesktopSidebarVue collapse button must have clean Gemini-style subtle hover effect'
      )
      assert.ok(
        content.includes('min-h-[44px]') && content.includes('touch-manipulation'),
        'DesktopSidebarVue collapse button must satisfy Apple HIG 44px'
      )
      const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
      assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
    })
  })

  describe('2. Right-side Dedicated Page Views (Vocab, Analytics, Storage)', () => {
    test('VocabularyPageView.vue exists, renders full-page 5-box deck and parchment palette', () => {
      const content = readComponent('src/components/views/VocabularyPageView.vue')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'VocabularyPageView must declare bg-[#fbf9f5] canvas')
      assert.ok(content.includes('border-[#e8ddd0]'), 'VocabularyPageView must declare border-[#e8ddd0]')
      assert.ok(content.includes('bg-amber-700'), 'VocabularyPageView must declare bg-amber-700 active pill')
      assert.ok(content.includes('min-h-[44px]'), 'Must enforce Apple HIG 44px')
      const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
      assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
    })

    test('AnalyticsPageView.vue exists, renders full-page metrics and weekly chart', () => {
      const content = readComponent('src/components/views/AnalyticsPageView.vue')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'AnalyticsPageView must declare bg-[#fbf9f5] canvas')
      assert.ok(content.includes('border-[#e8ddd0]'), 'AnalyticsPageView must declare border-[#e8ddd0]')
      assert.ok(content.includes('bg-amber-700') || content.includes('text-amber-800'), 'AnalyticsPageView must declare amber accents')
      assert.ok(content.includes('min-h-[44px]'), 'Must enforce Apple HIG 44px')
      const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
      assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
    })

    test('StoragePageView.vue exists, renders full-page storage quota and chapter list', () => {
      const content = readComponent('src/components/views/StoragePageView.vue')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'StoragePageView must declare bg-[#fbf9f5] canvas')
      assert.ok(content.includes('border-[#e8ddd0]'), 'StoragePageView must declare border-[#e8ddd0]')
      assert.ok(content.includes('min-h-[44px]'), 'Must enforce Apple HIG 44px')
      const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
      assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
    })
  })

  describe('3. AppShell mounts the dedicated views in main stage', () => {
    test('AppShell renders VocabularyPageView, AnalyticsPageView, and StoragePageView inside main', () => {
      const content = readComponent('src/components/layout/AppShell.vue')
      assert.ok(content.includes('<VocabularyPageView'), 'AppShell must mount VocabularyPageView')
      assert.ok(content.includes('<AnalyticsPageView'), 'AppShell must mount AnalyticsPageView')
      assert.ok(content.includes('<StoragePageView'), 'AppShell must mount StoragePageView')
    })
  })
})
