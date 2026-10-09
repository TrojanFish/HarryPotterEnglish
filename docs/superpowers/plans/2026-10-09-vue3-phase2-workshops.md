# Vue 3 Phase 2 (Workshops: Shadowing & Dictation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 A/B 影子跟读工坊 (`ShadowingRecorder.vue`) 与拼写听写工坊 (`DictationStudio.vue`) 迁移至 Vue 3，并在 `App.vue` 中挂载完整互动流。

**Architecture:** 
- 复用 `speechScoring.js` 纯 JS 评分算法与 Web Speech API / MediaRecorder 录音流；
- 实现 `ShadowingRecorder.vue` 提供 Track A / Track B 对比与 0~100% 发音评估；
- 实现 `DictationStudio.vue` 提供 16px 防缩放输入、单句慢放与双通道正误比对；
- 严格遵循零 Emoji 与 Apple HIG $\ge 44\text{px}$ 设计规范。

**Tech Stack:** Vue 3.5, Pinia, Web Speech API, MediaRecorder, `lucide-vue-next`, TailwindCSS 3.

**Spec:** [`docs/superpowers/specs/2026-10-09-vue3-phase2-workshops-design.md`](file:///c:/Users/Administrator/Desktop/harrypotter/docs/superpowers/specs/2026-10-09-vue3-phase2-workshops-design.md)

## Global Constraints

- **零 Emoji 规范**：界面严禁出现任何 Emoji 字符，所有图标必须使用 `lucide-vue-next`。
- **触控热区基准**：所有交互按钮尺寸必须 $\ge 44 \times 44\text{px}$ (Apple HIG 触控热区)。
- **硬件安全回收**：录音关闭时必须销毁 MediaStream 音轨。

---

### Task 1: A/B 影子跟读工坊组件 (`ShadowingRecorder.vue`)

**Files:**
- Create: `src/components/ShadowingRecorder.vue`
- Test: `tests/vue3/shadowingRecorder.test.js`

- [ ] **Step 1: 编写 ShadowingRecorder 单元测试**
- [ ] **Step 2: 运行测试验证失败 (RED)**
- [ ] **Step 3: 编写 `src/components/ShadowingRecorder.vue` (GREEN)**
- [ ] **Step 4: 运行测试验证通过**
- [ ] **Step 5: Commit**

---

### Task 2: 拼写听写工坊组件 (`DictationStudio.vue`)

**Files:**
- Create: `src/components/DictationStudio.vue`
- Test: `tests/vue3/dictationStudio.test.js`

- [ ] **Step 1: 编写 DictationStudio 单元测试**
- [ ] **Step 2: 运行测试验证失败 (RED)**
- [ ] **Step 3: 编写 `src/components/DictationStudio.vue` (GREEN)**
- [ ] **Step 4: 运行测试验证通过**
- [ ] **Step 5: Commit**

---

### Task 3: App.vue 顶层装配与全链路质量验收

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: 在 `src/App.vue` 中挂载两个工坊组件**
- [ ] **Step 2: 运行零 Emoji 审计 `npm run check-emojis`**
- [ ] **Step 3: 运行生产构建校验 `npm run build`**
- [ ] **Step 4: 运行全量 Vue 3 单元测试套件**
- [ ] **Step 5: Commit**
