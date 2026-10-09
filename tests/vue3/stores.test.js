import test from 'node:test'
import assert from 'node:assert'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '../../src/stores/playerStore.js'
import { useSubtitleStore } from '../../src/stores/subtitleStore.js'

// Simple mock for localStorage in Node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  }
}

test('usePlayerStore initial state and playback actions', () => {
  setActivePinia(createPinia())
  const player = usePlayerStore()

  assert.strictEqual(player.isPlaying, false)
  assert.strictEqual(player.currentTime, 0)
  assert.strictEqual(player.playbackRate, 1.0)
  assert.strictEqual(player.isBlindMode, false)
  assert.strictEqual(player.isBookshelfOpen, false)

  player.play()
  assert.strictEqual(player.isPlaying, true)

  player.pause()
  assert.strictEqual(player.isPlaying, false)

  player.togglePlay()
  assert.strictEqual(player.isPlaying, true)

  player.setPlaybackRate(1.2)
  assert.strictEqual(player.playbackRate, 1.2)

  player.seek(42)
  assert.strictEqual(player.currentTime, 42)

  player.toggleBlindMode()
  assert.strictEqual(player.isBlindMode, true)
})

test('playerStore initializes currentBookId to hp-book-1', () => {
  localStorage.clear()
  setActivePinia(createPinia())
  const player = usePlayerStore()

  assert.strictEqual(player.currentBookId, 'hp-book-1')
  assert.strictEqual(player.currentChapterId, 'hp-book-1_ep01')
})

test('usePlayerStore persists last position to localStorage', () => {
  setActivePinia(createPinia())
  const player = usePlayerStore()

  player.switchChapter('hp1', 'hp1-02')
  assert.strictEqual(player.currentBookId, 'hp1')
  assert.strictEqual(player.currentChapterId, 'hp1-02')

  const stored = JSON.parse(localStorage.getItem('hp_last_position'))
  assert.strictEqual(stored.bookId, 'hp1')
  assert.strictEqual(stored.chapterId, 'hp1-02')
})

test('useSubtitleStore binary search matching active cue', () => {
  setActivePinia(createPinia())
  const subStore = useSubtitleStore()

  const sampleCues = [
    { id: 1, start: 0, end: 5.2, text: 'Mr. and Mrs. Dursley...' },
    { id: 2, start: 5.2, end: 10.5, text: 'of number four, Privet Drive...' },
    { id: 3, start: 10.5, end: 15.0, text: 'were proud to say that they were perfectly normal.' }
  ]

  subStore.setCues(sampleCues)
  assert.strictEqual(subStore.cues.length, 3)

  subStore.updateActiveCue(2.5)
  assert.strictEqual(subStore.activeCueIndex, 0)
  assert.strictEqual(subStore.currentCue.text, 'Mr. and Mrs. Dursley...')

  subStore.updateActiveCue(7.0)
  assert.strictEqual(subStore.activeCueIndex, 1)

  subStore.updateActiveCue(12.0)
  assert.strictEqual(subStore.activeCueIndex, 2)

  subStore.updateActiveCue(25.0)
  assert.strictEqual(subStore.activeCueIndex, -1)
  assert.strictEqual(subStore.currentCue, null)
})
