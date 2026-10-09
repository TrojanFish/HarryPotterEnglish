# Hogwarts Audio Vue 3 渐进式重构架构设计规格书 (Phase 1: Core MVP)

- **作者/制定者**: Antigravity AI & Hogwarts Audio 团队
- **制定日期**: 2026-10-09
- **状态**: Approved / Ready for Planning
- **目标分支**: `feature/vue3-core-mvp`

---

## 1. 架构重构背景与目标

### 1.1 背景
Hogwarts Audio 是一套专为英语学习者打造的沉浸式原版有声小说精听与二语习得平台，现存生产系统基于 React 18 编写，拥有成熟的流媒体按需切片加载、本地优先 (Local-First) IndexedDB 离线存储与 236 项严密的自动化测试。  
根据用户技术选型倾向，项目启动向 **Vue 3 (Composition API + `<script setup>`)** 的渐进式重构。

### 1.2 重构原则
1. **主干零风险 (Zero Disruption to Main)**：全量重构工作在独立特性分支 `feature/vue3-core-mvp` 上展开，主分支 `main` 的 React 版本保持 100% 生产可用；
2. **纯业务逻辑 100% 无缝复用**：`src/utils/` 下的 WebVTT 解析器、离线 IndexedDB 存储、音频切片流、CEFR 分级算法等均为原生 JavaScript，完全独立于 UI 框架，直接复用；
3. **视觉与设计规范零衰减**：完整继承现有的霍格沃茨暖色羊皮纸设计系统（Parchment Aesthetic）、零 Emoji 规范（严格使用 `lucide-vue-next`）与 Apple HIG $\ge 44\text{px}$ 触控热区标准；
4. **规避 Proxy 原生媒体对象陷阱**：原生 `<audio>` 实例必须使用 `shallowRef` 持有，严禁使用深层 `reactive`，保障音频缓冲与播放时间事件派发不被底层代理劫持。

---

## 2. 技术栈与依赖基准

### 2.1 依赖调整矩阵
- **移除**：
  - `react` (^18.3.1)
  - `react-dom` (^18.3.1)
  - `@vitejs/plugin-react` (^4.3.3)
- **新增**：
  - `vue` (^3.5.0)：核心框架
  - `@vitejs/plugin-vue` (^5.2.0)：Vite SFC 编译插件
  - `pinia` (^2.2.0)：响应式状态管理
  - `lucide-vue-next` (^0.453.0)：矢量图标库
- **保留**：
  - `tailwindcss` (^3.4.14)、`postcss`、`autoprefixer`
  - `clsx`、`tailwind-merge`
  - `server/` (Express 后端与 S3/R2 代理)
  - `functions/api/` (Cloudflare Pages 边缘函数)

---

## 3. 核心组件与目录结构 (Phase 1: Core MVP)

```
src/
├── App.vue                         # 顶层布局容器，管理全局音频实例与快捷键
├── main.js                         # Vue 3 入口，挂载 Pinia 与全局错误捕获
├── index.css                       # 霍格沃茨羊皮纸风全局样式
├── stores/
│   ├── playerStore.js              # 播放器核心状态 Store (Pinia)
│   └── subtitleStore.js            # 字幕解析与高频时间轴匹配 Store (Pinia)
├── components/
│   ├── AudioPlayer.vue             # 底部流媒体控制栏 (播放/暂停/拖拽/倍速)
│   ├── SubtitleViewer.vue          # WebVTT 精听字幕区 (英雄聚焦、Lumos 聚光灯、盲听遮罩)
│   ├── BookshelfDrawer.vue         # 7 卷书架抽屉与章节切换 (CEFR A2~C1)
│   └── common/
│       ├── MagicErrorBoundary.vue  # 羊皮纸风全局错误边界
│       └── WorkshopPlaceholder.vue # 占位组件（用于阶段性未迁移工坊）
└── utils/                          # 100% 复用的纯原生工具库
    ├── vttParser.js                # WebVTT 解析
    ├── offlineStorage.js           # IndexedDB 离线行囊
    ├── audioStream.js              # HTTP 206 范围请求
    └── booksData.js                # 霍格沃茨 7 卷书籍元数据
```

---

## 4. 响应式数据流设计 (Pinia Stores)

### 4.1 `usePlayerStore`
- **State**:
  - `currentBookId`: 当前书籍 ID (如 `'hp1'`)
  - `currentChapterId`: 当前章节 ID (如 `'hp1-01'`)
  - `isPlaying`: 播放中状态 (`boolean`)
  - `currentTime`: 当前播放时间秒数 (`number`)
  - `duration`: 音频总时长 (`number`)
  - `playbackRate`: 播放倍速 (`0.8 | 1.0 | 1.2 | 1.5`)
  - `volume`: 音量 (`0.0 ~ 1.0`)
  - `isBlindMode`: 隐身斗篷盲听模式开关 (`boolean`)
  - `isBookshelfOpen`: 书架抽屉展开状态 (`boolean`)
- **Actions**:
  - `play()`, `pause()`, `togglePlay()`
  - `seek(seconds)`: 跳转并防抖更新
  - `setPlaybackRate(rate)`: 更新倍速
  - `switchChapter(bookId, chapterId)`: 切换章节并载入音频/字幕
- **持久化**:
  - 自动向 `localStorage.getItem('hp_last_position')` 写入与读取断点续听位置。

### 4.2 `useSubtitleStore`
- **State**:
  - `cues`: WebVTT 条目数组 `Array<{ id, start, end, text }>`
  - `activeCueIndex`: 当前命中的字幕索引 (`number`)
  - `isLoading`: 字幕加载中状态 (`boolean`)
- **Getters**:
  - `currentCue`: 当前高亮句子
- **Actions**:
  - `loadVtt(url)`: 解析并注入字幕列表
  - `updateActiveCue(time)`: 基于二分查找算法毫秒级命中当前 cue，杜绝主线程卡顿

---

## 5. 交互与人机工学规范

1. **英雄聚焦排版 (`hero-sentence`)**：
   - 处于当前播放秒数的句子应用 `.reading-hero-sentence`；
   - 包含 4px 琥珀色左侧引导线；
   - 触发切换时自动调用 `scrollIntoView({ behavior: 'smooth', block: 'center' })`。
2. **Apple HIG 触控尺寸**：
   - 所有按钮热区保证 $\ge 44 \times 44\text{px}$；
   - 移动端输入框字体固定 $\ge 16\text{px}$ 防止 iOS 强制缩放。
3. **防抖进度拖拽**：
   - 进度条拖拽时仅更新本地 UI 预览时间，松手（`change` / `touchend`）时才真正触发 `<audio>` 的 `currentTime` 跳转。

---

## 6. 质量验收与审计标准

1. **零 Emoji 审计**：执行 `npm run check-emojis`，检查结果必须为 0 个表情符号违规；
2. **构建校验**：执行 `npm run build`，Vite 打包成功且无任何模块解析错误；
3. **功能闭环**：
   - [x] 书架中可自由切换章节；
   - [x] 音频正常流式播放，倍速切换与快进快退生效；
   - [x] 字幕随音频同步高亮并自动居中平滑滚动；
   - [x] 盲听模式有效遮罩非焦点字幕。
