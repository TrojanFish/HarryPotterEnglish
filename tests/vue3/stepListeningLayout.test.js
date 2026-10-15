import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

it('StepListening left column constrains line length', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync('src/components/session/StepListening.vue', 'utf8')
  assert.ok(src.includes('max-w-3xl') || src.includes('max-w-2xl'), 'left column must have max-width to prevent line-length blowout on wide screens')
})

it('StepListening right panel shown on md and above', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync('src/components/session/StepListening.vue', 'utf8')
  assert.ok(src.includes('hidden md:flex'), 'right panel must use hidden md:flex')
})
