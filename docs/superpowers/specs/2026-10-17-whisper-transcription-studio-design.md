# Hogwarts Audio — Whisper Transcription Studio Design Specification

## 1. Executive Summary

This specification defines the architecture, data structures, component responsibilities, and workflows for integrating the local Whisper speech-to-text system (`本地化whisper播客`) into the **Hogwarts Audio** content engineering pipeline as **Whisper Transcription Studio** (`tools/whisper-studio/`).

The integration realizes **Option 3 (Dual-Mode Integration)**:
1. **Core Transcription & NLP Pipeline**: Streamlined Python engine using `faster-whisper`, Spacy semantic sentence boundary splitting, hallucination deduplication, WPM/CEFR difficulty estimation, and bilingual translation.
2. **Hogwarts Standard Suite Direct Export**: Direct synthesis of bilingual `subtitle.vtt` and compliant `meta.json` into `content/ted/<id>/` or `content/podcasts/<id>/episodes/ep<xx>/`, followed by atomic feed re-compilation.
3. **Dual-Mode Interfaces**:
   - **CLI Mode**: `npm run content:transcribe -- <args>` for headless, one-step terminal automation.
   - **Web UI Mode**: Streamlined Gradio workstation (`npm run transcribe:ui`) for visual creators with drag-and-drop, real-time logging, and interactive preview.
4. **Codebase Slimming & Security**: Elimination of legacy ASS, ReportLab PDF, and GenAnki bloat; removal of cached `.pyc` and large media test files; strict exclusion of `api_keys.json` from git tracking with `.env` secret resolution.

---

## 2. Directory Structure & Cleanup Plan

### 2.1 Directory Relocation
To eliminate Windows command-line encoding issues with Chinese characters (`本地化whisper播客` -> `ػwhisper`), the module will be organized cleanly under:
`tools/whisper-studio/`

```text
tools/whisper-studio/
├── core/
│   ├── transcriber.py           [faster-whisper model wrapper with VAD & CUDA/CPU fallback]
│   ├── text_utils.py            [Spacy semantic splitting, hallucination cleaner, WPM & CEFR]
│   ├── translator.py            [Google Translate & Gemini/Qwen OpenAI-compatible router]
│   └── suite_exporter.py        [Hogwarts bilingual VTT formatter & meta.json synthesizer]
├── app.py                       [Streamlined Gradio Web UI, single file & batch processing]
├── cli.py                       [CLI entrypoint consumed by npm run content:transcribe]
├── requirements.txt             [Lean dependencies: faster-whisper, gradio, spacy, requests, openai]
├── README.md                    [Hogwarts Transcribe Studio setup & usage documentation]
└── .gitignore                   [Excludes api_keys.json, models, __pycache__, audio cache]
```

### 2.2 Files to Remove (Bloatware & Redundancies)
| File / Directory | Rationale for Removal |
|---|---|
| `ass_utils.py` | ASS karaoke format is specific to external media players (PotPlayer/VLC). Web platform uses WebVTT exclusively. |
| `pdf_utils.py` | ReportLab PDF generator produces inferior typography and conflicts with the project's native parchment aesthetic and existing browser printing system. |
| `anki_utils.py` | Depends on heavy binary `genanki` C-extensions. Project already natively supports Anki TSV tab-delimited export. |
| `__pycache__/` | Python bytecode cache artifacts. |
| `示例/3D_printers/3D_printers.mp3` | 3MB binary audio test file. |
| `示例/3D_printers/3D_printers.pdf` | 93KB binary PDF test artifact. |
| `示例/3D_printers/3D_printers_vocab.apkg` | 53KB binary Anki test package. |
| Legacy UI Tabs in `app.py` | Full-text grep search Tab, plain text player Tab, and YouTube downloader Tab. |

### 2.3 Dependency Streamlining (`requirements.txt`)
```text
faster-whisper>=1.0.0
gradio>=5.0.0
spacy>=3.7.0
requests>=2.31.0
openai>=1.0.0
python-dotenv>=1.0.0
```
> `reportlab`, `genanki`, and `yt-dlp` are completely removed, shrinking the dependency footprint and installation duration significantly.

---

## 3. Core Transcription & NLP Pipeline

### 3.1 Transcription & VAD (`core/transcriber.py`)
- Engine: `faster-whisper.WhisperModel`.
- Recommended Default: `deepdml/faster-whisper-large-v3-turbo-ct2` (or `large-v3-turbo`), quantized with `int8` on CUDA or `float32` on CPU.
- VAD Configuration: `vad_filter=True`, `vad_parameters=dict(min_silence_duration_ms=500)`.
- Output: List of segment objects containing `word_timestamps=True`.

### 3.2 Spacy Semantic Boundary Splitting (`core/text_utils.py`)
Standard character-count splitting produces broken clauses (e.g. `"Mr and Mrs Dursley, of number"` / `"four Privet Drive were proud to say"`).
Spacy NLP pipeline (`en_core_web_sm`):
1. Analyzes sentence dependency trees (`dep_`, `pos_`, `head`).
2. Evaluates phrase boundaries, conjunctions (`CC`, `IN`), and subordinate clauses.
3. Splits long running sentences (>60 characters) at natural semantic breath pauses without breaking collocations or noun chunks.
4. Enforces minimum cue duration of 0.8 seconds to prevent subtitle flashing.

### 3.3 Hallucination Cleaning & Deduplication
Strips repetitive model hallucinations during prolonged music or silence intervals:
```python
clean_subtitles(raw_subtitles, max_repetition=2)
```

### 3.4 Language Metrics Estimation
- **WPM (Words Per Minute)**:
  $$\text{WPM} = \frac{\text{Total Words}}{\text{Total Audio Duration (minutes)}}$$
- **CEFR Level**:
  Estimated using lexical frequency profiling against Oxford 3000 / CEFR vocabulary distribution (A1, A2, B1, B2, C1).

### 3.5 Bilingual Translation Engine (`core/translator.py`)
- Primary (Free / High-Speed): Google Translate endpoint (`translate.googleapis.com`), handling batch paragraph translation.
- Secondary (High-Quality LLM): Google Gemini (`gemini-2.0-flash`) or Qwen (`qwen-plus`) via OpenAI SDK client.
- Configuration: Loaded from project root `.env` (`GEMINI_API_KEY`, `OPENAI_API_KEY`) or optional local `api_keys.json` (gitignored).

---

## 4. Hogwarts Standard Suite Direct Exporter (`core/suite_exporter.py`)

### 4.1 Target Layout Synthesis

When given media file `input_media` (e.g. `speech.mp4` or `chapter.mp3`):

#### Case A: TED Talk
- Directory: `content/ted/<talk-id>/`
- Created/Copied files:
  - `video.mp4`: Copied or moved from input media.
  - `subtitle.vtt`: Synthesized bilingual WebVTT.
  - `meta.json`: Synthesized talk metadata.
  - `README.txt`: Operational notes.

**Synthesized `meta.json`**:
```json
{
  "id": "<talk-id>",
  "title": "<display_title>",
  "speaker": "<speaker_name>",
  "year": 2026,
  "duration": 360,
  "cefrLevel": "B1",
  "wpm": 142,
  "difficulty": "Intermediate",
  "topic": "Education",
  "description": "Standard TED lecture transcribed and generated by Hogwarts Audio Whisper Studio."
}
```

#### Case B: Podcast / Audiobook
- Directory: `content/podcasts/<series-id>/episodes/ep<chapter>/`
- Created/Copied files:
  - `audio.mp3`: Copied or moved from input media.
  - `subtitles.vtt`: Synthesized bilingual WebVTT.
  - `meta.json`: Synthesized chapter metadata.
  - Series `content/podcasts/<series-id>/meta.json`: Created if absent.

**Synthesized Chapter `meta.json`**:
```json
{
  "chapter": 1,
  "title": "Chapter 1",
  "audio": "audio.mp3",
  "vtt": "subtitles.vtt",
  "duration": 480,
  "wpm": 138,
  "cefrLevel": "B1"
}
```

### 4.2 Bilingual WebVTT Formatter
All exported subtitle files adhere to:
```vtt
WEBVTT - Hogwarts Audio Bilingual Subtitles

00:00.000 --> 00:04.500
Mr and Mrs Dursley, of number four, Privet Drive.
家住女贞路4号的德思礼夫妇。

00:04.500 --> 00:08.200
were proud to say that they were perfectly normal.
总是得意地说他们是非常规矩的人家。
```
- Line 1: English (with zero Unicode emojis).
- Line 2: Chinese translation.
- Timestamp format: `00:00.000 --> 00:05.000` or `00:00:00.000 --> 00:00:05.000`.

### 4.3 Atomic Content Feed Trigger
Upon successful export, `suite_exporter.py` invokes:
```bash
node scripts/content-compiler.js
```
ensuring `content/feed.json` is instantly refreshed for immediate testing via `npm run dev`.

---

## 5. User Interfaces (Dual-Mode)

### 5.1 Mode 1: CLI Pipeline (`tools/whisper-studio/cli.py`)
Invoked via npm script:
```bash
# Transcribe TED video directly into content/ted/how-magic-works
npm run content:transcribe -- --input=raw/speech.mp4 --type=ted --id=how-magic-works --title="How Magic Works" --speaker="Albus Dumbledore"

# Transcribe Podcast audio directly into content/podcasts/hp-book-1/episodes/ep01
npm run content:transcribe -- --input=raw/ch01.mp3 --type=podcast --id=hp-book-1 --chapter=1 --title="The Boy Who Lived"
```

Options:
- `--input <path>` (Required): Path to source audio/video.
- `--type <ted|podcast>` (Required): Target content type.
- `--id <slug>` (Required): URL-safe identifier.
- `--title <string>` (Optional, auto-derived from ID if omitted).
- `--speaker <string>` (Optional for TED, defaults to 'TED Speaker').
- `--chapter <int>` (Optional for podcasts, defaults to 1).
- `--model <name>` (Optional, defaults to 'deepdml/faster-whisper-large-v3-turbo-ct2').
- `--translate <google|gemini|none>` (Optional, defaults to 'google').
- `--force` (Optional, overwrites target if existing).

### 5.2 Mode 2: Streamlined Gradio Web UI (`tools/whisper-studio/app.py`)
Invoked via:
```bash
npm run transcribe:ui
```
Opens browser at `http://127.0.0.1:7860`:
1. **Target Selector**: Segmented toggle between `TED 演讲` and `有声书章节`.
2. **Media Uploader**: Single file drag-and-drop (`.mp4`, `.mp3`, `.m4a`, `.wav`).
3. **Metadata Fields**: Auto-populated ID, Title, Speaker, and Chapter inputs.
4. **Action**: Dominant primary CTA button "开始转写并导出至 Hogwarts 套件".
5. **Real-time Live Stream**: Displays transcription, Spacy boundary segmentation, translation progress, and validation confirmation.
6. **Result Confirmation**: Displays direct link and file paths created in `content/`.

---

## 6. Safety, Compatibility & Compliance

1. **Zero Unicode Emojis**:
   - All generated subtitles, JSON metadata strings, and console outputs are scrubbed for Unicode emojis via `Extended_Pictographic` regex.
2. **Zero Credential Leaks**:
   - `api_keys.json` is added to root `.gitignore`.
   - API keys are resolved with priority: `process.env.GEMINI_API_KEY` -> local `api_keys.json`.
3. **Non-Destructive Execution**:
   - Existing content files will not be overwritten unless `--force` is specified.
4. **Compatibility**:
   - Works seamlessly with existing Node.js test suite (`npm test`, 655/655 tests green).
   - Generates output 100% compliant with `scripts/content-compiler.js` and `scripts/content-sync.js`.
