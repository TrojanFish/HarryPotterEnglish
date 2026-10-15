import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '../../src/stores/playerStore.js'

// Simple mock for localStorage in Node environment if needed
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  }
}

test('ShadowingRecorder.vue file exists and meets standards', () => {
  const filePath = path.resolve('src/components/ShadowingRecorder.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/ShadowingRecorder.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes('evaluatePronunciation'), 'Must use evaluatePronunciation from speechScoring')
  assert.ok(content.includes('Track A') || content.includes('track-a'), 'Must support Track A original audio')
  assert.ok(content.includes('Track B') || content.includes('track-b'), 'Must support Track B user recording')
  assert.ok(content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('h-12'), 'Touch targets must be >= 44px')
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
  assert.ok(!content.includes('shadow-2xl'), 'Must not use heavy shadow-2xl')

  // SpeechRecognition standards
  assert.ok(content.includes('SpeechRecognitionAPI'), 'Must declare SpeechRecognitionAPI check')
  assert.ok(content.includes('isSpeechRecognitionSupported'), 'Must declare isSpeechRecognitionSupported computed')
  assert.ok(content.includes('AlertCircle'), 'Must import AlertCircle for unsupported notice')
  assert.ok(content.includes('spokenTranscript'), 'Must track spoken transcript')
  assert.ok(content.includes('isPlayingOriginal'), 'Must track isPlayingOriginal state')
})

test('evaluatePronunciation scoring logic integration', async () => {
  const { evaluatePronunciation } = await import('../../src/utils/speechScoring.js')
  const target = 'Mr. and Mrs. Dursley of number four Privet Drive'
  const spoken = 'Mr and Mrs Dursley of number four Privet Drive'
  const res = evaluatePronunciation(target, spoken)

  assert.ok(res.score >= 90, 'Score should be high for nearly identical speech')
  assert.ok(Array.isArray(res.words), 'Result must contain word-level tokens')
  assert.strictEqual(res.words[0].status, 'matched')
})

test('SpeechRecognition presence and absence fallback evaluation logic', async () => {
  const { evaluatePronunciation } = await import('../../src/utils/speechScoring.js')
  const target = 'Mr. and Mrs. Dursley of number four Privet Drive'

  // Case 1: SpeechRecognition produces actual different transcript -> score should not be 100%
  const spokenRealSpeech = 'Mister Dursley number four'
  const realRes = evaluatePronunciation(target, spokenRealSpeech)
  assert.ok(realRes.score < 90, 'Imperfect spoken transcript must produce a realistic score below 90')
  assert.ok(realRes.words.some(w => w.status !== 'matched'), 'Should contain non-matched words for omitted parts')

  // Case 2: SpeechRecognition unavailable or empty transcript -> fallback to target sentence
  const emptyTranscript = ''
  const fallbackSpoken = emptyTranscript.trim() || target
  const fallbackRes = evaluatePronunciation(target, fallbackSpoken)
  assert.strictEqual(fallbackRes.score, 100, 'Fallback with target sentence should score 100')
  assert.ok(fallbackRes.words.every(w => w.status === 'matched'), 'All words matched in fallback mode')
})

test('Track A snippet loop stops at cue.end - 0.15 threshold', () => {
  setActivePinia(createPinia())
  const player = usePlayerStore()

  const currentCue = { start: 10.0, end: 15.0, text: 'Test cue' }
  let isPlayingOriginal = true

  player.seek(currentCue.start)
  player.play()
  assert.strictEqual(player.isPlaying, true)
  assert.strictEqual(player.currentTime, 10.0)

  // Simulate time progression watcher logic
  const checkSnippetEnd = (currentTime) => {
    if (isPlayingOriginal && currentCue?.end !== undefined && currentTime >= currentCue.end - 0.15) {
      player.pause()
      isPlayingOriginal = false
    }
  }

  // Before threshold (14.0s)
  player.seek(14.0)
  checkSnippetEnd(player.currentTime)
  assert.strictEqual(player.isPlaying, true)
  assert.strictEqual(isPlayingOriginal, true)

  // At threshold (14.85s = 15.0 - 0.15)
  player.seek(14.85)
  checkSnippetEnd(player.currentTime)
  assert.strictEqual(player.isPlaying, false, 'Player should pause at cue end threshold')
  assert.strictEqual(isPlayingOriginal, false, 'isPlayingOriginal should reset to false')
})
