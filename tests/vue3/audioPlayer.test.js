import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

// Test file existence and structure
test('AudioPlayer.vue file exists and imports Lucide icons', () => {
  const filePath = path.resolve('src/components/AudioPlayer.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/AudioPlayer.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes('lucide-vue-next'), 'AudioPlayer must import icons from lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'AudioPlayer must not import from lucide-react')
  assert.ok(content.includes('usePlayerStore'), 'AudioPlayer must use usePlayerStore')
  // Check touch target class presence
  assert.ok(content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('h-12'), 'AudioPlayer buttons must meet Apple HIG touch target')
})

test('formatTime helper converts seconds to mm:ss correctly', async () => {
  // Dynamic import of AudioPlayer script logic or helper
  const { formatTime } = await import('../../src/utils/formatTime.js')
  assert.strictEqual(formatTime(0), '00:00')
  assert.strictEqual(formatTime(65), '01:05')
  assert.strictEqual(formatTime(3599), '59:59')
  assert.strictEqual(formatTime(3665), '61:05')
})
