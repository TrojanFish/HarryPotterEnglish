import os
import sys
import argparse
from typing import Optional, List

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from core.transcriber import Transcriber, DEFAULT_MODEL_SIZE
from core.translator import translate_subtitles
from core.suite_exporter import export_hogwarts_suite


def build_arg_parser() -> argparse.ArgumentParser:
    """Builds and returns the CLI argument parser."""
    parser = argparse.ArgumentParser(
        prog="whisper-studio",
        description="Hogwarts Audio Transcription Studio CLI - automated transcription & content ingestion"
    )
    parser.add_argument("--input", required=True, help="Path to source media file (audio or video)")
    parser.add_argument("--type", required=True, choices=["ted", "podcast"], help="Content type: 'ted' or 'podcast'")
    parser.add_argument("--id", required=True, help="Safe slug identifier for the content item")
    parser.add_argument("--title", default=None, help="Display title")
    parser.add_argument("--speaker", default=None, help="Speaker name (for TED talk)")
    parser.add_argument("--author", default="J.K. Rowling", help="Author (for podcast series)")
    parser.add_argument("--narrator", default="Stephen Fry", help="Narrator (for podcast series)")
    parser.add_argument("--chapter", type=int, default=1, help="Chapter number (for podcast episode)")
    parser.add_argument("--model", default=DEFAULT_MODEL_SIZE, help="Faster-whisper model name or path")
    parser.add_argument("--translate", default="google", choices=["google", "gemini", "none"], help="Translation engine")
    parser.add_argument("--mock", action="store_true", help="Run in mock mode without downloading model weights")
    parser.add_argument("--force", action="store_true", help="Force overwrite existing target directory")
    parser.add_argument("--content-root", default="content", help="Root content directory (default: 'content')")
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    """CLI entrypoint function."""
    parser = build_arg_parser()
    args = parser.parse_args(argv if argv is not None else sys.argv[1:])

    # Validate source media file existence
    if not os.path.exists(args.input):
        print(f"[ERROR] Source media file not found: {args.input}", file=sys.stderr)
        return 1

    print(f"[INFO] Initializing Hogwarts Audio ingestion pipeline...")
    print(f"[INFO] Source media: {args.input}")
    print(f"[INFO] Content type: {args.type} | ID: {args.id}")

    # Step 1: Transcription
    print(f"[INFO] Transcribing audio with Faster-Whisper (mock={args.mock})...")
    transcriber = Transcriber(model_size=args.model, mock_mode=args.mock)
    try:
        cues = transcriber.transcribe(args.input)
    except Exception as exc:
        print(f"[ERROR] Transcription failed: {str(exc)}", file=sys.stderr)
        return 1

    print(f"[INFO] Extracted {len(cues)} subtitle cues.")

    # Step 2: Translation
    if args.translate != "none":
        print(f"[INFO] Translating subtitles using engine '{args.translate}'...")
        try:
            cues = translate_subtitles(cues, engine=args.translate)
        except Exception as exc:
            print(f"[WARN] Translation failed: {str(exc)}. Continuing with empty translations.", file=sys.stderr)
    else:
        cues = translate_subtitles(cues, engine="none")

    # Step 3: Meta info assembly
    meta_info = {
        "type": args.type,
        "id": args.id,
    }
    if args.title:
        meta_info["title"] = args.title

    if args.type == "ted":
        if args.speaker:
            meta_info["speaker"] = args.speaker
    elif args.type == "podcast":
        meta_info["chapter"] = args.chapter
        meta_info["author"] = args.author
        meta_info["narrator"] = args.narrator

    # Step 4: Hogwarts Suite export & feed recompilation
    print(f"[INFO] Exporting Hogwarts suite into '{args.content_root}'...")
    result = export_hogwarts_suite(
        media_path=args.input,
        subtitles=cues,
        meta_info=meta_info,
        content_root=args.content_root,
        recompile_feed=True,
        force=args.force
    )

    if result.get("success"):
        print(f"[INFO] Ingestion completed successfully!")
        print(f"[INFO] Target directory: {result.get('target_dir')}")
        for path in result.get("created_files", []):
            print(f"  + {path}")
        return 0
    else:
        print("[ERROR] Ingestion failed with errors:", file=sys.stderr)
        for err in result.get("errors", []):
            print(f"  - {err}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
