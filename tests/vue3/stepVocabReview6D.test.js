import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('StepVocabReview 6D Depth & Box 5 Guard', () => {
  const filePath = path.resolve('src/components/session/StepVocabReview.vue')

  test('StepVocabReview imports VocabDepthMeter and handles Box 5 L4 requirement', () => {
    assert.ok(fs.existsSync(filePath), 'StepVocabReview.vue file must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('VocabDepthMeter'), 'Must import and use VocabDepthMeter')
    assert.ok(content.includes('recordAcquisition'), 'Must call recordAcquisition for l3 recall')
    assert.ok(
      content.includes('NEED_L4_PRODUCTION') || content.includes('l4Notice') || content.includes('l4Message'),
      'Must handle Box 5 L4 feedback'
    )

    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
  })

  test('StepVocabReview meets touch target and accessibility standards', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('min-h-[44px]'), 'Must support 44px touch targets')
    assert.ok(content.includes('touch-manipulation'), 'Must include touch-manipulation')
    assert.ok(content.includes('role="alert"') || content.includes('AlertCircle'), 'Must have accessible alert banner for L4 notice')
  })

  test('StepVocabReview mounts VocabDepthMeter with full size on flashcard back', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('<VocabDepthMeter'), 'Must render VocabDepthMeter component')
    assert.ok(content.includes('size="full"'), 'Must pass size="full" to VocabDepthMeter')
    assert.ok(content.includes(':acquisition='), 'Must bind acquisition property')
  })
})
