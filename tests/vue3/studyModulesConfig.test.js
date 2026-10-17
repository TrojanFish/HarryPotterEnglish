import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { STUDY_MODULES, WORKSHOP_MODULES, TOOL_MODULES } from '../../src/config/studyModules.js'

describe('P3: Centralized STUDY_MODULES Configuration', () => {
  it('exports complete STUDY_MODULES registry with 7 core modules', () => {
    assert.ok(Array.isArray(STUDY_MODULES), 'STUDY_MODULES must be an array')
    assert.equal(STUDY_MODULES.length, 7, 'Must have 7 core modules registered')

    const ids = STUDY_MODULES.map((m) => m.id)
    assert.ok(ids.includes('player_reader'))
    assert.ok(ids.includes('ted'))
    assert.ok(ids.includes('bookshelf'))
    assert.ok(ids.includes('vocab'))
    assert.ok(ids.includes('assessment'))
    assert.ok(ids.includes('analytics'))
    assert.ok(ids.includes('storage'))
  })

  it('correctly partitions modules into workshop and tools groups', () => {
    assert.equal(WORKSHOP_MODULES.length, 3, 'Must have 3 workshop modules')
    assert.equal(TOOL_MODULES.length, 4, 'Must have 4 tools modules')

    assert.ok(WORKSHOP_MODULES.every((m) => m.group === 'workshop'))
    assert.ok(TOOL_MODULES.every((m) => m.group === 'tools'))
  })

  it('each module declares required interface fields and Lucide icons', () => {
    STUDY_MODULES.forEach((mod) => {
      assert.ok(mod.id, 'id is required')
      assert.ok(mod.label, 'label is required')
      assert.ok(mod.view, 'view is required')
      assert.ok(mod.icon, 'icon component is required')
    })
  })
})
