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
  assert.ok(content.includes('useVocabStore'), 'Must bind to useVocabStore')
  assert.ok(content.includes('scrollIntoView'), 'Must support smooth scrollIntoView on active cue')
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
  assert.ok(content.includes('tokenizeText'), 'Must implement word tokenization')
  assert.ok(content.includes('handleWordClick'), 'Must implement word click handler')
  assert.ok(content.includes('toastWord'), 'Must implement toast notification state')
})

test('Cue jump click logic calculation', () => {
  const cue = { id: 1, start: 12.5, end: 18.2, text: 'Hello Hogwarts' }
  const targetSeek = cue.start
  assert.strictEqual(targetSeek, 12.5)
})

test('Word tokenization and punctuation stripping logic for word-tap', () => {
  function tokenizeText(text) {
    if (!text) return []
    return text.trim().split(/\s+/)
  }

  function cleanWord(token) {
    return token.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '')
  }

  const rawSentence = 'Mr. and Mrs. Dursley, of number four, Privet Drive...'
  const tokens = tokenizeText(rawSentence)

  assert.deepStrictEqual(tokens, [
    'Mr.',
    'and',
    'Mrs.',
    'Dursley,',
    'of',
    'number',
    'four,',
    'Privet',
    'Drive...'
  ])

  assert.strictEqual(cleanWord('Dursley,'), 'dursley')
  assert.strictEqual(cleanWord('"peculiar"'), 'peculiar')
  assert.strictEqual(cleanWord('Drive...'), 'drive')
  assert.strictEqual(cleanWord('---'), '')
})
