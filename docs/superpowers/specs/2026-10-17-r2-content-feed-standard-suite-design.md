# Hogwarts Audio — R2 音视频标准套件与 Feed 自动化清单系统设计规范

**作者**: AI Agent  
**日期**: 2026-10-17  
**状态**: 待审查 (User Review Pending)  

---

## 1. 背景与目标

当前 Hogwarts Audio 采用对象存储层递归遍历模式（`ListObjectsV2Command`）获取原著有声书与 TED 演讲列表。随着章节和演说数量增长，面临两大瓶颈：
1. **API 性能开销**：每次全量扫描产生多轮 S3 接口网络请求，首屏冷启动延迟较大；
2. **缺乏集中化清单**：创作者新增内容时缺乏统一标准化的打包套件与本地校验机制。

本规范设计一套**类似播客 RSS / JSON Feed 模式的「英语研学音视频标准套件」**，兼顾工业级读取性能与极简维护体验：
- **创作者层**：在本地通过标准化文件夹组织素材，直观、易维护；
- **自动化构建层**：提供本地命令行工具（`npm run content:build` 与 `npm run content:sync`），自动校验字幕语法、音视频存在性，并编译生成轻量级单一清单 `feed.json`；
- **服务端/消费层**：采用「Feed 优先、目录扫描兜底」双模机制，单次请求毫秒级热加载全站内容，并支持 HTTP 304 / ETag 边缘缓存，调用成本趋近于 0。

---

## 2. 技术约束（硬性，不可打破）

| 约束项 | 规范要求 |
| :--- | :--- |
| **设计系统** | 严格遵守 `educational-ui-spec`，**全站零 Unicode Emoji**，统一使用 `lucide-vue-next` |
| **外部依赖** | **严禁引入任何新的 npm 依赖**（完全复用现有的 `@aws-sdk/client-s3`、Node.js 原生 API 与现有前端 Store） |
| **向后兼容** | 若 R2 存储桶中未放置 `feed.json`，服务端必须**自动安全降级**为原有的动态目录扫描，保障现有用户和旧桶 100% 正常播放 |
| **离线优先** | 当网络断开或 R2 凭据缺失时，前端和构建工具必须优雅回退到本地预置内容，杜绝白屏崩溃 |
| **零凭证泄露** | 严禁将 R2 Access Key / Secret 注入前端打包产物（`npm run verify-security` 保持 0 泄漏） |

---

## 3. 标准套件目录与素材规范

创作者在本地工作区或发布目录下的 `content/` 文件夹中组织素材：

```text
content/
├── podcasts/                               # 原著有声书 / 经典分辑
│   └── {book-id}/                          # 专辑唯一标识，例如 hp-book-1, the-little-prince
│       ├── book.json                       # 专辑元数据（标题、中文名、描述、主题色）
│       ├── cover.jpg                       # 专辑封面图（推荐正方形 1:1，JPG/PNG）
│       └── episodes/                       # 章节目录
│           ├── ep01/
│           │   ├── audio.mp3               # 章节音频（支持 .mp3, .m4a, .wav, .aac）
│           │   ├── subtitle.vtt            # 双语对照字幕（标准 WebVTT）
│           │   └── meta.json               # (可选) 章节小标题、中文标题、时长
│           └── ep02/
│               ├── audio.mp3
│               └── subtitle.vtt
│
└── ted/                                    # TED 演讲 / 视频工坊
    └── {talk-id}/                          # 演说唯一标识，例如 simon-sinek-2009
        ├── video.mp4                       # 演讲视频（支持 .mp4, .webm, .m4v）
        ├── subtitle.vtt                    # 双语对照字幕（标准 WebVTT）
        ├── cover.jpg                       # 演讲海报图（推荐 16:9，JPG/PNG）
        └── meta.json                       # 演讲元数据（标题、演讲者、CEFR 等级、词汇与任务）
```

### 3.1 极简容错机制 (Zero Friction)
1. **自动提取**：如果章节或 TED 演讲没有手写 `meta.json`，构建工具会自动从所在目录名推断标题，自动提取或指定默认 CEFR 等级（B1）及演讲者名称（"TED Speaker"）；
2. **字幕自动绑定**：同目录下只要存在 `.vtt` 结尾文件，即自动绑定为播放器的同步双语字幕轨。

---

## 4. `feed.json` 清单 Schema 规范

构建工具编译生成的集中清单文件存放于 R2 根目录 `feed.json`：

```json
{
  "version": "hogwarts-feed-v1",
  "generatedAt": "2026-10-17T08:30:00.000Z",
  "stats": {
    "booksCount": 7,
    "episodesCount": 142,
    "tedTalksCount": 24
  },
  "podcasts": [
    {
      "id": "hp-book-1",
      "title": "Harry Potter and the Philosopher's Stone",
      "cnTitle": "哈利·波特与魔法石",
      "code": "HP1",
      "color": "#740001",
      "coverKey": "podcasts/hp-book-1/cover.jpg",
      "chapters": [
        {
          "id": "hp-book-1_ep01",
          "epId": "ep01",
          "number": 1,
          "title": "The Boy Who Lived",
          "cnTitle": "大难不死的男孩",
          "audioKey": "podcasts/hp-book-1/episodes/ep01/audio.mp3",
          "subtitleKey": "podcasts/hp-book-1/episodes/ep01/subtitle.vtt",
          "durationSeconds": 920
        }
      ]
    }
  ],
  "ted": [
    {
      "id": "ted-simon-sinek-2009",
      "title": "How Great Leaders Inspire Action",
      "titleCn": "伟大领袖如何激励行动",
      "speaker": "Simon Sinek",
      "year": 2009,
      "durationSeconds": 1088,
      "cefrLevel": "B1",
      "wpm": 142,
      "videoKey": "ted/simon-sinek-2009/video.mp4",
      "vttKey": "ted/simon-sinek-2009/subtitle.vtt",
      "thumbnailKey": "ted/simon-sinek-2009/cover.jpg",
      "vocabSet": [],
      "tasks": { "cloze": [], "matching": [] },
      "shadowingSegments": []
    }
  ]
}
```

---

## 5. 服务端消费与双模读取架构

修改 `server/index.js` 与 `server/viteR2Plugin.js`：

### 5.1 数据读取优先级流程
1. **内存缓存命中**：检查 `catalogCache` 与 `tedCatalogCache` 是否存在且未超过 `CACHE_TTL_MS`（60秒）。若命中直接返回（耗时 < 1ms）；
2. **Feed 优先加载**：
   - 使用 `GetObjectCommand({ Bucket: bucketName, Key: 'feed.json' })` 尝试获取清单；
   - 若成功获取且 JSON 解析合法，直接同时填充 `catalogCache = feed.podcasts` 与 `tedCatalogCache = feed.ted`；
   - 记录 `feedEtag`，在定时后台轮询时利用 `If-None-Match` 实现 0 流量检测；
3. **降级目录扫描**：
   - 若 `feed.json` 不存在（HTTP 404 或 NoSuchKey），控制台打印日志并平滑回退执行现有的 `scanR2Catalog()` 与 `scanR2TedCatalog()`；
   - 保证未采用 feed.json 的旧存储桶依旧 100% 正常识别。

---

## 6. 本地 CLI 自动化工具设计

新增自动化脚本，配置于 `package.json`：

### 6.1 `npm run content:build`（校验与清单编译）
- 脚本位置：`scripts/content-compiler.js`
- 功能：
  1. 递归扫描 `content/podcasts` 与 `content/ted`；
  2. 验证音视频文件的扩展名（`.mp3`, `.mp4` 等）与可读性；
  3. 检验 `.vtt` 文件首行是否包含 `WEBVTT` 签名及合法时间戳行（`00:00.000 --> 00:05.000`）；
  4. 验证文本描述中是否误夹带 Unicode Emoji；
  5. 在 `content/feed.json` 生成合规格式化清单；
  6. 输出彩色终端构建摘要与统计报告。

### 6.2 `npm run content:sync`（增量同步至 R2）
- 脚本位置：`scripts/content-sync.js`
- 功能：
  1. 依赖 `content:build` 完成校验；
  2. 读取本地 `.env` 中的 R2 凭据；
  3. 采用文件哈希/修改时间增量比对，仅上传本地变动或新增的文件；
  4. 上传完成后最后更新 `feed.json`，确保原子切换；
  5. 向本地或生产实例发送可选的刷新通知。

### 6.3 `npm run content:scaffold`（模板脚手架）
- 脚本位置：`scripts/content-scaffold.js`
- 交互式或命令行参数生成空的章节或 TED 模板文件夹与预设 `meta.json`。

---

## 7. 测试与质量验证计划 (TDD)

1. **测试用例集**：
   - `tests/server/feedIngestion.test.js`：
     - 测试当 R2 存在 `feed.json` 时，`/api/catalog` 与 `/api/ted/talks` 立即以单次请求解析内容；
     - 测试当 `feed.json` 损坏或不存在时，平滑降级到目录扫描；
   - `tests/scripts/contentCompiler.test.js`：
     - 测试校验器对无效字幕、缺失音频的报错捕获；
     - 测试对合规文件夹的正确编译与 `feed.json` 生成；
2. **全回归要求**：
   - 全项目自动化测试 100% 绿色通过（当前基线 568 项）；
   - `npm run check-emojis` 维持 0 Emoji；
   - `npm run verify-security` 维持 0 凭据泄露；
   - `npm run build` 生产构建成功。
