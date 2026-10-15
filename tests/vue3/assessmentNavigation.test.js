// tests/vue3/assessmentNavigation.test.js
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Assessment Navigation Integration', () => {
  test('navigationStore supports assessment view', () => {
    const navContent = fs.readFileSync(path.resolve('src/stores/navigationStore.js'), 'utf-8')
    assert.ok(navContent.includes('assessment'), 'navigationStore must reference assessment view')
  })

  test('Navigation components include assessment item with Award icon', () => {
    const desktop = fs.readFileSync(path.resolve('src/components/navigation/DesktopSidebarVue.vue'), 'utf-8')
    assert.ok(desktop.includes('assessment') && desktop.includes('Award'), 'DesktopSidebar must include assessment view and Award icon')

    const tablet = fs.readFileSync(path.resolve('src/components/navigation/TabletRailVue.vue'), 'utf-8')
    assert.ok(tablet.includes('assessment') && tablet.includes('Award'), 'TabletRail must include assessment view and Award icon')

    const mobile = fs.readFileSync(path.resolve('src/components/navigation/MobileBottomNavVue.vue'), 'utf-8')
    assert.ok(mobile.includes('assessment') && mobile.includes('Award'), 'MobileBottomNav must include assessment view and Award icon')
  })

  test('AppShell imports and renders AssessmentHub', () => {
    const shell = fs.readFileSync(path.resolve('src/components/layout/AppShell.vue'), 'utf-8')
    assert.ok(shell.includes('assessment'), 'AppShell must handle assessment view')
    assert.ok(shell.includes('AssessmentHub'), 'AppShell must reference AssessmentHub')
    assert.ok(shell.includes("navStore.currentView === 'assessment'"), 'AppShell must use navStore directly')
    assert.ok(!shell.includes('const navigationStore = navStore'), 'AppShell must not have redundant navigationStore alias')
  })
})
