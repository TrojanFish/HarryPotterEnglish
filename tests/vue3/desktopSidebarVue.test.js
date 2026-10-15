import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { register } from 'node:module'
import { parse } from 'vue/compiler-sfc'

// Register Vue loader for dynamic ESM import support in Node test runner
register('./vue-loader.js', import.meta.url)

describe('DesktopSidebarVue Component Tests', () => {
  // Step 1 requirement: exports default component
  it('DesktopSidebarVue.vue exports default', async () => {
    const mod = await import('../src/components/navigation/DesktopSidebarVue.vue')
    assert.ok(mod.default, 'default export must exist')
  })

  it('DesktopSidebarVue.vue is a valid Vue 3 SFC', () => {
    const filePath = path.resolve('src/components/navigation/DesktopSidebarVue.vue')
    assert.ok(fs.existsSync(filePath), 'DesktopSidebarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    const { descriptor, errors } = parse(source)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  it('enforces zero Unicode emojis and uses lucide-vue-next icons', () => {
    const filePath = path.resolve('src/components/navigation/DesktopSidebarVue.vue')
    assert.ok(fs.existsSync(filePath), 'DesktopSidebarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    const emojiRegex = /\p{Extended_Pictographic}/gu
    const emojiMatches = source.match(emojiRegex)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')

    assert.ok(source.includes('lucide-vue-next'), 'Must import icons from lucide-vue-next')
    assert.ok(!source.includes('lucide-react'), 'Must not import from lucide-react')
    assert.ok(source.includes('Sparkles'), 'Must use Sparkles icon for brand')
    assert.ok(source.includes('Library'), 'Must use Library icon for bookshelf')
    assert.ok(source.includes('Video'), 'Must use Video icon for ted')
    assert.ok(source.includes('Headphones'), 'Must use Headphones icon for player_reader')
    assert.ok(source.includes('EyeOff'), 'Must use EyeOff icon for player_blind')
    assert.ok(source.includes('Zap'), 'Must use Zap icon for player_dictation')
    assert.ok(source.includes('Bookmark'), 'Must use Bookmark icon for vocab')
    assert.ok(source.includes('BarChart2'), 'Must use BarChart2 icon for analytics')
    assert.ok(source.includes('HardDrive'), 'Must use HardDrive icon for storage')
    assert.ok(source.includes('PanelLeftClose'), 'Must use PanelLeftClose icon for expanded collapse toggle')
    assert.ok(source.includes('PanelLeftOpen'), 'Must use PanelLeftOpen icon for collapsed expand toggle')
    assert.ok(source.includes('Flame'), 'Must use Flame icon for habit streak')
    assert.ok(source.includes('Scale'), 'Must use Scale icon for legal link')
  })

  it('enforces 240px / 72px container layout and responsive visibility', () => {
    const filePath = path.resolve('src/components/navigation/DesktopSidebarVue.vue')
    assert.ok(fs.existsSync(filePath), 'DesktopSidebarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('hidden lg:flex'), 'Must be visible on desktop (hidden lg:flex)')
    assert.ok(source.includes('border-r border-[#e8ddd0]'), 'Must have border-r border-[#e8ddd0]')
    assert.ok(source.includes('bg-[#fbf9f5]'), 'Must have background bg-[#fbf9f5]')
    assert.ok(source.includes('w-60'), 'Must support 240px expanded width (w-60)')
    assert.ok(source.includes('w-18'), 'Must support 72px collapsed width (w-18)')
    assert.ok(source.includes('h-full'), 'Must take full container height h-full')
    assert.ok(source.includes('overflow-y-auto'), 'Must support overflow-y-auto')
  })

  it('renders brand row with Sparkles, h1 霍格沃茨英语, and collapse toggle buttons', () => {
    const filePath = path.resolve('src/components/navigation/DesktopSidebarVue.vue')
    assert.ok(fs.existsSync(filePath), 'DesktopSidebarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('霍格沃茨英语'), 'Must include 霍格沃茨英语 brand text')
    assert.ok(source.includes('font-magical font-bold text-base text-amber-950'), 'Brand heading must match design typography')
    assert.ok(source.includes('PanelLeftClose'), 'Must include PanelLeftClose toggle button')
    assert.ok(source.includes('PanelLeftOpen'), 'Must include PanelLeftOpen toggle button')
  })

  it('configures 8 navigation items with K12 text-sm font-bold labels', () => {
    const filePath = path.resolve('src/components/navigation/DesktopSidebarVue.vue')
    assert.ok(fs.existsSync(filePath), 'DesktopSidebarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('bookshelf'), 'Must define bookshelf item')
    assert.ok(source.includes('ted'), 'Must define ted item')
    assert.ok(source.includes('player_reader'), 'Must define player_reader item')
    assert.ok(source.includes('player_blind'), 'Must define player_blind item')
    assert.ok(source.includes('player_dictation'), 'Must define player_dictation item')
    assert.ok(source.includes('vocab'), 'Must define vocab item')
    assert.ok(source.includes('analytics'), 'Must define analytics item')
    assert.ok(source.includes('storage'), 'Must define storage item')

    // Expanded vs collapsed item styles from brief
    assert.ok(source.includes('text-sm font-bold'), 'Expanded items must use text-sm font-bold for K12 readability')
    assert.ok(source.includes('px-3.5 py-2.5 rounded-2xl'), 'Expanded items must use px-3.5 py-2.5 rounded-2xl')
    assert.ok(source.includes('w-11 h-11 rounded-2xl'), 'Collapsed items must use w-11 h-11 rounded-2xl')
  })

  it('renders bottom widgets: habit ring card, sync dot, legal link, and compact streak flame', () => {
    const filePath = path.resolve('src/components/navigation/DesktopSidebarVue.vue')
    assert.ok(fs.existsSync(filePath), 'DesktopSidebarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('goalPercent'), 'Must compute goalPercent for habit progress')
    assert.ok(source.includes('Flame'), 'Must render streak days with Flame icon')
    assert.ok(source.includes('bg-emerald-500'), 'Must render sync dot with bg-emerald-500')
    assert.ok(source.includes('Scale'), 'Must render legal entry with Scale icon')
  })

  it('consumes stores and exposes required emits and props', () => {
    const filePath = path.resolve('src/components/navigation/DesktopSidebarVue.vue')
    assert.ok(fs.existsSync(filePath), 'DesktopSidebarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('useNavigationStore'), 'Must consume useNavigationStore')
    assert.ok(source.includes('useVocabStore'), 'Must consume useVocabStore')
    assert.ok(source.includes('useAnalyticsStore'), 'Must consume useAnalyticsStore')
    assert.ok(source.includes('toggleCollapsed'), 'Must handle toggleCollapsed')
    assert.ok(source.includes('change-view'), 'Must emit change-view')
    assert.ok(source.includes('change-study-mode'), 'Must emit change-study-mode')
  })

  it('enforces touch targets (>= 44x44px) and active feedback', () => {
    const filePath = path.resolve('src/components/navigation/DesktopSidebarVue.vue')
    assert.ok(fs.existsSync(filePath), 'DesktopSidebarVue.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    assert.ok(source.includes('touch-manipulation'), 'Must include touch-manipulation')
    assert.ok(source.includes('active:scale-95'), 'Must include active:scale-95 feedback')
    assert.ok(source.includes('min-h-[44px]') || source.includes('w-11 h-11'), 'Must enforce minimum touch targets')
  })
})
