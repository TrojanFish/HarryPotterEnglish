import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { register } from 'node:module'
import { parse } from 'vue/compiler-sfc'

// Register Vue loader for dynamic ESM import support in Node test runner
register('./vue-loader.js', import.meta.url)

describe('MobileBottomNavVue Component Tests', () => {
  // Step 1 requirement from brief: exports default component
  it('MobileBottomNavVue.vue exports default', async () => {
    const mod = await import('../src/components/navigation/MobileBottomNavVue.vue')
    assert.ok(mod.default, 'default export must exist')
  })

  it('MobileBottomNavVue.vue is a valid Vue 3 SFC', () => {
    const filePath = path.resolve('src/components/navigation/MobileBottomNavVue.vue')
    assert.ok(fs.existsSync(filePath), 'MobileBottomNavVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    const { descriptor, errors } = parse(source)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  it('enforces zero Unicode emojis and uses lucide-vue-next icons', () => {
    const filePath = path.resolve('src/components/navigation/MobileBottomNavVue.vue')
    assert.ok(fs.existsSync(filePath), 'MobileBottomNavVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    const emojiRegex = /\p{Extended_Pictographic}/gu
    const emojiMatches = source.match(emojiRegex)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')

    assert.ok(source.includes('lucide-vue-next'), 'Must import icons from lucide-vue-next')
    assert.ok(!source.includes('lucide-react'), 'Must not import from lucide-react')
    assert.ok(source.includes('Library'), 'Must use Library icon for bookshelf')
    assert.ok(source.includes('Video'), 'Must use Video icon for TED')
    assert.ok(source.includes('Bookmark'), 'Must use Bookmark icon for vocab')
    assert.ok(source.includes('BarChart2'), 'Must use BarChart2 icon for analytics')
    assert.ok(source.includes('HardDrive'), 'Must use HardDrive icon for storage')
  })

  it('enforces K12 touch target ergonomics and button styling', () => {
    const filePath = path.resolve('src/components/navigation/MobileBottomNavVue.vue')
    assert.ok(fs.existsSync(filePath), 'MobileBottomNavVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('min-h-[44px]'), 'Must enforce minimum touch height of 44px')
    assert.ok(source.includes('py-2'), 'Must pad touch target to py-2 ensuring >= 44px total height')
    assert.ok(source.includes('text-[11px]'), 'Must use K12 legible label text-11px')
    assert.ok(source.includes('font-bold'), 'Must use font-bold for label text')
    assert.ok(source.includes('touch-manipulation'), 'Must include touch-manipulation class')
    assert.ok(source.includes(':size="22"') || source.includes('size="22"'), 'Must specify icon size of 22px')
  })

  it('enforces container positioning, safe area, and parchment palette', () => {
    const filePath = path.resolve('src/components/navigation/MobileBottomNavVue.vue')
    assert.ok(fs.existsSync(filePath), 'MobileBottomNavVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('md:hidden'), 'Must hide on desktop/tablet md:hidden')
    assert.ok(source.includes('fixed bottom-0 inset-x-0 z-30'), 'Must be fixed at bottom inset-x-0 z-30')
    assert.ok(source.includes('bg-[#fbf9f5]'), 'Must use parchment background #fbf9f5')
    assert.ok(source.includes('border-t border-[#e8ddd0]'), 'Must use parchment border #e8ddd0')
    assert.ok(source.includes('flex items-stretch'), 'Must use flex items-stretch for tabs')
    assert.ok(source.includes('env(safe-area-inset-bottom)'), 'Must include padding-bottom: env(safe-area-inset-bottom)')
    assert.ok(source.includes('box-sizing: content-box'), 'Must include box-sizing: content-box for safe area')
  })

  it('defines 5 canonical tabs (书架, TED, 生词本, 学情, 离线)', () => {
    const filePath = path.resolve('src/components/navigation/MobileBottomNavVue.vue')
    assert.ok(fs.existsSync(filePath), 'MobileBottomNavVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('书架'), 'Must contain tab label 书架')
    assert.ok(source.includes('TED'), 'Must contain tab label TED')
    assert.ok(source.includes('生词本'), 'Must contain tab label 生词本')
    assert.ok(source.includes('学情'), 'Must contain tab label 学情')
    assert.ok(source.includes('离线'), 'Must contain tab label 离线')
  })

  it('integrates navigationStore and reflects active tab styling', () => {
    const filePath = path.resolve('src/components/navigation/MobileBottomNavVue.vue')
    assert.ok(fs.existsSync(filePath), 'MobileBottomNavVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('useNavigationStore'), 'Must consume useNavigationStore')
    assert.ok(source.includes('currentView'), 'Must inspect currentView')
    assert.ok(source.includes('setView'), 'Must call setView on tab click')
    assert.ok(source.includes('bg-amber-500/15'), 'Must style active tab with bg-amber-500/15')
    assert.ok(source.includes('text-amber-700'), 'Must style active tab with text-amber-700')
    assert.ok(source.includes('text-stone-500'), 'Must style inactive tab with text-stone-500')
  })
})
