import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { register } from 'node:module'
import { parse } from 'vue/compiler-sfc'

// Register Vue loader for dynamic ESM import support in Node test runner
register('./vue-loader.js', import.meta.url)

describe('SettingsModal Admin Console Tab Standards & Implementation', () => {
  const filePath = path.resolve('src/components/settings/SettingsModal.vue')

  it('1. SettingsModal.vue exists and compiles as a valid Vue 3 SFC', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    const { descriptor, errors } = parse(content)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  it('2. Admin Tab: Admin key input with type="password" and 验证密钥 CTA', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('type="password"'), 'Admin key input must use type="password"')
    assert.ok(content.includes('验证密钥') || content.includes('验证'), 'Must have 验证密钥 button')
    assert.ok(content.includes('adminKey'), 'Must bind reactive adminKey state')
    assert.ok(content.includes('isAdminVerified'), 'Must manage isAdminVerified boolean flag')
  })

  it('3. Admin key verification and API integration with x-admin-key header', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('x-admin-key'), 'Admin requests must include x-admin-key header')
    assert.ok(content.includes('/api/admin/activation/list') || content.includes('/admin/activation/list'), 'Must query admin activation list')
    assert.ok(content.includes('/api/admin/activation/generate') || content.includes('/admin/activation/generate'), 'Must call admin activation generate endpoint')
    assert.ok(content.includes('/api/admin/activation/revoke') || content.includes('/admin/activation/revoke'), 'Must call admin activation revoke endpoint')
  })

  it('4. Code Generator: supports 4 card types with proper labels', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('MONTH_30'), 'Must support MONTH_30 type')
    assert.ok(content.includes('SEASON_90'), 'Must support SEASON_90 type')
    assert.ok(content.includes('YEAR_365'), 'Must support YEAR_365 type')
    assert.ok(content.includes('FOREVER'), 'Must support FOREVER type')

    assert.ok(content.includes('月卡') || content.includes('30天'), 'Must label MONTH_30')
    assert.ok(content.includes('季卡') || content.includes('90天'), 'Must label SEASON_90')
    assert.ok(content.includes('年卡') || content.includes('365天'), 'Must label YEAR_365')
    assert.ok(content.includes('永久') || content.includes('FOREVER'), 'Must label FOREVER')
  })

  it('5. Code Generator: count input (1-50) and 批量生成激活码 button', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('min="1"'), 'Count input must specify min="1"')
    assert.ok(content.includes('max="50"'), 'Count input must specify max="50"')
    assert.ok(content.includes('批量生成激活码') || content.includes('生成激活码'), 'Must have 批量生成激活码 CTA')
    assert.ok(content.includes('generateCodes') || content.includes('handleGenerate'), 'Must implement code generation handler')
  })

  it('6. Generated Codes Display Box with copy functionality', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('复制') || content.includes('Copy'), 'Must feature copy action button')
    assert.ok(content.includes('navigator.clipboard') || content.includes('copyToClipboard'), 'Must use clipboard API to copy codes')
  })

  it('7. Activation List Table: displays code, type, status, redeemedBy, and revoke action', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('table') || content.includes('list'), 'Must render activation codes in a table or structured list')
    assert.ok(content.includes('作废') || content.includes('revoke'), 'Must feature 作废 / revoke action button')
    assert.ok(content.includes('Trash2'), 'Must use Trash2 icon for revoke action')
  })

  it('8. Strict Design System: Zero Unicode emojis and Apple HIG 44px touch targets', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/settings/SettingsModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')

    assert.ok(content.includes('min-h-[44px]'), 'Buttons and interactive inputs must satisfy min-h-[44px]')
    assert.ok(content.includes('touch-manipulation'), 'Buttons must include touch-manipulation')
    assert.ok(content.includes('active:scale-95'), 'Action buttons must include active:scale-95')
  })
})
