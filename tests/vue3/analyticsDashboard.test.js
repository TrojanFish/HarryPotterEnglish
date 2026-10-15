import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'

// LocalStorage mock for Node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  }
}

test('AnalyticsDashboard.vue file exists and meets standards', () => {
  const filePath = path.resolve('src/components/AnalyticsDashboard.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/AnalyticsDashboard.vue must exist')
  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes('weeklyData'), 'Must render weekly trend chart with weeklyData')
  assert.ok(!content.includes('preserveAspectRatio="none"'), 'Must not use preserveAspectRatio="none"')
  assert.ok(content.includes('Streak') || content.includes('streak'), 'Must display streak days')
  assert.ok(content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('h-12'), 'Touch targets must be >= 44px')
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
  assert.ok(!content.includes('shadow-2xl'), 'Must remove shadow-2xl for flat design')
  assert.ok(content.includes('useAnalyticsStore'), 'Must use real Pinia analyticsStore')
})

test('AnalyticsDashboard weekly trend chart does not distort text labels with preserveAspectRatio none', () => {
  const filePath = path.resolve('src/components/AnalyticsDashboard.vue')
  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(
    !content.includes('preserveAspectRatio="none"'),
    'Must not use preserveAspectRatio="none" which distorts and stretches font glyphs'
  )
})

test('analyticsStore summary integration check', async () => {
  const { createInitialState, sanitizeState } = await import('../../src/utils/analyticsStore.js')
  const initial = createInitialState()
  assert.strictEqual(initial.streakDays, 0)
  assert.ok(Array.isArray(initial.completedChapters))

  const clean = sanitizeState(initial)
  assert.ok(clean.dailyListeningSeconds !== undefined)
})

test('useAnalyticsStore Pinia store tracks listening, streaks, chapters and persists', async () => {
  localStorage.clear()
  setActivePinia(createPinia())
  const { useAnalyticsStore, formatDate, STORAGE_KEY } = await import('../../src/stores/analyticsStore.js')

  const store = useAnalyticsStore()
  assert.strictEqual(store.totalListeningSeconds, 0)
  assert.strictEqual(store.totalHours, '0.0')
  assert.strictEqual(store.completedChaptersCount, 0)
  assert.strictEqual(store.accuracyScore, 95)
  assert.strictEqual(store.streakDays, 0)
  assert.strictEqual(store.weeklyDays.length, 7)
  assert.ok(store.weeklyDays.some(d => d.isToday === true))

  // Record listening activity
  store.recordListening(60)
  assert.strictEqual(store.totalListeningSeconds, 60)
  assert.strictEqual(store.streakDays, 1)

  // Verify persistence to localStorage
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
  assert.strictEqual(saved.totalListeningSeconds, 60)
  const todayStr = formatDate(new Date())
  assert.strictEqual(saved.dailyListening[todayStr], 60)

  // Complete chapter
  store.markChapterComplete('hp-book-1_ep01')
  assert.strictEqual(store.completedChaptersCount, 1)
  assert.deepStrictEqual(store.completedChapters, ['hp-book-1_ep01'])

  // Streak calculation with consecutive days
  const now = new Date()
  const yest = new Date(now)
  yest.setDate(yest.getDate() - 1)
  const yestStr = formatDate(yest)

  store.dailyListening[yestStr] = 300
  assert.strictEqual(store.streakDays, 2)
})
