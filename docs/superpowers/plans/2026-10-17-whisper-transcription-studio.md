# Hogwarts Audio — Whisper Transcription Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

This implementation plan details the step-by-step TDD execution of **Whisper Transcription Studio** (`tools/whisper-studio/`), transforming the local Whisper speech-to-text system into a dual-mode content production pipeline (CLI + Streamlined Gradio Web UI) for Hogwarts Audio.

---

## Pre-flight Consistency & Interface Review

| Component A | Component B | Interface / Shared Surface | Invariant / Specification |
|---|---|---|---|
| `tools/whisper-studio/core/suite_exporter.py` | `scripts/content-compiler.js` | `content/ted/` & `content/podcasts/` files | Output files (`video.mp4`/`audio.mp3`, `subtitle.vtt`, `meta.json`) MUST pass `compileContentFeed()` validation with 0 errors. |
| `tools/whisper-studio/core/suite_exporter.py` | `content/feed.json` | Subprocess trigger | Calls `node scripts/content-compiler.js` upon completion to atomically refresh `feed.json`. |
| `tools/whisper-studio/cli.py` | `package.json` | NPM Script | Invoked via `npm run content:transcribe -- <args>`. |
| `tools/whisper-studio/app.py` | `package.json` | NPM Script | Invoked via `npm run transcribe:ui`. |
| `tools/whisper-studio/` | Security & Compliance | Credentials & Design System | Zero emojis in outputs, `api_keys.json` in `.gitignore`, 0 credential leaks in client bundles. |

---

## File Structure Plan

```text
tools/whisper-studio/
├── core/
│   ├── __init__.py
│   ├── transcriber.py          # Whisper model wrapper with VAD, mock support, and CUDA/CPU fallback
│   ├── text_utils.py           # Spacy semantic boundary splitting, clean_subtitles, WPM & CEFR
│   ├── translator.py           # Google Translate (free) & Gemini/Qwen via OpenAI SDK
│   └── suite_exporter.py       # Bilingual WebVTT formatter & Hogwarts meta.json synthesizer
├── tests/
│   ├── test_suite_exporter.py  # Python unit tests for bilingual VTT formatting and suite export
│   └── test_cli.py             # Python unit tests for CLI argument parsing and pipeline wiring
├── app.py                      # Streamlined Gradio Web UI tailored for Hogwarts Audio
├── cli.py                      # Headless CLI entrypoint for npm run content:transcribe
├── requirements.txt            # Streamlined dependencies (faster-whisper, gradio, spacy, requests, openai, python-dotenv)
├── README.md                   # Comprehensive developer and creator usage guide
└── .gitignore                  # Ignores api_keys.json, models, __pycache__, audio cache

tests/scripts/
└── whisperSuiteIntegration.test.js  # Node.js integration test verifying generated suite passes content-compiler
```

---

## Tasks

### Task 1: 目录重构、冗余清理与安全隔离

**Files:**
- Move: `本地化whisper播客` -> `tools/whisper-studio/`
- Delete:
  - `tools/whisper-studio/ass_utils.py`
  - `tools/whisper-studio/pdf_utils.py`
  - `tools/whisper-studio/anki_utils.py`
  - `tools/whisper-studio/__pycache__/`
  - `tools/whisper-studio/示例/3D_printers/3D_printers.mp3`
  - `tools/whisper-studio/示例/3D_printers/3D_printers.pdf`
  - `tools/whisper-studio/示例/3D_printers/3D_printers_vocab.apkg`
- Modify: `tools/whisper-studio/requirements.txt`
- Modify: `.gitignore`
- Create: `tools/whisper-studio/.gitignore`

- [ ] **Step 1: 移动目录并建立标准结构**
  将 `本地化whisper播客` 重命名并移动为 `tools/whisper-studio/`，创建 `tools/whisper-studio/core/` 目录。
- [ ] **Step 2: 移除无用模块与大测试二进制文件**
  删除 `ass_utils.py`, `pdf_utils.py`, `anki_utils.py`, `__pycache__` 及其中的 3MB 测试媒体文件。
- [ ] **Step 3: 瘦身 `requirements.txt`**
  移除 `reportlab`, `genanki`, `yt-dlp`，仅保留核心必要依赖。
- [ ] **Step 4: 配置安全凭据忽略**
  在根目录 `.gitignore` 和 `tools/whisper-studio/.gitignore` 中添加 `api_keys.json` 和 `*.pyc`。
- [ ] **Step 5: 验证与提交**
  运行 `git status` 确认安全清理无遗漏，提交代码：
  `git commit -m "refactor(whisper): relocate to tools/whisper-studio, prune unused modules, and secure credentials"`

---

### Task 2: 双语字幕组装与 Hogwarts 标准套件合成器 (`core/suite_exporter.py`)

**Files:**
- Create: `tools/whisper-studio/core/__init__.py`
- Create: `tools/whisper-studio/core/suite_exporter.py`
- Create: `tools/whisper-studio/tests/test_suite_exporter.py`
- Create: `tests/scripts/whisperSuiteIntegration.test.js`

**Interfaces:**
```python
def format_bilingual_vtt(cues: list[dict]) -> str:
    """Formats paired English and Chinese cues into standard WebVTT."""
    ...

def export_hogwarts_suite(
    media_path: str,
    subtitles: list[dict],
    meta_info: dict,
    content_root: str,
    recompile_feed: bool = True
) -> dict:
    """Exports media, bilingual subtitle.vtt, and meta.json to content/ted/ or content/podcasts/."""
    ...
```

- [ ] **Step 1: 编写失败测试 `tools/whisper-studio/tests/test_suite_exporter.py`**
  测试：
  - `format_bilingual_vtt`: 验证生成的 VTT 首行带 `WEBVTT`，带毫秒级时间戳，每段包含英文原句和中文译文。
  - `export_hogwarts_suite`: 验证在临时目录中生成 TED 和 Podcast 结构、正确的 `meta.json` 属性（WPM, CEFR, duration）、拷贝媒体文件，并成功调用 `content-compiler.js` 编译出有效的 `feed.json`。
- [ ] **Step 2: 运行测试验证失败**
  运行: `python -m unittest tools/whisper-studio/tests/test_suite_exporter.py`
  预期: FAIL (ModuleNotFoundError: No module named 'core.suite_exporter')
- [ ] **Step 3: 实现 `tools/whisper-studio/core/suite_exporter.py`**
  1. 实现 `format_bilingual_vtt`：精准格式化时间戳并安全转义；
  2. 实现 `export_hogwarts_suite`：安全检查目录是否存在（支持 `--force` 覆盖保护），按规范写入 `meta.json`、`subtitle.vtt`（或 `subtitles.vtt`）与媒体文件；
  3. 通过 `subprocess.run(["node", "scripts/content-compiler.js"])` 自动触发清单重新编译。
- [ ] **Step 4: 编写 Node.js 集成测试 `tests/scripts/whisperSuiteIntegration.test.js`**
  验证导出的结构能够被主仓库的 `compileContentFeed` 零警告无缝解析。
- [ ] **Step 5: 运行全量测试验证通过**
  运行: `python -m unittest discover tools/whisper-studio/tests`
  运行: `node --test tests/scripts/whisperSuiteIntegration.test.js`
  预期: PASS
- [ ] **Step 6: 提交代码**
  `git commit -m "feat(whisper): add bilingual WebVTT formatter and Hogwarts suite exporter"`

---

### Task 3: 核心转写流水线封装与 CLI 自动化工具 (`cli.py`, `core/transcriber.py`)

**Files:**
- Create: `tools/whisper-studio/cli.py`
- Modify: `tools/whisper-studio/core/transcriber.py`
- Modify: `tools/whisper-studio/core/text_utils.py`
- Modify: `tools/whisper-studio/core/translator.py`
- Create: `tools/whisper-studio/tests/test_cli.py`
- Modify: `package.json`

**Interfaces:**
```bash
python tools/whisper-studio/cli.py --input=<file> --type=<ted|podcast> --id=<id> [options]
# Via NPM:
npm run content:transcribe -- --input=<file> --type=<ted|podcast> --id=<id> [options]
```

- [ ] **Step 1: 编写失败测试 `tools/whisper-studio/tests/test_cli.py`**
  测试：
  - 命令行参数解析（`--input`, `--type`, `--id`, `--title`, `--speaker`, `--chapter`, `--mock` 等）；
  - 缺少必要参数时打印用法并返回非零错误码；
  - 模拟模式（`--mock`）快速执行端到端流水线（无需实际加载 1GB 模型）。
- [ ] **Step 2: 运行测试验证失败**
  运行: `python -m unittest tools/whisper-studio/tests/test_cli.py`
  预期: FAIL (Cannot find cli.py)
- [ ] **Step 3: 实现 `cli.py` 与核心模块封装**
  1. 封装 `core/transcriber.py`：载入 faster-whisper 模型，并支持测试注入模拟输出；
  2. 整合 `core/text_utils.py`：Spacy 语义断句 + 幻听过滤 + WPM/CEFR 估算；
  3. 整合 `core/translator.py`：优先使用 Google 翻译，可平滑回退至 Gemini；从项目根目录 `.env` 加载环境变量；
  4. 实现 `cli.py`：串联整体流水线，并将产物交由 `suite_exporter.py` 输出至 `content/`。
- [ ] **Step 4: 在 `package.json` 中配置 NPM 脚本**
  `"content:transcribe": "python tools/whisper-studio/cli.py"`
- [ ] **Step 5: 运行测试验证通过**
  运行: `python -m unittest discover tools/whisper-studio/tests`
  运行: `npm test`
  预期: 655+ 项全部通过。
- [ ] **Step 6: 提交代码**
  `git commit -m "feat(whisper): add CLI entrypoint and integrate npm run content:transcribe"`

---

### Task 4: 精简版 Gradio 可视化工作台与文档 (`app.py`, `README.md`)

**Files:**
- Rewrite: `tools/whisper-studio/app.py`
- Modify: `package.json`
- Create: `tools/whisper-studio/README.md`

- [ ] **Step 1: 重构 `tools/whisper-studio/app.py`**
  1. 移除无用的播放器 Tab、搜索 Tab、YouTube Tab、ASS/PDF 选项；
  2. 设计清晰简洁的 Hogwarts 专属工作台：
     - 单文件处理与批量文件夹处理两个主要 Tab；
     - 目标类型单选按钮：`TED 演讲 (ted/)` / `有声书章节 (podcasts/)`；
     - 自动提取 ID 与标题，支持手动覆盖；
     - 一键 CTA 按钮：“开始转写并导出至 Hogwarts 套件”；
     - 实时输出转写与双语对齐日志；
     - 转写完成后显示生成的文件路径与 `content/feed.json` 刷新通知。
- [ ] **Step 2: 在 `package.json` 中配置 NPM 脚本**
  `"transcribe:ui": "python tools/whisper-studio/app.py"`
- [ ] **Step 3: 编写 `tools/whisper-studio/README.md` 指南**
  详细记录环境配置、GPU CUDA 加速配置、CLI 常用指令与 Web 界面启动方法。
- [ ] **Step 4: 验证 Web UI 构建与启动逻辑**
  运行语法与组件加载检查：`python -c "import tools.whisper-studio.app"` 或冒烟验证。
- [ ] **Step 5: 提交代码**
  `git commit -m "feat(whisper): modernize Gradio UI for Hogwarts Audio and add npm run transcribe:ui"`

---

### Task 5: 全链路端到端集成验证与系统审计

**Files:**
- 全局测试与构建产物

- [ ] **Step 1: 端到端转写与套件生成验证**
  使用轻量测试音频运行 CLI 转写生成 TED 测试套件：
  ```bash
  python tools/whisper-studio/cli.py --input=tests/fixtures/sample.mp3 --type=ted --id=test-whisper-speech --mock
  ```
  验证 `content/ted/test-whisper-speech/` 目录存在，`subtitle.vtt` 格式正确，`meta.json` 包含 WPM 与 CEFR，`content/feed.json` 成功注入该条目。测试完毕后清理测试条目。
- [ ] **Step 2: 全量自动化回归测试**
  运行: `npm test`
  预期: 655+ 项测试全部绿色通过，0 错误，0 失败。
- [ ] **Step 3: 零 Emoji 设计审计**
  运行: `npm run check-emojis`
  预期: Total findings: 0。
- [ ] **Step 4: 凭据安全泄漏审计**
  运行: `npm run verify-security`
  预期: 0 credential leaks found。
- [ ] **Step 5: 生产构建打包验证**
  运行: `npm run build`
  预期: Vite 生产构建 0 错误顺利打包。
- [ ] **Step 6: 提交与推送最终代码**
  `git commit --allow-empty -m "chore: complete Whisper Transcription Studio integration and whole-branch verification"`
  `git push origin main`

---

## Execution Methodology

Follow **Subagent-Driven Development (SDD)**:
- Implement each task with a dedicated implementer subagent.
- Review each task with a dedicated reviewer subagent.
- Perform Whole-Branch Final Review before completion.
