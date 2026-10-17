import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

describe('P1: Sidebar Information Architecture Grouping & Non-intrusive Toast', () => {
  it('DesktopSidebarVue groups items into learning workshops and academic tools with divider', () => {
    const filePath = path.resolve('src/components/navigation/DesktopSidebarVue.vue')
    const source = fs.readFileSync(filePath, 'utf-8')

    // Must define learningItems and toolItems
    assert.ok(source.includes('learningItems'), 'DesktopSidebarVue must define learningItems')
    assert.ok(source.includes('toolItems'), 'DesktopSidebarVue must define toolItems')

    // Must render group headers/labels in expanded state
    assert.ok(source.includes('研学工坊') || source.includes('学习工坊'), 'Must have workshop section label')
    assert.ok(source.includes('学业与工具') || source.includes('辅助工具'), 'Must have tools section label')

    // Must contain section divider border
    assert.ok(source.includes('border-t border-[#e8ddd0]'), 'Must have dividing border between groups')
  })

  it('BadgeUnlockedToast maintains non-blocking polite notification flow with pointer-events-none and dismissal', () => {
    const filePath = path.resolve('src/components/gamification/BadgeUnlockedToast.vue')
    const source = fs.readFileSync(filePath, 'utf-8')

    assert.ok(source.includes('pointer-events-none'), 'Container must be pointer-events-none to avoid blocking')
    assert.ok(source.includes('role="status"'), 'Must have role status')
    assert.ok(source.includes('aria-live="polite"'), 'Must use polite aria-live')
  })
})
