import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { register } from 'node:module'
import { parse } from 'vue/compiler-sfc'

// Register Vue loader for dynamic ESM import support in Node test runner
register('./vue-loader.js', import.meta.url)

describe('SettingsModal.vue Component Standards & 4-Tab Layout', () => {
  const filePath = path.resolve('src/components/settings/SettingsModal.vue')

  it('1. SettingsModal.vue exists and compiles as a valid Vue 3 SFC', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    const { descriptor, errors } = parse(content)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  it('2. Exports default component with expected name', async () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const mod = await import('../../src/components/settings/SettingsModal.vue')
    assert.ok(mod.default, 'Default export must exist')
    assert.strictEqual(mod.default.name, 'SettingsModal')
  })

  it('3. Strict Design System: Zero Unicode emojis anywhere and uses lucide-vue-next', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
    const rangeRegex = /[\u{1F300}-\u{1FAFF}]/u
    assert.strictEqual(rangeRegex.test(content), false, 'Must contain zero Unicode emojis in range')

    assert.ok(content.includes('lucide-vue-next'), 'Must import icons from lucide-vue-next')
    assert.ok(!content.includes('lucide-react'), 'Must not import from lucide-react')
    assert.ok(content.includes('X'), 'Must import X icon')
    assert.ok(content.includes('User'), 'Must import User icon')
    assert.ok(content.includes('Keyboard'), 'Must import Keyboard icon')
    assert.ok(content.includes('BookOpen'), 'Must import BookOpen icon')
    assert.ok(content.includes('Shield'), 'Must import Shield icon')
  })

  it('4. Uses Teleport to body and backdrop with dark blur', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('<Teleport to="body">'), 'Must teleport to body')
    assert.ok(content.includes('v-if="isOpen"'), 'Must guard modal rendering with isOpen')
    assert.ok(content.includes('backdrop-blur-sm') || content.includes('backdrop-blur'), 'Backdrop must feature backdrop blur')
    assert.ok(content.includes('bg-stone-900/50') || content.includes('bg-black/50'), 'Backdrop must feature semi-transparent dark background')
  })

  it('5. Declares isOpen prop and close emit', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('defineProps'), 'Must define props')
    assert.ok(content.includes('isOpen'), 'Must declare isOpen prop')
    assert.ok(content.includes('defineEmits'), 'Must define emits')
    assert.ok(content.includes("'close'"), "Must emit 'close'")
  })

  it('6. 4-tab navigation column with active styling and proper labels', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('学籍与激活'), 'Tab 1 must be 学籍与激活')
    assert.ok(content.includes('快捷键指南'), 'Tab 2 must be 快捷键指南')
    assert.ok(content.includes('研学公约'), 'Tab 3 must be 研学公约')
    assert.ok(content.includes('管理员通道'), 'Tab 4 must be 管理员通道')

    assert.ok(content.includes('account'), 'Must declare account tab key')
    assert.ok(content.includes('shortcuts'), 'Must declare shortcuts tab key')
    assert.ok(content.includes('covenant'), 'Must declare covenant tab key')
    assert.ok(content.includes('admin'), 'Must declare admin tab key')

    assert.ok(content.includes('border-l-4') && content.includes('border-l-amber-700'), 'Active tab must feature left amber accent border')
  })

  it('7. Tab 1 (学籍与激活): account info, activation code redemption, and 12-preset avatar grid', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('authStore.currentUser') || content.includes('currentUser'), 'Must read user info from auth store')
    assert.ok(content.includes('HP-M30-XXXXXX'), 'Must have activation code placeholder HP-M30-XXXXXX')
    assert.ok(content.includes('兑换激活码') || content.includes('兑换'), 'Must have 兑换 CTA button')
    assert.ok(content.includes('authStore.redeemActivation') || content.includes('redeemActivation('), 'Must invoke redeemActivation')

    // 12 preset avatar IDs check
    const avatarKeys = ['user', 'glasses', 'book', 'wand', 'hat', 'star', 'owl', 'castle', 'flame', 'crown', 'lightning', 'shield']
    for (const key of avatarKeys) {
      assert.ok(content.includes(`'${key}'`) || content.includes(`"${key}"`), `Avatar preset list must contain '${key}'`)
    }
  })

  it('8. Tab 2 (快捷键指南): renders shortcuts list with kbd tags', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('<kbd'), 'Shortcuts must use <kbd> tags for key labels')
    assert.ok(content.includes('Space'), 'Shortcuts list must include Space key')
  })

  it('9. Tab 3 (研学公约): outlines academic fair use, COPPA privacy, and DMCA channel', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('非商业') || content.includes('学术') || content.includes('研学'), 'Must outline academic / non-commercial fair use')
    assert.ok(content.includes('COPPA') || content.includes('青少年') || content.includes('隐私'), 'Must outline adolescent privacy (COPPA)')
    assert.ok(content.includes('DMCA') || content.includes('侵权') || content.includes('反馈'), 'Must include DMCA / contact channel')
  })

  it('10. Parchment aesthetic, Apple HIG touch targets, and accessibility dialog semantics', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('bg-[#fbf9f5]'), 'Must use warm parchment background bg-[#fbf9f5]')
    assert.ok(content.includes('border-[#e8ddd0]'), 'Must use parchment border border-[#e8ddd0]')
    assert.ok(content.includes('min-h-[44px]'), 'Must enforce min-h-[44px] touch targets')
    assert.ok(content.includes('touch-manipulation'), 'Must include touch-manipulation')
    assert.ok(content.includes('role="dialog"'), 'Must declare role="dialog"')
    assert.ok(content.includes('aria-modal="true"'), 'Must declare aria-modal="true"')
  })

  it('11. Escape key listener to close modal', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('Escape') || content.includes('handleKeyDown') || content.includes('handleKeydown'), 'Must handle Escape key')
    assert.ok(content.includes('addEventListener') && content.includes('removeEventListener'), 'Must add and remove keydown listener')
  })
})
