import { test, describe } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('StepVocabReview component', () => {
  test('StepVocabReview.vue file exists and meets standards', () => {
    const filePath = path.resolve('src/components/session/StepVocabReview.vue')
    assert.ok(fs.existsSync(filePath), 'StepVocabReview.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('min-h-[44px]') || content.includes('touch-target'), 'Must have 44px touch targets')
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'Must contain zero unicode emoji')
    assert.ok(content.includes('vocabStore'), 'Must integrate with vocabStore')
  })

  test('StepVocabReview supports Leitner box promotion and flashcard flipping', () => {
    const filePath = path.resolve('src/components/session/StepVocabReview.vue')
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('promoteBox') || content.includes('handlePromote'), 'Must support promoteBox action')
    assert.ok(content.includes('isFlipped') || content.includes('flipCard'), 'Must support card flip action')
  })
})
