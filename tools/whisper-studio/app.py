import os
import re
import sys
import argparse
from typing import Optional, List, Dict, Any, Tuple, Generator

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import gradio as gr
from core.transcriber import Transcriber, DEFAULT_MODEL_SIZE
from core.translator import translate_subtitles
from core.suite_exporter import export_hogwarts_suite

MEDIA_EXTENSIONS = {".mp4", ".webm", ".mp3", ".m4a", ".wav", ".flac", ".mkv", ".ogg"}


def detect_device() -> Tuple[str, str]:
    """
    Detects available hardware acceleration for Faster-Whisper.
    Returns a tuple of (device_name, badge_label) without any Unicode emojis.
    """
    try:
        import torch
        if torch.cuda.is_available():
            name = torch.cuda.get_device_name(0)
            return "cuda", f"[GPU Ready: CUDA - {name}]" if name else "[GPU Ready: CUDA]"
    except Exception:
        pass
    return "cpu", "[CPU Mode]"


def derive_id(filename_or_path: str) -> str:
    """
    Derives a safe slug identifier from a filename or path.
    Example: 'Harry Potter 01 - The Boy Who Lived.mp3' -> 'harry-potter-01-the-boy-who-lived'
    """
    if not filename_or_path:
        return ""
    base = os.path.splitext(os.path.basename(filename_or_path))[0]
    slug = re.sub(r"[^\w\s-]", "", base).strip().lower()
    slug = re.sub(r"[-\s]+", "-", slug)
    return slug


def derive_title(filename_or_path: str) -> str:
    """
    Derives a display title from a filename or path.
    Example: 'harry-potter-01-the-boy-who-lived.mp4' -> 'Harry Potter 01 The Boy Who Lived'
    """
    if not filename_or_path:
        return ""
    base = os.path.splitext(os.path.basename(filename_or_path))[0]
    clean = re.sub(r"[-_]+", " ", base).strip()
    return " ".join(word.capitalize() for word in clean.split())


def on_file_uploaded(media_file) -> Tuple[str, str]:
    """Gradio callback to auto-populate ID and title upon file upload."""
    if not media_file:
        return "", ""
    filepath = media_file.name if hasattr(media_file, "name") else str(media_file)
    return derive_id(filepath), derive_title(filepath)


def on_target_type_change(target_type_label: str):
    """Gradio callback to toggle between TED and Podcast specific metadata inputs."""
    is_ted = "TED" in str(target_type_label)
    return (
        gr.update(visible=is_ted),      # speaker
        gr.update(visible=not is_ted),  # chapter
        gr.update(visible=not is_ted),  # author
        gr.update(visible=not is_ted),  # narrator
    )


def transcribe_and_export_single(
    media_file,
    target_type: str,
    content_id: str,
    title: str,
    speaker: str = "TED Speaker",
    chapter: int = 1,
    author: str = "J.K. Rowling",
    narrator: str = "Stephen Fry",
    model_size: str = DEFAULT_MODEL_SIZE,
    compute_type: str = "int8",
    translation_engine: str = "Google Translate (Free)",
    force_overwrite: bool = False,
    mock_mode: bool = False,
    content_root: str = "content"
) -> Tuple[str, str]:
    """
    Processes a single media file: runs faster-whisper, sentence splitting,
    bilingual translation, and exports standard Hogwarts suite.
    """
    if not media_file:
        return "[ERROR] No media file provided.", "[ERROR] Ingestion aborted: Missing media file."

    media_path = media_file.name if hasattr(media_file, "name") else str(media_file)
    if not os.path.exists(media_path):
        return f"[ERROR] Media file not found: {media_path}", "[ERROR] Ingestion aborted: File not found."

    type_key = "ted" if "ted" in str(target_type).lower() else "podcast"
    content_id = (content_id or "").strip() or derive_id(media_path)
    title = (title or "").strip() or derive_title(media_path)

    # Resolve translation engine
    engine_lower = str(translation_engine).lower()
    if "google" in engine_lower:
        engine_key = "google"
    elif "gemini" in engine_lower:
        engine_key = "gemini"
    else:
        engine_key = "none"

    logs: List[str] = []
    logs.append("[INFO] Initializing Hogwarts Audio ingestion pipeline...")
    logs.append(f"[INFO] Source media: {media_path}")
    logs.append(f"[INFO] Content type: {type_key} | ID: {content_id}")

    # Step 1: Transcription
    logs.append(f"[INFO] Transcribing audio with Faster-Whisper (model: {model_size}, compute: {compute_type}, mock={mock_mode})...")
    try:
        transcriber = Transcriber(model_size=model_size, compute_type=compute_type, mock_mode=mock_mode)
        cues = transcriber.transcribe(media_path)
        logs.append(f"[INFO] Extracted {len(cues)} subtitle cues.")
    except Exception as exc:
        err_msg = f"[ERROR] Transcription failed: {str(exc)}"
        logs.append(err_msg)
        return "\n".join(logs), f"[ERROR] Failed during transcription:\n{str(exc)}"

    # Step 2: Translation
    if engine_key != "none":
        logs.append(f"[INFO] Translating subtitles using engine '{engine_key}'...")
        try:
            cues = translate_subtitles(cues, engine=engine_key)
            logs.append("[INFO] Translation completed successfully.")
        except Exception as exc:
            logs.append(f"[WARN] Translation failed: {str(exc)}. Continuing with empty translations.")
            cues = translate_subtitles(cues, engine="none")
    else:
        cues = translate_subtitles(cues, engine="none")

    # Step 3: Metadata Assembly
    meta_info: Dict[str, Any] = {
        "type": type_key,
        "id": content_id,
        "title": title
    }
    if type_key == "ted":
        meta_info["speaker"] = speaker or "TED Speaker"
    else:
        meta_info["chapter"] = int(chapter) if chapter else 1
        meta_info["author"] = author or "J.K. Rowling"
        meta_info["narrator"] = narrator or "Stephen Fry"

    # Step 4: Hogwarts Suite Export
    logs.append(f"[INFO] Exporting Hogwarts suite into '{content_root}'...")
    try:
        result = export_hogwarts_suite(
            media_path=media_path,
            subtitles=cues,
            meta_info=meta_info,
            content_root=content_root,
            recompile_feed=True,
            force=force_overwrite
        )
    except Exception as exc:
        err_msg = f"[ERROR] Suite export failed: {str(exc)}"
        logs.append(err_msg)
        return "\n".join(logs), f"[ERROR] Export failed:\n{str(exc)}"

    if result.get("success"):
        logs.append("[INFO] Ingestion completed successfully!")
        target_dir = result.get("target_dir", "")
        created_files = result.get("created_files", [])

        summary_lines = [
            "[SUCCESS] Content ingested successfully!",
            f"Target Directory: {target_dir}",
            "Created Suite Files:"
        ]
        for path in created_files:
            summary_lines.append(f"  + {path}")
        summary_lines.append("Catalog Feed Recompilation: [OK]")

        return "\n".join(logs), "\n".join(summary_lines)
    else:
        logs.append("[ERROR] Ingestion failed with errors.")
        err_list = result.get("errors", [])
        summary_lines = [
            "[ERROR] Suite export failed:",
            *[f"  - {err}" for err in err_list]
        ]
        return "\n".join(logs), "\n".join(summary_lines)


def scan_batch_folder(folder_path: str) -> str:
    """
    Scans a folder for valid media files and returns a summary message.
    """
    if not folder_path or not os.path.exists(folder_path):
        return f"[ERROR] Invalid directory path: '{folder_path}'"

    media_files = []
    try:
        with os.scandir(folder_path) as it:
            for entry in it:
                if entry.is_file():
                    ext = os.path.splitext(entry.name)[1].lower()
                    if ext in MEDIA_EXTENSIONS:
                        media_files.append(entry.name)
    except Exception as exc:
        return f"[ERROR] Failed to scan directory: {str(exc)}"

    media_files.sort()
    return f"[INFO] Discovered {len(media_files)} media files in '{folder_path}'. Ready for batch processing."


def process_batch_folder(
    folder_path: str,
    target_type: str,
    model_size: str = DEFAULT_MODEL_SIZE,
    compute_type: str = "int8",
    translation_engine: str = "Google Translate (Free)",
    force_overwrite: bool = False,
    mock_mode: bool = False,
    content_root: str = "content"
) -> Generator[str, None, None]:
    """
    Iterates over media files in folder_path, ingesting each into Hogwarts suite.
    Streams logs line-by-line for Gradio real-time display.
    """
    if not folder_path or not os.path.exists(folder_path):
        yield f"[ERROR] Directory does not exist: '{folder_path}'"
        return

    media_paths = []
    try:
        with os.scandir(folder_path) as it:
            for entry in it:
                if entry.is_file():
                    ext = os.path.splitext(entry.name)[1].lower()
                    if ext in MEDIA_EXTENSIONS:
                        media_paths.append(entry.path)
    except Exception as exc:
        yield f"[ERROR] Failed to read directory: {str(exc)}"
        return

    media_paths.sort()
    if not media_paths:
        yield f"[INFO] No supported media files ({', '.join(MEDIA_EXTENSIONS)}) found in '{folder_path}'."
        return

    type_key = "ted" if "ted" in str(target_type).lower() else "podcast"
    total = len(media_paths)
    current_logs = [f"[INFO] Starting batch processing of {total} files (type={type_key})..."]
    yield "\n".join(current_logs)

    success_count = 0
    failure_count = 0

    for idx, path in enumerate(media_paths, start=1):
        filename = os.path.basename(path)
        content_id = derive_id(filename)
        title = derive_title(filename)

        current_logs.append(f"\n[INFO] --- [{idx}/{total}] Processing: {filename} ---")
        yield "\n".join(current_logs)

        # Execute single file ingestion
        log_res, summary_res = transcribe_and_export_single(
            media_file=path,
            target_type=type_key,
            content_id=content_id,
            title=title,
            speaker="TED Speaker",
            chapter=idx,
            author="J.K. Rowling",
            narrator="Stephen Fry",
            model_size=model_size,
            compute_type=compute_type,
            translation_engine=translation_engine,
            force_overwrite=force_overwrite,
            mock_mode=mock_mode,
            content_root=content_root
        )

        if "[SUCCESS]" in summary_res:
            success_count += 1
            current_logs.append(f"[INFO] [{idx}/{total}] Ingested: {content_id} [OK]")
        else:
            failure_count += 1
            current_logs.append(f"[ERROR] [{idx}/{total}] Failed: {content_id}")

        yield "\n".join(current_logs)

    current_logs.append(f"\n[INFO] Batch complete! Success: {success_count}, Failed: {failure_count}, Total: {total}.")
    yield "\n".join(current_logs)


def build_ui(mock_mode: bool = False) -> gr.Blocks:
    """
    Builds and returns the modern Gradio workbench for Hogwarts Audio.
    Adheres strictly to zero-emoji design requirements.
    """
    device_name, device_badge = detect_device()

    with gr.Blocks(title="Hogwarts Audio - Whisper Transcription Studio") as demo:
        # Header Section
        gr.Markdown(
            f"# Hogwarts Audio - Whisper Transcription Studio\n\n"
            f"Local AI Speech-to-Text, Spacy Semantic Boundary Splitting, "
            f"Bilingual Translation, and Standard Suite Exporter.\n\n"
            f"Hardware Status: **{device_badge}**"
        )

        with gr.Tabs():
            # Tab 1: Single File Studio
            with gr.Tab("单文件转写与套件导出 (Single File Studio)"):
                with gr.Row():
                    # Left Column: Inputs & Controls
                    with gr.Column(scale=1):
                        media_input = gr.File(
                            label="Media File Uploader",
                            file_types=[".mp4", ".webm", ".mp3", ".m4a", ".wav"]
                        )
                        target_type_radio = gr.Radio(
                            choices=["TED 演讲 (content/ted/)", "有声书章节 (content/podcasts/)"],
                            value="TED 演讲 (content/ted/)",
                            label="Target Content Type"
                        )

                        # Metadata inputs
                        content_id_input = gr.Textbox(
                            label="Content ID (--id)",
                            placeholder="e.g. magic-of-reading (auto-derived if empty)"
                        )
                        title_input = gr.Textbox(
                            label="Display Title (--title)",
                            placeholder="e.g. Magic of Reading (auto-derived if empty)"
                        )

                        # Type-conditional inputs
                        speaker_input = gr.Textbox(
                            label="Speaker Name",
                            value="TED Speaker",
                            visible=True
                        )
                        chapter_input = gr.Number(
                            label="Chapter Number",
                            value=1,
                            precision=0,
                            visible=False
                        )
                        author_input = gr.Textbox(
                            label="Author",
                            value="J.K. Rowling",
                            visible=False
                        )
                        narrator_input = gr.Textbox(
                            label="Narrator",
                            value="Stephen Fry",
                            visible=False
                        )

                        # Compute and model settings
                        with gr.Row():
                            model_dropdown = gr.Dropdown(
                                choices=[
                                    "deepdml/faster-whisper-large-v3-turbo-ct2",
                                    "large-v3",
                                    "medium",
                                    "small",
                                    "base",
                                    "tiny"
                                ],
                                value="deepdml/faster-whisper-large-v3-turbo-ct2",
                                label="Faster-Whisper Model"
                            )
                            compute_dropdown = gr.Dropdown(
                                choices=["int8", "float16", "int8_float16", "default"],
                                value="int8",
                                label="Compute Type"
                            )

                        translation_radio = gr.Radio(
                            choices=["Google Translate (Free)", "Gemini API", "None"],
                            value="Google Translate (Free)",
                            label="Translation Engine"
                        )
                        force_checkbox = gr.Checkbox(
                            label="Force Overwrite Existing Directory",
                            value=False
                        )

                        start_single_btn = gr.Button(
                            "开始转写并导出至 Hogwarts 套件",
                            variant="primary"
                        )

                    # Right Column: Output Logs & Summary
                    with gr.Column(scale=1):
                        single_log_box = gr.Textbox(
                            label="Real-time Output Log",
                            lines=14,
                            interactive=False
                        )
                        single_summary_box = gr.Textbox(
                            label="Ingestion Summary",
                            lines=6,
                            interactive=False
                        )

                # Tab 1 Event Bindings
                media_input.change(
                    fn=on_file_uploaded,
                    inputs=[media_input],
                    outputs=[content_id_input, title_input]
                )
                target_type_radio.change(
                    fn=on_target_type_change,
                    inputs=[target_type_radio],
                    outputs=[speaker_input, chapter_input, author_input, narrator_input]
                )

                def _run_single(media, t_type, c_id, ttl, spk, chp, aut, nar, mdl, cmp, trn, frc):
                    return transcribe_and_export_single(
                        media_file=media,
                        target_type=t_type,
                        content_id=c_id,
                        title=ttl,
                        speaker=spk,
                        chapter=chp,
                        author=aut,
                        narrator=nar,
                        model_size=mdl,
                        compute_type=cmp,
                        translation_engine=trn,
                        force_overwrite=frc,
                        mock_mode=mock_mode
                    )

                start_single_btn.click(
                    fn=_run_single,
                    inputs=[
                        media_input,
                        target_type_radio,
                        content_id_input,
                        title_input,
                        speaker_input,
                        chapter_input,
                        author_input,
                        narrator_input,
                        model_dropdown,
                        compute_dropdown,
                        translation_radio,
                        force_checkbox
                    ],
                    outputs=[single_log_box, single_summary_box]
                )

            # Tab 2: Batch Folder Studio
            with gr.Tab("批量文件夹转写 (Batch Folder Studio)"):
                with gr.Row():
                    with gr.Column(scale=1):
                        folder_path_input = gr.Textbox(
                            label="Target Folder Path",
                            placeholder="e.g. C:/audio_batch/ or content/raw_ted/"
                        )
                        scan_btn = gr.Button("Scan Directory")
                        batch_type_radio = gr.Radio(
                            choices=["TED 演讲 (content/ted/)", "有声书章节 (content/podcasts/)"],
                            value="TED 演讲 (content/ted/)",
                            label="Target Content Type"
                        )
                        with gr.Row():
                            batch_model_dropdown = gr.Dropdown(
                                choices=[
                                    "deepdml/faster-whisper-large-v3-turbo-ct2",
                                    "large-v3",
                                    "medium",
                                    "small",
                                    "base",
                                    "tiny"
                                ],
                                value="deepdml/faster-whisper-large-v3-turbo-ct2",
                                label="Faster-Whisper Model"
                            )
                            batch_compute_dropdown = gr.Dropdown(
                                choices=["int8", "float16", "int8_float16", "default"],
                                value="int8",
                                label="Compute Type"
                            )
                        batch_trans_radio = gr.Radio(
                            choices=["Google Translate (Free)", "Gemini API", "None"],
                            value="Google Translate (Free)",
                            label="Translation Engine"
                        )
                        batch_force_checkbox = gr.Checkbox(
                            label="Force Overwrite Existing Items",
                            value=False
                        )
                        with gr.Row():
                            start_batch_btn = gr.Button("Start Batch Processing", variant="primary")
                            stop_batch_btn = gr.Button("Stop Batch Processing", variant="stop")

                    with gr.Column(scale=1):
                        batch_log_box = gr.Textbox(
                            label="Batch Processing Logs",
                            lines=18,
                            interactive=False
                        )

                # Tab 2 Event Bindings
                scan_btn.click(
                    fn=scan_batch_folder,
                    inputs=[folder_path_input],
                    outputs=[batch_log_box]
                )

                def _run_batch(f_path, b_type, b_mdl, b_cmp, b_trn, b_frc):
                    yield from process_batch_folder(
                        folder_path=f_path,
                        target_type=b_type,
                        model_size=b_mdl,
                        compute_type=b_cmp,
                        translation_engine=b_trn,
                        force_overwrite=b_frc,
                        mock_mode=mock_mode
                    )

                batch_event = start_batch_btn.click(
                    fn=_run_batch,
                    inputs=[
                        folder_path_input,
                        batch_type_radio,
                        batch_model_dropdown,
                        batch_compute_dropdown,
                        batch_trans_radio,
                        batch_force_checkbox
                    ],
                    outputs=[batch_log_box]
                )
                stop_batch_btn.click(fn=None, cancels=[batch_event])

    return demo


def main() -> None:
    """CLI entrypoint for launching Gradio Studio."""
    parser = argparse.ArgumentParser(description="Hogwarts Audio - Whisper Transcription Studio")
    parser.add_argument("--host", default="127.0.0.1", help="Server host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=7860, help="Server port (default: 7860)")
    parser.add_argument("--share", action="store_true", help="Create a public Gradio link")
    parser.add_argument("--mock", action="store_true", help="Run with mock transcription engine")
    args = parser.parse_args()

    demo = build_ui(mock_mode=args.mock)
    demo.launch(server_name=args.host, server_port=args.port, share=args.share)


if __name__ == "__main__":
    main()
