# Hogwarts Audio 3.0 | 霍格沃茨魔法英语 · 新一代专业在线英语学习平台

<div align="center">

![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8.svg)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2_Ready-f38020.svg)
![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1_Sync-f38020.svg)
![Local-First](https://img.shields.io/badge/Architecture-Local--First-10b981.svg)
![Docker](https://img.shields.io/badge/Docker-Supported-2496ed.svg)
![Vercel](https://img.shields.io/badge/Vercel-Deploy_Ready-black.svg)
![Tests Passing](https://img.shields.io/badge/Tests-143%2F143_Passing-brightgreen.svg)

**专为英语学习者量身打造的沉浸式原版有声小说精听、艾宾浩斯背词与 A/B 影子跟读评测平台**  
*听原版原声 — 磨纯正英音 — 艾宾浩斯复习 — A/B 影子跟读 — 智能拼写听写*

[核心功能](#核心学习功能体系) • [加速架构](#流媒体与边缘分发加速架构) • [多平台部署指南](#多平台部署指南) • [本地开发与测试](#本地开发与测试)

</div>

---

## 项目简介

**Hogwarts Audio 3.0** 是一套融合**第二语言习得科学 (SLA)**、**艾宾浩斯遗忘曲线**与 **Apple Human Interface Guidelines (HIG)** 人机工学的新一代专业在线英语学习平台。

针对传统英语精听工具“长句容易视觉疲劳”、“音频加载缓冲漫长”、“无法精准对比口音差距”以及“生词背完就忘”的核心痛点，Hogwarts Audio 3.0 进行了全方位重塑：
- **科学阶梯**：对齐欧洲语言通用框架（CEFR），7 卷阶梯式进阶（A2 入门 ➔ B1 进阶 ➔ B2 独立 ➔ C1 熟练）；
- **英雄聚焦**：单句精听黄金行高与 72% 非焦点降噪，配套隐身斗篷盲听模式；
- **A/B 跟读工坊**：Track A（原版英音）与 Track B（学生录音）双轨并列对比回放；
- **艾宾浩斯工坊**：Leitner 5-Box 科学记忆分布，支持一键打印可剪裁的 A4 羊皮纸单词卡 PDF；
- **全链路流式加速**：告别全量音频阻塞等待，HTTP 206 Range 分片直出，起播延迟缩短 95%。

---

## 核心学习功能体系

### 1. CEFR 欧洲语言框架国际科学分级
- **7 卷阶梯化难度**：
  - *HP1*：CEFR A2 入门（魔法学徒 — 基础词汇与日常句型）
  - *HP2 ~ HP3*：CEFR B1 进阶（魔法探索 — 故事叙述与复合语境）
  - *HP4 ~ HP6*：CEFR B2 独立（魔法进阶 — 复杂论述与丰富文学表达）
  - *HP7*：CEFR C1 熟练（傲罗精通 — 高阶小说原版流利阅读）
- **双通道无障碍指示 (Dual-Channel Accessibility)**：色彩药丸 + 文本标号 + 边框对比双重反馈。

### 2. 精听多模态教室「英雄聚焦」排版
- **黄金阅读行高 (`leading-[1.85]`)**：正在朗读的句子应用 `.reading-hero-sentence`，搭配 4px 琥珀色左侧引导线与柔和底衬；
- **背景降噪与视线防飘**：非当前朗读句子自动应用 `.reading-inactive-sentence`，降低 72% 视觉干扰；
- **隐身斗篷盲听模式 (Blind Mode)**：非当前句子自动覆盖魔法迷雾遮罩，强制先听音辨意，杜绝依赖字幕的被动假听；
- **断点续学魔法书架**：自动持久化记录最后阅读章节与精确秒数（`hp_last_position`），书架一键“继续精听”。

### 3. 影子跟读工坊 A/B 双轨对比播放 (Shadowing & Scoring)
- **Track A 原声轨道**：专属 `.track-a-badge` 标识，配置独立播放按钮，随时提取英式原声示范；
- **Track B 录音轨道**：专属 `.track-b-badge` 标识，提供录音时长倒计时与状态双通道指示；
- **A/B 盲听/交替对比**：一键无缝在原版英音与自己录音间交替切播，精准听辨连读、重音与语调差距；
- **Apple HIG ≥44px 触控**：工坊内所有操作按钮满足大拇指触控热区标准，防止误触。

### 4. 艾宾浩斯智能生词本与 5 箱记忆工坊
- **Leitner 5-Box 科学分布栏**：
  - `Box 1 · 初学` (1天周期)
  - `Box 2 · 巩固` (3天周期)
  - `Box 3 · 熟记` (7天周期)
  - `Box 4 · 长效` (14天周期)
  - `Box 5 · 永久掌握` (30天周期)
  实时统计各箱单词存量与「今日待复习」到期单词数量。
- **3-Tier 操作金字塔**：
  - **主操作 (Primary CTA)**：`【 打印羊皮纸单词卡 (PDF) 】`（一键生成支持 A4 打印与沿线剪裁的复习卡片）；
  - **次操作 (Secondary Actions)**：`【 启动艾宾浩斯背词 】`、`【 导出 Anki (TSV) 】`、`【 导出 CSV 】`；
  - **安全操作 (Destructive Action)**：`【 清空生词本 】`（带防误触双重确认）。

### 5. 拼写听写工坊 (Dictation Studio)
- **移动端 16px 防缩放**：严格实施 16px `text-base` 规范，彻底杜绝 iOS Safari 聚焦输入框时的恶意页面自动缩放；
- **双通道实时反馈**：结合绿色对勾 `Check`、红色叉号 `X` 图标与边框高亮，实现清晰正误提示；
- **单句慢速原声重听**：支持 0.8x 慢放与循环磨耳朵；
- **错词自动进入生词本**：拼错或点击羽毛笔提示的词汇，自动标注并归档到艾宾浩斯生词本 Box 1 备战重炼。

### 6. 魔法行囊（离线优先存储）
- 基于 IndexedDB 本地客户端存储（`HogwartsOfflineDB`），支持整章音频（MP3）与精听字幕（VTT）一键离线保存；
- 断网无网络环境下 0ms 纯本地秒开，所有精听、跟读、查词功能 100% 正常运行。

### 7. 本地优先增量同步（Local-First Sync + Cloudflare D1）
- **0ms 本地瞬时响应**：学习打卡与生词操作在本地毫秒级保存，断网完全无感；
- **时间戳 LWW 冲突仲裁**：基于毫秒级时间戳与软删除标记，多设备增量同步不冲突、不丢词；
- **6 位免密通行码配对**：每台设备自动生成 6 位魔法通行码（如 `HP-8F29`），跨设备输入即可一秒绑定并合并数据。

---

## 流媒体与边缘分发加速架构

Hogwarts Audio 3.0 采用前端 Range 解耦与网络边缘分级的流媒体协同加速体系：

```
                                  【用户点击播放】
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
         【本地离线 IndexedDB】                           【在线云端流媒体】
     已缓存章节？直接 Blob 零网络开播 (0ms)              原生 HTTP 206 Range 分片直出
                                                                 │
                                ┌────────────────────────────────┴────────────────────────────────┐
                                ▼                                                                 ▼
                    【Cloudflare Anycast CDN】                                       【Node.js 服务端保底代理】
             配置 VITE_R2_PUBLIC_DOMAIN 直连边缘缓存                             支持 HTTP Range 流式转发
             全球 300+ 节点就近直出 (TTFB < 100ms)                              Cache-Control: public 30天缓存
```

- **废弃 24MB 全量 Blob 阻塞**：废除全量下载旧逻辑，浏览器原生按需请求首包（256KB），起播耗时由 27 秒降低至 1 秒以内；
- **支持 Cloudflare R2 自定义域名直连**：配置 `VITE_R2_PUBLIC_DOMAIN` 后直通边缘网络，完全绕过服务器中转；
- **持久化分片缓存**：服务端分片响应头配置 `Cache-Control: public, max-age=2592000, immutable`。

---

## 多平台部署指南

本项目全面适配 **Docker、Vercel、Cloudflare Pages、GitHub Pages**：

### 1. Docker 部署（自建服务器 / NAS）
```bash
# 启动容器（后台运行并绑定 3001 端口）
docker compose up -d --build

# 访问地址
# http://<你的服务器IP>:3001
```

### 2. Vercel 部署
1. 登录 [Vercel](https://vercel.com)，导入此仓库。
2. Framework Preset 选择 **Vite**。
3. 在 **Environment Variables** 添加 R2 凭据（见下表）。
4. 点击 **Deploy** 即可完成构建与全球分发。

### 3. Cloudflare Pages 部署（推荐）
1. 登录 Cloudflare Dashboard，创建 Pages 项目并连接此仓库。
2. 构建命令填入 `npm run build`，输出目录填入 `dist`。
3. **绑定 R2 存储桶**：
   - Pages 项目 **Settings** -> **Functions** -> **R2 bucket bindings**；
   - Variable name 填入：`HP_AUDIO_BUCKET`；
   - 选择你的 R2 存储桶（例如 `fluentfox-podcast`）。
4. **绑定 D1 数据库**（多设备同步，可选）：
   - 在 Cloudflare 控制台创建 D1 数据库 `hp-sync-db`，执行 [`d1/schema.sql`](d1/schema.sql)；
   - Pages 项目 **Settings** -> **Functions** -> **D1 database bindings**，变量名填 `DB`。

---

## 环境变量说明

| 变量名 | 说明 | 示例值 |
| :--- | :--- | :--- |
| `PORT` | 服务启动端口 | `3001` |
| `R2_ACCOUNT_ID` | Cloudflare 账户 ID | `419c6c17e4bdfa104bdf7155314eb714` |
| `R2_ACCESS_KEY_ID` | R2 S3 访问密钥 ID | `ff65060b70c46b5b158779f382d6494b` |
| `R2_SECRET_ACCESS_KEY` | R2 S3 安全访问密钥 | `89c5cbda11b68ba399842be73fb2f1b7c6a4...` |
| `R2_BUCKET_NAME` | 存储桶名称 | `fluentfox-podcast` |
| `VITE_R2_PUBLIC_DOMAIN` | （可选）Cloudflare R2 自定义 CDN 域名，开启边缘直出加速 | `audio-cdn.yourdomain.com` |
| `VITE_API_BASE` | （可选）静态前端跨域指向外部后端地址 | `https://your-app.vercel.app` |

---

## 常用快捷键

| 按键 | 功能说明 |
| :--- | :--- |
| **Space（空格键）** | 播放 / 暂停音频 |
| **← / →（左 / 右方向键）** | 跳转至 上一句 / 下一句 |
| **R** | 重新播放当前句 |
| **L** | 开启 / 关闭单句精听循环 |
| **Tab** | 听写工坊中获取“羽毛笔提示” |
| **Enter** | 听写工坊中提交并进入下一句 |

---

## 本地开发与测试

```bash
# 1. 安装依赖
npm install

# 2. 启动前端 Vite 开发服务器（http://localhost:3000）
npm run dev

# 3. 启动后端 R2 代理服务（http://localhost:3001）
npm run server

# 4. 运行全套 143 项自动化测试（覆盖 CEFR分级、英雄聚焦、Leitner 5箱、A/B跟读、流式Range解耦等）
npm test

# 5. 生产打包与多维合规审查
npm run build
npm run verify-security
npm run check-emojis
```

---

## Superpowers 智能体工程体系 (Agent SDLC)

本项目全面采用 **[obra/superpowers](https://github.com/obra/superpowers)** 规范化研发智能体工作流：
- **规范与技能库 (`.agents/skills/`)**：集成 `brainstorming`、`test-driven-development`、`systematic-debugging`、`verification-before-completion` 等核心工程技能；
- **设计规范对齐**：全站严格遵循 `educational-ui-spec`（零 Emoji、暖色羊皮纸、苹果 HIG 44px 触控标准）与 `refactoring-ui-spec`（无字体膨胀、三层操作金字塔）。

---

## 许可证

本项目基于 [MIT License](LICENSE) 开源。音频及原著文本版权归原作者及出版方所有，本项目仅供非商业教育学习与学术交流使用。
