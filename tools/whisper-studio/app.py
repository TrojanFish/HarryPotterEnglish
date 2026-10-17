
import gradio as gr
import os
import queue
import subprocess
import threading
from logic import Transcriber, find_audio_files, detect_device
from ollama_utils import (get_ollama_models, get_available_models,
                          save_api_keys, get_api_keys)

# --- Global Transcriber Instance ---
transcriber = None

def get_transcriber(model_size, compute_type):
    global transcriber
    if transcriber is None:
        transcriber = Transcriber(model_size, compute_type)
    else:
        if transcriber.model_size != model_size or transcriber.compute_type != compute_type:
            transcriber.unload_model()
            transcriber = Transcriber(model_size, compute_type)
    return transcriber

def scan_folder(folder_path):
    """辅助函数：极速扫描文件并展示预估处理状态"""
    if not folder_path or not os.path.exists(folder_path):
        return "❌ 路径无效"
    
    # 使用优化过的扫描器同时获取全局文件集，用于快速判断状态
    files, all_files = find_audio_files(folder_path, return_all_set=True)
    if not files:
        return "⚠️ 目标文件夹中未找到音频/视频文件。"
        
    # 极速统计：只要发现 SRT 或 ASS 其中一个就算该音频大概率已处理
    done_count = 0
    for f in files:
        base = os.path.normpath(os.path.splitext(f)[0])
        if (base + ".srt") in all_files or (base + ".ass") in all_files:
            done_count += 1
            
    return f"📂 扫描结果: 发现 {len(files)} 个媒体文件。已处理: {done_count}，待处理: {len(files) - done_count}。"

def open_folder(folder_path):
    """Opens the directory in Windows Explorer"""
    if folder_path and os.path.exists(folder_path):
        os.startfile(folder_path)
        return "📂 已打开文件夹"
    return "❌ 文件夹不存在"

def load_srt_for_player(srt_file):
    """Reads an SRT file and returns its content as plain text for the player Tab."""
    if srt_file is None:
        return "请上传 SRT 文件。"
    path = srt_file.name if hasattr(srt_file, "name") else str(srt_file)
    try:
        with open(path, encoding="utf-8-sig") as f:
            return f.read()
    except Exception as e:
        return f"❌ 读取失败: {e}"


def download_youtube(url, save_folder):
    """Downloads audio from a URL using yt-dlp."""
    if not url.strip():
        return "❌ 请输入有效的 URL。"
    if not save_folder or not os.path.exists(save_folder):
        return "❌ 保存文件夹不存在，请先创建。"
    try:
        import yt_dlp  # noqa: F401 — just check it's installed
    except ImportError:
        return "❌ 未安装 yt-dlp，请运行: pip install yt-dlp"

    output_template = os.path.join(save_folder, "%(title)s.%(ext)s")
    cmd = ["yt-dlp", "-x", "--audio-format", "mp3",
           "--audio-quality", "0", "-o", output_template, url]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        log = result.stdout + result.stderr
        if result.returncode == 0:
            return f"✅ 下载完成！\n\n{log[-2000:]}"
        else:
            return f"❌ yt-dlp 报错:\n\n{log[-2000:]}"
    except FileNotFoundError:
        return "❌ 找不到 yt-dlp 可执行文件，请确认已安装并在 PATH 中。"
    except subprocess.TimeoutExpired:
        return "❌ 下载超时（>10分钟），请检查网络连接。"


def search_transcripts(folder_path, query, context_lines=2):
    """Searches all .md files in folder_path for query, returns formatted results."""
    if not query.strip():
        return "请输入搜索关键词。"
    if not folder_path or not os.path.exists(folder_path):
        return "❌ 路径无效。"

    import glob
    md_files = glob.glob(os.path.join(folder_path, "**", "*.md"), recursive=True)
    # Exclude vocabulary_notebook and cloze files from source list
    md_files = [f for f in md_files
                if "vocabulary_notebook" not in os.path.basename(f)
                and "_cloze" not in os.path.basename(f)]

    if not md_files:
        return "⚠️ 未找到任何 .md 文稿文件。"

    results = []
    query_lower = query.lower()
    for md_path in sorted(md_files):
        with open(md_path, encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        matches = []
        for i, line in enumerate(lines):
            if query_lower in line.lower():
                start = max(0, i - context_lines)
                end   = min(len(lines), i + context_lines + 1)
                snippet = "".join(lines[start:end]).strip()
                # Highlight the match
                import re as _re
                snippet = _re.sub(f"(?i)({_re.escape(query)})", r"**\1**", snippet)
                matches.append(snippet)
        if matches:
            rel = os.path.relpath(md_path, folder_path)
            results.append(f"### 📄 {rel}\n\n" + "\n\n---\n\n".join(matches))

    if not results:
        return f"🔍 未找到包含「{query}」的段落。"
    header = f"🔍 在 {len(results)}/{len(md_files)} 个文件中找到匹配:\n\n---\n\n"
    return header + "\n\n---\n\n".join(results)


def process_single_file(file_path, model_size, compute_type, target_chars, max_chars,
                        force_overwrite, output_formats, ai_model, translation_engine,
                        organize_subfolder=True):
    """Handler for single-file processing Tab."""
    if not file_path or not os.path.exists(file_path):
        yield "❌ 错误: 请先上传音频文件。"
        return

    gen_srt    = "SRT (通用格式)" in output_formats
    gen_ass    = "ASS (高亮学习格式)" in output_formats
    gen_vtt    = "VTT (网页播放器格式)" in output_formats
    gen_txt    = "TXT/MD (精读文稿)" in output_formats
    gen_pdf    = "PDF (双语带水印排版)" in output_formats
    gen_cloze  = "CLOZE (填空练习)" in output_formats
    gen_anki   = "ANKI (Anki 词卡)" in output_formats
    gen_quiz   = "QUIZ (理解测验)" in output_formats
    gen_shadow = "SHADOW (跟读脚本)" in output_formats

    worker = get_transcriber(model_size, compute_type)
    success, msg = worker.load_model()
    if not success:
        yield f"❌ {msg}"
        return

    yield f"✅ 模型已加载。正在处理: {os.path.basename(file_path)}...\n"

    msg_queue = queue.Queue()
    result = [None, None]   # [srt_path, status_or_error]
    done = threading.Event()

    def _cb(msg):
        msg_queue.put(msg)

    def _run():
        try:
            srt, status = worker.transcribe_file(
                file_path, target_chars, max_chars, force_overwrite,
                gen_srt, gen_ass, gen_vtt, gen_txt, gen_pdf, gen_cloze,
                gen_anki, gen_quiz, gen_shadow, ai_model, translation_engine,
                organize_subfolder=organize_subfolder, status_callback=_cb
            )
            result[0] = srt
            result[1] = status
        except Exception as e:
            result[1] = f"❌ 失败: {e}"
        finally:
            done.set()

    threading.Thread(target=_run, daemon=True).start()

    live_log = [f"处理: {os.path.basename(file_path)}...\n"]
    while not done.is_set() or not msg_queue.empty():
        try:
            msg = msg_queue.get(timeout=0.1)
            live_log.append(msg + "\n")
            yield "".join(live_log)
        except queue.Empty:
            continue

    status = result[1] or "未知"
    suffix = f"   -> ✅ {status}\n" if "❌" not in status and "失败" not in status else f"   -> {status}\n"
    live_log.append(suffix)
    output_dir = os.path.dirname(file_path)
    yield "".join(live_log) + f"\n输出目录: {output_dir}"


def process_folder(folder_path, model_size, compute_type, target_chars, max_chars, force_overwrite, output_formats, ai_model, translation_engine, organize_subfolder=True, progress=gr.Progress()):
    """
    Main handler for the UI "Start" button.
    """
    if not folder_path or not os.path.exists(folder_path):
        yield "❌ 错误: 文件夹路径无效。"
        return

    # Check output formats
    gen_srt    = "SRT (通用格式)" in output_formats
    gen_ass    = "ASS (高亮学习格式)" in output_formats
    gen_vtt    = "VTT (网页播放器格式)" in output_formats
    gen_txt    = "TXT/MD (精读文稿)" in output_formats
    gen_pdf    = "PDF (双语带水印排版)" in output_formats
    gen_cloze  = "CLOZE (填空练习)" in output_formats
    gen_anki   = "ANKI (Anki 词卡)" in output_formats
    gen_quiz   = "QUIZ (理解测验)" in output_formats
    gen_shadow = "SHADOW (跟读脚本)" in output_formats
    if not any([gen_srt, gen_ass, gen_vtt, gen_txt, gen_pdf,
                gen_cloze, gen_anki, gen_quiz, gen_shadow]):
        yield "❌ 错误: 请至少选择一种输出格式。"
        return

    def _resolve_base(f):
        """Returns the expected output base path, accounting for subfolder organisation."""
        s = os.path.splitext(os.path.basename(f))[0]
        p = os.path.dirname(f)
        if organize_subfolder:
            if os.path.basename(p) == s:   # already inside its own subfolder
                return os.path.normpath(os.path.splitext(f)[0])
            return os.path.normpath(os.path.join(p, s, s))
        return os.path.normpath(os.path.splitext(f)[0])

    # 1. 查找音频文件 (使用 A+B 组合方案优化)
    files, all_files_set = find_audio_files(folder_path, return_all_set=True)
    if not files:
        yield "⚠️ 目标文件夹中未找到音频/视频文件 (mp3, wav, m4a, mp4, flac)。"
        return

    total_found = len(files)

    # 预过滤逻辑：在加载笨重的模型前，利用 Set 集合进行秒级去重
    if not force_overwrite:
        pending_files = []
        for f in files:
            base = _resolve_base(f)
            is_done = True
            if gen_srt    and (base + ".srt")            not in all_files_set: is_done = False
            if gen_ass    and (base + ".ass")            not in all_files_set: is_done = False
            if gen_vtt    and (base + ".vtt")            not in all_files_set: is_done = False
            if gen_txt    and (base + ".md")             not in all_files_set: is_done = False
            if gen_pdf    and (base + ".pdf")            not in all_files_set: is_done = False
            if gen_cloze  and (base + "_cloze.md")       not in all_files_set: is_done = False
            if gen_anki   and (base + "_vocab.apkg")     not in all_files_set: is_done = False
            if gen_quiz   and (base + "_quiz.md")        not in all_files_set: is_done = False
            if gen_shadow and (base + "_shadowing.md")   not in all_files_set: is_done = False
            
            if not is_done:
                pending_files.append(f)
        
        files = pending_files
        skip_count = total_found - len(files)
        
        if skip_count > 0:
            yield f"📂 发现 {total_found} 个文件。检测到 {skip_count} 个已完成，已为您跳过并开始处理剩余 {len(files)} 个..."
            if not files:
                yield f"\n🎉 所有任务都已处于完成状态！\n总计: {total_found} | 处理: 0 | 跳过: {skip_count} | 失败: 0"
                return
        else:
            yield f"📂 发现 {total_found} 个文件。正在初始化模型..."
    else:
        yield f"📂 发现 {total_found} 个文件 (强制覆盖模式)。正在初始化模型..."

    # 2. 加载模型 (Load Model)

    # 2. Load Model
    worker = get_transcriber(model_size, compute_type)
    success, msg = worker.load_model()
    if not success:
        yield f"❌ {msg}"
        return
    
    yield f"✅ 模型已加载 ({model_size}, {compute_type})。开始转写..."

    # 3. Process Loop
    success_count = 0
    skip_count = 0
    fail_count = 0
    logs = ""

    for i, file_path in enumerate(progress.tqdm(files, desc="Processing")):
        filename = os.path.basename(file_path)
        current_log = f"[{i+1}/{len(files)}] 处理: {filename}...\n"
        try:
            msg_queue = queue.Queue()
            result = [None, None]  # [srt_path, status]
            done = threading.Event()

            def _run(_fp=file_path, _q=msg_queue, _r=result, _d=done):
                try:
                    srt, st = worker.transcribe_file(
                        _fp, target_chars, max_chars, force_overwrite,
                        gen_srt, gen_ass, gen_vtt, gen_txt, gen_pdf, gen_cloze,
                        gen_anki, gen_quiz, gen_shadow, ai_model, translation_engine,
                        organize_subfolder=organize_subfolder,
                        status_callback=lambda m: _q.put(m)
                    )
                    _r[0] = srt
                    _r[1] = st
                except Exception as e:
                    _r[1] = f"❌ 失败: {e}"
                finally:
                    _d.set()

            threading.Thread(target=_run, daemon=True).start()

            live_log = [current_log]
            yield logs + "".join(live_log)

            while not done.is_set() or not msg_queue.empty():
                try:
                    msg = msg_queue.get(timeout=0.1)
                    live_log.append(msg + "\n")
                    yield logs + "".join(live_log)
                except queue.Empty:
                    continue

            status = result[1] or "未知"
            if "跳过" in status:
                skip_count += 1
                result_msg = f"   -> ⏭️ {status}\n"
            elif "❌" in status or "失败" in status:
                fail_count += 1
                result_msg = f"   -> {status}\n"
            else:
                success_count += 1
                result_msg = f"   -> ✅ {status}\n"

            full_entry = "".join(live_log) + result_msg
            logs += full_entry
            yield logs

        except Exception as e:
            fail_count += 1
            err_msg = f"   -> ❌ 失败: {str(e)}\n"
            logs += current_log + err_msg
            yield logs

    # 4. Summary
    final_summary = f"\n🎉 所有任务已完成！\n总计: {len(files)} | 成功: {success_count} | 跳过: {skip_count} | 失败: {fail_count}"
    yield logs + final_summary

def build_ui():
    _device, _device_warning = detect_device()
    if _device == "cuda":
        _device_badge = "🟢 GPU 已就绪"
    else:
        _device_badge = "🟡 CPU 模式（无 GPU 加速）"

    with gr.Blocks(title="SenseWhisper", theme=gr.themes.Soft()) as demo:
        gr.Markdown("# 🎙️ SenseWhisper")
        gr.Markdown("针对英语学习优化的本地字幕生成器 · 语义断句 · 双语文稿 · AI 学习分析")
        if _device != "cuda":
            gr.Markdown(f"> ⚠️ {_device_warning}", visible=True)
        with gr.Row():
            gr.Markdown(f"**设备**: {_device_badge}")
            gr.Markdown("**输出格式**: SRT · ASS · VTT · MD · PDF · CLOZE · ANKI · QUIZ · SHADOW")

        # --- Shared settings block (reused across tabs) ---
        def _model_settings():
            ms = gr.Dropdown(
                choices=["large-v3", "deepdml/faster-whisper-large-v3-turbo-ct2", "medium", "small"],
                value="deepdml/faster-whisper-large-v3-turbo-ct2",
                label="模型大小", allow_custom_value=True,
                info="'large-v3' 精度最高；'turbo' 速度/精度均衡（推荐）；'small' 极快。"
            )
            ct = gr.Dropdown(
                choices=["int8", "float16", "float32"], value="int8",
                label="量化精度", info="'int8': 显存最小速度最快（推荐）。"
            )
            return ms, ct

        def _advanced_settings():
            tc = gr.Slider(20, 100, value=58, step=1, label="理想单行字符数")
            mc = gr.Slider(30, 150, value=85, step=1, label="最大单行字符数")
            of = gr.CheckboxGroup(
                choices=["SRT (通用格式)", "ASS (高亮学习格式)", "VTT (网页播放器格式)",
                         "TXT/MD (精读文稿)", "PDF (双语带水印排版)", "CLOZE (填空练习)",
                         "ANKI (Anki 词卡)", "QUIZ (理解测验)", "SHADOW (跟读脚本)"],
                value=["SRT (通用格式)", "ASS (高亮学习格式)", "TXT/MD (精读文稿)", "PDF (双语带水印排版)"],
                label="生成格式"
            )
            fo  = gr.Checkbox(label="强制重新生成 (覆盖已有文件)", value=False)
            org = gr.Checkbox(label="📁 整理到子文件夹 (每个音频单独建文件夹)", value=True)
            return tc, mc, of, fo, org

        def _ai_settings():
            te = gr.Dropdown(
                choices=["Google Translate (免费/极快)", "Ollama (本地大模型/慢但地道)", "不生成双语对照"],
                value="Google Translate (免费/极快)", label="翻译引擎",
                info="Google 速度极快，Ollama 需本地运行，更地道但较慢。"
            )
            all_models = ["None"] + get_available_models()
            ai = gr.Dropdown(choices=all_models, value="None", label="AI 分析模型",
                             allow_custom_value=True,
                             info="本地 Ollama 或云端 Gemini/Qwen（需在顶部设置 API Key）。")
            return te, ai

        # --- Global API Key Settings ---
        with gr.Accordion("🔑 云端 AI 密钥设置 (Gemini / Qwen)", open=False):
            gr.Markdown(
                "填入 API Key 后即可在下方选择云端模型。密钥保存在本地 `api_keys.json`，不上传至任何服务器。\n\n"
                "- **Gemini**: [Google AI Studio](https://aistudio.google.com/app/apikey) 免费申请，推荐 `gemini-2.0-flash`\n"
                "- **Qwen**: [阿里云 DashScope](https://dashscope.console.aliyun.com/) 注册，推荐 `qwen-plus`"
            )
            _saved_keys = get_api_keys()
            with gr.Row():
                gemini_key_input = gr.Textbox(
                    label="Gemini API Key", type="password",
                    value=_saved_keys.get("gemini", ""),
                    placeholder="AIza...",
                )
                qwen_key_input = gr.Textbox(
                    label="Qwen API Key (DashScope)", type="password",
                    value=_saved_keys.get("qwen", ""),
                    placeholder="sk-...",
                )
            with gr.Row():
                save_keys_btn = gr.Button("💾 保存密钥", variant="secondary", size="sm")
                keys_status = gr.Markdown("")

        with gr.Tabs():
            # ── Tab 1: 批量处理 ──────────────────────────────────────────
            with gr.Tab("📂 批量处理"):
                with gr.Row():
                    with gr.Column(scale=1):
                        gr.Markdown("### ⚙️ 基础设置")
                        input_folder = gr.Textbox(
                            label="目标文件夹路径",
                            placeholder=r"例如: Y:\Children_Podcasts",
                            info="包含音频/视频文件的文件夹绝对路径。"
                        )
                        with gr.Row():
                            scan_btn = gr.Button("🔍 扫描文件", size="sm", variant="secondary")
                            open_btn = gr.Button("📂 打开文件夹", size="sm", variant="secondary")
                        scan_output = gr.Markdown("")

                        gr.Markdown("### 🧠 模型配置")
                        model_size, compute_type = _model_settings()

                        with gr.Accordion("🛠️ 高级选项", open=False):
                            target_chars, max_chars, output_formats, force_overwrite, organize_subfolder = _advanced_settings()

                        with gr.Accordion("🤖 翻译与 AI 学习伙伴", open=False):
                            translation_engine, ai_model = _ai_settings()

                        with gr.Row():
                            start_btn = gr.Button("🚀 开始处理", variant="primary", size="lg")
                            stop_btn  = gr.Button("⏹️ 停止", variant="stop", size="lg")

                    with gr.Column(scale=2):
                        gr.Markdown("### 📜 处理日志")
                        output_log = gr.Textbox(label="实时日志", lines=25, max_lines=25,
                                                interactive=False, autoscroll=True)

            # ── Tab 2: 单文件处理 ────────────────────────────────────────
            with gr.Tab("🎵 单文件处理"):
                with gr.Row():
                    with gr.Column(scale=1):
                        gr.Markdown("### 上传音频文件")
                        single_file = gr.File(
                            label="拖放或点击上传音频/视频文件",
                            file_types=[".mp3", ".wav", ".m4a", ".mp4", ".flac",
                                        ".mkv", ".avi", ".mov", ".ogg", ".aac"]
                        )
                        gr.Markdown("### 🧠 模型配置")
                        sf_model_size, sf_compute_type = _model_settings()

                        with gr.Accordion("🛠️ 高级选项", open=False):
                            sf_target_chars, sf_max_chars, sf_output_formats, sf_force_overwrite, sf_organize_subfolder = _advanced_settings()

                        with gr.Accordion("🤖 翻译与 AI 学习伙伴", open=False):
                            sf_translation_engine, sf_ai_model = _ai_settings()

                        with gr.Row():
                            sf_start_btn = gr.Button("🚀 开始处理", variant="primary", size="lg")
                            sf_stop_btn  = gr.Button("⏹️ 停止", variant="stop", size="lg")

                    with gr.Column(scale=2):
                        gr.Markdown("### 📜 处理日志")
                        sf_output_log = gr.Textbox(label="实时日志", lines=20, max_lines=20,
                                                   interactive=False, autoscroll=True)

            # ── Tab 3: 全文搜索 ──────────────────────────────────────────
            with gr.Tab("🔍 全文搜索"):
                gr.Markdown("在所有已生成的 `.md` 精读文稿中搜索关键词或短语。")
                with gr.Row():
                    search_folder = gr.Textbox(label="文稿所在文件夹", placeholder=r"例如: Y:\Children_Podcasts")
                    search_query  = gr.Textbox(label="搜索关键词", placeholder="例如: marshmallow")
                search_btn    = gr.Button("🔍 搜索", variant="primary")
                search_output = gr.Markdown("")

            # ── Tab 4: 嵌入式播放器 ──────────────────────────────────────
            with gr.Tab("▶️ 播放器"):
                gr.Markdown("上传音频与对应 SRT 字幕，边听边看文稿。")
                with gr.Row():
                    with gr.Column(scale=1):
                        player_audio = gr.Audio(label="上传音频", type="filepath")
                        player_srt   = gr.File(label="上传 SRT 字幕", file_types=[".srt"])
                        load_btn     = gr.Button("📖 加载字幕", variant="secondary")
                    with gr.Column(scale=2):
                        player_transcript = gr.Textbox(
                            label="字幕内容", lines=25, max_lines=25,
                            interactive=False, autoscroll=False,
                            info="音频播放时可在此对照文本"
                        )

            # ── Tab 5: YouTube 下载 ──────────────────────────────────────
            with gr.Tab("⬇️ YouTube 下载"):
                gr.Markdown(
                    "输入 YouTube（或其他 yt-dlp 支持的平台）URL，自动下载音频到指定文件夹。\n\n"
                    "> 需要已安装 `yt-dlp`：`pip install yt-dlp`"
                )
                yt_url    = gr.Textbox(label="视频 URL", placeholder="https://www.youtube.com/watch?v=...")
                yt_folder = gr.Textbox(label="保存到文件夹", placeholder=r"例如: Y:\Children_Podcasts")
                yt_btn    = gr.Button("⬇️ 下载音频", variant="primary")
                yt_output = gr.Textbox(label="下载日志", lines=8, interactive=False, autoscroll=True)

        # --- Events ---
        def _save_keys(g_key, q_key):
            save_api_keys(g_key, q_key)
            parts = []
            if g_key.strip(): parts.append("Gemini ✅")
            if q_key.strip(): parts.append("Qwen ✅")
            return f"{'已保存: ' + ', '.join(parts) if parts else '⚠️ 密钥为空，云端模型将不可用'}"

        save_keys_btn.click(fn=_save_keys,
                            inputs=[gemini_key_input, qwen_key_input],
                            outputs=[keys_status])

        scan_btn.click(fn=scan_folder, inputs=input_folder, outputs=scan_output)
        open_btn.click(fn=open_folder, inputs=input_folder, outputs=scan_output)

        start_event = start_btn.click(
            fn=process_folder,
            inputs=[input_folder, model_size, compute_type, target_chars, max_chars,
                    force_overwrite, output_formats, ai_model, translation_engine,
                    organize_subfolder],
            outputs=[output_log]
        )
        stop_btn.click(fn=None, cancels=[start_event])

        sf_start_event = sf_start_btn.click(
            fn=process_single_file,
            inputs=[single_file, sf_model_size, sf_compute_type, sf_target_chars, sf_max_chars,
                    sf_force_overwrite, sf_output_formats, sf_ai_model, sf_translation_engine,
                    sf_organize_subfolder],
            outputs=[sf_output_log]
        )
        sf_stop_btn.click(fn=None, cancels=[sf_start_event])

        # Tab 3: 全文搜索
        search_btn.click(fn=search_transcripts,
                         inputs=[search_folder, search_query],
                         outputs=[search_output])

        # Tab 4: 播放器
        load_btn.click(fn=load_srt_for_player,
                       inputs=[player_srt],
                       outputs=[player_transcript])

        # Tab 5: YouTube 下载
        yt_btn.click(fn=download_youtube,
                     inputs=[yt_url, yt_folder],
                     outputs=[yt_output])

    return demo

if __name__ == "__main__":
    app = build_ui()
    app.launch(inbrowser=True, server_name="127.0.0.1", server_port=7860)
