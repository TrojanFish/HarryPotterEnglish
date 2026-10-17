
import os
import re
import gc
import shutil
import torch
from faster_whisper import WhisperModel


def _lp(path):
    """Prepend \\?\\ prefix on Windows to support paths longer than 260 chars."""
    if os.name == 'nt' and not path.startswith('\\\\'):
        return '\\\\?\\' + os.path.abspath(path).replace('/', '\\')
    return path
from text_utils import (advanced_split, clean_subtitles, format_timestamp,
                        format_timestamp_vtt, format_timestamp_transcript,
                        compute_wpm, estimate_cefr, generate_cloze_md, generate_shadow_md)
from ass_utils import save_ass
from ollama_utils import analyze_transcript, translate_paragraph, generate_quiz
from pdf_utils import generate_bilingual_pdf
from anki_utils import extract_vocab_structured, generate_anki_deck

def parse_srt(srt_path):
    """
    Parses an SRT file into the same subtitle dict format used internally.
    Returns a list of {'start': float, 'end': float, 'text': str, 'words': []}.
    """
    def ts_to_seconds(ts):
        h, m, s = ts.replace(',', '.').split(':')
        return int(h) * 3600 + int(m) * 60 + float(s)

    subtitles = []
    with open(_lp(srt_path), 'r', encoding='utf-8-sig') as f:
        content = f.read()

    blocks = re.split(r'\n\s*\n', content.strip())
    for block in blocks:
        lines = block.strip().splitlines()
        if len(lines) < 3:
            continue
        try:
            time_line = lines[1]
            start_str, end_str = time_line.split(' --> ')
            start = ts_to_seconds(start_str.strip())
            end = ts_to_seconds(end_str.strip())
            text = ' '.join(lines[2:]).strip()
            subtitles.append({'start': start, 'end': end, 'text': text, 'words': []})
        except (ValueError, IndexError):
            continue
    return subtitles


# ==============================================================================
#                         Pipeline Helper Functions
# ==============================================================================

def _run_transcription(model, audio_path, target_chars, max_chars):
    """Runs Whisper transcription, intelligent splitting, and cleaning."""
    segments, _ = model.transcribe(
        audio_path,
        beam_size=5,
        word_timestamps=True,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500)
    )
    all_words = []
    for segment in segments:
        if segment.words:
            all_words.extend(segment.words)
    raw_subtitles = advanced_split(all_words, target_chars=target_chars, max_chars=max_chars)
    return clean_subtitles(raw_subtitles)


def _build_paragraphs(final_subtitles):
    """Groups subtitle lines into reading paragraphs based on silence gaps and length."""
    paragraphs = []
    if not final_subtitles:
        return paragraphs
    current_para_text = []
    current_para_len = 0
    para_start_time = final_subtitles[0]['start']
    for i, sub in enumerate(final_subtitles):
        text = sub['text']
        is_new_para = False
        if i > 0:
            gap = sub['start'] - final_subtitles[i - 1]['end']
            if gap > 1.5:
                is_new_para = True
            elif current_para_len > 700 and final_subtitles[i - 1]['text'].strip().endswith(('.', '!', '?')):
                is_new_para = True
        if is_new_para and current_para_text:
            paragraphs.append({'start': para_start_time,
                                'text': ' '.join(current_para_text),
                                'translation': ''})
            current_para_text = [text]
            current_para_len = len(text)
            para_start_time = sub['start']
        else:
            current_para_text.append(text)
            current_para_len += len(text)
    if current_para_text:
        paragraphs.append({'start': para_start_time,
                            'text': ' '.join(current_para_text),
                            'translation': ''})
    return paragraphs


def _translate_paragraphs(paragraphs, translation_engine, ai_model, notify):
    """Translates all paragraphs in-place. Google uses concurrent requests; Ollama is sequential."""
    if translation_engine == "不生成双语对照":
        return

    use_google = "Google" in translation_engine
    model_to_use = ai_model if (ai_model and ai_model != "None") else "qwen2.5:8b"

    def _translate_one(p):
        try:
            if use_google:
                from ollama_utils import google_translate
                return google_translate(p['text']).strip()
            else:
                return translate_paragraph(model_to_use, p['text']).strip()
        except Exception as e:
            print(f"翻译失败: {e}")
            return f"⚠️ 翻译出错: {e}"

    if use_google:
        from concurrent.futures import ThreadPoolExecutor, as_completed
        notify(f"   -> 🌐 并发翻译 {len(paragraphs)} 个段落 (Google)...")
        completed_count = 0
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(_translate_one, p): i for i, p in enumerate(paragraphs)}
            for future in as_completed(futures):
                idx = futures[future]
                paragraphs[idx]['translation'] = future.result()
                completed_count += 1
                if completed_count % 5 == 0 or completed_count == len(paragraphs):
                    notify(f"   -> 🌐 翻译进度: {completed_count}/{len(paragraphs)}")
    else:
        for idx, p in enumerate(paragraphs):
            notify(f"   -> 🤖 翻译段落 [{format_timestamp_transcript(p['start'])}] ({idx+1}/{len(paragraphs)})")
            p['translation'] = _translate_one(p)


def _run_ai_analysis(paragraphs, ai_model, notify):
    """Calls Ollama to generate study analysis. Returns (analysis_parts, analysis_msg, has_analysis)."""
    if not ai_model or ai_model == "None":
        return [], "", False
    notify(f"   -> 🧠 正在生成 AI 分析 ({ai_model})，请稍候...")
    full_text = " ".join(p['text'] for p in paragraphs)
    analysis = analyze_transcript(ai_model, full_text[:30000])
    if analysis.startswith("❌ "):
        return [], f"⚠️ 无法生成 AI 分析:\n\n{analysis}\n\n", False
    analysis_parts = re.split(r"### 3\.", analysis, maxsplit=1)
    has_analysis = len(analysis_parts) > 1
    return analysis_parts, "", has_analysis


def _write_srt(subtitles, path):
    """Writes subtitles to an SRT file with minimum 0.8s duration enforcement."""
    with open(_lp(path), "w", encoding="utf-8") as f:
        for idx, sub in enumerate(subtitles):
            start, end = sub['start'], sub['end']
            if end - start < 0.8:
                end = start + 0.8
            f.write(f"{idx + 1}\n")
            f.write(f"{format_timestamp(start)} --> {format_timestamp(end)}\n")
            f.write(f"{sub['text']}\n\n")


def _write_vtt(subtitles, path):
    """Writes subtitles to a WebVTT file."""
    with open(_lp(path), "w", encoding="utf-8") as f:
        f.write("WEBVTT\n\n")
        for idx, sub in enumerate(subtitles):
            start, end = sub['start'], sub['end']
            if end - start < 0.8:
                end = start + 0.8
            f.write(f"{idx + 1}\n")
            f.write(f"{format_timestamp_vtt(start)} --> {format_timestamp_vtt(end)}\n")
            f.write(f"{sub['text']}\n\n")


def _write_md(filename, paragraphs, analysis_parts, analysis_msg, has_analysis,
              path, ai_model, translation_engine, wpm=0, cefr_level="N/A", cefr_desc=""):
    """Writes the bilingual Markdown study note."""
    with open(_lp(path), "w", encoding="utf-8") as f:
        f.write(f"# 🎙️ Fluentfox Study Note: {filename}\n")
        f.write(f"*Generated by [fluentfox.uk](https://fluentfox.uk)*\n\n")
        if wpm > 0 or cefr_level != "N/A":
            f.write(f"> **语速**: {wpm} WPM　|　**难度**: {cefr_level} ({cefr_desc})\n\n")

        if ai_model and ai_model != "None":
            f.write(f"---\n\n## 🤖 AI Study Partner Analysis ({ai_model})\n")
            if analysis_msg:
                f.write(analysis_msg)
                f.write("---\n\n")
            elif analysis_parts:
                f.write(analysis_parts[0].strip() + "\n\n")
        elif translation_engine != "不生成双语对照":
            f.write("---\n\n## 📖 Bilingual Transcript (中英双语对照)\n")

        if translation_engine != "不生成双语对照":
            if ai_model and ai_model != "None":
                f.write("### 2. 📖 Full Bilingual Transcript (中英双语精读)\n")
            f.write(f"*Total {len(paragraphs)} paragraphs. Translator: {translation_engine.split(' ')[0]}*\n\n")
            for p in paragraphs:
                f.write(f"**{format_timestamp_transcript(p['start'])}**\n")
                f.write(f"{p['text']}\n")
                f.write(f"*{p['translation']}*\n\n")

        if has_analysis:
            f.write("### 3. " + analysis_parts[1].strip() + "\n\n")


def _update_vocab_notebook(folder, filename, vocab_items):
    """
    Appends structured vocab items to the cross-episode vocabulary database.
    Deduplicates by word (case-insensitive) using a companion JSON index file.
    vocab_items: [{word, meaning, example, note}, ...]
    """
    import json as _json
    if not vocab_items:
        return

    index_path = os.path.join(folder, "vocabulary_index.json")
    notebook_path = os.path.join(folder, "vocabulary_notebook.md")

    # Load existing word index to deduplicate
    existing_words = set()
    if os.path.exists(_lp(index_path)):
        try:
            with open(_lp(index_path), "r", encoding="utf-8") as f:
                existing_words = set(w.lower() for w in _json.load(f).get("words", []))
        except Exception:
            pass

    new_items = [item for item in vocab_items
                 if item.get("word", "").strip().lower() not in existing_words]
    if not new_items:
        return

    is_new = not os.path.exists(_lp(notebook_path))
    with open(_lp(notebook_path), "a", encoding="utf-8") as f:
        if is_new:
            f.write("# 📚 Vocabulary Database\n")
            f.write("*由 SenseWhisper 跨集自动积累，按首次出现排列，已跨集去重*\n\n")
            f.write("> 每个词条记录来源剧集、地道例句和中国学生易错点。\n\n")
            f.write("---\n\n")
        for item in new_items:
            word = item.get("word", "").strip()
            f.write(f"## {word}\n\n")
            f.write(f"**中文**: {item.get('meaning', '')}\n\n")
            f.write(f"**来源**: `{filename}`\n\n")
            f.write(f"**例句**: *{item.get('example', '')}*\n\n")
            f.write(f"**易错**: {item.get('note', '')}\n\n")
            f.write("---\n\n")

    # Update the word index
    all_words = list(existing_words) + [i.get("word", "").lower() for i in new_items]
    with open(_lp(index_path), "w", encoding="utf-8") as f:
        _json.dump({"words": all_words}, f, ensure_ascii=False, indent=2)


def _write_pdf(filename, paragraphs, path, wpm=0, cefr_level="N/A", cefr_desc=""):
    """Writes the bilingual PDF study note."""
    pdf_data_list = [
        {
            'timestamp': format_timestamp_transcript(p['start']),
            'english': p['text'],
            'chinese': p.get('translation', '')
        }
        for p in paragraphs
    ]
    title = f"Fluentfox Study Note: {filename}"
    success, msg = generate_bilingual_pdf(title, pdf_data_list, path,
                                          wpm=wpm, cefr_level=cefr_level,
                                          cefr_desc=cefr_desc, filename=filename)
    if not success:
        print(f"PDF生成失败: {msg}")


def detect_device():
    """Returns ('cuda', None) or ('cpu', warning_message)."""
    if torch.cuda.is_available():
        name = torch.cuda.get_device_name(0)
        return "cuda", None
    return "cpu", (
        "⚠️ 未检测到 NVIDIA GPU (CUDA)，将使用 CPU 运行。\n"
        "CPU 模式下处理速度约为 GPU 的 1/10，建议对长音频使用 small 模型以节省时间。"
    )


class Transcriber:
    def __init__(self, model_size, compute_type="int8", device=None):
        self.model_size = model_size
        self.compute_type = compute_type
        if device is None:
            self.device, _ = detect_device()
        else:
            self.device = device
        self.model = None

    def load_model(self):
        """Loads the Whisper model if not already loaded."""
        if self.model is None:
            print(f"正在加载 Whisper 模型: {self.model_size}...")
            try:
                self.model = WhisperModel(self.model_size, device=self.device, compute_type=self.compute_type)
                return True, "模型加载成功。"
            except Exception as e:
                return False, f"模型加载失败: {e}"
        return True, "模型已加载。"

    def unload_model(self):
        """Unloads the model to free GPU memory."""
        if self.model:
            del self.model
            self.model = None
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print("模型已卸载，显存已释放。")

    def transcribe_file(self, audio_path, target_chars, max_chars, force_overwrite=False,
                        gen_srt=True, gen_ass=True, gen_vtt=False, gen_txt=False,
                        gen_pdf=False, gen_cloze=False, gen_anki=False, gen_quiz=False,
                        gen_shadow=False, ai_model=None,
                        translation_engine="Google Translate (免费/极快)",
                        organize_subfolder=False, status_callback=None):
        """
        Orchestrates transcription and output generation for a single audio file.
        If organize_subfolder=True, all outputs (including the audio) are placed in a
        dedicated subfolder named after the audio stem.
        status_callback(msg): optional callable for streaming status updates to the UI.
        """
        def _notify(msg):
            print(msg)
            if status_callback:
                status_callback(msg)

        stem = os.path.splitext(os.path.basename(audio_path))[0]
        parent_dir = os.path.dirname(audio_path)

        # --- Resolve output base path and notebook folder ---
        if organize_subfolder:
            # Detect re-run: audio already lives inside its own subfolder
            already_organized = os.path.basename(parent_dir) == stem
            if already_organized:
                subfolder = parent_dir
                notebook_folder = os.path.dirname(parent_dir)
            else:
                subfolder = os.path.join(parent_dir, stem)
                notebook_folder = parent_dir
            os.makedirs(_lp(subfolder), exist_ok=True)
            base = os.path.join(subfolder, stem)
        else:
            subfolder = None
            already_organized = True  # no-op flag
            notebook_folder = parent_dir
            base = os.path.join(parent_dir, stem)

        srt_path = base + ".srt"

        # --- Migrate existing root-level files into the subfolder (one-time migration) ---
        if organize_subfolder and not already_organized:
            _old_suffixes = ['.srt', '.ass', '.vtt', '.md', '.pdf',
                             '_cloze.md', '_vocab.apkg', '_quiz.md', '_shadowing.md']
            _migrated = []
            for _suffix in _old_suffixes:
                _old = os.path.join(parent_dir, stem + _suffix)
                _new = os.path.join(subfolder, stem + _suffix)
                if os.path.exists(_lp(_old)) and not os.path.exists(_lp(_new)):
                    shutil.move(_lp(_old), _lp(_new))
                    _migrated.append(_suffix)
            if _migrated:
                _notify(f"   -> 📁 迁移 {len(_migrated)} 个已有文件到子文件夹 {stem}/")

        # Skip if all requested outputs already exist
        paths = {'srt': base + '.srt', 'ass': base + '.ass', 'vtt': base + '.vtt',
                 'md': base + '.md', 'pdf': base + '.pdf', 'cloze': base + '_cloze.md',
                 'anki': base + '_vocab.apkg', 'quiz': base + '_quiz.md',
                 'shadow': base + '_shadowing.md'}
        flags = {'srt': gen_srt, 'ass': gen_ass, 'vtt': gen_vtt, 'md': gen_txt,
                 'pdf': gen_pdf, 'cloze': gen_cloze}
        if not force_overwrite and all(
            os.path.exists(_lp(paths[k])) for k, v in flags.items() if v
        ):
            # Even on skip, move the audio file if this is first-time subfolder organisation
            if organize_subfolder and not already_organized:
                _new_audio = os.path.join(subfolder, os.path.basename(audio_path))
                if os.path.exists(_lp(audio_path)) and not os.path.exists(_lp(_new_audio)):
                    shutil.move(_lp(audio_path), _lp(_new_audio))
                    _notify(f"   -> 📁 音频已整理到子文件夹: {stem}/")
            return srt_path, "跳过 (字幕已存在)"

        try:
            # --- Obtain subtitles (transcription or fast-path from existing SRT) ---
            can_skip_transcription = (
                os.path.exists(_lp(srt_path))
                and not gen_ass
                and not gen_vtt
                and (not gen_srt or not force_overwrite)
            )
            if can_skip_transcription and (gen_txt or gen_pdf or gen_cloze or gen_anki or gen_quiz or gen_shadow):
                _notify("   -> ⚡ 检测到已有 SRT，跳过转录直接生成文稿/PDF...")
                final_subtitles = parse_srt(srt_path)
                gen_srt = False
            else:
                if not self.model:
                    raise RuntimeError("模型未加载。请先调用 load_model()。")
                final_subtitles = _run_transcription(self.model, audio_path, target_chars, max_chars)

            # --- Write subtitle formats ---
            if gen_srt:
                _write_srt(final_subtitles, paths['srt'])
            if gen_ass:
                save_ass(final_subtitles, paths['ass'])
            if gen_vtt:
                _write_vtt(final_subtitles, paths['vtt'])

            # --- Build paragraphs, translate, run AI, write MD/PDF/CLOZE/QUIZ/ANKI/SHADOW ---
            if gen_txt or gen_pdf or gen_cloze or gen_anki or gen_quiz or gen_shadow:
                filename = os.path.basename(audio_path)
                paragraphs = _build_paragraphs(final_subtitles)
                _translate_paragraphs(paragraphs, translation_engine, ai_model, _notify)
                analysis_parts, analysis_msg, has_analysis = _run_ai_analysis(
                    paragraphs, ai_model, _notify
                )
                wpm = compute_wpm(final_subtitles)
                full_text = " ".join(p['text'] for p in paragraphs)
                cefr_level, _, cefr_desc = estimate_cefr(full_text)
                if has_analysis:
                    # Extract vocab once — used for both the notebook and Anki deck
                    _notify("   -> 📖 正在提取结构化词汇...")
                    vocab_section = re.split(r'\n### \d+\.', analysis_parts[1], maxsplit=1)[0].strip()
                    vocab_items = extract_vocab_structured(ai_model, vocab_section)
                    _update_vocab_notebook(notebook_folder, filename, vocab_items)
                    if gen_anki:
                        ok, msg = generate_anki_deck(filename, vocab_items, paths['anki'])
                        _notify(f"   -> 🃏 Anki: {msg}")
                if gen_txt:
                    _write_md(filename, paragraphs, analysis_parts, analysis_msg,
                              has_analysis, paths['md'], ai_model, translation_engine,
                              wpm=wpm, cefr_level=cefr_level, cefr_desc=cefr_desc)
                if gen_pdf:
                    _write_pdf(filename, paragraphs, paths['pdf'],
                               wpm=wpm, cefr_level=cefr_level, cefr_desc=cefr_desc)
                if gen_cloze:
                    _notify("   -> 📝 正在生成填空练习...")
                    generate_cloze_md(filename, paragraphs, paths['cloze'])
                if gen_quiz and ai_model and ai_model != "None":
                    _notify(f"   -> 📋 正在生成选择题/判断题 ({ai_model})...")
                    quiz_md = generate_quiz(ai_model, full_text)
                    if not quiz_md.startswith("❌"):
                        with open(_lp(paths['quiz']), "w", encoding="utf-8") as f:
                            f.write(f"# 📋 Quiz: {filename}\n\n")
                            f.write(quiz_md)
                if gen_shadow:
                    _notify("   -> 🎤 正在生成影子跟读脚本...")
                    generate_shadow_md(filename, paragraphs, paths['shadow'])

            # --- Move audio into subfolder (first-time organization only) ---
            if organize_subfolder and not already_organized:
                new_audio_path = os.path.join(subfolder, os.path.basename(audio_path))
                try:
                    shutil.move(_lp(audio_path), _lp(new_audio_path))
                    _notify(f"   -> 📁 已整理到子文件夹: {stem}/")
                except Exception as e:
                    _notify(f"   -> ⚠️ 移动音频失败: {e}")

            done_formats = [k.upper() for k, v in flags.items() if v]
            status_msg = "成功" + (f" ({' & '.join(done_formats)})" if done_formats else "")
            return srt_path, status_msg

        except Exception as e:
            import traceback
            traceback.print_exc()
            raise e

def find_audio_files(root_folder, extensions={'.mp3', '.wav', '.m4a', '.mp4', '.flac', '.mkv', '.avi', '.mov', '.ogg', '.aac'}, return_all_set=False):
    """
    极速文件夹扫描器 (基于 os.scandir)。
    返回音频文件列表。如果 return_all_set 为 True，则同时返回包含文件夹内所有文件路径的 set (用于秒级去重判断)。
    """
    audio_files = []
    all_files_set = set()
    if not os.path.exists(root_folder):
        return ([], set()) if return_all_set else []
    
    # 转换为绝对路径避免相对路径判断失效
    abs_root = os.path.abspath(root_folder)
    stack = [abs_root]
    
    while stack:
        current_dir = stack.pop()
        try:
            with os.scandir(current_dir) as it:
                for entry in it:
                    if entry.is_dir(follow_symlinks=False):
                        stack.append(entry.path)
                    elif entry.is_file():
                        full_path = os.path.normpath(entry.path)
                        if return_all_set:
                            all_files_set.add(full_path)
                        
                        ext = os.path.splitext(entry.name)[1].lower()
                        if ext in extensions:
                            audio_files.append(full_path)
        except (PermissionError, OSError):
            continue
            
    # 对结果排序确保处理顺序一致
    audio_files.sort()
    return (audio_files, all_files_set) if return_all_set else audio_files
