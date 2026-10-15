# 全站 UI 组件与布局规格标准化重构实施计划 (Global Design Tokens & Layout Standardization)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 彻底解决全站播放栏重构后遗留的组件级微观不一致问题，建立统一的「模态弹窗系统」、「16px iOS 安全输入框」、「3级按钮高度与圆角阶梯」、「页面版心防跳动安全边距」、「512px 统一抽屉」以及「标准三段式空状态」工程规范。

**Architecture:**
1. **模态弹窗系统**：统一全站 6 个 Modal 的遮罩（`bg-black/60 backdrop-blur-sm p-0 sm:p-4`）、移动端拉手（`w-10 h-1.5 my-2.5`）、关闭按钮（$\ge 44\text{px}$ `rounded-xl` 白底线框），消灭 `OwlsCertificateModal` 32px 及 `HouseSelectorModal` 40px 的违规触控。
2. **输入框系统**：实施 Apple HIG 与青少年视力防错标准，统一搜索框高度为 `h-11 min-h-[44px]`，字号严格采用 `text-base sm:text-xs`（防止 iOS Safari 聚焦时视口强行放大跑位）。
3. **按钮金字塔**：一级主要提交 CTA 统一为 `h-12 min-h-[48px] rounded-xl text-sm font-bold`；二级操作按钮统一为 `h-11 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold`；选项卡分段器统一为 `min-h-[38px] px-3`。
4. **页面版心与边距**：移动端水平内边距全局统一为 `px-4`（消除标签切换时左右 12px 与 16px 切换造成的跳动）；底部留白统一为 `pb-36 pb-safe`；浏览型页面统一 `max-w-6xl`，精读训练型统一 `max-w-4xl`。
5. **右侧滑动抽屉**：书架选单与生词本抽屉桌面端统一为 `sm:max-w-lg` (512px)，Header 统一为 `px-4 sm:px-6 py-3.5 sm:py-4`。

**Tech Stack:** React 18, Tailwind CSS, Lucide React, Node.js Test Runner.

---

## Global Constraints

- **严格零 Emoji 铁律**：全项目 UI 与字符串严禁任何 Unicode Emoji，100% 使用 `lucide-react` 矢量图标。
- **Apple HIG 触控底线**：所有交互元素（关闭按钮、Tab、选项、搜索清空等）触控面积严格 $\ge 44 \times 44\text{pt}$。
- **暖色羊皮纸设计系统**：基底 `#fbf9f4`，卡片 `#ffffff`，边框线 `#e8ddd0`，强调金 `#f59e0b`，墨黑正文 `#1e1610`。
- **扁平去阴影法则**：禁止滥用浮夸高斯投影，使用 1.5px 边框与微底色建立空间层级。
- **iOS Safari 16px 规则**：移动端输入框字号 $\ge 16\text{px}$，避免 iOS 键盘唤起时页面视口强行放大。

---

## Tasks

- [x] **Task 1: 模态弹窗系统标准规格统一 (Modal Dialogs System)**
  - [x] 1.1: 在 `src/components/WordModal.jsx` 中统一外层遮罩为 `fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn`，拉手条为 `w-10 h-1.5 my-2.5`，关闭按钮升级为 44px 白底边框。
  - [x] 1.2: 在 `src/components/analytics/OwlsCertificateModal.jsx` 中将原 32px 关闭按钮（`w-8 h-8 rounded-lg`）升级为标准 44px 规格（`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white`），遮罩统一为 `bg-black/60`，主按钮设为 `min-h-[48px] rounded-xl`。
  - [x] 1.3: 在 `src/components/common/HouseSelectorModal.jsx` 中将关闭按钮由 40px 升级为 44px，确认按钮统一为 `min-h-[48px] rounded-xl`。
  - [x] 1.4: 在 `src/components/ShortcutsModal.jsx` 中将关闭按钮升级为 44px 标准容器，分段 Tab 选项卡提升至 `min-h-[38px]`。
  - [x] 1.5: 在 `src/components/StorageManagerModal.jsx` 中统一遮罩为 `bg-black/60`，关闭按钮统一为 44px。
  - [x] 1.6: 在 `src/components/SrsFlashcardModal.jsx` 中统一关闭按钮为 44px，主操作按钮统一为 `min-h-[48px] rounded-xl`。
  - [x] 1.7: 在 `src/components/dictation/DictationSummaryModal.jsx` 中统一主按钮与重做按钮为 `rounded-xl`。

- [x] **Task 2: 输入框与搜索栏 16px iOS 防缩放规范 (Inputs & Search Bars)**
  - [x] 2.1: 在 `src/components/VocabularyDrawer.jsx` 中将搜索输入框高度由 `h-10` 升级为 `h-11 min-h-[44px]`，字号升级为 `text-base sm:text-xs`，内边距统一为 `pl-10 pr-9`，补充 `autoCapitalize="none" autoCorrect="off" spellCheck={false}`。
  - [x] 2.2: 在 `src/components/BookShelfDrawer.jsx` 中将章节搜索输入框高度升级为 `h-11 min-h-[44px]`，字号升级为 `text-base sm:text-xs`，内边距统一为 `pl-10 pr-9`。

- [x] **Task 3: 页面级版心容器与安全内边距防跳动 (Page Containers & Insets)**
  - [x] 3.1: 在 `src/components/BookshelfView.jsx` 中统一版心为 `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-36`。
  - [x] 3.2: 在 `src/components/AnalyticsDashboard.jsx` 中移动端内边距由 `px-3` 统一为 `px-4`，版心设为 `max-w-6xl mx-auto`，底部留白 `pb-36 pb-safe`。
  - [x] 3.3: 在 `src/components/DictationStudio.jsx` 中移动端内边距由 `px-3` 统一为 `px-4`，版心设为 `max-w-4xl mx-auto`，底部留白 `pb-36 pb-safe`。
  - [x] 3.4: 在 `src/components/podcast/PodcastPlayerView.jsx` 与 `src/components/AudioPlayer.jsx` 中，移动端水平内边距统一收敛为 `px-4 sm:px-6`，底部保留 `pb-36 pb-safe`。

- [x] **Task 4: 右侧滑动抽屉与空状态规范化 (Drawers & Empty States)**
  - [x] 4.1: 在 `src/components/BookShelfDrawer.jsx` 与 `src/components/VocabularyDrawer.jsx` 中，桌面端抽屉最大宽度统一为 `sm:max-w-lg` (512px)，Header 统一为 `px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#e8ddd0] bg-white`。
  - [x] 4.2: 在 `src/components/StorageManagerModal.jsx` 与 `src/components/VocabularyDrawer.jsx` 中统一三段式空状态卡片（14号图标容器、双层文本、主行动 CTA）。

- [x] **Task 5: 自动化测试套件与全量验证 (Verification & Gates)**
  - [x] 5.1: 创建 `tests/uiConsistencyStandardization.test.js` 验证 Modal 关闭键 $\ge 44\text{px}$、遮罩规范、输入框 16px 属性、页面内边距 `px-4`。
  - [x] 5.2: 运行 `node --test tests/uiConsistencyStandardization.test.js`。
  - [x] 5.3: 运行 `npm test`（确保所有 250+ 测试通过）。
  - [x] 5.4: 运行 `npm run check-emojis` 与 `npm run verify-security`。
  - [x] 5.5: 运行 `npm run build`。
  - [x] 5.6: 提交并推送到远端仓库。
