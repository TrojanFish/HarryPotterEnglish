import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { useModalManager } from '../../src/composables/useModalManager.js'

describe('P2: useModalManager Composable', () => {
  it('initializes with all modals closed', () => {
    const { modals } = useModalManager()
    assert.equal(modals.auth, false)
    assert.equal(modals.settings, false)
    assert.equal(modals.shortcuts, false)
    assert.equal(modals.sorting, false)
    assert.equal(modals.cloudSync, false)
  })

  it('open, close, and toggle operate reliably on modal state', () => {
    const { modals, open, close, toggle } = useModalManager()

    open('auth')
    assert.equal(modals.auth, true)

    close('auth')
    assert.equal(modals.auth, false)

    toggle('settings')
    assert.equal(modals.settings, true)
    toggle('settings')
    assert.equal(modals.settings, false)
  })

  it('closeAll closes any currently open modals', () => {
    const { modals, open, closeAll } = useModalManager()
    open('shortcuts')
    open('sorting')
    assert.equal(modals.shortcuts, true)
    assert.equal(modals.sorting, true)

    closeAll()
    assert.equal(modals.shortcuts, false)
    assert.equal(modals.sorting, false)
  })
})
