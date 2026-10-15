import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

test('StorageManagerModal.vue exists and meets standards', () => {
  const filePath = path.resolve('src/components/StorageManagerModal.vue')
  assert.ok(fs.existsSync(filePath), 'src/components/StorageManagerModal.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes('offlineStorage'), 'Must import from offlineStorage')
  assert.ok(content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('h-12'), 'Touch targets must be >= 44px')
  assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
  assert.ok(!content.includes('shadow-2xl'), 'Must remove shadow-2xl for flat design')
  assert.ok(content.includes('useCatalogStore'), 'Must import useCatalogStore')
  assert.ok(content.includes('saveChapterOffline'), 'Must import saveChapterOffline')
  assert.ok(content.includes('Download'), 'Must import Download icon')
  assert.ok(content.includes('CheckCircle2'), 'Must import CheckCircle2 icon')
  assert.ok(content.includes('Loader2'), 'Must import Loader2 icon')
  assert.ok(content.includes('可下载章节'), 'Must render downloadable chapters section')
  assert.ok(content.includes('downloadChapter'), 'Must define chapter download handler')
})

test('offlineStorage exports storage info query', async () => {
  const { getOfflineStorageInfo } = await import('../../src/utils/offlineStorage.js')
  assert.strictEqual(typeof getOfflineStorageInfo, 'function')
})

