import { test, describe } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('SmartAudioPlayer component', () => {
  test('SmartAudioPlayer.vue file exists and meets standards', () => {
    const filePath = path.resolve('src/components/player/SmartAudioPlayer.vue')
    assert.ok(fs.existsSync(filePath), 'SmartAudioPlayer.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('min-h-[44px]') || content.includes('touch-target') || content.includes('w-11 h-11'), 'Must have 44px touch targets')
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'Must contain zero unicode emoji')
    assert.ok(content.includes('playerStore'), 'Must integrate with playerStore')
  })

  test('SmartAudioPlayer includes single sentence loop, speed cycle, and sleep timer actions', () => {
    const filePath = path.resolve('src/components/player/SmartAudioPlayer.vue')
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('toggleLoop') || content.includes('isLooping'), 'Must support loop toggle')
    assert.ok(content.includes('lockedLoopCue'), 'Must maintain lockedLoopCue for precise single-sentence loop')
    assert.ok(content.includes('cycleRate') || content.includes('playbackRate'), 'Must support playback rate cycling')
    assert.ok(content.includes('sleepTimer') || content.includes('isSleepMenuOpen'), 'Must support sleep timer actions')
    assert.ok(content.includes('Moon'), 'Must feature Moon icon for sleep timer')
    assert.ok(content.includes('useBottomSheet'), 'Sleep timer modal must use bottom sheet gesture composable')
    assert.ok(content.includes('translate-y-full'), 'Sleep timer modal must slide up/down from bottom')
  })

  test('SmartAudioPlayer enforces centered symmetry layout and balanced auxiliary controls', () => {
    const filePath = path.resolve('src/components/player/SmartAudioPlayer.vue')
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(
      content.includes('grid-cols-[1fr_auto_1fr]') || content.includes('grid-cols-3') || (content.includes('justify-start') && content.includes('justify-end')),
      'Must use 3-column grid or equal flex-1 ends to ensure play button is dead-center'
    )
    assert.ok(content.includes('toggleBlindMode') || content.includes('isBlindMode'), 'Right auxiliary cluster must include blind mode toggle')
    assert.ok(content.includes('EyeOff') || content.includes('Eye'), 'Must import Eye / EyeOff icon for blind mode toggle')
  })
})
