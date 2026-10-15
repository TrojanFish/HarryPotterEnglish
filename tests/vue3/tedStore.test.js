import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useTedStore } from '../../src/stores/tedStore.js'
import { TALKS } from '../../src/data/tedData.js'

beforeEach(() => { setActivePinia(createPinia()) })

describe('selectTalk', () => {
  it('sets selectedTalkId and resets step to 1', () => {
    const store = useTedStore()
    store.currentStep = 3
    store.selectTalk(TALKS[0].id)
    assert.equal(store.selectedTalkId, TALKS[0].id)
    assert.equal(store.currentStep, 1)
  })
  it('clears listenedVocabIds and sets vocabUnlocked false', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    assert.equal(store.listenedVocabIds.size, 0)
    assert.equal(store.vocabUnlocked, false)
  })
  it('resolves videoSrc to non-empty string', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    assert.ok(store.videoSrc.length > 0)
  })
})

describe('markVocabListened', () => {
  it('adds word to listenedVocabIds', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    store.markVocabListened('inspire')
    assert.ok(store.listenedVocabIds.has('inspire'))
  })
  it('sets vocabUnlocked when all vocab heard', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    const words = TALKS[0].vocabSet.map(v => v.word)
    words.forEach(w => store.markVocabListened(w))
    assert.equal(store.vocabUnlocked, true)
  })
})

describe('goToStep', () => {
  it('advances to step 2 only when vocabUnlocked', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    store.goToStep(2)
    assert.equal(store.currentStep, 1)  // locked -- no-op
    store.vocabUnlocked = true
    store.goToStep(2)
    assert.equal(store.currentStep, 2)
  })
  it('allows free navigation between steps 2-4 once step 2 unlocked', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    store.vocabUnlocked = true
    store.currentStep = 2
    store.goToStep(3)
    assert.equal(store.currentStep, 3)
    store.goToStep(4)
    assert.equal(store.currentStep, 4)
  })
})

describe('scoreTask', () => {
  it('returns 100 when all cloze answers correct and all matching correct', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    const talk = TALKS[0]
    talk.tasks.cloze.forEach(c => store.submitClozeAnswer(c.id, c.blanks[0]))
    talk.tasks.matching.forEach(m => store.submitMatchingAnswer(m.id, m.timestampSeconds))
    const score = store.scoreTask()
    assert.equal(score, 100)
    assert.equal(store.taskScore, 100)
  })
  it('returns 0 when all answers wrong', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    const talk = TALKS[0]
    talk.tasks.cloze.forEach(c => store.submitClozeAnswer(c.id, 'WRONG_ANSWER'))
    talk.tasks.matching.forEach(m => store.submitMatchingAnswer(m.id, -1))
    const score = store.scoreTask()
    assert.equal(score, 0)
  })
})

describe('markTalkCompleted', () => {
  it('appends talk id to completedTalkIds', () => {
    const store = useTedStore()
    store.markTalkCompleted('ted-test-id')
    assert.ok(store.completedTalkIds.includes('ted-test-id'))
  })
  it('does not duplicate entries', () => {
    const store = useTedStore()
    store.markTalkCompleted('ted-test-id')
    store.markTalkCompleted('ted-test-id')
    assert.equal(store.completedTalkIds.filter(x => x === 'ted-test-id').length, 1)
  })
})

describe('toggleBlindMode / toggleChineseSubs / setLoopCue', () => {
  it('toggleBlindMode flips isBlindMode', () => {
    const store = useTedStore()
    assert.equal(store.isBlindMode, false)
    store.toggleBlindMode()
    assert.equal(store.isBlindMode, true)
  })
  it('toggleChineseSubs flips showChineseSubs', () => {
    const store = useTedStore()
    const initial = store.showChineseSubs
    store.toggleChineseSubs()
    assert.equal(store.showChineseSubs, !initial)
  })
  it('setLoopCue(3) sets loopCueIndex to 3', () => {
    const store = useTedStore()
    store.setLoopCue(3)
    assert.equal(store.loopCueIndex, 3)
    store.setLoopCue(null)
    assert.equal(store.loopCueIndex, null)
  })
})

describe('setLookupWord and currentTalk getter', () => {
  it('setLookupWord updates lookupWord state', () => {
    const store = useTedStore()
    store.setLookupWord('inspire')
    assert.equal(store.lookupWord, 'inspire')
    store.setLookupWord(null)
    assert.equal(store.lookupWord, null)
  })
  it('currentTalk returns selected talk object', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    assert.equal(store.currentTalk?.id, TALKS[0].id)
  })
})
