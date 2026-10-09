import test from 'node:test'
import assert from 'node:assert'
import { r2DevPlugin } from '../../server/viteR2Plugin.js'

test('r2DevPlugin returns a valid Vite plugin object', () => {
  const plugin = r2DevPlugin()
  assert.strictEqual(plugin.name, 'vite-plugin-r2-stream')
  assert.strictEqual(typeof plugin.configureServer, 'function')
})
