import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

test('StudioWorkbench.vue file exists and meets standards', () => {
  const filePath = path.resolve('src/components/StudioWorkbench.vue')
  assert.ok(fs.existsSync(filePath), 'StudioWorkbench.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  // Store bindings
  assert.ok(content.includes('useSubtitleStore'), 'Must bind to useSubtitleStore')
  assert.ok(content.includes('usePlayerStore'), 'Must bind to usePlayerStore')
  assert.ok(content.includes('useVocabStore'), 'Must bind to useVocabStore')
  // Lucide icons & Zero emojis
  assert.ok(content.includes('lucide-vue-next'), 'Must use Lucide icons')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
  // Zero heavy shadows
  assert.ok(!content.includes('shadow-2xl') && !content.includes('shadow-xl'), 'Strict zero-shadow')
  // Apple HIG touch targets
  assert.ok(content.includes('min-h-[44px]') || content.includes('h-10') || content.includes('h-11') || content.includes('h-12'), 'Interactive targets must meet touch ergonomic standards')
})

test('StudioWorkbench pronunciation evaluation logic integration', async () => {
  const { evaluatePronunciation } = await import('../../src/utils/speechScoring.js')
  const target = 'were proud to say that they were perfectly normal'
  const spoken = 'were proud to say that they were perfectly normal'
  const res = evaluatePronunciation(target, spoken)
  assert.strictEqual(res.score, 100)
})
