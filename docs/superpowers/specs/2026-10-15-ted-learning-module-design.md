# TED 魔法精讲模块 — Sprint 2 设计规范

**版本:** 1.0  
**日期:** 2026-10-15  
**负责人:** Hogwarts Audio Engineering  
**目标学习者:** K12 及以下（≤ 15 岁）  
**关联需求:** `hogwarts-audio-transformation-plan.md` — 三、模块一 TED 精讲  

---

## 一、范围与目标

### 1.1 Sprint 2 交付边界（MVP）

Sprint 2 交付完整的「TED 魔法精讲」四步教学法首版：

| 步骤 | 组件 | 描述 |
|-----|-----|-----|
| Step 1 | `TedVocabPreload.vue` | 词汇预激活 — 8–12 个核心词卡，交互听读后解锁视频 |
| Step 2 | `TedVideoPlayer.vue` | 精看精听播放器 — 原生 `<video>` + 双语 VTT + 单句 Loop + 盲听遮罩 + 点词查词 |
| Step 3 | `TedTaskStudio.vue` | 理解任务工坊 — 关键句填空 + 核心观点时间戳配对 |
| Step 4 | `TedShadowing.vue` | 演讲跟读工坊 — 精选切片 A/B 双轨对比回放 |
| 整合 | `TedHub.vue` | 三端布局调度，含演说目录列表 |
| 数据 | `tedData.js` + `tedStore.js` | TED 演说数据模型与 Pinia 状态管理 |
| 服务端 | `server/index.js` | `/api/stream/video/*` HTTP 206 视频分片流 |

**不在 Sprint 2 范围：**
- Web Speech API 评分（保留至 Sprint 3）
- Cloudflare D1 数据库（本次用 `localStorage` + 静态 JSON 替代）
- IndexedDB 离线缓存（TED 视频下载，保留至 Sprint 4）

### 1.2 成功标准（Definition of Done）

- 用户能在单次会话中完成「词汇预热 → 精看 → 任务 → 跟读」完整四步
- 视频通过 R2 `/api/stream/video/*` HTTP 206 分片流式加载
- 三端响应式布局正常：手机端（≤ 767px）、平板端（768–1023px）、桌面端（≥ 1024px）
- 全量 `npm test` 通过、`npm run build` 成功、`npm run check-emojis` 零违规

---

## 二、数据架构

### 2.1 TED 演说数据模型（`src/data/tedData.js`）

```js
// TED 演说元数据
{
  id: 'ted-simon-sinek-2009',           // 唯一 ID，kebab-case
  title: 'How Great Leaders Inspire Action',
  titleCn: '伟大领袖如何激励行动',
  speaker: 'Simon Sinek',
  year: 2009,
  durationSeconds: 1088,               // 完整演说时长（秒）
  cefrLevel: 'B1',                     // A1|A2|B1|B2|C1
  wpm: 142,                            // 演讲语速（单词/分钟）
  topicTags: ['leadership', 'motivation', 'business'],
  videoKey: 'ted/simon-sinek-2009/video.mp4',   // R2 对象键
  vttKey: 'ted/simon-sinek-2009/subtitle.vtt',  // R2 对象键（双语 VTT）
  thumbnailKey: 'ted/simon-sinek-2009/thumb.jpg',
  vocabSet: [                          // 8–12 个核心词汇
    {
      word: 'inspire',
      ipa: '/ɪnˈspaɪər/',
      pos: 'v.',
      cefrLevel: 'B1',
      definitionCn: '激励；鼓舞',
      exampleSentence: 'Great leaders inspire people to take action.',
      audioKey: 'ted/simon-sinek-2009/vocab/inspire.mp3', // 单词发音，可选
      examTag: '高考重点'              // 中考|高考|四六级|雅思|原著专属 — 可选
    }
    // ...最多 12 个
  ],
  tasks: {                             // Step 3 任务配置
    cloze: [                           // 关键句填空 (5–8 句)
      {
        id: 'cloze-1',
        sentenceWithBlanks: 'People don\'t buy what you do, they buy ___.',
        blanks: ['why you do it'],
        fullSentence: 'People don\'t buy what you do, they buy why you do it.',
        startSeconds: 240
      }
    ],
    matching: [                        // 时间戳配对 (3–5 组)
      {
        id: 'match-1',
        summaryText: 'The Golden Circle: Why, How, What',
        timestampSeconds: 180,
        formattedTime: '03:00'
      }
    ]
  },
  shadowingSegments: [                 // Step 4 跟读片段 (2–3 段)
    {
      id: 'seg-1',
      startSeconds: 60,
      endSeconds: 90,
      transcript: 'Why is Apple so innovative?...',
      transcriptCn: '为什么苹果如此具有创新力？...'
    }
  ]
}
```

**VTT 格式约定（双语）：**
```vtt
WEBVTT

00:01:00.000 --> 00:01:04.000
Why is Apple so innovative?

00:01:00.000 --> 00:01:04.000
为什么苹果如此具有创新力？
```

> [!NOTE]
> 双语 VTT 采用相同时间戳段落叠加的方式，英文 cue 在前，中文 cue 紧随其后（相同时间戳）。播放器组件负责解析并分层渲染。

### 2.2 `tedStore.js` 状态结构

```js
{
  // 目录
  talks: [],                    // TED 演说数组（来自 tedData.js）
  selectedTalkId: null,         // 当前选中演说 ID

  // 教学步骤
  currentStep: 1,               // 1=词汇预热 | 2=精看 | 3=任务 | 4=跟读

  // Step 1 词汇预热状态
  listenedVocabIds: new Set(),  // 已听单词集合（word 字符串）
  vocabUnlocked: false,         // 是否解锁视频（listenedVocabIds.size >= vocabSet.length）

  // Step 2 视频播放器状态
  videoSrc: '',                 // 解析后的视频 URL
  videoCurrentTime: 0,          // 当前播放进度（秒）
  videoDuration: 0,
  isVideoPlaying: false,
  isBlindMode: false,           // 盲听模式：隐藏字幕
  loopCueIndex: null,           // 单句循环的字幕 cue 索引，null = 不循环
  showChineseSubs: true,        // 中文字幕显示开关
  activeCueIndex: 0,            // 当前激活的字幕 cue 索引
  lookupWord: null,             // 点词查词的目标单词（触发 WordLookupModal）

  // Step 3 任务状态
  clozeAnswers: {},             // { [clozeId]: string } 用户填入的答案
  matchingAnswers: {},          // { [matchId]: number } 用户拖拽配对结果（timestampSeconds）
  taskScore: null,              // 0–100，任务提交后生成

  // Step 4 跟读状态
  shadowingSegmentIndex: 0,    // 当前跟读片段索引
  shadowingPhase: 'idle',      // 'idle' | 'playing_original' | 'recording' | 'reviewing'

  // 持久化（localStorage）
  completedTalkIds: []          // 已完成完整四步的演说 ID 列表
}
```

**`tedStore.js` 关键 Actions：**

| Action 名称 | 参数 | 描述 |
|---|---|---|
| `selectTalk(id)` | `string` | 设置 `selectedTalkId`，重置所有步骤状态，解析 videoSrc/vttSrc |
| `markVocabListened(word)` | `string` | 加入 `listenedVocabIds`，计算 `vocabUnlocked` |
| `goToStep(step)` | `1\|2\|3\|4` | 设置 `currentStep`，校验前置条件（Step 2 需 `vocabUnlocked`) |
| `setLoopCue(index)` | `number\|null` | 设置/取消单句循环 |
| `toggleBlindMode()` | — | 切换 `isBlindMode` |
| `toggleChineseSubs()` | — | 切换 `showChineseSubs` |
| `setLookupWord(word)` | `string\|null` | 触发/关闭点词查词 |
| `submitClozeAnswer(id, answer)` | `string, string` | 记录填空答案 |
| `submitMatchingAnswer(id, ts)` | `string, number` | 记录配对答案 |
| `scoreTask()` | — | 计算 `taskScore`，返回 0–100 |
| `markTalkCompleted(id)` | `string` | 追加至 `completedTalkIds`，持久化至 localStorage |

**解析辅助函数（`src/data/tedData.js` 导出）：**

```js
// 解析 TED 视频流 URL（复用 resolveAudioStreamUrl 逻辑）
export function resolveVideoStreamUrl(videoKey, apiBase = '', customCdnDomain = null)

// 解析 TED 字幕 URL（复用 resolveSubtitleUrl 逻辑）
export function resolveTedSubtitleUrl(vttKey, apiBase = '')

// 解析双语 VTT 文本 => { enCues: [], zhCues: [] }
// enCues[i] = { startTime, endTime, text }
// zhCues[i] = { startTime, endTime, text } (与 enCues[i] 同步时间轴)
export function parseBilingualVtt(vttText)
```

---

## 三、服务端 API 扩展

### 3.1 `/api/stream/video/*` — TED 视频分片流

在 `server/index.js` 中在音频流路由（`/api/stream/audio/*`）之后插入：

```
GET /api/stream/video/:key
```

- 行为：与 `/api/stream/audio/*` 完全一致，但 `Content-Type` 根据扩展名判断：
  - `.mp4` → `video/mp4`
  - `.webm` → `video/webm`
- 支持 HTTP 206 Range Requests（对 `<video>` native streaming 必需）
- 防盗链：复用现有 Referer 检查逻辑
- 缓存：`Cache-Control: public, max-age=2592000, immutable`

### 3.2 `/api/ted/catalog` — TED 目录 API（可选，MVP 用静态数据）

MVP 阶段从 `src/data/tedData.js` 静态导入，不依赖服务端目录接口。接口预留但 Sprint 2 中不实现。

---

## 四、组件规范

### 4.1 `TedHub.vue` — 三端布局调度容器

**职责：** 替换现有占位符，成为 TED 模块的真实入口页面。

**布局行为：**

| 端 | 步骤选择器位置 | 主内容区域 |
|---|---|---|
| 手机端 (< 768px) | 顶部水平步骤进度条（4 步） | 全屏单列，垂直滚动 |
| 平板端 (768–1023px) | 左侧演说列表抽屉 / 顶部 Tab | 主内容区 + 右侧字幕面板（Step 2） |
| 桌面端 (≥ 1024px) | 左侧 240px 演说列表 | 中央主内容区 + 右侧辅助面板 |

**Props/Slots：** 无（完全由 `tedStore` 驱动）

**模板结构（伪代码）：**
```
<div class="h-full flex flex-col lg:flex-row">
  <!-- 演说目录侧栏（lg 可见） -->
  <TedTalkList class="hidden lg:flex w-60 shrink-0 ..." />

  <!-- 主内容区 -->
  <div class="flex-1 flex flex-col">
    <!-- 步骤进度条 -->
    <TedStepBar :currentStep="tedStore.currentStep" />

    <!-- 步骤视图路由 -->
    <TedVocabPreload v-if="step === 1" />
    <TedVideoPlayer v-else-if="step === 2" />
    <TedTaskStudio v-else-if="step === 3" />
    <TedShadowing v-else-if="step === 4" />
  </div>
</div>
```

### 4.2 `TedVocabPreload.vue` — Step 1 词汇预激活

**功能要求：**
- 展示当前演说的 `vocabSet`（8–12 张词卡）
- 每张词卡：词汇 + IPA + 词性 + CEFR 标签 + 中文释义 + 例句
- `Volume2` Lucide 图标按钮：点击通过 `<audio>` 播放 `audioKey` 音频（或降级到 Web Speech API `speechSynthesis.speak`）
- 点击播放 → 该词卡状态变为「已听」（`CheckCircle2` 绿色，`border-amber-500`）
- 「跳过」按钮（静音图标）：无需播放直接标记「已知」
- **解锁条件**：全部词汇标记「已听」或「已知」后，解锁按钮由灰变金：  
  Primary CTA: `前往精看` → `tedStore.goToStep(2)`
- 单次会话恢复：从 `tedStore.listenedVocabIds` 恢复已听状态

**词卡 UI 结构（参考 Section 11.2 of transformation plan）：**
```
bg-white border border-[#e8ddd0] rounded-2xl p-4 space-y-2
  [Volume2 icon btn, 44px]  perseverance
  /ˌpɜːsɪˈvɪərəns/  n.
  ──────────────────────────
  坚持不懈；毅力 [B2 badge] [高考重点 badge]
  "Perseverance is the key to greatness." — Simon Sinek
  ──────────────────────────
  [CheckCircle2 已听] 或 [Skip btn 已知]
```

**K12 字体规范：**
- 词汇：`text-lg font-bold text-amber-950`
- IPA/例句：`text-base text-stone-600`
- 中文释义：`text-sm text-stone-700`

### 4.3 `TedVideoPlayer.vue` — Step 2 精看精听播放器

**功能要求：**
- 原生 `<video>` 元素，`src` 来自 `tedStore.videoSrc`（R2 `/api/stream/video/*`）
- 16:9 宽高比响应式（`aspect-video` / `aspect-[16/9]`）
- 双语字幕渲染（英文主显，中文辅显）：
  - 英文字幕：`text-lg leading-[1.75]` (K12 标准)
  - 中文字幕：`text-sm leading-relaxed text-stone-500`（点击 `ChevronDown`/`ChevronUp` 折叠）
- 字幕面板：随视频时间高亮当前句（`border-l-4 border-amber-400 bg-amber-500/10`），其余句 `opacity-40`
- **单句循环 (Loop)**：点击任意字幕句触发 `tedStore.setLoopCue(index)`，视频播放器在当前 cue 的 `[startTime, endTime)` 范围内循环，Loop 图标高亮
- **盲听模式**：`tedStore.isBlindMode = true` → 字幕面板整体隐藏（`opacity-0 pointer-events-none`），`EyeOff` 图标高亮
- **点词查词**：字幕文本中每个单词可点击 → `tedStore.setLookupWord(word)` → 触发现有 `WordLookupModal.vue`（Teleport to body）
- **播放控制栏（44px 触控目标，参见 11.1）：**
  ```
  [SkipBack 5s] [Speed: 0.75|1|1.25|1.5] [Play/Pause] [SkipForward 5s] [Subtitles on/off] [EyeOff blind] [Maximize]
  ```
  - 底色：`bg-[#1e1610]/90 backdrop-blur-sm`
- 中文字幕开关：`tedStore.toggleChineseSubs()`
- `<video>` 时间更新事件 → `tedStore.videoCurrentTime` → 计算 `activeCueIndex`

**三端布局：**
- 手机端：视频全宽 `w-full`，字幕卡片下方堆叠，竖屏全屏
- 平板端：视频左 60%，字幕面板右 40%（`hidden md:flex` 双列）
- 桌面端：视频居中 `max-w-3xl`，右侧字幕面板 `w-72 shrink-0`

### 4.4 `TedTaskStudio.vue` — Step 3 理解任务工坊

**任务 A — 关键句填空（Cloze）：**
- 展示 `tasks.cloze`（5–8 题）
- 每题：句子上下文 + 空格 `<input>` 框（`text-base` 防 iOS 缩放，`autocapitalize="none" autocorrect="off" spellcheck="false"`）
- 提交后即时反馈：正确 `text-emerald-700 bg-emerald-50`，错误 `text-red-700 bg-red-50 line-through`，展示正确答案
- 答案比对：`trim().toLowerCase()`，接受前后有空格的答案

**任务 B — 核心观点配对（Matching）：**
- 展示 `tasks.matching`（3–5 组）
- 左列：演讲摘要文本；右列：时间戳选项（随机打乱）
- 用户点击摘要后选择时间戳，配对成功高亮绿色
- 允许重新选择（取消已有配对后重配）

**步骤结束评分：**
- 综合分：`Math.round((clozeScore + matchingScore) / 2)`，0–100 整数
- 成绩卡：`文字总结 + 分数` + 「前往跟读」Primary CTA → `tedStore.goToStep(4)`
- 所有题目正确率 ≥ 80% 时显示「魔力满格」奖励标志（`Zap` 琥珀色图标）

### 4.5 `TedShadowing.vue` — Step 4 演讲跟读工坊

**功能要求：**
- 展示 `shadowingSegments`（2–3 段精选切片）
- 片段导航：上一片段 / 下一片段按钮（`ChevronLeft` / `ChevronRight`）
- **Track A 原声示范**：点击按钮播放精选切片音频（通过视频时间范围截取：`videoEl.currentTime = start; play(); 到 end 时暂停`）
- **Track B 我的录音**：`MediaRecorder` API 录音（复用 `StepShadowing.vue` 已有录音逻辑）
- A/B 对比回放：可独立播放 Track A 或 Track B 进行比对
- 跟读完成：完成全部片段 → 显示「完成本期精讲」→ `tedStore.markTalkCompleted(id)`

> [!NOTE]
> Sprint 2 不实现 Web Speech API 评分（语音评分），仅保留 A/B 对比回放。评分功能延期至 Sprint 3。

### 4.6 `TedStepBar.vue` — 步骤进度条

**职责：** 在 TedHub 顶部显示四步教学进度，允许在已解锁步骤间跳转。

- 4 个步骤节点：词汇预热 | 精看精听 | 理解任务 | 演讲跟读
- 当前步骤高亮（`bg-amber-500 text-white`）
- 已完成步骤：`CheckCircle2` 绿色图标
- 锁定步骤（Step 2 未解锁时）：`Lock` 灰色图标，禁用点击
- 步骤间连接线：已完成段 `bg-amber-400`，未完成段 `bg-[#e8ddd0]`
- 最小触控目标 `min-h-[44px]`

### 4.7 `TedTalkList.vue` — 演说目录列表

**职责：** 展示 `tedData.TALKS` 中的所有演说，供用户选择。仅在桌面端（≥ 1024px）常驻显示，平板端/手机端通过按钮触发抽屉展示。

- 每条演说：演讲者姓名 + 演说标题（中英双语） + CEFR 标签 + 时长 + 已完成标志
- 点击选中 → `tedStore.selectTalk(id)`
- 当前选中：`bg-amber-500/10 border-l-4 border-amber-500`

---

## 五、全局设计约束（K12 适龄标准）

| 约束 | 规格 |
|------|------|
| 英文字幕/内容字体 | ≥ `text-lg` (18px) |
| 中文辅助文字 | ≥ `text-sm` (14px) |
| 输入框字体 | ≥ `text-base` (16px)，防 iOS 缩放 |
| 触控目标 | ≥ 44×44px（`min-h-[44px] min-w-[44px]`） |
| 触控行为 | `touch-manipulation` 类 |
| 背景色 | `#fbf9f5`（主背景）/ `#e8ddd0`（边框） |
| 强调色 | 琥珀色 `amber-500` / `amber-950` |
| 阴影 | 零阴影，扁平化设计 |
| Emoji | 严格禁止，只使用 `lucide-vue-next` 图标 |
| Vue 版本 | Vue 3 `<script setup>` 语法 |

---

## 六、测试规范

每个新组件/store 必须有对应的 `tests/vue3/ted*.test.js` 测试文件，测试套件覆盖：

| 测试文件 | 覆盖重点 |
|---|---|
| `tests/vue3/tedData.test.js` | `resolveVideoStreamUrl`、`parseBilingualVtt` 解析逻辑 |
| `tests/vue3/tedStore.test.js` | `selectTalk`、`markVocabListened`、`vocabUnlocked` 计算、`goToStep` 前置校验、`scoreTask` 评分、`markTalkCompleted` 持久化 |
| `tests/vue3/tedHub.test.js` | 步骤路由渲染、演说列表可见性（三端断点） |
| `tests/vue3/tedVocabPreload.test.js` | 词卡渲染、听读状态切换、解锁 CTA 状态 |
| `tests/vue3/tedVideoPlayer.test.js` | 双语字幕渲染、Loop 模式激活、盲听遮罩、播放控制栏 44px |
| `tests/vue3/tedTaskStudio.test.js` | 填空题答案提交、反馈渲染、配对题交互、评分计算 |
| `tests/vue3/tedShadowing.test.js` | 片段导航、Track A/B 播放控制 |
| `tests/vue3/tedStepBar.test.js` | 步骤高亮、锁定状态 |
| `tests/vue3/serverVideoStream.test.js` | `/api/stream/video/*` 路由参数解析、Content-Type 判断（unit test mock） |

---

## 七、文件清单

**新建文件：**

```
src/
  data/
    tedData.js                          — TED 演说静态数据 + URL 解析工具函数
  stores/
    tedStore.js                         — TED 模块 Pinia store
  components/
    ted/
      TedHub.vue                        — Sprint 2 真实入口（替换 Sprint 1 占位符）
      TedStepBar.vue                    — 四步进度条
      TedTalkList.vue                   — 演说目录列表
      TedVocabPreload.vue               — Step 1 词汇预激活
      TedVideoPlayer.vue                — Step 2 精看精听播放器
      TedTaskStudio.vue                 — Step 3 理解任务工坊
      TedShadowing.vue                  — Step 4 演讲跟读工坊

tests/vue3/
  tedData.test.js
  tedStore.test.js
  tedHub.test.js                        — 原有 Sprint 1 测试扩展
  tedVocabPreload.test.js
  tedVideoPlayer.test.js
  tedTaskStudio.test.js
  tedShadowing.test.js
  tedStepBar.test.js
  serverVideoStream.test.js
```

**修改文件：**

```
server/index.js                         — 新增 /api/stream/video/* 路由
src/components/ted/TedHub.vue           — 替换占位符为真实调度视图
tests/vue3/tedHub.test.js               — 扩展现有测试
```

---

## 八、依赖与风险

| 风险 | 缓解 |
|-----|-----|
| R2 未配置（本地开发环境） | `resolveVideoStreamUrl` 降级至相对路径；测试使用 mock |
| MediaRecorder API 不兼容 | Step 4 跟读仅要求浏览器内录音；不兼容时降级到「仅播放对比」UI |
| VTT 双语解析边界案例 | `parseBilingualVtt` 单独测试，异常时降级为仅英文字幕 |
| 大型视频文件无 R2 可用 | `tedData.js` 提供本地 `public/ted/` fallback 路径（MP4 demo 文件） |
