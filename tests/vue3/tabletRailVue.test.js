import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { register } from 'node:module'
import { parse } from 'vue/compiler-sfc'

// Register Vue loader for dynamic ESM import support in Node test runner
register('./vue-loader.js', import.meta.url)

describe('TabletRailVue Component Tests', () => {
  // Step 1 requirement from brief: exports default component
  it('TabletRailVue.vue exports default', async () => {
    const mod = await import('../src/components/navigation/TabletRailVue.vue')
    assert.ok(mod.default, 'default export must exist')
  })

  it('TabletRailVue.vue is a valid Vue 3 SFC', () => {
    const filePath = path.resolve('src/components/navigation/TabletRailVue.vue')
    assert.ok(fs.existsSync(filePath), 'TabletRailVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    const { descriptor, errors } = parse(source)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  it('enforces zero Unicode emojis and uses lucide-vue-next icons', () => {
    const filePath = path.resolve('src/components/navigation/TabletRailVue.vue')
    assert.ok(fs.existsSync(filePath), 'TabletRailVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    const emojiRegex = /\p{Extended_Pictographic}/gu
    const emojiMatches = source.match(emojiRegex)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')

    assert.ok(source.includes('lucide-vue-next'), 'Must import icons from lucide-vue-next')
    assert.ok(!source.includes('lucide-react'), 'Must not import from lucide-react')
    assert.ok(source.includes('Sparkles'), 'Must use Sparkles icon for brand')
    assert.ok(source.includes('Headphones'), 'Must use Headphones icon for player_reader')
    assert.ok(source.includes('Library'), 'Must use Library icon for bookshelf')
    assert.ok(source.includes('Video'), 'Must use Video icon for ted')
    assert.ok(source.includes('EyeOff'), 'Must use EyeOff icon for player_blind')
    assert.ok(source.includes('Zap'), 'Must use Zap icon for player_dictation')
    assert.ok(source.includes('Bookmark'), 'Must use Bookmark icon for vocab')
    assert.ok(source.includes('BarChart2'), 'Must use BarChart2 icon for analytics')
    assert.ok(source.includes('HardDrive'), 'Must use HardDrive icon for storage')
    assert.ok(source.includes('Flame'), 'Must use Flame icon for streak badge')
  })

  it('enforces 64px container layout and responsive visibility', () => {
    const filePath = path.resolve('src/components/navigation/TabletRailVue.vue')
    assert.ok(fs.existsSync(filePath), 'TabletRailVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('hidden md:flex lg:hidden'), 'Must be visible on tablet only (hidden md:flex lg:hidden)')
    assert.ok(source.includes('w-16'), 'Must enforce 64px fixed-width rail (w-16)')
    assert.ok(source.includes('shrink-0'), 'Must have shrink-0')
    assert.ok(source.includes('border-r border-[#e8ddd0]'), 'Must have parchment right border border-[#e8ddd0]')
    assert.ok(source.includes('bg-[#fbf9f5]'), 'Must have parchment background #fbf9f5')
    assert.ok(source.includes('h-full'), 'Must take full container height h-full')
  })

  it('configures 8 icon navigation items and top brand icon', () => {
    const filePath = path.resolve('src/components/navigation/TabletRailVue.vue')
    assert.ok(fs.existsSync(filePath), 'TabletRailVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('bookshelf'), 'Must define bookshelf item')
    assert.ok(source.includes('ted'), 'Must define ted item')
    assert.ok(source.includes('player_reader'), 'Must define player_reader item')
    assert.ok(source.includes('player_blind'), 'Must define player_blind item')
    assert.ok(source.includes('player_dictation'), 'Must define player_dictation item')
    assert.ok(source.includes('vocab'), 'Must define vocab item')
    assert.ok(source.includes('analytics'), 'Must define analytics item')
    assert.ok(source.includes('storage'), 'Must define storage item')

    // Brand icon
    assert.ok(source.includes('w-10 h-10 rounded-2xl bg-amber-500'), 'Brand icon must be w-10 h-10 rounded-2xl bg-amber-500')
  })

  it('enforces touch targets (>= 44x44px) and active/inactive button styles', () => {
    const filePath = path.resolve('src/components/navigation/TabletRailVue.vue')
    assert.ok(fs.existsSync(filePath), 'TabletRailVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('w-11 h-11'), 'Must specify 44x44px touch button target (w-11 h-11)')
    assert.ok(source.includes('rounded-2xl'), 'Must have rounded-2xl')
    assert.ok(source.includes('touch-manipulation'), 'Must include touch-manipulation')
    assert.ok(source.includes('active:scale-95'), 'Must include active:scale-95 feedback')
    assert.ok(source.includes('bg-amber-500 text-white border border-amber-600'), 'Must include active state styling')
    assert.ok(
      source.includes('text-stone-500 hover:text-amber-950 hover:bg-white border border-transparent hover:border-[#e8ddd0]'),
      'Must include inactive state styling'
    )
  })

  it('renders bottom Flame streak badge with text-[11px] font-mono', () => {
    const filePath = path.resolve('src/components/navigation/TabletRailVue.vue')
    assert.ok(fs.existsSync(filePath), 'TabletRailVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('text-[11px]'), 'Must format streak badge with text-[11px]')
    assert.ok(source.includes('font-mono'), 'Must use font-mono for streak badge')
    assert.ok(source.includes('text-orange-600'), 'Must use text-orange-600 for streak badge')
    assert.ok(source.includes('Flame'), 'Must render Flame icon for streak badge')
    assert.ok(source.includes('min-w-[44px] min-h-[44px]'), 'Must enforce min-w-[44px] min-h-[44px] touch target on streak button')
  })

  it('consumes stores and exposes required emits and props', () => {
    const filePath = path.resolve('src/components/navigation/TabletRailVue.vue')
    assert.ok(fs.existsSync(filePath), 'TabletRailVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('useNavigationStore'), 'Must consume useNavigationStore')
    assert.ok(source.includes('useVocabStore'), 'Must consume useVocabStore')
    assert.ok(source.includes('useAnalyticsStore'), 'Must consume useAnalyticsStore')
    assert.ok(source.includes('streakDays'), 'Must access streakDays')
    assert.ok(source.includes('vocabCount') || source.includes('vocabList'), 'Must access vocab count')
    assert.ok(source.includes('change-view'), 'Must declare/emit change-view')
    assert.ok(source.includes('change-study-mode'), 'Must declare/emit change-study-mode')
  })
})
