# 🚀 霍格沃茨魔法英语 — 多平台部署指南 (Deployment Guide)

本项目已全面支持 **Docker、Vercel、Cloudflare Pages、GitHub Pages** 四种主流部署方式，满足不同场景下的上线需求。

---

## 目录
1. [🐳 Docker 容器化部署（推荐云服务器）](#1-docker-容器化部署)
2. [▲ Vercel 自动化部署（推荐全栈无服务器）](#2-vercel-自动化部署)
3. [⚡ Cloudflare Pages 部署（推荐全球边缘网络）](#3-cloudflare-pages-部署)
4. [📄 GitHub Pages 部署（纯前端静态托管）](#4-github-pages-部署)
5. [🔑 环境变量说明](#5-环境变量配置表)

---

## 1. 🐳 Docker 容器化部署

本项目提供了经过优化的多阶段构建 `Dockerfile` 与 `docker-compose.yml`，一个镜像即可同时托管前端 SPA 静态应用与后端 R2 音频流媒体代理服务。

### 方式 A：使用 Docker Compose（最简便）
```bash
# 1. 启动容器（后台运行）
docker compose up -d --build

# 2. 查看容器运行日志
docker compose logs -f

# 3. 访问服务
# 浏览器打开 http://<你的服务器IP>:3001
```

### 方式 B：使用原生 Docker 命令
```bash
# 构建镜像
docker build -t hogwarts-audio-english .

# 运行容器（绑定 3001 端口并挂载环境变量）
docker run -d \
  --name hogwarts-audio \
  -p 3001:3001 \
  --restart unless-stopped \
  -e R2_ACCOUNT_ID="419c6c17e4bdfa104bdf7155314eb714" \
  -e R2_ACCESS_KEY_ID="ff65060b70c46b5b158779f382d6494b" \
  -e R2_SECRET_ACCESS_KEY="89c5cbda11b68ba399842be73fb2f1b7c6a4ad53709e0937b6ae7e12acf781d6" \
  -e R2_BUCKET_NAME="fluentfox-podcast" \
  hogwarts-audio-english
```

---

## 2. ▲ Vercel 自动化部署

仓库根目录已配置好 `vercel.json` 与 `api/index.js`，Vercel 会自动识别并以 Serverless 模式运行。

### 部署步骤：
1. 将代码推送到 GitHub 仓库。
2. 登录 [Vercel 控制台](https://vercel.com)，点击 **"Add New Project"** 并导入此仓库。
3. **Framework Preset** 选择 **Vite**。
4. 在 **Environment Variables** 添加以下环境变量：
   - `R2_ACCOUNT_ID`: `419c6c17e4bdfa104bdf7155314eb714`
   - `R2_ACCESS_KEY_ID`: `ff65060b70c46b5b158779f382d6494b`
   - `R2_SECRET_ACCESS_KEY`: `89c5cbda11b68ba399842be73fb2f1b7c6a4ad53709e0937b6ae7e12acf781d6`
   - `R2_BUCKET_NAME`: `fluentfox-podcast`
5. 点击 **Deploy**，等待构建完成即可获得全球加速的访问域名！

---

## 3. ⚡ Cloudflare Pages 部署

仓库已包含 `functions/api/[[path]].js`，原生支持 Cloudflare Edge Functions 与 R2 Bucket Binding。

### 部署步骤：
1. 登录 Cloudflare Dashboard，进入 **Workers & Pages** -> **Create application** -> **Pages**。
2. 连接 GitHub 仓库。
3. 构建配置：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 绑定 R2 存储桶（原生绑定，免密钥高并发）：
   - 在 Pages 项目设置中找到 **Settings** -> **Functions** -> **R2 bucket bindings**。
   - Variable name 填入：`HP_AUDIO_BUCKET`。
   - 选择你的 R2 存储桶：`fluentfox-podcast`。
5. 点击 Save and Deploy 即可上线！

---

## 4. 📄 GitHub Pages 部署

项目 `vite.config.js` 已配置相对路径基址 (`base: './'`)，且已内置 GitHub Actions 自动化工作流 `.github/workflows/deploy.yml`。

### 部署步骤：
1. 进入 GitHub 仓库设置：**Settings** -> **Pages**。
2. 在 **Build and deployment** -> **Source** 中选择 **GitHub Actions**。
3. 只要向 `main` 分支推送代码，工作流就会自动打包并将 `dist/` 部署到你的 `https://<用户名>.github.io/<仓库名>/`。
4. *提示*：由于 GitHub Pages 为纯静态托管，如需连接外部 R2 API，可在打包前配置环境变量 `VITE_API_BASE=https://你的Vercel或云服务器域名`。

---

## 5. 🔑 环境变量配置表

| 变量名 | 说明 | 默认值 / 示例 | 适用平台 |
| :--- | :--- | :--- | :--- |
| `PORT` | 服务监听端口 | `3001` | Docker / 自建服务器 |
| `NODE_ENV` | 运行环境 | `production` | Docker / Node.js |
| `R2_ACCOUNT_ID` | Cloudflare 账户 ID | `419c6c17e4bdfa104bdf7155314eb714` | Docker / Vercel |
| `R2_ACCESS_KEY_ID` | R2 S3 访问密钥 ID | `ff65060b70c46b5b158779f382d6494b` | Docker / Vercel |
| `R2_SECRET_ACCESS_KEY` | R2 S3 安全访问密钥 | `89c5cbda11b...` | Docker / Vercel |
| `R2_BUCKET_NAME` | R2 存储桶名称 | `fluentfox-podcast` | Docker / Vercel / Cloudflare |
| `VITE_API_BASE` | 前端跨域请求后端根地址 | `https://your-api.com`（为空则同源） | Pages 静态托管 |
| `VITE_BASE_PATH` | 前端打包基准路径 | `./` | GitHub Pages |
