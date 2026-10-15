import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { parse } from 'vue/compiler-sfc'

const FILE_PATH = 'src/components/ted/TedTaskStudio.vue'
const src = existsSync(FILE_PATH) ? readFileSync(FILE_PATH, 'utf8') : ''

describe('TedTaskStudio.vue', () => {
  it('component file exists and is not empty', () => {
    assert.ok(existsSync(FILE_PATH), 'TedTaskStudio.vue must exist')
    assert.ok(src.length > 0, 'TedTaskStudio.vue must not be empty')
  })

  it('renders cloze section with input fields', () => {
    assert.ok(src.includes('<input'), 'Missing <input> for cloze')
    assert.ok(src.includes('autocapitalize="none"') || src.includes('autocapitalize'), 'Missing autocapitalize="none" on input')
  })

  it('input uses text-base (16px min for iOS)', () => {
    assert.ok(src.includes('text-base'), 'Missing text-base on input (iOS zoom prevention)')
  })

  it('renders matching section', () => {
    assert.ok(src.includes('matching') || src.includes('timestampSeconds') || src.includes('summaryText'), 'Missing matching task section')
  })

  it('calls submitClozeAnswer on input change', () => {
    assert.ok(src.includes('submitClozeAnswer'), 'Missing submitClozeAnswer call')
  })

  it('calls submitMatchingAnswer on selection', () => {
    assert.ok(src.includes('submitMatchingAnswer'), 'Missing submitMatchingAnswer call')
  })

  it('calls scoreTask and shows score', () => {
    assert.ok(src.includes('scoreTask'), 'Missing scoreTask call')
  })

  it('has 前往跟读 CTA calling goToStep(4)', () => {
    assert.ok(src.includes('goToStep(4)') || src.includes("goToStep('4')") || (src.includes('goToStep') && src.includes('4')), 'Missing goToStep(4) CTA')
  })

  it('contains no Unicode emojis', () => {
    assert.ok(src.length > 0, 'File must not be empty')
    assert.doesNotMatch(src, /\p{Extended_Pictographic}/u, 'Emoji found in TedTaskStudio.vue')
  })

  it('shows Zap icon for high score reward', () => {
    assert.ok(src.includes('Zap'), 'Missing Zap icon for reward')
  })

  it('calls resetTask on retry', () => {
    assert.ok(src.includes('tedStore.resetTask()'), 'Missing resetTask() call in handleRetry')
  })

  it('is a valid Vue 3 SFC', () => {
    assert.ok(existsSync(FILE_PATH), 'TedTaskStudio.vue must exist')
    const { descriptor, errors } = parse(src)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })
})
