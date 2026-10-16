import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { register } from 'node:module'
import { parse } from 'vue/compiler-sfc'

// Register Vue loader for dynamic ESM import support in Node test runner
register('./vue-loader.js', import.meta.url)

describe('AuthModal.vue Component Standards & Implementation', () => {
  const filePath = path.resolve('src/components/auth/AuthModal.vue')

  it('1. AuthModal.vue exists and compiles as a valid Vue 3 SFC', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/auth/AuthModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    const { descriptor, errors } = parse(content)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  it('2. Exports default component with expected name', async () => {
    assert.ok(fs.existsSync(filePath), 'src/components/auth/AuthModal.vue must exist')
    const mod = await import('../../src/components/auth/AuthModal.vue')
    assert.ok(mod.default, 'Default export must exist')
    assert.strictEqual(mod.default.name, 'AuthModal')
  })

  it('3. Strict Design System: Zero Unicode emojis anywhere and uses lucide-vue-next', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/auth/AuthModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
    const rangeRegex = /[\u{1F300}-\u{1FAFF}]/u
    assert.strictEqual(rangeRegex.test(content), false, 'Must contain zero Unicode emojis in range')

    assert.ok(content.includes('lucide-vue-next'), 'Must import icons from lucide-vue-next')
    assert.ok(!content.includes('lucide-react'), 'Must not import from lucide-react')
    assert.ok(content.includes('X'), 'Must import X icon for close button')
  })

  it('4. Uses Teleport to body and backdrop with dark blur', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/auth/AuthModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('<Teleport to="body">'), 'Must teleport to body')
    assert.ok(content.includes('v-if="isOpen"'), 'Must guard modal rendering with isOpen')
    assert.ok(content.includes('backdrop-blur-sm') || content.includes('backdrop-blur'), 'Backdrop must feature backdrop blur')
    assert.ok(content.includes('bg-stone-900/50') || content.includes('bg-black/50'), 'Backdrop must feature semi-transparent dark background')
  })

  it('5. Declares isOpen prop and close, logged-in emits', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/auth/AuthModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('defineProps'), 'Must define props')
    assert.ok(content.includes('isOpen'), 'Must declare isOpen prop')
    assert.ok(content.includes('defineEmits'), 'Must define emits')
    assert.ok(content.includes("'close'"), "Must emit 'close'")
    assert.ok(content.includes("'logged-in'"), "Must emit 'logged-in'")
  })

  it('6. Tab Switcher with 登录 and 注册 tabs and active styling', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/auth/AuthModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('登录'), 'Must have 登录 tab header')
    assert.ok(content.includes('注册'), 'Must have 注册 tab header')
    assert.ok(content.includes('border-amber-700') || content.includes('border-amber-800'), 'Active tab must have amber bottom border')
    assert.ok(content.includes('text-amber-900') || content.includes('text-amber-950'), 'Active tab must have amber text color')
  })

  it('7. Form inputs: username, password, confirm password, and wizard name', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/auth/AuthModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('巫师学号 / 用户名') || content.includes('用户名'), 'Must include username input')
    assert.ok(content.includes('通行密码') || content.includes('密码'), 'Must include password input')
    assert.ok(content.includes('魔法姓名') || content.includes('wizardName') || content.includes('昵称'), 'Must include wizard name input in register tab')
    assert.ok(content.includes('确认密码') || content.includes('confirmPassword'), 'Must include confirm password in register tab')
    assert.ok(content.includes('3-20') || content.includes('3–20'), 'Must display username rule hint')
  })

  it('8. Warm parchment aesthetic and zero-shadow card design', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/auth/AuthModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('bg-[#fbf9f5]'), 'Card must have bg-[#fbf9f5] parchment background')
    assert.ok(content.includes('border-[#e8ddd0]'), 'Card must have border-[#e8ddd0]')
    assert.ok(content.includes('rounded-2xl'), 'Card must have rounded-2xl')
    assert.ok(content.includes('bg-amber-700'), 'CTA buttons must use bg-amber-700')
    assert.ok(content.includes('text-amber-50'), 'CTA buttons must use text-amber-50')
  })

  it('9. Apple HIG ergonomics and accessibility dialog semantics', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/auth/AuthModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('min-h-[44px]'), 'Buttons and inputs must satisfy min-h-[44px]')
    assert.ok(content.includes('min-w-[44px]'), 'Buttons must satisfy min-w-[44px]')
    assert.ok(content.includes('touch-manipulation'), 'Buttons must include touch-manipulation')
    assert.ok(content.includes('active:scale-95'), 'Buttons must include active:scale-95')

    assert.ok(content.includes('role="dialog"'), 'Must declare role="dialog"')
    assert.ok(content.includes('aria-modal="true"'), 'Must declare aria-modal="true"')
    assert.ok(content.includes('aria-label='), 'Must include aria-label for accessibility')
  })

  it('10. Escape key listener and backdrop click to close', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/auth/AuthModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('Escape') || content.includes('handleKeyDown') || content.includes('handleKeydown'), 'Must handle Escape key')
    assert.ok(content.includes('addEventListener') && content.includes('removeEventListener'), 'Must properly add and clean up keydown listener')
  })

  it('11. Integrates with useAuthStore and manages loading & error state', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/auth/AuthModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('useAuthStore'), 'Must import useAuthStore')
    assert.ok(content.includes('authStore.login') || content.includes('login('), 'Must invoke login')
    assert.ok(content.includes('authStore.register') || content.includes('register('), 'Must invoke register')
    assert.ok(content.includes('errorMsg') || content.includes('errorMessage'), 'Must have reactive error message state')
    assert.ok(content.includes('text-rose-700') || content.includes('text-red-600'), 'Must render error in red text')
  })
})
