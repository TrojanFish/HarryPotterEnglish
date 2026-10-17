import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

describe('P2: AppShell Slimming with useModalManager and Unified Workshop Standards', () => {
  it('AppShell.vue imports and integrates useModalManager', () => {
    const filePath = path.resolve('src/components/layout/AppShell.vue')
    const source = fs.readFileSync(filePath, 'utf-8')

    assert.ok(source.includes('useModalManager'), 'AppShell must import useModalManager')
    assert.ok(source.includes('modals'), 'AppShell must consume modals from useModalManager')
    assert.ok(!source.includes('const isShortcutsOpen = ref(false)'), 'isShortcutsOpen should be managed via useModalManager')
    assert.ok(!source.includes('const isSortingOpen = ref(false)'), 'isSortingOpen should be managed via useModalManager')
  })

  it('Both StepTabBar and TedHub header share unified h-16 baseline and zero emojis', () => {
    const stepTabPath = path.resolve('src/components/layout/StepTabBar.vue')
    const tedHubPath = path.resolve('src/components/ted/TedHub.vue')
    const stepTabSource = fs.readFileSync(stepTabPath, 'utf-8')
    const tedHubSource = fs.readFileSync(tedHubPath, 'utf-8')

    assert.ok(stepTabSource.includes('h-16'), 'StepTabBar must use h-16 baseline height')
    assert.ok(tedHubSource.includes('h-16'), 'TedHub header must use h-16 baseline height')

    const emojiRegex = /\p{Extended_Pictographic}/gu
    assert.equal(stepTabSource.match(emojiRegex), null, 'StepTabBar has 0 emojis')
    assert.equal(tedHubSource.match(emojiRegex), null, 'TedHub has 0 emojis')
  })
})
