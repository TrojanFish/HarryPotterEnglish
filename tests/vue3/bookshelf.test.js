import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

test('BookshelfDrawer.vue exists and enforces CEFR levels, Apple HIG touch targets, and R2-only displayBooks', () => {
  const filePath = path.resolve('src/components/BookshelfDrawer.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/BookshelfDrawer.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes('usePlayerStore'), 'Must bind to usePlayerStore')
  assert.ok(content.includes('displayBooks'), 'Must iterate over displayBooks derived from R2 catalog')
  assert.ok(content.includes('availableBooks') || content.includes('catalog.books'), 'Must reference catalog books')
  assert.ok(content.includes('CEFR') || content.includes('cefr'), 'Must display CEFR difficulty badges')
  assert.ok(content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('h-12'), 'Touch targets must be >= 44px')
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
})

test('BookshelfPageView.vue only renders books and chapters actually stored in R2', () => {
  const filePath = path.resolve('src/components/views/BookshelfPageView.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/views/BookshelfPageView.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes('displayBooks'), 'Must iterate over displayBooks derived from R2 catalog')
  assert.ok(content.includes('availableBooks') || content.includes('catalogStore.books'), 'Must reference availableBooks')
  assert.ok(content.includes('min-h-[44px]'), 'Touch targets must be >= 44px')
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')

  const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
  assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emojis')
})

test('booksData exports BOOKS and CEFR_LEVELS', async () => {
  const { BOOKS, CEFR_LEVELS } = await import('../../src/utils/booksData.js')
  assert.ok(Array.isArray(BOOKS), 'BOOKS must be an array')
  assert.strictEqual(BOOKS.length, 7, 'There should be 7 Harry Potter books')
  assert.ok(CEFR_LEVELS.A2, 'CEFR_LEVELS must have A2')
  assert.ok(CEFR_LEVELS.C1, 'CEFR_LEVELS must have C1')
})

