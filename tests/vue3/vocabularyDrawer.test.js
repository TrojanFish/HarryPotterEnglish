import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

test('VocabularyDrawer.vue file exists and meets standards', () => {
  const filePath = path.resolve('src/components/VocabularyDrawer.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/VocabularyDrawer.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes('generateAnkiTSV') || content.includes('anki'), 'Must support Anki export')
  assert.ok(content.includes('generatePrintableParchmentHTML') || content.includes('print'), 'Must support A4 parchment PDF generation')
  assert.ok(content.includes('Box') || content.includes('box'), 'Must support Leitner boxes')
  assert.ok(content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('h-12'), 'Touch targets must be >= 44px')
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
})

test('Anki TSV generation integration check', async () => {
  const { generateAnkiTSV } = await import('../../src/utils/ankiExport.js')
  const sample = [
    { word: 'wand', phonetic: '/wɒnd/', definition: '魔法棒', contextQuote: 'The wand chooses the wizard.' }
  ]
  const tsv = generateAnkiTSV(sample)
  assert.ok(tsv.includes('wand'), 'TSV must contain word')
  assert.ok(tsv.includes('#deck:'), 'TSV must contain deck directive')
})
