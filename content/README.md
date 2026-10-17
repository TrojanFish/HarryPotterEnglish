# Hogwarts Audio Content Suite Guide

This directory houses the standardized learning content for the Hogwarts Audio English Learning Platform, including Harry Potter audiobook podcasts and TED educational lectures.

---

## 1. Directory Structure Specification

### 1.1 Podcasts and Audiobooks
Each podcast or audiobook series resides under `content/podcasts/<series-id>/`:

```text
content/
└── podcasts/
    └── <series-id>/
        ├── meta.json                [Series metadata: title, author, narrator, cover]
        ├── cover.jpg                [Square cover artwork, recommended 1000x1000px]
        └── episodes/
            ├── ep01/
            │   ├── meta.json        [Chapter metadata: chapter, title, audio, vtt]
            │   ├── audio.mp3        [Standardized audio track]
            │   └── subtitles.vtt    [Bilingual WebVTT subtitles]
            └── ep02/
                ├── meta.json
                ├── audio.mp3
                └── subtitles.vtt
```

### 1.2 TED Educational Talks
Each TED lecture resides under `content/ted/<talk-id>/`:

```text
content/
└── ted/
    └── <talk-id>/
        ├── meta.json                [Talk metadata: title, speaker, cefrLevel, wpm]
        ├── video.mp4                [H.264/AAC video with FastStart moov atom]
        ├── subtitle.vtt             [Bilingual WebVTT subtitles]
        └── cover.jpg                [Video poster thumbnail, 16:9 ratio]
```

---

## 2. Media Encoding Recommendations

To ensure optimal offline caching, fast range streaming over Cloudflare R2, and smooth playback across iOS Safari and desktop browsers:

### 2.1 Audio Specifications
- Codec: MP3 (MPEG Audio Layer 3) or AAC (Advanced Audio Coding)
- Bitrate: 128 kbps CBR (Constant Bitrate) for spoken voice
- Sample Rate: 44.1 kHz, 16-bit stereo or mono
- Normalization: -16 LUFS integrated loudness (EBU R128 standard)

### 2.2 Video Specifications
- Container & Codec: MP4 container with H.264 High Profile video and AAC audio
- Resolution: 720p (1280x720) or 1080p (1920x1080)
- Frame Rate: 24 or 30 fps
- Moov Atom: Must be placed at the beginning of the file (FastStart / Web Optimized)
  - FFmpeg command: `ffmpeg -i input.mp4 -c:v libx264 -c:a aac -movflags +faststart video.mp4`

### 2.3 Subtitle Specifications
- Format: UTF-8 encoded WebVTT (`.vtt`)
- Bilingual Pattern:
  - Line 1: Target language (English)
  - Line 2: Native translation (Simplified Chinese)
- Cue Timestamps: Millisecond accuracy (`00:01.000 --> 00:05.500` or `00:00:01.000 --> 00:00:05.500`)
- Punctuation & Quotes: Standard ASCII or clean curly quotes; avoid control characters.

---

## 3. CLI Workflow Commands

The project provides three command-line tools for content lifecycle management:

### 3.1 Content Scaffold (`npm run content:scaffold`)
Interactively or via CLI arguments, scaffold new content folders with compliant metadata and subtitle templates:

```bash
# Scaffold a TED talk
npm run content:scaffold -- --type=ted --id=how-magic-works --title="How Magic Works" --speaker="Albus Dumbledore"

# Scaffold a Podcast series and first episode
npm run content:scaffold -- --type=podcast --id=hp-book-1 --title="Harry Potter and the Sorcerer's Stone" --chapter=1

# Scaffold with overwrite protection bypass
npm run content:scaffold -- --type=ted --id=how-magic-works --force
```

### 3.2 Content Feed Compilation (`npm run content:build`)
Scans all directories under `content/podcasts` and `content/ted`, validates subtitles syntax, checks media presence, and generates `content/feed.json`:

```bash
# Compile feed.json to content/feed.json
npm run content:build

# Perform validation without writing feed.json
npm run content:build -- --dry-run
```

### 3.3 R2 Cloudflare Synchronization (`npm run content:sync`)
Synchronizes compiled content with Cloudflare R2 object storage using ETag MD5 comparison:

```bash
# Preview changes without modifying remote storage
npm run content:sync -- --dry-run

# Synchronize content to Cloudflare R2
npm run content:sync
```

---

## 4. Strict Quality & Compliance Rules

1. Zero Unicode Emojis:
   - In accordance with the Hogwarts Audio Design System, Unicode emojis are strictly prohibited in titles, descriptions, author names, and subtitle transcripts.
   - The build process runs automated emoji scans and will reject content violating this rule.
2. WebVTT Syntax:
   - All subtitle files must start with the `WEBVTT` signature.
   - Subtitle cues must have non-overlapping, chronologically ordered timestamps.
3. Copyright & Fair Use:
   - Content hosted within this repository is strictly for non-commercial educational and scholarly language-learning research.
