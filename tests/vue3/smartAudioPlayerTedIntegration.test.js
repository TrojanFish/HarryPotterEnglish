import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'

describe('SmartAudioPlayer & TedVideoPlayer Unified Dock Integration', () => {
  const smartPlayerPath = path.resolve('src/components/player/SmartAudioPlayer.vue')
  const tedVideoPath = path.resolve('src/components/ted/TedVideoPlayer.vue')
  const appShellPath = path.resolve('src/components/layout/AppShell.vue')
  const tedStorePath = path.resolve('src/stores/tedStore.js')

  const smartPlayerContent = fs.existsSync(smartPlayerPath) ? fs.readFileSync(smartPlayerPath, 'utf-8') : ''
  const tedVideoContent = fs.existsSync(tedVideoPath) ? fs.readFileSync(tedVideoPath, 'utf-8') : ''
  const appShellContent = fs.existsSync(appShellPath) ? fs.readFileSync(appShellPath, 'utf-8') : ''
  const tedStoreContent = fs.existsSync(tedStorePath) ? fs.readFileSync(tedStorePath, 'utf-8') : ''

  it('1. SmartAudioPlayer integrates useTedStore and detects isTedMode', () => {
    assert.ok(smartPlayerContent.includes('useTedStore'), 'SmartAudioPlayer must import useTedStore')
    assert.ok(smartPlayerContent.includes('isTedMode'), 'SmartAudioPlayer must declare isTedMode computed property')
  })

  it('2. SmartAudioPlayer binds to TED time, duration, and play/pause in TED mode', () => {
    assert.ok(smartPlayerContent.includes('tedStore.videoCurrentTime') || smartPlayerContent.includes('videoCurrentTime'), 'Must read TED current time')
    assert.ok(smartPlayerContent.includes('tedStore.videoDuration') || smartPlayerContent.includes('videoDuration'), 'Must read TED duration')
    assert.ok(smartPlayerContent.includes('togglePlayVideo') || smartPlayerContent.includes('tedStore.togglePlayVideo') || smartPlayerContent.includes('tedStore.togglePlay'), 'Must support toggling TED video playback')
  })

  it('3. SmartAudioPlayer right-side cluster includes Subtitle and Fullscreen controls for TED mode', () => {
    assert.ok(smartPlayerContent.includes('Subtitles'), 'Must import Subtitles icon for TED subtitle mode toggle')
    assert.ok(smartPlayerContent.includes('Maximize') || smartPlayerContent.includes('Minimize'), 'Must import Maximize / Minimize icons for TED fullscreen')
    assert.ok(smartPlayerContent.includes('toggleFullscreen') || smartPlayerContent.includes('tedStore.toggleFullscreen'), 'Must support fullscreen toggle')
    assert.ok(smartPlayerContent.includes('cycleSubtitleMode') || smartPlayerContent.includes('subtitleMode'), 'Must support subtitle mode toggle')
  })

  it('4. SmartAudioPlayer conditionally shows or hides based on TED currentStep', () => {
    assert.ok(smartPlayerContent.includes('currentStep') || smartPlayerContent.includes('shouldShowPlayer'), 'Must be step-aware for TED mode')
  })

  it('5. TedVideoPlayer delegates bottom docking to SmartAudioPlayer without duplicate player bar', () => {
    assert.ok(!tedVideoContent.includes('bg-[#1e1610]/90 backdrop-blur-md border-t border-amber-900/40 p-3 sm:p-4 z-20 flex flex-col gap-2'), 'Redundant duplicate black control bar must be removed from TedVideoPlayer.vue')
  })

  it('6. TedVideoPlayer supports direct video click-to-play and double-click fullscreen gestures', () => {
    assert.ok(tedVideoContent.includes('@click') && (tedVideoContent.includes('togglePlay') || tedVideoContent.includes('togglePlayVideo')), 'Video element must handle click for play/pause')
    assert.ok(tedVideoContent.includes('@dblclick') && tedVideoContent.includes('toggleFullscreen'), 'Video element must handle double click for fullscreen')
  })

  it('7. All modified files maintain zero Unicode emojis', () => {
    for (const [name, content] of [
      ['SmartAudioPlayer.vue', smartPlayerContent],
      ['TedVideoPlayer.vue', tedVideoContent],
      ['AppShell.vue', appShellContent],
      ['tedStore.js', tedStoreContent]
    ]) {
      assert.ok(content.length > 0, `${name} must not be empty`)
      assert.doesNotMatch(content, /\p{Extended_Pictographic}/u, `Emoji found in ${name}`)
    }
  })

  it('8. All interactive controls uphold Apple HIG 44px touch targets', () => {
    assert.ok(smartPlayerContent.includes('min-h-[44px]'), 'SmartAudioPlayer must retain min-h-[44px]')
    assert.ok(smartPlayerContent.includes('touch-manipulation'), 'SmartAudioPlayer must retain touch-manipulation')
  })
})
