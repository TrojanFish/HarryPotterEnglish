# 🧙‍♂️ Hogwarts Magic English | 霍格沃茨魔法英语 · 青少原版有声精听

<div align="center">

![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8.svg)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2_Ready-f38020.svg)
![Docker](https://img.shields.io/badge/Docker-Supported-2496ed.svg)
![Vercel](https://img.shields.io/badge/Vercel-Deploy_Ready-black.svg)

**专为小学高年级、初中生及广大英语初学者量身打造的入门级英文小说原著音频精听平台**  
*听魔法小说 · 磨纯正英音 · 查原著百科 · 趣味拼写闯关*

[在线演示](#-体验模式) • [核心功能](#-专为中小学生设计的核心功能) • [多平台部署指南](#-多平台部署指南) • [常见问题与排错](#-常见问题与排错)

</div>

---

## 📖 项目简介

本项目旨在通过经典的**青少年版《哈利·波特》（Harry Potter）**等入门级原版有声小说，帮助中小学学生在沉浸式的魔法世界中摆脱枯燥死记硬背，自然建立英语语感、语音连读识别与核心词汇积累。

针对初学英语的孩子长时间阅读容易疲劳、长难句容易挫败的痛点，我们深度重塑了 UI/UX，采用**日间护眼学院色**、**大字号清晰排版**、**点击即查纯正英音音标**、**游戏化拼写大闯关**与**施咒跟读评分**，让孩子像玩游戏一样爱上听英语小说！

---

## ✨ 专为中小学生设计的核心功能

### 1. ☀️ 魔法学院·日间护眼主题（默认模式）
- **温润米白护眼纸张（`#fbf8f2`）**：告别刺眼纯白反光与沉闷黑夜，字迹对比度柔和清晰，呵护少儿视力。
- **加粗大字号（18px - 22px）**：字号可在【标准 / 大字 / 特大】之间一键自由切换，行距宽松不拥挤。
- **🌙 星空夜读模式**：夜晚阅读支持一键切换为深邃星空夜读守护版（`#0f172a`）。

### 2. 🎧 双语精听与 Lumos 黄金光晕聚焦
- **原版音频同步朗读**：时间戳毫米级同步，自动平滑居中滚动当前朗读句子。
- **Lumos 黄金光晕高亮**：正在朗读的句子附带左侧暖金饰带与柔光光环，引导孩子专注当前句。
- **随时重听与单句循环**：每句专属 `🔊 听这句` 与 `🔁 慢速精听循环`，方便反复揣摩连读弱读。
- **双语译文开关**：可自由隐藏/显示中文翻译，满足“盲听猜测”与“精听理解”不同学习阶段需求。

### 3. 📇 适合少儿的魔法单词卡（即点即查即听）
- **点击任意单词**：立刻弹出专为中小学打造的词汇卡片，无需打开厚重词典。
- **🔊 纯正英音发音朗读**：一键试听地道英式发音（与原版小说朗读口音完美契合）。
- **国际音标 (IPA) 与词性**：清晰标明 `/ˈmʌɡ.əl/`、`[名词 n.]` 等考点必备信息。
- **中小学核心必背释义**：简明清晰，拒绝枯燥冗长、晦涩深奥的成人例句。
- **⚡ 霍格沃茨原著魔法百科**：独家收录原著魔法专属名词典故（如 *Muggle、Quidditch、Golden Snitch、Gryffindor* 等），满足孩子的好奇心！
- **⭐ 收入魔法生词本**：一键收藏，自动关联原著上下文语境。

### 4. ✏️ 游戏化“魔法拼写大闯关”（Spell Quest）
- **告别枯燥整段打字**：专为中小学生设计的填词槽交互，再也不用担心打错标点或记不住长句而放弃。
- **实时正误反馈**：输入正确的单词立刻变为醒目翠绿色并打勾；拼错单词友好提示应填词汇。
- **⭐⭐⭐ 星级评价体系**：零提示全对获得 3 颗魔法星，满星挑战激发孩子成就感！
- **🔥 连对连击奖励**：连续答对触发 `连对 3 句！+30 魔法值` 弹幕动画。
- **🪶 羽毛笔提示 (Tab)**：遇到卡住的生词，按羽毛笔自动提示首字母或补齐单词。
- **🔊 慢速磨耳朵重听**：支持一键重新播放本句慢速音频。

### 5. 🪄 底部老魔杖播放器
- **超大主播放键（48px）**：适配 iPad / 平板与电脑，大拇指触摸极其舒适。
- **⏪ 后退 5 秒**：初学者没听清某个发音时，一键后退 5 秒重新听。
- **🐢/🐇 初学者专属语速器**：
  - 🐢 **0.75x 慢速磨耳朵**（初学者听清每个音节连读的神器）
  - 🐢 **0.85x 稍慢进阶**
  - ⚡ **1.0x 原版标准语速**
  - 🐇 **1.15x 挑战加速**
- **老魔杖进度条**：黄金发光笔尖拖拽，实时显示当前朗读到第几句（如 `第 3 / 45 句`）。

### 6. 🎙️ 施咒跟读与 AI 语音打分（Shadowing）
- 浏览器麦克风实时录制学生自己的发音，波形动效直观反馈音量。
- **O.W.L. 魔法成绩单**：
  - 🌟 **90+ 分**：*O.W.L. 杰出 (Outstanding)! 赫敏级纯正英音！*
  - ✨ **80-89 分**：*超出预期 (Exceeds Expectations)! 发音非常棒！*
  - 👍 **70-79 分**：*合格 (Acceptable)! 已经很流畅啦！*
- **逐词发音比对**：绿色高亮发音标准的词汇，橙色标出需要加油重读的音节。

### 7. 📜 魔法生词本 & 翻转卡片（Flashcards）
- 支持像抽认卡一样正面看英文+音标，背面翻转看中文释义与出处例句。
- **一键导出 Anki / CSV**：标准 Anki TSV 格式导出，支持导入 Anki 手机 App 随时随地刷词。

### 8. 🎒 魔法行囊（离线畅听）
- 基于 IndexedDB 本地客户端存储，支持将整章音频（MP3）与精听字幕（VTT）一键下载至本地。
- 在无网环境（如坐车、飞机、图书馆）下无需网络也能顺畅听小说、跟读、拼写。

### 9. 📲 PWA 桌面与手机 App 支持
- 支持在 Chrome、Safari、Edge 浏览器中“一键安装到桌面”，宛如原生应用般快捷打开。

---

## 🚀 多平台部署指南

本项目已全面适配 **Docker、Vercel、Cloudflare Pages、GitHub Pages** 四大主流部署方案：

```
                    ┌─► 🐳 Docker 部署 (自建服务器 / NAS / 单容器)
                    ├─► ▲ Vercel 部署 (推荐，Serverless 全球 CDN)
代码库 (main 分支) ─┼─► ⚡ Cloudflare Pages (边缘函数 + R2 原生零流量费)
                    └─► 📄 GitHub Pages (纯静态免费托管)
```

### 1. 🐳 Docker 部署（推荐云服务器 / 树莓派 / NAS）
本项目内置多阶段优化 `Dockerfile`，单个容器即可同时运行前端静态资源与后端 S3/R2 音频流媒体代理：

```bash
# 启动容器（后台运行并绑定 3001 端口）
docker compose up -d --build

# 访问地址
# http://<你的服务器IP>:3001
```

### 2. ▲ Vercel 部署（推荐个人建站）
仓库根目录已配置 [`vercel.json`](vercel.json) 与 [`api/index.js`](api/index.js)：
1. 登录 [Vercel 官网](https://vercel.com)，点击 **Add New Project**，导入此仓库。
2. Framework Preset 选择 **Vite**。
3. 在 **Environment Variables** 添加 R2 凭据（见下表）。
4. 点击 **Deploy** 即可自动完成构建，获得全球加速域名。

### 3. ⚡ Cloudflare Pages 部署（推荐全球边缘网络）
仓库内置 [`functions/api/[[path]].js`](functions/api/[[path]].js)，原生支持 Cloudflare Edge Functions：
1. 登录 Cloudflare Dashboard，进入 **Workers & Pages** -> **Create application** -> **Pages**。
2. 连接 GitHub 仓库，构建配置选择 `Vite`，构建命令 `npm run build`，输出目录 `dist`。
3. 在 Pages 设置中绑定 R2 存储桶：
   - **Settings** -> **Functions** -> **R2 bucket bindings**。
   - Variable name 填入：`HP_AUDIO_BUCKET`。
   - 选择你的 R2 存储桶：`fluentfox-podcast`。
4. 点击保存部署，享受 R2 与 Pages 之间完全零出口流量费的极速流媒体。

### 4. 📄 GitHub Pages 部署（纯前端静态托管）
项目已配置相对路径打包（`base: './'`），并内置 GitHub Actions 工作流 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)。

> ⚠️ **首次部署 GitHub Pages 报错排错指南**：  
> GitHub 新创建的仓库默认会报 `Get Pages site failed` 或部署失败，这是**完全正常的**！因为 GitHub 要求仓库管理员必须在后台开启一次 GitHub Actions 权限。  
> **只需两步即可解决**：
> 1. 打开你的 GitHub 仓库页面，点击顶部 **Settings（设置）**。
> 2. 在左侧菜单点击 **Pages**。
> 3. 在 **Build and deployment -> Source** 下拉框中，将默认的 *"Deploy from a branch"* 改选为 **`GitHub Actions`**！
> 4. 保存后，进入仓库顶部的 **Actions** 标签，点击右侧的 **Run workflow** 重新触发一次部署，即可 100% 成功上线！

---

## 🔑 环境变量说明

在自建服务器或 Vercel 部署时，复制 `.env.example` 为 `.env` 即可配置：

| 变量名 | 说明 | 示例值 |
| :--- | :--- | :--- |
| `PORT` | 启动端口 | `3001` |
| `R2_ACCOUNT_ID` | Cloudflare 账户 ID | `419c6c17e4bdfa104bdf7155314eb714` |
| `R2_ACCESS_KEY_ID` | R2 S3 访问密钥 ID | `ff65060b70c46b5b158779f382d6494b` |
| `R2_SECRET_ACCESS_KEY` | R2 S3 安全访问密钥 | `89c5cbda11b68ba399842be73fb2f1b7c6a4...` |
| `R2_BUCKET_NAME` | 存储桶名称 | `fluentfox-podcast` |
| `VITE_API_BASE` | （可选）静态 Pages 跨域指向外部后端地址 | `https://your-vercel-app.vercel.app` |

---

## ⌨️ 常用快捷键

| 按键 | 功能说明 |
| :--- | :--- |
| **Space（空格键）** | 播放 / 暂停音频 |
| **← / →（左 / 右方向键）** | 跳转至 上一句 / 下一句 |
| **R** | 重新播放当前句 |
| **L** | 开启 / 关闭单句精听循环 |
| **Tab** | 听写大闯关中获取“🪶 羽毛笔提示” |
| **Enter** | 听写大闯关中提交并进入下一句 |

---

## 🛠️ 本地开发与测试

```bash
# 1. 安装依赖
npm install

# 2. 启动前端 Vite 开发服务器（http://localhost:3000）
npm run dev

# 3. 启动后端 R2 代理服务（http://localhost:3001）
npm run server

# 4. 运行全套 69 项自动化测试（覆盖端到端场景、Anki导出、离线缓存）
npm test
```

---

## 📜 许可证

本项目基于 [MIT License](LICENSE) 开源。音频及原著文本版权归原作者及出版方所有，本项目仅供英语学习交流使用。
