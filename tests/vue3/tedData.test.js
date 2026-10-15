import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TALKS, resolveVideoStreamUrl, resolveTedSubtitleUrl, parseBilingualVtt } from '../../src/data/tedData.js'

describe('TALKS', () => {
  it('exports at least one talk', () => { assert.ok(TALKS.length >= 1) })
  it('first talk has required fields', () => {
    const t = TALKS[0]
    assert.ok(t.id && t.title && t.speaker && t.videoKey && t.vttKey)
    assert.ok(Array.isArray(t.vocabSet) && t.vocabSet.length >= 8)
    assert.ok(Array.isArray(t.tasks.cloze) && t.tasks.cloze.length >= 3)
    assert.ok(Array.isArray(t.tasks.matching) && t.tasks.matching.length >= 2)
    assert.ok(Array.isArray(t.shadowingSegments) && t.shadowingSegments.length >= 1)
  })
  it('vocab entries have required fields', () => {
    const v = TALKS[0].vocabSet[0]
    assert.ok(v.word && v.ipa && v.pos && v.cefrLevel && v.definitionCn && v.exampleSentence)
  })
})

describe('resolveVideoStreamUrl', () => {
  it('returns CDN URL when customCdnDomain provided', () => {
    const url = resolveVideoStreamUrl('ted/foo/video.mp4', '', 'https://cdn.example.com')
    assert.equal(url, 'https://cdn.example.com/ted/foo/video.mp4')
  })
  it('returns proxy URL when no CDN', () => {
    const url = resolveVideoStreamUrl('ted/foo/video.mp4')
    assert.equal(url, '/api/stream/video/ted/foo/video.mp4')
  })
  it('returns empty string for empty key', () => {
    assert.equal(resolveVideoStreamUrl(''), '')
  })
})

describe('resolveTedSubtitleUrl', () => {
  it('maps vttKey to /api/subtitles/ path', () => {
    assert.equal(resolveTedSubtitleUrl('ted/foo/subtitle.vtt'), '/api/subtitles/ted/foo/subtitle.vtt')
  })
})

describe('parseBilingualVtt', () => {
  it('parses en and zh cues from bilingual VTT', () => {
    const vtt = `WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello world\n\n00:00:01.000 --> 00:00:04.000\n你好世界\n`
    const { enCues, zhCues } = parseBilingualVtt(vtt)
    assert.equal(enCues.length, 1)
    assert.equal(zhCues.length, 1)
    assert.equal(enCues[0].text, 'Hello world')
    assert.equal(zhCues[0].text, '你好世界')
    assert.equal(enCues[0].startTime, 1)
    assert.equal(enCues[0].endTime, 4)
  })
  it('handles CRLF line endings without crashing', () => {
    const vtt = `WEBVTT\r\n\r\n00:00:01.000 --> 00:00:04.000\r\nTest\r\n\r\n00:00:01.000 --> 00:00:04.000\r\n测试\r\n`
    const { enCues } = parseBilingualVtt(vtt)
    assert.equal(enCues[0].text, 'Test')
  })
  it('returns empty arrays for empty/null input', () => {
    const { enCues, zhCues } = parseBilingualVtt('')
    assert.equal(enCues.length, 0)
    assert.equal(zhCues.length, 0)
  })
  it('handles UTF-8 BOM prefix cleanly', () => {
    const vtt = `\uFEFFWEBVTT\n\n00:00:01.000 --> 00:00:04.000\nBOM test\n\n00:00:01.000 --> 00:00:04.000\nBOM测试\n`
    const { enCues, zhCues } = parseBilingualVtt(vtt)
    assert.equal(enCues.length, 1)
    assert.equal(enCues[0].text, 'BOM test')
    assert.equal(zhCues.length, 1)
    assert.equal(zhCues[0].text, 'BOM测试')
  })
})
