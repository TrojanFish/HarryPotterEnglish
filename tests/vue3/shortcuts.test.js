import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

test('ShortcutsModal.vue exists and meets standards', () => {
  const filePath = path.resolve('src/components/ShortcutsModal.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/ShortcutsModal.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes('Space'), 'Must document Space key shortcut')
  assert.ok(content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('h-12'), 'Touch targets must be >= 44px')
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
})
