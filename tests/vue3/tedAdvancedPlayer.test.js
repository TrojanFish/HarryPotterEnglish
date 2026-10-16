import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'

describe('TedVideoPlayer.vue Advanced Playback Controls & Immersive Blind Mode', () => {
  const filePath = path.resolve('src/components/ted/TedVideoPlayer.vue')
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : ''

  it('1. Component file exists and compiles as a valid Vue 3 SFC', () => {
    assert.ok(fs.existsSync(filePath), 'TedVideoPlayer.vue must exist')
    assert.ok(content.length > 0, 'TedVideoPlayer.vue must not be empty')

    const { descriptor, errors } = parse(content)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  it('2. Strict Design System: Zero Unicode emojis in template and script', () => {
    assert.ok(content.length > 0, 'File must not be empty')
    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'No Unicode emoji characters permitted in TedVideoPlayer.vue')
    const rangeRegex = /[\u{1F300}-\u{1FAFF}]/u
    assert.strictEqual(rangeRegex.test(content), false, 'No Unicode emoji range characters allowed')
  })

  it('3. Apple HIG ergonomics: 44px minimum touch targets and touch-manipulation', () => {
    assert.ok(content.includes('min-h-[44px]'), 'Must enforce min-h-[44px] on interactive buttons')
    assert.ok(content.includes('min-w-[44px]'), 'Must enforce min-w-[44px] on interactive buttons')
    assert.ok(content.includes('touch-manipulation'), 'Must include touch-manipulation class')
  })

  it('4. 5-second skip backward and forward with boundary checks', () => {
    // Check template triggers
    assert.ok(
      content.includes('skip(-5)') || content.includes('skip(- 5)'),
      'Must contain skip backward 5s trigger'
    )
    assert.ok(
      content.includes('skip(5)') || content.includes('skip(+ 5)'),
      'Must contain skip forward 5s trigger'
    )
    assert.ok(
      content.includes('SkipBack'),
      'Must render SkipBack icon'
    )
    assert.ok(
      content.includes('SkipForward'),
      'Must render SkipForward icon'
    )
    // Check boundary checks in skip function
    assert.ok(
      content.includes('Math.max') && content.includes('Math.min'),
      'Skip logic must clamp currentTime within [0, duration]'
    )
  })

  it('5. Variable speed selector supporting 0.75x, 1.0x, 1.25x, 1.5x', () => {
    assert.ok(content.includes('0.75'), 'Must include 0.75x speed option')
    assert.ok(content.includes('1.25'), 'Must include 1.25x speed option')
    assert.ok(content.includes('1.5'), 'Must include 1.5x speed option')
    assert.ok(content.includes('playbackRate'), 'Must manage playbackRate state')
  })

  it('6. Multi-state subtitle mode toggle (bilingual, en, zh, off)', () => {
    // Mode state & cycle handler
    assert.ok(
      content.includes('subtitleMode'),
      'Must maintain subtitleMode state'
    )
    assert.ok(
      content.includes('cycleSubtitleMode') || content.includes('setSubtitleMode'),
      'Must have cycleSubtitleMode or setSubtitleMode handler'
    )
    // Modes presence
    assert.ok(content.includes('bilingual'), 'Must support bilingual mode')
    assert.ok(content.includes('en'), 'Must support en mode')
    assert.ok(content.includes('zh'), 'Must support zh mode')
    assert.ok(content.includes('off'), 'Must support off mode')

    // Conditional subtitle rendering
    assert.ok(
      content.includes("subtitleMode === 'bilingual'") ||
      content.includes("subtitleMode !== 'off'") ||
      content.includes("['bilingual', 'en'].includes"),
      'Must conditionally render subtitles based on subtitleMode'
    )
  })

  it('7. Immersive blind mode frosted glass overlay on video container with exit button', () => {
    // Frosted glass styling on video container
    assert.ok(
      content.includes('backdrop-blur-md') && content.includes('bg-stone-950/85'),
      'Video container must display frosted glass overlay with backdrop-blur-md bg-stone-950/85'
    )
    // Motivational / instructional copy
    assert.ok(
      content.includes('盲听沉浸模式 · 专注纯正听感'),
      'Must include copy: 盲听沉浸模式 · 专注纯正听感'
    )
    // Exit button
    assert.ok(
      content.includes('toggleBlindMode'),
      'Overlay must provide a 1-click button calling toggleBlindMode'
    )
  })

  it('8. Fullscreen toggle using fullscreen API with dynamic Maximize/Minimize icon', () => {
    assert.ok(content.includes('toggleFullscreen'), 'Must provide toggleFullscreen handler')
    assert.ok(
      content.includes('requestFullscreen') && content.includes('exitFullscreen'),
      'Must use browser requestFullscreen and exitFullscreen APIs'
    )
    assert.ok(content.includes('isFullscreen'), 'Must track isFullscreen reactive state')
    assert.ok(
      content.includes('Minimize') && content.includes('Maximize'),
      'Must switch between Maximize and Minimize icons based on fullscreen state'
    )
  })
})
