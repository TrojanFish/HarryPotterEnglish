import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Card Padding Consistency Across Flow Steps (p-5 sm:p-6 rounded-2xl)', () => {
  test('StepShadowing.vue uses unified p-5 sm:p-6 rounded-2xl across all cards', () => {
    const filePath = path.resolve('src/components/session/StepShadowing.vue')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Disallow inconsistent p-4 sm:p-5
    assert.strictEqual(
      content.includes('p-4 sm:p-5'),
      false,
      'StepShadowing.vue should not contain inconsistent p-4 sm:p-5'
    )

    // Ensure Track cards and evaluation result use p-5 sm:p-6 rounded-2xl
    const matches = content.match(/p-5 sm:p-6[^"]*rounded-2xl|rounded-2xl[^"]*p-5 sm:p-6/g)
    assert.ok(matches && matches.length >= 3, `Expected at least 3 p-5 sm:p-6 rounded-2xl cards in StepShadowing, found ${matches ? matches.length : 0}`)
  })

  test('StepDictation.vue uses unified p-5 sm:p-6 rounded-2xl across all cards', () => {
    const filePath = path.resolve('src/components/session/StepDictation.vue')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Disallow inconsistent p-4 sm:p-5
    assert.strictEqual(
      content.includes('p-4 sm:p-5'),
      false,
      'StepDictation.vue should not contain inconsistent p-4 sm:p-5'
    )

    // Ensure all main cards use p-5 sm:p-6 rounded-2xl
    const matches = content.match(/p-5 sm:p-6[^"]*rounded-2xl|rounded-2xl[^"]*p-5 sm:p-6/g)
    assert.ok(matches && matches.length >= 4, `Expected at least 4 p-5 sm:p-6 rounded-2xl cards in StepDictation, found ${matches ? matches.length : 0}`)
  })

  test('StepVocabReview.vue uses unified p-5 sm:p-6 rounded-2xl across all cards', () => {
    const filePath = path.resolve('src/components/session/StepVocabReview.vue')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Disallow inconsistent p-4 sm:p-5
    assert.strictEqual(
      content.includes('p-4 sm:p-5'),
      false,
      'StepVocabReview.vue should not contain inconsistent p-4 sm:p-5'
    )

    // Disallow inflated p-6 sm:p-8
    assert.strictEqual(
      content.includes('p-6 sm:p-8'),
      false,
      'Flashcards in StepVocabReview.vue should not use inflated p-6 sm:p-8'
    )

    // Disallow p-8 on empty state
    assert.strictEqual(
      content.includes('p-8 bg-[#f8f8f6]'),
      false,
      'Empty state should not use p-8'
    )

    // Flashcard front and back must use p-5 sm:p-6 rounded-2xl
    const matches = content.match(/p-5 sm:p-6[^"]*rounded-2xl|rounded-2xl[^"]*p-5 sm:p-6/g)
    assert.ok(matches && matches.length >= 3, `Expected at least 3 p-5 sm:p-6 rounded-2xl cards in StepVocabReview, found ${matches ? matches.length : 0}`)
  })
})
