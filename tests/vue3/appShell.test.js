import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { register } from 'node:module'
import { parse } from 'vue/compiler-sfc'

// Register Vue loader for dynamic ESM import support in Node test runner
register('./vue-loader.js', import.meta.url)

describe('AppShell and useBreakpointVue Unit & Integration Tests', () => {
  it('AppShell.vue exports default component', async () => {
    const mod = await import('../src/components/layout/AppShell.vue')
    assert.ok(mod.default, 'AppShell.vue default export must exist')
  })

  it('useBreakpointVue composable exports isMobile/isTablet/isDesktop', async () => {
    const mod = await import('../../src/utils/useBreakpointVue.js')
    assert.equal(typeof mod.useBreakpointVue, 'function')
    
    // Invoke composable and check returns
    const bp = mod.useBreakpointVue()
    assert.ok(bp.windowWidth, 'windowWidth ref must exist')
    assert.equal(typeof bp.isMobile, 'function')
    assert.equal(typeof bp.isTablet, 'function')
    assert.equal(typeof bp.isDesktop, 'function')
    
    // In node test env with default 1200px width
    assert.equal(bp.isDesktop(), true)
    assert.equal(bp.isTablet(), false)
    assert.equal(bp.isMobile(), false)
    assert.equal(bp.isDesktop.value, true)
    assert.equal(bp.isTablet.value, false)
    assert.equal(bp.isMobile.value, false)
  })

  it('AppShell.vue is a valid Vue 3 SFC', () => {
    const filePath = path.resolve('src/components/layout/AppShell.vue')
    assert.ok(fs.existsSync(filePath), 'AppShell.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    const { descriptor, errors } = parse(source)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  it('enforces zero Unicode emojis in AppShell.vue and useBreakpointVue.js', () => {
    const appShellPath = path.resolve('src/components/layout/AppShell.vue')
    const bpPath = path.resolve('src/utils/useBreakpointVue.js')

    const appShellSource = fs.readFileSync(appShellPath, 'utf-8')
    const bpSource = fs.readFileSync(bpPath, 'utf-8')
    const emojiRegex = /\p{Extended_Pictographic}/gu

    assert.strictEqual(appShellSource.match(emojiRegex), null, 'AppShell.vue must contain zero emojis')
    assert.strictEqual(bpSource.match(emojiRegex), null, 'useBreakpointVue.js must contain zero emojis')
  })

  it('AppShell.vue composes three-device navigation tiers and main slot', () => {
    const filePath = path.resolve('src/components/layout/AppShell.vue')
    const source = fs.readFileSync(filePath, 'utf-8')

    // Mobile top bar: hidden on md and up
    assert.ok(source.includes('MobileTopBarVue'), 'Must include MobileTopBarVue')
    assert.ok(source.includes('md:hidden'), 'Mobile components must be hidden on md and up')

    // Tablet rail: hidden md:flex lg:hidden
    assert.ok(source.includes('TabletRailVue'), 'Must include TabletRailVue')

    // Desktop sidebar: hidden lg:flex
    assert.ok(source.includes('DesktopSidebarVue'), 'Must include DesktopSidebarVue')

    // Main content slot
    assert.ok(source.includes('<slot />') || source.includes('<slot/>') || source.includes('<slot'), 'Must provide default slot for content')
    assert.ok(source.includes('flex-1 min-w-0 overflow-hidden relative flex flex-col'), 'Main element must have flex-1 layout')

    // Mobile bottom nav: hidden on md and up
    assert.ok(source.includes('MobileBottomNavVue'), 'Must include MobileBottomNavVue')

    // SmartAudioPlayer at bottom
    assert.ok(source.includes('SmartAudioPlayer'), 'Must include SmartAudioPlayer')

    // StepTabBar (HP session flow)
    assert.ok(source.includes('StepTabBar'), 'Must include StepTabBar')
  })

  it('AppShell.vue integrates all drawers and modals with navigation state', () => {
    const filePath = path.resolve('src/components/layout/AppShell.vue')
    const source = fs.readFileSync(filePath, 'utf-8')

    assert.ok(source.includes('BookshelfDrawer'), 'Must include BookshelfDrawer')
    assert.ok(source.includes('VocabularyDrawer'), 'Must include VocabularyDrawer')
    assert.ok(source.includes('AnalyticsDashboard'), 'Must include AnalyticsDashboard')
    assert.ok(source.includes('StorageManagerModal'), 'Must include StorageManagerModal')
    assert.ok(source.includes('ShortcutsModal'), 'Must include ShortcutsModal')
  })

  it('AppShell.vue includes accessible audio error notice banner', () => {
    const filePath = path.resolve('src/components/layout/AppShell.vue')
    const source = fs.readFileSync(filePath, 'utf-8')

    assert.ok(source.includes('audioError'), 'Must bind to player.audioError')
    assert.ok(source.includes('AlertCircle'), 'Must use AlertCircle icon')
    assert.ok(source.includes('min-h-[44px] min-w-[44px]') || source.includes('min-h-[44px]'), 'Error close button must satisfy 44px touch target')
  })

  it('AppShell.vue uses parchment design palette', () => {
    const filePath = path.resolve('src/components/layout/AppShell.vue')
    const source = fs.readFileSync(filePath, 'utf-8')

    assert.ok(source.includes('#fbf9f5'), 'Must use warm parchment base background #fbf9f5')
  })
})
