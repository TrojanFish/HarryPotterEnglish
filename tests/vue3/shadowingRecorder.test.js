import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

test('ShadowingRecorder.vue file exists and meets standards', () => {
  const filePath = path.resolve('src/components/ShadowingRecorder.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/ShadowingRecorder.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes('evaluatePronunciation'), 'Must use evaluatePronunciation from speechScoring')
  assert.ok(content.includes('Track A') || content.includes('track-a'), 'Must support Track A original audio')
  assert.ok(content.includes('Track B') || content.includes('track-b'), 'Must support Track B user recording')
  assert.ok(content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('h-12'), 'Touch targets must be >= 44px')
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
})

test('evaluatePronunciation scoring logic integration', async () => {
  const { evaluatePronunciation } = await import('../../src/utils/speechScoring.js')
  const target = 'Mr. and Mrs. Dursley of number four Privet Drive'
  const spoken = 'Mr and Mrs Dursley of number four Privet Drive'
  const res = evaluatePronunciation(target, spoken)

  assert.ok(res.score >= 90, 'Score should be high for nearly identical speech')
  assert.ok(Array.isArray(res.words), 'Result must contain word-level tokens')
  assert.strictEqual(res.words[0].status, 'matched')
})
