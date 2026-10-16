import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { setActivePinia, createPinia } from 'pinia'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storeFilePath = path.resolve(__dirname, '../../src/stores/authStore.js')
const storeModuleUrl = pathToFileURL(storeFilePath).href

// Mock localStorage for Node test runner
const mockStorage = new Map()
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) ?? null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
}

// Helper to mock global fetch
const originalFetch = globalThis.fetch
function mockFetch(handler) {
  globalThis.fetch = async (url, options = {}) => {
    return handler(String(url), options)
  }
}

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data)
  }
}

describe('Pinia authStore (src/stores/authStore.js)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    globalThis.localStorage.clear()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('file exists and exports useAuthStore and AUTH_TOKEN_KEY', async () => {
    assert.ok(fs.existsSync(storeFilePath), 'authStore.js must exist')
    const mod = await import(storeModuleUrl)
    assert.equal(typeof mod.useAuthStore, 'function')
    assert.equal(mod.AUTH_TOKEN_KEY, 'hp_auth_token')
  })

  it('initializes default state correctly when no token in localStorage', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    assert.equal(store.currentUser, null)
    assert.equal(store.token, null)
    assert.equal(store.isLoading, false)
    assert.equal(store.isLoggedIn, false)
    assert.equal(store.isPro, false)
    assert.equal(store.proLabel, null)
    assert.equal(store.displayName, null)
    assert.equal(store.avatarId, 'default')
  })

  it('reads pre-existing token from localStorage on initialization', async () => {
    globalThis.localStorage.setItem('hp_auth_token', 'pre_existing_jwt_token')
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    assert.equal(store.token, 'pre_existing_jwt_token')
  })

  it('computes isPro and proLabel correctly for lifetime and expiring memberships', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    // 1. Not logged in
    assert.equal(store.isLoggedIn, false)
    assert.equal(store.isPro, false)
    assert.equal(store.proLabel, null)

    // 2. Logged in, not pro
    store.currentUser = {
      userId: 'usr_01',
      username: 'ron_weasley',
      wizardName: 'Ron',
      avatar: 'default',
      isPro: false,
      proExpiresAt: null
    }
    assert.equal(store.isLoggedIn, true)
    assert.equal(store.isPro, false)
    assert.equal(store.proLabel, '普通学员')

    // 3. Logged in, lifetime Pro (proExpiresAt is null)
    store.currentUser.isPro = true
    store.currentUser.proExpiresAt = null
    assert.equal(store.isPro, true)
    assert.equal(store.proLabel, 'Pro')

    // 4. Logged in, active Pro with future expiry
    store.currentUser.proExpiresAt = Date.now() + 86400000
    assert.equal(store.isPro, true)
    assert.equal(store.proLabel, 'Pro')

    // 5. Logged in, expired Pro
    store.currentUser.proExpiresAt = Date.now() - 1000
    assert.equal(store.isPro, false)
    assert.equal(store.proLabel, '普通学员')
  })

  it('computes displayName falling back from wizardName to username', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    store.currentUser = {
      userId: 'usr_02',
      username: 'hermione_g',
      wizardName: 'Hermione Granger',
      avatar: 'book',
      isPro: true,
      proExpiresAt: null
    }
    assert.equal(store.displayName, 'Hermione Granger')

    // Fallback to username when wizardName is empty
    store.currentUser.wizardName = ''
    assert.equal(store.displayName, 'hermione_g')

    // Fallback when wizardName is null
    store.currentUser.wizardName = null
    assert.equal(store.displayName, 'hermione_g')

    // Null when not logged in
    store.currentUser = null
    assert.equal(store.displayName, null)
  })

  it('computes avatarId falling back to default', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    assert.equal(store.avatarId, 'default')

    store.currentUser = {
      userId: 'usr_03',
      username: 'harry',
      wizardName: 'Harry Potter',
      avatar: 'wand',
      isPro: false,
      proExpiresAt: null
    }
    assert.equal(store.avatarId, 'wand')

    store.currentUser.avatar = ''
    assert.equal(store.avatarId, 'default')
  })

  it('register action calls /api/auth/register and sets token + currentUser + localStorage', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    let capturedUrl = null
    let capturedOptions = null

    mockFetch(async (url, options) => {
      capturedUrl = url
      capturedOptions = options
      return jsonResponse({
        userId: 'usr_reg123',
        username: 'albus_d',
        wizardName: 'Albus Dumbledore',
        token: 'token_reg_secret',
        isPro: false,
        proExpiresAt: null,
        avatar: 'default'
      }, 200)
    })

    const result = await store.register('albus_d', 'sherbetLemon1', 'Albus Dumbledore')

    assert.equal(capturedUrl, '/api/auth/register')
    assert.equal(capturedOptions.method, 'POST')
    assert.deepEqual(JSON.parse(capturedOptions.body), {
      username: 'albus_d',
      password: 'sherbetLemon1',
      wizardName: 'Albus Dumbledore'
    })

    assert.equal(store.token, 'token_reg_secret')
    assert.equal(globalThis.localStorage.getItem('hp_auth_token'), 'token_reg_secret')
    assert.equal(store.currentUser?.userId, 'usr_reg123')
    assert.equal(store.currentUser?.username, 'albus_d')
    assert.equal(store.currentUser?.wizardName, 'Albus Dumbledore')
    assert.equal(store.isLoading, false)
    assert.equal(result.token, 'token_reg_secret')
  })

  it('login action calls /api/auth/login and sets token + currentUser + localStorage', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    let capturedUrl = null
    let capturedOptions = null

    mockFetch(async (url, options) => {
      capturedUrl = url
      capturedOptions = options
      return jsonResponse({
        userId: 'usr_log123',
        username: 'severus_s',
        wizardName: 'Severus Snape',
        token: 'token_log_secret',
        isPro: true,
        proExpiresAt: null,
        avatar: 'shield'
      }, 200)
    })

    const result = await store.login('severus_s', 'potionsMaster1')

    assert.equal(capturedUrl, '/api/auth/login')
    assert.equal(capturedOptions.method, 'POST')
    assert.deepEqual(JSON.parse(capturedOptions.body), {
      username: 'severus_s',
      password: 'potionsMaster1'
    })

    assert.equal(store.token, 'token_log_secret')
    assert.equal(globalThis.localStorage.getItem('hp_auth_token'), 'token_log_secret')
    assert.equal(store.currentUser?.userId, 'usr_log123')
    assert.equal(store.isPro, true)
    assert.equal(store.avatarId, 'shield')
    assert.equal(store.isLoading, false)
    assert.equal(result.token, 'token_log_secret')
  })

  it('login throws error on rejected status with code and message', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    mockFetch(async () => {
      return jsonResponse({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password'
      }, 401)
    })

    await assert.rejects(
      async () => {
        await store.login('bad_user', 'bad_pass')
      },
      (err) => {
        assert.equal(err.code, 'INVALID_CREDENTIALS')
        assert.equal(err.message, 'Invalid username or password')
        return true
      }
    )

    assert.equal(store.token, null)
    assert.equal(store.currentUser, null)
    assert.equal(store.isLoading, false)
  })

  it('logout action resets token, currentUser, and clears localStorage', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    store.token = 'active_token'
    store.currentUser = { userId: 'usr_test', username: 'tester' }
    globalThis.localStorage.setItem('hp_auth_token', 'active_token')

    store.logout()

    assert.equal(store.token, null)
    assert.equal(store.currentUser, null)
    assert.equal(globalThis.localStorage.getItem('hp_auth_token'), null)
    assert.equal(store.isLoggedIn, false)
  })

  it('refreshMe returns null without calling network if token is missing', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    let called = false
    mockFetch(async () => {
      called = true
      return jsonResponse({})
    })

    const result = await store.refreshMe()
    assert.equal(result, null)
    assert.equal(called, false)
  })

  it('refreshMe sends Bearer token and updates currentUser', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    store.token = 'bearer_token_123'
    let authHeader = null

    mockFetch(async (url, options) => {
      authHeader = options.headers?.Authorization
      return jsonResponse({
        userId: 'usr_me123',
        username: 'luna_l',
        wizardName: 'Luna Lovegood',
        avatar: 'star',
        isPro: true,
        proExpiresAt: null
      }, 200)
    })

    await store.refreshMe()

    assert.equal(authHeader, 'Bearer bearer_token_123')
    assert.equal(store.currentUser?.username, 'luna_l')
    assert.equal(store.displayName, 'Luna Lovegood')
    assert.equal(store.avatarId, 'star')
  })

  it('refreshMe triggers logout on 401 / INVALID_TOKEN response', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    store.token = 'expired_or_invalid_token'
    store.currentUser = { userId: 'usr_exp', username: 'expired_user' }
    globalThis.localStorage.setItem('hp_auth_token', 'expired_or_invalid_token')

    mockFetch(async () => {
      return jsonResponse({
        error: 'INVALID_TOKEN',
        message: 'Token has expired'
      }, 401)
    })

    await assert.rejects(
      async () => {
        await store.refreshMe()
      },
      (err) => {
        assert.equal(err.code, 'INVALID_TOKEN')
        return true
      }
    )

    assert.equal(store.token, null)
    assert.equal(store.currentUser, null)
    assert.equal(globalThis.localStorage.getItem('hp_auth_token'), null)
  })

  it('redeemActivation calls /api/activation/redeem and updates isPro & proExpiresAt', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    store.token = 'valid_token'
    store.currentUser = {
      userId: 'usr_redeem',
      username: 'neville_l',
      wizardName: 'Neville',
      avatar: 'default',
      isPro: false,
      proExpiresAt: null
    }

    let capturedUrl = null
    let capturedBody = null
    let capturedAuth = null

    const expiryTime = Date.now() + 30 * 86400000
    mockFetch(async (url, options) => {
      capturedUrl = url
      capturedBody = JSON.parse(options.body)
      capturedAuth = options.headers?.Authorization
      return jsonResponse({
        isPro: true,
        proExpiresAt: expiryTime,
        message: 'Activated successfully'
      }, 200)
    })

    const res = await store.redeemActivation('HP-M30-ABCDEF')

    assert.equal(capturedUrl, '/api/activation/redeem')
    assert.equal(capturedAuth, 'Bearer valid_token')
    assert.equal(capturedBody.code, 'HP-M30-ABCDEF')
    assert.equal(store.currentUser.isPro, true)
    assert.equal(store.currentUser.proExpiresAt, expiryTime)
    assert.equal(store.isPro, true)
    assert.equal(store.proLabel, 'Pro')
    assert.equal(res.message, 'Activated successfully')
  })

  it('setAvatar calls /api/auth/me PATCH and updates currentUser.avatar', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    store.token = 'valid_token'
    store.currentUser = {
      userId: 'usr_avatar',
      username: 'ginny_w',
      wizardName: 'Ginny',
      avatar: 'default',
      isPro: false,
      proExpiresAt: null
    }

    let capturedMethod = null
    let capturedBody = null

    mockFetch(async (url, options) => {
      capturedMethod = options.method
      capturedBody = JSON.parse(options.body)
      return jsonResponse({
        avatar: 'flame',
        message: 'Avatar updated successfully'
      }, 200)
    })

    const res = await store.setAvatar('flame')

    assert.equal(capturedMethod, 'PATCH')
    assert.equal(capturedBody.avatarId, 'flame')
    assert.equal(store.currentUser.avatar, 'flame')
    assert.equal(store.avatarId, 'flame')
    assert.equal(res.avatar, 'flame')
  })

  it('init calls refreshMe and safely handles expired token without unhandled rejection', async () => {
    const { useAuthStore } = await import(storeModuleUrl)
    const store = useAuthStore()

    store.token = 'stale_token'
    globalThis.localStorage.setItem('hp_auth_token', 'stale_token')

    mockFetch(async () => {
      return jsonResponse({
        error: 'TOKEN_EXPIRED',
        message: 'Token has expired'
      }, 401)
    })

    // init() should not throw, it catches and logs out
    await store.init()

    assert.equal(store.token, null)
    assert.equal(store.currentUser, null)
    assert.equal(globalThis.localStorage.getItem('hp_auth_token'), null)
  })

  it('contains zero Unicode emojis in store and test files', () => {
    const storeContent = fs.readFileSync(storeFilePath, 'utf-8')
    const testContent = fs.readFileSync(fileURLToPath(import.meta.url), 'utf-8')

    const storeEmojiMatches = storeContent.match(/\p{Extended_Pictographic}/gu)
    const testEmojiMatches = testContent.match(/\p{Extended_Pictographic}/gu)

    assert.equal(storeEmojiMatches, null, `Found emojis in authStore.js: ${storeEmojiMatches?.join(' ')}`)
    assert.equal(testEmojiMatches, null, `Found emojis in authStore.test.js: ${testEmojiMatches?.join(' ')}`)
  })
})
