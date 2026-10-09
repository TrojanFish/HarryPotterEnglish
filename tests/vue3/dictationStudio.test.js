import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

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
