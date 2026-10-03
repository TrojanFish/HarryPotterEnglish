---
name: educational-ui-spec
description: Complete UI and design system specification for the Hogwarts Audio English learning app. Enforces zero emojis, shadow-free flat aesthetic, Duolingo-style micro-interactions, Apple HIG touch targets (44px), warm parchment theming, and adolescent readability standards.
---

# Hogwarts Audio English · Educational UI Design Specification (UI 规范指南)

本规范是「霍格沃茨魔法英语」跨端界面体验的唯一设计标准，专门针对中国初中生/青少年的学习认知特点、移动端触摸人因工学及苹果/现代 Web 标准制定。

---

## 一、视觉设计哲学与色彩体系 (Visual Philosophy & Color Tokens)

### 1. 温暖羊皮纸明亮学院风 (Warm Parchment Academy)
- **基底背景色**：`#fbf9f4`（日间羊皮纸浅米白色，柔和不刺眼，经由中国近视防控人因标准优化）。
- **主交互琥珀金**：`#f59e0b`（Primary 金色，代表魔法光芒与高光专注），边框辅色 `#d97706`。
- **森林墨绿色**：`#10b981` / `#059669`（Success 绿色，代表打卡成功、正确答案、复习掌握）。
- **格兰芬多赤红色**：`#ef4444` / `#dc2626`（Danger 红色，代表拼写错误、重听、重置）。
- **羊皮纸基线边框**：`#eee5d8`（1.5px 浅赭石边框，用于卡片与容器边界）。
- **正文高对比度文字**：`#1e1610`（主标题与单词），`#2d261e`（次级文字），`#78716c`（WCAG AAA 辅助提示字）。

### 2. 扁平去阴影法则 (Strict Zero-Shadow Rule)
- ❌ **严禁使用浮夸的投影**：不得在按钮、卡片、模态框底部使用 `shadow-lg`, `shadow-xl`, `shadow-2xl`。
- ✅ **依靠高精细 1.5px 边框与微底色建立空间层级**：使用 `.duo-card`、`.duo-btn-*`、`.duo-pill` 构建沉浸、整洁、不杂乱的扁平化界面。

---

## 二、图形与图标规范 (Icons & Graphics)

### 1. 零 Emoji 铁律 (Zero Unicode Emoji Rule)
- ❌ **全应用代码、数据、文案中严禁出现任何 Unicode Emoji**（如 📚、✨、🎉、🔥、🏆 等）。
- ✅ **100% 使用 Lucide SVG 矢量图标**（`lucide-react`）：
  - 学习/书籍：`BookOpen`
  - 魔法/成就：`Sparkles`, `Award`
  - 发音/听力：`Volume2`, `Play`, `Pause`, `Headphones`
  - 搜索/清空：`Search`, `X`
  - 跟读/录音：`Mic`, `Check`
  - 词汇考纲：`GraduationCap`（进阶词），`BookOpen`（中考词）

---

## 三、触控人因与移动端布局标准 (Touch Ergonomics & Mobile-First)

### 1. 最小触控热区 (Apple HIG 44×44 pt Rule)
- 所有可交互按钮、选项、关闭叉号、清空按钮的点击面积**不得低于 44×44 pt**。
- 小型图标按钮需包裹 `.duo-touch-target` 或赋予至少 `p-2` / `min-h-[44px]`，杜绝学生在 iPhone 上因误触导致受挫。

### 2. 零延迟触控 (0ms Tap Latency)
- 所有交互控件必须包含 `touch-action: manipulation;`，消除移动端浏览器的 300ms 双击缩放延迟。

### 3. iOS 视口安全区 (Safe Area Insets)
- 顶部粘性栏：必须应用 `.pt-safe`，避免遮挡 iPhone 灵动岛与刘海。
- 底部导航与胶囊播放器：必须应用 `.pb-safe`，距离 Home Indicator 留出至少 14px 呼吸间距。
- 模态框与抽屉：移动端呈现为 **Bottom Sheet**，顶部居中保留胶囊拉手（`w-10 h-1.5 rounded-full bg-stone-300`），滚动区域包裹 `.ios-scroll` 防止过度回弹。

---

## 四、青少年排版与认知负荷规范 (Adolescent SLA Typography)

### 1. 虚拟键盘防放大机制 (The 16px Rule)
- 所有移动端 `<input>` 和 `<textarea>` 计算字号**不低于 16px**（`text-base`），彻底杜绝 iOS Safari 唤起键盘时的视口自动缩放。
- 英语听写与搜索框必须声明 `autoCapitalize="none"`、`autoCorrect="off"`、`spellCheck={false}`。

### 2. 英文精听排版行距
- 双语字幕行高采用 `leading-[1.75]`，配合单句卡片内边距，确保单词间隙疏朗、易于指读。
- 严格遵循 W3C CLREQ 避头尾规则（`line-break: strict; word-break: break-word; overflow-wrap: anywhere;`）。

### 3. 词汇考纲标签分级
- 生词卡片与生词本条目统一展示考纲徽章（配对应 Lucide 图标）：
  - **原著魔法专属**（`bg-red-800 text-amber-200` 或 `bg-red-100 text-red-900`，配 `Sparkles`）
  - **中考核心词汇**（`bg-amber-100 text-amber-900`，配 `BookOpen`）
  - **进阶拓展词汇**（`bg-stone-100 text-stone-700`，配 `GraduationCap`）
