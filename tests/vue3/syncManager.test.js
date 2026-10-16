import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import {
  generatePasscode,
  isValidPasscode,
  detectDevicePlatform,
  mergeUserData,
  PASSCODE_ALPHABET
} from '../../src/utils/syncManager.js'

describe('syncManager Unit Tests', () => {
  // Test 1: Passcode Generation
  test('1. generatePasscode produces valid 6-character formatted code without ambiguous characters', () => {
    const code = generatePasscode()
    assert.strictEqual(typeof code, 'string')
    assert.match(code, /^HP-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/, 'Format must be HP-XXXX with valid alphabet')

    // Normalized length must be exactly 6 characters (HP + 4 token chars)
    const normalized = code.replace('-', '')
    assert.strictEqual(normalized.length, 6)

    // Ambiguous character exclusion check
    assert.ok(!code.includes('0'), 'Must exclude digit 0')
    assert.ok(!code.includes('O'), 'Must exclude letter O')
    assert.ok(!code.includes('1'), 'Must exclude digit 1')
    assert.ok(!code.includes('I'), 'Must exclude letter I')
    assert.ok(!code.includes('L'), 'Must exclude letter L')
  })

  test('2. generatePasscode generates distinct codes across multiple invocations', () => {
    const set = new Set()
    for (let i = 0; i < 20; i++) {
      set.add(generatePasscode())
    }
    assert.strictEqual(set.size, 20, '20 invocations should produce distinct passcodes')
  })

  // Test 2: Passcode Validation
  test('3. isValidPasscode validates properly formatted codes with and without hyphens', () => {
    assert.strictEqual(isValidPasscode('HP-8A3B'), true)
    assert.strictEqual(isValidPasscode('HP8A3B'), true)
    assert.strictEqual(isValidPasscode('hp-8a3b'), true, 'Case insensitive')
    assert.strictEqual(isValidPasscode('  HP-8A3B  '), true, 'Trim whitespace')
  })

  test('4. isValidPasscode rejects invalid, ambiguous, or malformed passcodes', () => {
    assert.strictEqual(isValidPasscode('HP-0A3B'), false, 'Contains digit 0')
    assert.strictEqual(isValidPasscode('HP-OA3B'), false, 'Contains letter O')
    assert.strictEqual(isValidPasscode('HP-1A3B'), false, 'Contains digit 1')
    assert.strictEqual(isValidPasscode('HP-IA3B'), false, 'Contains letter I')
    assert.strictEqual(isValidPasscode('HP-LA3B'), false, 'Contains letter L')
    assert.strictEqual(isValidPasscode('HP-8A3'), false, 'Too short (5 characters)')
    assert.strictEqual(isValidPasscode('HP-8A3B9'), false, 'Too long (7 characters)')
    assert.strictEqual(isValidPasscode('HP-8@3B'), false, 'Special character')
    assert.strictEqual(isValidPasscode(''), false, 'Empty string')
    assert.strictEqual(isValidPasscode(null), false, 'Null input')
    assert.strictEqual(isValidPasscode(undefined), false, 'Undefined input')
    assert.strictEqual(isValidPasscode(123456), false, 'Number input')
  })

  // Test 3: Device Platform Sensor
  test('5. detectDevicePlatform recognizes mobile User-Agents', () => {
    const iphoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    const devIPhone = detectDevicePlatform(iphoneUA)
    assert.strictEqual(devIPhone.type, 'mobile')
    assert.strictEqual(devIPhone.label, '手机端')
    assert.strictEqual(devIPhone.os, 'iOS')

    const androidMobileUA = 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
    const devAndroid = detectDevicePlatform(androidMobileUA)
    assert.strictEqual(devAndroid.type, 'mobile')
    assert.strictEqual(devAndroid.label, '手机端')
    assert.strictEqual(devAndroid.os, 'Android')
  })

  test('6. detectDevicePlatform recognizes tablet User-Agents', () => {
    const ipadUA = 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
    const devIPad = detectDevicePlatform(ipadUA)
    assert.strictEqual(devIPad.type, 'tablet')
    assert.strictEqual(devIPad.label, '平板端')
    assert.strictEqual(devIPad.os, 'iPadOS')

    const androidTabletUA = 'Mozilla/5.0 (Linux; Android 12; SM-X906C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
    const devAndroidTab = detectDevicePlatform(androidTabletUA)
    assert.strictEqual(devAndroidTab.type, 'tablet')
    assert.strictEqual(devAndroidTab.label, '平板端')
    assert.strictEqual(devAndroidTab.os, 'Android')
  })

  test('7. detectDevicePlatform recognizes desktop User-Agents', () => {
    const winUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    const devWin = detectDevicePlatform(winUA)
    assert.strictEqual(devWin.type, 'desktop')
    assert.strictEqual(devWin.label, '桌面端')
    assert.strictEqual(devWin.os, 'Windows')

    const macUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    const devMac = detectDevicePlatform(macUA)
    assert.strictEqual(devMac.type, 'desktop')
    assert.strictEqual(devMac.label, '桌面端')
    assert.strictEqual(devMac.os, 'macOS')

    const linuxUA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    const devLinux = detectDevicePlatform(linuxUA)
    assert.strictEqual(devLinux.type, 'desktop')
    assert.strictEqual(devLinux.label, '桌面端')
    assert.strictEqual(devLinux.os, 'Linux')
  })

  test('8. detectDevicePlatform defaults gracefully on empty or non-string input', () => {
    const devEmpty = detectDevicePlatform('')
    assert.strictEqual(devEmpty.type, 'desktop')
    assert.strictEqual(devEmpty.label, '桌面端')
    assert.ok(typeof devEmpty.os === 'string')
  })

  // Test 4: Lossless Data Merging - Streak & Freezes
  test('9. mergeUserData preserves highest streakDays and unions frozen dates', () => {
    const local = {
      streakDays: 5,
      streakFreezes: 1,
      streakFrozenDates: ['2026-10-10'],
      lastActiveDate: '2026-10-14'
    }
    const cloud = {
      streakDays: 8,
      streakFreezes: 2,
      streakFrozenDates: ['2026-10-10', '2026-10-12'],
      lastActiveDate: '2026-10-15'
    }
    const result = mergeUserData(local, cloud)
    assert.strictEqual(result.streakDays, 8, 'Preserves maximum streak')
    assert.strictEqual(result.streakFreezes, 2, 'Preserves maximum freeze count')
    assert.deepStrictEqual(result.streakFrozenDates, ['2026-10-10', '2026-10-12'], 'Unions frozen dates without duplicates')
    assert.strictEqual(result.lastActiveDate, '2026-10-15', 'Takes later active date')
    assert.strictEqual(result.hasChanges, true)
  })

  // Test 5: Lossless Data Merging - Vocab List & Mastery
  test('10. mergeUserData combines vocab lists, preserves L4 mastery, and promotes box', () => {
    const local = {
      vocabList: [
        {
          word: 'wand',
          box: 2,
          acquisition: { l1: true, l2: true, l3: false, l4: true },
          updatedAt: 1000
        },
        {
          word: 'potion',
          box: 1,
          acquisition: { l1: true, l2: false, l3: false, l4: false },
          updatedAt: 500
        }
      ]
    }
    const cloud = {
      vocabList: [
        {
          word: 'wand',
          box: 3,
          acquisition: { l1: true, l2: true, l3: true, l4: false },
          updatedAt: 1200
        },
        {
          word: 'cauldron',
          box: 1,
          acquisition: { l1: true, l2: false, l3: false, l4: false },
          updatedAt: 700
        }
      ]
    }

    const result = mergeUserData(local, cloud)
    const list = result.vocabList
    assert.strictEqual(list.length, 3, 'Union of wand, potion, cauldron')

    const wand = list.find(w => w.word === 'wand')
    assert.ok(wand, 'Wand must exist')
    assert.strictEqual(wand.box, 3, 'Box must promote to max (3)')
    assert.strictEqual(wand.acquisition.l1, true)
    assert.strictEqual(wand.acquisition.l2, true)
    assert.strictEqual(wand.acquisition.l3, true, 'l3 from cloud must be preserved')
    assert.strictEqual(wand.acquisition.l4, true, 'l4 from local must be preserved')
    assert.strictEqual(wand.updatedAt, 1200, 'updatedAt must take latest')

    const potion = list.find(w => w.word === 'potion')
    assert.ok(potion, 'Potion must exist')

    const cauldron = list.find(w => w.word === 'cauldron')
    assert.ok(cauldron, 'Cauldron must exist')

    assert.strictEqual(result.stats.vocabCount, 3)
    assert.strictEqual(result.stats.newVocabAdded, 1)
  })

  // Test 6: Lossless Data Merging - Gamification, Badges, and Point History
  test('11. mergeUserData merges unlocked badges and deduplicates point history', () => {
    const local = {
      userHouse: 'gryffindor',
      studentContribution: 120,
      housePoints: { gryffindor: 150, ravenclaw: 80 },
      pointHistory: [
        { id: 'p1', action: 'listen', delta: 10, timestamp: 200 },
        { id: 'p2', action: 'vocab', delta: 5, timestamp: 100 }
      ],
      unlockedBadges: {
        'first-journey': { id: 'first-journey', unlockedAt: 50 }
      }
    }
    const cloud = {
      userHouse: 'gryffindor',
      studentContribution: 180,
      housePoints: { gryffindor: 140, ravenclaw: 110, slytherin: 90 },
      pointHistory: [
        { id: 'p2', action: 'vocab', delta: 5, timestamp: 100 },
        { id: 'p3', action: 'shadow', delta: 15, timestamp: 300 }
      ],
      unlockedBadges: {
        'first-journey': { id: 'first-journey', unlockedAt: 40 },
        'streak-7': { id: 'streak-7', unlockedAt: 80 }
      }
    }

    const result = mergeUserData(local, cloud)
    assert.strictEqual(result.userHouse, 'gryffindor')
    assert.strictEqual(result.studentContribution, 180, 'Max contribution')
    assert.strictEqual(result.housePoints.gryffindor, 150)
    assert.strictEqual(result.housePoints.ravenclaw, 110)
    assert.strictEqual(result.housePoints.slytherin, 90)

    // Point history deduplication & descending order
    assert.strictEqual(result.pointHistory.length, 3)
    assert.strictEqual(result.pointHistory[0].id, 'p3')
    assert.strictEqual(result.pointHistory[1].id, 'p1')
    assert.strictEqual(result.pointHistory[2].id, 'p2')

    // Badges: earlier unlockedAt preserved for first-journey
    assert.strictEqual(result.unlockedBadges['first-journey'].unlockedAt, 40)
    assert.ok(result.unlockedBadges['streak-7'])
    assert.strictEqual(result.stats.badgesCount, 2)
  })

  // Test 7: Dual Interface Access (top-level and mergedData sub-object)
  test('12. mergeUserData provides dual-access structure (top-level and nested mergedData)', () => {
    const local = { streakDays: 3 }
    const cloud = { streakDays: 6 }
    const result = mergeUserData(local, cloud)

    assert.strictEqual(result.streakDays, 6)
    assert.strictEqual(result.mergedData.streakDays, 6)
    assert.strictEqual(result.hasChanges, true)
    assert.ok(typeof result.stats === 'object')
  })

  // Test 8: Defensive Execution with Empty/Null Inputs
  test('13. mergeUserData handles null and undefined inputs gracefully', () => {
    const result = mergeUserData(null, undefined)
    assert.ok(result)
    assert.strictEqual(result.streakDays, 0)
    assert.strictEqual(result.streakFreezes, 0)
    assert.deepStrictEqual(result.streakFrozenDates, [])
    assert.deepStrictEqual(result.vocabList, [])
    assert.deepStrictEqual(result.pointHistory, [])
    assert.strictEqual(result.hasChanges, false)
  })

  test('14. pointHistory enforces 50-item limit when total entries exceed 50', () => {
    const local = {
      pointHistory: Array.from({ length: 35 }, (_, i) => ({
        id: `loc_${i}`,
        timestamp: 1000 + i,
        delta: 5
      }))
    }
    const cloud = {
      pointHistory: Array.from({ length: 35 }, (_, i) => ({
        id: `cld_${i}`,
        timestamp: 2000 + i,
        delta: 10
      }))
    }
    const result = mergeUserData(local, cloud)
    assert.strictEqual(result.pointHistory.length, 50, 'Must cap point history to latest 50 records')
    // Highest timestamp should be first
    assert.strictEqual(result.pointHistory[0].id, 'cld_34')
  })

  test('15. mergeUserData handles case-insensitive vocabulary matching', () => {
    const local = {
      vocabList: [{ word: 'Gryffindor', box: 1, acquisition: { l1: true } }]
    }
    const cloud = {
      vocabList: [{ word: 'gryffindor', box: 2, acquisition: { l2: true } }]
    }
    const result = mergeUserData(local, cloud)
    assert.strictEqual(result.vocabList.length, 1, 'Should treat Gryffindor and gryffindor as same entry')
    assert.strictEqual(result.vocabList[0].box, 2)
    assert.strictEqual(result.vocabList[0].acquisition.l1, true)
    assert.strictEqual(result.vocabList[0].acquisition.l2, true)
  })

  test('16. mergeUserData reports hasChanges as false when cloud data has no new information', () => {
    const local = {
      streakDays: 5,
      streakFreezes: 1,
      streakFrozenDates: ['2026-10-10'],
      lastActiveDate: '2026-10-15',
      userHouse: 'gryffindor',
      studentContribution: 50,
      housePoints: { gryffindor: 100, slytherin: 50, ravenclaw: 50, hufflepuff: 50 },
      vocabList: [{ word: 'wand', box: 2, updatedAt: 1000, acquisition: { l1: true } }],
      unlockedBadges: { 'first-journey': { id: 'first-journey', unlockedAt: 100 } },
      pointHistory: [{ id: 'p1', timestamp: 100 }]
    }
    const cloud = {
      streakDays: 3,
      streakFreezes: 0,
      streakFrozenDates: ['2026-10-10'],
      lastActiveDate: '2026-10-12',
      userHouse: 'gryffindor',
      studentContribution: 40,
      housePoints: { gryffindor: 80 },
      vocabList: [{ word: 'wand', box: 1, updatedAt: 800, acquisition: { l1: true } }],
      unlockedBadges: { 'first-journey': { id: 'first-journey', unlockedAt: 200 } },
      pointHistory: [{ id: 'p1', timestamp: 100 }]
    }

    const result = mergeUserData(local, cloud)
    assert.strictEqual(result.hasChanges, false, 'No new changes when local already supercedes cloud')
  })

  // Test 10: Zero Unicode Emojis
  test('17. syncManager source file has strictly zero Unicode emojis', () => {
    const srcPath = path.resolve('src/utils/syncManager.js')
    if (fs.existsSync(srcPath)) {
      const content = fs.readFileSync(srcPath, 'utf-8')
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
      assert.ok(!emojiRegex.test(content), 'src/utils/syncManager.js must contain zero Unicode emojis')
    }
  })
})
