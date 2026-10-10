import { test, describe } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('StepListening component', () => {
  test('StepListening.vue file exists and meets standards', () => {
    const filePath = path.resolve('src/components/session/StepListening.vue')
    assert.ok(fs.existsSync(filePath), 'StepListening.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('min-h-[44px]') || content.includes('touch-target'), 'Must have 44px touch targets')
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'Must contain zero unicode emoji')
    assert.ok(content.includes('vocabStore'), 'Must integrate with vocabStore')
    assert.ok(content.includes('subtitleStore'), 'Must integrate with subtitleStore')
  })

  test('StepListening includes blind mode and word-tap mechanics', () => {
    const filePath = path.resolve('src/components/session/StepListening.vue')
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('isBlindMode') || content.includes('toggleBlind'), 'Must support blind listening mode')
    assert.ok(content.includes('tokenizeText') || content.includes('handleWordClick'), 'Must support word tap tokenization')
  })
})
