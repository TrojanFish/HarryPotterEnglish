import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { parse } from 'vue/compiler-sfc'

const FILE_PATH = 'src/components/ted/TedTalkList.vue'
const src = existsSync(FILE_PATH) ? readFileSync(FILE_PATH, 'utf8') : ''

describe('TedTalkList.vue', () => {
  it('component file exists and is not empty', () => {
    assert.ok(existsSync(FILE_PATH), 'TedTalkList.vue must exist')
    assert.ok(src.length > 0, 'TedTalkList.vue must not be empty')
  })

  it('uses v-for to render talk list from store', () => {
    assert.ok(src.includes('v-for'), 'Missing v-for talk list rendering')
  })

  it('calls selectTalk on click', () => {
    assert.ok(src.includes('selectTalk'), 'Missing selectTalk call')
  })

  it('shows CEFR level badge', () => {
    assert.ok(src.includes('cefrLevel'), 'Missing CEFR level display')
  })

  it('uses CheckCircle2 for completed talks', () => {
    assert.ok(src.includes('CheckCircle2'), 'Missing CheckCircle2 completed badge')
  })

  it('contains no Unicode emojis', () => {
    assert.ok(src.length > 0, 'File must not be empty')
    assert.doesNotMatch(src, /\p{Extended_Pictographic}/u, 'Emoji found in TedTalkList.vue')
  })

  it('applies active state class for selected talk', () => {
    assert.ok(src.includes('border-amber-500') || src.includes('border-l-4'), 'Missing selected talk active border')
  })

  it('enforces min-h-[44px] and touch-manipulation for Apple HIG', () => {
    assert.ok(src.includes('min-h-[44px]'), 'Missing min-h-[44px] touch target')
    assert.ok(src.includes('touch-manipulation'), 'Missing touch-manipulation class')
  })

  it('is a valid Vue 3 SFC', () => {
    assert.ok(existsSync(FILE_PATH), 'TedTalkList.vue must exist')
    const { descriptor, errors } = parse(src)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })
})
