import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { useVocabStore } from '../../src/stores/vocabStore.js'

describe('VocabularyDrawer 6D & Depth Meter Integration', () => {
  const filePath = path.resolve('src/components/VocabularyDrawer.vue')

  test('VocabularyDrawer imports and uses VocabDepthMeter and CEFR filtering', () => {
    assert.ok(fs.existsSync(filePath))
    const content = fs.readFileSync(filePath, 'utf-8')

    // Imports VocabDepthMeter
    assert.ok(content.includes('VocabDepthMeter'), 'Must import and use VocabDepthMeter')

    // CEFR badges and filter
    assert.ok(content.includes('cefrLevel') || content.includes('CEFR'), 'Must support CEFR level display')
    assert.ok(content.includes('activeCefr') || content.includes('cefrFilter'), 'Must support CEFR filtering')

    // Box 5 promotion feedback
    assert.ok(content.includes('NEED_L4_PRODUCTION') || content.includes('l4'), 'Must check L4 condition for Box 5')

    // Source badge
    assert.ok(content.includes('HP原著') && content.includes('TED精讲'), 'Must display HP原著 and TED精讲 source badges')

    // Record L1 acquisition on pronunciation
    assert.ok(content.includes("recordAcquisition(item.word, 'l1')") || content.includes("recordAcquisition(word, 'l1')"), 'Pronunciation must record L1 acquisition')

    // Zero emojis
    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')

    // Apple HIG
    assert.ok(content.includes('min-h-[44px]') || content.includes('h-11'), 'Must satisfy 44px touch target')
  })

  test('Combined filtering logic for Box, CEFR and Search query', () => {
    const sampleList = [
      { word: 'wand', definition: '魔杖，魔法棒', box: 1, cefrLevel: 'A2', sourceType: 'hp', acquisition: { l1: true, l2: true, l3: false, l4: false } },
      { word: 'cloak', definition: '斗篷，披风', box: 2, cefrLevel: 'A2', sourceType: 'hp', acquisition: { l1: true, l2: true, l3: false, l4: false } },
      { word: 'peculiar', definition: '奇怪的，古怪的', box: 2, cefrLevel: 'B1', sourceType: 'hp', acquisition: { l1: true, l2: true, l3: false, l4: false } },
      { word: 'quill', definition: '羽毛笔', box: 4, cefrLevel: 'B1', sourceType: 'hp', acquisition: { l1: true, l2: true, l3: true, l4: false } },
      { word: 'neuroscience', definition: '神经科学', box: 4, cefrLevel: 'C1', sourceType: 'ted', acquisition: { l1: true, l2: true, l3: true, l4: true } }
    ]

    function matchesCefr(item, filter) {
      if (!filter || filter === 'all') return true
      const lvl = item.cefrLevel || 'B1'
      if (filter === 'A1/A2') return lvl === 'A1' || lvl === 'A2'
      if (filter === 'B1/B2') return lvl === 'B1' || lvl === 'B2'
      if (filter === 'C1') return lvl === 'C1' || lvl === 'C2'
      return true
    }

    function filterVocab(list, query, box, cefr) {
      const q = (query || '').trim().toLowerCase()
      return list.filter((item) => {
        if (box !== null && (item.box || 1) !== box) return false
        if (!matchesCefr(item, cefr)) return false
        if (!q) return true
        const matchesWord = item.word && item.word.toLowerCase().includes(q)
        const matchesDef = item.definition && item.definition.toLowerCase().includes(q)
        return Boolean(matchesWord || matchesDef)
      })
    }

    // Filter by CEFR A1/A2
    const aLevel = filterVocab(sampleList, '', null, 'A1/A2')
    assert.strictEqual(aLevel.length, 2)
    assert.deepStrictEqual(aLevel.map(x => x.word), ['wand', 'cloak'])

    // Filter by CEFR B1/B2 in Box 2
    const bLevelBox2 = filterVocab(sampleList, '', 2, 'B1/B2')
    assert.strictEqual(bLevelBox2.length, 1)
    assert.strictEqual(bLevelBox2[0].word, 'peculiar')

    // Filter by CEFR C1 in Box 4
    const c1Box4 = filterVocab(sampleList, '', 4, 'C1')
    assert.strictEqual(c1Box4.length, 1)
    assert.strictEqual(c1Box4[0].word, 'neuroscience')
    assert.strictEqual(c1Box4[0].sourceType, 'ted')

    // Filter by text search '神'
    const searchRes = filterVocab(sampleList, '神', null, 'all')
    assert.strictEqual(searchRes.length, 1)
    assert.strictEqual(searchRes[0].word, 'neuroscience')
  })

  test('Box 5 promotion gate protection and acquisition L1 recording', () => {
    if (typeof globalThis.localStorage === 'undefined') {
      const store = new Map()
      globalThis.localStorage = {
        getItem: (k) => store.get(k) || null,
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
        clear: () => store.clear()
      }
    }
    localStorage.clear()
    setActivePinia(createPinia())
    const store = useVocabStore()

    store.addWord('transfiguration', 'Professor McGonagall teaches transfiguration.')
    const word = store.vocabList.find(w => w.word === 'transfiguration')
    assert.ok(word)

    // Simulate pronunciation recording L1
    store.recordAcquisition('transfiguration', 'l1')
    assert.strictEqual(word.acquisition.l1, true)

    // Move to box 4
    word.box = 4
    word.acquisition.l4 = false

    // Box 5 promotion attempt without L4
    const attempt1 = store.promoteBox(word)
    assert.strictEqual(attempt1.promoted, false)
    assert.strictEqual(attempt1.reason, 'NEED_L4_PRODUCTION')
    assert.strictEqual(word.box, 4)

    // Complete L4 production requirement
    store.recordAcquisition('transfiguration', 'l4')
    assert.strictEqual(word.acquisition.l4, true)

    // Box 5 promotion attempt with L4 satisfied
    const attempt2 = store.promoteBox(word)
    assert.strictEqual(attempt2.promoted, true)
    assert.strictEqual(word.box, 5)
  })
})
