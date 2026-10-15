import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

test('BookshelfDrawer.vue exists and enforces CEFR levels and Apple HIG touch targets', () => {
  const filePath = path.resolve('src/components/BookshelfDrawer.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/BookshelfDrawer.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes('usePlayerStore'), 'Must bind to usePlayerStore')
  assert.ok(content.includes('BOOKS') || content.includes('books'), 'Must reference books data')
  assert.ok(content.includes('CEFR') || content.includes('cefr'), 'Must display CEFR difficulty badges')
  assert.ok(content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('h-12'), 'Touch targets must be >= 44px')
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
})

test('booksData exports BOOKS and CEFR_LEVELS', async () => {
  const { BOOKS, CEFR_LEVELS } = await import('../../src/utils/booksData.js')
  assert.ok(Array.isArray(BOOKS), 'BOOKS must be an array')
  assert.strictEqual(BOOKS.length, 7, 'There should be 7 Harry Potter books')
  assert.ok(CEFR_LEVELS.A2, 'CEFR_LEVELS must have A2')
  assert.ok(CEFR_LEVELS.C1, 'CEFR_LEVELS must have C1')
})
