import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert'
import { setActivePinia, createPinia } from 'pinia'
import { useGamificationStore, HOUSES, STORAGE_KEY_GAMIFICATION } from '../../src/stores/gamificationStore.js'
import { BADGE_DEFINITIONS, BADGE_CATEGORIES } from '../../src/data/badgeDefinitions.js'

if (typeof globalThis.localStorage === 'undefined') {
  const mem = new Map()
  globalThis.localStorage = {
    getItem: (k) => mem.get(k) || null,
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear()
  }
}

describe('gamificationStore & badgeDefinitions', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  test('HOUSES and BADGE_DEFINITIONS registry are properly defined', () => {
    assert.strictEqual(Object.keys(HOUSES).length, 4)
    assert.ok(HOUSES.gryffindor && HOUSES.ravenclaw && HOUSES.hufflepuff && HOUSES.slytherin)
    assert.ok(Array.isArray(BADGE_DEFINITIONS))
    assert.strictEqual(BADGE_DEFINITIONS.length, 14, 'Must have exactly 14 badges')
    assert.ok(BADGE_DEFINITIONS.some(b => b.id === 'sorting-ceremony'))
    assert.ok(BADGE_DEFINITIONS.some(b => b.id === 'patronus-shield'))
    assert.ok(BADGE_DEFINITIONS.some(b => b.id === 'owls-outstanding'))
    assert.ok(BADGE_CATEGORIES && typeof BADGE_CATEGORIES === 'object')
  })

  test('gamificationStore default state initializes safely', () => {
    const store = useGamificationStore()
    assert.strictEqual(store.userHouse, null)
    assert.strictEqual(store.streakDays, 0)
    assert.strictEqual(store.streakFreezes, 1)
    assert.ok(store.housePoints.gryffindor > 0)
    assert.strictEqual(store.studentContribution, 0)
    assert.deepStrictEqual(store.pointHistory, [])
    assert.strictEqual(store.unlockedCount, 0)
    assert.strictEqual(store.currentHouseInfo, null)
  })

  test('selectHouse assigns house and awards sorting badge', () => {
    const store = useGamificationStore()
    store.selectHouse('ravenclaw')
    assert.strictEqual(store.userHouse, 'ravenclaw')
    assert.ok(store.housePoints.ravenclaw >= 195) // initial base 175 + 20
    assert.strictEqual(store.studentContribution, 20)
    assert.ok(store.unlockedBadges['sorting-ceremony'])
    assert.strictEqual(store.currentHouseInfo.id, 'ravenclaw')
    assert.strictEqual(store.currentHouseInfo.name, '拉文克劳')
  })

  test('awardPoints adds to user house and preserves point history', () => {
    const store = useGamificationStore()
    store.selectHouse('gryffindor')
    const before = store.housePoints.gryffindor
    store.awardPoints(10, '精听达标')
    assert.strictEqual(store.housePoints.gryffindor, before + 10)
    assert.strictEqual(store.pointHistory.length, 2) // sorting (20) + listening (10)
    assert.strictEqual(store.pointHistory[0].reason, '精听达标')
    assert.strictEqual(store.pointHistory[0].points, 10)
  })

  test('houseRankings returns correctly sorted houses 1 to 4', () => {
    const store = useGamificationStore()
    store.selectHouse('gryffindor')
    store.awardPoints(500, '巨额学分')
    const rankings = store.houseRankings
    assert.strictEqual(rankings.length, 4)
    assert.strictEqual(rankings[0].id, 'gryffindor')
    assert.strictEqual(rankings[0].rank, 1)
    assert.strictEqual(rankings[0].isUserHouse, true)
    assert.strictEqual(rankings[0].gapFromLeader, 0)
    assert.ok(rankings[1].gapFromLeader > 0)
    assert.ok(rankings[0].hourglassHeight >= 15 && rankings[0].hourglassHeight <= 130)
  })

  test('checkInDaily updates streak and consumes freeze on skipped day', () => {
    const store = useGamificationStore()
    // Day 1
    store.checkInDaily(300, '2026-10-14')
    assert.strictEqual(store.streakDays, 1)

    // Day 2 consecutive
    store.checkInDaily(300, '2026-10-15')
    assert.strictEqual(store.streakDays, 2)

    // Day 4 (Day 3 was skipped! Should consume 1 freeze)
    store.checkInDaily(300, '2026-10-17')
    assert.strictEqual(store.streakDays, 3)
    assert.strictEqual(store.streakFreezes, 0)
    assert.ok(store.streakFrozenDates.includes('2026-10-16'))
    assert.ok(store.unlockedBadges['patronus-shield'])
  })

  test('streak milestone rewards additional freeze every 7 days (cap 2)', () => {
    const store = useGamificationStore()
    store.streakDays = 6
    store.lastActiveDate = '2026-10-19'
    store.streakFreezes = 1

    // Day 7
    store.checkInDaily(300, '2026-10-20')
    assert.strictEqual(store.streakDays, 7)
    assert.strictEqual(store.streakFreezes, 2)
    assert.ok(store.unlockedBadges['streak-7'])

    // Day 14 (already capped at 2, should not exceed 2)
    store.streakDays = 13
    store.lastActiveDate = '2026-10-26'
    store.checkInDaily(300, '2026-10-27')
    assert.strictEqual(store.streakDays, 14)
    assert.strictEqual(store.streakFreezes, 2)
  })

  test('streak reset to 1 when day skipped and 0 freezes remaining', () => {
    const store = useGamificationStore()
    store.streakDays = 5
    store.lastActiveDate = '2026-10-10'
    store.streakFreezes = 0

    // Skipped 2026-10-11, check in on 2026-10-12
    store.checkInDaily(300, '2026-10-12')
    assert.strictEqual(store.streakDays, 1)
    assert.strictEqual(store.streakFreezes, 0)
    assert.strictEqual(store.lastActiveDate, '2026-10-12')
  })

  test('allBadgesWithStatus computes status and progress across categories', () => {
    const store = useGamificationStore()
    store.streakDays = 2

    const badges = store.allBadgesWithStatus
    assert.strictEqual(badges.length, 14)

    const streak3 = badges.find(b => b.id === 'streak-3')
    assert.strictEqual(streak3.isUnlocked, false)
    assert.strictEqual(streak3.progress, 67) // 2/3 = 67%

    // Unlock streak-3
    store.checkInDaily(300, '2026-10-14')
    store.streakDays = 3
    store.checkAndUnlockBadges({ streakDays: 3 })

    const updated = store.allBadgesWithStatus.find(b => b.id === 'streak-3')
    assert.strictEqual(updated.isUnlocked, true)
    assert.strictEqual(updated.progress, 100)
    assert.ok(typeof updated.unlockedAt === 'number')
  })

  test('checkAndUnlockBadges unlocks telemetry-driven badges idempotently', () => {
    const store = useGamificationStore()
    store.checkAndUnlockBadges({
      listeningMinutes: 65,
      shadowingScore: 88,
      vocabCount: 52,
      l4Count: 22,
      dictationAce: true,
      owlsExamCompleted: true,
      owlsGrade: 'O'
    })

    assert.ok(store.unlockedBadges['ear-master-1'])
    assert.ok(store.unlockedBadges['shadowing-85'])
    assert.ok(store.unlockedBadges['vocab-50'])
    assert.ok(store.unlockedBadges['vocab-l4-20'])
    assert.ok(store.unlockedBadges['dictation-ace'])
    assert.ok(store.unlockedBadges['owls-pass'])
    assert.ok(store.unlockedBadges['owls-outstanding'])

    const toastCountBefore = store.pendingToasts.length
    assert.ok(toastCountBefore >= 7)

    // Run again with same context - must be idempotent (no duplicate toasts or badge overwrites)
    store.checkAndUnlockBadges({
      listeningMinutes: 70,
      shadowingScore: 90
    })
    assert.strictEqual(store.pendingToasts.length, toastCountBefore)
  })

  test('popToast and markBadgeSeen manage notifications and badges status', () => {
    const store = useGamificationStore()
    store.selectHouse('slytherin')
    assert.ok(store.pendingToasts.length > 0)

    const firstToast = store.popToast()
    assert.ok(firstToast)
    assert.ok(firstToast.title)

    assert.strictEqual(store.unlockedBadges['sorting-ceremony'].seen, false)
    store.markBadgeSeen('sorting-ceremony')
    assert.strictEqual(store.unlockedBadges['sorting-ceremony'].seen, true)
  })

  test('saveToStorage and loadFromStorage persist state', () => {
    const store = useGamificationStore()
    store.selectHouse('hufflepuff')
    store.awardPoints(50, '测试加分')

    const raw = localStorage.getItem(STORAGE_KEY_GAMIFICATION)
    assert.ok(raw, 'Data must be persisted to localStorage')
    assert.ok(raw.includes('hufflepuff'))
    assert.ok(raw.includes('50'))

    // Fresh pinia instance to test loadFromStorage
    setActivePinia(createPinia())
    const freshStore = useGamificationStore()
    assert.strictEqual(freshStore.userHouse, 'hufflepuff')
    assert.strictEqual(freshStore.studentContribution, 70) // 20 sorting + 50 award
    assert.strictEqual(freshStore.pointHistory.length, 2)
  })

  test('badge definitions and stores contain zero Unicode emojis', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u
    for (const badge of BADGE_DEFINITIONS) {
      assert.ok(!emojiRegex.test(badge.name), `Badge name ${badge.name} has emoji`)
      assert.ok(!emojiRegex.test(badge.desc), `Badge desc ${badge.desc} has emoji`)
    }
    for (const house of Object.values(HOUSES)) {
      assert.ok(!emojiRegex.test(house.name), `House name ${house.name} has emoji`)
      assert.ok(!emojiRegex.test(house.qualities), `House qualities has emoji`)
    }
  })
})
