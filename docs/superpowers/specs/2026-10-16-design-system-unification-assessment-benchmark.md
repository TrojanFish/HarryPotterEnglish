# Design Specification: 全站 UI 风格对齐 AssessmentHub 标杆统一

## 1. Background & Executive Intent
在 Hogwarts Audio 3.0 的迭代演进中，[`AssessmentHub.vue`](file:///c:/Users/KeiyeeYu/Desktop/HarryPotterEnglish/src/components/assessment/AssessmentHub.vue)（能力评定大厅）成功构建了高质感的纯正霍格沃茨美学：温润羊皮纸画布、琥珀金魔法重音、无多余大阴影的平面层次、严谨的 Apple HIG 44px 触控靶心与全景双通道指示。

然而，早期构建的精听四大工坊（`StepListening`, `StepShadowing`, `StepDictation`, `StepVocabReview`）、全局导航步骤栏（`StepTabBar`）、智能音频播放器（`SmartAudioPlayer`）、书架与生词本抽屉（`BookshelfDrawer`, `VocabularyDrawer`）以及 TED 模块部分视图仍不同程度地残留了早期通用 SaaS 的“科技蓝（`#2563eb`）”与生硬的“冷灰白底（`bg-white` / `#e4e4e7` / `text-[#18181b]`）”。

本规格的目标是以 `AssessmentHub.vue` 为**绝对单一视觉基准（Single Source of Truth for Visual Design）**，对全站核心视图进行全景式美学对齐与工程重塑，实现从听、读、录、写到测评全链路的一致性沉浸体验。

---

## 2. Design Token System（以 AssessmentHub 为基准的设计令牌）

### 2.1 色彩与底衬色谱（Palette & Surfaces）
| 令牌用途 | 标杆值 | 替换旧值 |
|---|---|---|
| **全局画布底色 (Page Canvas)** | `bg-[#fbf9f5]` | `bg-white`, `bg-[#f8f8f6]` |
| **英雄重点卡片 (Hero / Featured Card)** | `bg-[#f5efe6]` | 纯白卡片或浅蓝底 `bg-blue-50` |
| **常规内容卡片 (Standard Content Card)** | `bg-white/70` 或 `bg-[#faf6ee]` | 生硬冷白 `bg-white` |
| **标准边框线 (Border Token)** | `border-[#e8ddd0]` | 冷锌灰 `border-[#e4e4e7]`, `border-[#d4d4d8]` |
| **次级内分隔线 (Sub-separator)** | `border-[#e8ddd0]/60` | `border-[#e4e4e7]/60` |
| **主调强调色 (Primary Brand Accent)** | `amber-700` (`#b45309`), `amber-800` (`#92400e`) | 科技蓝 `#2563eb`, `blue-600` |
| **高亮徽章底衬 (Accent Pill Fill)** | `bg-amber-500/15` 或 `bg-amber-100/90` | `bg-blue-50`, `bg-blue-100` |
| **高亮徽章边框 (Accent Pill Border)** | `border-amber-300` 或 `border-amber-400/50` | `border-blue-200`, `border-blue-300` |

### 2.2 文本层级与排版规范（Typography）
| 层次 | 字体族与颜色 | 适用元素 |
|---|---|---|
| **标题与原著文学语句** | `font-serif text-stone-900` | 页面大标题、卡片主标题、精听朗读句、跟读示范句、卡片单词 |
| **重要强调正文** | `font-sans text-stone-800 font-semibold` | 关键指标、重要选项、主操作文本 |
| **常规阅读正文** | `font-sans text-stone-700 leading-relaxed` | 中文释义、题目说明、段落解析 |
| **辅助与元数据** | `font-sans text-stone-500 text-xs` | 时间戳、章节序号、小字注释、次级信息 |
| **等宽数据串** | `font-mono text-stone-700` 或 `text-amber-900` | 播放时间戳、进度数值、连胜次数、通行码 |

### 2.3 3-Tier Action Pyramid（三层操作金字塔）
- **Tier 1 (Dominant Primary)**:
  `bg-amber-700 hover:bg-amber-800 active:scale-[0.98] text-amber-50 font-bold rounded-xl min-h-[44px] min-w-[44px] touch-manipulation`
  （每个页面仅有 1 个统领性主操作，如“开启评定”、“开始录音”、“提交听写”）
- **Tier 2 (Secondary Action)**:
  `bg-[#fbf9f5] hover:bg-[#f2ece2] border border-[#e8ddd0] active:scale-[0.98] text-stone-800 font-medium rounded-xl min-h-[44px] min-w-[44px] touch-manipulation`
  （并列次要动作，如“回放录音”、“切换模式”、“重置练习”）
- **Tier 3 (Tertiary / Ghost Action)**:
  `text-stone-600 hover:text-stone-900 active:scale-[0.98] text-xs py-2 px-3 rounded-lg min-h-[44px] min-w-[44px] touch-manipulation`
  （说明展开、重置参数、辅助小工具等）

### 2.4 人机工学与状态双通道（Ergonomics & Accessibility）
- **触控靶心**：所有交互元素严格遵循 `min-h-[44px] min-w-[44px]`，并携带 `touch-manipulation`。
- **微交互触感**：轻微按压缩放 `active:scale-[0.98]` 或 `active:scale-95`。
- **双通道指示**：禁止单独依靠颜色表达状态。例如激活态必须同时呈现“4px 左侧引导线 + 图标变亮 + 文字加粗 + 琥珀色微衬”。
- **绝对零 Emoji**：全站 100% 使用 `lucide-vue-next` 矢量图标，杜绝任何 Unicode Emoji。

---

## 3. Detailed Component Transformation Specifications

### 3.1 批次 1：精听核心四大工坊（Session Steps）

#### A. `src/components/session/StepListening.vue`（精听多模态主课堂）
1. **画布与背景**：外层容器改用 `bg-[#fbf9f5]`，右侧信息栏改用 `bg-[#f5efe6] border-l border-[#e8ddd0]`。
2. **字幕流卡片（Cue Cards）**：
   - 常规卡片：`bg-white/75 border-[#e8ddd0] hover:border-amber-300 hover:bg-white`。
   - 当前播放句高亮：`border-l-4 border-l-amber-600 border-[#e8ddd0] bg-amber-500/10`（替换 `#2563eb` 蓝线）。
   - 时间戳与编号：当前激活句显示 `text-amber-800 font-bold`，非激活句显示 `text-stone-400`。
   - 英文句子：采用人文衬线 `font-serif leading-[2.0]`，词级悬停使用 `hover:text-amber-700 hover:underline`。
   - 中文释义：`text-stone-600 border-t border-[#e8ddd0]/60`。
3. **右侧当前句核心词汇面板**：
   - 标题与统计药丸：改用 `text-stone-800`，数量药丸改用 `bg-amber-100 text-amber-900 border-amber-300`。
   - 词汇卡片：改用 `bg-white/80 border-[#e8ddd0]`，悬停 `hover:border-amber-400`。

#### B. `src/components/session/StepShadowing.vue`（影子跟读工坊）
1. **画布与背景**：改用 `bg-[#fbf9f5]`。
2. **跟读目标句卡片**：
   - 替换冷灰为暖羊皮纸：`bg-[#f5efe6] border border-[#e8ddd0] rounded-2xl`。
   - 句序徽章：`bg-white/80 border-[#e8ddd0] text-stone-600`，内置 `Mic` 图标改用 `text-amber-700`。
   - 英文句子：`font-serif text-stone-900`，中文释义 `text-stone-600`。
3. **A/B 双轨对比控制卡片**：
   - 原声示范 Track A：`bg-white/70 border-[#e8ddd0]`，播放按钮采用 `bg-[#fbf9f5] hover:bg-[#f2ece2] border-[#e8ddd0] text-stone-800`，内置图标 `text-amber-700`。
   - 我的录音 Track B：录音中状态保留鲜明红点 `bg-rose-600`；停止/开始录音主操作按钮采用 `bg-amber-700 hover:bg-amber-800 text-amber-50 font-bold`（录音中为 `bg-rose-700 hover:bg-rose-800`）。
   - 用户录音回放：采用 `border-amber-300 bg-amber-50 text-amber-800` 激活态。

#### C. `src/components/session/StepDictation.vue`（拼写听写工坊）
1. **画布与背景**：改用 `bg-[#fbf9f5]`。
2. **头部卡片与游戏模式切换器**：
   - 模式切换栏（词块拼图/重点挖空/全拼）：改用 `bg-[#f5efe6] border border-[#e8ddd0]` 凹槽，激活标签使用 `bg-amber-700 text-amber-50 font-bold`，未激活标签使用 `text-stone-600 hover:text-stone-900 hover:bg-white/60`。
   - 连胜徽章：改用 `bg-amber-100 text-amber-900 border border-amber-300`。
3. **听写答题交互区**：
   - 填空输入框：未激活 `border-[#e8ddd0] bg-white text-stone-900`，聚焦态 `focus:border-amber-600 focus:ring-amber-200`。
   - 词块拼图候选词：未选中 `bg-white/80 border-[#e8ddd0] text-stone-800 hover:border-amber-400 hover:bg-amber-50/50`；选中 `bg-amber-700 text-amber-50 border-amber-800`。
   - 提交主按钮：采用 `bg-amber-700 hover:bg-amber-800 text-amber-50 font-bold`。

#### D. `src/components/session/StepVocabReview.vue`（艾宾浩斯复习流）
1. **画布与背景**：改用 `bg-[#fbf9f5]`。
2. **Leitner 5 箱指示器**：
   - 容器改用 `bg-[#f5efe6] border border-[#e8ddd0] rounded-2xl`。
   - 5 箱按钮组：激活箱号采用 `bg-amber-700 text-amber-50 font-bold`，未激活采用 `bg-white/80 border-[#e8ddd0] text-stone-700 hover:bg-[#fbf9f5]`。
3. **3D 羊皮纸翻转单词卡片**：
   - 正面卡片：`bg-white/90 border-[#e8ddd0] rounded-2xl`，单词使用 `font-serif font-bold text-stone-900`，音标使用 `font-mono text-stone-500`，例句使用 `text-stone-600 border-t border-[#e8ddd0]/60`。
   - 背面卡片：`bg-[#faf6ee] border-[#e8ddd0] rounded-2xl`，中文释义 `text-stone-800`。
4. **记忆掌握度反馈操作栏**：
   - 没记住（降级）：`bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100`。
   - 模糊（保持）：`bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100`。
   - 牢记（晋级）：`bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100`。

---

### 3.2 批次 2：步骤流程导航栏与智能播放器（Core Nav & Player）

#### A. `src/components/layout/StepTabBar.vue`（学习步骤流程栏）
1. **背景与边框**：改用 `bg-[#fbf9f5] border-b border-[#e8ddd0]`。
2. **四步流药丸按钮**：
   - 激活步骤：改用 `bg-amber-700 text-amber-50 font-bold`，序号徽标为白圈金字 `border-white text-white`。
   - 未激活步骤：改用 `text-stone-600 hover:text-stone-900 hover:bg-[#f2ece2]`，序号徽标为 `border-stone-400 text-stone-500`。

#### B. `src/components/player/SmartAudioPlayer.vue`（底部智能播放控制台）
1. **背景与边框**：外层容器改用 `bg-[#fbf9f5] border-t border-[#e8ddd0]`。
2. **顶部长条进度条**：
   - 轨道槽：`bg-[#e8ddd0]`。
   - 已播放填充条：改用霍格沃茨琥珀金 `bg-amber-600 group-hover:bg-amber-700`。
   - 时间戳文字：`text-stone-500 font-mono`。
3. **播放控制按钮**：
   - 主播放/暂停大圆钮：保持居中统领地位，采用 `bg-amber-700 hover:bg-amber-800 text-amber-50`。
   - 单句循环按钮：激活时改用 `bg-amber-100 text-amber-900 border border-amber-300 font-semibold`；未激活时为 `text-stone-600 hover:text-stone-900 hover:bg-[#f2ece2]`。
   - 播放倍速药丸：`bg-white/80 border border-[#e8ddd0] text-stone-700 hover:bg-[#f2ece2]`。

---

### 3.3 批次 3：核心抽屉与辅助模态（Drawers & Modals）

#### A. `src/components/BookshelfDrawer.vue`（书架抽屉）
1. **抽屉面板背景**：改用 `bg-[#fbf9f5] border-l border-[#e8ddd0]`。
2. **HP1~HP7 书籍切换标签**：
   - 激活书籍标签：改用 `bg-amber-50/80 border-amber-600 text-amber-900 font-bold`。
   - 未激活书籍标签：`bg-white/70 border-[#e8ddd0] text-stone-600 hover:bg-[#f2ece2]`。
3. **章节流列表**：
   - 激活章节条目：`bg-amber-50/70 border-amber-500 border-l-4 border-l-amber-600 text-stone-900`。
   - 播放中呼吸图标：`text-amber-700 animate-pulse`。

#### B. `src/components/VocabularyDrawer.vue`（艾宾浩斯生词本抽屉）
1. **抽屉面板背景**：改用 `bg-[#fbf9f5] border-l border-[#e8ddd0]`。
2. **搜索栏与箱号过滤胶囊**：
   - 输入框改用 `bg-white border-[#e8ddd0] text-stone-900 focus:border-amber-600`。
   - 激活过滤胶囊：`bg-amber-700 text-amber-50`。
3. **生词卡片流**：
   - 卡片背景 `bg-white/85 border-[#e8ddd0]`，单词字型采用 `font-serif font-bold text-stone-900`，例句采用 `text-stone-600`。

#### C. `src/components/AnalyticsDashboard.vue` / `StorageManagerModal.vue` / `ShortcutsModal.vue`
- 全面统一对话框外框与内衬卡片至 `#fbf9f5` 与 `#f5efe6`，边框线统一为 `#e8ddd0`，按钮遵循三层金字塔规则。

---

### 3.4 批次 4：TED 视听演练体系（TED Ecosystem）
- **`TedVocabPreload.vue`**：词汇预习卡与听音打标按钮统一采用琥珀金色谱。
- **`TedTaskStudio.vue`**：完形填空输入框与连线卡片去除冷白，统一至 `#fbf9f5` 与 `#e8ddd0`。
- **`TedShadowing.vue`**：跟读卡片与录音操作栏对齐 `StepShadowing.vue` 升级后的琥珀金标准。
- **`TedTalkList.vue`**：TED 列表卡片与当前激活高亮线统一为琥珀金。
- **`TedStepBar.vue`**：四步流切换栏完全对齐 `StepTabBar.vue`。

---

## 4. Verification & Testing Strategy

1. **样式回归验证测试套件**：
   - 编写专门测试 `tests/vue3/designSystemUnification.test.js`：
     - 断言各重构组件中已消除原生 `#2563eb` 及未绑定的冷灰 `#e4e4e7`。
     - 断言各重构组件均继承 `bg-[#fbf9f5]` 与 `border-[#e8ddd0]` 羊皮纸基准。
     - 断言各重构组件交互触点均满足 `min-h-[44px]` Apple HIG 规范。
     - 断言全局零 Unicode Emoji。
2. **既有测试零回归防线**：
   - 确保 `npm test` 中所有 455 个测试继续全绿通过。
3. **全栈构建与安全审计**：
   - `npm run build` 构建成功且无类型与资源加载错误。
   - `npm run check-emojis` 全局扫描 findings 必须为 0。
   - `npm run verify-security` 确保 0 凭据泄露。
