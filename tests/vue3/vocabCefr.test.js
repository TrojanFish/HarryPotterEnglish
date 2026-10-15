import { describe, test } from 'node:test'
import assert from 'node:assert'
import { getCefrLevel, lookupWord } from '../../src/data/dictionaryData.js'

describe('CEFR Level Derivation & Dictionary Metadata', () => {
  test('getCefrLevel derives correct CEFR level by tag', () => {
    assert.strictEqual(getCefrLevel('cat', '小学基础'), 'A1')
    assert.strictEqual(getCefrLevel('survive', '中考核心'), 'A2')
    assert.strictEqual(getCefrLevel('peculiar', '高考重点'), 'B1')
    assert.strictEqual(getCefrLevel('inspire', '四级高频'), 'B2')
    assert.strictEqual(getCefrLevel('phenomenon', '六级进阶'), 'C1')
    assert.strictEqual(getCefrLevel('perseverance', '雅思核心'), 'C1')
    assert.strictEqual(getCefrLevel('wand', '魔法专有'), 'B2')
    assert.strictEqual(getCefrLevel('custom', '拓展生词'), 'B1')
    assert.strictEqual(getCefrLevel('unknown'), 'B1')
  })

  test('lookupWord includes cefrLevel in returned object', () => {
    const cloak = lookupWord('cloak')
    assert.ok(cloak)
    assert.ok(cloak.cefrLevel, 'Must contain cefrLevel')
    assert.match(cloak.cefrLevel, /^A[12]|B[12]|C1$/)

    const fallback = lookupWord('unknownwordxyz')
    assert.strictEqual(fallback.cefrLevel, 'B1')
  })
})
