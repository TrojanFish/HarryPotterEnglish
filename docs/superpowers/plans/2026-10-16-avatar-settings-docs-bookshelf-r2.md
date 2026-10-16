# Hogwarts Audio — 4项用户反馈与功能优化实施计划

> 本实施计划针对用户提出的 4 项改进需求：
> 1. 魔法头像无法选择与侧边栏联动
> 2. 设置中心尺寸抖动与固定容器统一
> 3. 管理员密钥与卡密生成文档规范化（README.md & .env.example）
> 4. 魔法书架仅展示 Cloudflare R2 中实际存储的内容

---

## 任务分解与执行步骤

### Task 1: 魔法头像选择与侧边栏动态联动（支持访客本地保存 + 登录账户同步）
- **目标**：在设置中心点击 12 款巫师头像时即时生效，侧边栏（折叠态与展开态）与设置中心同步展示选中的 Lucide 头像；访客状态保存在 `localStorage('hp_user_avatar')`，登录状态通过 API 同步至云端。
- **文件变更**：
  - 新建 `src/utils/avatarPresets.js`：集中管理 12 款头像定义、名称与 `getAvatarIcon(avatarId)` 解析助手。
  - 修改 `src/stores/authStore.js`：增加 `localAvatar` 状态，`setAvatar` 在未登录时保存本地，在已登录时调用 API。
  - 修改 `src/components/navigation/DesktopSidebarVue.vue`：将折叠与展开态的硬编码 `UserCircle` 替换为 `<component :is="getAvatarIcon(authStore.avatarId)" />`。
  - 修改 `src/components/settings/SettingsModal.vue`：引入 `AVATAR_PRESETS` 与 `getAvatarIcon`，移除未登录拦截，允许所有用户随心换头像。
  - 更新/新增测试：`tests/vue3/authStore.test.js` 与 `tests/vue3/desktopSidebarVue.test.js`。

### Task 2: 统一设置中心（SettingsModal）窗口尺寸，消除选项切换跳动
- **目标**：设置窗口（`SettingsModal.vue`）外框固定为响应式高度容器（`h-[85vh] max-h-[640px] md:h-[620px]`），左侧 Tab 导航栏与右侧内容区域各自独立滚动，切换 Tab 时外层高宽绝对恒定。
- **文件变更**：
  - 修改 `src/components/settings/SettingsModal.vue`：
    - 外层卡片：`h-[85vh] max-h-[640px] md:h-[620px] w-full max-w-2xl mx-4 bg-[#fbf9f5] border border-[#e8ddd0] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl`
    - 左侧栏：`w-full md:w-56 shrink-0 bg-[#f5efe6] border-b md:border-b-0 md:border-r border-[#e8ddd0] flex flex-col md:h-full overflow-hidden`
    - 右侧栏：`flex-1 min-h-0 h-full overflow-y-auto p-4 md:p-6 bg-[#fbf9f5] flex flex-col space-y-6`
  - 更新测试：`tests/vue3/settingsModal.test.js` 验证固定尺寸与 `overflow-y-auto` 滚动结构。

### Task 3: 完善管理员密钥（ADMIN_SECRET_KEY）与系统配置文档
- **目标**：在 `.env.example` 和 `README.md` 中全面说明 `ADMIN_SECRET_KEY` 与 `JWT_SECRET`，并提供完整的卡密管理与使用步骤指南。
- **文件变更**：
  - 修改 `.env.example`：补充 `JWT_SECRET` 和 `ADMIN_SECRET_KEY` 环境变量注释。
  - 修改 `README.md`：
    - 增加「学籍认证、Pro 激活码与管理员后台」独立章节，包含管理员通道解锁步骤与卡密类型说明。
    - 在「环境变量说明」表格中追加 `JWT_SECRET` 与 `ADMIN_SECRET_KEY` 条目。

### Task 4: 魔法书架仅展示 R2 中实际存储的内容
- **目标**：魔法书架（`BookshelfPageView.vue` 与 `BookshelfDrawer.vue`）彻底告别死代码全量 7 本书展示，改为仅渲染在 R2 中实际具备音频资源的有效书目与章节。
- **文件变更**：
  - 修改 `src/stores/catalogStore.js`：
    - 添加 `availableBooks` getter（过滤 `chapters.length > 0` 的书目）。
    - 完善 `fetchRemoteCatalog()`（优先请求 `/api/catalog`，优雅回退至 `/catalog.json`，过滤无效章节）。
    - 增强 `selectBook` 容错匹配（支持 `id`, `altIds`, `code`）。
  - 修改 `src/App.vue`：在 `onMounted()` 中触发 `catalogStore.fetchRemoteCatalog()`。
  - 修改 `src/components/views/BookshelfPageView.vue`：基于 `catalogStore.availableBooks` 动态生成书本展示列表，自动与 R2 存量同步。
  - 修改 `src/components/BookshelfDrawer.vue`：基于 `catalogStore.availableBooks` 动态渲染书籍 Tab。
  - 更新/新增测试：`tests/vue3/catalogStore.test.js` 与 `tests/vue3/bookshelfPageView.test.js`。

### Task 5: 全套测试与合规审查
- 执行 `npm test`（确保所有测试通过）。
- 执行 `npm run check-emojis`（确保 0 Unicode Emoji）。
- 执行 `npm run verify-security`（确保零凭证泄漏）。
- 执行 `npm run build`（确保生产构建成功）。
