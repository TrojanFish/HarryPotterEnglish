import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'
import { setActivePinia, createPinia } from 'pinia'
import { useVocabStore } from '../../src/stores/vocabStore.js'
import { getCefrLevel } from '../../src/data/dictionaryData.js'

if (typeof globalThis.localStorage === 'undefined') {
  const memStore = new Map()
  globalThis.localStorage = {
    getItem: (k) => memStore.get(k) || null,
    setItem: (k, v) => memStore.set(k, String(v)),
    removeItem: (k) => memStore.delete(k),
    clear: () => memStore.clear()
  }
}

describe('WordLookupModal 6D Metadata and Depth Meter', () => {
  const filePath = path.resolve('src/components/common/WordLookupModal.vue')

  test('WordLookupModal includes CEFR badge and VocabDepthMeter', () => {
    assert.ok(fs.existsSync(filePath), 'Component file must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // SFC validation
    const { descriptor, errors } = parse(content)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup || descriptor.script, 'Component must have a script block')

    // CEFR and Depth Meter integration
    assert.ok(content.includes('cefrLevel') || content.includes('getCefrLevel'), 'Must support CEFR level display')
    assert.ok(content.includes('VocabDepthMeter'), 'Must import and use VocabDepthMeter')
    assert.ok(content.includes('recordAcquisition') && content.includes('l1'), 'Must trigger L1 acquisition on pronunciation')

    // Box indicator display
    assert.ok(content.includes('storedEntry') || content.includes('box'), 'Must display stored entry info like Leitner box')

    // Apple HIG and touch manipulation
    assert.ok(content.includes('min-h-[44px]') && content.includes('min-w-[44px]'), 'Must enforce Apple HIG 44px touch targets')
    assert.ok(content.includes('touch-manipulation'), 'Must include touch-manipulation class for responsive touch feedback')

    // Zero Unicode emojis
    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
  })

  test('CEFR level helper and VocabStore acquisition L1 integration logic', () => {
    localStorage.clear()
    setActivePinia(createPinia())
    const vocabStore = useVocabStore()

    // Cloak is seeded in vocabStore
    const cloak = vocabStore.vocabList.find((w) => w.word === 'cloak')
    assert.ok(cloak, 'Seed word cloak should exist')
    assert.strictEqual(cloak.box, 1)

    // Verify CEFR level derivation
    const cloakCefr = getCefrLevel('cloak', '中考核心')
    assert.strictEqual(cloakCefr, 'A2')

    // Simulate pronunciation trigger on saved word
    assert.strictEqual(vocabStore.hasWord('cloak'), true)
    const recordResult = vocabStore.recordAcquisition('cloak', 'l1')
    assert.strictEqual(recordResult, true)
    assert.strictEqual(cloak.acquisition.l1, true)

    // Trigger on non-saved word should return false without throwing
    const nonSavedResult = vocabStore.recordAcquisition('nonexistentword', 'l1')
    assert.strictEqual(nonSavedResult, false)
  })
})
