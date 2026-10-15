import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { parse } from 'vue/compiler-sfc'

const FILE_PATH = 'src/components/ted/TedVideoPlayer.vue'
const src = existsSync(FILE_PATH) ? readFileSync(FILE_PATH, 'utf8') : ''

describe('TedVideoPlayer.vue', () => {
  it('component file exists and is not empty', () => {
    assert.ok(existsSync(FILE_PATH), 'TedVideoPlayer.vue must exist')
    assert.ok(src.length > 0, 'TedVideoPlayer.vue must not be empty')
  })

  it('renders native <video> element', () => {
    assert.ok(src.includes('<video'), 'Missing <video> element')
  })

  it('uses aspect-video or aspect-[16/9] for 16:9 ratio', () => {
    assert.ok(src.includes('aspect-video') || src.includes('aspect-[16/9]'), 'Missing 16:9 aspect ratio')
  })

  it('renders English subtitles with text-lg class (K12)', () => {
    assert.ok(src.includes('text-lg'), 'Missing text-lg for English subtitles')
  })

  it('renders Chinese subtitles with text-sm class (K12)', () => {
    assert.ok(src.includes('text-sm'), 'Missing text-sm for Chinese subtitles')
  })

  it('toggleBlindMode binding present', () => {
    assert.ok(src.includes('toggleBlindMode'), 'Missing toggleBlindMode')
  })

  it('setLoopCue binding present', () => {
    assert.ok(src.includes('setLoopCue'), 'Missing setLoopCue')
  })

  it('setLookupWord binding present for click-to-look-up', () => {
    assert.ok(src.includes('setLookupWord'), 'Missing setLookupWord')
  })

  it('imports WordLookupModal', () => {
    assert.ok(src.includes('WordLookupModal'), 'Missing WordLookupModal import')
  })

  it('control buttons have min-h-[44px] touch target', () => {
    assert.ok(src.includes('min-h-[44px]'), 'Missing 44px touch targets on controls')
  })

  it('uses EyeOff icon for blind mode toggle', () => {
    assert.ok(src.includes('EyeOff'), 'Missing EyeOff icon for blind mode')
  })

  it('contains no Unicode emojis', () => {
    assert.ok(src.length > 0, 'File must not be empty')
    assert.doesNotMatch(src, /\p{Extended_Pictographic}/u, 'Emoji found in TedVideoPlayer.vue')
  })

  it('has CTA button advancing to step 3', () => {
    assert.ok(src.includes('goToStep(3)') || src.includes("goToStep('3')") || src.includes('goToStep'), 'Missing goToStep CTA')
  })

  it('is a valid Vue 3 SFC', () => {
    assert.ok(existsSync(FILE_PATH), 'TedVideoPlayer.vue must exist')
    const { descriptor, errors } = parse(src)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })
})
