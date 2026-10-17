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

it('StepListening includes draggable separator between subtitle stream and vocabulary panel', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync('src/components/session/StepListening.vue', 'utf8')
  assert.ok(src.includes('role="separator"'), 'resizer must have role="separator"')
  assert.ok(src.includes('cursor-col-resize'), 'resizer must have cursor-col-resize cursor')
  assert.ok(src.includes('rightPanelWidth'), 'resizer must bind rightPanelWidth')
  assert.ok(src.includes('startDragging'), 'must implement startDragging handler')
  assert.ok(src.includes('resetPanelWidth'), 'must implement resetPanelWidth handler on double click')
  assert.ok(src.includes('GripVertical'), 'must import and render GripVertical icon')
})
