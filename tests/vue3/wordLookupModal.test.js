import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'
import { setActivePinia, createPinia } from 'pinia'
import { lookupWord } from '../../src/data/dictionaryData.js'
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

describe('WordLookupModal Component and Specifications', () => {
  const componentPath = path.resolve('src/components/common/WordLookupModal.vue')

  test('WordLookupModal.vue exists and is valid Vue SFC', () => {
    assert.ok(fs.existsSync(componentPath), 'src/components/common/WordLookupModal.vue must exist')

    const source = fs.readFileSync(componentPath, 'utf-8')
    const { descriptor, errors } = parse(source)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup || descriptor.script, 'Component must have a script block')
  })

  test('Strict Design System: zero emoji and zero large shadows', () => {
    assert.ok(fs.existsSync(componentPath), 'File must exist')
    const content = fs.readFileSync(componentPath, 'utf-8')

    // Zero unicode emoji check
    const emojiRegex = /\p{Extended_Pictographic}/gu
    const emojiMatches = content.match(emojiRegex)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')

    // Zero shadow check (no shadow-lg, shadow-xl, shadow-2xl)
    assert.ok(!content.includes('shadow-lg'), 'Must not use shadow-lg')
    assert.ok(!content.includes('shadow-xl'), 'Must not use shadow-xl')
    assert.ok(!content.includes('shadow-2xl'), 'Must not use shadow-2xl')

    // Clean borders
    assert.ok(
      content.includes('border-[#e4e4e7]') || content.includes('border-[#e8ddd0]'),
      'Must use clean border tokens'
    )
  })

  test('Apple HIG 44px touch targets and iOS bottom sheet ergonomics', () => {
    assert.ok(fs.existsSync(componentPath), 'File must exist')
    const content = fs.readFileSync(componentPath, 'utf-8')

    // Apple HIG 44px rule
    assert.ok(
      content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('h-12'),
      'Touch targets must be >= 44px'
    )

    // Pull handle for mobile with min-h-[44px] touch target
    assert.ok(
      content.includes('min-h-[44px] flex items-center justify-center'),
      'Pull handle container must have min-h-[44px] flex items-center justify-center touch target'
    )
    assert.ok(
      content.includes('w-10 h-1.5 rounded-full bg-[#d4d4d8]'),
      'Must include specified pull handle (w-10 h-1.5 rounded-full bg-[#d4d4d8])'
    )

    // Desktop max-w-md
    assert.ok(content.includes('max-w-md'), 'Desktop layout must include max-w-md')

    // useBottomSheet integration
    assert.ok(content.includes('useBottomSheet'), 'Must integrate useBottomSheet')
  })

  test('Component interfaces: imports, props, emits, and icons', () => {
    assert.ok(fs.existsSync(componentPath), 'File must exist')
    const content = fs.readFileSync(componentPath, 'utf-8')

    // Lucide icons
    assert.ok(content.includes('lucide-vue-next'), 'Must import from lucide-vue-next')
    assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
    assert.ok(content.includes('Volume2'), 'Must include Volume2 icon for pronunciation')
    assert.ok(content.includes('X'), 'Must include X icon for close')

    // Core services and stores
    assert.ok(content.includes('lookupWord'), 'Must import lookupWord from dictionaryData')
    assert.ok(content.includes('useVocabStore'), 'Must import useVocabStore')

    // Props and emits
    assert.ok(content.includes('isOpen'), 'Must handle isOpen prop')
    assert.ok(content.includes('word'), 'Must handle word prop')
    assert.ok(content.includes('contextQuote'), 'Must handle contextQuote prop')
    assert.ok(content.includes('close'), 'Must emit close')
  })

  test('Speech synthesis pronunciation and cancellation on modal close', () => {
    assert.ok(fs.existsSync(componentPath), 'File must exist')
    const content = fs.readFileSync(componentPath, 'utf-8')

    // TTS speech synthesis
    assert.ok(content.includes('speechSynthesis'), 'Must integrate window.speechSynthesis')
    assert.ok(content.includes('en-GB') || content.includes('en-US'), 'Must specify English speech locale')

    // Speech synthesis cancel on close and on isOpen watch
    assert.ok(content.includes('cancelAudio') || content.includes('speechSynthesis.cancel()'), 'Must contain speech cancellation logic')
    assert.ok(content.includes('props.isOpen'), 'Must watch props.isOpen to cancel speech synthesis on modal close')
    assert.ok(content.includes('handleClose'), 'Must handle close with audio cancellation')

    // Full-width action button copy
    assert.ok(content.includes('收录至生词本'), 'Must include text "收录至生词本"')
    assert.ok(content.includes('已在生词本中'), 'Must include text "已在生词本中"')
  })

  test('VocabStore and lookupWord integration for modal toggle flow', () => {
    localStorage.clear()
    setActivePinia(createPinia())
    const vocabStore = useVocabStore()

    // 1. Lookup 'cloak'
    const cloakEntry = lookupWord('cloak')
    assert.strictEqual(cloakEntry.word, 'cloak')
    assert.strictEqual(cloakEntry.phonetic, '/kləʊk/')
    assert.strictEqual(cloakEntry.pos, 'n.')
    assert.strictEqual(cloakEntry.tag, '中考核心')

    // 'cloak' is initially seeded
    assert.strictEqual(vocabStore.hasWord(cloakEntry.word), true)

    // Toggling 'cloak' should remove it
    const toggleRes1 = vocabStore.toggleWord(cloakEntry, 'He wore a cloak.')
    assert.strictEqual(toggleRes1, false, 'Toggling existing word should remove it')
    assert.strictEqual(vocabStore.hasWord(cloakEntry.word), false)

    // Toggling again should re-add it
    const toggleRes2 = vocabStore.toggleWord(cloakEntry, 'He wore a cloak.')
    assert.strictEqual(toggleRes2, true, 'Toggling absent word should add it')
    assert.strictEqual(vocabStore.hasWord(cloakEntry.word), true)
  })
})
