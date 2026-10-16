# Hogwarts Audio — Auth System, Activation Codes & Gemini Sidebar 设计规范

**作者**: AI Agent  
**日期**: 2026-10-16  
**状态**: 已审查通过 (用户确认「认可」)

---

## 1. 背景与目标

本规范实现以下三个相互关联的子系统：

1. **侧边栏底部 Gemini 化**：用户头像卡 + 昵称/Pro 勋标 + 设置齿轮，重构现有杂乱底部区域。
2. **注册 / 登录 / 账户体系**：用户名 + 密码认证，零外部依赖，服务端 HMAC-SHA256 Token。
3. **激活码 (卡密) 体系**：月卡 / 季卡 / 年卡 / 永久 Pro，Admin 控制台批量生成与作废。

---

## 2. 技术约束（硬性，不可打破）

| 约束 | 规格 |
|------|------|
| UI 图标 | 仅使用 `lucide-vue-next`，**零 Unicode emoji** |
| 触控目标 | Apple HIG `min-h-[44px] min-w-[44px]` + `touch-manipulation` |
| 配色 | 羊皮纸调色盘：`#fbf9f5` / `#e8ddd0` / `#f5efe6` / amber/bronze 强调色 |
| 外部依赖 | **严禁**引入 `bcrypt`, `jsonwebtoken`, `express-session` 或任何新 npm 包 |
| 侧边栏保留 | 「离线管理」「云端漫游」**必须**保留侧边栏一级菜单项，不移入设置弹窗 |
| 数据持久化 | 服务端使用 in-memory store（与 syncStore.js 同模式），重启后数据丢失为已知局限 |
| 环境变量 | `JWT_SECRET` 与 `ADMIN_SECRET_KEY` 必须从 `.env` 读取；缺失时相关接口返回 503 |

---

## 3. 认证系统

### 3.1 用户存储 (`server/authStore.js`)

```
users Map: userId -> { userId, username, passwordHash, salt, wizardName, avatar, createdAt }
usernameIndex Map: username -> userId
```

- **userId**: `usr_` + 8 位随机十六进制（`crypto.randomBytes(4).toString('hex')`）
- **密码哈希**: `crypto.scryptSync(password, salt, 64)` + 随机 `crypto.randomBytes(16).toString('hex')` salt
- **用户名校验**: 3–20 位，仅字母/数字/下划线，正则 `/^[a-zA-Z0-9_]{3,20}$/`

### 3.2 Token 格式

```
base64url(userId) : expiry_unix_seconds : base64url(hmac_sha256(userId + ':' + expiry, JWT_SECRET))
```

- **有效期**: 30 天（`Date.now() / 1000 + 30 * 86400`）
- **验证**: 解析三段，重算 HMAC 比对，检查 `expiry > now`
- **SECRET 缺失**: 所有 auth 接口返回 `503 { error: 'AUTH_CONFIG_MISSING' }`

### 3.3 服务端路由 (`server/index.js` 扩展)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册（body: username, password, wizardName） |
| POST | `/api/auth/login` | 登录（body: username, password） |
| GET | `/api/auth/me` | 获取当前用户信息（Bearer Token） |

- **注册响应**: `{ userId, username, wizardName, token, isPro, proExpiresAt, avatar }`
- **登录响应**: 同注册响应
- **me 响应**: 同上（无 token 字段）
- **错误码**: `USER_EXISTS`, `INVALID_CREDENTIALS`, `INVALID_TOKEN`, `AUTH_CONFIG_MISSING`

### 3.4 Rate Limiting

- `/api/auth/register`: 5 次 / 15 分钟 / IP
- `/api/auth/login`: 10 次 / 15 分钟 / IP

---

## 4. 激活码体系

### 4.1 激活码存储 (`server/activationStore.js`)

```
activations Map: code -> { code, type, durationDays, createdAt, redeemedAt, redeemedBy }
```

- **code 格式**: `HP-M30-XXXXXX`（type 缩写 + 6 位随机大写字母数字）
- **type 枚举**:
  - `MONTH_30`: 月卡 30 天，`HP-M30-`
  - `SEASON_90`: 季卡 90 天，`HP-Q90-`
  - `YEAR_365`: 年卡 365 天，`HP-Y365-`
  - `FOREVER`: 永久 Pro，`HP-PRO-`

### 4.2 Pro 有效期计算（顺延叠加）

```
newProExpiresAt = max(now, currentProExpiresAt) + durationDays * 86400_000
```

- 永久 Pro：`proExpiresAt = null`，`isPro = true` 永久
- 已过期再充值：从当前时间顺延

### 4.3 用户 Pro 状态存储

存储在 `authStore.js` 的 user 记录中：

```
{ ..., isPro: boolean, proExpiresAt: number|null }
```

### 4.4 服务端路由

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/api/activation/redeem` | Bearer Token | 兑换激活码 |
| POST | `/api/admin/activation/generate` | `x-admin-key` header | 批量生成激活码 |
| GET | `/api/admin/activation/list` | `x-admin-key` header | 列出所有激活码 |
| POST | `/api/admin/activation/revoke` | `x-admin-key` header | 作废激活码 |

- **admin 验证**: `req.headers['x-admin-key'] === process.env.ADMIN_SECRET_KEY`（严格字符串比较），`ADMIN_SECRET_KEY` 缺失时返回 503
- **generate body**: `{ type: 'MONTH_30'|'SEASON_90'|'YEAR_365'|'FOREVER', count: 1-50 }`
- **generate 响应**: `{ codes: string[] }`
- **redeem 响应**: `{ isPro, proExpiresAt, message }`

---

## 5. 前端认证 Store (`src/stores/authStore.js`)

### 状态

```js
{
  currentUser: null | { userId, username, wizardName, avatar, isPro, proExpiresAt },
  token: null | string,  // 持久化到 localStorage('hp_auth_token')
  isLoading: false
}
```

### 计算属性

- `isLoggedIn`: `!!currentUser`
- `isPro`: `currentUser?.isPro && (!currentUser.proExpiresAt || Date.now() < currentUser.proExpiresAt)`
- `proLabel`: 已登录 Pro → `'Pro'`；已登录非 Pro → `'普通学员'`；未登录 → `null`
- `displayName`: `currentUser?.wizardName || currentUser?.username || null`
- `avatarId`: `currentUser?.avatar || 'default'`

### 方法

- `register(username, password, wizardName)` → POST `/api/auth/register`
- `login(username, password)` → POST `/api/auth/login`
- `logout()` → 清除 token + currentUser
- `refreshMe()` → GET `/api/auth/me`（启动时调用，token 存在时）
- `redeemActivation(code)` → POST `/api/activation/redeem`
- `setAvatar(avatarId)` → 更新本地 currentUser.avatar + 同步服务端（PATCH `/api/auth/me`）
- `init()` → 读取 localStorage token → `refreshMe()`（在 App.vue 挂载时调用）

---

## 6. 侧边栏底部 Gemini 用户卡

### 6.1 展开态布局

```
[ 圆形头像 ] [ 巫师昵称 / 用户名 ]  [ 设置齿轮 ]
             [ Pro 金色勋标 / 普通学员灰标 ]
```

- **头像圆圈**: `w-9 h-9 rounded-full bg-amber-100 border border-amber-300/60 flex items-center justify-center`
- **头像内容**: `<User :size="18" class="text-amber-800" />`（一期）
- **昵称**: `text-sm font-bold text-stone-800 truncate`
- **Pro 勋标**: `inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold`，内含 `<Sparkles :size="10" />`
- **普通学员标**: 同结构，`bg-stone-200 text-stone-600`
- **未登录**: 显示「登入学籍」按钮（`bg-amber-700 text-amber-50`），点击唤起 AuthModal
- **设置齿轮**: `<Settings :size="18" />`，`w-10 h-10 rounded-xl`，点击 `emit('open-settings')`

### 6.2 折叠态布局

```
[ 圆形头像 ]
[ 小齿轮 ]
```

- 头像尺寸 `w-9 h-9`，点击行为同展开态
- 小齿轮 `<Settings :size="14" />`，`w-8 h-8` 图标按钮，点击 `emit('open-settings')`

### 6.3 头像点击行为

- 未登录 → 唤起 `AuthModal`（`emit('open-auth')`）
- 已登录 → 显示用户小菜单（inline dropdown），包含：「查看学籍卡」「退出登录」

### 6.4 DesktopSidebarVue.vue 新增 emits

```js
['open-auth', 'open-settings']
```

---

## 7. AuthModal (`src/components/auth/AuthModal.vue`)

### 7.1 结构

- Teleport to body，`z-index: 50`
- 背景蒙层：`bg-stone-900/50 backdrop-blur-sm`
- 弹窗主体：`bg-[#fbf9f5] border border-[#e8ddd0] rounded-2xl max-w-sm w-full mx-4 p-6`
- Escape 键关闭，点击蒙层关闭

### 7.2 Tab 切换

两个 Tab：`登录` / `注册`，active tab: `border-b-2 border-amber-700 text-amber-900 font-bold`

### 7.3 登录表单

- 用户名 input + 密码 input
- 「登录」CTA: `bg-amber-700 hover:bg-amber-800 text-amber-50 min-h-[44px] w-full rounded-xl font-bold`
- 错误提示：红色小字（`text-rose-700 text-xs`）

### 7.4 注册表单

- 用户名 + 密码 + 确认密码 + 巫师昵称（可选）
- 用户名规则提示：`text-[11px] text-stone-500`，显示 3–20 位字母数字下划线
- 「注册」CTA：同登录按钮样式

### 7.5 Props & Emits

```js
props: { isOpen: Boolean }
emits: ['close', 'logged-in']
```

---

## 8. SettingsModal (`src/components/settings/SettingsModal.vue`)

### 8.1 结构

- Teleport to body，`z-index: 50`
- 弹窗：`bg-[#fbf9f5] border border-[#e8ddd0] rounded-2xl max-w-lg w-full mx-4`
- 左侧分组 Tab（垂直排列）：「学籍与激活」「快捷键指南」「研学公约」「管理员通道」
- 右侧内容区

### 8.2 学籍与激活 Tab

- **已登录**: 显示用户名、巫师昵称、Pro 状态（有效期或「普通学员」）
- **激活码兑换**: 输入框（placeholder `HP-M30-XXXXXX`）+ 「兑换」按钮
- **头像选择**: 12 个预设头像格子（一期用 Lucide 图标 + 色彩环）

### 8.3 快捷键指南 Tab

- 将现有 ShortcutsModal 内容内联到此 Tab（ShortcutsModal.vue 保留以向后兼容）

### 8.4 研学公约 Tab

- 将现有法律/公约文本内联（原触发自 handleLegalClick）

### 8.5 管理员通道 Tab

- 仅 Admin Key 验证成功后展示完整控制台
- Admin Key 输入框（`type="password"`）+ 「验证」按钮
- 验证成功后显示：
  - 生成卡密：类型选择（下拉）+ 数量输入（1–50）+ 「生成」按钮 + 结果代码块（可一键复制）
  - 激活码列表：表格显示 code / type / 已兑换 / 兑换者
  - 作废按钮（每行）

### 8.6 Props & Emits

```js
props: { isOpen: Boolean }
emits: ['close']
```

---

## 9. AppShell.vue 集成

### 9.1 清除孤儿代码 (P0)

删除以下遗留代码：
- `import HouseCupModal from '...'`
- `const isHouseCupOpen = ref(false)`
- `openHouseCup()` / `closeHouseCup()` 函数
- `<HouseCupModal :is-open="isHouseCupOpen">` DOM 挂载

### 9.2 新增状态

```js
const isAuthOpen = ref(false)
const isSettingsOpen = ref(false)
```

### 9.3 DesktopSidebarVue 新增事件监听

```html
@open-auth="isAuthOpen = true"
@open-settings="isSettingsOpen = true"
```

### 9.4 挂载 AuthModal & SettingsModal

```html
<AuthModal :is-open="isAuthOpen" @close="isAuthOpen = false" @logged-in="isAuthOpen = false" />
<SettingsModal :is-open="isSettingsOpen" @close="isSettingsOpen = false" />
```

---

## 10. 头像预设（一期）

12 款预设头像使用 Lucide 图标 + 色彩环：

| id | 图标 | 色彩环 |
|----|------|--------|
| `user` | User | amber |
| `glasses` | Glasses | stone |
| `book` | BookOpen | amber |
| `wand` | Wand2 | purple |
| `hat` | GraduationCap | red |
| `star` | Star | yellow |
| `owl` | Bird | amber |
| `castle` | Castle | stone |
| `flame` | Flame | orange |
| `crown` | Crown | amber |
| `lightning` | Zap | yellow |
| `shield` | Shield | blue |

---

## 11. 测试覆盖要求

| 文件 | 覆盖内容 |
|------|----------|
| `tests/vue3/authModal.test.js` | AuthModal 结构、tab 切换、登录/注册表单字段、错误显示、emit 验证 |
| `tests/vue3/settingsModal.test.js` | SettingsModal 结构、4 个 Tab、激活码兑换输入、管理员通道 UI |
| `tests/vue3/adminConsole.test.js` | 管理员 Key 验证流程、生成/列表/作废 UI 在验证后出现 |
| `tests/vue3/authStore.test.js` | register/login/logout/refreshMe/redeemActivation/setAvatar；isPro/proLabel/displayName 计算属性 |
| `tests/server/authStore.test.js` | registerUser/loginUser/verifyToken/getUserById；scrypt 哈希；username 校验；重复用户报错 |
| `tests/server/activationStore.test.js` | generateCode/redeemCode/revoke；Pro 顺延叠加；永久 Pro；已兑换报错 |
| `tests/vue3/desktopSidebar.test.js` (扩展) | 新增 open-auth emit、open-settings emit；Gemini 用户卡结构 |

---

## 12. 交付顺序与依赖关系

```
Task 1: P0 清孤儿 + gamificationNavigation.test.js 修复
Task 2: server/authStore.js + tests/server/authStore.test.js
Task 3: server/activationStore.js + tests/server/activationStore.test.js
Task 4: server/index.js 路由扩展 (auth + activation + admin)
Task 5: src/stores/authStore.js (Pinia) + tests/vue3/authStore.test.js
Task 6: DesktopSidebarVue.vue 底部 Gemini 用户卡重写 + tests/vue3/desktopSidebar.test.js 扩展
Task 7: AuthModal.vue + tests/vue3/authModal.test.js
Task 8: SettingsModal.vue + tests/vue3/settingsModal.test.js + tests/vue3/adminConsole.test.js
Task 9: AppShell.vue 集成 + 全链路 npm test + npm run build + git push
```
