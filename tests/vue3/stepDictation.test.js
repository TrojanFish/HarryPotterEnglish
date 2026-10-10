import { test, describe } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('StepDictation component', () => {
  test('StepDictation.vue file exists and meets standards', () => {
    const filePath = path.resolve('src/components/session/StepDictation.vue')
    assert.ok(fs.existsSync(filePath), 'StepDictation.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('min-h-[44px]') || content.includes('touch-target'), 'Must have 44px touch targets')
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'Must contain zero unicode emoji')
    assert.ok(content.includes('text-base') || content.includes('text-lg'), 'Textarea must be >= 16px to prevent iOS zoom')
    assert.ok(content.includes('autocapitalize="none"'), 'Must disable auto-capitalization')
  })

  test('StepDictation token diff and enter key handling logic exists', () => {
    const filePath = path.resolve('src/components/session/StepDictation.vue')
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('checkDictation'), 'Must have checkDictation method')
    assert.ok(content.includes('@keydown.enter'), 'Must support enter key submission')
  })
})
