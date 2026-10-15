import { describe, test } from 'node:test'
import assert from 'node:assert'
import { GRADED_DICTIONARY } from '../../src/data/gradedDictionaryData.js'
import { getTagBadgeClass } from '../../src/utils/tagTheme.js'

describe('Graded Dictionary Dataset (小学 / 中考 / 高考 / 四六级 / 魔法专有)', () => {
  test('GRADED_DICTIONARY exports a non-empty dictionary map', () => {
    assert.ok(GRADED_DICTIONARY && typeof GRADED_DICTIONARY === 'object')
    const keys = Object.keys(GRADED_DICTIONARY)
    assert.ok(keys.length > 500, `Must contain a rich vocabulary set (got ${keys.length})`)
  })

  test('GRADED_DICTIONARY contains sample words across all curriculum grades', () => {
    // 小学基础
    const primaryWord = GRADED_DICTIONARY.book || GRADED_DICTIONARY.friend || GRADED_DICTIONARY.cat
    assert.ok(primaryWord, 'Must have primary school words')
    assert.strictEqual(primaryWord[3], '小学基础')

    // 中考核心
    const middleWord = GRADED_DICTIONARY.discover || GRADED_DICTIONARY.classic || GRADED_DICTIONARY.secret
    assert.ok(middleWord, 'Must have zhongkao words')
    assert.strictEqual(middleWord[3], '中考核心')

    // 高考重点
    const gaokaoWord = GRADED_DICTIONARY.peculiar || GRADED_DICTIONARY.mysterious || GRADED_DICTIONARY.tremble
    assert.ok(gaokaoWord, 'Must have gaokao words')
    assert.strictEqual(gaokaoWord[3], '高考重点')

    // 四级高频
    const cet4Word = GRADED_DICTIONARY.philosopher || GRADED_DICTIONARY.sorcerer || GRADED_DICTIONARY.conscious
    assert.ok(cet4Word, 'Must have cet4 words')
    assert.strictEqual(cet4Word[3], '四级高频')

    // 六级进阶
    const cet6Word = GRADED_DICTIONARY.eccentric || GRADED_DICTIONARY.apprehensive || GRADED_DICTIONARY.sinister
    assert.ok(cet6Word, 'Must have cet6 words')
    assert.strictEqual(cet6Word[3], '六级进阶')

    // 魔法专有
    const loreWord = GRADED_DICTIONARY.quidditch || GRADED_DICTIONARY.muggle || GRADED_DICTIONARY.snitch
    assert.ok(loreWord, 'Must have HP lore words')
    assert.strictEqual(loreWord[3], '魔法专有')
  })

  test('Each entry in GRADED_DICTIONARY has valid tuple structure [phonetic, pos, def, tag]', () => {
    for (const [key, val] of Object.entries(GRADED_DICTIONARY).slice(0, 50)) {
      assert.ok(Array.isArray(val), `${key} must be an array tuple`)
      assert.strictEqual(val.length, 4, `${key} tuple must have 4 items [phonetic, pos, def, tag]`)
      assert.ok(typeof val[0] === 'string', `${key} phonetic must be string`)
      assert.ok(typeof val[1] === 'string', `${key} pos must be string`)
      assert.ok(typeof val[2] === 'string' && val[2].length > 0, `${key} def must be non-empty`)
      assert.ok(typeof val[3] === 'string' && val[3].length > 0, `${key} tag must be non-empty`)
    }
  })
})

describe('getTagBadgeClass dual-channel status theme utility', () => {
  test('returns distinct accessible styles for each curriculum tag', () => {
    const primary = getTagBadgeClass('小学基础')
    assert.ok(primary.includes('emerald') || primary.includes('green'), 'Primary must have green styling')

    const zhongkao = getTagBadgeClass('中考核心')
    assert.ok(zhongkao.includes('sky') || zhongkao.includes('blue'), 'Zhongkao must have sky/blue styling')

    const gaokao = getTagBadgeClass('高考重点')
    assert.ok(gaokao.includes('amber') || gaokao.includes('orange'), 'Gaokao must have amber styling')

    const cet4 = getTagBadgeClass('四级高频')
    assert.ok(cet4.includes('indigo') || cet4.includes('blue'), 'CET4 must have indigo styling')

    const cet6 = getTagBadgeClass('六级进阶')
    assert.ok(cet6.includes('purple') || cet6.includes('violet'), 'CET6 must have purple styling')

    const lore = getTagBadgeClass('魔法专有')
    assert.ok(lore.includes('amber') || lore.includes('yellow') || lore.includes('#'), 'HP lore must have parchment styling')

    const fallback = getTagBadgeClass('未知标签')
    assert.ok(fallback.length > 0, 'Fallback must return valid classes')
  })
})
