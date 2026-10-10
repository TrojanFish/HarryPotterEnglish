import { describe, test } from 'node:test'
import assert from 'node:assert'
import { setActivePinia, createPinia } from 'pinia'
import { lookupWord, DICTIONARY } from '../../src/data/dictionaryData.js'
import { useVocabStore } from '../../src/stores/vocabStore.js'

// Simple mock for localStorage in Node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  }
}

describe('Offline Dictionary Data and lookupWord', () => {
  test('DICTIONARY dictionary map exists and contains essential HP terms', () => {
    assert.ok(DICTIONARY && typeof DICTIONARY === 'object', 'DICTIONARY map must be exported')
    assert.ok(DICTIONARY.cloak, 'DICTIONARY must contain cloak')
    assert.strictEqual(DICTIONARY.cloak.phonetic, '/kləʊk/')
    assert.strictEqual(DICTIONARY.cloak.pos, 'n.')
    assert.ok(DICTIONARY.cloak.definition.length > 0)
    assert.ok(DICTIONARY.cloak.tag.length > 0)
  })

  test("lookupWord('cloak') returns object with phonetic, pos, definition, and tag", () => {
    const entry = lookupWord('cloak')
    assert.ok(entry, 'entry must be defined')
    assert.strictEqual(entry.word, 'cloak')
    assert.strictEqual(entry.phonetic, '/kləʊk/')
    assert.strictEqual(entry.pos, 'n.')
    assert.ok(entry.definition.includes('斗篷') || entry.definition.includes('披风'))
    assert.ok(entry.tag, 'tag must be present')
  })

  test("lookupWord('“peculiar.”') strips smart quotes and punctuation and returns peculiar definition", () => {
    const entry = lookupWord('“peculiar.”')
    assert.ok(entry, 'entry must be defined')
    assert.strictEqual(entry.word, 'peculiar')
    assert.strictEqual(entry.pos, 'adj.')
    assert.ok(entry.definition.includes('古怪') || entry.definition.includes('奇怪'))
  })

  test("lookupWord('cloaks') strips inflection -s and resolves to cloak lemma", () => {
    const entry = lookupWord('cloaks')
    assert.ok(entry, 'entry must be defined')
    assert.strictEqual(entry.word, 'cloak')
    assert.strictEqual(entry.phonetic, '/kləʊk/')
    assert.strictEqual(entry.pos, 'n.')
  })

  test("lookupWord handles other common inflections like -ed, -ing, -es", () => {
    const entryEd = lookupWord('noticed')
    assert.ok(entryEd)
    assert.strictEqual(entryEd.word, 'notice')

    const entryIng = lookupWord('whispering')
    assert.ok(entryIng)
    assert.strictEqual(entryIng.word, 'whisper')

    const entryWitches = lookupWord('witches')
    assert.ok(entryWitches)
    assert.strictEqual(entryWitches.word, 'witch')
  })

  test("lookupWord('unknownxyz') returns fallback object without throwing", () => {
    const fallback = lookupWord('unknownxyz')
    assert.deepStrictEqual(fallback, {
      word: 'unknownxyz',
      phonetic: '',
      pos: '',
      definition: '点击收录至生词本',
      tag: '拓展生词'
    })
  })

  test("lookupWord handles uppercase and leading/trailing whitespace", () => {
    const entry = lookupWord('  CLOAK  ')
    assert.strictEqual(entry.word, 'cloak')
    assert.strictEqual(entry.phonetic, '/kləʊk/')
  })
})

describe('vocabStore enhancements (toggleWord, hasWord, removeWord, rich schema)', () => {
  test("vocabStore.hasWord('cloak') returns true when present, false when absent (case-insensitive)", () => {
    localStorage.clear()
    setActivePinia(createPinia())
    const vocabStore = useVocabStore()

    // Seeds contain 'cloak'
    assert.strictEqual(vocabStore.hasWord('cloak'), true)
    assert.strictEqual(vocabStore.hasWord('CLOAK'), true)
    assert.strictEqual(vocabStore.hasWord('  cloak  '), true)
    assert.strictEqual(vocabStore.hasWord('wand'), false)
  })

  test('vocabStore.removeWord removes word case-insensitively', () => {
    localStorage.clear()
    setActivePinia(createPinia())
    const vocabStore = useVocabStore()

    assert.strictEqual(vocabStore.hasWord('cloak'), true)
    vocabStore.removeWord('cloak')
    assert.strictEqual(vocabStore.hasWord('cloak'), false)
  })

  test('vocabStore.toggleWord: adds when not present (returns true), removes when present (returns false)', () => {
    localStorage.clear()
    setActivePinia(createPinia())
    const vocabStore = useVocabStore()

    // 'wand' is not initially present
    assert.strictEqual(vocabStore.hasWord('wand'), false)

    // Toggle to add
    const added = vocabStore.toggleWord({
      word: 'wand',
      phonetic: '/wɒnd/',
      pos: 'n.',
      definition: '魔杖',
      tag: '高频魔法'
    }, 'The wand chooses the wizard.')

    assert.strictEqual(added, true)
    assert.strictEqual(vocabStore.hasWord('wand'), true)

    const storedWord = vocabStore.vocabList.find((w) => w.word === 'wand')
    assert.ok(storedWord)
    assert.strictEqual(storedWord.phonetic, '/wɒnd/')
    assert.strictEqual(storedWord.pos, 'n.')
    assert.strictEqual(storedWord.definition, '魔杖')
    assert.strictEqual(storedWord.tag, '高频魔法')
    assert.strictEqual(storedWord.contextQuote, 'The wand chooses the wizard.')
    assert.strictEqual(storedWord.box, 1)

    // Toggle again to remove
    const removed = vocabStore.toggleWord({ word: 'wand' })
    assert.strictEqual(removed, false)
    assert.strictEqual(vocabStore.hasWord('wand'), false)
  })

  test('vocabStore.addWord supports both string and rich object formats', () => {
    localStorage.clear()
    setActivePinia(createPinia())
    const vocabStore = useVocabStore()

    // Add string format
    const strAdded = vocabStore.addWord('muggle', 'A non-magical person.')
    assert.strictEqual(strAdded, true)
    const muggle = vocabStore.vocabList.find((w) => w.word === 'muggle')
    assert.ok(muggle)
    assert.strictEqual(muggle.word, 'muggle')

    // Add rich object format
    const objAdded = vocabStore.addWord({
      word: 'owl',
      phonetic: '/aʊl/',
      pos: 'n.',
      definition: '猫头鹰',
      tag: '魔法生物'
    }, 'An owl fluttered past the window.')
    assert.strictEqual(objAdded, true)
    const owl = vocabStore.vocabList.find((w) => w.word === 'owl')
    assert.ok(owl)
    assert.strictEqual(owl.phonetic, '/aʊl/')
    assert.strictEqual(owl.pos, 'n.')
    assert.strictEqual(owl.definition, '猫头鹰')
    assert.strictEqual(owl.tag, '魔法生物')
    assert.strictEqual(owl.contextQuote, 'An owl fluttered past the window.')

    // Duplicate rejection for rich object
    const dupObj = vocabStore.addWord({ word: 'owl' })
    assert.strictEqual(dupObj, false)
  })
})

describe('extractSentenceKeywords NLP utility', () => {
  test('extractSentenceKeywords extracts keywords from Harry Potter sentences and filters stop words', async () => {
    const { extractSentenceKeywords } = await import('../../src/data/dictionaryData.js')
    assert.strictEqual(typeof extractSentenceKeywords, 'function', 'extractSentenceKeywords must be exported')

    const sentence = 'A fantasy classic of discovery and friendship.'
    const result = extractSentenceKeywords(sentence)
    assert.ok(Array.isArray(result), 'Must return an array')
    assert.ok(result.length >= 3, 'Must extract at least 3 content keywords')

    const words = result.map(k => k.word.toLowerCase())
    assert.ok(words.includes('fantasy'), 'Must extract fantasy')
    assert.ok(words.includes('classic'), 'Must extract classic')
    assert.ok(words.includes('discovery'), 'Must extract discovery')
    assert.ok(words.includes('friendship'), 'Must extract friendship')

    // Stop words like 'a', 'of', 'and' must be excluded
    assert.ok(!words.includes('a'), 'Must exclude stop word "a"')
    assert.ok(!words.includes('of'), 'Must exclude stop word "of"')
    assert.ok(!words.includes('and'), 'Must exclude stop word "and"')

    // Each keyword must have rich fields
    const fantasy = result.find(k => k.word.toLowerCase() === 'fantasy')
    assert.ok(fantasy.definition, 'Must have definition')
    assert.ok(fantasy.phonetic, 'Must have phonetic')
    assert.ok(fantasy.tag, 'Must have tag')
  })

  test('extractSentenceKeywords returns empty array for empty or null sentence', async () => {
    const { extractSentenceKeywords } = await import('../../src/data/dictionaryData.js')
    assert.deepStrictEqual(extractSentenceKeywords(''), [])
    assert.deepStrictEqual(extractSentenceKeywords(null), [])
    assert.deepStrictEqual(extractSentenceKeywords('   '), [])
  })
})

describe('Graded curriculum tag resolution in lookupWord', () => {
  test('lookupWord resolves distinct curriculum grade tags and HP lore tags', async () => {
    const { lookupWord } = await import('../../src/data/dictionaryData.js')

    const primary = lookupWord('cat')
    assert.strictEqual(primary.tag, '小学基础', 'cat must have 小学基础 tag')

    const middle = lookupWord('discover')
    assert.strictEqual(middle.tag, '中考核心', 'discover must have 中考核心 tag')

    const gaokao = lookupWord('peculiar')
    assert.strictEqual(gaokao.tag, '高考重点', 'peculiar must have 高考重点 tag')

    const cet4 = lookupWord('philosopher')
    assert.strictEqual(cet4.tag, '四级高频', 'philosopher must have 四级高频 tag')

    const cet6 = lookupWord('eccentric')
    assert.strictEqual(cet6.tag, '六级进阶', 'eccentric must have 六级进阶 tag')

    const lore = lookupWord('quidditch')
    assert.strictEqual(lore.tag, '魔法专有', 'quidditch must have 魔法专有 tag')
  })
})

