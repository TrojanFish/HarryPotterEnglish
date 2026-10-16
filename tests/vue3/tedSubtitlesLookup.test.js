import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'
import { setActivePinia, createPinia } from 'pinia'
import { useVocabStore } from '../../src/stores/vocabStore.js'

if (typeof globalThis.localStorage === 'undefined') {
  const memStore = new Map()
  globalThis.localStorage = {
    getItem: (k) => memStore.get(k) || null,
    setItem: (k, v) => memStore.set(k, String(v)),
    removeItem: (k) => memStore.delete(k),
    clear: () => memStore.clear()
  }
}

describe('TED Subtitles Speaker Badge and Word-by-Word Vocab Lookup', () => {
  const tedPlayerPath = path.resolve('src/components/ted/TedVideoPlayer.vue')
  const wordModalPath = path.resolve('src/components/common/WordLookupModal.vue')
  const vocabStorePath = path.resolve('src/stores/vocabStore.js')

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  test('TedVideoPlayer.vue and WordLookupModal.vue are valid Vue 3 SFCs without Unicode emojis', () => {
    assert.ok(fs.existsSync(tedPlayerPath), 'TedVideoPlayer.vue must exist')
    assert.ok(fs.existsSync(wordModalPath), 'WordLookupModal.vue must exist')

    const tedContent = fs.readFileSync(tedPlayerPath, 'utf8')
    const modalContent = fs.readFileSync(wordModalPath, 'utf8')
    const vocabContent = fs.readFileSync(vocabStorePath, 'utf8')

    // SFC Validation
    const tedSfc = parse(tedContent)
    assert.strictEqual(tedSfc.errors.length, 0, 'TedVideoPlayer.vue must parse with 0 errors')
    assert.ok(tedSfc.descriptor.template, 'TedVideoPlayer.vue must have template')
    assert.ok(tedSfc.descriptor.scriptSetup, 'TedVideoPlayer.vue must have scriptSetup')

    const modalSfc = parse(modalContent)
    assert.strictEqual(modalSfc.errors.length, 0, 'WordLookupModal.vue must parse with 0 errors')

    // Zero Unicode emoji rule
    const emojiRegex = /\p{Extended_Pictographic}/u
    assert.doesNotMatch(tedContent, emojiRegex, 'TedVideoPlayer.vue must not contain Unicode emojis')
    assert.doesNotMatch(modalContent, emojiRegex, 'WordLookupModal.vue must not contain Unicode emojis')
    assert.doesNotMatch(vocabContent, emojiRegex, 'vocabStore.js must not contain Unicode emojis')
  })

  test('TedVideoPlayer.vue displays speaker metadata badge with Mic icon and currentSpeaker computed', () => {
    const tedContent = fs.readFileSync(tedPlayerPath, 'utf8')

    // Imports Mic from lucide-vue-next
    assert.ok(
      tedContent.includes('Mic') && tedContent.includes('lucide-vue-next'),
      'TedVideoPlayer.vue must import Mic icon from lucide-vue-next'
    )

    // currentSpeaker computed property exists
    assert.ok(
      tedContent.includes('currentSpeaker'),
      'TedVideoPlayer.vue must define currentSpeaker'
    )
    assert.ok(
      tedContent.includes('selectedTalk') && tedContent.includes('speaker'),
      'currentSpeaker must read from tedStore.selectedTalk?.speaker'
    )

    // Speaker badge markup in template
    assert.ok(
      tedContent.includes('<Mic'),
      'Template must render <Mic icon in speaker badge'
    )
    assert.ok(
      tedContent.includes('text-amber-900') &&
      tedContent.includes('bg-amber-100') &&
      tedContent.includes('border-amber-300'),
      'Speaker badge must use amber parchment styling classes'
    )
  })

  test('TedVideoPlayer.vue implements word-level tokenization with handleWordClick and word-token class', () => {
    const tedContent = fs.readFileSync(tedPlayerPath, 'utf8')

    // Subtitle cues tokenized
    assert.ok(
      tedContent.includes('tokenizeSentence(cue.text)'),
      'Must tokenize cue.text using tokenizeSentence'
    )

    // Interactive word token class and click handler
    assert.ok(
      tedContent.includes('word-token'),
      'Interactive word span must include word-token class'
    )
    assert.ok(
      tedContent.includes('handleWordClick'),
      'Clicking a word must trigger handleWordClick'
    )

    // handleWordClick implementation
    assert.ok(
      tedContent.includes('activeContextQuote'),
      'Must track activeContextQuote for context quotation'
    )
  })

  test('TedVideoPlayer.vue mounts WordLookupModal with :source="\'ted\'" and :context-quote', () => {
    const tedContent = fs.readFileSync(tedPlayerPath, 'utf8')

    assert.ok(
      tedContent.includes(':source="\'ted\'"') || tedContent.includes('source="ted"'),
      'TedVideoPlayer.vue must pass source="ted" to WordLookupModal'
    )
    assert.ok(
      tedContent.includes(':context-quote="activeContextQuote"') ||
      tedContent.includes(':contextQuote="activeContextQuote"'),
      'TedVideoPlayer.vue must pass activeContextQuote to WordLookupModal'
    )
  })

  test('WordLookupModal.vue accepts source prop and forwards { sourceType: props.source } to vocabStore.toggleWord', () => {
    const modalContent = fs.readFileSync(wordModalPath, 'utf8')

    // defineProps has source
    assert.ok(
      modalContent.includes('source:'),
      'WordLookupModal.vue defineProps must declare source prop'
    )

    // handleToggleVocab forwards sourceType
    assert.ok(
      modalContent.includes('sourceType') || modalContent.includes('props.source'),
      'WordLookupModal.vue handleToggleVocab must forward source to vocabStore'
    )
  })

  test('vocabStore.toggleWord forwards meta to addWord and persists sourceType: "ted"', () => {
    const store = useVocabStore()

    // Test adding a TED word via toggleWord with meta
    const added = store.toggleWord(
      { word: 'vulnerable', definition: 'adj. 脆弱的' },
      'Vulnerability is not winning or losing.',
      { sourceType: 'ted' }
    )
    assert.strictEqual(added, true, 'toggleWord should return true when adding a new word')

    const entry = store.vocabList.find((w) => w.word === 'vulnerable')
    assert.ok(entry, 'Entry should be present in vocabList')
    assert.strictEqual(entry.sourceType, 'ted', 'sourceType must be recorded as "ted"')
    assert.strictEqual(entry.contextQuote, 'Vulnerability is not winning or losing.')

    // Toggling again should remove it
    const removed = store.toggleWord({ word: 'vulnerable' })
    assert.strictEqual(removed, false, 'toggleWord should return false when removing word')
    assert.strictEqual(store.hasWord('vulnerable'), false, 'Word should be removed from store')
  })
})
