import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { parse } from 'vue/compiler-sfc'

describe('App.vue Integration Tests', () => {
  it('App.vue still imports SmartAudioPlayer', async () => {
    const src = fs.readFileSync('src/App.vue', 'utf8')
    assert.ok(src.includes('SmartAudioPlayer'), 'SmartAudioPlayer must remain imported')
  })

  it('App.vue uses AppShell', async () => {
    const src = fs.readFileSync('src/App.vue', 'utf8')
    assert.ok(src.includes('AppShell'), 'AppShell must be used in App.vue')
  })

  it('App.vue does not use MobileBottomNav jsx (dead code)', async () => {
    const src = fs.readFileSync('src/App.vue', 'utf8')
    assert.ok(!src.includes("from './components/navigation/MobileBottomNav.jsx'"), 'jsx nav must not be imported in App.vue')
  })

  it('App.vue imports and renders TedHub for ted view', async () => {
    const src = fs.readFileSync('src/App.vue', 'utf8')
    assert.ok(src.includes('TedHub'), 'TedHub must be imported and used')
    assert.ok(src.includes("navStore.currentView === 'ted'"), 'App.vue must switch to TedHub when currentView is ted')
  })

  it('App.vue retains hidden native audio element with audioRef', async () => {
    const src = fs.readFileSync('src/App.vue', 'utf8')
    assert.ok(src.includes('<audio') && src.includes('ref="audioRef"'), 'Native audio element must be retained in App.vue')
    assert.ok(src.includes('class="hidden"'), 'Audio element must be hidden')
  })

  it('App.vue is a valid Vue 3 SFC with zero emojis', () => {
    const src = fs.readFileSync('src/App.vue', 'utf8')
    const { descriptor, errors } = parse(src)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'App.vue must have template block')
    assert.ok(descriptor.scriptSetup, 'App.vue must have <script setup>')

    const emojiRegex = /\p{Extended_Pictographic}/gu
    assert.strictEqual(src.match(emojiRegex), null, 'App.vue must contain zero emojis')
  })
})
