import { test, describe } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

function readComponent(relPath) {
  const fullPath = path.resolve(process.cwd(), relPath)
  return fs.readFileSync(fullPath, 'utf-8')
}

describe('Left Sub-sidebar Panel & Left Drawer Architecture (Scheme B)', () => {
  describe('1. VocabularyDrawer left positioning & desktop sub-sidebar', () => {
    test('VocabularyDrawer slides in from the left and has right border', () => {
      const content = readComponent('src/components/VocabularyDrawer.vue')
      assert.ok(content.includes('left-0'), 'VocabularyDrawer must use left-0 positioning')
      assert.ok(!content.includes('right-0'), 'VocabularyDrawer must not use right-0 positioning')
      assert.ok(
        content.includes('-translate-x-full'),
        'VocabularyDrawer must use -translate-x-full for left slide transition'
      )
      assert.ok(
        content.includes('border-r border-[#e8ddd0]'),
        'VocabularyDrawer must use border-r border-[#e8ddd0]'
      )
    })

    test('VocabularyDrawer hides backdrop on desktop and supports in-flow teleport', () => {
      const content = readComponent('src/components/VocabularyDrawer.vue')
      assert.ok(
        content.includes('lg:hidden') || content.includes('hidden lg:hidden'),
        'VocabularyDrawer backdrop must be hidden on desktop (lg:hidden)'
      )
      assert.ok(
        content.includes(':disabled="isDesktop"') || content.includes(':disabled="isDesktopView"'),
        'VocabularyDrawer Teleport must be disabled on desktop for in-flow sub-sidebar'
      )
    })

    test('VocabularyDrawer maintains Apple HIG touch targets and zero emojis', () => {
      const content = readComponent('src/components/VocabularyDrawer.vue')
      assert.ok(content.includes('min-h-[44px]'), 'Must enforce min-h-[44px]')
      assert.ok(content.includes('touch-manipulation'), 'Must include touch-manipulation')
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
      assert.ok(!emojiRegex.test(content), 'VocabularyDrawer must contain zero Unicode emojis')
    })
  })

  describe('2. BookshelfDrawer left positioning & desktop sub-sidebar', () => {
    test('BookshelfDrawer slides in from the left and has right border', () => {
      const content = readComponent('src/components/BookshelfDrawer.vue')
      assert.ok(content.includes('left-0'), 'BookshelfDrawer must use left-0 positioning')
      assert.ok(!content.includes('right-0'), 'BookshelfDrawer must not use right-0 positioning')
      assert.ok(
        content.includes('-translate-x-full'),
        'BookshelfDrawer must use -translate-x-full for left slide transition'
      )
      assert.ok(
        content.includes('border-r border-[#e8ddd0]'),
        'BookshelfDrawer must use border-r border-[#e8ddd0]'
      )
    })

    test('BookshelfDrawer hides backdrop on desktop and supports in-flow teleport', () => {
      const content = readComponent('src/components/BookshelfDrawer.vue')
      assert.ok(
        content.includes('lg:hidden') || content.includes('hidden lg:hidden'),
        'BookshelfDrawer backdrop must be hidden on desktop (lg:hidden)'
      )
      assert.ok(
        content.includes(':disabled="isDesktop"') || content.includes(':disabled="isDesktopView"'),
        'BookshelfDrawer Teleport must be disabled on desktop for in-flow sub-sidebar'
      )
    })

    test('BookshelfDrawer maintains Apple HIG touch targets and zero emojis', () => {
      const content = readComponent('src/components/BookshelfDrawer.vue')
      assert.ok(content.includes('min-h-[44px]'), 'Must enforce min-h-[44px]')
      assert.ok(content.includes('touch-manipulation'), 'Must include touch-manipulation')
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
      assert.ok(!emojiRegex.test(content), 'BookshelfDrawer must contain zero Unicode emojis')
    })
  })

  describe('3. AppShell layout integration', () => {
    test('AppShell embeds BookshelfDrawer and VocabularyDrawer in middle flex between sidebar and main', () => {
      const content = readComponent('src/components/layout/AppShell.vue')
      const sidebarIdx = content.indexOf('<DesktopSidebarVue')
      const bookshelfIdx = content.indexOf('<BookshelfDrawer')
      const vocabIdx = content.indexOf('<VocabularyDrawer')
      const mainIdx = content.indexOf('<main')

      assert.ok(sidebarIdx !== -1, 'AppShell must contain DesktopSidebarVue')
      assert.ok(bookshelfIdx !== -1, 'AppShell must contain BookshelfDrawer')
      assert.ok(vocabIdx !== -1, 'AppShell must contain VocabularyDrawer')
      assert.ok(mainIdx !== -1, 'AppShell must contain main')

      assert.ok(
        sidebarIdx < bookshelfIdx && bookshelfIdx < mainIdx,
        'BookshelfDrawer must be positioned between DesktopSidebarVue and main'
      )
      assert.ok(
        sidebarIdx < vocabIdx && vocabIdx < mainIdx,
        'VocabularyDrawer must be positioned between DesktopSidebarVue and main'
      )
    })
  })
})
