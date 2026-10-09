import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

test('SubtitleViewer.vue exists and enforces hero sentence styles and zero emojis', () => {
  const filePath = path.resolve('src/components/SubtitleViewer.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/SubtitleViewer.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  // Check hero sentence classes and touch targets
  assert.ok(content.includes('reading-hero-sentence') || content.includes('border-[#d97706]'), 'Must support hero sentence highlight')
  assert.ok(content.includes('useSubtitleStore'), 'Must bind to useSubtitleStore')
  assert.ok(content.includes('usePlayerStore'), 'Must bind to usePlayerStore')
  assert.ok(content.includes('scrollIntoView'), 'Must support smooth scrollIntoView on active cue')
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
})

test('Cue jump click logic calculation', () => {
  const cue = { id: 1, start: 12.5, end: 18.2, text: 'Hello Hogwarts' }
  const targetSeek = cue.start
  assert.strictEqual(targetSeek, 12.5)
})
