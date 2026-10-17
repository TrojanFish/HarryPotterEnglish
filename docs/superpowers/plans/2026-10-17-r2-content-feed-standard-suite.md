# R2 音视频标准套件与 Feed 自动化清单实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建类似播客 RSS 的「英语研学音视频标准套件」与集中清单（`feed.json`）系统，包含本地目录规范、内容校验编译引擎、增量 R2 同步以及服务端 Feed 优先双模热加载。

**Architecture:** 创作者在本地 `content/` 目录下放置标准音视频、字幕和元数据；通过 `npm run content:build` 执行语法与防呆校验并生成单一 `feed.json` 清单；通过 `npm run content:sync` 增量同步至 Cloudflare R2；服务端 `server/index.js` 优先尝试毫秒级读取 `feed.json`（支持 ETag 边缘缓存），无清单时平滑回退至现有动态目录扫描。

**Tech Stack:** Node.js (v20+ native), `@aws-sdk/client-s3`, Express 4, Vite 6, Pinia, Vue 3.

**Spec:** [`docs/superpowers/specs/2026-10-17-r2-content-feed-standard-suite-design.md`](file:///c:/Users/KeiyeeYu/Desktop/HarryPotterEnglish/docs/superpowers/specs/2026-10-17-r2-content-feed-standard-suite-design.md)

## Global Constraints

- 全站严格零 Unicode Emoji（仅允许使用 `lucide-vue-next` 图标）。
- 严禁引入任何新的 npm 依赖（仅使用现有 `@aws-sdk/client-s3`、Node 原生 `fs/promises`, `path`, `crypto`）。
- 保持向后兼容：当 R2 未上传 `feed.json` 时，系统必须无缝回退到旧有的 `scanR2Catalog()` 与 `scanR2TedCatalog()` 目录扫描。
- 零凭证泄漏：R2 秘钥仅限服务端与本地同步 CLI 读取，严禁注入客户端前端打包产物。
- Apple HIG 触控工学：任何 UI 组件触控热区保持 $\ge 44 \times 44\text{px}$。
- 全量自动化测试保持 100% 通过（当前基线 568 项）。

## Review Focus

1. 字幕文件校验：若 `.vtt` 缺少首行 `WEBVTT` 标志或时间戳破损，编译器必须明确抛出带文件路径和行号的错误，拒绝生成脏数据。
2. 零视频/零音频过滤：若目录只有字幕或文本却没有对应媒体文件，编译器和清单中不得生成空壳项目。
3. `feed.json` 损坏容错：若 R2 上的 `feed.json` 格式损毁（非合法 JSON），服务端必须平滑降级到目录扫描，不能引发 500 崩溃。
4. 增量同步防重传：`content:sync` 必须比对本地与远程 MD5/ETag/大小，避免对 GB 级视频进行重复网络上传。
5. 离线断网运行：在无网络或无 `.env` 秘钥环境下，`content:build` 仍可本地离线完成，前端依赖本地预置正常运行。

---

### Task 1: 内容校验与清单编译引擎 (`scripts/content-compiler.js`)

**Files:**
- Create: `scripts/content-compiler.js`
- Test: `tests/scripts/contentCompiler.test.js`

**Interfaces:**
- Produces: `compileContentFeed(contentDir, options): Promise<{ feed, stats, errors }>`
  - `feed`: 符合规范的 `feed.json` 对象
  - `stats`: `{ booksCount, episodesCount, tedTalksCount }`
  - `errors`: 校验失败条目数组

- [ ] **Step 1: 编写失败测试 `tests/scripts/contentCompiler.test.js`**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { compileContentFeed, validateVttContent } from '../../scripts/content-compiler.js';

describe('Content Compiler & Validator', () => {
  it('validates WebVTT content syntax and rejects corrupted subtitles', () => {
    assert.equal(validateVttContent('WEBVTT\n\n00:01.000 --> 00:03.000\nHello').valid, true);
    assert.equal(validateVttContent('CORRUPTED WITHOUT SIGNATURE').valid, false);
  });

  it('scans mock content directory and compiles valid feed.json', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hogwarts-content-test-'));
    // Setup mock podcasts & ted folders
    const bookDir = path.join(tmpDir, 'podcasts', 'hp-book-1', 'episodes', 'ep01');
    await fs.mkdir(bookDir, { recursive: true });
    await fs.writeFile(path.join(bookDir, 'audio.mp3'), 'mock-audio-data');
    await fs.writeFile(path.join(bookDir, 'subtitle.vtt'), 'WEBVTT\n\n00:01.000 --> 00:04.000\nHello');

    const result = await compileContentFeed(tmpDir);
    assert.equal(result.errors.length, 0);
    assert.equal(result.feed.podcasts.length, 1);
    assert.equal(result.feed.podcasts[0].chapters.length, 1);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

运行: `node --test tests/scripts/contentCompiler.test.js`  
预期: FAIL (Cannot find module `../../scripts/content-compiler.js`)

- [ ] **Step 3: 实现 `scripts/content-compiler.js`**

实现 `validateVttContent`、`stripEmojis`、`scanPodcastsFolder`、`scanTedFolder` 与 `compileContentFeed`：
- 严格校验 `.vtt` 首行 `WEBVTT` 签名；
- 过滤没有有效音视频的空目录；
- 支持自动从文件名推导 `title` 与 `speaker`；
- 输出 `feed.json` 并统计条目数量；
- 支持独立命令行执行 `node scripts/content-compiler.js`。

- [ ] **Step 4: 运行测试验证通过**

运行: `node --test tests/scripts/contentCompiler.test.js`  
预期: PASS

- [ ] **Step 5: 提交代码**

```bash
git add scripts/content-compiler.js tests/scripts/contentCompiler.test.js
git commit -m "feat(content): add content compiler and VTT validator engine"
```

---

### Task 2: 服务端与 Vite 插件 Feed 优先加载与双模降级

**Files:**
- Modify: `server/index.js`
- Modify: `server/viteR2Plugin.js`
- Test: `tests/server/feedIngestion.test.js`

**Interfaces:**
- Consumes: R2 根目录 `feed.json`
- Produces:
  - `loadR2Feed(bypassCache)`
  - `/api/catalog` 优先读取 `feed.json`
  - `/api/ted/talks` 优先读取 `feed.json`
  - ETag 条件读取（If-None-Match -> HTTP 304）

- [ ] **Step 1: 编写失败测试 `tests/server/feedIngestion.test.js`**

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.VERCEL = '1';

const { app, _setS3ClientForTest } = await import('../../server/index.js');

describe('Server Feed Ingestion & Graceful Degradation', () => {
  it('loads catalog and ted talks instantly from feed.json when present', async () => {
    const mockFeed = {
      version: 'hogwarts-feed-v1',
      podcasts: [{ id: 'feed-book-1', title: 'Feed Book', chapters: [{ id: 'ch1', audioKey: 'p/1.mp3' }] }],
      ted: [{ id: 'ted-feed-1', title: 'Feed Talk', videoKey: 'ted/1.mp4' }]
    };

    const mockClient = {
      send: async (cmd) => {
        if (cmd.input?.Key === 'feed.json') {
          return {
            Body: { transformToString: async () => JSON.stringify(mockFeed) },
            ETag: '"feed-v1-hash"'
          };
        }
        throw new Error('NoSuchKey');
      }
    };

    _setS3ClientForTest(mockClient);

    const catalogRes = await fetch(`${baseUrl}/api/catalog?refresh=1`);
    assert.equal(catalogRes.status, 200);
    const catalogData = await catalogRes.json();
    assert.equal(catalogData.books[0].id, 'feed-book-1');

    const tedRes = await fetch(`${baseUrl}/api/ted/talks?refresh=1`);
    assert.equal(tedRes.status, 200);
    const tedData = await tedRes.json();
    assert.equal(tedData.talks[0].id, 'ted-feed-1');
  });

  it('falls back seamlessly to directory scanning when feed.json is absent', async () => {
    // S3 client that rejects feed.json but allows directory scanning
    ...
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

运行: `node --test tests/server/feedIngestion.test.js`  
预期: FAIL (`feed.json` 未被 `/api/catalog` 与 `/api/ted/talks` 优先尝试读取)

- [ ] **Step 3: 修改 `server/index.js` 与 `server/viteR2Plugin.js`**

1. 在 `server/index.js` 中新增 `loadR2Feed(bypassCache)` 函数：
   - 尝试读取 R2 中的 `feed.json`；
   - 记录 `cachedFeedEtag`，命中相同 ETag 时直接复用；
   - 成功读取后同时刷新 `catalogCache` 与 `tedCatalogCache`；
   - 若失败或不存在，调用 `scanR2Catalog()` 与 `scanR2TedCatalog()`；
2. 在 `server/viteR2Plugin.js` 中：
   - 优先检查并读取本地 `content/feed.json`（若存在）；
   - 保障本地开发环境 `npm run dev` 即可立即响应。

- [ ] **Step 4: 运行测试验证通过**

运行: `node --test tests/server/feedIngestion.test.js tests/server/tedRoutes.test.js`  
预期: PASS

- [ ] **Step 5: 提交代码**

```bash
git add server/index.js server/viteR2Plugin.js tests/server/feedIngestion.test.js
git commit -m "feat(server): prioritize feed.json ingestion with automatic fallback to S3 directory scan"
```

---

### Task 3: 增量 R2 同步与刷新脚本 (`scripts/content-sync.js`)

**Files:**
- Create: `scripts/content-sync.js`
- Test: `tests/scripts/contentSync.test.js`

**Interfaces:**
- Consumes: 本地 `content/` 目录与 `.env` R2 凭据
- Produces: `syncContentToR2(contentDir, options): Promise<{ uploadedFiles, skippedFiles, feedUpdated }>`

- [ ] **Step 1: 编写失败测试 `tests/scripts/contentSync.test.js`**

测试：
- 对比文件大小/哈希，未变动的文件直接跳过（`skippedFiles`）；
- 新增或变动的文件执行 `PutObjectCommand` 上传（`uploadedFiles`）；
- 最终上传编译后的 `feed.json`。

- [ ] **Step 2: 运行测试验证失败**

运行: `node --test tests/scripts/contentSync.test.js`  
预期: FAIL (Cannot find module `../../scripts/content-sync.js`)

- [ ] **Step 3: 实现 `scripts/content-sync.js`**

1. 载入 `dotenv` 与 `compileContentFeed`；
2. 初始化 S3Client，获取远程对象清单与 ETag/ContentLength；
3. 执行并发限制的文件上传池（支持大文件流式上传）；
4. 最后覆盖上传 `feed.json` 并调用可选的本地/远程重载探针。

- [ ] **Step 4: 运行测试验证通过**

运行: `node --test tests/scripts/contentSync.test.js`  
预期: PASS

- [ ] **Step 5: 提交代码**

```bash
git add scripts/content-sync.js tests/scripts/contentSync.test.js
git commit -m "feat(scripts): add incremental R2 content sync tool"
```

---

### Task 4: 模板脚手架、示例库与 `package.json` 指令集成

**Files:**
- Create: `scripts/content-scaffold.js`
- Create: `content/README.md`
- Create: `content/examples/` (示例文档与样本)
- Modify: `package.json`

- [ ] **Step 1: 编写 `scripts/content-scaffold.js`**

支持交互或命令参数：
- `node scripts/content-scaffold.js --type=ted --id=my-talk`
- `node scripts/content-scaffold.js --type=podcast --id=my-book --chapter=1`
在 `content/` 下生成规范的目录和带注释的 `meta.json` 样例。

- [ ] **Step 2: 创建 `content/README.md` 指南**

详细说明文件夹规范、音频编码建议（MP3 128kbps / AAC）、视频编码建议（H.264 / WebM）、WebVTT 双语时间戳编写规范。

- [ ] **Step 3: 在 `package.json` 中配置 NPM Scripts**

```json
"scripts": {
  "content:build": "node scripts/content-compiler.js",
  "content:sync": "node scripts/content-sync.js",
  "content:scaffold": "node scripts/content-scaffold.js"
}
```

- [ ] **Step 4: 测试脚手架与构建联动**

```bash
npm run content:scaffold -- --type=ted --id=test-scaffold-talk
npm run content:build
```
验证编译无报错且能正确忽略空样例。清理测试样例。

- [ ] **Step 5: 提交代码**

```bash
git add scripts/content-scaffold.js content/ package.json
git commit -m "feat(scaffold): add content scaffold tool, documentation, and package scripts"
```

---

### Task 5: 全链路端到端集成测试与系统审计

**Files:**
- Test: 全量测试集

- [ ] **Step 1: 执行全量测试套件**

运行: `npm test`  
预期: $\ge 570$ 项测试 100% 全部通过，0 错误，0 警告。

- [ ] **Step 2: 零 Emoji 设计审计**

运行: `npm run check-emojis`  
预期: Total findings: 0。

- [ ] **Step 3: 凭证安全泄漏检查**

运行: `npm run verify-security`  
预期: 0 credential leaks found。

- [ ] **Step 4: 生产构建验证**

运行: `npm run build`  
预期: Vite 生产构建 0 错误顺利打包。

- [ ] **Step 5: 最终全链路合并提交**

```bash
git commit --allow-empty -m "chore: complete end-to-end verification for R2 content feed standard suite"
```
