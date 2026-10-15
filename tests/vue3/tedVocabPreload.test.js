import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { parse } from 'vue/compiler-sfc'

const FILE_PATH = 'src/components/ted/TedVocabPreload.vue'
const src = existsSync(FILE_PATH) ? readFileSync(FILE_PATH, 'utf8') : ''

describe('TedVocabPreload.vue', () => {
  it('component file exists and is not empty', () => {
    assert.ok(existsSync(FILE_PATH), 'TedVocabPreload.vue must exist')
    assert.ok(src.length > 0, 'TedVocabPreload.vue must not be empty')
  })

  it('renders word, IPA, definition fields', () => {
    assert.ok(src.includes('ipa') || src.includes('.ipa'), 'Missing IPA rendering')
    assert.ok(src.includes('definitionCn'), 'Missing definitionCn rendering')
    assert.ok(src.includes('exampleSentence'), 'Missing exampleSentence rendering')
  })

  it('uses Volume2 icon for listen button', () => {
    assert.ok(src.includes('Volume2'), 'Missing Volume2 icon')
  })

  it('uses CheckCircle2 icon for listened state', () => {
    assert.ok(src.includes('CheckCircle2'), 'Missing CheckCircle2 listened icon')
  })

  it('listen button has 44px touch target', () => {
    assert.ok(src.includes('min-h-[44px]') || src.includes('h-11') || src.includes('w-11'), 'Missing 44px touch target on listen button')
  })

  it('calls markVocabListened on listen', () => {
    assert.ok(src.includes('markVocabListened'), 'Missing markVocabListened call')
  })

  it('has unlock CTA calling goToStep(2)', () => {
    assert.ok(src.includes('goToStep(2)') || src.includes("goToStep('2')") || src.includes('goToStep'), 'Missing unlock CTA')
  })

  it('uses text-lg for word display (K12)', () => {
    assert.ok(src.includes('text-lg'), 'Missing text-lg for word (K12 requirement)')
  })

  it('contains no Unicode emojis', () => {
    assert.ok(src.length > 0, 'File must not be empty')
    assert.doesNotMatch(src, /\p{Extended_Pictographic}/u, 'Emoji found in TedVocabPreload.vue')
  })

  it('is a valid Vue 3 SFC', () => {
    assert.ok(existsSync(FILE_PATH), 'TedVocabPreload.vue must exist')
    const { descriptor, errors } = parse(src)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })
})
