import os
import re
import sys
import json
import argparse
from typing import Optional, List, Dict, Any, Tuple, Generator

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import gradio as gr
from core.transcriber import Transcriber, DEFAULT_MODEL_SIZE
from core.translator import translate_subtitles, get_gemini_api_key
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
            return "cuda", f"[GPU 准备就绪: CUDA - {name}]" if name else "[GPU 准备就绪: CUDA]"
    except Exception:
        pass
    return "cpu", "[CPU 运行模式]"


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


def on_translation_engine_change(engine_label: str):
    """Gradio callback to conditionally show Gemini API key input."""
    is_gemini = "gemini" in str(engine_label).lower()
    return gr.update(visible=is_gemini)


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
    translation_engine: str = "Google 免费翻译",
    gemini_api_key: str = "",
    force_overwrite: bool = False,
    mock_mode: bool = False,
    content_root: str = "content",
    return_artifacts: bool = False
) -> Tuple[Any, ...]:
    """
    Processes a single media file: runs faster-whisper, sentence splitting,
    bilingual translation, and exports standard Hogwarts suite.
    Optionally returns artifacts dictionary containing media_path, vtt_content, and meta_json.
    """
    if not media_file:
        err_res = ("[ERROR] 未提供任何媒体文件。", "[ERROR] 转写终止：缺少媒体文件。")
        return (*err_res, {}) if return_artifacts else err_res

    media_path = media_file.name if hasattr(media_file, "name") else str(media_file)
    if not os.path.exists(media_path):
        err_res = (f"[ERROR] 找不到媒体文件: {media_path}", "[ERROR] 转写终止：文件不存在。")
        return (*err_res, {}) if return_artifacts else err_res

    type_key = "ted" if "ted" in str(target_type).lower() else "podcast"
    content_id = (content_id or "").strip() or derive_id(media_path)
    title = (title or "").strip() or derive_title(media_path)

    # Resolve translation engine
    engine_lower = str(translation_engine).lower()
    if "gemini" in engine_lower:
        engine_key = "gemini"
    elif "google" in engine_lower:
        engine_key = "google"
    else:
        engine_key = "none"

    logs: List[str] = []
    logs.append("[INFO] 正在初始化 Hogwarts Audio 转写与套件合成流水线...")
    logs.append(f"[INFO] 输入媒体文件: {media_path}")
    logs.append(f"[INFO] 目标类型: {type_key} | 唯一标识 ID: {content_id}")

    # Step 1: Transcription
    logs.append(f"[INFO] 正在使用 Faster-Whisper 执行语音识别 (模型: {model_size}, 计算精度: {compute_type}, mock={mock_mode})...")
    try:
        transcriber = Transcriber(model_size=model_size, compute_type=compute_type, mock_mode=mock_mode)
        cues = transcriber.transcribe(media_path)
        logs.append(f"[INFO] 识别完成，提取到 {len(cues)} 条意群字幕。")
    except Exception as exc:
        err_msg = f"[ERROR] 语音识别失败: {str(exc)}"
        logs.append(err_msg)
        err_res = ("\n".join(logs), f"[ERROR] 转写阶段发生异常:\n{str(exc)}")
        return (*err_res, {}) if return_artifacts else err_res

    # Step 2: Translation
    if engine_key != "none":
        logs.append(f"[INFO] 正在使用 '{engine_key}' 引擎执行中英双语字幕翻译...")
        try:
            cues = translate_subtitles(cues, engine=engine_key, api_key=gemini_api_key)
            logs.append("[INFO] 字幕翻译完成。")
        except Exception as exc:
            logs.append(f"[WARN] 翻译失败: {str(exc)}。将使用空译文继续生成。")
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
    logs.append(f"[INFO] 正在将标准套件导出至 '{content_root}' 目录...")
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
        err_msg = f"[ERROR] 套件导出失败: {str(exc)}"
        logs.append(err_msg)
        err_res = ("\n".join(logs), f"[ERROR] 导出过程发生异常:\n{str(exc)}")
        return (*err_res, {}) if return_artifacts else err_res

    if result.get("success"):
        logs.append("[INFO] 内容入库全部完成！")
        target_dir = result.get("target_dir", "")
        created_files = result.get("created_files", [])

        summary_lines = [
            "[SUCCESS] 内容入库成功！",
            f"目标目录: {target_dir}",
            "生成的文件清单:"
        ]
        for path in created_files:
            summary_lines.append(f"  + {path}")
        summary_lines.append("全站内容清单重编: [OK]")

        # Assemble artifacts dictionary for UI preview
        artifacts: Dict[str, Any] = {
            "target_dir": target_dir,
            "media_path": "",
            "media_type": "video" if type_key == "ted" else "audio",
            "vtt_path": "",
            "vtt_content": "",
            "meta_path": "",
            "meta_json": {}
        }
        for file_path in created_files:
            lower = file_path.lower()
            if lower.endswith((".mp4", ".webm", ".mkv")):
                artifacts["media_path"] = file_path
                artifacts["media_type"] = "video"
            elif lower.endswith((".mp3", ".m4a", ".wav", ".aac", ".ogg", ".flac")):
                artifacts["media_path"] = file_path
                artifacts["media_type"] = "audio"
            elif lower.endswith(".vtt"):
                artifacts["vtt_path"] = file_path
                try:
                    with open(file_path, "r", encoding="utf-8") as vf:
                        artifacts["vtt_content"] = vf.read()
                except Exception:
                    pass
            elif lower.endswith("meta.json"):
                is_in_target = os.path.normcase(os.path.abspath(os.path.dirname(file_path))) == os.path.normcase(os.path.abspath(target_dir))
                if is_in_target or not artifacts["meta_path"]:
                    artifacts["meta_path"] = file_path
                    try:
                        with open(file_path, "r", encoding="utf-8") as mf:
                            artifacts["meta_json"] = json.load(mf)
                    except Exception:
                        pass

        if return_artifacts:
            return "\n".join(logs), "\n".join(summary_lines), artifacts
        return "\n".join(logs), "\n".join(summary_lines)
    else:
        logs.append("[ERROR] 套件合成出现错误。")
        err_list = result.get("errors", [])
        summary_lines = [
            "[ERROR] 套件导出失败:",
            *[f"  - {err}" for err in err_list]
        ]
        err_res = ("\n".join(logs), "\n".join(summary_lines))
        return (*err_res, {}) if return_artifacts else err_res


def scan_batch_folder(folder_path: str) -> str:
    """
    Scans a folder for valid media files and returns a summary message.
    """
    if not folder_path or not os.path.exists(folder_path):
        return f"[ERROR] 文件夹路径无效或不存在: '{folder_path}'"

    media_files = []
    try:
        with os.scandir(folder_path) as it:
            for entry in it:
                if entry.is_file():
                    ext = os.path.splitext(entry.name)[1].lower()
                    if ext in MEDIA_EXTENSIONS:
                        media_files.append(entry.name)
    except Exception as exc:
        return f"[ERROR] 扫描文件夹失败: {str(exc)}"

    media_files.sort()
    return f"[INFO] 成功在 '{folder_path}' 中发现 {len(media_files)} 个媒体文件，准备就绪可开始批量转写。"


def process_batch_folder(
    folder_path: str,
    target_type: str,
    model_size: str = DEFAULT_MODEL_SIZE,
    compute_type: str = "int8",
    translation_engine: str = "Google 免费翻译",
    gemini_api_key: str = "",
    force_overwrite: bool = False,
    mock_mode: bool = False,
    content_root: str = "content"
) -> Generator[str, None, None]:
    """
    Iterates over media files in folder_path, ingesting each into Hogwarts suite.
    Streams logs line-by-line for Gradio real-time display.
    """
    if not folder_path or not os.path.exists(folder_path):
        yield f"[ERROR] 目标文件夹不存在: '{folder_path}'"
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
        yield f"[ERROR] 读取文件夹失败: {str(exc)}"
        return

    media_paths.sort()
    if not media_paths:
        yield f"[INFO] 在 '{folder_path}' 中未找到受支持的音视频媒体文件 ({', '.join(MEDIA_EXTENSIONS)})。"
        return

    type_key = "ted" if "ted" in str(target_type).lower() else "podcast"
    total = len(media_paths)
    current_logs = [f"[INFO] 开始批量处理 {total} 个媒体文件 (类型={type_key})..."]
    yield "\n".join(current_logs)

    success_count = 0
    failure_count = 0

    for idx, path in enumerate(media_paths, start=1):
        filename = os.path.basename(path)
        content_id = derive_id(filename)
        title = derive_title(filename)

        current_logs.append(f"\n[INFO] --- [{idx}/{total}] 正在处理: {filename} ---")
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
            gemini_api_key=gemini_api_key,
            force_overwrite=force_overwrite,
            mock_mode=mock_mode,
            content_root=content_root
        )

        if "[SUCCESS]" in summary_res:
            success_count += 1
            current_logs.append(f"[INFO] [{idx}/{total}] 入库成功: {content_id} [OK]")
        else:
            failure_count += 1
            current_logs.append(f"[ERROR] [{idx}/{total}] 处理失败: {content_id}")

        yield "\n".join(current_logs)

    current_logs.append(f"\n[INFO] 批量处理完毕！成功: {success_count}，失败: {failure_count}，总计: {total}。")
    yield "\n".join(current_logs)


def get_r2_sync_status() -> Tuple[str, str]:
    """
    Checks R2 configuration in environment and scans local content directory.
    Returns (config_status_badge, content_overview_text) without emojis.
    """
    dotenv_path = os.path.join(PROJECT_ROOT, ".env")
    if os.path.exists(dotenv_path):
        try:
            from dotenv import load_dotenv
            load_dotenv(dotenv_path)
        except Exception:
            pass

    bucket = os.environ.get("CLOUDFLARE_R2_BUCKET_NAME") or os.environ.get("R2_BUCKET_NAME") or ""
    if bucket:
        badge = f"[R2 已就绪: 存储桶={bucket}]"
    else:
        badge = "[R2 未连接: 请检查根目录 .env 的 R2 存储桶配置]"

    content_dir = os.path.join(PROJECT_ROOT, "content")
    ted_dir = os.path.join(content_dir, "ted")
    podcast_dir = os.path.join(content_dir, "podcasts")

    ted_count = len([d for d in os.listdir(ted_dir) if os.path.isdir(os.path.join(ted_dir, d))]) if os.path.exists(ted_dir) else 0
    pod_count = len([d for d in os.listdir(podcast_dir) if os.path.isdir(os.path.join(podcast_dir, d))]) if os.path.exists(podcast_dir) else 0

    overview = (
        f"本地内容概况: TED 演讲 {ted_count} 部 | 播客有声书 {pod_count} 专辑\n"
        f"本地存储路径: {content_dir}"
    )
    return badge, overview


def run_r2_sync_stream(
    dry_run: bool = False,
    force_upload: bool = False,
    content_dir: str = ""
) -> Generator[str, None, None]:
    """
    Runs node scripts/content-sync.js and streams logs for Gradio display.
    """
    import subprocess
    target_dir = os.path.abspath(content_dir or os.path.join(PROJECT_ROOT, "content"))
    sync_script = os.path.join(PROJECT_ROOT, "scripts", "content-sync.js")

    if not os.path.exists(sync_script):
        yield f"[ERROR] 找不到同步脚本: {sync_script}"
        return

    cmd = ["node", sync_script, f"--content-dir={target_dir}"]
    if dry_run:
        cmd.append("--dry-run")
    if force_upload:
        cmd.append("--force")

    mode_desc = "仅模拟预览 (Dry Run)" if dry_run else ("强制全量上传" if force_upload else "智能增量上传")
    logs = [
        "[INFO] 正在启动 Cloudflare R2 增量同步流水线...",
        f"[INFO] 运行模式: {mode_desc}",
        f"[INFO] 目标目录: {target_dir}",
        "[INFO] ------------------------------------------------------------"
    ]
    yield "\n".join(logs)

    try:
        proc = subprocess.Popen(
            cmd,
            cwd=PROJECT_ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        for line in proc.stdout:
            logs.append(line.rstrip())
            yield "\n".join(logs)
        proc.wait()
        if proc.returncode == 0:
            logs.append("\n[SUCCESS] Cloudflare R2 增量同步流水线执行完毕！")
        else:
            logs.append(f"\n[ERROR] 同步进程异常退出，状态码: {proc.returncode}")
        yield "\n".join(logs)
    except Exception as exc:
        logs.append(f"\n[ERROR] 启动同步子进程失败: {str(exc)}")
        yield "\n".join(logs)


def build_ui(mock_mode: bool = False) -> gr.Blocks:
    """
    Builds and returns the modern Gradio workbench for Hogwarts Audio.
    Adheres strictly to zero-emoji design requirements and Chinese UI localization.
    """
    device_name, device_badge = detect_device()
    default_gemini_key = get_gemini_api_key()

    with gr.Blocks(title="Hogwarts Audio - Whisper 智能转写工作台") as demo:
        # Header Section
        gr.Markdown(
            f"# Hogwarts Audio - Whisper 智能转写工作台\n\n"
            f"本地 AI 语音转文字、Spacy 语义意群断句、双语智能翻译与 Hogwarts 标准教学套件合成器。\n\n"
            f"硬件加速状态：**{device_badge}**"
        )

        with gr.Tabs():
            # Tab 1: Single File Studio
            with gr.Tab("单文件转写与套件导出"):
                with gr.Row():
                    # Left Column: Inputs & Controls
                    with gr.Column(scale=1):
                        media_input = gr.File(
                            label="媒体文件上传",
                            file_types=[".mp4", ".webm", ".mp3", ".m4a", ".wav", ".mkv", ".flac", ".ogg"]
                        )
                        target_type_radio = gr.Radio(
                            choices=["TED 演讲 (content/ted/)", "有声书章节 (content/podcasts/)"],
                            value="TED 演讲 (content/ted/)",
                            label="发布目标类型"
                        )

                        # Metadata inputs
                        content_id_input = gr.Textbox(
                            label="内容唯一标识 ID (--id)",
                            placeholder="例如：magic-of-reading（留空将自动根据文件名提取）"
                        )
                        title_input = gr.Textbox(
                            label="前端展示标题 (--title)",
                            placeholder="例如：Magic of Reading（留空将自动根据文件名提取）"
                        )

                        # Type-conditional inputs
                        speaker_input = gr.Textbox(
                            label="主讲人姓名",
                            value="TED Speaker",
                            visible=True
                        )
                        chapter_input = gr.Number(
                            label="章节序号",
                            value=1,
                            precision=0,
                            visible=False
                        )
                        author_input = gr.Textbox(
                            label="原著作者",
                            value="J.K. Rowling",
                            visible=False
                        )
                        narrator_input = gr.Textbox(
                            label="朗读主播",
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
                                label="Whisper 语音模型"
                            )
                            compute_dropdown = gr.Dropdown(
                                choices=["int8", "float16", "int8_float16", "default"],
                                value="int8",
                                label="计算精度"
                            )

                        translation_radio = gr.Radio(
                            choices=["Google 免费翻译", "Gemini API 智能翻译", "仅生成英文字幕 (不翻译)"],
                            value="Google 免费翻译",
                            label="字幕翻译引擎"
                        )
                        with gr.Row(visible=False) as gemini_key_row:
                            gemini_api_key_input = gr.Textbox(
                                label="Gemini API 密钥",
                                placeholder="输入您的 Gemini API Key（支持自动从环境变量或 .env 读取）",
                                value=default_gemini_key,
                                type="password",
                                scale=8,
                                elem_id="gemini_key_input"
                            )
                            toggle_gemini_key_btn = gr.Button(
                                "查看明文",
                                variant="secondary",
                                scale=2,
                                elem_id="toggle_gemini_key_btn"
                            )
                        force_checkbox = gr.Checkbox(
                            label="强制覆盖已存在的目录",
                            value=False
                        )

                        start_single_btn = gr.Button(
                            "开始转写并导出至 Hogwarts 套件",
                            variant="primary"
                        )

                    # Right Column: Output Logs & Summary & Artifacts Previewer
                    with gr.Column(scale=1):
                        single_log_box = gr.Textbox(
                            label="实时转写与处理日志",
                            lines=10,
                            interactive=False
                        )
                        single_summary_box = gr.Textbox(
                            label="内容入库结果摘要",
                            lines=4,
                            interactive=False
                        )

                        with gr.Accordion("本地生成产物实时预览窗", open=True):
                            preview_video = gr.Video(
                                label="生成媒体在线预览 (视频)",
                                visible=False,
                                interactive=False,
                                elem_id="preview_video"
                            )
                            preview_audio = gr.Audio(
                                label="生成媒体在线预览 (音频)",
                                visible=False,
                                interactive=False,
                                elem_id="preview_audio"
                            )
                            preview_vtt = gr.Textbox(
                                label="生成双语 WebVTT 字幕实时预览 (中英双语对照)",
                                lines=10,
                                interactive=False,
                                visible=False,
                                elem_id="preview_vtt"
                            )
                            preview_meta = gr.JSON(
                                label="元数据规格预览 (meta.json)",
                                visible=False,
                                elem_id="preview_meta"
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
                translation_radio.change(
                    fn=on_translation_engine_change,
                    inputs=[translation_radio],
                    outputs=[gemini_key_row]
                )
                toggle_gemini_key_btn.click(
                    fn=None,
                    js="""() => {
                        const el = document.querySelector('#gemini_key_input input') || document.querySelector('#gemini_key_input textarea');
                        const btn = document.querySelector('#toggle_gemini_key_btn');
                        if (el) {
                            const isPwd = el.type === 'password';
                            el.type = isPwd ? 'text' : 'password';
                            if (btn) {
                                btn.innerText = isPwd ? '隐藏明文' : '查看明文';
                            }
                        }
                    }"""
                )

                def _run_single(media, t_type, c_id, ttl, spk, chp, aut, nar, mdl, cmp, trn, g_key, frc):
                    log_res, summary_res, artifacts = transcribe_and_export_single(
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
                        gemini_api_key=g_key,
                        force_overwrite=frc,
                        mock_mode=mock_mode,
                        return_artifacts=True
                    )

                    video_update = gr.update(value=None, visible=False)
                    audio_update = gr.update(value=None, visible=False)
                    vtt_update = gr.update(value="", visible=False)
                    meta_update = gr.update(value=None, visible=False)

                    if artifacts and artifacts.get("target_dir"):
                        m_type = artifacts.get("media_type")
                        m_path = artifacts.get("media_path")
                        if m_type == "video" and m_path and os.path.exists(m_path):
                            video_update = gr.update(value=m_path, visible=True)
                        elif m_path and os.path.exists(m_path):
                            audio_update = gr.update(value=m_path, visible=True)

                        vtt_content = artifacts.get("vtt_content", "")
                        if vtt_content:
                            vtt_update = gr.update(value=vtt_content, visible=True)

                        meta_obj = artifacts.get("meta_json")
                        if meta_obj:
                            meta_update = gr.update(value=meta_obj, visible=True)

                    return (
                        log_res,
                        summary_res,
                        video_update,
                        audio_update,
                        vtt_update,
                        meta_update
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
                        gemini_api_key_input,
                        force_checkbox
                    ],
                    outputs=[
                        single_log_box,
                        single_summary_box,
                        preview_video,
                        preview_audio,
                        preview_vtt,
                        preview_meta
                    ]
                )

            # Tab 2: Batch Folder Studio
            with gr.Tab("批量文件夹转写"):
                with gr.Row():
                    with gr.Column(scale=1):
                        folder_path_input = gr.Textbox(
                            label="目标媒体文件夹绝对路径",
                            placeholder="例如：D:/podcasts/ 或 content/raw_ted/"
                        )
                        scan_btn = gr.Button("扫描文件夹")
                        batch_type_radio = gr.Radio(
                            choices=["TED 演讲 (content/ted/)", "有声书章节 (content/podcasts/)"],
                            value="TED 演讲 (content/ted/)",
                            label="发布目标类型"
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
                                label="Whisper 语音模型"
                            )
                            batch_compute_dropdown = gr.Dropdown(
                                choices=["int8", "float16", "int8_float16", "default"],
                                value="int8",
                                label="计算精度"
                            )
                        batch_trans_radio = gr.Radio(
                            choices=["Google 免费翻译", "Gemini API 智能翻译", "仅生成英文字幕 (不翻译)"],
                            value="Google 免费翻译",
                            label="字幕翻译引擎"
                        )
                        with gr.Row(visible=False) as batch_gemini_key_row:
                            batch_gemini_key_input = gr.Textbox(
                                label="Gemini API 密钥",
                                placeholder="输入您的 Gemini API Key",
                                value=default_gemini_key,
                                type="password",
                                scale=8,
                                elem_id="batch_gemini_key_input"
                            )
                            batch_toggle_gemini_key_btn = gr.Button(
                                "查看明文",
                                variant="secondary",
                                scale=2,
                                elem_id="batch_toggle_gemini_key_btn"
                            )
                        batch_force_checkbox = gr.Checkbox(
                            label="强制覆盖已存在的目录",
                            value=False
                        )
                        with gr.Row():
                            start_batch_btn = gr.Button("开始批量转写与导出", variant="primary")
                            stop_batch_btn = gr.Button("停止批量处理", variant="stop")

                    with gr.Column(scale=1):
                        batch_log_box = gr.Textbox(
                            label="批量流水线处理日志",
                            lines=18,
                            interactive=False
                        )

                # Tab 2 Event Bindings
                scan_btn.click(
                    fn=scan_batch_folder,
                    inputs=[folder_path_input],
                    outputs=[batch_log_box]
                )
                batch_trans_radio.change(
                    fn=on_translation_engine_change,
                    inputs=[batch_trans_radio],
                    outputs=[batch_gemini_key_row]
                )
                batch_toggle_gemini_key_btn.click(
                    fn=None,
                    js="""() => {
                        const el = document.querySelector('#batch_gemini_key_input input') || document.querySelector('#batch_gemini_key_input textarea');
                        const btn = document.querySelector('#batch_toggle_gemini_key_btn');
                        if (el) {
                            const isPwd = el.type === 'password';
                            el.type = isPwd ? 'text' : 'password';
                            if (btn) {
                                btn.innerText = isPwd ? '隐藏明文' : '查看明文';
                            }
                        }
                    }"""
                )

                def _run_batch(f_path, b_type, b_mdl, b_cmp, b_trn, b_key, b_frc):
                    yield from process_batch_folder(
                        folder_path=f_path,
                        target_type=b_type,
                        model_size=b_mdl,
                        compute_type=b_cmp,
                        translation_engine=b_trn,
                        gemini_api_key=b_key,
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
                        batch_gemini_key_input,
                        batch_force_checkbox
                    ],
                    outputs=[batch_log_box]
                )
                stop_batch_btn.click(fn=None, cancels=[batch_event])

            # Tab 3: Cloudflare R2 Sync Studio
            with gr.Tab("云端增量同步 (Cloudflare R2)"):
                r2_badge, r2_overview = get_r2_sync_status()
                with gr.Row():
                    with gr.Column(scale=1):
                        r2_badge_box = gr.Textbox(
                            label="R2 存储桶接入状态",
                            value=r2_badge,
                            interactive=False
                        )
                        r2_overview_box = gr.Textbox(
                            label="本地内容库概况",
                            value=r2_overview,
                            lines=3,
                            interactive=False
                        )
                        refresh_r2_btn = gr.Button("刷新本地与云端状态")
                        r2_dry_run_check = gr.Checkbox(
                            label="仅模拟预览 (--dry-run)",
                            value=True,
                            info="仅比对文件哈希与大小，计算待上传清单，不实际消耗上传写次数"
                        )
                        r2_force_check = gr.Checkbox(
                            label="强制覆盖上传 (--force)",
                            value=False,
                            info="忽略云端缓存，强制重新上传所有音视频及字幕"
                        )
                        with gr.Row():
                            start_sync_btn = gr.Button("开始增量同步至 Cloudflare R2", variant="primary")
                            stop_sync_btn = gr.Button("中断同步", variant="stop")

                    with gr.Column(scale=1):
                        sync_log_box = gr.Textbox(
                            label="云端同步流水线实时日志",
                            lines=18,
                            interactive=False
                        )

                # Tab 3 Event Bindings
                refresh_r2_btn.click(
                    fn=get_r2_sync_status,
                    inputs=[],
                    outputs=[r2_badge_box, r2_overview_box]
                )

                def _run_sync(is_dry, is_force):
                    yield from run_r2_sync_stream(dry_run=is_dry, force_upload=is_force)

                sync_event = start_sync_btn.click(
                    fn=_run_sync,
                    inputs=[r2_dry_run_check, r2_force_check],
                    outputs=[sync_log_box]
                )
                stop_sync_btn.click(fn=None, cancels=[sync_event])

    return demo


def main() -> None:
    """CLI entrypoint for launching Gradio Studio."""
    parser = argparse.ArgumentParser(description="Hogwarts Audio - Whisper 智能转写工作台")
    parser.add_argument("--host", default="127.0.0.1", help="Server host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=7860, help="Server port (default: 7860)")
    parser.add_argument("--share", action="store_true", help="Create a public Gradio link")
    parser.add_argument("--mock", action="store_true", help="Run with mock transcription engine")
    args = parser.parse_args()

    demo = build_ui(mock_mode=args.mock)
    demo.launch(server_name=args.host, server_port=args.port, share=args.share)


if __name__ == "__main__":
    main()
