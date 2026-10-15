# CEFR 能力成长地图与 O.W.L.s 期末评定报告 — Sprint 4 设计规范

**版本:** 1.0  
**日期:** 2026-10-15  
**负责人:** Hogwarts Audio Engineering  
**目标学习者:** K12 及以下（≤ 15 岁）  
**关联需求:** `hogwarts-audio-transformation-plan.md` — 七、模块五 学习进度与能力评估系统  

---

## 一、范围与目标

### 1.1 Sprint 4 交付边界

Sprint 4 为平台构建完整的第二语言习得（SLA）量化评估中枢与里程碑进阶系统：

| 交付单元 | 核心职责 | 变动类型 |
|---------|---------|---------|
| `src/stores/analyticsStore.js` | 汇聚多端学习行为（精听时长、词汇 L1–L4 掌握分布、跟读/听写均分），运行 CEFR 等级推导算法与五维雷达图数学模型，管理 O.W.L.s 测验历史与评定报告 | 全新 Store |
| `src/stores/navigationStore.js` | 扩充应用顶层导航状态，支持 `'assessment'` 视图切换 | 状态增强 |
| `src/components/assessment/AssessmentHub.vue` | 能力评定大厅三端主视图（巫师等级勋章、纯 SVG 五维雷达图、学习数据概览看板、主行动金字塔） | 全新视图 |
| `src/components/assessment/OwlsExamModal.vue` | 10 分钟快速 O.W.L.s 等级模拟考（听音辨意 3 题 + 词汇默写 3 题 + 名篇跟读 1 题） | 全新模态组件 |
| `src/components/assessment/OwlsCertificateModal.vue` | 魔法部考试管理局官方风格 A4 羊皮纸成绩单查看器与打印/PDF 导出服务 | 全新模态组件 |
| `src/utils/owlsCertificateExport.js` | 纯 CSS/HTML A4 羊皮纸官方成绩单生成器（防伪水印、学院双重印章、五维得分表、导师评语） | 全新工具库 |
| 导航组件群改造 | `DesktopSidebarVue.vue`、`TabletRailVue.vue`、`MobileBottomNavVue.vue` 增设「能力评定」入口 | 导航集成 |
| 测试套件 | 算法数学逻辑、Store 状态机、雷达多边形计算、组件规范与集成测试 | 单元与集成测试 |

### 1.2 成功标准（Definition of Done）

- **双轨评定闭环**：
  1. 日常精听、跟读、听写数据实时汇聚，自动动态判定当前 CEFR 等级与五维雷达图数值。
  2. 随时可发起沉浸式 O.W.L.s 模拟考，考毕综合日常与模考表现出具最终评定。
- **纯原生轻量化**：五维能力雷达图采用纯 Vue 响应式 SVG 多边形几何计算渲染，不引入任何重度第三方图表依赖（如 Echarts/Chart.js），零外部 CDN 脚本。
- **三端完整适配**：
  - 手机端（≤ 767px）：纵向卡片流，雷达图自适应撑满，底部 Bottom Sheet 唤起证书与考试。
  - 平板端（768–1023px）：双栏布局（左侧巫师徽章与指标看板，右侧五维雷达图与测验入口）。
  - 桌面端（≥ 1024px）：三栏宽屏大厅（左侧巫师档案，中间能力雷达与进阶梯队，右侧评定记录与证书库）。
- **可打印羊皮纸官方成绩单**：支持一键调起浏览器打印，生成符合 A4 纸张比例的羊皮纸成绩单，带有魔法部权威证书版式。
- **工程合规规范**：严格零 Unicode Emoji（全部采用 `lucide-vue-next`）、Apple HIG 44px 最小触控靶心、温润羊皮纸色系、全量测试通过（300+ 题）、构建与安全零报错。

---

## 二、能力评估数学模型与数据架构

### 2.1 综合 CEFR 进阶与等级评定模型

系统将学员能力定义为四个阶梯（对应 CEFR 框架）：

| CEFR 级别 | 巫师头衔 | 官方认定能力标准 | 触发与保持门槛 |
|----------|---------|----------------|--------------|
| **A2** | 魔法学徒 (Apprentice) | 基础生活词汇感知，简单句型听辨 | 词汇总量 $\ge 30$，累计精听 $\ge 30\text{min}$，跟读分 $\ge 60$ |
| **B1** | 魔法探索者 (Explorer) | 原著故事叙述理解，连续听力 $\ge 5\text{min}$ | 词汇总量 $\ge 80$（$L3 \ge 30$），精听 $\ge 90\text{min}$，跟读 $\ge 70$ |
| **B2** | 魔法进阶者 (Adept) | TED 演说精听，观点提取与辨析 | 词汇总量 $\ge 160$（$L4 \ge 40$），TED $\ge 3$ 期，跟读 $\ge 80$ |
| **C1** | 傲罗精通 (Auror) | 复杂论述剖析，流利跟读与深度拼写产出 | 词汇总量 $\ge 300$（$L4 \ge 100$），高阶 TED 完成，综合率 $\ge 85\%$ |

综合评级计算器算法：
$$\text{Score}_{\text{composite}} = (\text{ListeningScore} \times 0.3) + (\text{VocabScore} \times 0.35) + (\text{ProductionScore} \times 0.35)$$

### 2.2 五维能力雷达几何模型（0–100 分）

1. **听音辨析力（Auditory Recognition）**：
   - 指标：精听播放累计分钟数 + 查词听音播放次数。
   - 满分映射：$\min(100, \text{minutes} \times 0.5 + \text{audioListens} \times 1.5)$。
2. **词汇习得深度（Vocabulary Depth）**：
   - 指标：Nation 四层中 L3（回想）与 L4（产出）在总生词库中的占比，以及 Box 5 永久记忆词数。
   - 满分映射：$(L3\text{Count} \times 0.4 + L4\text{Count} \times 0.6) / \max(1, \text{totalVocab}) \times 100$。
3. **语境理解力（Contextual Comprehension）**：
   - 指标：TED 任务完成率 + 视频双语精看覆盖率。
   - 满分映射：TED 理解任务均分 $\times 0.7 + \text{min}(30, \text{completedTalks} \times 10)$。
4. **口语跟读流利度（Oral Shadowing）**：
   - 指标：原著跟读录音与 TED 影子跟读得分加权滚动平均分。
   - 满分映射：历史录音平均分（默认保底基线 60 分）。
5. **拼写产出精确度（Written Production）**：
   - 指标：听写工坊正确词数占比 + TED 关键句填空正确率。
   - 满分映射：听写全对率 $\times 0.6 + \text{clozeScore} \times 0.4$。

SVG 5 边形极坐标到笛卡尔坐标转换公式：
对于维度 $i \in [0, 4]$（顶角朝上 $\theta_0 = -90^\circ$）：
$$\theta_i = -90^\circ + i \times 72^\circ$$
$$x_i = R_{\text{center}} + \left( R_{\text{max}} \times \frac{\text{score}_i}{100} \right) \times \cos(\theta_i)$$
$$y_i = R_{\text{center}} + \left( R_{\text{max}} \times \frac{\text{score}_i}{100} \right) \times \sin(\theta_i)$$

### 2.3 `analyticsStore.js` 数据结构

```javascript
// localStorage key: 'hp_analytics_state'
{
  listeningSeconds: 5400,      // 累计精听总秒数
  listeningSessionsCount: 18,  // 学习会话数
  shadowingHistory: [          // 跟读历史记录 (保留最近 50 次)
    { id: 'sh-1', score: 85, timestamp: 1776250000000, type: 'hp' }
  ],
  dictationHistory: [          // 听写记录
    { id: 'dict-1', correctCount: 8, totalCount: 10, timestamp: 1776251000000 }
  ],
  examHistory: [               // 历次 O.W.L.s 测验记录
    {
      id: 'owls-20261015-01',
      timestamp: 1776252000000,
      cefrResult: 'B1',
      title: '魔法探索者',
      compositeScore: 84,
      dimensions: {
        auditory: 80,
        vocabDepth: 88,
        comprehension: 82,
        shadowing: 85,
        production: 85
      },
      mentorFeedback: '听觉意群捕捉准确，建议进一步在听写中巩固高级动词拼写。'
    }
  ]
}
```

---

## 三、O.W.L.s 模拟考与证书渲染引擎

### 3.1 O.W.L.s 测验 3 阶段工作流（`OwlsExamModal.vue`）

1. **Stage 1: 听力主旨与细节辨析（Listening Comprehension）**
   - 播放 1 段 15–20 秒的原版音频片段（支持重听 1 次）。
   - 给出 3 道单项选择题（考查语意推断与态度）。
2. **Stage 2: 核心词汇拼写产出（Dictation & Spelling）**
   - 播放包含目标生词的单句音频。
   - 学员输入对应空格中的关键词（验证 L4 产出能力）。
   - 3 题，自动容错标点与大小写。
3. **Stage 3: 经典名篇金句朗读挑战（Oral Shadowing Challenge）**
   - 展示原著或 TED 核心金句（如 *"It is our choices, Harry, that show what we truly are, far more than our abilities."*）。
   - 学员录音跟读，即时进行音准与节奏评测（得分 0–100）。
4. **评定结算**：
   - 结合日常学习积累与本次考试得分，生成综合评级报告。
   - 若达到升级门槛，触发「巫师等级进阶仪式」动画（羊皮纸光环与勋章升级）。

### 3.2 魔法部官方 A4 羊皮纸证书规范（`OwlsCertificateModal.vue`）

- 尺寸：标准国际 A4（$210\text{mm} \times 297\text{mm}$），支持打印时 `@page { size: A4 portrait; margin: 0; }`。
- 视觉风格：
  - 底色：`#fdfbf7` 羊皮纸仿古质感，外围双层烫金纹理边框（深铜色 `#5c4033` + 细金线 `#c5a059`）。
  - 顶部：魔法部考试管理局（*Ministry of Magic — Ordinary Wizarding Level Examination Authority*）大印。
  - 正文：学员姓名/代号、认证 CEFR 级别（如 **Level B1: 魔法探索者**）、五维雷达图打印版、各科详细评级（*Outstanding 卓越* / *Exceeds Expectations 良好* / *Acceptable 及格*）。
  - 底部：防伪防串改魔纹编码、评定委员会印章、学科导师诊断寄语。

---

## 四、三端自适应交互规范

| 视图区域 | 手机端（≤ 767px） | 平板端（768–1023px） | 桌面端（≥ 1024px） |
|---------|------------------|---------------------|-------------------|
| **导航入口** | 底部导航栏新增「评定」Tab (`MobileBottomNav`) | 左侧 64px 侧轨新增图标按钮 (`TabletRail`) | 左侧 240px 侧边栏专属菜单项 (`DesktopSidebar`) |
| **主看板** | 单列流式：巫师头衔卡片 $\to$ 雷达图 $\to$ 指标栅格 | 双栏并排：左侧档案指标（50%）+ 右侧雷达大图（50%） | 三栏大厅：左侧档案 + 中间雷达图与进阶路径 + 右侧测验记录与证书架 |
| **雷达图展示** | 宽高 280px，居中响应 | 宽高 360px，带悬浮指标提示 | 宽高 420px，完整展示五维得分数值与进阶阈值线 |
| **模态框展示** | 全屏 Bottom Sheet，带顶部下拉把手 | 居中浮动弹窗，宽度 680px | 居中典雅大弹窗，宽度 860px |

---

## 五、实施任务分解概要

1. **Task 1: `analyticsStore.js` 统计聚合引擎与算法模型**（数据持久化、CEFR 推导、雷达图计算函数、单元测试）
2. **Task 2: 全局导航系统接入**（`navigationStore.js`、`MobileBottomNav`、`TabletRail`、`DesktopSidebar`、`AppShell` 联动）
3. **Task 3: `AssessmentHub.vue` 能力大厅三端主看板**（巫师等级勋章、SVG 魔法雷达图、数据指标卡片）
4. **Task 4: `OwlsExamModal.vue` 10 分钟快速模拟考系统**（三关考题流程、作答打分、即时进阶仪式）
5. **Task 5: `OwlsCertificateModal.vue` & 羊皮纸 A4 官方成绩单导出**（打印样式、防伪印章、评语生成）
6. **Task 6: 听力/跟读/听写/TED 全链路埋点对接**（在精听、跟读、听写完成时自动记录数据至 `analyticsStore`）
7. **Task 7: 全链路集成验证、零 Emoji 审计与生产构建收敛**（`npm test`, `npm run build`, `npm run check-emojis`）
