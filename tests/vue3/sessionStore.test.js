import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from '../../src/stores/sessionStore.js'
import fs from 'node:fs'
import path from 'node:path'

describe('sessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('initializes at step 1 and advances properly', () => {
    const store = useSessionStore()
    assert.strictEqual(store.currentStep, 1)
    store.advanceStep()
    assert.strictEqual(store.currentStep, 2)
    store.advanceStep()
    assert.strictEqual(store.currentStep, 3)
    store.advanceStep()
    assert.strictEqual(store.currentStep, 4)
    store.advanceStep()
    assert.strictEqual(store.currentStep, 1) // cycles or completes
  })

  test('setStep updates step within bounds', () => {
    const store = useSessionStore()
    store.setStep(3)
    assert.strictEqual(store.currentStep, 3)
    store.setStep(5) // out of bounds ignored
    assert.strictEqual(store.currentStep, 3)
    store.setStep(0)
    assert.strictEqual(store.currentStep, 3)
  })

  test('StepTabBar component file exists and conforms to zero-emoji and HIG standards', () => {
    const tabPath = path.resolve('src/components/layout/StepTabBar.vue')
    assert.ok(fs.existsSync(tabPath), 'StepTabBar.vue must exist')
    const content = fs.readFileSync(tabPath, 'utf-8')
    assert.ok(content.includes('min-h-[44px]') || content.includes('touch-target') || content.includes('h-10 sm:h-11'), 'Must have accessible touch targets')
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'StepTabBar must contain zero unicode emoji')
  })
})
