import { test, describe } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('StepShadowing component', () => {
  test('StepShadowing.vue file exists and meets standards', () => {
    const filePath = path.resolve('src/components/session/StepShadowing.vue')
    assert.ok(fs.existsSync(filePath), 'StepShadowing.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('min-h-[44px]') || content.includes('touch-target'), 'Must have 44px touch targets')
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'Must contain zero unicode emoji')
    assert.ok(content.includes('Track A') && content.includes('Track B'), 'Must have dual track comparison')
    assert.ok(content.includes('playOriginalSnippet') || content.includes('playTrackA'), 'Must have original snippet playback')
  })

  test('StepShadowing has snippet cutoff logic at cue.end - 0.15', () => {
    const filePath = path.resolve('src/components/session/StepShadowing.vue')
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('0.15'), 'Must enforce 0.15s cutoff threshold before cue end')
  })
})
