import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { parse } from 'vue/compiler-sfc'

const FILE_PATH = 'src/components/ted/TedShadowing.vue'
const src = existsSync(FILE_PATH) ? readFileSync(FILE_PATH, 'utf8') : ''

describe('TedShadowing.vue', () => {
  it('component file exists and is not empty', () => {
    assert.ok(existsSync(FILE_PATH), 'TedShadowing.vue must exist')
    assert.ok(src.length > 0, 'TedShadowing.vue must not be empty')
  })

  it('is a valid Vue 3 SFC', () => {
    assert.ok(existsSync(FILE_PATH), 'TedShadowing.vue must exist')
    const { descriptor, errors } = parse(src)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  it('has segment navigation with ChevronLeft and ChevronRight', () => {
    assert.ok(src.includes('ChevronLeft'), 'Missing ChevronLeft navigation')
    assert.ok(src.includes('ChevronRight'), 'Missing ChevronRight navigation')
    assert.ok(src.includes('片段'), 'Missing segment indicator text (片段)')
  })

  it('renders Track A (原声示范) and Track B (我的录音) sections', () => {
    assert.ok(src.includes('原声示范'), 'Missing Track A label')
    assert.ok(src.includes('我的录音'), 'Missing Track B label')
  })

  it('Track A and Track B buttons have 44px touch targets', () => {
    assert.ok(src.includes('min-h-[44px]'), 'Missing min-h-[44px] touch target')
    assert.ok(src.includes('min-w-[44px]'), 'Missing min-w-[44px] touch target')
  })

  it('calls markTalkCompleted and returns to hub on finish', () => {
    assert.ok(src.includes('markTalkCompleted'), 'Missing markTalkCompleted call')
    assert.ok(src.includes('完成本期精讲'), 'Missing finish CTA label')
    assert.ok(src.includes("setView('ted')"), "Missing navigationStore setView('ted') return")
  })

  it('uses Mic icon and MediaRecorder for recording', () => {
    assert.ok(src.includes('Mic'), 'Missing Mic icon for recording button')
    assert.ok(src.includes('MediaRecorder'), 'Missing MediaRecorder API usage')
  })

  it('transcript text uses text-lg for English (K12) and text-sm for Chinese', () => {
    assert.ok(src.includes('text-lg'), 'Missing text-lg for transcript (K12)')
    assert.ok(src.includes('text-sm'), 'Missing text-sm for Chinese translation')
  })

  it('contains no Unicode emojis', () => {
    assert.ok(src.length > 0, 'File must not be empty')
    assert.doesNotMatch(src, /\p{Extended_Pictographic}/u, 'Emoji found in TedShadowing.vue')
  })
})
