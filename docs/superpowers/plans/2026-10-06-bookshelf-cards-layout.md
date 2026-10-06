# Bookshelf View 4-Card Single-Row & Typography Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the 4 cards in `BookshelfView` into a single 4-column row (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) and align the internal 3-tier text layout and metrics across all cards, ensuring "今日契约" and "连续打卡" have consistent font hierarchies with leading numbers.

**Architecture:** Combine the horizontal task strip and the hero continue card into a unified 4-card grid container in `src/components/BookshelfView.jsx`. Each card adopts a strict 3-tier visual hierarchy: (1) Header with icon, label, and compact badge/indicator, (2) Body with large bold primary metric/status (leading numbers), (3) Footer with secondary detail icon, label, and status.

**Tech Stack:** React 19, Tailwind CSS, Lucide React icons, Node.js native test runner (`node:test`).

**Spec:** In-chat approved design (Option A: 4 cards merged in single row + Style 1: leading large numbers aligned across cards).

## Global Constraints
- Strictly 100% Lucide React SVG icons; zero Unicode emojis.
- Apple HIG ergonomics: interactive touch targets must be at least 44x44px.
- Warm Parchment Academy palette (`#fbf9f4`, `#e8ddd0`, `#1e1610`, `amber-500`, `amber-950`).
- Strict zero-shadow design (`shadow-none`, rely on 1.5px border and micro backgrounds).

## Review Focus
1. When `todayListeningSeconds >= 300` (daily goal accomplished), Card 1 gracefully transitions from remaining minutes to success state without breaking baseline alignment.
2. When `effectiveDueCount === 0`, Card 3 displays "记忆封印稳固" while maintaining the exact same height and baseline as Card 1 and Card 2.
3. When `currentBookObj` or `currentChapterObj` is present, Card 4 renders the compact continue-listening card with chapter name, book title, progress, and 44px play CTA.
4. On wide desktop screens (>=1024px), all 4 cards appear on the exact same row with equal width and balanced vertical alignment.
5. On smaller viewports (<1024px), cards adapt gracefully (`grid-cols-1 sm:grid-cols-2` or mobile scroll).

---

### Task 1: Add Unit Tests for 4-Card Row & Layout Consistency

**Files:**
- Modify: `tests/bookshelfView.test.js`

- [ ] **Step 1: Write the failing tests**
Add subtests in `tests/bookshelfView.test.js`:
- Test 4.4: 4 cards rendered in unified responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
- Test 4.5: "今日契约" and "连续打卡" share consistent leading big-number structure and baseline alignment.
- Test 4.6: "今日契约" eliminates duplicate percentages and bloated 36px ring in favor of compact indicator.
- Test 4.7: Card 4 ("继续精听") renders alongside the 3 task cards in the same grid.

- [ ] **Step 2: Run test suite to verify tests fail or reflect new requirements**
Run `node --test tests/bookshelfView.test.js`.

---

### Task 2: Implement 4-Card Single-Row Grid and Consistent Typography in BookshelfView

**Files:**
- Modify: `src/components/BookshelfView.jsx`

- [ ] **Step 1: Update container layout**
Replace separate Section 2 (`Horizontal Task Strip`) and Section 3 (`Hero Continue Card`) with a unified 4-card grid:
`<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">`

- [ ] **Step 2: Harmonize Card 1 (今日契约)**
- Header: `<Sparkles size={12} className="text-amber-600" /> 今日契约` on left, compact goal indicator on right.
- Body: Big number first `<span className="font-mono font-extrabold text-lg">{remainingMinutes}</span><span className="text-sm font-bold text-amber-950">分钟待听</span>` (or `今日达成！`).
- Footer: `<Clock size={11} className="text-amber-500" /> 已听 {todayMinutes} 分钟` on left, `<span className="font-mono font-semibold text-amber-800">{goalPercent}%</span>` on right.

- [ ] **Step 3: Harmonize Card 2 (连续打卡)**
- Header: `<Flame size={12} className="text-orange-500" /> 连续打卡` on left, streak badge on right.
- Body: Big number first `<span className="font-mono font-extrabold text-lg">{streakDays}</span><span className="text-sm font-bold text-amber-950">天连胜</span>`.
- Footer: `<RotateCcw size={11} className="text-amber-500" /> 时间转换器 x{timeTurnersCount}`.

- [ ] **Step 4: Harmonize Card 3 (艾宾浩斯复习)**
- Header: `<BrainCircuit size={12} className="text-indigo-600" /> 艾宾浩斯复习` on left, status indicator on right.
- Body: `<span className="font-mono font-extrabold text-lg">{effectiveDueCount}</span><span className="text-sm font-bold text-amber-950">词待复习</span>` (or `记忆封印稳固`).
- Footer: `<Bookmark size={11} className="text-indigo-500" /> 共收录 {vocabCount} 词`.

- [ ] **Step 5: Implement compact Card 4 (继续精听)**
- Header: `<Headphones size={12} className="text-amber-600" /> 继续精听` on left, 44px play icon button on right.
- Body: Chapter title `{currentChapterObj.cnTitle || currentChapterObj.title}` (truncated, `font-magical font-bold text-sm sm:text-base text-amber-950`).
- Footer: `<BookOpen size={11} className="text-amber-600" /> {currentBookObj.cnTitle || currentBookObj.title}` + time progress and mini progress bar.

---

### Task 3: Zero-Regression Verification

- [ ] **Step 1: Run unit tests**
Run `npm test` and verify all tests pass.

- [ ] **Step 2: Run build check**
Run `npm run build` to verify clean production build.

- [ ] **Step 3: Run emoji check**
Run `npm run check-emojis` to ensure zero emojis.
