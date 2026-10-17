# Hogwarts Audio - Whisper Transcription Studio

The **Whisper Transcription Studio** is the automated media ingestion and transcription pipeline for the Hogwarts Audio English Learning Platform. It converts raw audio and video assets into standardized educational suites with word-level timestamps, Spacy-powered syntactic sentence boundaries, bilingual English-Chinese subtitles, and metadata descriptors.

---

## 1. System Overview & Architecture

The studio provides two ingestion interfaces (CLI and Gradio Web UI) built on a modular `core/` pipeline:

```
[ Raw Media (.mp4, .mp3, .m4a, .wav) ]
                  |
                  v
       core.transcriber (Faster-Whisper)
                  |
                  v
       core.text_utils (Spacy Syntactic Splitting & Hallucination Removal)
                  |
                  v
       core.translator (Google Translate / Gemini API)
                  |
                  v
       core.suite_exporter (Hogwarts Audio Standards)
                  |
    +-------------+-------------+
    |                           |
    v                           v
content/ted/<id>/          content/podcasts/<id>/episodes/ep<N>/
  + video.mp4 (or audio.mp3)  + audio.mp3
  + subtitle.vtt              + subtitles.vtt
  + meta.json                 + meta.json
```

### Core Modules
- `core.transcriber`: Faster-Whisper wrapper supporting CUDA acceleration, int8 quantization, and mock mode for testing.
- `core.text_utils`: Spacy-based syntactic boundary splitting (en_core_web_sm), WPM calculation, CEFR level estimation, and hallucination pruning.
- `core.translator`: Bilingual subtitle translation supporting free Google Translate and Google Gemini API.
- `core.suite_exporter`: Generates WebVTT bilingual subtitles, structures standard content suites, and invokes `npm run content:build` to recompile the client catalog.

---

## 2. Setup & Prerequisites

### Prerequisites
- Python 3.10 or higher.
- NVIDIA GPU with CUDA drivers (recommended for fast transcription) or multi-core CPU.
- Node.js 18+ (for client feed recompilation and automated testing).

### Installation
1. Install Python dependencies:
   ```bash
   pip install -r tools/whisper-studio/requirements.txt
   ```

2. Download Spacy English model:
   ```bash
   python -m spacy download en_core_web_sm
   ```

3. (Optional) For PyTorch with CUDA support:
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
   ```

---

## 3. CLI Usage

Ingest content directly from the command line using npm scripts:

### Ingest TED Talk
```bash
npm run content:transcribe -- \
  --input "C:/Downloads/ted_talk.mp4" \
  --type "ted" \
  --id "why-stories-matter" \
  --title "Why Stories Matter" \
  --speaker "Chimamanda Ngozi Adichie" \
  --translate "google"
```

### Ingest Podcast / Audiobook Chapter
```bash
npm run content:transcribe -- \
  --input "C:/Downloads/hp_ch01.mp3" \
  --type "podcast" \
  --id "hp-philosophers-stone" \
  --title "The Boy Who Lived" \
  --chapter 1 \
  --author "J.K. Rowling" \
  --narrator "Stephen Fry"
```

### CLI Arguments Reference
| Argument | Description | Default |
|---|---|---|
| `--input` | Path to source media file (.mp4, .webm, .mp3, .m4a, .wav) | Required |
| `--type` | Content type: `ted` or `podcast` | Required |
| `--id` | Slug identifier for the item | Required |
| `--title` | Display title (auto-derived if omitted) | None |
| `--speaker` | Speaker name for TED talk | None |
| `--author` | Author for podcast series | J.K. Rowling |
| `--narrator` | Narrator for podcast series | Stephen Fry |
| `--chapter` | Chapter number for podcast | 1 |
| `--model` | Faster-Whisper model size | deepdml/faster-whisper-large-v3-turbo-ct2 |
| `--translate` | Translation engine (`google`, `gemini`, `none`) | google |
| `--mock` | Run in mock mode for rapid offline testing | False |
| `--force` | Force overwrite existing content directory | False |

---

## 4. Web UI Usage

Launch the visual Gradio workbench:

```bash
npm run transcribe:ui
```

Or run via Python directly:
```bash
python tools/whisper-studio/app.py --port 7860
```

Open `http://127.0.0.1:7860` in your browser.

### Workbench Features
1. **Single File Studio**:
   - Media file drag-and-drop uploader.
   - Target content selector (`TED 演讲` / `有声书章节`).
   - Dynamic metadata inputs (auto-populates ID and Title from filename).
   - Real-time streaming output logs and suite generation summary.
2. **Batch Folder Studio**:
   - Directory scanner for batch processing.
   - Sequential processing of audio/video folders.
   - Batch progress indicators with error handling.

---

## 5. Strict Zero-Emoji Design Compliance

In accordance with the Hogwarts Audio Design System, all components, UI templates, logs, and documentation strictly forbid Unicode emojis.
- Status indications use text badges: `[GPU Ready: CUDA]`, `[CPU Mode]`, `[INFO]`, `[WARN]`, `[ERROR]`, `[SUCCESS]`, `[OK]`.
- User interface icons in the web client use Lucide React / Lucide Vue icons exclusively.
