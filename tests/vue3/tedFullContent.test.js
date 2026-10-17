import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { setActivePinia, createPinia } from 'pinia'
import { TALKS } from '../../src/data/tedData.js'
import { useTedStore } from '../../src/stores/tedStore.js'

describe('P0: TED Content Completeness and Learning Loop', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('TALKS contains both Simon Sinek and Japan Saved Its Biggest City talks with full data', () => {
    assert.ok(TALKS.length >= 2, 'TALKS should contain at least 2 built-in curated talks')
    
    const japanTalk = TALKS.find(
      (t) => t.id === '20260106-how-japan-saved-its-biggest-city-from-collapse-roman' ||
             t.id === 'ted-20260106-how-japan-saved-its-biggest-city-from-collapse-roman'
    )
    assert.ok(japanTalk, 'Japan Saved Its Biggest City talk must be present in TALKS')
    assert.equal(japanTalk.speaker, 'Roman')
    assert.ok(japanTalk.title.includes('How Japan Saved Its Biggest City'))
    
    // Step 1 Vocab completeness
    assert.ok(Array.isArray(japanTalk.vocabSet), 'vocabSet must be an array')
    assert.ok(japanTalk.vocabSet.length >= 8, `vocabSet should have at least 8 items, got ${japanTalk.vocabSet.length}`)
    japanTalk.vocabSet.forEach((v) => {
      assert.ok(v.word, 'vocab word is required')
      assert.ok(v.ipa, 'vocab IPA is required')
      assert.ok(v.definitionCn, 'vocab definitionCn is required')
    })

    // Step 3 Tasks completeness
    assert.ok(japanTalk.tasks, 'tasks must be defined')
    assert.ok(Array.isArray(japanTalk.tasks.cloze) && japanTalk.tasks.cloze.length >= 3, 'tasks.cloze must have at least 3 items')
    assert.ok(Array.isArray(japanTalk.tasks.matching) && japanTalk.tasks.matching.length >= 2, 'tasks.matching must have at least 2 items')

    // Step 4 Shadowing completeness
    assert.ok(Array.isArray(japanTalk.shadowingSegments) && japanTalk.shadowingSegments.length >= 2, 'shadowingSegments must have at least 2 items')
    japanTalk.shadowingSegments.forEach((seg) => {
      assert.ok(seg.transcript, 'segment transcript is required')
      assert.ok(seg.transcriptCn, 'segment transcriptCn is required')
      assert.ok(typeof seg.startSeconds === 'number', 'segment startSeconds is required')
      assert.ok(typeof seg.endSeconds === 'number', 'segment endSeconds is required')
    })
  })

  it('tedStore selects Japan talk and initializes full learning workflow', () => {
    const store = useTedStore()
    const targetId = '20260106-how-japan-saved-its-biggest-city-from-collapse-roman'
    store.selectTalk(targetId)

    assert.ok(store.currentTalk, 'currentTalk should be found')
    assert.ok(store.currentTalk.id.includes('japan-saved-its-biggest-city'))
    assert.ok(store.currentTalk.vocabSet.length >= 8, 'currentTalk must have vocabSet')
    assert.equal(store.currentStep, 1)
    assert.equal(store.vocabUnlocked, false)
    assert.equal(store.vocabProgress.total, store.currentTalk.vocabSet.length)

    // Simulating listening to all vocab unlocks step 2
    store.currentTalk.vocabSet.forEach((v) => {
      store.markVocabListened(v.word)
    })
    assert.equal(store.vocabUnlocked, true)

    // Can progress through steps 2, 3, 4
    store.goToStep(2)
    assert.equal(store.currentStep, 2)
    store.goToStep(3)
    assert.equal(store.currentStep, 3)
    assert.ok(store.currentTalk.tasks.cloze.length >= 3)
    assert.ok(store.currentTalk.tasks.matching.length >= 2)

    store.goToStep(4)
    assert.equal(store.currentStep, 4)
    assert.ok(store.currentShadowingSegment, 'currentShadowingSegment must exist for step 4')
    assert.ok(store.currentShadowingSegment.transcript.length > 0)
  })

  it('tedStore.fetchRemoteTalks enriches remote talks if remote lacks vocab or tasks', async () => {
    const store = useTedStore()
    const originalFetch = globalThis.fetch

    // Mock remote returning Japan talk with EMPTY vocabSet and tasks (e.g. raw R2 scan without meta.json)
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        talks: [
          {
            id: '20260106-how-japan-saved-its-biggest-city-from-collapse-roman',
            title: '20260106 How Japan Saved Its Biggest City From Collapse Roman',
            speaker: 'Roman',
            videoKey: 'ted/20260106-how-japan-saved-its-biggest-city-from-collapse-roman/video.mp4',
            vttKey: 'ted/20260106-how-japan-saved-its-biggest-city-from-collapse-roman/subtitle.vtt',
            vocabSet: [],
            tasks: { cloze: [], matching: [] },
            shadowingSegments: []
          }
        ]
      })
    })

    try {
      await store.fetchRemoteTalks()
      const talk = store.talks.find((t) => t.id.includes('japan-saved-its-biggest-city'))
      assert.ok(talk, 'talk should be in store')
      // Must be enriched from local fallback!
      assert.ok(talk.vocabSet.length >= 8, 'vocabSet should be enriched from local curated assets')
      assert.ok(talk.tasks.cloze.length >= 3, 'cloze tasks should be enriched from local curated assets')
      assert.ok(talk.shadowingSegments.length >= 2, 'shadowingSegments should be enriched')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
