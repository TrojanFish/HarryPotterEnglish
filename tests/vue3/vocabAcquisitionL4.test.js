import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { useVocabStore } from '../../src/stores/vocabStore.js'
import { cleanWordToken } from '../../src/data/dictionaryData.js'

describe('L4 Production Wiring in Dictation and TED Tasks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('StepDictation.vue calls recordAcquisition for l4', () => {
    const content = fs.readFileSync(path.resolve('src/components/session/StepDictation.vue'), 'utf-8')
    assert.ok(content.includes('recordAcquisition'), 'StepDictation must invoke recordAcquisition')
    assert.ok(content.includes('l4'), 'Must record l4 production')
    assert.ok(content.includes('useVocabStore'), 'StepDictation must import useVocabStore')
    assert.ok(content.includes('cleanWordToken'), 'StepDictation must import cleanWordToken')
  })

  test('TedTaskStudio.vue calls recordAcquisition for l4 on correct cloze answer', () => {
    const content = fs.readFileSync(path.resolve('src/components/ted/TedTaskStudio.vue'), 'utf-8')
    assert.ok(content.includes('recordAcquisition'), 'TedTaskStudio must invoke recordAcquisition')
    assert.ok(content.includes('l4'), 'Must record l4 production')
    assert.ok(content.includes('useVocabStore'), 'TedTaskStudio must import useVocabStore')
    assert.ok(content.includes('cleanWordToken'), 'TedTaskStudio must import cleanWordToken')
    assert.ok(content.includes('submitClozeAnswer'), 'TedTaskStudio must define or use submitClozeAnswer')
  })

  test('vocabStore records l4 production acquisition successfully', () => {
    const vocabStore = useVocabStore()
    // cloak is in initial seeds with l4: false
    const itemBefore = vocabStore.vocabList.find((w) => w.word === 'cloak')
    assert.ok(itemBefore, 'cloak should be present')
    assert.strictEqual(itemBefore.acquisition.l4, false, 'l4 should initially be false for cloak')

    const recorded = vocabStore.recordAcquisition('cloak', 'l4')
    assert.strictEqual(recorded, true, 'recordAcquisition should succeed')
    assert.strictEqual(itemBefore.acquisition.l4, true, 'cloak acquisition.l4 must now be true')
  })

  test('Both components contain zero Unicode emojis', () => {
    const dictationContent = fs.readFileSync(path.resolve('src/components/session/StepDictation.vue'), 'utf-8')
    const tedContent = fs.readFileSync(path.resolve('src/components/ted/TedTaskStudio.vue'), 'utf-8')

    assert.ok(!/\p{Extended_Pictographic}/u.test(dictationContent), 'StepDictation.vue must have zero emoji')
    assert.ok(!/\p{Extended_Pictographic}/u.test(tedContent), 'TedTaskStudio.vue must have zero emoji')
  })
})
