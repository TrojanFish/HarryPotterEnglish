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

  it('getZhText implements direct property check and proximity matching (< 0.35s)', () => {
    assert.ok(src.includes('cue.zh') || src.includes('cue.translation'), 'Missing direct bilingual cue property check in getZhText')
    assert.ok(src.includes('Math.abs(zh.startTime - cue.startTime) < 0.35'), 'Missing proximity matching in getZhText')
  })

  it('has CTA button advancing to step 3', () => {
    assert.ok(src.includes('goToStep(3)') || src.includes("goToStep('3')") || src.includes('goToStep'), 'Missing goToStep CTA')
  })

  it('supports draggable resizer between video stage and subtitle panel', () => {
    assert.ok(src.includes('role="separator"'), 'Missing role="separator" on resizer')
    assert.ok(src.includes('cursor-col-resize'), 'Missing cursor-col-resize cursor')
    assert.ok(src.includes('subtitlePanelWidth'), 'Missing subtitlePanelWidth binding')
    assert.ok(src.includes('startDragging'), 'Missing startDragging handler')
    assert.ok(src.includes('resetPanelWidth'), 'Missing resetPanelWidth handler')
    assert.ok(src.includes('GripVertical'), 'Missing GripVertical icon')
  })

  it('loadVtt appends cache-busting timestamp and passes no-cache option to bust browser disk cache', () => {
    assert.ok(src.includes('_t=') || src.includes('Date.now()'), 'Missing cache-busting timestamp parameter in loadVtt')
    assert.ok(src.includes("cache: 'no-cache'") || src.includes('cache: "no-cache"'), 'Missing cache: "no-cache" option in loadVtt fetch')
  })

  it('loadVtt falls back to embedded subtitleVtt when network fetch fails or 404s', () => {
    assert.ok(src.includes('subtitleVtt') || src.includes('vttContent'), 'Missing embedded subtitle fallback in loadVtt')
  })

  it('currentSpeaker binds to tedStore.currentTalk?.speaker', () => {
    assert.ok(src.includes('currentTalk?.speaker'), 'Missing currentTalk?.speaker binding for currentSpeaker')
  })

  it('autoscrolls active cue with smooth center alignment (block: center) to prevent bottom cutoff', () => {
    assert.ok(src.includes("block: 'center'") || src.includes('block: "center"'), 'Must use block: "center" for active cue autoscroll')
    assert.ok(src.includes('nextTick'), 'Must use nextTick to ensure DOM is rendered before scrollIntoView')
  })

  it('is a valid Vue 3 SFC', () => {
    assert.ok(existsSync(FILE_PATH), 'TedVideoPlayer.vue must exist')
    const { descriptor, errors } = parse(src)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })
})
