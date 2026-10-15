import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { register } from 'node:module'
import { parse } from 'vue/compiler-sfc'

register('./vue-loader.js', import.meta.url)

describe('TedHub.vue Component Tests', () => {
  it('TedHub.vue exports default', async () => {
    const mod = await import('../../src/components/ted/TedHub.vue')
    assert.ok(mod.default, 'Default export must exist')
  })

  it('TedHub.vue is a valid Vue 3 SFC', () => {
    const filePath = path.resolve('src/components/ted/TedHub.vue')
    assert.ok(fs.existsSync(filePath), 'src/components/ted/TedHub.vue must exist')

    const source = fs.readFileSync(filePath, 'utf-8')
    const { descriptor, errors } = parse(source)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  it('TedHub.vue contains zero emoji characters', () => {
    const source = fs.readFileSync('src/components/ted/TedHub.vue', 'utf8')
    const emojiRegex = /\p{Extended_Pictographic}/gu
    assert.strictEqual(source.match(emojiRegex), null, 'TedHub.vue must contain zero emoji')
    const rangeRegex = /[\u{1F300}-\u{1FAFF}]/u
    assert.ok(!rangeRegex.test(source), 'TedHub.vue must contain no unicode emoji characters')
  })

  it('uses Video icon from lucide-vue-next in specified 48px container', () => {
    const source = fs.readFileSync('src/components/ted/TedHub.vue', 'utf8')
    assert.ok(source.includes('lucide-vue-next'), 'Must import icons from lucide-vue-next')
    assert.ok(!source.includes('lucide-react'), 'Must not import from lucide-react')
    assert.ok(source.includes('Video'), 'Must use Video icon')
    assert.ok(
      source.includes('w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-300/80 flex items-center justify-center text-amber-700'),
      'Must contain the exact styled 48px icon container'
    )
  })

  it('renders headline, body and sub-note with required typography and styling', () => {
    const source = fs.readFileSync('src/components/ted/TedHub.vue', 'utf8')
    assert.ok(source.includes('TED 魔法精讲'), 'Must contain headline "TED 魔法精讲"')
    assert.ok(
      source.includes('text-lg font-bold font-magical text-amber-950'),
      'Headline must use required typography classes'
    )

    assert.ok(
      source.includes('每期精选 TED 演讲，配词汇预热、精看任务与跟读评测，助你突破 B1 英语瓶颈。'),
      'Must contain exact educational body copy'
    )
    assert.ok(
      source.includes('text-base text-stone-600 leading-relaxed max-w-sm'),
      'Body copy must use required typography classes'
    )

    assert.ok(source.includes('即将开放 · 敬请期待'), 'Must contain sub-note "即将开放 · 敬请期待"')
    assert.ok(source.includes('text-sm text-stone-400'), 'Sub-note must use required typography classes')
  })

  it('consumes useNavigationStore and provides centered full-height layout', () => {
    const source = fs.readFileSync('src/components/ted/TedHub.vue', 'utf8')
    assert.ok(source.includes('useNavigationStore'), 'Must consume useNavigationStore')
    assert.ok(
      source.includes('h-full') && source.includes('flex') && source.includes('items-center') && source.includes('justify-center'),
      'Must have full-height centered layout'
    )
  })
})

describe('TedHub.vue Sprint 2', () => {
  const getHubSrc = () => fs.readFileSync('src/components/ted/TedHub.vue', 'utf8')

  it('imports TedVocabPreload', () => {
    const hubSrc = getHubSrc()
    assert.ok(hubSrc.includes('TedVocabPreload'), 'Missing TedVocabPreload import')
  })
  it('imports TedVideoPlayer', () => {
    const hubSrc = getHubSrc()
    assert.ok(hubSrc.includes('TedVideoPlayer'), 'Missing TedVideoPlayer import')
  })
  it('imports TedTaskStudio', () => {
    const hubSrc = getHubSrc()
    assert.ok(hubSrc.includes('TedTaskStudio'), 'Missing TedTaskStudio import')
  })
  it('imports TedShadowing', () => {
    const hubSrc = getHubSrc()
    assert.ok(hubSrc.includes('TedShadowing'), 'Missing TedShadowing import')
  })
  it('imports TedStepBar', () => {
    const hubSrc = getHubSrc()
    assert.ok(hubSrc.includes('TedStepBar'), 'Missing TedStepBar import')
  })
  it('imports TedTalkList', () => {
    const hubSrc = getHubSrc()
    assert.ok(hubSrc.includes('TedTalkList'), 'Missing TedTalkList import')
  })
  it('TedTalkList hidden on mobile, shown on lg', () => {
    const hubSrc = getHubSrc()
    assert.ok(hubSrc.includes('hidden lg:flex') || hubSrc.includes('lg:block'), 'TedTalkList should be hidden on mobile')
  })
  it('uses conditional rendering (v-if) for step components', () => {
    const hubSrc = getHubSrc()
    assert.ok(hubSrc.includes('v-if'), 'Missing v-if step routing')
  })
  it('contains no Unicode emojis', () => {
    const hubSrc = getHubSrc()
    assert.doesNotMatch(hubSrc, /\p{Extended_Pictographic}/u, 'Emoji found in TedHub.vue')
  })
  it('imports useTedStore and auto-selects first talk on mount', () => {
    const hubSrc = getHubSrc()
    assert.ok(hubSrc.includes('useTedStore'), 'Missing useTedStore import')
    assert.ok(hubSrc.includes('onMounted'), 'Missing onMounted lifecycle hook')
    assert.ok(hubSrc.includes('selectTalk'), 'Missing auto-select talk on mount')
  })
})
