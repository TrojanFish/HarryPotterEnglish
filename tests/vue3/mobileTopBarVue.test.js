import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { register } from 'node:module'
import { parse } from 'vue/compiler-sfc'

// Register Vue loader for dynamic ESM import support in Node test runner
register('./vue-loader.js', import.meta.url)

describe('MobileTopBarVue Component Tests', () => {
  // Step 1 requirement from brief: exports default component
  it('MobileTopBarVue.vue exports default component', async () => {
    const mod = await import('../src/components/navigation/MobileTopBarVue.vue')
    assert.ok(mod.default, 'default export must exist')
  })

  it('MobileTopBarVue.vue is a valid Vue 3 SFC', () => {
    const filePath = path.resolve('src/components/navigation/MobileTopBarVue.vue')
    assert.ok(fs.existsSync(filePath), 'MobileTopBarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    const { descriptor, errors } = parse(source)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  it('enforces zero Unicode emojis and uses lucide-vue-next', () => {
    const filePath = path.resolve('src/components/navigation/MobileTopBarVue.vue')
    assert.ok(fs.existsSync(filePath), 'MobileTopBarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    const emojiRegex = /\p{Extended_Pictographic}/gu
    const emojiMatches = source.match(emojiRegex)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')

    assert.ok(source.includes('lucide-vue-next'), 'Must import icons from lucide-vue-next')
    assert.ok(!source.includes('lucide-react'), 'Must not import from lucide-react')
    assert.ok(source.includes('Sparkles'), 'Must use Sparkles icon')
    assert.ok(source.includes('BookMarked'), 'Must use BookMarked icon')
    assert.ok(source.includes('BarChart2'), 'Must use BarChart2 icon')
    assert.ok(source.includes('HardDrive'), 'Must use HardDrive icon')
  })

  it('enforces Apple HIG touch targets (>= 44x44px) and touch-manipulation', () => {
    const filePath = path.resolve('src/components/navigation/MobileTopBarVue.vue')
    assert.ok(fs.existsSync(filePath), 'MobileTopBarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('min-h-[44px]'), 'Must enforce minimum touch height of 44px')
    assert.ok(source.includes('min-w-[44px]'), 'Must enforce minimum touch width of 44px for icon buttons')
    assert.ok(source.includes('touch-manipulation'), 'Must use Tailwind touch-manipulation utility')
    assert.ok(!source.includes('touch-action-manipulation'), 'Must not use non-standard touch-action-manipulation')
    assert.ok(source.includes('py-0.5'), 'Badge must use standard py-0.5 padding')
  })

  it('enforces K12 brand typography and hides subtitle on mobile', () => {
    const filePath = path.resolve('src/components/navigation/MobileTopBarVue.vue')
    assert.ok(fs.existsSync(filePath), 'MobileTopBarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('font-magical'), 'Brand text must use font-magical')
    assert.ok(source.includes('font-bold'), 'Brand text must use font-bold')
    assert.ok(source.includes('text-base'), 'Brand text must be enlarged to text-base for K12')
    assert.ok(source.includes('text-amber-950'), 'Brand text must use text-amber-950')
    assert.ok(source.includes('霍格沃茨英语'), 'Brand title must be 霍格沃茨英语')
    assert.ok(!source.includes('原版有声书精听'), 'Subtitle must be hidden on mobile to conserve chrome height')
  })

  it('enforces safe-area inset top and parchment styling', () => {
    const filePath = path.resolve('src/components/navigation/MobileTopBarVue.vue')
    assert.ok(fs.existsSync(filePath), 'MobileTopBarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('env(safe-area-inset-top)'), 'Must include padding-top: env(safe-area-inset-top)')
    assert.ok(source.includes('#fbf9f5'), 'Must use warm parchment background #fbf9f5')
    assert.ok(source.includes('#e8ddd0'), 'Must use parchment border #e8ddd0')
    assert.ok(!source.includes('shadow-lg') && !source.includes('shadow-xl'), 'Must follow flat shadow-free rule')
  })

  it('integrates navigation and vocab stores and declares required emits', () => {
    const filePath = path.resolve('src/components/navigation/MobileTopBarVue.vue')
    assert.ok(fs.existsSync(filePath), 'MobileTopBarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('useNavigationStore'), 'Must consume useNavigationStore')
    assert.ok(source.includes('useVocabStore'), 'Must consume useVocabStore')
    assert.ok(source.includes('open-chapter-drawer'), 'Must declare/emit open-chapter-drawer')
    assert.ok(source.includes('open-vocab'), 'Must declare/emit open-vocab')
    assert.ok(source.includes('open-analytics'), 'Must declare/emit open-analytics')
    assert.ok(source.includes('open-storage'), 'Must declare/emit open-storage')
  })
})
