import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

test('Vue 3 project baseline files exist', () => {
  assert.ok(fs.existsSync(path.resolve('src/App.vue')), 'src/App.vue should exist')
  assert.ok(fs.existsSync(path.resolve('src/main.js')), 'src/main.js should exist')
  assert.ok(fs.existsSync(path.resolve('vite.config.js')), 'vite.config.js should exist')
})

test('package.json has vue 3 and pinia', () => {
  const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'))
  assert.ok(pkg.dependencies.vue, 'vue should be in dependencies')
  assert.ok(pkg.dependencies.pinia, 'pinia should be in dependencies')
  assert.ok(pkg.dependencies['lucide-vue-next'], 'lucide-vue-next should be in dependencies')
  assert.ok(pkg.devDependencies['@vitejs/plugin-vue'], '@vitejs/plugin-vue should be in devDependencies')
  assert.strictEqual(pkg.dependencies.react, undefined, 'react should be removed')
})
