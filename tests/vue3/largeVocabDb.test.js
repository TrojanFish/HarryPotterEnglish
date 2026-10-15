import { describe, test } from 'node:test'
import assert from 'node:assert'
import { GRADED_DICTIONARY } from '../../src/data/gradedDictionaryData.js'
import { lookupWord } from '../../src/data/dictionaryData.js'

describe('Large-Scale Graded Vocabulary Database (12,000+ words)', () => {
  test('GRADED_DICTIONARY contains at least 10,000 unique headwords', () => {
    const keys = Object.keys(GRADED_DICTIONARY)
    assert.ok(keys.length >= 10000, `Expected at least 10,000 entries, but got ${keys.length}`)
  })

  test('Resolves vocabulary across all five curriculum grades plus HP lore', () => {
    // 1. 小学基础
    const primary = lookupWord('apple')
    assert.strictEqual(primary.tag, '小学基础', 'apple should have 小学基础 tag')
    assert.ok(primary.definition.includes('苹果'), 'apple definition should include 苹果')

    // 2. 中考核心
    const middle = lookupWord('discover')
    assert.strictEqual(middle.tag, '中考核心', 'discover should have 中考核心 tag')
    assert.ok(middle.definition.includes('发现'), 'discover definition should include 发现')

    // 3. 高考重点
    const gaokao = lookupWord('peculiar')
    assert.strictEqual(gaokao.tag, '高考重点', 'peculiar should have 高考重点 tag')
    assert.ok(gaokao.definition.length > 0)

    // 4. 四级高频
    const cet4 = lookupWord('philosopher')
    assert.strictEqual(cet4.tag, '四级高频', 'philosopher should have 四级高频 tag')
    assert.ok(cet4.definition.length > 0)

    // 5. 六级进阶
    const cet6 = lookupWord('eccentric')
    assert.strictEqual(cet6.tag, '六级进阶', 'eccentric should have 六级进阶 tag')
    assert.ok(cet6.definition.length > 0)

    // 6. 魔法专有
    const lore = lookupWord('quidditch')
    assert.strictEqual(lore.tag, '魔法专有', 'quidditch should have 魔法专有 tag')
    assert.ok(lore.definition.length > 0)
  })

  test('Resolves high-frequency Harry Potter chapter 1 literary words', () => {
    const word1 = lookupWord('abruptly')
    assert.ok(word1.tag === '六级进阶' || word1.tag === '四级高频' || word1.tag === '高考重点', `abruptly got tag ${word1.tag}`)
    assert.ok(word1.definition.includes('突然') || word1.definition.includes('唐突'))

    const word2 = lookupWord('rummage')
    assert.ok(word2.definition.includes('翻找') || word2.definition.includes('搜寻') || word2.definition.length > 0)
  })

  test('Resolves inflected forms of expanded words via lemma reduction', () => {
    const inflected = lookupWord('quivering')
    assert.ok(inflected.word === 'quiver', `quivering should reduce to quiver, got ${inflected.word}`)
    assert.ok(inflected.tag === '高考重点' || inflected.tag === '六级进阶' || inflected.tag === '中考核心')
  })
})
