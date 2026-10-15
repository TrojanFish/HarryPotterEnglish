import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert'
import { setActivePinia, createPinia } from 'pinia'
import { useVocabStore } from '../../src/stores/vocabStore.js'

if (typeof globalThis.localStorage === 'undefined') {
  const mem = new Map()
  globalThis.localStorage = {
    getItem: (k) => mem.get(k) || null,
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear()
  }
}

describe('vocabStore 6D Schema & Acquisition State Machine', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  test('loadVocab smoothly migrates legacy data without acquisition and cefrLevel', () => {
    const legacyData = [
      { id: 101, word: 'wand', phonetic: '/wɒnd/', definition: '魔杖', pos: 'n.', tag: '中考核心', contextQuote: 'The wand chooses the wizard.', box: 2 },
      { id: 102, word: 'spell', phonetic: '/spel/', definition: '咒语', pos: 'n.', tag: '高考重点', contextQuote: 'Cast a spell.', box: 4 }
    ]
    localStorage.setItem('hp_vocab_list', JSON.stringify(legacyData))

    const store = useVocabStore()
    assert.strictEqual(store.vocabList.length, 2)
    const wand = store.vocabList.find(w => w.word === 'wand')
    assert.strictEqual(wand.cefrLevel, 'A2')
    assert.strictEqual(wand.examTag, '中考核心')
    assert.strictEqual(wand.sourceType, 'hp')
    assert.ok(wand.acquisition, 'Must have acquisition object')
    assert.strictEqual(wand.acquisition.l1, true)
    assert.strictEqual(wand.acquisition.l2, true)
    assert.strictEqual(wand.acquisition.l3, false) // box 2 < 3
    assert.strictEqual(wand.acquisition.l4, false) // box 2 < 4

    const spell = store.vocabList.find(w => w.word === 'spell')
    assert.strictEqual(spell.acquisition.l3, true) // box 4 >= 3
    assert.strictEqual(spell.acquisition.l4, true) // box 4 >= 4
  })

  test('recordAcquisition updates acquisition depth idempotently', () => {
    const store = useVocabStore()
    store.addWord('lumos', 'Lumos lights up.')
    const entry = store.vocabList.find(w => w.word === 'lumos')
    assert.ok(entry)
    assert.strictEqual(entry.acquisition.l4, false)

    const res = store.recordAcquisition('lumos', 'l4')
    assert.strictEqual(res, true)
    assert.strictEqual(entry.acquisition.l4, true)

    // Repeat call remains true
    store.recordAcquisition('lumos', 'l4')
    assert.strictEqual(entry.acquisition.l4, true)
  })

  test('promoteBox guards Box 5: blocked if l4 is false, succeeds if l4 is true', () => {
    const store = useVocabStore()
    store.addWord({ word: 'quidditch', box: 3 })
    const item = store.vocabList.find(w => w.word === 'quidditch')
    assert.strictEqual(item.box, 3)

    // Promote 3 -> 4 succeeds
    const res1 = store.promoteBox(item)
    assert.strictEqual(res1.promoted, true)
    assert.strictEqual(item.box, 4)

    // Box 4 -> 5 blocked because l4 is false
    assert.strictEqual(item.acquisition.l4, false)
    const res2 = store.promoteBox(item)
    assert.strictEqual(res2.promoted, false)
    assert.strictEqual(res2.reason, 'NEED_L4_PRODUCTION')
    assert.strictEqual(item.box, 4, 'Must stay at Box 4')

    // Mark l4 completed, then promote 4 -> 5 succeeds
    store.recordAcquisition('quidditch', 'l4')
    assert.strictEqual(item.acquisition.l4, true)
    const res3 = store.promoteBox(item)
    assert.strictEqual(res3.promoted, true)
    assert.strictEqual(item.box, 5)
  })
})
