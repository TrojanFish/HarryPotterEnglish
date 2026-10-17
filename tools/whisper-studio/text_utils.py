
import os
import re


def _lp(path):
    """Prepend \\?\\ prefix on Windows to support paths longer than 260 chars."""
    if os.name == 'nt' and not path.startswith('\\\\'):
        return '\\\\?\\' + os.path.abspath(path).replace('/', '\\')
    return path


# ==============================================================================
#                        Content Analysis Utilities
# ==============================================================================

def compute_wpm(final_subtitles):
    """Estimates words-per-minute from subtitle timing and text."""
    if not final_subtitles:
        return 0
    total_words = sum(len(s['text'].split()) for s in final_subtitles)
    duration_sec = final_subtitles[-1]['end'] - final_subtitles[0]['start']
    if duration_sec <= 0:
        return 0
    return round(total_words / (duration_sec / 60))


def _count_syllables(word):
    """Estimates syllable count for an English word using vowel-group heuristic."""
    word = word.lower().strip(".,!?;:'\"")
    if not word:
        return 0
    vowels = 'aeiouy'
    count = len(re.findall(r'[aeiouy]+', word))
    if word.endswith('e') and count > 1:
        count -= 1
    return max(1, count)


def estimate_cefr(text):
    """
    Estimates CEFR level (A2-C2) using the Flesch-Kincaid Grade Level formula.
    Returns a tuple (level_str, grade_float, description).
    """
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    words = text.split()
    if not sentences or not words:
        return "N/A", 0, "内容不足，无法评估"

    avg_sentence_len = len(words) / len(sentences)
    avg_syllables = sum(_count_syllables(w) for w in words) / len(words)
    grade = 0.39 * avg_sentence_len + 11.8 * avg_syllables - 15.59

    if grade < 4:
        level, desc = "A2", "基础入门 — 适合初学者跟读"
    elif grade < 6:
        level, desc = "B1", "中等流利 — 适合日常对话练习"
    elif grade < 9:
        level, desc = "B2", "中高级 — 适合深度听力训练"
    elif grade < 12:
        level, desc = "C1", "高级 — 接近母语自然表达"
    else:
        level, desc = "C2", "母语级 — 学术/专业语料"

    return level, round(grade, 1), desc


def generate_cloze_md(filename, paragraphs, path, blank_ratio=0.25):
    """
    Generates a cloze (fill-in-the-blank) exercise .md file.
    Uses spacy to identify content words (NOUN, VERB, ADJ, ADV) and blanks ~blank_ratio of them.
    Answer key is appended at the end.
    """
    import random
    import spacy as _spacy

    try:
        _nlp = _spacy.load("en_core_web_sm")
    except OSError:
        print("⚠️ Spacy 模型未安装，跳过填空练习生成。")
        return

    # Target POS tags for blanking
    CONTENT_POS = {'NOUN', 'VERB', 'ADJ', 'ADV'}
    # Skip auxiliary/linking verbs
    SKIP_LEMMAS = {'be', 'have', 'do', 'will', 'would', 'can', 'could',
                   'shall', 'should', 'may', 'might', 'must', 'get'}

    all_blanks = []   # list of (para_idx, token_text, blank_id)
    cloze_paras = []  # processed paragraph texts with blanks inserted

    blank_counter = [0]

    def _process_para(text, para_idx):
        doc = _nlp(text)
        candidates = [
            tok for tok in doc
            if tok.pos_ in CONTENT_POS
            and tok.lemma_.lower() not in SKIP_LEMMAS
            and tok.is_alpha and len(tok.text) > 2
        ]
        n_blank = max(1, int(len(candidates) * blank_ratio))
        chosen = set(tok.i for tok in random.sample(candidates, min(n_blank, len(candidates))))

        result = []
        for tok in doc:
            if tok.i in chosen:
                blank_counter[0] += 1
                bid = blank_counter[0]
                all_blanks.append((bid, tok.text))
                result.append(f"**({bid})____**")
            else:
                result.append(tok.text_with_ws.rstrip() if tok.whitespace_ else tok.text)
        return " ".join(result)

    for i, p in enumerate(paragraphs):
        cloze_paras.append(_process_para(p['text'], i))

    with open(_lp(path), "w", encoding="utf-8") as f:
        f.write(f"# 📝 Cloze Exercise: {filename}\n\n")
        f.write("*根据听到的内容，将正确的单词填入括号中。*\n\n---\n\n")
        for i, (p, cloze_text) in enumerate(zip(paragraphs, cloze_paras)):
            f.write(f"**[{format_timestamp_transcript(p['start'])}]**\n\n")
            f.write(cloze_text + "\n\n")
        f.write("---\n\n## 答案 Answer Key\n\n")
        for bid, word in all_blanks:
            f.write(f"**({bid})** {word}\n")


def generate_shadow_md(filename, paragraphs, path):
    """
    Generates a shadowing practice script with prosody annotations.
    Marks stressed content words as [WORD], sentence boundaries with ↗/↘ intonation,
    and phrase pauses with | (short) and || (long).
    """
    import spacy as _spacy

    _nlp = None
    try:
        _nlp = _spacy.load("en_core_web_sm")
    except OSError:
        print("⚠️ Spacy 模型未安装，将生成无标注版本的跟读脚本。")

    STRESS_POS = {'NOUN', 'PROPN', 'ADJ', 'ADV'}
    SKIP_AUX_LEMMAS = {'be', 'have', 'do', 'will', 'would', 'can', 'could',
                       'shall', 'should', 'may', 'might', 'must'}

    def _annotate_sentence(sent_text):
        """Annotate one sentence: stress [WORD], intonation ↗/↘."""
        if _nlp is None:
            intonation = "↗" if sent_text.strip().endswith("?") else "↘"
            return sent_text.strip() + " " + intonation

        doc = _nlp(sent_text.strip())
        tokens = []
        for tok in doc:
            if tok.is_space:
                continue
            is_stressed = (
                tok.pos_ in STRESS_POS
                or (tok.pos_ == "VERB" and tok.dep_ not in {"aux", "auxpass"}
                    and tok.lemma_.lower() not in SKIP_AUX_LEMMAS)
            )
            word = tok.text_with_ws.rstrip() if tok.whitespace_ else tok.text
            tokens.append(f"[{tok.text.upper()}]" if is_stressed else word)

        # Insert short pause marker at commas/semicolons
        result = " ".join(tokens)
        result = re.sub(r'\s*([,;])\s*', r'\1 | ', result)
        intonation = "↗" if sent_text.strip().endswith("?") else "↘"
        return result + " " + intonation

    def _annotate_paragraph(text):
        """Split text into sentences, annotate each, join with long pause ||."""
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        annotated = [_annotate_sentence(s) for s in sentences if s.strip()]
        return " ||\n".join(annotated)

    with open(_lp(path), "w", encoding="utf-8") as f:
        f.write(f"# 🎤 Shadowing Script: {filename}\n")
        f.write(f"*Generated by SenseWhisper · [fluentfox.uk](https://fluentfox.uk)*\n\n")
        f.write("## 📌 标注说明\n\n")
        f.write("| 符号 | 含义 |\n|------|------|\n")
        f.write("| `[WORD]` | 重读词（内容词：名词、动词、形容词、副词） |\n")
        f.write("| `\\|` | 短停顿（逗号/短语间） |\n")
        f.write("| `\\|\\|` | 长停顿（句子间） |\n")
        f.write("| `↗` | 上升语调（疑问句） |\n")
        f.write("| `↘` | 下降语调（陈述句/感叹句） |\n\n")
        f.write("**跟读建议**: 先听原音 2 遍，再跟读标注版 3 遍，最后遮住标注自由输出。\n\n---\n\n")

        for i, p in enumerate(paragraphs, 1):
            ts = format_timestamp_transcript(p['start'])
            f.write(f"### [{ts}] Paragraph {i}\n\n")
            annotated = _annotate_paragraph(p['text'])
            f.write(f"{annotated}\n\n")
            if p.get('translation'):
                f.write(f"> *{p['translation']}*\n\n")
            f.write("---\n\n")

        f.write("## 📊 练习打卡\n\n")
        f.write("| 日期 | 跟读遍数 | 自评 (1-5) | 备注 |\n")
        f.write("|------|----------|------------|------|\n")
        for _ in range(5):
            f.write("|      |          |            |      |\n")
        f.write("\n")


# ==============================================================================
#                                  Helper Functions
# ==============================================================================

def format_timestamp(seconds):
    """Formats seconds into SRT timestamp format 00:00:00,000"""
    td = float(seconds)
    hours, minutes, secs = int(td // 3600), int((td % 3600) // 60), int(td % 60)
    millis = int((td - int(td)) * 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"

def format_timestamp_vtt(seconds):
    """Formats seconds into VTT timestamp format 00:00:00.000"""
    td = float(seconds)
    hours, minutes, secs = int(td // 3600), int((td % 3600) // 60), int(td % 60)
    millis = int((td - int(td)) * 1000)
    return f"{hours:02}:{minutes:02}:{secs:02}.{millis:03}"

def format_timestamp_transcript(seconds):
    """Formats seconds into simpler [HH:MM:SS] for reading"""
    td = int(seconds)
    hours, minutes, secs = td // 3600, (td % 3600) // 60, td % 60
    if hours > 0:
        return f"[{hours:02}:{minutes:02}:{secs:02}]"
    else:
        return f"[{minutes:02}:{secs:02}]"

def is_weak_ending(word):
    """Checks if a word is a weak ending (preposition, conjunction, etc.)"""
    weak_words = {
        # Articles
        'the', 'a', 'an', 
        # Prepositions
        'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'about', 'into', 'onto',
        # Conjunctions
        'and', 'but', 'or', 'as', 'so', 'if', 'when', 'than', 
        # Verbs (Auxiliary/Linking)
        'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had',
        # Pronouns/Determiners (sometimes weak at end)
        'that', 'this', 'my', 'your', 'his', 'her', 'their', 'our'
    }
    return word.strip().lower() in weak_words

import spacy

# Load Spacy model globally (lazy load)
nlp = None

def load_spacy_model():
    global nlp
    if nlp is None:
        try:
            print("正在加载 Spacy NLP 模型...")
            nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("⚠️ 未找到 Spacy 模型，请运行: python -m spacy download en_core_web_sm")
            return False
    return True

def advanced_split(words_list, target_chars=58, max_chars=85):
    """
    V3.5 Semantic/Syntactic Splitting Algorithm (Spacy Enhanced with Chunking)
    Splits text based on grammatical structure (clauses, phrases) while respecting length constraints.
    Prevents memory explosion by chunking long word lists.
    """
    if not words_list:
        return []

    # Lazy load model if needed
    if not load_spacy_model():
        return _advanced_split_v2_fallback(words_list, target_chars, max_chars)

    subtitles = []
    
    # Chunking logic to avoid Spacy max_length and MemoryError on huge audio
    chunks = []
    current_chunk_words = []
    current_chunk_len = 0
    
    for idx, w in enumerate(words_list):
        current_chunk_words.append(w)
        current_chunk_len += len(w.word)
        
        # Soft break on sentence end if chunk is getting large (>2000 chars)
        if current_chunk_len > 2000 and w.word.strip().endswith(('.', '?', '!', '。', '？', '！')):
            chunks.append(current_chunk_words)
            current_chunk_words = []
            current_chunk_len = 0
            continue
            
        # Hard break on long silences (>1.5s) if chunk is reasonably sized (>500 chars)
        if idx > 0 and current_chunk_len > 500:
            gap = w.start - words_list[idx-1].end
            if gap > 1.5:
                chunks.append(current_chunk_words)
                current_chunk_words = []
                current_chunk_len = 0

    if current_chunk_words:
        chunks.append(current_chunk_words)

    for chunk in chunks:
        full_text = "".join([w.word for w in chunk]).strip()
        doc = nlp(full_text)
        
        char_map = []
        current_offset = 0
        words_with_offsets = []
        
        for idx, w in enumerate(chunk):
            w_len = len(w.word)
            words_with_offsets.append({
                "word": w,
                "start_char": current_offset,
                "end_char": current_offset + w_len,
                "index": idx
            })
            current_offset += w_len

        def commit_range(start_idx, end_idx):
            if start_idx >= end_idx: return
            chunk_words = chunk[start_idx:end_idx]
            if not chunk_words: return
            s_time = chunk_words[0].start
            e_time = chunk_words[-1].end
            text = "".join([w.word for w in chunk_words]).strip()
            subtitles.append({
                "start": s_time, 
                "end": e_time, 
                "text": text,
                "words": chunk_words
            })

        last_commit_word_idx = 0
        
        for sent in doc.sents:
            sent_start_char = sent.start_char
            sent_end_char = sent.end_char
            
            start_w_idx = next((i for i, w in enumerate(words_with_offsets) if w['end_char'] > sent_start_char), last_commit_word_idx)
            end_w_idx = next((i for i, w in enumerate(words_with_offsets) if w['start_char'] >= sent_end_char), len(chunk))

            start_w_idx = max(start_w_idx, last_commit_word_idx) 
            
            current_length = sum(len(chunk[i].word) for i in range(start_w_idx, end_w_idx))
            
            if current_length <= max_chars:
                commit_range(start_w_idx, end_w_idx)
                last_commit_word_idx = end_w_idx
            else:
                current_chunk_start = start_w_idx
                current_char_accum = 0
                
                for token in sent:
                    token_end_char = token.idx + len(token.text)
                    curr_w_idx = next((i for i, w in enumerate(words_with_offsets) if w['end_char'] >= token_end_char), end_w_idx)
                    
                    if curr_w_idx >= end_w_idx: break
                    
                    chunk_len_so_far = sum(len(chunk[i].word) for i in range(current_chunk_start, curr_w_idx + 1))
                    
                    is_split_point = False
                    if chunk_len_so_far > target_chars:
                        if token.text in [',', ';', ':']:
                            is_split_point = True
                        elif token.pos_ in ['CCONJ', 'SCONJ'] or token.dep_ in ['mark', 'cc']:
                            is_split_point = True

                    if chunk_len_so_far >= max_chars:
                        is_split_point = True
                    
                    if is_split_point:
                        split_idx = curr_w_idx + 1
                        if token.text in [',', ';', ':', '.', '!', '?']:
                            split_idx = curr_w_idx + 1
                        elif token.text.lower() in ['and', 'but', 'or', 'because', 'when', 'if']:
                             split_idx = curr_w_idx
                        
                        if split_idx > current_chunk_start:
                            commit_range(current_chunk_start, split_idx)
                            current_chunk_start = split_idx
                            current_char_accum = 0
                
                if current_chunk_start < end_w_idx:
                    commit_range(current_chunk_start, end_w_idx)
                    last_commit_word_idx = end_w_idx

        if last_commit_word_idx < len(chunk):
            commit_range(last_commit_word_idx, len(chunk))

    return subtitles

def _advanced_split_v2_fallback(words_list, target_chars, max_chars):
    """Original V2.0 Logic as fallback"""
    if not words_list: return []
    
    subtitles = []
    current_line_words = []

    def commit_line(words_to_commit):
        if not words_to_commit: return
        start_t = words_to_commit[0].start
        end_t = words_to_commit[-1].end
        text = "".join([w.word for w in words_to_commit]).strip()
        subtitles.append({
            "start": start_t, 
            "end": end_t, 
            "text": text,
            "words": words_to_commit # Essential for ASS generation
        })

    i = 0
    while i < len(words_list):
        word = words_list[i]
        word_text = word.word
        current_text_len = sum(len(w.word) for w in current_line_words)
        new_len = current_text_len + len(word_text)
        
        last_word_has_punct = False
        if current_line_words:
            last_word_has_punct = current_line_words[-1].word.strip().endswith(('.', '?', '!'))

        if last_word_has_punct:
            commit_line(current_line_words)
            current_line_words = [word]
            i += 1
            continue

        if new_len > target_chars:
            remaining_words = len(words_list) - i
            sentence_ending_soon = False
            for lookahead_idx in range(i, min(i + 3, len(words_list))):
                if words_list[lookahead_idx].word.strip().endswith(('.', '?', '!')):
                    sentence_ending_soon = True
                    break

            if remaining_words <= 2 or sentence_ending_soon:
                if new_len < max_chars:
                    current_line_words.append(word)
                    i += 1
                    continue

            split_idx = len(current_line_words)
            comma_idx = -1
            for idx in range(len(current_line_words) - 1, max(-1, len(current_line_words) - 8), -1):
                if current_line_words[idx].word.strip().endswith(','):
                    comma_idx = idx
                    break

            if comma_idx != -1:
                split_idx = comma_idx + 1
            else:
                while split_idx > 0 and is_weak_ending(current_line_words[split_idx - 1].word):
                    split_idx -= 1

            if split_idx < 3:
                split_idx = len(current_line_words)

            line_to_commit = current_line_words[:split_idx]
            next_line_start = current_line_words[split_idx:]
            commit_line(line_to_commit)
            current_line_words = next_line_start + [word]

        else:
            current_line_words.append(word)
        i += 1

    if current_line_words:
        commit_line(current_line_words)

    return subtitles


def clean_text_overlap(prev_text, curr_text, curr_words=None):
    """
    Checks for and removes overlap between the end of prev_text and start of curr_text.
    Also trims the associated words array if provided.
    """
    def normalize(t):
        return re.sub(r'[^\w\s]', '', t.lower()).strip()

    p_norm = normalize(prev_text)
    c_norm = normalize(curr_text)

    check_len = min(len(p_norm), len(c_norm), 50)
    best_overlap_len = 0

    for i in range(check_len, 4, -1):
        suffix = p_norm[-i:]
        prefix = c_norm[:i]
        if suffix == prefix:
            best_overlap_len = i
            break

    if best_overlap_len > 0:
        overlap_words_count = len(prefix.split())
        curr_words_str = curr_text.split()

        if len(curr_words_str) > overlap_words_count:
            new_text = " ".join(curr_words_str[overlap_words_count:])
            if new_text:
                new_text = new_text[0].upper() + new_text[1:]
            
            new_words = curr_words[overlap_words_count:] if curr_words else []
            return new_text, new_words

    return curr_text, curr_words

_HALLUCINATION_FRAGMENTS = {
    # YouTube / social media boilerplate
    'thank you for watching',
    'thanks for watching',
    'please subscribe',
    'don\'t forget to subscribe',
    'like and subscribe',
    'hit the like button',
    'click the bell',
    'see you next time',
    'see you in the next video',
    # Subtitle tool signatures
    'subtitle by',
    'subtitles by',
    'captioned by',
    'transcript by',
    'transcribed by',
    'closed captions',
    'auto-generated',
    'www.',
    'http',
    # Silence / music markers
    '[music]',
    '[applause]',
    '[laughter]',
    '[silence]',
    '[ music ]',
    '[ applause ]',
    # Common Whisper noise-triggered phrases
    'uh uh uh',
    'um um um',
    'hmm hmm',
    'you you you',
    'the the the',
    'i i i i',
    # Foreign-language spam Whisper sometimes hallucinates on silence
    '在此感谢',
    '字幕由',
    '请订阅',
}

def is_garbage_text(text):
    """Detects nonsensical Whisper hallucinations: short consonant-only tokens,
    known boilerplate phrases, and pathological word repetition."""
    t = text.strip().lower().replace('.', '').replace(',', '')
    if not t:
        return True

    # Single/double consonant-only tokens (e.g. 'kh', 'th')
    if len(t) <= 2:
        if not any(char in 'aeiouy' for char in t):
            return True

    # Known hallucination fragments (substring match)
    if any(h in t for h in _HALLUCINATION_FRAGMENTS):
        return True

    # Pathological repetition: same word appears >10 times in a long segment
    words = t.split()
    if len(words) > 15:
        from collections import Counter
        counts = Counter(words)
        for word, count in counts.items():
            if count > 10 and len(word) > 2:
                return True

    return False

def align_words_array(new_text, words_obj):
    """Realigns word objects to match heavily edited text (e.g., deduplication)."""
    if not words_obj: return []
    new_words_str = new_text.split()
    aligned_words = []
    w_idx = 0
    
    for nw in new_words_str:
        clean_nw = re.sub(r'[^\w]', '', nw.lower())
        if not clean_nw: continue
        while w_idx < len(words_obj):
            clean_ow = re.sub(r'[^\w]', '', words_obj[w_idx].word.lower())
            w_idx += 1
            if clean_ow == clean_nw:
                aligned_words.append(words_obj[w_idx - 1])
                break
    
    return aligned_words if aligned_words else words_obj

def clean_subtitles(raw_subtitles):
    """
    V2.5 Precision Cleaning Pipeline (Words Array Synchronized)
    Specifically tuned for children podcasts with repetitive dialogue and noise.
    """
    final_subtitles = []

    for current_sub in raw_subtitles:
        text = current_sub['text']
        words = current_sub.get('words', [])

        if is_garbage_text(text):
            continue

        # --- A. In-line deduplication ---
        text_before = text
        text = re.sub(r'\b(\w+[\s,]+)\1', r'\1', text, flags=re.IGNORECASE)
        text = re.sub(r'(He said,)\s*(He\s)', r'\2', text, flags=re.IGNORECASE)
        
        if text != text_before and words:
            words = align_words_array(text, words)
            
        current_sub['text'] = text
        current_sub['words'] = words

        if not final_subtitles:
            final_subtitles.append(current_sub)
            continue

        prev_sub = final_subtitles[-1]

        def pure(t):
            return re.sub(r'[^\w]', '', t.lower())

        p_text = pure(prev_sub['text'])
        c_text = pure(current_sub['text'])

        overlap_duration = prev_sub['end'] - current_sub['start'] 
        
        # --- B. Precision Hallucination vs. Echo Check ---
        if (p_text in c_text or c_text in p_text) and len(c_text) > 0:
            if overlap_duration > 0.2:
                if len(c_text) > len(p_text):
                    final_subtitles.pop()
                    final_subtitles.append(current_sub)
                continue
            else:
                pass

        # --- C. Inter-line overlap cleaning (Standard) ---
        cleaned_curr_text, cleaned_curr_words = clean_text_overlap(prev_sub['text'], current_sub['text'], current_sub.get('words', []))
        if cleaned_curr_text != current_sub['text']:
            if is_garbage_text(cleaned_curr_text):
                continue
            current_sub['text'] = cleaned_curr_text
            current_sub['words'] = cleaned_curr_words

        # --- D. Final Time Alignment ---
        if current_sub['start'] < prev_sub['end']:
            prev_sub['end'] = current_sub['start']
            final_subtitles[-1] = prev_sub

        final_subtitles.append(current_sub)
    
    return final_subtitles
