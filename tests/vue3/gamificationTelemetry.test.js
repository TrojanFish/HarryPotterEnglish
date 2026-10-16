import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { useGamificationStore } from '../../src/stores/gamificationStore.js'
import { useAnalyticsStore } from '../../src/stores/analyticsStore.js'
import { useVocabStore } from '../../src/stores/vocabStore.js'

describe('Gamification Telemetry & Badge Auto-Unlocks (Task 7)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('1. StepListening.vue and App.vue wire gamification telemetry and checkInDaily', () => {
    const stepListening = fs.readFileSync(path.resolve('src/components/session/StepListening.vue'), 'utf-8')
    assert.ok(
      stepListening.includes('useGamificationStore'),
      'StepListening.vue must import and call useGamificationStore'
    )
    assert.ok(
      stepListening.includes('gamificationStore.checkInDaily()') || stepListening.includes('gamification.checkInDaily()'),
      'StepListening.vue must call checkInDaily() upon recording listening time'
    )
    assert.ok(
      stepListening.includes('完成每日 5 分钟听力契约'),
      'StepListening.vue must award 10 points when 5-min daily contract is achieved'
    )
    assert.ok(
      stepListening.includes('checkAndUnlockBadges'),
      'StepListening.vue must trigger checkAndUnlockBadges with listening metrics'
    )

    const appVue = fs.readFileSync(path.resolve('src/App.vue'), 'utf-8')
    assert.ok(
      appVue.includes('useGamificationStore'),
      'App.vue must import useGamificationStore'
    )
    assert.ok(
      appVue.includes('checkInDaily'),
      'App.vue must trigger checkInDaily on regular listening time update'
    )
    assert.ok(
      appVue.includes('checkAndUnlockBadges'),
      'App.vue must trigger checkAndUnlockBadges on listening time update'
    )
  })

  test('2. StepShadowing.vue and TedShadowing.vue award points and check badges', () => {
    const hpShadowing = fs.readFileSync(path.resolve('src/components/session/StepShadowing.vue'), 'utf-8')
    assert.ok(
      hpShadowing.includes('useGamificationStore'),
      'StepShadowing.vue must import useGamificationStore'
    )
    assert.ok(
      hpShadowing.includes('魔咒跟读评分优异 (>=85)'),
      'StepShadowing.vue must award points for score >= 85'
    )
    assert.ok(
      hpShadowing.includes('完成魔咒跟读练习'),
      'StepShadowing.vue must award points for regular shadowing'
    )
    assert.ok(
      hpShadowing.includes('checkInDaily'),
      'StepShadowing.vue must call checkInDaily'
    )
    assert.ok(
      hpShadowing.includes('checkAndUnlockBadges'),
      'StepShadowing.vue must call checkAndUnlockBadges with shadowingScore'
    )

    const tedShadowing = fs.readFileSync(path.resolve('src/components/ted/TedShadowing.vue'), 'utf-8')
    assert.ok(
      tedShadowing.includes('useGamificationStore'),
      'TedShadowing.vue must import useGamificationStore'
    )
    assert.ok(
      tedShadowing.includes('魔咒跟读评分优异 (>=85)') || tedShadowing.includes('TED跟读评分优异') || tedShadowing.includes('awardPoints'),
      'TedShadowing.vue must award points on shadowing evaluation'
    )
    assert.ok(
      tedShadowing.includes('checkInDaily'),
      'TedShadowing.vue must call checkInDaily'
    )
    assert.ok(
      tedShadowing.includes('checkAndUnlockBadges'),
      'TedShadowing.vue must call checkAndUnlockBadges'
    )
  })

  test('3. StepDictation.vue awards points on full/cloze dictation and checks badges', () => {
    const dictation = fs.readFileSync(path.resolve('src/components/session/StepDictation.vue'), 'utf-8')
    assert.ok(
      dictation.includes('useGamificationStore'),
      'StepDictation.vue must import useGamificationStore'
    )
    assert.ok(
      dictation.includes('全句精听听写满分 (Perfect Dictation)'),
      'StepDictation.vue must award 15 points on perfect dictation'
    )
    assert.ok(
      dictation.includes('精听听写句子练习'),
      'StepDictation.vue must award points on non-perfect dictation match'
    )
    assert.ok(
      dictation.includes('checkInDaily'),
      'StepDictation.vue must call checkInDaily'
    )
    assert.ok(
      dictation.includes('checkAndUnlockBadges'),
      'StepDictation.vue must call checkAndUnlockBadges'
    )
  })

  test('4. StepVocabReview.vue and TedTaskStudio.vue award points and check badges', () => {
    const vocabReview = fs.readFileSync(path.resolve('src/components/session/StepVocabReview.vue'), 'utf-8')
    assert.ok(
      vocabReview.includes('useGamificationStore'),
      'StepVocabReview.vue must import useGamificationStore'
    )
    assert.ok(
      vocabReview.includes('完成艾宾浩斯生词复习'),
      'StepVocabReview.vue must award points on review promotion'
    )
    assert.ok(
      vocabReview.includes('checkInDaily'),
      'StepVocabReview.vue must call checkInDaily'
    )
    assert.ok(
      vocabReview.includes('checkAndUnlockBadges'),
      'StepVocabReview.vue must call checkAndUnlockBadges'
    )

    const tedStudio = fs.readFileSync(path.resolve('src/components/ted/TedTaskStudio.vue'), 'utf-8')
    assert.ok(
      tedStudio.includes('useGamificationStore'),
      'TedTaskStudio.vue must import useGamificationStore'
    )
    assert.ok(
      tedStudio.includes('完成 TED 拓展实战任务'),
      'TedTaskStudio.vue must award 10 points on task submission'
    )
    assert.ok(
      tedStudio.includes('checkInDaily'),
      'TedTaskStudio.vue must call checkInDaily'
    )
    assert.ok(
      tedStudio.includes('checkAndUnlockBadges'),
      'TedTaskStudio.vue must call checkAndUnlockBadges'
    )
  })

  test('5. OwlsExamModal.vue awards 30 points and checks exam badges on completion', () => {
    const owls = fs.readFileSync(path.resolve('src/components/assessment/OwlsExamModal.vue'), 'utf-8')
    assert.ok(
      owls.includes('useGamificationStore'),
      'OwlsExamModal.vue must import useGamificationStore'
    )
    assert.ok(
      owls.includes('完成 O.W.L.s 等级评定考核'),
      'OwlsExamModal.vue must award 30 points on exam finish'
    )
    assert.ok(
      owls.includes('checkInDaily'),
      'OwlsExamModal.vue must call checkInDaily'
    )
    assert.ok(
      owls.includes('checkAndUnlockBadges'),
      'OwlsExamModal.vue must call checkAndUnlockBadges'
    )
    assert.ok(
      owls.includes('owlsExamCompleted'),
      'OwlsExamModal.vue must pass owlsExamCompleted to checkAndUnlockBadges'
    )
  })

  test('6. Zero Unicode emojis across all target files', () => {
    const targetFiles = [
      'src/components/session/StepListening.vue',
      'src/App.vue',
      'src/components/session/StepShadowing.vue',
      'src/components/ted/TedShadowing.vue',
      'src/components/session/StepDictation.vue',
      'src/components/session/StepVocabReview.vue',
      'src/components/ted/TedTaskStudio.vue',
      'src/components/assessment/OwlsExamModal.vue'
    ]

    const emojiRegex = /\p{Extended_Pictographic}/gu
    for (const f of targetFiles) {
      const content = fs.readFileSync(path.resolve(f), 'utf-8')
      const matches = content.match(emojiRegex)
      assert.strictEqual(
        matches,
        null,
        `File ${f} must contain zero Unicode emojis, found: ${matches ? matches.join(', ') : ''}`
      )
    }
  })

  test('7. Apple HIG 44px touch targets on interactive buttons', () => {
    const targetFiles = [
      'src/components/session/StepListening.vue',
      'src/components/session/StepShadowing.vue',
      'src/components/session/StepDictation.vue',
      'src/components/session/StepVocabReview.vue',
      'src/components/ted/TedTaskStudio.vue',
      'src/components/assessment/OwlsExamModal.vue'
    ]

    for (const f of targetFiles) {
      const content = fs.readFileSync(path.resolve(f), 'utf-8')
      assert.ok(
        content.includes('min-h-[44px]'),
        `File ${f} must include min-h-[44px] touch target class`
      )
    }
  })

  test('8. End-to-end Store Integration: gamification awards, points, and badge triggers', () => {
    const gamification = useGamificationStore()
    const analytics = useAnalyticsStore()
    const vocab = useVocabStore()

    // Select house
    gamification.selectHouse('gryffindor')
    const initialPoints = gamification.housePoints.gryffindor

    // Simulate shadowing award >= 85
    const score = 88
    if (score >= 85) {
      gamification.awardPoints(10, '魔咒跟读评分优异 (>=85)')
    } else {
      gamification.awardPoints(5, '完成魔咒跟读练习')
    }
    gamification.checkInDaily()
    gamification.checkAndUnlockBadges({
      shadowingScore: score,
      streakDays: gamification.streakDays,
      vocabCount: vocab.totalCount,
      l4Count: vocab.l4Count
    })

    assert.strictEqual(
      gamification.housePoints.gryffindor,
      initialPoints + 10,
      'House points should have increased by 10'
    )
    assert.ok(
      gamification.unlockedBadges['shadowing-85'],
      'shadowing-85 badge must be unlocked for score >= 85'
    )

    // Simulate perfect dictation award
    gamification.awardPoints(15, '全句精听听写满分 (Perfect Dictation)')
    gamification.checkInDaily()
    gamification.checkAndUnlockBadges({
      dictationCount: 1,
      perfectDictation: true,
      streakDays: gamification.streakDays,
      vocabCount: vocab.totalCount,
      l4Count: vocab.l4Count
    })

    assert.strictEqual(
      gamification.housePoints.gryffindor,
      initialPoints + 25,
      'House points should have increased by another 15'
    )
    assert.ok(
      gamification.unlockedBadges['dictation-ace'],
      'dictation-ace badge must be unlocked for perfect dictation'
    )

    // Simulate exam completion
    gamification.awardPoints(30, '完成 O.W.L.s 等级评定考核')
    gamification.checkInDaily()
    gamification.checkAndUnlockBadges({
      owlsExamCompleted: true,
      owlsScore: 95,
      owlsGrade: 'C1',
      owlsOutstanding: true,
      streakDays: gamification.streakDays,
      vocabCount: vocab.totalCount,
      l4Count: vocab.l4Count
    })

    assert.strictEqual(
      gamification.housePoints.gryffindor,
      initialPoints + 55,
      'House points should have increased by another 30'
    )
    assert.ok(
      gamification.unlockedBadges['owls-pass'],
      'owls-pass badge must be unlocked'
    )
    assert.ok(
      gamification.unlockedBadges['owls-outstanding'],
      'owls-outstanding badge must be unlocked'
    )
  })
})
