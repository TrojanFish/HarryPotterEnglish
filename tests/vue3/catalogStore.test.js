import test from 'node:test'
import assert from 'node:assert'
import { setActivePinia, createPinia } from 'pinia'
import { useCatalogStore, resolveAudioStreamUrl } from '../../src/stores/catalogStore.js'

test('resolveAudioStreamUrl transforms R2 audioKey to stream endpoint', () => {
  const url1 = resolveAudioStreamUrl('podcasts/hp-book-1/episodes/ep01/audio.mp3')
  assert.strictEqual(url1, '/api/stream/audio/podcasts/hp-book-1/episodes/ep01/audio')

  const urlWithBase = resolveAudioStreamUrl('podcasts/hp-book-1/episodes/ep01/audio.mp3', 'http://127.0.0.1:3001')
  assert.strictEqual(urlWithBase, 'http://127.0.0.1:3001/api/stream/audio/podcasts/hp-book-1/episodes/ep01/audio')

  const urlWithCdn = resolveAudioStreamUrl('podcasts/hp-book-1/episodes/ep01/audio.mp3', '', 'https://cdn.fluentfox.com')
  assert.strictEqual(urlWithCdn, 'https://cdn.fluentfox.com/podcasts/hp-book-1/episodes/ep01/audio.mp3')
})

test('useCatalogStore initializes default book and chapter', async () => {
  setActivePinia(createPinia())
  const catalog = useCatalogStore()

  assert.ok(catalog.books.length > 0, 'books should not be empty')
  assert.ok(catalog.currentBook, 'currentBook should be present')
  assert.ok(catalog.currentChapter, 'currentChapter should be present')
  assert.ok(catalog.audioUrl.length > 0, 'audioUrl should be resolved')
})

test('useCatalogStore switching book updates chapter and audioUrl', () => {
  setActivePinia(createPinia())
  const catalog = useCatalogStore()

  const book2 = catalog.books.find(b => b.id === 'hp-book-2' || b.id === 'book2')
  if (book2) {
    catalog.selectBook(book2.id)
    assert.strictEqual(catalog.selectedBookId, book2.id)
    assert.ok(catalog.currentChapter.id.startsWith(book2.id) || catalog.currentChapter.id.includes('b2'))
    assert.ok(catalog.audioUrl.includes('book-2') || catalog.audioUrl.includes('book2'))
  }
})

test('useCatalogStore switching chapter preserves book and updates stream url', () => {
  setActivePinia(createPinia())
  const catalog = useCatalogStore()

  const ch2 = catalog.currentBook.chapters[1]
  if (ch2) {
    catalog.selectChapter(ch2.id)
    assert.strictEqual(catalog.selectedChapterId, ch2.id)
    assert.ok(catalog.audioUrl.includes(ch2.epId || 'ep02') || catalog.audioUrl.includes('ch02'))
  }
})
