---
name: refactoring-ui-spec
description: Practical UI design system and engineering checklist adapted from "Refactoring UI" (20 Golden Rules) specifically for the Hogwarts Audio English learning platform. Covers design personality, hierarchy without font-size inflation, generous breathing room, baseline alignment, 3-tier action pyramid, dark-on-light accessible contrast, dual-channel status indicators, accent borders, restrained borders, and intentional empty states.
---

# Hogwarts Audio English · Refactoring UI Design System Specification

> 基于 Tailwind CSS 创始人 Adam Wathan 与资深设计师 Steve Schoger 的《Refactoring UI》20 条设计军规（精选整理自 龙海 @longhaiqwe123），深度结合「霍格沃茨魔法英语」跨端原版有声研学产品的业务属性、青少年视力人因工学及 Apple HIG 交互标准提炼而成的工程化 UI 规范。

---

## 核心设计哲学 (Core Design Philosophy)

在现代 AI 辅助研发时代，“人人都是程序员”已成为现实，但默认生成的 UI 极易陷入**“AI 塑料风”**与**“草台班子感”**：
1. 依赖高饱和纯色，元素互相争抢焦点；
2. 机械平铺 1px 细线边框，界面碎成 Excel 网格；
3. 靠死撑 100% 满屏填补空虚，大屏行长失控导致阅读跳行；
4. 靠放大字号生硬制造层级，导致标题过大膨胀、辅助文字过小难辨。

**UI 设计不是不可捉摸的玄学艺术，而是一套严密、理性、可工程化落地的视觉物理学。**
本规范为全库所有组件（播放器、生词本、字幕卡片、听写工坊、学情罗盘、离线存储）提供标准工程样板。

---

## 20 条设计军规及本项目落地指南 (The 20 Golden Rules)

### 规则 01：为你的设计选择一种个性 (Choose a Personality)
- **设计原理**：设计个性由字体、色彩、圆角、措辞共同决定，同一产品必须保持绝对的全局统一。
- **本项目定位**：**温暖羊皮纸魔法学院风 (Warm Parchment Academy)**。
  - **字体**：标题使用带有衬线/古典魔幻韵味的字体（`font-magical`），正文使用温润易读的人文无衬线字体（`font-reading`）。
  - **色彩**：日间米白羊皮纸基底（`#fbf9f4`）+ 专注琥珀金主色（`#f59e0b`）+ 墨黑高对比字（`#1e1610`）。
  - **圆角**：统一饱满大圆角（按钮 `rounded-xl`、卡片 `rounded-2xl`、弹窗 `rounded-3xl`），彻底杜绝冰冷直角与尖锐刺手感。
  - **措辞**：沉浸式学院文案（“磨亮英语魔杖”、“艾宾浩斯记忆重铸”、“错词魔药重炼”），但信息表达精准克制。

---

### 规则 02：别着急上色 (Limit Your Palette / Start in Greyscale)
- **设计原理**：在设计新组件时，先不要碰色彩与浮夸修饰。在黑白灰或浅米/深灰中仅凭间距、尺寸、字重与对比度把结构立稳。
- **本项目落地**：
  - 新建卡片或抽屉时，先用中性色排布：背景 `bg-white`，次级块 `bg-[#f7f3ed]`，边框 `border-[#e8ddd0]`，文字 `text-[#1e1610]` 与 `text-stone-500`。
  - 骨架稳健后，**仅在核心 Primary CTA 与激活态指示条上点缀琥珀金（`bg-amber-500`）**。

---

### 规则 03：字号并非万能 (Hierarchy is More Than Font Size)
- **设计原理**：过度依赖字号拉开层级会导致主要内容过大膨胀，次要内容过小难辨。用**字重加粗**强化重点，用**浅色降低明度**弱化次要文字。
- **本项目落地**：
  - 主标题：不盲目用 `text-3xl`，采用克制的 `text-base sm:text-lg` 搭配 `font-bold` 或 `font-extrabold`，稳稳统摄全局。
  - 辅助文字：英文句子下方的中文翻译、章节时长、收录时间，采用 `text-xs font-reading text-stone-500`，绝不缩放到 10px 以下。
  - 维持 3 档文字色彩：标题 `text-amber-950`，正文 `text-stone-700`，说明 `text-stone-400`。

```html
<!-- 优化前：字号过大导致版面撕裂 -->
<h1 class="text-3xl font-normal">The Vanishing Glass</h1>
<p class="text-[10px]">Chapter 2 · 08:45</p>

<!-- 优化后：字重统摄，色彩弱化次级信息 -->
<h3 class="text-base font-bold text-amber-950 leading-tight">The Vanishing Glass</h3>
<p class="text-xs text-stone-500 font-mono mt-0.5">Chapter 2 · 08:45</p>
```

---

### 规则 04：反其道而行之：通过弱化来凸显重点 (De-emphasize to Emphasize)
- **设计原理**：当目标元素不够醒目时，不要一味给它“加戏”或加动画，而是**弱化周边的竞争元素**，给背景按下静音键。
- **本项目落地**：
  - `SentenceCard`（字幕卡片）：正在朗读的句子采用 `border-l-4 border-l-amber-500 bg-amber-50/60`；周边的未朗读句子全部降为 `border-l-4 border-l-transparent bg-white hover:bg-stone-50/80`，操作按钮默认 `opacity-0 group-hover:opacity-100`。
  - 正在精听的重点句子自然脱颖而出，无需任何闪烁。

---

### 规则 05：不到万不得已，别用标签 (Don't Overuse Labels)
- **设计原理**：向用户展示数据时，杜绝数据库式的 `标签: 数据值`（如 `时长: 03:45`，`单词: Lumos`）。自明格式的数据直接展示，关键信息置顶。
- **本项目落地**：
  - 音频时长：直接展示 `03:45`，左侧搭配 12px 的 `Clock` 图标，省去“播放时间：”冗余前缀。
  - 单词弹窗：单词直接以大号粗体置顶，下方紧跟音标 `/ˈluːmɒs/`，无需写“单词名称：”或“国际音标：”。
  - 连续打卡：直接展示 `7d` 伴随 `Flame` 图标，直观且紧凑。

---

### 规则 06：操作要有主次之分 (Not All Actions are Equal)
- **设计原理**：操作遵循严格的“重要性金字塔”。每个页面/弹窗**只允许一个主要操作（Primary）**，一到两个次要操作（Secondary），辅助操作用文本/幽灵样式。
- **本项目落地**：
  - **主要操作**：`.duo-btn-primary`（实心琥珀金底色 `bg-amber-500 text-white min-h-[44px]`）。
  - **次要操作**：`.duo-btn-secondary`（暖白底浅棕线框 `border border-[#e8ddd0] bg-white`）。
  - **辅助操作**：纯图标或纯文本链接（如“清除搜索条件”）。
  - **破坏性操作**（清空生词本、删除离线缓存）：初态为低调幽灵按钮（`text-stone-400 hover:text-rose-600`），仅在二次确认弹窗中升为红色主按钮。

---

### 规则 07：从“过度留白”开始 (Start with Too Much White Space)
- **设计原理**：不要用“加法”修补拥挤，而是先给足远超所需的空间，再慢慢微调收紧，确保版面充满松弛呼吸感。
- **本项目落地**：
  - 弹窗与抽屉：移动端内边距 `p-4 sm:p-6`，卡片与卡片之间 `space-y-3` 或 `gap-4`。
  - 单词卡片：单词与音标、释义之间留出 `mb-4` 的清晰段落空间，杜绝文字挤成一团。

---

### 规则 08：不必非得填满整个屏幕 (Don't Force Elements to Fill the Screen)
- **设计原理**：拥有空间不等于必须用满。刻意拉伸表单或单列内容会导致大屏稀疏散乱、阅读横向折返极其疲劳。
- **本项目落地**：
  - 核心精听阅读区：严格约束最大宽度 `max-w-4xl mx-auto`（大屏居中），左右留出自然呼吸区。
  - 拼写闯关工坊：约束 `max-w-2xl mx-auto`。
  - 模态弹窗：约束 `max-w-md`（单词卡片）或 `max-w-xl`（成绩单）。

---

### 规则 09：间距的“亲疏”之别 (Spacing Proximity Law)
- **设计原理**：**组与组之间的间距，一定要显著大于组内元素之间的间距。**
- **本项目落地**：
  - 单词标题与音标（同组）：`mt-0.5`（2px）或 `gap-1`（4px）。
  - 音标与中文释义（不同属性）：`mt-2`（8px）。
  - 整个单词模块与例句模块（不同大组）：`mt-4 pt-3 border-t`（16px）。
  - 用户一眼即可靠视觉亲疏识别结构归属，无需额外绘制分割线。

---

### 规则 10：移动端不要机械等比缩放 (Adaptive Responsive Scaling)
- **设计原理**：大屏幕上尺寸越大的元素，缩放到小屏幕时缩小的比例应该越大。打破“万物皆套 2.5em”的教条。
- **本项目落地**：
  - 桌面端大标题 `text-2xl`（24px），在手机移动端主动收敛为 `text-base`（16px）或 `text-lg`（18px），严防撑爆首屏两行折行。
  - **移动端输入框特例**：字号坚决锁定在 `>= 16px`（`text-base sm:text-sm`），彻底免疫 iOS Safari 聚焦输入时的视口强行放大故障。

---

### 规则 11：控制文本行长与动态行高 (Line Length & Leading)
- **设计原理**：段落行长过长换行容易串行，过短频繁折行打断视线；行高与字号成反比，大标题必须收紧行高，小正文需充足行距。
- **本项目落地**：
  - 英语句子行高设定为 `leading-[1.75]` ~ `leading-[1.8]`，配合单词点词查词的指读需求。
  - 中文翻译行高设定为 `leading-relaxed`（1.625）。
  - 大尺寸标题收紧为 `leading-tight`（1.25）。

---

### 规则 12：以基线对齐，而非居中 (Align by Baseline, Not Center)
- **设计原理**：同行混排不同字号文字时，若使用 `align-items: center`，小字在视觉上会上下漂浮脱节；改用基线对齐让字母隐形底部平齐。
- **本项目落地**：
  - 英文单词与音标、打卡天数与单位 `d`、进度百分比混排时，统一使用 `items-baseline`：

```html
<!-- 优化后：基线平齐，视觉底盘扎实 -->
<div class="flex items-baseline gap-2">
  <span class="text-2xl font-bold text-amber-950 font-magical">Lumos</span>
  <span class="text-xs font-mono text-stone-500">/ˈluːmɒs/</span>
  <span class="text-[10px] text-amber-700 font-bold">魔法专属</span>
</div>
```

---

### 规则 13：你需要的颜色，远比想象中更多 (Rich Color Scale)
- **设计原理**：告别简陋的“在线五色方案”。真实工程需要 8~10 档中性色阶、多档主色阶与语义色阶。
- **本项目落地**：
  - 严谨定义了 `references/design-tokens.md` 中的色阶梯队：
    - 中性羊皮纸色系：`#fbf9f4`（底色）、`#ffffff`（卡片）、`#f7f3ed`（引用块）、`#e8ddd0`（边框线）、`#8b7b6b`（说明字）、`#1e1610`（正文字）。
    - 琥珀金色阶：`amber-50`（淡底）、`amber-100`（徽章底）、`amber-300`（交互边框）、`amber-500`（主按钮）、`amber-950`（深度标题）。

---

### 规则 14：无障碍“浅底深字”（反转对比）(Accessible Dark-on-Light)
- **设计原理**：彩色小标签切忌用“深暗刺眼底 + 白字”，这会严重破坏页面主次层级；反转为“浅柔和底 + 深彩色字”，既达标 WCAG AAA，又柔和不抢戏。
- **本项目落地**：
  - 考纲标签与状态标签全系采用反转对比：
    - 中考核心：`bg-amber-100 text-amber-900 border border-amber-300/80`
    - 挑战难度：`bg-blue-100 text-blue-900 border border-blue-300/80`
    - 掌握成功：`bg-emerald-100 text-emerald-900 border border-emerald-300/80`
    - 错词重炼：`bg-rose-100 text-rose-900 border border-rose-300/80`

---

### 规则 15：色彩不是唯一通道 (Color is Not the Only Channel)
- **设计原理**：严禁仅依靠红绿颜色区分状态，色盲用户或强光下会彻底失效。必须结合图形符号与文字。
- **本项目落地**：
  - 发音评分：不仅有红黄绿，还附带百分比数值（如 `92%`）及官方 O.W.L. 字母等阶（`等阶 O` / `等阶 A`）。
  - 离线下载状态：不仅有绿色，还伴随 `CheckCircle2` 图标与“离线已就绪”文字。
  - 艾宾浩斯复习：不仅有颜色，还标注 `Box 1`、`Box 5 · 永久掌握`。

---

### 规则 16：用强调色边框为设计添彩 (Accent Borders for Focus)
- **设计原理**：在素净卡片上画一条 3-4px 的彩色强调边框，是用最小视觉代价建立视觉重心与高级感的利器。
- **本项目落地**：
  - 当前正在播放的句子：`border-l-4 border-l-amber-500`
  - 当前选中的章节：`border-l-4 border-l-amber-500`
  - 5 分钟精听里程碑线：两侧细线呼应中间琥珀色徽章

---

### 规则 17：图片上的文字，需要稳定的对比度 (Text Contrast Over Images)
- **设计原理**：真实封面照片具有复杂明暗光影，文字直接悬浮必有看不清的角度。必须在背景与文字间增加稳定对比层。
- **本项目落地**：
  - 书籍封面上的英文编码（`HP` / `Book 1`）：背后增加半透明暗色遮罩（`bg-amber-950/40`）或渐变蒙版，确保文字轮廓百分之百清晰。

---

### 规则 18：万物皆有其适用尺寸：切勿随意缩放 (Proportional Asset Containers)
- **设计原理**：矢量图标在放大到 48px/64px 时线条会粗壮笨拙缺乏细节。保持小图标自然尺寸（16-20px），外部包裹带浅背景的圆角容器来扩充体量。
- **本项目落地**：
  - 状态图标与功能卡片头部统一采用容器包装：

```html
<!-- 优化后：精致的 18px 图标 + 44px 舒适圆角容器 -->
<div class="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-300/80 flex items-center justify-center text-amber-700 shrink-0">
  <Sparkles size={18} />
</div>
```

---

### 规则 19：慎用边框，善用底色差与留白 (Subtle Surface Deltas)
- **设计原理**：克制处处画 1px 灰色实线的冲动，避免页面像一张密密麻麻的 Excel 表格。优先用“底色微差”与“自然留白”分割空间。
- **本项目落地**：
  - 页面大背景为浅米白 `#fbf9f4`，主要卡片采用纯白 `#ffffff`，两者天然产生柔和对比。
  - 列表条目之间通过 `space-y-2.5` 留白隔开，普通条目边框颜色设为极淡的 `#e8ddd0`，甚至省去横向贯穿分割线。

---

### 规则 20：用心设计“空状态” (Intentional & Actionable Empty States)
- **设计原理**：空状态是用户对新功能的初体验。切勿只留下一句冷冰冰的“无数据”。必须提供友好的插画/图标、鼓励性文案及最关键的**核心 CTA 引导按钮**，并主动隐藏无关的筛选器。
- **本项目落地**：
  - 生词本为空时：展示带有微弱呼吸感的 `Bookmark` 容器图标，文案：“魔杖尚未收录新词 · 轻点任意英文单词即可一键收录”，配备主按钮：“去精听挑词入库”。
  - 离线缓存为空时：展示 `HardDrive` 图标，文案：“魔法行囊尚空 · 提前下载即可脱网流畅精听”。

---

## 零 Emoji 铁律 (Strict Zero Unicode Emoji Rule)

全项目代码、数据文件（`.js`, `.jsx`, `.json`）、测试用例及 UI 文案中，**绝对严禁出现任何 Unicode Emoji**（如 📚, ✨, 📱, 🎧, 🏆, 🔥 等）。
所有视觉符号一律采用 `lucide-react` 矢量 SVG 图标，确保在 iOS、Android、Windows、macOS 任何设备上渲染风格高度纯粹、克制、统一。

---

## 快速自查指南 (Related References)
- 设计色系与间距阶梯表：[design-tokens.md](./references/design-tokens.md)
- 20 条设计军规组件快速核验表：[checklist.md](./references/checklist.md)
