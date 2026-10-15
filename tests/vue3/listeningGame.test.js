import { test, describe } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Listening Game Multi-Difficulty & Legal Disclaimer Removal', () => {
  test('StepDictation.vue includes 3 difficulty game modes', () => {
    const filePath = path.resolve('src/components/session/StepDictation.vue')
    assert.ok(fs.existsSync(filePath), 'StepDictation.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // 3 difficulty modes
    assert.ok(content.includes('scramble'), 'Must support Word Scramble mode')
    assert.ok(content.includes('cloze'), 'Must support Cloze Key Words mode')
    assert.ok(content.includes('full'), 'Must support Full Dictation mode')
    assert.ok(content.includes('词块拼图'), 'Must display scramble mode label')
    assert.ok(content.includes('重点挖空'), 'Must display cloze mode label')
    assert.ok(content.includes('全句精听'), 'Must display full dictation mode label')
  })

  test('StepDictation.vue and DictationStudio.vue enforce single-sentence audio loop cutoff guard', () => {
    const stepDictPath = path.resolve('src/components/session/StepDictation.vue')
    const stepContent = fs.readFileSync(stepDictPath, 'utf-8')
    assert.ok(
      stepContent.includes('cue.end - 0.15') || stepContent.includes('end - 0.15'),
      'StepDictation must stop playback at cue.end - 0.15s threshold to prevent sentence overflow'
    )

    const studioPath = path.resolve('src/components/DictationStudio.vue')
    const studioContent = fs.readFileSync(studioPath, 'utf-8')
    assert.ok(
      studioContent.includes('cue.end - 0.15') || studioContent.includes('end - 0.15'),
      'DictationStudio must stop playback at cue.end - 0.15s threshold'
    )
  })

  test('StepDictation.vue includes star ratings, combos, and touch target standards', () => {
    const filePath = path.resolve('src/components/session/StepDictation.vue')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('starRating') || content.includes('Star'), 'Must include star rating evaluation')
    assert.ok(content.includes('comboCount') || content.includes('连胜'), 'Must include combo streak counter')
    assert.ok(content.includes('min-h-[44px]'), 'Must enforce Apple HIG 44px touch targets')
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'Must have zero unicode emojis')
  })

  test('LegalDisclaimerModal.vue is removed and unreferenced across all drawer/modal components', () => {
    const modalPath = path.resolve('src/components/LegalDisclaimerModal.vue')
    assert.ok(!fs.existsSync(modalPath), 'LegalDisclaimerModal.vue must be completely deleted')

    const bookshelfPath = path.resolve('src/components/BookshelfDrawer.vue')
    const bookshelfContent = fs.readFileSync(bookshelfPath, 'utf-8')
    assert.ok(!bookshelfContent.includes('LegalDisclaimerModal'), 'BookshelfDrawer must not reference LegalDisclaimerModal')
    assert.ok(!bookshelfContent.includes('研学公约与版权声明'), 'BookshelfDrawer must not include legal notice button')

    const shortcutsPath = path.resolve('src/components/ShortcutsModal.vue')
    const shortcutsContent = fs.readFileSync(shortcutsPath, 'utf-8')
    assert.ok(!shortcutsContent.includes('LegalDisclaimerModal'), 'ShortcutsModal must not reference LegalDisclaimerModal')
    assert.ok(!shortcutsContent.includes('研学公约与版权声明'), 'ShortcutsModal must not include legal notice button')
  })
})
