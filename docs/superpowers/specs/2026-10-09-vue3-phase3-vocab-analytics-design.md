# Hogwarts Audio Vue 3 渐进式重构技术规格书 (Phase 3: 艾宾浩斯生词本与学业仪表盘)

- **作者/制定者**: Antigravity AI & Hogwarts Audio 团队
- **制定日期**: 2026-10-09
- **状态**: Approved / Ready for Implementation
- **目标分支**: `feature/vue3-core-mvp`

---

## 1. 目标与范围

完成 Phase 1 与 Phase 2 后，Phase 3 迁移平台核心记忆复习与数据分析模块：
1. **艾宾浩斯 5 箱记忆生词本 (`VocabularyDrawer.vue`)**：
   - 实施 Leitner 5-Box 科学复习周期（Box 1: 1天，Box 2: 3天，Box 3: 7天，Box 4: 14天，Box 5: 30天）；
   - 3-Tier 操作金字塔：
     - **Primary CTA**：打印 A4 羊皮纸剪裁单词卡 (PDF)（复用 `src/utils/parchmentPdfGenerator.js`）；
     - **Secondary CTA**：导出 Anki TSV/CSV（复用 `src/utils/ankiExport.js`）；
     - **Destructive CTA**：清空生词本（带防误触确认）；
   - 词条包含单词、音标、词性、中文释义、原书例句及章节标记。
2. **魔法学业仪表盘 (`AnalyticsDashboard.vue`)**：
   - 复用 `src/utils/analyticsStore.js` 数据层；
   - 纯 SVG 绘制过去 7 天学习分钟趋势折线/柱状图；
   - 展示魔法打卡连续天数 (Streak Days)、听写正确率及跟读平均分；
   - 时间转换器 (Time-Turner) 补签与成就徽章展示。
3. **顶层容器组装 (`App.vue`)**：
   - 顶栏生词本按钮挂载 `VocabularyDrawer.vue`；
   - 顶栏仪表盘按钮挂载 `AnalyticsDashboard.vue`；
   - 移除占位弹窗，全应用进入 100% 交互可用状态。

---

## 2. 规范约束

- 严格遵守零 Emoji 规范；
- Apple HIG $\ge 44\text{px}$ 触控热区；
- 霍格沃茨暖色羊皮纸设计系统。
