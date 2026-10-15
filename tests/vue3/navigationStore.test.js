import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { setActivePinia, createPinia } from 'pinia'

// Stub localStorage for Node test env
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] ?? null },
  setItem(k, v) { this._store[k] = String(v) },
  removeItem(k) { delete this._store[k] },
  clear() { this._store = {} }
}

describe('navigationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    global.localStorage.clear()
  })

  it('defaults currentView to bookshelf', async () => {
    const { useNavigationStore } = await import('../../src/stores/navigationStore.js')
    const nav = useNavigationStore()
    assert.equal(nav.currentView, 'bookshelf')
  })

  it('setView updates currentView', async () => {
    const { useNavigationStore } = await import('../../src/stores/navigationStore.js')
    const nav = useNavigationStore()
    nav.setView('ted')
    assert.equal(nav.currentView, 'ted')
  })

  it('toggleCollapsed flips isCollapsed and persists', async () => {
    const { useNavigationStore } = await import('../../src/stores/navigationStore.js')
    const nav = useNavigationStore()
    assert.equal(nav.isCollapsed, false)
    nav.toggleCollapsed()
    assert.equal(nav.isCollapsed, true)
    assert.equal(localStorage.getItem('hp_sidebar_collapsed'), 'true')
  })

  it('ignores unknown view strings', async () => {
    const { useNavigationStore } = await import('../../src/stores/navigationStore.js')
    const nav = useNavigationStore()
    nav.setView('unknownView')
    assert.equal(nav.currentView, 'bookshelf')
  })
})
