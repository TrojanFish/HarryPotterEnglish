import os
import re
import json
import shutil
import subprocess
from datetime import datetime
from typing import List, Dict, Any, Optional

# Emoji stripping regex adhering to Unicode Extended_Pictographic specification
EMOJI_PATTERN = re.compile(
    "["
    "\U0001F000-\U0001FAFF"  # Symbols, pictographs, emoticons, transport, supplemental
    "\u2600-\u27BF"          # Misc symbols & Dingbats
    "\u2300-\u23FF"          # Misc Technical
    "\u2B50-\u2B55"          # Stars, symbols
    "\u203C-\u2049"          # Punctuation marks used as emojis
    "\uFE0E\uFE0F\u200D"     # Variation selectors & Zero-width joiner
    "]+",
    flags=re.UNICODE
)


def strip_emojis(text: Optional[str]) -> str:
    """
    Strips Unicode emojis from text, normalizes contractions, and trims extra spaces.
    Adheres strictly to the Hogwarts Audio zero-emoji constraint.
    """
    if not isinstance(text, str):
        return ""
    cleaned = EMOJI_PATTERN.sub("", text)
    # Remove awkward whitespace before punctuation caused by stripped emojis
    cleaned = re.sub(r"\s+([!?,.:;])", r"\1", cleaned)
    # Fix broken contraction spaces e.g. "didn t" -> "didn't" and "it 's" -> "it's"
    cleaned = re.sub(r"\b([A-Za-z]+)\s+([stmd]|ll|ve|re)\b", r"\1'\2", cleaned)
    cleaned = re.sub(r"\s+['’]([stmd]|ll|ve|re)\b", r"'\1", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def slug_to_title(slug: str) -> str:
    """
    Converts a hyphen/underscore slug into Title Case.
    e.g. 'how-magic-works' -> 'How Magic Works'
    """
    if not slug:
        return ""
    words = [w for w in re.split(r"[-_]+", slug) if w]
    return " ".join(w.capitalize() for w in words)


def format_timestamp(seconds: float, force_hours: bool = False) -> str:
    """
    Formats a floating-point seconds value into WebVTT timestamp format.
    Format: MM:SS.mmm or HH:MM:SS.mmm (when force_hours is True or hours > 0).
    Uses integer millisecond divmod to guarantee no second/minute rollover overflow.
    """
    seconds = max(0.0, float(seconds))
    total_ms = int(round(seconds * 1000))
    total_seconds, ms = divmod(total_ms, 1000)
    hours, remainder = divmod(total_seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours > 0 or force_hours:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{ms:03d}"
    else:
        return f"{minutes:02d}:{secs:02d}.{ms:03d}"


def format_bilingual_vtt(cues: List[Dict[str, Any]]) -> str:
    """
    Assembles cue dictionaries into a compliant bilingual WebVTT subtitle stream.
    Enforces minimum 0.8s duration per cue and strips any Unicode emojis.
    Line 1: English transcription
    Line 2: Chinese translation
    """
    lines = ["WEBVTT - Hogwarts Audio Bilingual Subtitles", ""]

    for cue in cues:
        start_sec = max(0.0, float(cue.get("start", 0.0) or 0.0))
        cue_end = cue.get("end")
        raw_end = float(cue_end) if cue_end is not None else (start_sec + 0.8)
        end_sec = max(raw_end, start_sec + 0.8)

        text = strip_emojis(cue.get("text", ""))
        trans = strip_emojis(cue.get("translation", ""))

        # If both text and translation are empty, skip cue
        if not text and not trans:
            continue

        force_hours = (start_sec >= 3600.0 or end_sec >= 3600.0)
        start_str = format_timestamp(start_sec, force_hours=force_hours)
        end_str = format_timestamp(end_sec, force_hours=force_hours)

        lines.append(f"{start_str} --> {end_str}")
        if text:
            lines.append(text)
        if trans:
            lines.append(trans)
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def _find_content_compiler_script() -> Optional[str]:
    """
    Locates the scripts/content-compiler.js path.
    """
    env_path = os.environ.get("CONTENT_COMPILER_PATH")
    if env_path and os.path.exists(env_path):
        return os.path.abspath(env_path)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidate1 = os.path.abspath(os.path.join(base_dir, "..", "..", "..", "scripts", "content-compiler.js"))
    if os.path.exists(candidate1):
        return candidate1

    candidate2 = os.path.abspath(os.path.join(os.getcwd(), "scripts", "content-compiler.js"))
    if os.path.exists(candidate2):
        return candidate2

    return None


def export_hogwarts_suite(
    media_path: str,
    subtitles: List[Dict[str, Any]],
    meta_info: Dict[str, Any],
    content_root: str,
    recompile_feed: bool = True,
    force: bool = False
) -> Dict[str, Any]:
    """
    Exports media, bilingual subtitle.vtt, and meta.json adhering to Hogwarts Audio schema.
    Optionally triggers content feed compilation.

    Returns:
    {
      'success': bool,
      'target_dir': str,
      'created_files': list[str],
      'errors': list[str]
    }
    """
    errors: List[str] = []
    created_files: List[str] = []

    if not content_root or not isinstance(content_root, str):
        return {
            "success": False,
            "target_dir": "",
            "created_files": [],
            "errors": ["Target content root directory is required and must be a valid path string."]
        }

    resolved_content_root = os.path.abspath(content_root)

    # Validate media path
    if not media_path or not os.path.exists(media_path):
        return {
            "success": False,
            "target_dir": "",
            "created_files": [],
            "errors": [f"Media file not found: {media_path}"]
        }

    # Validate type
    raw_type = str(meta_info.get("type", "")).strip().lower()
    if raw_type not in ("ted", "podcast"):
        return {
            "success": False,
            "target_dir": "",
            "created_files": [],
            "errors": [f"Invalid or missing content type: '{raw_type}'. Must be 'ted' or 'podcast'."]
        }

    # Validate id / slug
    content_id = str(meta_info.get("id", "")).strip()
    if not content_id or not re.match(r"^[a-zA-Z0-9_-]+$", content_id):
        return {
            "success": False,
            "target_dir": "",
            "created_files": [],
            "errors": [f"Invalid content ID/slug: '{content_id}'. Must contain only alphanumeric characters, dashes, and underscores."]
        }

    # Calculate duration & wpm from subtitles if available
    calc_duration = int(round(max([float(c.get("end", 0.0)) for c in subtitles], default=0.0)))
    raw_duration = meta_info.get("duration")
    duration = int(raw_duration) if raw_duration is not None else calc_duration

    total_words = sum(len(strip_emojis(c.get("text", "")).split()) for c in subtitles)
    default_wpm = int(round(total_words / (duration / 60.0))) if duration > 0 else 140
    raw_wpm = meta_info.get("wpm")
    wpm = int(raw_wpm) if raw_wpm is not None else (default_wpm if default_wpm > 0 else 140)

    try:
        if raw_type == "ted":
            target_dir = os.path.join(resolved_content_root, "ted", content_id)
            if os.path.exists(target_dir) and not force:
                return {
                    "success": False,
                    "target_dir": target_dir,
                    "created_files": [],
                    "errors": [f"Target directory already exists: {target_dir}. Use force=True to overwrite."]
                }

            os.makedirs(target_dir, exist_ok=True)

            # Copy media file
            media_ext = os.path.splitext(media_path)[1].lower()
            video_filename = "video.webm" if media_ext == ".webm" else "video.mp4"
            target_media = os.path.join(target_dir, video_filename)
            shutil.copy2(media_path, target_media)
            created_files.append(target_media)

            # Write subtitle.vtt
            vtt_content = format_bilingual_vtt(subtitles)
            vtt_path = os.path.join(target_dir, "subtitle.vtt")
            with open(vtt_path, "w", encoding="utf-8") as f:
                f.write(vtt_content)
            created_files.append(vtt_path)

            # Build TED meta.json
            display_title = strip_emojis(meta_info.get("title")) or slug_to_title(content_id)
            speaker = strip_emojis(meta_info.get("speaker")) or "TED Speaker"
            year = int(meta_info.get("year", datetime.now().year))
            difficulty = strip_emojis(meta_info.get("difficulty")) or "Intermediate"
            cefr_level = strip_emojis(meta_info.get("cefrLevel")) or "B1"
            topic = strip_emojis(meta_info.get("topic")) or "General"
            description = strip_emojis(meta_info.get("description")) or "Standard TED talk template generated by Hogwarts Audio."

            ted_meta = {
                "id": content_id,
                "title": display_title,
                "speaker": speaker,
                "year": year,
                "duration": duration,
                "durationSeconds": duration,
                "difficulty": difficulty,
                "cefrLevel": cefr_level,
                "wpm": wpm,
                "topic": topic,
                "description": description
            }

            if "titleCn" in meta_info:
                ted_meta["titleCn"] = strip_emojis(meta_info["titleCn"])
            if "vocabSet" in meta_info and isinstance(meta_info["vocabSet"], list):
                ted_meta["vocabSet"] = meta_info["vocabSet"]
            if "tasks" in meta_info and isinstance(meta_info["tasks"], dict):
                ted_meta["tasks"] = meta_info["tasks"]
            if "shadowingSegments" in meta_info and isinstance(meta_info["shadowingSegments"], list):
                ted_meta["shadowingSegments"] = meta_info["shadowingSegments"]

            meta_path = os.path.join(target_dir, "meta.json")
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(ted_meta, f, indent=2, ensure_ascii=False)
                f.write("\n")
            created_files.append(meta_path)

        else:
            # Podcast synthesis
            series_dir = os.path.join(resolved_content_root, "podcasts", content_id)
            chapter_num = max(1, int(meta_info.get("chapter", 1)))
            ep_folder = f"ep{chapter_num:02d}"
            target_dir = os.path.join(series_dir, "episodes", ep_folder)

            if os.path.exists(target_dir) and not force:
                return {
                    "success": False,
                    "target_dir": target_dir,
                    "created_files": [],
                    "errors": [f"Target episode directory already exists: {target_dir}. Use force=True to overwrite."]
                }

            os.makedirs(target_dir, exist_ok=True)

            # Copy media file
            media_ext = os.path.splitext(media_path)[1].lower()
            audio_filename = f"audio{media_ext}" if media_ext in (".m4a", ".wav", ".aac", ".ogg", ".flac") else "audio.mp3"
            target_media = os.path.join(target_dir, audio_filename)
            shutil.copy2(media_path, target_media)
            created_files.append(target_media)

            # Write subtitles.vtt
            vtt_content = format_bilingual_vtt(subtitles)
            vtt_path = os.path.join(target_dir, "subtitles.vtt")
            with open(vtt_path, "w", encoding="utf-8") as f:
                f.write(vtt_content)
            created_files.append(vtt_path)

            # Write episode meta.json
            ep_title = strip_emojis(meta_info.get("episode_title") or meta_info.get("title") or f"Chapter {chapter_num}")
            ep_meta = {
                "chapter": chapter_num,
                "title": ep_title,
                "audio": audio_filename,
                "vtt": "subtitles.vtt",
                "durationSeconds": duration
            }
            if "cnTitle" in meta_info:
                ep_meta["cnTitle"] = strip_emojis(meta_info["cnTitle"])

            ep_meta_path = os.path.join(target_dir, "meta.json")
            with open(ep_meta_path, "w", encoding="utf-8") as f:
                json.dump(ep_meta, f, indent=2, ensure_ascii=False)
                f.write("\n")
            created_files.append(ep_meta_path)

            # Ensure series root meta.json exists
            series_meta_path = os.path.join(series_dir, "meta.json")
            if not os.path.exists(series_meta_path):
                series_title = strip_emojis(meta_info.get("series_title") or meta_info.get("title") or slug_to_title(content_id))
                author = strip_emojis(meta_info.get("author")) or "J.K. Rowling"
                narrator = strip_emojis(meta_info.get("narrator")) or "Stephen Fry"
                series_name = strip_emojis(meta_info.get("series")) or "Harry Potter"
                cover = strip_emojis(meta_info.get("cover")) or "cover.jpg"
                series_desc = strip_emojis(meta_info.get("description")) or "Standard podcast series template generated by Hogwarts Audio."

                root_meta = {
                    "id": content_id,
                    "title": series_title,
                    "author": author,
                    "narrator": narrator,
                    "series": series_name,
                    "cover": cover,
                    "description": series_desc
                }
                if "series_cnTitle" in meta_info or "cnTitle" in meta_info:
                    root_meta["cnTitle"] = strip_emojis(meta_info.get("series_cnTitle") or meta_info.get("cnTitle"))

                with open(series_meta_path, "w", encoding="utf-8") as f:
                    json.dump(root_meta, f, indent=2, ensure_ascii=False)
                    f.write("\n")
                created_files.append(series_meta_path)

    except Exception as exc:
        return {
            "success": False,
            "target_dir": target_dir if "target_dir" in locals() else "",
            "created_files": created_files,
            "errors": [f"Export failed with exception: {str(exc)}"]
        }

    # Trigger feed re-compilation if requested
    if recompile_feed:
        compiler_script = _find_content_compiler_script()
        if not compiler_script:
            errors.append("scripts/content-compiler.js not found for feed recompilation.")
        else:
            try:
                cmd = ["node", compiler_script, f"--content-dir={resolved_content_root}"]
                run_res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
                if run_res.returncode != 0:
                    err_msg = run_res.stderr.strip() or run_res.stdout.strip()
                    errors.append(f"Content compiler returned exit code {run_res.returncode}: {err_msg}")
            except Exception as proc_exc:
                errors.append(f"Failed to execute content compiler: {str(proc_exc)}")

    return {
        "success": len(errors) == 0,
        "target_dir": target_dir,
        "created_files": created_files,
        "errors": errors
    }
