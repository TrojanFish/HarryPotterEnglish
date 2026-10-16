import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { register } from 'node:module'
import { parse } from 'vue/compiler-sfc'

// Register Vue loader for dynamic ESM import support in Node test runner
register('./vue-loader.js', import.meta.url)

describe('AppShell.vue & App.vue Auth & Settings Full Integration', () => {
  const appShellPath = path.resolve('src/components/layout/AppShell.vue')
  const appPath = path.resolve('src/App.vue')

  it('1. AppShell.vue compiles as a valid Vue 3 SFC', () => {
    assert.ok(fs.existsSync(appShellPath), 'src/components/layout/AppShell.vue must exist')
    const content = fs.readFileSync(appShellPath, 'utf-8')
    const { descriptor, errors } = parse(content)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  it('2. AppShell.vue imports AuthModal, SettingsModal, and useAuthStore', () => {
    const content = fs.readFileSync(appShellPath, 'utf-8')

    assert.ok(
      content.includes("import AuthModal from '../auth/AuthModal.vue'") ||
      content.includes('import AuthModal from "../auth/AuthModal.vue"'),
      'AppShell.vue must import AuthModal from ../auth/AuthModal.vue'
    )
    assert.ok(
      content.includes("import SettingsModal from '../settings/SettingsModal.vue'") ||
      content.includes('import SettingsModal from "../settings/SettingsModal.vue"'),
      'AppShell.vue must import SettingsModal from ../settings/SettingsModal.vue'
    )
    assert.ok(
      content.includes("useAuthStore") && content.includes("../../stores/authStore.js"),
      'AppShell.vue must import useAuthStore from ../../stores/authStore.js'
    )
  })

  it('3. AppShell.vue declares isAuthOpen, isSettingsOpen, and authStore reactive state', () => {
    const content = fs.readFileSync(appShellPath, 'utf-8')

    assert.ok(
      content.includes('const isAuthOpen = ref(false)'),
      'AppShell.vue must declare isAuthOpen = ref(false)'
    )
    assert.ok(
      content.includes('const isSettingsOpen = ref(false)'),
      'AppShell.vue must declare isSettingsOpen = ref(false)'
    )
    assert.ok(
      content.includes('const authStore = useAuthStore()'),
      'AppShell.vue must initialize authStore'
    )
  })

  it('4. AppShell.vue wires DesktopSidebarVue events @open-auth and @open-settings', () => {
    const content = fs.readFileSync(appShellPath, 'utf-8')

    assert.ok(
      content.includes('@open-auth="isAuthOpen = true"'),
      'DesktopSidebarVue must listen to @open-auth and set isAuthOpen to true'
    )
    assert.ok(
      content.includes('@open-settings="isSettingsOpen = true"'),
      'DesktopSidebarVue must listen to @open-settings and set isSettingsOpen to true'
    )
  })

  it('5. AppShell.vue mounts AuthModal and SettingsModal with required bindings', () => {
    const content = fs.readFileSync(appShellPath, 'utf-8')

    // AuthModal mounting
    assert.ok(
      content.includes('<AuthModal'),
      'AppShell.vue must mount <AuthModal'
    )
    assert.ok(
      content.includes(':is-open="isAuthOpen"'),
      'AuthModal must bind :is-open="isAuthOpen"'
    )
    assert.ok(
      content.includes('@close="isAuthOpen = false"'),
      'AuthModal must handle @close="isAuthOpen = false"'
    )
    assert.ok(
      content.includes('@logged-in="isAuthOpen = false"'),
      'AuthModal must handle @logged-in="isAuthOpen = false"'
    )

    // SettingsModal mounting
    assert.ok(
      content.includes('<SettingsModal'),
      'AppShell.vue must mount <SettingsModal'
    )
    assert.ok(
      content.includes(':is-open="isSettingsOpen"'),
      'SettingsModal must bind :is-open="isSettingsOpen"'
    )
    assert.ok(
      content.includes('@close="isSettingsOpen = false"'),
      'SettingsModal must handle @close="isSettingsOpen = false"'
    )
  })

  it('6. App.vue imports useAuthStore and invokes authStore.init() on mount', () => {
    assert.ok(fs.existsSync(appPath), 'src/App.vue must exist')
    const content = fs.readFileSync(appPath, 'utf-8')

    const { descriptor, errors } = parse(content)
    assert.strictEqual(errors.length, 0, 'App.vue SFC parsing must succeed')

    assert.ok(
      content.includes("useAuthStore") && content.includes("./stores/authStore.js"),
      'App.vue must import useAuthStore from ./stores/authStore.js'
    )
    assert.ok(
      content.includes('useAuthStore()'),
      'App.vue must call useAuthStore()'
    )
    assert.ok(
      content.includes('authStore.init()'),
      'App.vue must call authStore.init()'
    )
  })

  it('7. Strict Design System: Zero Unicode emojis in AppShell.vue and App.vue', () => {
    const appShellContent = fs.readFileSync(appShellPath, 'utf-8')
    const appContent = fs.readFileSync(appPath, 'utf-8')

    const emojiRegex = /\p{Extended_Pictographic}/gu
    const appShellMatches = appShellContent.match(emojiRegex)
    const appMatches = appContent.match(emojiRegex)

    assert.strictEqual(appShellMatches, null, 'AppShell.vue must contain zero Unicode emojis')
    assert.strictEqual(appMatches, null, 'App.vue must contain zero Unicode emojis')
  })

  it('8. Dynamic ESM exports for AppShell.vue succeed', async () => {
    const mod = await import('../../src/components/layout/AppShell.vue')
    assert.ok(mod.default, 'AppShell default export must exist')
    assert.strictEqual(mod.default.name, 'AppShell')
  })
})
