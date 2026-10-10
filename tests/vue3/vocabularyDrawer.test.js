import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
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

test('VocabularyDrawer.vue file exists and meets standards', () => {
  const filePath = path.resolve('src/components/VocabularyDrawer.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/VocabularyDrawer.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes('useVocabStore'), 'Must bind to useVocabStore')
  assert.ok(content.includes('generateAnkiTSV') || content.includes('anki'), 'Must support Anki export')
  assert.ok(content.includes('generatePrintableParchmentHTML') || content.includes('print'), 'Must support A4 parchment PDF generation')
  assert.ok(content.includes('Box') || content.includes('box'), 'Must support Leitner boxes')
  assert.ok(content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('h-12'), 'Touch targets must be >= 44px')
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')

  // Search input and >= 16px font-size to prevent mobile zoom
  assert.ok(content.includes('searchQuery'), 'Must support search query state')
  assert.ok(content.includes('Search'), 'Must import and use Search icon')
  assert.ok(content.includes('text-base') || content.includes('text-[16px]'), 'Search input font-size must be >= 16px to prevent iOS zoom')

  // Card pronunciation button
  assert.ok(content.includes('Volume2'), 'Must include Volume2 icon for pronunciation')
  assert.ok(content.includes('speechSynthesis'), 'Must integrate Web Speech API for pronunciation')

  // Mobile swipe-down close gesture support
  assert.ok(content.includes('useBottomSheet'), 'Must support mobile swipe-down close via useBottomSheet')

  // Graded curriculum badge support
  assert.ok(content.includes('getTagBadgeClass'), 'Must support curriculum grade badge using getTagBadgeClass')

  // Design constraints
  const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
  assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
  assert.ok(!content.includes('shadow-lg'), 'Must not use shadow-lg')
  assert.ok(!content.includes('shadow-xl'), 'Must not use shadow-xl')
  assert.ok(!content.includes('shadow-2xl'), 'Must not use shadow-2xl')
})


test('Anki TSV generation integration check', async () => {
  const { generateAnkiTSV } = await import('../../src/utils/ankiExport.js')
  const sample = [
    { word: 'wand', phonetic: '/wɒnd/', definition: '魔法棒', contextQuote: 'The wand chooses the wizard.' }
  ]
  const tsv = generateAnkiTSV(sample)
  assert.ok(tsv.includes('wand'), 'TSV must contain word')
  assert.ok(tsv.includes('#deck:'), 'TSV must contain deck directive')
})

test('vocabStore.addWord adds new word and avoids duplicates', () => {
  localStorage.clear()
  setActivePinia(createPinia())
  const vocabStore = useVocabStore()

  const initialCount = vocabStore.vocabList.length
  assert.ok(initialCount >= 3, 'Initial seed words should be present')

  // Adding a new word
  const added = vocabStore.addWord('Nimbus', 'He had a Nimbus Two Thousand.')
  assert.strictEqual(added, true, 'New word should be successfully added')
  assert.strictEqual(vocabStore.vocabList[0].word, 'nimbus')
  assert.strictEqual(vocabStore.vocabList[0].contextQuote, 'He had a Nimbus Two Thousand.')
  assert.strictEqual(vocabStore.vocabList[0].box, 1)

  // Duplicate word should return false and not increment count
  const dupAdded = vocabStore.addWord('nimbus', 'Another quote')
  assert.strictEqual(dupAdded, false, 'Duplicate word should not be added')
  assert.strictEqual(vocabStore.vocabList.length, initialCount + 1)

  // Duplicate with uppercase and punctuation
  const punctDup = vocabStore.addWord('...NIMBUS!...')
  assert.strictEqual(punctDup, false, 'Duplicate word with punctuation should be detected')

  // Word with too short length or empty should be rejected
  const shortAdded = vocabStore.addWord('a')
  assert.strictEqual(shortAdded, false, 'Single char word should be rejected')
  const emptyAdded = vocabStore.addWord('...!')
  assert.strictEqual(emptyAdded, false, 'Punctuation-only string should be rejected')
})

test('vocabStore promotes box, deletes word, and clears all', () => {
  localStorage.clear()
  setActivePinia(createPinia())
  const vocabStore = useVocabStore()

  vocabStore.addWord('snitch', 'The Golden Snitch.')
  const snitch = vocabStore.vocabList.find((w) => w.word === 'snitch')
  assert.ok(snitch)
  assert.strictEqual(snitch.box, 1)

  // Promote
  vocabStore.promoteBox(snitch)
  assert.strictEqual(snitch.box, 2)
  vocabStore.promoteBox(snitch)
  assert.strictEqual(snitch.box, 3)
  vocabStore.promoteBox(snitch)
  vocabStore.promoteBox(snitch)
  assert.strictEqual(snitch.box, 5)
  // Max box is 5
  vocabStore.promoteBox(snitch)
  assert.strictEqual(snitch.box, 5)

  // Delete
  vocabStore.deleteWord(snitch)
  assert.strictEqual(vocabStore.vocabList.some((w) => w.word === 'snitch'), false)

  // Clear all
  vocabStore.clearAll()
  assert.strictEqual(vocabStore.vocabList.length, 0)
})

test('VocabularyDrawer search filtering logic by word and definition', () => {
  const sampleList = [
    { word: 'wand', definition: '魔杖，魔法棒', box: 1 },
    { word: 'cloak', definition: '斗篷，披风', box: 2 },
    { word: 'peculiar', definition: '奇怪的，古怪的', box: 1 }
  ]

  function filterVocab(list, query, box = null) {
    const q = (query || '').trim().toLowerCase()
    return list.filter((item) => {
      if (box !== null && (item.box || 1) !== box) return false
      if (!q) return true
      const matchesWord = item.word && item.word.toLowerCase().includes(q)
      const matchesDef = (item.definition && item.definition.includes(query)) || (item.definition && item.definition.toLowerCase().includes(q))
      return Boolean(matchesWord || matchesDef)
    })
  }

  // Search by word English
  const res1 = filterVocab(sampleList, 'wand')
  assert.strictEqual(res1.length, 1)
  assert.strictEqual(res1[0].word, 'wand')

  // Search by definition Chinese
  const res2 = filterVocab(sampleList, '斗篷')
  assert.strictEqual(res2.length, 1)
  assert.strictEqual(res2[0].word, 'cloak')

  // Partial match
  const res3 = filterVocab(sampleList, 'ar')
  assert.strictEqual(res3.length, 1)
  assert.strictEqual(res3[0].word, 'peculiar')

  // Combined with box filter
  const res4 = filterVocab(sampleList, '', 2)
  assert.strictEqual(res4.length, 1)
  assert.strictEqual(res4[0].word, 'cloak')
})

test('App.vue includes header vocabulary button with word count badge', () => {
  const appPath = path.resolve('src/App.vue')
  const content = fs.readFileSync(appPath, 'utf-8')

  assert.ok(content.includes('isVocabOpen = true'), 'Header must have button opening vocab drawer')
  assert.ok(content.includes('BookMarked'), 'Vocab button must render BookMarked icon')
  assert.ok(content.includes('vocabStore.vocabList.length'), 'Must display vocab count badge pill')
  assert.ok(content.includes('useVocabStore'), 'App.vue must import and use vocabStore')
})

