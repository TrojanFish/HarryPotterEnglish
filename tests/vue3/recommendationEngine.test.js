import { describe, test } from 'node:test'
import assert from 'node:assert'
import { computeNextStepRecommendation } from '../../src/utils/recommendationEngine.js'

describe('recommendationEngine Unit Tests', () => {
  test('1. module exports computeNextStepRecommendation function', () => {
    assert.strictEqual(typeof computeNextStepRecommendation, 'function')
  })

  test('2. cold-start returns valid HP1 Chapter 1 and beginner TED talk with starter rationale', () => {
    const rec = computeNextStepRecommendation({
      cefrLevel: 'A2',
      totalListeningSeconds: 0,
      completedChapters: [],
      vocabList: []
    })

    assert.ok(rec, 'Must return recommendation object')
    assert.strictEqual(rec.category, 'starter')
    assert.strictEqual(rec.rationale, '欢迎来到霍格沃茨！从第一部第一章开启你的原声魔法之旅。')

    // HP Chapter checks
    assert.ok(rec.hpChapter, 'Must recommend an HP chapter')
    assert.strictEqual(rec.hpChapter.bookId, 'book1')
    assert.strictEqual(rec.hpChapter.bookCode, 'HP1')
    assert.strictEqual(rec.hpChapter.chapterId, 'b1_c01')
    assert.strictEqual(rec.hpChapter.chapterNumber, 1)
    assert.strictEqual(rec.hpChapter.title, 'The Boy Who Lived')
    assert.strictEqual(rec.hpChapter.titleZh, '大难不死的男孩')
    assert.strictEqual(rec.hpChapter.cefr, 'A2')
    assert.strictEqual(rec.hpChapter.color, '#740001')
    assert.ok(typeof rec.hpChapter.score === 'number')

    // TED Talk checks
    assert.ok(rec.tedTalk, 'Must recommend a TED talk')
    assert.strictEqual(rec.tedTalk.id, 'ted-simon-sinek-2009')
    assert.strictEqual(rec.tedTalk.title, 'How Great Leaders Inspire Action')
    assert.strictEqual(rec.tedTalk.speaker, 'Simon Sinek')
    assert.strictEqual(rec.tedTalk.cefr, 'B1')
    assert.ok(typeof rec.tedTalk.score === 'number')
    assert.ok(Array.isArray(rec.tedTalk.topicTags))
  })

  test('3. recommends next uncompleted chapter (b1_c03) when completedChapters contains b1_c01 and b1_c02', () => {
    const rec = computeNextStepRecommendation({
      cefrLevel: 'A2',
      totalListeningSeconds: 1200,
      completedChapters: ['b1_c01', 'b1_c02'],
      vocabList: []
    })

    assert.ok(rec.hpChapter, 'Must recommend an HP chapter')
    assert.strictEqual(rec.hpChapter.chapterId, 'b1_c03')
    assert.strictEqual(rec.hpChapter.chapterNumber, 3)
    assert.strictEqual(rec.hpChapter.bookCode, 'HP1')
    assert.strictEqual(rec.category, 'progress')
    assert.ok(rec.rationale.includes('HP1') || rec.rationale.includes('上一章'))
  })

  test('4. weights CEFR level appropriately (B2 user gets B2 content prioritized over A2)', () => {
    const rec = computeNextStepRecommendation({
      cefrLevel: 'B2',
      totalListeningSeconds: 7200,
      completedChapters: ['b1_c01'],
      vocabList: []
    })

    assert.ok(rec.hpChapter)
    assert.strictEqual(rec.hpChapter.cefr, 'B2')
    // Books with B2 are book4, book5, book6
    assert.ok(['book4', 'book5', 'book6'].includes(rec.hpChapter.bookId))
  })

  test('5. matches vocab overlap for vocabulary reinforcement', () => {
    // User has words from Simon Sinek's talk in L1~L3 acquisition stage
    const rec = computeNextStepRecommendation({
      cefrLevel: 'B1',
      totalListeningSeconds: 3000,
      completedChapters: ['b1_c01'],
      vocabList: [
        { word: 'inspire', acquisition: { l1: true, l2: true, l3: true, l4: false } },
        { word: 'innovative', acquisition: { l1: true, l2: true, l3: false, l4: false } },
        { word: 'distinguish', acquisition: { l1: true, l2: false, l3: false, l4: false } }
      ]
    })

    assert.ok(rec.tedTalk)
    assert.strictEqual(rec.tedTalk.id, 'ted-simon-sinek-2009')
    assert.ok(rec.tedTalk.score > 0)
    assert.ok(rec.category === 'vocab' || rec.rationale.includes('词汇'))
  })

  test('6. handles missing or malformed userState defensively without throwing', () => {
    const cases = [
      undefined,
      null,
      {},
      { cefrLevel: 'UNKNOWN', totalListeningSeconds: -99, completedChapters: null, vocabList: 'invalid' },
      { cefrLevel: 123, totalListeningSeconds: 'NaN', completedChapters: [null, undefined], vocabList: null }
    ]

    for (const c of cases) {
      assert.doesNotThrow(() => {
        const rec = computeNextStepRecommendation(c)
        assert.ok(rec)
        assert.ok(rec.hpChapter)
        assert.ok(rec.tedTalk)
        assert.ok(typeof rec.rationale === 'string')
        assert.ok(['challenge', 'progress', 'vocab', 'starter'].includes(rec.category))
      })
    }
  })

  test('7. strict zero Unicode emojis across output strings', () => {
    const states = [
      {},
      { totalListeningSeconds: 0, completedChapters: [] },
      { cefrLevel: 'B1', totalListeningSeconds: 1500, completedChapters: ['b1_c01'] },
      { cefrLevel: 'B2', totalListeningSeconds: 5000, completedChapters: ['b1_c01', 'b1_c02'] }
    ]

    const emojiRegex = /\p{Extended_Pictographic}/u

    for (const state of states) {
      const rec = computeNextStepRecommendation(state)
      const serialized = JSON.stringify(rec)
      assert.strictEqual(
        emojiRegex.test(serialized),
        false,
        `Found unexpected emoji in recommendation output: ${serialized}`
      )
    }
  })

  test('8. calculates weighted recommendation based on B1 CEFR and completed chapters', () => {
    const rec = computeNextStepRecommendation({
      cefrLevel: 'B1',
      totalListeningSeconds: 3600,
      completedChapters: ['HP1_ch1', 'HP1_ch2'],
      vocabList: [{ word: 'peculiar', acquisition: { l1: true, l2: true, l3: true, l4: false } }]
    })
    assert.ok(rec.hpChapter.chapterId === 'HP1_ch3' || rec.hpChapter.cefr === 'B1')
    assert.ok(rec.tedTalk.cefr === 'B1' || rec.tedTalk.cefr === 'B2')
    assert.ok(rec.rationale.includes('B1') || rec.rationale.includes('HP1') || rec.rationale.includes('词汇'))
  })
})
