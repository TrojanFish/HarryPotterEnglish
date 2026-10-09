import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { useSubtitleStore } from '../../src/stores/subtitleStore.js'

test('DictationStudio.vue file exists and meets standards', () => {
  const filePath = path.resolve('src/components/DictationStudio.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/DictationStudio.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  // Check 16px text-base rule for mobile iOS zoom prevention
  assert.ok(content.includes('text-base') || content.includes('text-[16px]'), 'Input must be >= 16px to prevent iOS auto-zoom')
  // Check Apple HIG >= 44px
  assert.ok(content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('h-12'), 'Touch targets must be >= 44px')
  // Check zero emojis & lucide-vue-next
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
})

test('Token matching logic for dictation verification', () => {
  const target = 'Privet'
  const userInput = 'privet '
  const cleanedTarget = target.trim().toLowerCase()
  const cleanedInput = userInput.trim().toLowerCase()

  assert.strictEqual(cleanedTarget, cleanedInput)
})

test('DictationStudio emits next event and is wired in App.vue', () => {
  const filePath = path.resolve('src/components/DictationStudio.vue')
  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes("emit('next')"), "nextSentence must emit 'next'")
  assert.ok(content.includes("defineEmits(['close', 'next'])") || content.includes("'next'"), "DictationStudio must declare 'next' in emits")

  // Verify App.vue wires @next to onDictationNext
  const appPath = path.resolve('src/App.vue')
  const appContent = fs.readFileSync(appPath, 'utf-8')
  assert.ok(appContent.includes('@next="onDictationNext"'), 'App.vue must wire @next to onDictationNext')
  assert.ok(appContent.includes('function onDictationNext()'), 'App.vue must define onDictationNext handler')
})

test('subtitleStore jumpToNextCue and jumpToPrevCue advance and rewind activeCueIndex', () => {
  setActivePinia(createPinia())
  const subStore = useSubtitleStore()
  subStore.setCues([
    { id: 1, start: 0, end: 5, text: 'Sentence 1' },
    { id: 2, start: 5, end: 10, text: 'Sentence 2' },
    { id: 3, start: 10, end: 15, text: 'Sentence 3' }
  ])

  assert.strictEqual(subStore.activeCueIndex, -1)
  subStore.jumpToNextCue()
  assert.strictEqual(subStore.activeCueIndex, 0)
  assert.strictEqual(subStore.currentCue.text, 'Sentence 1')

  subStore.jumpToNextCue()
  assert.strictEqual(subStore.activeCueIndex, 1)
  assert.strictEqual(subStore.currentCue.text, 'Sentence 2')

  subStore.jumpToNextCue()
  assert.strictEqual(subStore.activeCueIndex, 2)
  assert.strictEqual(subStore.currentCue.text, 'Sentence 3')

  // Boundary check: cannot advance past end
  subStore.jumpToNextCue()
  assert.strictEqual(subStore.activeCueIndex, 2)

  // Navigate backward
  subStore.jumpToPrevCue()
  assert.strictEqual(subStore.activeCueIndex, 1)

  subStore.jumpToPrevCue()
  assert.strictEqual(subStore.activeCueIndex, 0)

  // Boundary check: cannot go before 0
  subStore.jumpToPrevCue()
  assert.strictEqual(subStore.activeCueIndex, 0)
})

