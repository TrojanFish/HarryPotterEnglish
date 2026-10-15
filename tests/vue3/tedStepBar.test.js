import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { parse } from 'vue/compiler-sfc'

const FILE_PATH = 'src/components/ted/TedStepBar.vue'
const src = existsSync(FILE_PATH) ? readFileSync(FILE_PATH, 'utf8') : ''

describe('TedStepBar.vue', () => {
  it('component file exists and is not empty', () => {
    assert.ok(existsSync(FILE_PATH), 'TedStepBar.vue must exist')
    assert.ok(src.length > 0, 'TedStepBar.vue must not be empty')
  })

  it('renders four step labels', () => {
    assert.ok(src.includes('词汇预热'), 'Missing 词汇预热 label')
    assert.ok(src.includes('精看精听'), 'Missing 精看精听 label')
    assert.ok(src.includes('理解任务'), 'Missing 理解任务 label')
    assert.ok(src.includes('演讲跟读'), 'Missing 演讲跟读 label')
  })

  it('uses min-h-[44px] for touch targets', () => {
    assert.ok(src.includes('min-h-[44px]'), 'Missing 44px touch target')
  })

  it('imports from lucide-vue-next', () => {
    assert.ok(src.includes('lucide-vue-next'), 'Missing lucide-vue-next')
  })

  it('contains no Unicode emojis', () => {
    assert.ok(src.length > 0, 'File must not be empty')
    assert.doesNotMatch(src, /\p{Extended_Pictographic}/u, 'Emoji found in TedStepBar.vue')
  })

  it('uses CheckCircle2 and Lock icons from lucide-vue-next', () => {
    assert.ok(src.includes('CheckCircle2'), 'Missing CheckCircle2 icon')
    assert.ok(src.includes('Lock'), 'Missing Lock icon')
  })

  it('enforces touch manipulation and min-w-[44px] Apple HIG standards', () => {
    assert.ok(src.includes('touch-manipulation'), 'Missing touch-manipulation class')
    assert.ok(src.includes('min-w-[44px]'), 'Missing min-w-[44px] touch target')
  })

  it('consumes useTedStore and handles step navigation', () => {
    assert.ok(src.includes('useTedStore'), 'Missing useTedStore import or usage')
    assert.ok(src.includes('goToStep'), 'Missing goToStep call')
  })

  it('is a valid Vue 3 SFC', () => {
    assert.ok(existsSync(FILE_PATH), 'TedStepBar.vue must exist')
    const { descriptor, errors } = parse(src)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })
})
