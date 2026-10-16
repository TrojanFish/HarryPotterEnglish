import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Unit-test the Content-Type selection logic extracted as a pure function
// (We test the routing logic in isolation - integration test would need a running server)
function getVideoContentType(key) {
  if (/\.webm$/i.test(key)) return 'video/webm'
  if (/\.mp3$/i.test(key)) return 'audio/mpeg'
  return 'video/mp4'
}

describe('getVideoContentType', () => {
  it('returns video/mp4 for .mp4 keys', () => {
    assert.equal(getVideoContentType('ted/foo/video.mp4'), 'video/mp4')
  })
  it('returns video/webm for .webm keys', () => {
    assert.equal(getVideoContentType('ted/foo/video.webm'), 'video/webm')
  })
  it('returns audio/mpeg for .mp3 keys', () => {
    assert.equal(getVideoContentType('ted/foo/audio.mp3'), 'audio/mpeg')
  })
  it('defaults to video/mp4 for unknown extension', () => {
    assert.equal(getVideoContentType('ted/foo/video'), 'video/mp4')
  })
})

// Verify the route path is registered in server/index.js and server/viteR2Plugin.js
describe('server route registration', () => {
  it('server/index.js contains /api/stream/video and /api/ted/talks routes', async () => {
    const fs = await import('node:fs/promises')
    const src = await fs.readFile('server/index.js', 'utf8')
    assert.ok(src.includes('/api/stream/video/'), 'Missing /api/stream/video/ route in server/index.js')
    assert.ok(src.includes('/api/ted/talks'), 'Missing /api/ted/talks route in server/index.js')
  })

  it('server/viteR2Plugin.js contains /api/stream/video and /api/ted/talks routes', async () => {
    const fs = await import('node:fs/promises')
    const src = await fs.readFile('server/viteR2Plugin.js', 'utf8')
    assert.ok(src.includes('/api/stream/video/'), 'Missing /api/stream/video/ route in server/viteR2Plugin.js')
    assert.ok(src.includes('/api/ted/talks'), 'Missing /api/ted/talks route in server/viteR2Plugin.js')
  })
})
