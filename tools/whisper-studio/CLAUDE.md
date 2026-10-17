# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup & Running

```bash
# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Run the app (opens Gradio UI at http://127.0.0.1:7860)
python app.py
# or on Windows:
run.bat
```

Requires Python 3.10+, CUDA environment recommended for GPU acceleration.

## Architecture

**Data flow:** `app.py` (UI) → `logic.py` (orchestration) → `text_utils.py` (NLP splitting) → format writers (`ass_utils.py`, `pdf_utils.py`)

### Pipeline per audio file (`logic.py: Transcriber.transcribe_file`)
1. **Transcribe** — faster-whisper with `word_timestamps=True`, VAD filter enabled
2. **Split** — `text_utils.advanced_split()` using Spacy sentence boundaries + length constraints; falls back to `_advanced_split_v2_fallback()` if Spacy unavailable
3. **Clean** — `text_utils.clean_subtitles()` removes hallucinations, deduplicates overlapping text
4. **Output** — writes requested formats (SRT, ASS, VTT, MD, PDF) in parallel from the same `final_subtitles` list

### Subtitle data structure
All internal subtitle objects are dicts: `{'start': float, 'end': float, 'text': str, 'words': [WordObject]}`. The `words` list (word-level timestamps from Whisper) is essential for ASS karaoke generation — do not discard it during transformations.

### ASS karaoke format (`ass_utils.py`)
Uses `{\kf<centiseconds>}` tags (fill-highlight) per word. Gaps between words are filled with `{\k}` tags so the total segment duration matches exactly.

### Output files per audio file

| File | Contents | Requires AI |
|------|----------|-------------|
| `.srt` / `.ass` / `.vtt` | Subtitle formats | No |
| `.md` | Master study note: AI summary (§1) + bilingual transcript (§2) + AI analysis (§3-10) | Optional |
| `.pdf` | Print-ready bilingual handout with cover page (WPM/CEFR/date) | No |
| `_cloze.md` | Fill-in-the-blank exercise with answer key | No (Spacy) |
| `_quiz.md` | 5 MCQ + 5 T/F + 2 writing prompts | Yes |
| `_vocab.apkg` | Anki flashcard deck (Word/Example/Meaning/Note) | Yes |
| `_shadowing.md` | Prosody-annotated script (`[WORD]` stress, `↗↘` intonation, `\|` pauses) + practice log | No (Spacy) |

### Folder-level files (cross-episode)

| File | Contents |
|------|----------|
| `vocabulary_notebook.md` | Deduplicated vocabulary database — one entry per word across all episodes, with source episode, example sentence, and common mistake |
| `vocabulary_index.json` | Word-level dedup index (companion to notebook, not for reading) |

**Design rule**: The `.md` master note contains no raw transcript — the bilingual transcript section already shows original text. `vocabulary_notebook.md` is a cross-episode database, not a per-episode repeat of AI output.

### AI/Translation layer (`ollama_utils.py`)
- `call_llm(model, prompt, system)` — unified router: `gemini-*` → Google AI (OpenAI-compat), `qwen-plus/turbo/max` → Alibaba DashScope (OpenAI-compat), others → local Ollama
- `analyze_transcript()` — nine-section structured prompt; output split on `r"### 3\."` — section 2 (bilingual transcript) is injected by `_write_md`, not by the AI
- `google_translate()` — unofficial `translate.googleapis.com` endpoint, no API key needed
- API keys stored in `api_keys.json` (project root), managed via `save_api_keys()` / `load_api_keys()`

### PDF generation (`pdf_utils.py`)
ReportLab with `CoverWatermarkCanvas` (inner class inside `generate_bilingual_pdf`). Cover page drawn via direct canvas calls in `_draw_cover()`; **must call `canvas.Canvas.showPage(c)` not `c.showPage()`** to avoid infinite recursion through the override. CJK fonts tried in order: `simhei.ttf` → `msyh.ttf` → `simsun.ttc` → Helvetica fallback.

### Vocab extraction flow (`logic.py`)
When AI analysis succeeds (`has_analysis=True`), vocab items are extracted once via `extract_vocab_structured()` (one additional LLM call) and reused for both `vocabulary_notebook.md` update and Anki deck generation — no duplicate API calls.

### Skip logic (`app.py: process_folder`)
Before loading the Whisper model, files are pre-filtered using a `set` of all existing files in the folder tree. A file is considered "done" only if **all** requested output formats already exist on disk. The helper `_resolve_base(f)` accounts for subfolder organisation when computing expected output paths.

### Subfolder organisation (`logic.py: transcribe_file`)
When `organize_subfolder=True`, each audio and its outputs are placed in `parent_dir/stem/stem.*`. Detection of an already-organised file: `os.path.basename(parent_dir) == stem`. A one-time migration step runs **before** the skip check, so re-running on a flat folder first moves existing files then skips correctly. Audio is also moved on the skip path (early return) to avoid leaving an orphaned audio file at root.

### Real-time log streaming (`app.py`)
`transcribe_file` is synchronous and long-running. To stream status into the Gradio `Textbox` in real-time, both `process_folder` and `process_single_file` run `transcribe_file` in a **background `threading.Thread`**, passing status messages through a `queue.Queue`. The Gradio generator loop drains the queue with `get(timeout=0.1)` and yields on each message, keeping the browser updated during AI analysis.

### Windows long-path support
Windows MAX_PATH (260 chars) is hit when `organize_subfolder=True` and the audio stem is long: the path becomes `parent_dir\stem\stem.ext`, doubling the stem's path contribution. Every file-write module (`logic.py`, `ass_utils.py`, `pdf_utils.py`, `text_utils.py`, `anki_utils.py`) defines an identical `_lp(path)` helper that prepends `\\?\` on Windows, bypassing MAX_PATH with no registry changes required. Apply `_lp()` to every `open()`, `os.makedirs()`, `os.path.exists()`, and `shutil.move()` call that operates on output paths.

## Key Design Decisions

- **Single global `Transcriber` instance** — `app.py` reuses the model across files; only reloads when model size or compute type changes.
- **Chunking in `advanced_split`** — Spacy has memory limits; word lists are split into chunks at sentence boundaries (>2000 chars soft limit, >1.5s silence hard limit) before NLP processing.
- **Paragraph segmentation** — MD/PDF paragraph breaks are determined by >1.5s audio gaps or >700 char accumulation ending on sentence punctuation.
- **Translation is shared** — paragraphs are translated once and reused for both MD and PDF output.
- **run.bat auto-restarts** — on crash or exit, waits 3 s and relaunches; close the terminal window to stop.
- **torch GPU install** — `torch` is excluded from `requirements.txt` to prevent PyPI installing a CPU-only build. Install manually: `pip install torch --index-url https://download.pytorch.org/whl/cu124`.
