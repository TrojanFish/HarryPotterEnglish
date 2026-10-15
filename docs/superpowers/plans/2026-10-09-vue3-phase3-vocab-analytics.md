# Vue 3 Phase 3 (Vocabulary & Analytics) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 迁移艾宾浩斯 5 箱记忆生词本 (`VocabularyDrawer.vue`) 与魔法学业分析仪表盘 (`AnalyticsDashboard.vue`)，并完成 `App.vue` 全量功能闭环。

**Architecture:**
- 复用 `parchmentPdfGenerator.js`、`ankiExport.js` 与 `analyticsStore.js`；
- 实现 `VocabularyDrawer.vue`（5 箱分布栏、PDF 打印、Anki 导出）；
- 实现 `AnalyticsDashboard.vue`（SVG 曲线图、连续打卡天数）；
- 组装至 `App.vue` 并完成零 Emoji 审计与生产构建校验。

**Tech Stack:** Vue 3.5, Pinia, SVG, `lucide-vue-next`, TailwindCSS 3.

**Spec:** [`docs/superpowers/specs/2026-10-09-vue3-phase3-vocab-analytics-design.md`](file:///c:/Users/Administrator/Desktop/harrypotter/docs/superpowers/specs/2026-10-09-vue3-phase3-vocab-analytics-design.md)

---

### Task 1: 艾宾浩斯 5 箱记忆生词本组件 (`VocabularyDrawer.vue`)

**Files:**
- Create: `src/components/VocabularyDrawer.vue`
- Test: `tests/vue3/vocabularyDrawer.test.js`

- [ ] **Step 1: 编写 VocabularyDrawer 单元测试**
- [ ] **Step 2: 运行测试验证失败 (RED)**
- [ ] **Step 3: 编写 `src/components/VocabularyDrawer.vue` (GREEN)**
- [ ] **Step 4: 运行测试验证通过**
- [ ] **Step 5: Commit**

---

### Task 2: 魔法学业分析仪表盘组件 (`AnalyticsDashboard.vue`)

**Files:**
- Create: `src/components/AnalyticsDashboard.vue`
- Test: `tests/vue3/analyticsDashboard.test.js`

- [ ] **Step 1: 编写 AnalyticsDashboard 单元测试**
- [ ] **Step 2: 运行测试验证失败 (RED)**
- [ ] **Step 3: 编写 `src/components/AnalyticsDashboard.vue` (GREEN)**
- [ ] **Step 4: 运行测试验证通过**
- [ ] **Step 5: Commit**

---

### Task 3: App.vue 顶层全功能闭环装配与全链路审计

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: 装配生词本抽屉与学业仪表盘模态窗**
- [ ] **Step 2: 运行零 Emoji 审计 `npm run check-emojis`**
- [ ] **Step 3: 运行全量 Vue 3 单元测试套件**
- [ ] **Step 4: 运行生产构建校验 `npm run build`**
- [ ] **Step 5: Commit**
