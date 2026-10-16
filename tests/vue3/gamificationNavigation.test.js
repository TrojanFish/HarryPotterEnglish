import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { register } from 'node:module'
import { parse } from 'vue/compiler-sfc'

// Register Vue loader for dynamic ESM import support in Node test runner
register('./vue-loader.js', import.meta.url)

describe('Task 6: Navigation & Gamification Touchpoints Tests', () => {
  const desktopSidebarPath = path.resolve('src/components/navigation/DesktopSidebarVue.vue')
  const tabletRailPath = path.resolve('src/components/navigation/TabletRailVue.vue')
  const mobileTopBarPath = path.resolve('src/components/navigation/MobileTopBarVue.vue')
  const appShellPath = path.resolve('src/components/layout/AppShell.vue')

  it('DesktopSidebarVue.vue imports useGamificationStore and declares open-house-cup / open-badges emits', () => {
    assert.ok(fs.existsSync(desktopSidebarPath), 'DesktopSidebarVue.vue must exist')
    const source = fs.readFileSync(desktopSidebarPath, 'utf-8')
    const { descriptor, errors } = parse(source)
    assert.strictEqual(errors.length, 0, 'DesktopSidebarVue SFC parsing must have 0 errors')

    assert.ok(source.includes('useGamificationStore'), 'DesktopSidebarVue must import useGamificationStore')
    assert.ok(source.includes('open-house-cup'), 'DesktopSidebarVue must declare and handle open-house-cup emit')
    assert.ok(source.includes('open-badges'), 'DesktopSidebarVue must declare and handle open-badges emit')
    assert.ok(source.includes('currentHouseInfo'), 'DesktopSidebarVue should access currentHouseInfo from gamificationStore')
  })

  it('TabletRailVue.vue imports useGamificationStore and emits open-house-cup / open-badges', () => {
    assert.ok(fs.existsSync(tabletRailPath), 'TabletRailVue.vue must exist')
    const source = fs.readFileSync(tabletRailPath, 'utf-8')
    const { descriptor, errors } = parse(source)
    assert.strictEqual(errors.length, 0, 'TabletRailVue SFC parsing must have 0 errors')

    assert.ok(source.includes('useGamificationStore'), 'TabletRailVue must import useGamificationStore')
    assert.ok(source.includes('open-house-cup'), 'TabletRailVue must declare and emit open-house-cup')
    assert.ok(source.includes('open-badges'), 'TabletRailVue must declare and emit open-badges')
  })

  it('MobileTopBarVue.vue imports useGamificationStore, renders Flame streak pill, and emits open-house-cup', () => {
    assert.ok(fs.existsSync(mobileTopBarPath), 'MobileTopBarVue.vue must exist')
    const source = fs.readFileSync(mobileTopBarPath, 'utf-8')
    const { descriptor, errors } = parse(source)
    assert.strictEqual(errors.length, 0, 'MobileTopBarVue SFC parsing must have 0 errors')

    assert.ok(source.includes('useGamificationStore'), 'MobileTopBarVue must import useGamificationStore')
    assert.ok(source.includes('Flame'), 'MobileTopBarVue must import and use Flame icon')
    assert.ok(source.includes('open-house-cup'), 'MobileTopBarVue must declare and emit open-house-cup')
  })

  it('AppShell.vue imports and mounts HouseCupModal, AchievementBadgesModal, SortingCeremonyModal, and wires event handlers', () => {
    assert.ok(fs.existsSync(appShellPath), 'AppShell.vue must exist')
    const source = fs.readFileSync(appShellPath, 'utf-8')
    const { descriptor, errors } = parse(source)
    assert.strictEqual(errors.length, 0, 'AppShell SFC parsing must have 0 errors')

    assert.ok(source.includes('HouseCupModal'), 'AppShell must import and mount HouseCupModal')
    assert.ok(source.includes('AchievementBadgesModal'), 'AppShell must import and mount AchievementBadgesModal')
    assert.ok(source.includes('SortingCeremonyModal'), 'AppShell must import and mount SortingCeremonyModal')
    assert.ok(source.includes('useGamificationStore'), 'AppShell must import useGamificationStore')

    // Event wiring checks
    assert.ok(source.includes('@open-house-cup="openHouseCup"'), 'AppShell must wire @open-house-cup on navigation components')
    assert.ok(source.includes('@open-badges="openBadges"'), 'AppShell must wire @open-badges on navigation components')
    assert.ok(source.includes('isHouseCupOpen'), 'AppShell must manage isHouseCupOpen state')
    assert.ok(source.includes('isBadgesOpen'), 'AppShell must manage isBadgesOpen state')
    assert.ok(source.includes('isSortingOpen'), 'AppShell must manage isSortingOpen state')
  })

  it('enforces zero Unicode emojis across all four navigation & shell files', () => {
    const files = [desktopSidebarPath, tabletRailPath, mobileTopBarPath, appShellPath]
    const emojiRegex = /\p{Extended_Pictographic}/gu

    for (const file of files) {
      const source = fs.readFileSync(file, 'utf-8')
      const matches = source.match(emojiRegex)
      assert.strictEqual(matches, null, `File ${path.basename(file)} must contain zero Unicode emojis`)
    }
  })

  it('enforces Apple HIG min 44x44px touch targets and touch-manipulation on gamification triggers', () => {
    const files = [desktopSidebarPath, tabletRailPath, mobileTopBarPath]
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf-8')
      assert.ok(source.includes('touch-manipulation'), `${path.basename(file)} must enforce touch-manipulation`)
      assert.ok(source.includes('min-h-[44px]') || source.includes('h-11') || source.includes('min-w-[44px]') || source.includes('w-11'), `${path.basename(file)} must enforce Apple HIG 44px min dimensions`)
    }
  })
})
