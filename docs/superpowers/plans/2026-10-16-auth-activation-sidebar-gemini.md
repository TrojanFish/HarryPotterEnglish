# Auth System, Activation Codes & Gemini Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a zero-dependency user authentication system, multi-tier activation code (卡密) system, and Gemini-style user card sidebar bottom — all within the existing Express + Pinia + Tailwind codebase.

**Architecture:** Server-side `authStore.js` + `activationStore.js` (in-memory, same pattern as syncStore.js) wired into existing `server/index.js` routes. Frontend `authStore.js` (Pinia) manages token/user state. `AuthModal.vue` and `SettingsModal.vue` are new components mounted in `AppShell.vue`. `DesktopSidebarVue.vue` bottom section is replaced with a Gemini-style user card.

**Tech Stack:** Node.js `crypto` module (scryptSync + HMAC-SHA256), Pinia, Vue 3 Composition API, Tailwind CSS, lucide-vue-next, Node native test runner.

**Spec:** `docs/superpowers/specs/2026-10-16-auth-activation-sidebar-gemini-design.md`

## Global Constraints

- Zero Unicode emojis anywhere — lucide-vue-next icons only
- Apple HIG touch targets: `min-h-[44px] min-w-[44px]` + `touch-manipulation` on all interactive elements
- Warm parchment palette: `bg-[#fbf9f5]`, `bg-[#f5efe6]`, `border-[#e8ddd0]`, amber/bronze accents
- Zero new npm dependencies (bcrypt, jsonwebtoken, express-session are FORBIDDEN)
- `JWT_SECRET` and `ADMIN_SECRET_KEY` must come from `.env` — missing → 503
- Server uses in-memory Map stores (same pattern as `server/syncStore.js`)
- 「离线管理」「云端漫游」remain in sidebar as first-class menu items — NEVER moved to settings
- Work directory: `c:\Users\KeiyeeYu\Desktop\HarryPotterEnglish`

## Review Focus

1. **Token forgery**: HMAC comparison must use `crypto.timingSafeEqual` not `===`, to prevent timing attacks
2. **Activation code double-redemption**: `redeem` must atomically check+mark the code as redeemed (no race conditions)
3. **Pro expiry calculation**: `max(now, currentProExpiresAt) + duration` must handle both null (never set) and past (expired) cases
4. **Password entropy**: scrypt params `N=16384, r=8, p=1` (sufficient for dev; document if production needs tuning)
5. **AuthModal XSS**: username/wizardName bound via `v-model` to reactive refs, never rendered as raw HTML

---

### Task 1: P0 孤儿代码清理

**Files:**
- Modify: `src/components/layout/AppShell.vue`
- Modify: `tests/vue3/gamificationNavigation.test.js`

**Interfaces:**
- Produces: Clean AppShell without HouseCupModal references; gamificationNavigation test still passes

- [ ] **Step 1: Read the test file to identify HouseCupModal assertions**

Run: `node --test tests/vue3/gamificationNavigation.test.js`
Locate any `isHouseCupOpen` or `HouseCupModal` assertions.

- [ ] **Step 2: Write a failing test guard (no new test file needed — verify existing test mentions orphan)**

Run: `node --test tests/vue3/gamificationNavigation.test.js`
Record which tests reference `isHouseCupOpen`.

- [ ] **Step 3: Remove HouseCupModal from AppShell.vue**

In `src/components/layout/AppShell.vue`, remove:
- `import HouseCupModal from '../gamification/HouseCupModal.vue'` (or similar path)
- `const isHouseCupOpen = ref(false)`
- Functions `openHouseCup()` / `closeHouseCup()`
- `<HouseCupModal :is-open="isHouseCupOpen" ... />` DOM node
- Any `@open-house-cup="openHouseCup"` listener on DesktopSidebarVue

- [ ] **Step 4: Fix gamificationNavigation.test.js**

Remove or update any assertions that check `source.includes('isHouseCupOpen')` or mount HouseCupModal. Replace with assertion that `source` does NOT include `HouseCupModal` if needed.

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: All existing tests pass (≥501), no failures.

- [ ] **Step 6: Commit**

```
git add src/components/layout/AppShell.vue tests/vue3/gamificationNavigation.test.js
git commit -m "fix(appshell): remove orphaned HouseCupModal mount and isHouseCupOpen ref"
```

---

### Task 2: 服务端认证 Store

**Files:**
- Create: `server/authStore.js`
- Create: `tests/server/authStore.test.js`

**Interfaces:**
- Produces:
  - `registerUser({ username, password, wizardName })` → `{ userId, username, wizardName, token, isPro, proExpiresAt, avatar }`
  - `loginUser({ username, password })` → same shape
  - `generateToken(userId)` → `string` (3-part format)
  - `verifyToken(token)` → `{ userId }` or throws
  - `getUserById(userId)` → user record
  - `updateUserPro(userId, { isPro, proExpiresAt })` → void
  - `updateUserAvatar(userId, avatarId)` → void
  - `ERROR_CODES`: `USER_EXISTS`, `INVALID_CREDENTIALS`, `AUTH_CONFIG_MISSING`

- [ ] **Step 1: Write failing test `tests/server/authStore.test.js`**

```js
import { describe, it, before } from 'node:test'
import assert from 'node:assert'

// Set JWT_SECRET before import
process.env.JWT_SECRET = 'test_secret_for_unit_tests'

const { registerUser, loginUser, verifyToken, getUserById } = await import('./authStore.js')

describe('authStore', () => {
  it('registers a new user and returns token', async () => {
    const result = await registerUser({ username: 'harry01', password: 'Gryffindor!1', wizardName: 'Harry' })
    assert.strictEqual(result.username, 'harry01')
    assert.ok(result.token)
    assert.ok(result.userId.startsWith('usr_'))
  })

  it('rejects duplicate username with USER_EXISTS', async () => {
    await assert.rejects(
      () => registerUser({ username: 'harry01', password: 'other' }),
      (err) => err.code === 'USER_EXISTS'
    )
  })

  it('rejects invalid username format', async () => {
    await assert.rejects(
      () => registerUser({ username: 'h!', password: 'valid' }),
      (err) => err.code === 'INVALID_USERNAME'
    )
  })

  it('logs in with correct credentials', async () => {
    const result = await loginUser({ username: 'harry01', password: 'Gryffindor!1' })
    assert.strictEqual(result.username, 'harry01')
    assert.ok(result.token)
  })

  it('rejects login with wrong password', async () => {
    await assert.rejects(
      () => loginUser({ username: 'harry01', password: 'wrong' }),
      (err) => err.code === 'INVALID_CREDENTIALS'
    )
  })

  it('verifyToken round-trips userId', async () => {
    const { token } = await loginUser({ username: 'harry01', password: 'Gryffindor!1' })
    const { userId } = verifyToken(token)
    const user = getUserById(userId)
    assert.strictEqual(user.username, 'harry01')
  })

  it('rejects tampered token', () => {
    assert.throws(() => verifyToken('bad.token.value'), (err) => err.code === 'INVALID_TOKEN')
  })

  it('throws AUTH_CONFIG_MISSING when JWT_SECRET is absent', async () => {
    const savedSecret = process.env.JWT_SECRET
    delete process.env.JWT_SECRET
    try {
      await assert.rejects(() => loginUser({ username: 'harry01', password: 'Gryffindor!1' }), 
        (err) => err.code === 'AUTH_CONFIG_MISSING')
    } finally {
      process.env.JWT_SECRET = savedSecret
    }
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/server/authStore.test.js`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `server/authStore.js`**

```js
import crypto from 'node:crypto'

const users = new Map()        // userId -> userRecord
const usernameIndex = new Map() // username.toLowerCase() -> userId

function requireSecret() {
  if (!process.env.JWT_SECRET) {
    const err = new Error('JWT_SECRET not configured'); err.code = 'AUTH_CONFIG_MISSING'; throw err
  }
  return process.env.JWT_SECRET
}

export function generateToken(userId) {
  const secret = requireSecret()
  const expiry = Math.floor(Date.now() / 1000) + 30 * 86400
  const payload = `${userId}:${expiry}`
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${Buffer.from(userId).toString('base64url')}:${expiry}:${sig}`
}

export function verifyToken(token) {
  const secret = requireSecret()
  const parts = token.split(':')
  if (parts.length !== 3) { const e = new Error('Bad token'); e.code = 'INVALID_TOKEN'; throw e }
  const [b64uid, expiry, sig] = parts
  const userId = Buffer.from(b64uid, 'base64url').toString()
  const payload = `${userId}:${expiry}`
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  const sigBuf = Buffer.from(sig, 'base64url')
  const expBuf = Buffer.from(expected, 'base64url')
  const len = Math.max(sigBuf.length, expBuf.length)
  const a = Buffer.alloc(len); sigBuf.copy(a)
  const b = Buffer.alloc(len); expBuf.copy(b)
  if (!crypto.timingSafeEqual(a, b)) { const e = new Error('Bad signature'); e.code = 'INVALID_TOKEN'; throw e }
  if (parseInt(expiry) < Math.floor(Date.now() / 1000)) { const e = new Error('Token expired'); e.code = 'TOKEN_EXPIRED'; throw e }
  return { userId }
}

export async function registerUser({ username, password, wizardName = '' }) {
  requireSecret()
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    const e = new Error('Invalid username'); e.code = 'INVALID_USERNAME'; throw e
  }
  const key = username.toLowerCase()
  if (usernameIndex.has(key)) { const e = new Error('User exists'); e.code = 'USER_EXISTS'; throw e }
  const userId = 'usr_' + crypto.randomBytes(4).toString('hex')
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  const user = { userId, username, passwordHash: hash, salt, wizardName, avatar: 'user', isPro: false, proExpiresAt: null, createdAt: Date.now() }
  users.set(userId, user)
  usernameIndex.set(key, userId)
  const token = generateToken(userId)
  return { userId, username, wizardName, token, isPro: false, proExpiresAt: null, avatar: 'user' }
}

export async function loginUser({ username, password }) {
  requireSecret()
  const userId = usernameIndex.get(username.toLowerCase())
  if (!userId) { const e = new Error('Not found'); e.code = 'INVALID_CREDENTIALS'; throw e }
  const user = users.get(userId)
  const hash = crypto.scryptSync(password, user.salt, 64).toString('hex')
  if (hash !== user.passwordHash) { const e = new Error('Wrong password'); e.code = 'INVALID_CREDENTIALS'; throw e }
  const token = generateToken(userId)
  return { userId, username: user.username, wizardName: user.wizardName, token, isPro: user.isPro, proExpiresAt: user.proExpiresAt, avatar: user.avatar }
}

export function getUserById(userId) {
  return users.get(userId) || null
}

export function updateUserPro(userId, { isPro, proExpiresAt }) {
  const user = users.get(userId)
  if (user) { user.isPro = isPro; user.proExpiresAt = proExpiresAt }
}

export function updateUserAvatar(userId, avatarId) {
  const user = users.get(userId)
  if (user) user.avatar = avatarId
}
```

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test tests/server/authStore.test.js`
Expected: All tests PASS

- [ ] **Step 5: Run full suite**

Run: `npm test`
Expected: All tests PASS (≥501)

- [ ] **Step 6: Commit**

```
git add server/authStore.js tests/server/authStore.test.js
git commit -m "feat(server): add authStore with scrypt password hashing and HMAC-SHA256 tokens"
```

---

### Task 3: 服务端激活码 Store

**Files:**
- Create: `server/activationStore.js`
- Create: `tests/server/activationStore.test.js`

**Interfaces:**
- Consumes: `updateUserPro(userId, {...})` from `server/authStore.js`
- Produces:
  - `generateActivationCodes(type, count)` → `string[]`
  - `redeemCode(code, userId, currentUser)` → `{ isPro, proExpiresAt }`
  - `listCodes()` → `Array<{code, type, durationDays, createdAt, redeemedAt, redeemedBy}>`
  - `revokeCode(code)` → void
  - `TYPE_MAP`: `{ MONTH_30: { prefix: 'HP-M30-', days: 30 }, SEASON_90: { prefix: 'HP-Q90-', days: 90 }, YEAR_365: { prefix: 'HP-Y365-', days: 365 }, FOREVER: { prefix: 'HP-PRO-', days: null } }`

- [ ] **Step 1: Write failing test `tests/server/activationStore.test.js`**

```js
import { describe, it, before } from 'node:test'
import assert from 'node:assert'

const { generateActivationCodes, redeemCode, listCodes, revokeCode, TYPE_MAP } = await import('./activationStore.js')

describe('activationStore', () => {
  it('generates MONTH_30 code with HP-M30- prefix', () => {
    const codes = generateActivationCodes('MONTH_30', 1)
    assert.ok(codes[0].startsWith('HP-M30-'))
    assert.strictEqual(codes.length, 1)
  })

  it('generates FOREVER code with HP-PRO- prefix', () => {
    const codes = generateActivationCodes('FOREVER', 2)
    assert.ok(codes[0].startsWith('HP-PRO-'))
    assert.strictEqual(codes.length, 2)
  })

  it('rejects count > 50', () => {
    assert.throws(() => generateActivationCodes('MONTH_30', 51), (e) => e.code === 'INVALID_COUNT')
  })

  it('redeem MONTH_30 sets proExpiresAt ~30 days from now', async () => {
    const [code] = generateActivationCodes('MONTH_30', 1)
    const result = await redeemCode(code, 'usr_test01', { isPro: false, proExpiresAt: null })
    assert.ok(result.isPro)
    const expectedMs = Date.now() + 30 * 86400 * 1000
    assert.ok(Math.abs(result.proExpiresAt - expectedMs) < 5000)
  })

  it('stacks Pro duration on existing active subscription', async () => {
    const future = Date.now() + 15 * 86400 * 1000 // 15 days left
    const [code] = generateActivationCodes('MONTH_30', 1)
    const result = await redeemCode(code, 'usr_test02', { isPro: true, proExpiresAt: future })
    const expectedMs = future + 30 * 86400 * 1000
    assert.ok(Math.abs(result.proExpiresAt - expectedMs) < 5000)
  })

  it('FOREVER sets isPro true, proExpiresAt null', async () => {
    const [code] = generateActivationCodes('FOREVER', 1)
    const result = await redeemCode(code, 'usr_test03', { isPro: false, proExpiresAt: null })
    assert.ok(result.isPro)
    assert.strictEqual(result.proExpiresAt, null)
  })

  it('rejects already-redeemed code', async () => {
    const [code] = generateActivationCodes('MONTH_30', 1)
    await redeemCode(code, 'usr_test04', { isPro: false, proExpiresAt: null })
    await assert.rejects(() => redeemCode(code, 'usr_test05', {}), (e) => e.code === 'CODE_ALREADY_USED')
  })

  it('rejects invalid code', async () => {
    await assert.rejects(() => redeemCode('HP-BAD-000000', 'usr_test06', {}), (e) => e.code === 'CODE_NOT_FOUND')
  })

  it('listCodes returns all generated codes', () => {
    const before = listCodes().length
    generateActivationCodes('MONTH_30', 3)
    assert.strictEqual(listCodes().length, before + 3)
  })

  it('revokeCode marks code as revoked and cannot redeem', async () => {
    const [code] = generateActivationCodes('YEAR_365', 1)
    revokeCode(code)
    await assert.rejects(() => redeemCode(code, 'usr_test07', {}), (e) => e.code === 'CODE_REVOKED')
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/server/activationStore.test.js`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `server/activationStore.js`**

```js
import crypto from 'node:crypto'

export const TYPE_MAP = {
  MONTH_30:  { prefix: 'HP-M30-',  days: 30 },
  SEASON_90: { prefix: 'HP-Q90-',  days: 90 },
  YEAR_365:  { prefix: 'HP-Y365-', days: 365 },
  FOREVER:   { prefix: 'HP-PRO-',  days: null }
}

const activations = new Map() // code -> record

function randomSuffix(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(crypto.randomBytes(len)).map(b => chars[b % chars.length]).join('')
}

export function generateActivationCodes(type, count) {
  if (!TYPE_MAP[type]) { const e = new Error('Invalid type'); e.code = 'INVALID_TYPE'; throw e }
  if (count < 1 || count > 50) { const e = new Error('Count must be 1-50'); e.code = 'INVALID_COUNT'; throw e }
  const { prefix, days } = TYPE_MAP[type]
  const codes = []
  for (let i = 0; i < count; i++) {
    const code = prefix + randomSuffix(6)
    activations.set(code, { code, type, durationDays: days, createdAt: Date.now(), redeemedAt: null, redeemedBy: null, revoked: false })
    codes.push(code)
  }
  return codes
}

export async function redeemCode(code, userId, currentUser) {
  const record = activations.get(code)
  if (!record) { const e = new Error('Code not found'); e.code = 'CODE_NOT_FOUND'; throw e }
  if (record.revoked) { const e = new Error('Code revoked'); e.code = 'CODE_REVOKED'; throw e }
  if (record.redeemedAt) { const e = new Error('Already used'); e.code = 'CODE_ALREADY_USED'; throw e }
  record.redeemedAt = Date.now()
  record.redeemedBy = userId
  
  // Calculate new Pro expiry (stack on top of existing)
  let newProExpiresAt = null
  let newIsPro = true
  if (record.durationDays === null) {
    // FOREVER
    newProExpiresAt = null
  } else {
    const base = (currentUser.isPro && currentUser.proExpiresAt && currentUser.proExpiresAt > Date.now())
      ? currentUser.proExpiresAt
      : Date.now()
    newProExpiresAt = base + record.durationDays * 86400 * 1000
  }
  
  return { isPro: newIsPro, proExpiresAt: newProExpiresAt }
}

export function listCodes() {
  return Array.from(activations.values())
}

export function revokeCode(code) {
  const record = activations.get(code)
  if (record) record.revoked = true
}
```

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test tests/server/activationStore.test.js`
Expected: All tests PASS

- [ ] **Step 5: Run full suite**

Run: `npm test`
Expected: All tests PASS (≥501)

- [ ] **Step 6: Commit**

```
git add server/activationStore.js tests/server/activationStore.test.js
git commit -m "feat(server): add activationStore with Pro duration stacking and revoke support"
```

---

### Task 4: 服务端路由扩展

**Files:**
- Modify: `server/index.js`

**Interfaces:**
- Consumes: `registerUser`, `loginUser`, `verifyToken`, `getUserById`, `updateUserPro`, `updateUserAvatar` from `server/authStore.js`
- Consumes: `generateActivationCodes`, `redeemCode`, `listCodes`, `revokeCode` from `server/activationStore.js`
- Produces: REST routes (see spec § 3.3 and § 4.4)

Note: Tests for this task are integration-style; the implementer should verify each route manually using `curl` or write a test file `tests/server/routes.test.js`.

- [ ] **Step 1: Add imports and rate limiters to server/index.js**

After existing `import { processSync, processPairing } from './syncStore.js'`, add:

```js
import { registerUser, loginUser, verifyToken, getUserById, updateUserPro, updateUserAvatar } from './authStore.js'
import { generateActivationCodes, redeemCode, listCodes, revokeCode } from './activationStore.js'
```

Create rate limiters:
- `authRegisterLimiter`: 5 requests per 15 minutes per IP
- `authLoginLimiter`: 10 requests per 15 minutes per IP

Use the existing `createRateLimiter` function already in `server/index.js`.

- [ ] **Step 2: Add auth middleware helper**

```js
function requireAuth(req, res, next) {
  if (!process.env.JWT_SECRET) return res.status(503).json({ error: 'AUTH_CONFIG_MISSING' })
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'MISSING_TOKEN' })
  try {
    req.auth = verifyToken(token)
    next()
  } catch (e) {
    res.status(401).json({ error: e.code || 'INVALID_TOKEN' })
  }
}

function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_SECRET_KEY) return res.status(503).json({ error: 'ADMIN_CONFIG_MISSING' })
  if (req.headers['x-admin-key'] !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ error: 'INVALID_ADMIN_KEY' })
  }
  next()
}
```

- [ ] **Step 3: Add auth routes**

```js
app.post('/api/auth/register', authRegisterLimiter, async (req, res) => {
  try {
    const { username, password, wizardName } = req.body || {}
    const result = await registerUser({ username, password, wizardName })
    res.json(result)
  } catch (e) {
    const status = e.code === 'AUTH_CONFIG_MISSING' ? 503 : e.code === 'USER_EXISTS' ? 409 : 400
    res.status(status).json({ error: e.code || 'REGISTER_FAILED', message: e.message })
  }
})

app.post('/api/auth/login', authLoginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body || {}
    const result = await loginUser({ username, password })
    res.json(result)
  } catch (e) {
    const status = e.code === 'AUTH_CONFIG_MISSING' ? 503 : e.code === 'INVALID_CREDENTIALS' ? 401 : 400
    res.status(status).json({ error: e.code || 'LOGIN_FAILED', message: e.message })
  }
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = getUserById(req.auth.userId)
  if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' })
  const { userId, username, wizardName, avatar, isPro, proExpiresAt } = user
  res.json({ userId, username, wizardName, avatar, isPro, proExpiresAt })
})

app.patch('/api/auth/me', requireAuth, (req, res) => {
  const { avatarId } = req.body || {}
  if (avatarId) updateUserAvatar(req.auth.userId, avatarId)
  const user = getUserById(req.auth.userId)
  const { userId, username, wizardName, avatar, isPro, proExpiresAt } = user
  res.json({ userId, username, wizardName, avatar, isPro, proExpiresAt })
})
```

- [ ] **Step 4: Add activation routes**

```js
app.post('/api/activation/redeem', requireAuth, async (req, res) => {
  try {
    const { code } = req.body || {}
    const user = getUserById(req.auth.userId)
    const result = await redeemCode(code, req.auth.userId, user)
    updateUserPro(req.auth.userId, result)
    res.json({ ...result, message: 'Pro activated' })
  } catch (e) {
    const status = { CODE_NOT_FOUND: 404, CODE_ALREADY_USED: 409, CODE_REVOKED: 410 }[e.code] || 400
    res.status(status).json({ error: e.code, message: e.message })
  }
})

app.post('/api/admin/activation/generate', requireAdmin, (req, res) => {
  try {
    const { type, count = 1 } = req.body || {}
    const codes = generateActivationCodes(type, Number(count))
    res.json({ codes })
  } catch (e) {
    res.status(400).json({ error: e.code, message: e.message })
  }
})

app.get('/api/admin/activation/list', requireAdmin, (req, res) => {
  res.json({ codes: listCodes() })
})

app.post('/api/admin/activation/revoke', requireAdmin, (req, res) => {
  const { code } = req.body || {}
  revokeCode(code)
  res.json({ success: true })
})
```

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: All tests PASS (≥501)

- [ ] **Step 6: Commit**

```
git add server/index.js
git commit -m "feat(server): add auth, activation, and admin API routes"
```

---

### Task 5: 前端 Pinia authStore

**Files:**
- Create: `src/stores/authStore.js`
- Create: `tests/vue3/authStore.test.js`

**Interfaces:**
- Produces:
  - `useAuthStore()` Pinia store with:
    - State: `currentUser`, `token`, `isLoading`
    - Getters: `isLoggedIn`, `isPro`, `proLabel`, `displayName`, `avatarId`
    - Actions: `register()`, `login()`, `logout()`, `refreshMe()`, `redeemActivation()`, `setAvatar()`, `init()`
  - localStorage key: `'hp_auth_token'`
  - API base: `'/api'`

- [ ] **Step 1: Write failing test `tests/vue3/authStore.test.js`**

```js
import { describe, it, before, afterEach } from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'node:fs'

describe('authStore source structure', () => {
  const source = readFileSync('src/stores/authStore.js', 'utf8')

  it('src/stores/authStore.js exists and exports useAuthStore', () => {
    assert.ok(source.includes('useAuthStore'))
    assert.ok(source.includes('defineStore'))
  })

  it('defines state: currentUser, token, isLoading', () => {
    assert.ok(source.includes('currentUser'))
    assert.ok(source.includes('token'))
    assert.ok(source.includes('isLoading'))
  })

  it('defines computed isPro with proExpiresAt check', () => {
    assert.ok(source.includes('isPro'))
    assert.ok(source.includes('proExpiresAt'))
    assert.ok(source.includes('Date.now()'))
  })

  it('defines login, register, logout, refreshMe, redeemActivation, setAvatar, init actions', () => {
    assert.ok(source.includes('function login'))
    assert.ok(source.includes('function register'))
    assert.ok(source.includes('function logout'))
    assert.ok(source.includes('function refreshMe'))
    assert.ok(source.includes('function redeemActivation'))
    assert.ok(source.includes('function setAvatar'))
    assert.ok(source.includes('function init'))
  })

  it('uses localStorage with key hp_auth_token', () => {
    assert.ok(source.includes('hp_auth_token'))
  })

  it('proLabel returns Pro/普通学员/null correctly (from computed logic)', () => {
    assert.ok(source.includes('proLabel'))
    assert.ok(source.includes('普通学员'))
  })

  it('displayName uses wizardName or username', () => {
    assert.ok(source.includes('displayName'))
    assert.ok(source.includes('wizardName'))
  })

  it('avatarId falls back to default', () => {
    assert.ok(source.includes('avatarId'))
    assert.ok(source.includes("'default'"))
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/vue3/authStore.test.js`
Expected: FAIL (file not found)

- [ ] **Step 3: Implement `src/stores/authStore.js`**

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const TOKEN_KEY = 'hp_auth_token'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  const token = ref(localStorage.getItem(TOKEN_KEY) || null)
  const isLoading = ref(false)

  const isLoggedIn = computed(() => !!currentUser.value)
  
  const isPro = computed(() => {
    if (!currentUser.value?.isPro) return false
    const exp = currentUser.value.proExpiresAt
    if (exp === null) return true // FOREVER
    return Date.now() < exp
  })
  
  const proLabel = computed(() => {
    if (!isLoggedIn.value) return null
    return isPro.value ? 'Pro' : '普通学员'
  })
  
  const displayName = computed(() => {
    if (!currentUser.value) return null
    return currentUser.value.wizardName || currentUser.value.username
  })
  
  const avatarId = computed(() => currentUser.value?.avatar || 'default')

  async function _request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' }
    if (token.value) headers['Authorization'] = `Bearer ${token.value}`
    const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
    const data = await res.json()
    if (!res.ok) { const e = new Error(data.message || 'Request failed'); e.code = data.error; throw e }
    return data
  }

  async function register(username, password, wizardName) {
    isLoading.value = true
    try {
      const data = await _request('POST', '/auth/register', { username, password, wizardName })
      token.value = data.token
      localStorage.setItem(TOKEN_KEY, data.token)
      currentUser.value = { userId: data.userId, username: data.username, wizardName: data.wizardName, avatar: data.avatar, isPro: data.isPro, proExpiresAt: data.proExpiresAt }
    } finally { isLoading.value = false }
  }

  async function login(username, password) {
    isLoading.value = true
    try {
      const data = await _request('POST', '/auth/login', { username, password })
      token.value = data.token
      localStorage.setItem(TOKEN_KEY, data.token)
      currentUser.value = { userId: data.userId, username: data.username, wizardName: data.wizardName, avatar: data.avatar, isPro: data.isPro, proExpiresAt: data.proExpiresAt }
    } finally { isLoading.value = false }
  }

  function logout() {
    token.value = null
    currentUser.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  async function refreshMe() {
    if (!token.value) return
    try {
      const data = await _request('GET', '/auth/me')
      currentUser.value = { userId: data.userId, username: data.username, wizardName: data.wizardName, avatar: data.avatar, isPro: data.isPro, proExpiresAt: data.proExpiresAt }
    } catch (e) {
      if (e.code === 'INVALID_TOKEN' || e.code === 'TOKEN_EXPIRED') logout()
    }
  }

  async function redeemActivation(code) {
    const data = await _request('POST', '/activation/redeem', { code })
    if (currentUser.value) {
      currentUser.value.isPro = data.isPro
      currentUser.value.proExpiresAt = data.proExpiresAt
    }
    return data
  }

  async function setAvatar(avatarId) {
    const data = await _request('PATCH', '/auth/me', { avatarId })
    if (currentUser.value) currentUser.value.avatar = data.avatar
  }

  async function init() {
    await refreshMe()
  }

  return { currentUser, token, isLoading, isLoggedIn, isPro, proLabel, displayName, avatarId, register, login, logout, refreshMe, redeemActivation, setAvatar, init }
})
```

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test tests/vue3/authStore.test.js`
Expected: All tests PASS

- [ ] **Step 5: Run full suite**

Run: `npm test`
Expected: All tests PASS (≥501)

- [ ] **Step 6: Commit**

```
git add src/stores/authStore.js tests/vue3/authStore.test.js
git commit -m "feat(store): add Pinia authStore with login/register/pro/avatar management"
```

---

### Task 6: 侧边栏底部 Gemini 用户卡

**Files:**
- Modify: `src/components/navigation/DesktopSidebarVue.vue`
- Modify: `tests/vue3/desktopSidebar.test.js` (extend existing)

**Interfaces:**
- Consumes: `useAuthStore()` from `src/stores/authStore.js`
- Produces: `emit('open-auth')`, `emit('open-settings')` (new emits)

- [ ] **Step 1: Check what desktopSidebar.test.js already asserts**

Read `tests/vue3/desktopSidebar.test.js` to understand existing assertions.

- [ ] **Step 2: Add failing tests for Gemini user card**

In `tests/vue3/desktopSidebar.test.js`, add a test suite:

```js
describe('Gemini user card bottom section', () => {
  const source = readFileSync('src/components/navigation/DesktopSidebarVue.vue', 'utf8')

  it('emits open-auth and open-settings in defineEmits', () => {
    assert.ok(source.includes("'open-auth'"))
    assert.ok(source.includes("'open-settings'"))
  })

  it('renders Settings icon for settings button', () => {
    assert.ok(source.includes('Settings'))
    assert.ok(source.includes('open-settings'))
  })

  it('renders User icon for avatar placeholder', () => {
    assert.ok(source.includes('UserCircle') || source.includes('User'))
  })

  it('displays proLabel computed text', () => {
    assert.ok(source.includes('proLabel'))
  })

  it('displays displayName for logged-in user', () => {
    assert.ok(source.includes('displayName'))
  })

  it('shows 登入学籍 button when not logged in', () => {
    assert.ok(source.includes('登入学籍'))
  })

  it('uses useAuthStore', () => {
    assert.ok(source.includes('useAuthStore'))
  })
})
```

- [ ] **Step 3: Run new tests to verify RED**

Run: `node --test tests/vue3/desktopSidebar.test.js`
Expected: New tests FAIL

- [ ] **Step 4: Rewrite the bottom section of DesktopSidebarVue.vue**

Replace the entire `<!-- Collapsed Bottom -->` div and `<!-- Expanded Bottom -->` div with a new structure that includes the Gemini user card. Specifically:

**Imports to add:**
```js
import { Settings, UserCircle } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore.js'
```

**Script setup additions:**
```js
const authStore = useAuthStore()
```

**New emits to add:**
```js
'open-auth',
'open-settings'
```

**Expanded bottom user card structure (replace existing expanded bottom div content's bottom area):**
```html
<!-- Gemini-style User Card -->
<div class="mt-2 pt-2 border-t border-[#e8ddd0]">
  <div class="flex items-center gap-2.5 px-1 py-1 rounded-xl hover:bg-white/60 transition-colors"
       :class="authStore.isLoggedIn ? 'cursor-default' : ''">
    <!-- Avatar -->
    <button
      type="button"
      @click="authStore.isLoggedIn ? null : emit('open-auth')"
      class="w-9 h-9 rounded-full bg-amber-100 border border-amber-300/60 flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px] touch-manipulation active:scale-95 transition-transform"
      :title="authStore.isLoggedIn ? authStore.displayName : '登录账户'"
    >
      <UserCircle :size="20" class="text-amber-800" />
    </button>
    <!-- Name + Badge -->
    <div v-if="authStore.isLoggedIn" class="flex-1 min-w-0">
      <div class="text-sm font-bold text-stone-800 truncate">{{ authStore.displayName }}</div>
      <span v-if="authStore.isPro"
        class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold">
        <Sparkles :size="10" />Pro
      </span>
      <span v-else class="text-[10px] text-stone-500 font-medium">{{ authStore.proLabel }}</span>
    </div>
    <button v-else
      type="button"
      @click="emit('open-auth')"
      class="flex-1 text-left text-xs font-bold text-amber-800 px-1 hover:text-amber-900 touch-manipulation min-h-[44px] flex items-center"
    >登入学籍</button>
    <!-- Settings gear -->
    <button
      type="button"
      @click="emit('open-settings')"
      class="w-10 h-10 rounded-xl hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer touch-manipulation active:scale-95 shrink-0"
      title="设置中心"
      aria-label="打开设置中心"
    >
      <Settings :size="18" />
    </button>
  </div>
</div>
```

**Collapsed bottom user card (add after existing collapsed shortcuts button):**
```html
<!-- Collapsed: Avatar + Settings -->
<button type="button" @click="authStore.isLoggedIn ? null : emit('open-auth')"
  class="w-9 h-9 rounded-full bg-amber-100 border border-amber-300/60 flex items-center justify-center min-w-[44px] min-h-[44px] touch-manipulation active:scale-95 transition-transform"
  :title="authStore.isLoggedIn ? authStore.displayName : '登录账户'">
  <UserCircle :size="18" class="text-amber-800" />
</button>
<button type="button" @click="emit('open-settings')"
  class="w-8 h-8 rounded-lg hover:bg-stone-200/60 text-stone-500 flex items-center justify-center transition-colors cursor-pointer touch-manipulation active:scale-95 min-h-[44px] min-w-[44px]"
  title="设置中心">
  <Settings :size="14" />
</button>
```

- [ ] **Step 5: Run new tests to verify GREEN**

Run: `node --test tests/vue3/desktopSidebar.test.js`
Expected: All tests PASS

- [ ] **Step 6: Run full suite**

Run: `npm test`
Expected: All tests PASS (≥501)

- [ ] **Step 7: Commit**

```
git add src/components/navigation/DesktopSidebarVue.vue tests/vue3/desktopSidebar.test.js
git commit -m "feat(sidebar): add Gemini-style user card with avatar, Pro badge, and settings gear"
```

---

### Task 7: AuthModal 组件

**Files:**
- Create: `src/components/auth/AuthModal.vue`
- Create: `tests/vue3/authModal.test.js`

**Interfaces:**
- Consumes: `useAuthStore()` from `src/stores/authStore.js`
- Produces:
  - `props: { isOpen: Boolean }`
  - `emits: ['close', 'logged-in']`

- [ ] **Step 1: Write failing test `tests/vue3/authModal.test.js`**

```js
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'node:fs'

describe('AuthModal Component', () => {
  const source = readFileSync('src/components/auth/AuthModal.vue', 'utf8')

  it('AuthModal.vue exists and is a valid Vue SFC', () => {
    assert.ok(source.includes('<template>'))
    assert.ok(source.includes('<script setup>'))
  })

  it('uses Teleport to body', () => {
    assert.ok(source.includes('Teleport'))
    assert.ok(source.includes("to=\"body\"") || source.includes("to='body'"))
  })

  it('has props isOpen and emits close and logged-in', () => {
    assert.ok(source.includes('isOpen'))
    assert.ok(source.includes("'close'") || source.includes('"close"'))
    assert.ok(source.includes("'logged-in'") || source.includes('"logged-in"'))
  })

  it('has login and register tabs', () => {
    assert.ok(source.includes('登录'))
    assert.ok(source.includes('注册'))
  })

  it('has username and password inputs', () => {
    assert.ok(source.includes('username') || source.includes('用户名'))
    assert.ok(source.includes('password') || source.includes('密码'))
  })

  it('has wizardName (巫师昵称) field in register form', () => {
    assert.ok(source.includes('wizardName') || source.includes('巫师昵称'))
  })

  it('uses useAuthStore', () => {
    assert.ok(source.includes('useAuthStore'))
  })

  it('shows error messages (text-rose-700)', () => {
    assert.ok(source.includes('rose'))
  })

  it('zero emojis', () => {
    const emojiRegex = /[\u{1F300}-\u{1FFFF}]/u
    assert.ok(!emojiRegex.test(source))
  })

  it('has CTA button with amber-700 styling', () => {
    assert.ok(source.includes('amber-700'))
    assert.ok(source.includes('min-h-[44px]') || source.includes('min-h-\\[44px\\]'))
  })

  it('handles Escape key to close', () => {
    assert.ok(source.includes('Escape') || source.includes('escape'))
  })

  it('has parchment bg-[#fbf9f5] modal background', () => {
    assert.ok(source.includes('#fbf9f5'))
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/vue3/authModal.test.js`
Expected: FAIL (file not found)

- [ ] **Step 3: Create `src/components/auth/AuthModal.vue`**

Full parchment-styled login/register modal with:
- `<Teleport to="body">` wrapper
- Backdrop `bg-stone-900/50 backdrop-blur-sm fixed inset-0 z-50`
- Modal: `bg-[#fbf9f5] border border-[#e8ddd0] rounded-2xl max-w-sm w-full mx-4 p-6`
- Two tabs: 登录 / 注册 with `border-b-2 border-amber-700 text-amber-900 font-bold` active style
- Login form: username + password + CTA button
- Register form: username + password + confirmPassword + wizardName (optional)
- Error state: `errorMsg` ref shown as `<p class="text-rose-700 text-xs mt-1">{{ errorMsg }}</p>`
- Escape key: `@keydown.esc="$emit('close')"` on outer div, `tabindex="-1"`
- Backdrop click closes
- Calls `authStore.login()` / `authStore.register()`, emits `'logged-in'` on success

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test tests/vue3/authModal.test.js`
Expected: All tests PASS

- [ ] **Step 5: Run emoji audit**

Run: `npm run check-emojis`
Expected: 0 violations

- [ ] **Step 6: Run full suite**

Run: `npm test`
Expected: All tests PASS (≥501)

- [ ] **Step 7: Commit**

```
git add src/components/auth/AuthModal.vue tests/vue3/authModal.test.js
git commit -m "feat(auth): add AuthModal with tabbed login/register and parchment styling"
```

---

### Task 8: SettingsModal + Admin 控制台

**Files:**
- Create: `src/components/settings/SettingsModal.vue`
- Create: `tests/vue3/settingsModal.test.js`
- Create: `tests/vue3/adminConsole.test.js`

**Interfaces:**
- Consumes: `useAuthStore()` from `src/stores/authStore.js`
- Produces:
  - `props: { isOpen: Boolean }`
  - `emits: ['close']`

- [ ] **Step 1: Write failing tests**

`tests/vue3/settingsModal.test.js`:
```js
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'node:fs'

describe('SettingsModal Component', () => {
  const source = readFileSync('src/components/settings/SettingsModal.vue', 'utf8')

  it('exists as valid Vue SFC', () => {
    assert.ok(source.includes('<template>') && source.includes('<script setup>'))
  })

  it('uses Teleport to body', () => {
    assert.ok(source.includes('Teleport') && (source.includes("to=\"body\"") || source.includes("to='body'")))
  })

  it('has 4 tabs: 学籍与激活, 快捷键指南, 研学公约, 管理员通道', () => {
    assert.ok(source.includes('学籍与激活'))
    assert.ok(source.includes('快捷键指南'))
    assert.ok(source.includes('研学公约'))
    assert.ok(source.includes('管理员通道'))
  })

  it('has activation code input in 学籍与激活 tab', () => {
    assert.ok(source.includes('HP-M30') || source.includes('兑换') || source.includes('redeemActivation'))
  })

  it('uses useAuthStore', () => {
    assert.ok(source.includes('useAuthStore'))
  })

  it('has parchment bg-[#fbf9f5]', () => {
    assert.ok(source.includes('#fbf9f5'))
  })

  it('zero emojis', () => {
    const emojiRegex = /[\u{1F300}-\u{1FFFF}]/u
    assert.ok(!emojiRegex.test(source))
  })
})
```

`tests/vue3/adminConsole.test.js`:
```js
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'node:fs'

describe('Admin Console in SettingsModal', () => {
  const source = readFileSync('src/components/settings/SettingsModal.vue', 'utf8')

  it('has admin key input field', () => {
    assert.ok(source.includes('x-admin-key') || source.includes('adminKey') || source.includes('ADMIN_KEY'))
  })

  it('has type dropdown for generating codes (MONTH_30, SEASON_90, YEAR_365, FOREVER)', () => {
    assert.ok(source.includes('MONTH_30'))
    assert.ok(source.includes('SEASON_90'))
    assert.ok(source.includes('YEAR_365'))
    assert.ok(source.includes('FOREVER'))
  })

  it('has generate button and count input', () => {
    assert.ok(source.includes('生成') || source.includes('generate'))
    assert.ok(source.includes('count') || source.includes('数量'))
  })

  it('has revoke functionality', () => {
    assert.ok(source.includes('revoke') || source.includes('作废'))
  })

  it('shows activation list after admin verification', () => {
    assert.ok(source.includes('list') || source.includes('激活码列表'))
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test tests/vue3/settingsModal.test.js tests/vue3/adminConsole.test.js`
Expected: FAIL (files not found)

- [ ] **Step 3: Create `src/components/settings/SettingsModal.vue`**

Full implementation with:
- `<Teleport to="body">` + backdrop
- Modal: `bg-[#fbf9f5] border border-[#e8ddd0] rounded-2xl max-w-lg w-full mx-4`
- Left vertical tab list: 4 tabs with active `border-l-2 border-amber-700 bg-amber-50 text-amber-900 font-bold`
- **学籍与激活 tab**: 
  - If logged in: show username, wizardName, isPro status, proExpiresAt
  - Activation code input (`placeholder="HP-M30-XXXXXX"`) + 兑换 button
  - 12-avatar grid (Lucide icons + amber border on selected)
- **快捷键指南 tab**: Keyboard shortcuts table (Ctrl+B, ?, Space, arrows, etc.)
- **研学公约 tab**: Legal/study covenant text (non-commercial educational use disclaimer)
- **管理员通道 tab**:
  - `adminKey` ref + password input + 验证 button
  - `adminVerified` ref; after verification shows:
    - Type select (MONTH_30 / SEASON_90 / YEAR_365 / FOREVER) + count input (1-50) + 生成 button
    - Generated codes block with copy button
    - Activation list table (code, type, redeemed, redeemBy)
    - 作废 button per row

- [ ] **Step 4: Run tests to verify GREEN**

Run: `node --test tests/vue3/settingsModal.test.js tests/vue3/adminConsole.test.js`
Expected: All tests PASS

- [ ] **Step 5: Run emoji audit**

Run: `npm run check-emojis`
Expected: 0 violations

- [ ] **Step 6: Run full suite**

Run: `npm test`
Expected: All tests PASS (≥501)

- [ ] **Step 7: Commit**

```
git add src/components/settings/SettingsModal.vue tests/vue3/settingsModal.test.js tests/vue3/adminConsole.test.js
git commit -m "feat(settings): add SettingsModal with 4-tab layout and admin console"
```

---

### Task 9: AppShell.vue 全链路集成 + 最终验证

**Files:**
- Modify: `src/components/layout/AppShell.vue`
- Modify: `src/main.js` (or App.vue — wherever authStore.init() should be called)

**Interfaces:**
- Consumes: `AuthModal.vue`, `SettingsModal.vue`, `DesktopSidebarVue.vue` (with new emits), `useAuthStore`
- Produces: Fully wired app with login/settings flow

- [ ] **Step 1: Mount AuthModal and SettingsModal in AppShell.vue**

Add:
```js
import AuthModal from '../auth/AuthModal.vue'
import SettingsModal from '../settings/SettingsModal.vue'
import { useAuthStore } from '../../stores/authStore.js'

const authStore = useAuthStore()
const isAuthOpen = ref(false)
const isSettingsOpen = ref(false)
```

Wire DesktopSidebarVue:
```html
@open-auth="isAuthOpen = true"
@open-settings="isSettingsOpen = true"
```

Mount modals at bottom of template (before `</template>`):
```html
<AuthModal :is-open="isAuthOpen" @close="isAuthOpen = false" @logged-in="isAuthOpen = false" />
<SettingsModal :is-open="isSettingsOpen" @close="isSettingsOpen = false" />
```

- [ ] **Step 2: Call authStore.init() on app mount**

In `src/App.vue` or `src/main.js`, add `authStore.init()` in `onMounted`:
```js
import { useAuthStore } from './stores/authStore.js'
const authStore = useAuthStore()
onMounted(() => authStore.init())
```

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: All tests PASS (≥501)

- [ ] **Step 4: Run emoji audit**

Run: `npm run check-emojis`
Expected: 0 violations

- [ ] **Step 5: Run build**

Run: `npm run build`
Expected: Build succeeds (chunk size warnings are acceptable; no errors)

- [ ] **Step 6: Run security check**

Run: `npm run verify-security`
Expected: 0 credential leaks

- [ ] **Step 7: Commit and push**

```
git add src/components/layout/AppShell.vue src/App.vue src/main.js
git commit -m "feat(appshell): wire AuthModal, SettingsModal, and authStore.init() into app shell"
git push origin main
```
