import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

test('AnalyticsDashboard.vue file exists and meets standards', () => {
  const filePath = path.resolve('src/components/AnalyticsDashboard.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/AnalyticsDashboard.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes('svg') || content.includes('SVG'), 'Must render SVG chart for weekly trend')
  assert.ok(content.includes('Streak') || content.includes('streak'), 'Must display streak days')
  assert.ok(content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('h-12'), 'Touch targets must be >= 44px')
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
})

test('analyticsStore summary integration check', async () => {
  const { createInitialState, sanitizeState } = await import('../../src/utils/analyticsStore.js')
  const initial = createInitialState()
  assert.strictEqual(initial.streakDays, 0)
  assert.ok(Array.isArray(initial.completedChapters))

  const clean = sanitizeState(initial)
  assert.ok(clean.dailyListeningSeconds !== undefined)
})
