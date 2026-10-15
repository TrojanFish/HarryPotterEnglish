import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalyticsStore } from '../../src/stores/analyticsStore.js'

if (typeof globalThis.localStorage === 'undefined') {
  const mem = new Map()
  globalThis.localStorage = {
    getItem: (k) => mem.get(k) || null,
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear()
  }
}

describe('analyticsStore CEFR & Radar Engine', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  test('analyticsStore computes default baseline CEFR A2 and wizard title', () => {
    const store = useAnalyticsStore()
    assert.strictEqual(store.cefrLevel, 'A2')
    assert.strictEqual(store.wizardTitle, '魔法学徒')
    assert.ok(typeof store.nextLevelProgress === 'number')
    assert.ok(store.nextLevelProgress >= 0 && store.nextLevelProgress <= 100)
  })

  test('radarDimensions returns 5 bounded dimensions (0-100)', () => {
    const store = useAnalyticsStore()
    const dims = store.radarDimensions
    assert.ok(dims)
    for (const key of ['auditory', 'vocabDepth', 'comprehension', 'shadowing', 'production']) {
      assert.ok(typeof dims[key] === 'number', `Dimension ${key} must be a number`)
      assert.ok(dims[key] >= 0 && dims[key] <= 100, `Dimension ${key} must be in [0, 100]`)
    }
  })

  test('radarPolygonPoints calculates valid SVG points string without NaN', () => {
    const store = useAnalyticsStore()
    const points = store.radarPolygonPoints(200, 200, 150)
    assert.ok(typeof points === 'string')
    assert.ok(!points.includes('NaN'), 'SVG points must not contain NaN')
    const pairs = points.trim().split(/\s+/)
    assert.strictEqual(pairs.length, 5, 'Must generate 5 polygon vertices')
    for (const pair of pairs) {
      const [x, y] = pair.split(',').map(Number)
      assert.ok(!isNaN(x), 'x coordinate must be a valid number')
      assert.ok(!isNaN(y), 'y coordinate must be a valid number')
    }
  })

  test('recording telemetry updates metrics and persists to localStorage', () => {
    const store = useAnalyticsStore()
    store.recordListeningTime(300)
    assert.strictEqual(store.listeningSeconds, 300)

    store.recordShadowingScore(88)
    assert.strictEqual(store.shadowingHistory.length, 1)
    assert.strictEqual(store.shadowingHistory[0].score, 88)

    store.recordDictationResult(9, 10)
    assert.strictEqual(store.dictationHistory.length, 1)

    // Verify localStorage persistence
    const raw = localStorage.getItem('hp_analytics_state')
    assert.ok(raw)
    assert.ok(raw.includes('300'))
  })

  test('saveExamResult appends exam history and updates best CEFR level', () => {
    const store = useAnalyticsStore()
    const exam = {
      id: 'owls-1',
      timestamp: Date.now(),
      cefrResult: 'B2',
      title: '魔法进阶者',
      compositeScore: 86,
      dimensions: { auditory: 85, vocabDepth: 88, comprehension: 84, shadowing: 86, production: 87 }
    }
    store.saveExamResult(exam)
    assert.strictEqual(store.examHistory.length, 1)
    assert.strictEqual(store.cefrLevel, 'B2')
    assert.strictEqual(store.wizardTitle, '魔法进阶者')
  })
})
