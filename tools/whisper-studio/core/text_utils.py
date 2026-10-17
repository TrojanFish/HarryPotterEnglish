import os
import re
from typing import List, Dict, Any, Tuple, Optional


def _lp(path: str) -> str:
    """Prepend \\?\\ prefix on Windows to support paths longer than 260 chars."""
    if os.name == "nt" and not path.startswith("\\\\"):
        return "\\\\?\\" + os.path.abspath(path).replace("/", "\\")
    return path


# ==============================================================================
#                        Content Analysis Utilities
# ==============================================================================

def compute_wpm(final_subtitles: List[Dict[str, Any]]) -> int:
    """Estimates words-per-minute from subtitle timing and text."""
    if not final_subtitles:
        return 0
    total_words = sum(len(s.get("text", "").split()) for s in final_subtitles)
    start_time = float(final_subtitles[0].get("start", 0.0))
    end_time = float(final_subtitles[-1].get("end", 0.0))
    duration_sec = end_time - start_time
    if duration_sec <= 0:
        return 0
    return int(round(total_words / (duration_sec / 60.0)))


def _count_syllables(word: str) -> int:
    """Estimates syllable count for an English word using vowel-group heuristic."""
    word = word.lower().strip(".,!?;:'\"")
    if not word:
        return 0
    count = len(re.findall(r"[aeiouy]+", word))
    if word.endswith("e") and count > 1:
        count -= 1
    return max(1, count)


def estimate_cefr(text: str) -> Tuple[str, float, str]:
    """
    Estimates CEFR level (A2-C2) using the Flesch-Kincaid Grade Level formula.
    Returns a tuple (level_str, grade_float, description).
    """
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    words = text.split()
    if not sentences or not words:
        return "N/A", 0.0, "Content insufficient for evaluation"

    avg_sentence_len = len(words) / len(sentences)
    avg_syllables = sum(_count_syllables(w) for w in words) / len(words)
    grade = 0.39 * avg_sentence_len + 11.8 * avg_syllables - 15.59

    if grade < 4:
        level, desc = "A2", "Elementary - suitable for beginner shadowing"
    elif grade < 6:
        level, desc = "B1", "Intermediate - suitable for daily conversation practice"
    elif grade < 9:
        level, desc = "B2", "Upper Intermediate - suitable for in-depth listening training"
    elif grade < 12:
        level, desc = "C1", "Advanced - close to natural native expression"
    else:
        level, desc = "C2", "Mastery - academic and professional corpus"

    return level, round(grade, 1), desc


# ==============================================================================
#                                  Helper Functions
# ==============================================================================

def format_timestamp(seconds: float) -> str:
    """Formats seconds into SRT timestamp format 00:00:00,000"""
    total_ms = int(round(max(0.0, float(seconds)) * 1000))
    total_seconds, ms = divmod(total_ms, 1000)
    hours, remainder = divmod(total_seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def format_timestamp_vtt(seconds: float) -> str:
    """Formats seconds into VTT timestamp format 00:00:00.000"""
    total_ms = int(round(max(0.0, float(seconds)) * 1000))
    total_seconds, ms = divmod(total_ms, 1000)
    hours, remainder = divmod(total_seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{ms:03d}"


def format_timestamp_transcript(seconds: float) -> str:
    """Formats seconds into simpler [HH:MM:SS] or [MM:SS] for reading"""
    td = int(max(0.0, float(seconds)))
    hours, remainder = divmod(td, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours > 0:
        return f"[{hours:02d}:{minutes:02d}:{secs:02d}]"
    else:
        return f"[{minutes:02d}:{secs:02d}]"


def is_weak_ending(word: str) -> bool:
    """Checks if a word is a weak ending (preposition, conjunction, etc.)"""
    weak_words = {
        # Articles
        "the", "a", "an",
        # Prepositions
        "of", "in", "on", "at", "to", "for", "with", "by", "from", "about", "into", "onto",
        # Conjunctions
        "and", "but", "or", "as", "so", "if", "when", "than",
        # Verbs (Auxiliary/Linking)
        "is", "are", "was", "were", "be", "been", "has", "have", "had",
        # Pronouns/Determiners (sometimes weak at end)
        "that", "this", "my", "your", "his", "her", "their", "our"
    }
    return word.strip().lower() in weak_words


# Load Spacy model lazily and safely
_nlp = None


def load_spacy_model() -> bool:
    """Safely loads Spacy model if available without crashing."""
    global _nlp
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load("en_core_web_sm")
        except (ImportError, OSError):
            return False
    return True


def advanced_split(words_list: List[Any], target_chars: int = 58, max_chars: int = 85) -> List[Dict[str, Any]]:
    """
    Semantic/Syntactic Splitting Algorithm.
    Splits text based on grammatical structure while respecting length constraints.
    Falls back to heuristic splitting if Spacy is not installed.
    """
    if not words_list:
        return []

    if not load_spacy_model():
        return _advanced_split_v2_fallback(words_list, target_chars, max_chars)

    subtitles: List[Dict[str, Any]] = []

    # Chunking logic to avoid Spacy max_length and MemoryError on large audio
    chunks: List[List[Any]] = []
    current_chunk_words: List[Any] = []
    current_chunk_len = 0

    for idx, w in enumerate(words_list):
        current_chunk_words.append(w)
        word_text = getattr(w, "word", str(w))
        current_chunk_len += len(word_text)

        # Soft break on sentence end if chunk is getting large (>2000 chars)
        if current_chunk_len > 2000 and word_text.strip().endswith((".", "?", "!", "\u3002", "\uFF1F", "\uFF01")):
            chunks.append(current_chunk_words)
            current_chunk_words = []
            current_chunk_len = 0
            continue

        # Hard break on long silences (>1.5s) if chunk is reasonably sized (>500 chars)
        if idx > 0 and current_chunk_len > 500:
            w_start = getattr(w, "start", 0.0)
            prev_end = getattr(words_list[idx - 1], "end", 0.0)
            gap = w_start - prev_end
            if gap > 1.5:
                chunks.append(current_chunk_words)
                current_chunk_words = []
                current_chunk_len = 0

    if current_chunk_words:
        chunks.append(current_chunk_words)

    for chunk in chunks:
        full_text = "".join([getattr(w, "word", str(w)) for w in chunk]).strip()
        doc = _nlp(full_text)

        current_offset = 0
        words_with_offsets = []

        for idx, w in enumerate(chunk):
            w_text = getattr(w, "word", str(w))
            w_len = len(w_text)
            words_with_offsets.append({
                "word": w,
                "start_char": current_offset,
                "end_char": current_offset + w_len,
                "index": idx
            })
            current_offset += w_len

        def commit_range(start_idx: int, end_idx: int) -> None:
            if start_idx >= end_idx:
                return
            chunk_words = chunk[start_idx:end_idx]
            if not chunk_words:
                return
            s_time = getattr(chunk_words[0], "start", 0.0)
            e_time = getattr(chunk_words[-1], "end", s_time + 1.0)
            text = "".join([getattr(w, "word", str(w)) for w in chunk_words]).strip()
            subtitles.append({
                "start": float(s_time),
                "end": float(e_time),
                "text": text,
                "words": chunk_words
            })

        last_commit_word_idx = 0

        for sent in doc.sents:
            sent_start_char = sent.start_char
            sent_end_char = sent.end_char

            start_w_idx = next((i for i, w in enumerate(words_with_offsets) if w["end_char"] > sent_start_char), last_commit_word_idx)
            end_w_idx = next((i for i, w in enumerate(words_with_offsets) if w["start_char"] >= sent_end_char), len(chunk))
            start_w_idx = max(start_w_idx, last_commit_word_idx)

            current_length = sum(len(getattr(chunk[i], "word", str(chunk[i]))) for i in range(start_w_idx, end_w_idx))

            if current_length <= max_chars:
                commit_range(start_w_idx, end_w_idx)
                last_commit_word_idx = end_w_idx
            else:
                current_chunk_start = start_w_idx

                for token in sent:
                    token_end_char = token.idx + len(token.text)
                    curr_w_idx = next((i for i, w in enumerate(words_with_offsets) if w["end_char"] >= token_end_char), end_w_idx)

                    if curr_w_idx >= end_w_idx:
                        break

                    chunk_len_so_far = sum(len(getattr(chunk[i], "word", str(chunk[i]))) for i in range(current_chunk_start, curr_w_idx + 1))
                    words_in_current_chunk = curr_w_idx - current_chunk_start + 1

                    # Lookahead: count remaining words and characters in this sentence after curr_w_idx
                    remaining_words = end_w_idx - (curr_w_idx + 1)
                    remaining_chars = sum(len(getattr(chunk[i], "word", str(chunk[i]))) for i in range(curr_w_idx + 1, end_w_idx))

                    is_split_point = False
                    halfway = current_length // 2
                    is_in_balance_zone = (chunk_len_so_far >= max(28, halfway - 20))

                    if words_in_current_chunk >= 3 and remaining_words >= 3 and remaining_chars >= 15:
                        if token.text in [",", ";", ":"]:
                            if chunk_len_so_far > target_chars or is_in_balance_zone:
                                is_split_point = True
                        elif token.pos_ in ["CCONJ", "SCONJ"] or token.dep_ in ["mark", "cc"]:
                            if chunk_len_so_far > target_chars or is_in_balance_zone:
                                is_split_point = True

                    if chunk_len_so_far >= max_chars:
                        if remaining_words >= 3 and remaining_chars >= 15:
                            is_split_point = True
                        elif remaining_words <= 2 and chunk_len_so_far + remaining_chars <= max_chars + 30:
                            # Avoid chopping off the last 1-2 words; allow the sentence to stretch slightly
                            is_split_point = False
                        else:
                            is_split_point = True

                    if is_split_point:
                        split_idx = curr_w_idx + 1
                        if token.text in [",", ";", ":", ".", "!", "?"]:
                            split_idx = curr_w_idx + 1
                        elif token.text.lower() in ["and", "but", "or", "because", "when", "if", "while", "since", "although"]:
                            split_idx = curr_w_idx

                        # Roll back if preceding word is a weak ending (e.g. 'on', 'of', 'in', 'to', 'for', 'the', 'a')
                        while split_idx > current_chunk_start + 3:
                            last_word_text = getattr(chunk[split_idx - 1], "word", str(chunk[split_idx - 1])).strip().lower()
                            if is_weak_ending(last_word_text):
                                split_idx -= 1
                            else:
                                break

                        # Ensure both chunk sides have at least 3 words and 15 chars
                        words_left = end_w_idx - split_idx
                        chars_left = sum(len(getattr(chunk[i], "word", str(chunk[i]))) for i in range(split_idx, end_w_idx))
                        words_committed = split_idx - current_chunk_start
                        chars_committed = sum(len(getattr(chunk[i], "word", str(chunk[i]))) for i in range(current_chunk_start, split_idx))

                        if words_left < 3 or chars_left < 15 or words_committed < 3 or chars_committed < 15:
                            # Never leave an orphan on either side
                            continue

                        if split_idx > current_chunk_start:
                            commit_range(current_chunk_start, split_idx)
                            current_chunk_start = split_idx

                if current_chunk_start < end_w_idx:
                    commit_range(current_chunk_start, end_w_idx)
                    last_commit_word_idx = end_w_idx

        if last_commit_word_idx < len(chunk):
            commit_range(last_commit_word_idx, len(chunk))

    return subtitles


def _advanced_split_v2_fallback(words_list: List[Any], target_chars: int, max_chars: int) -> List[Dict[str, Any]]:
    """Heuristic logic fallback when Spacy is not installed."""
    if not words_list:
        return []

    subtitles: List[Dict[str, Any]] = []
    current_line_words: List[Any] = []

    def commit_line(words_to_commit: List[Any]) -> None:
        if not words_to_commit:
            return
        start_t = getattr(words_to_commit[0], "start", 0.0)
        end_t = getattr(words_to_commit[-1], "end", start_t + 1.0)
        text = "".join([getattr(w, "word", str(w)) for w in words_to_commit]).strip()
        subtitles.append({
            "start": float(start_t),
            "end": float(end_t),
            "text": text,
            "words": words_to_commit
        })

    i = 0
    while i < len(words_list):
        word = words_list[i]
        word_text = getattr(word, "word", str(word))
        current_text_len = sum(len(getattr(w, "word", str(w))) for w in current_line_words)
        new_len = current_text_len + len(word_text)

        last_word_has_punct = False
        if current_line_words:
            last_w_text = getattr(current_line_words[-1], "word", str(current_line_words[-1]))
            last_word_has_punct = last_w_text.strip().endswith((".", "?", "!"))

        if last_word_has_punct:
            commit_line(current_line_words)
            current_line_words = [word]
            i += 1
            continue

        if new_len > target_chars:
            remaining_words = len(words_list) - i
            sentence_ending_soon = False
            for lookahead_idx in range(i, min(i + 3, len(words_list))):
                lw_text = getattr(words_list[lookahead_idx], "word", str(words_list[lookahead_idx]))
                if lw_text.strip().endswith((".", "?", "!")):
                    sentence_ending_soon = True
                    break

            if remaining_words <= 2 or sentence_ending_soon:
                if new_len <= max_chars + 30:
                    current_line_words.append(word)
                    i += 1
                    continue

            split_idx = len(current_line_words)
            comma_idx = -1
            for idx in range(len(current_line_words) - 1, max(-1, len(current_line_words) - 8), -1):
                cw_text = getattr(current_line_words[idx], "word", str(current_line_words[idx]))
                if cw_text.strip().endswith(","):
                    comma_idx = idx
                    break

            if comma_idx != -1:
                split_idx = comma_idx + 1
            else:
                while split_idx > 0:
                    cw_text = getattr(current_line_words[split_idx - 1], "word", str(current_line_words[split_idx - 1]))
                    if is_weak_ending(cw_text):
                        split_idx -= 1
                    else:
                        break

            if split_idx < 3:
                split_idx = len(current_line_words)

            if len(current_line_words) - split_idx + (len(words_list) - i) < 3 and new_len <= max_chars + 30:
                current_line_words.append(word)
                i += 1
                continue

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


def clean_text_overlap(prev_text: str, curr_text: str, curr_words: Optional[List[Any]] = None) -> Tuple[str, Optional[List[Any]]]:
    """
    Removes overlap between the end of prev_text and start of curr_text.
    Trims the associated words array if provided.
    """
    def normalize(t: str) -> str:
        return re.sub(r"[^\w\s]", "", t.lower()).strip()

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
    "thank you for watching",
    "thanks for watching",
    "please subscribe",
    "don't forget to subscribe",
    "like and subscribe",
    "hit the like button",
    "click the bell",
    "see you next time",
    "see you in the next video",
    # Subtitle tool signatures
    "subtitle by",
    "subtitles by",
    "captioned by",
    "transcript by",
    "transcribed by",
    "closed captions",
    "auto-generated",
    "www.",
    "http",
    # Silence / music markers
    "[music]",
    "[applause]",
    "[laughter]",
    "[silence]",
    "[ music ]",
    "[ applause ]",
    # Noise-triggered phrases
    "uh uh uh",
    "um um um",
    "hmm hmm",
    "you you you",
    "the the the",
    "i i i i",
    # Foreign-language spam
    "\u5728\u6b64\u611f\u8c22",
    "\u5b57\u5e55\u7531",
    "\u8bf7\u8ba2\u9605",
}


def is_garbage_text(text: str) -> bool:
    """Detects nonsensical Whisper hallucinations and noise artifacts."""
    t = text.strip().lower().replace(".", "").replace(",", "")
    if not t:
        return True

    # Single/double consonant-only tokens (e.g. 'kh', 'th')
    if len(t) <= 2:
        if not any(char in "aeiouy" for char in t):
            return True

    # Known hallucination fragments
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


def align_words_array(new_text: str, words_obj: List[Any]) -> List[Any]:
    """Realigns word objects to match edited text."""
    if not words_obj:
        return []
    new_words_str = new_text.split()
    aligned_words = []
    w_idx = 0

    for nw in new_words_str:
        clean_nw = re.sub(r"[^\w]", "", nw.lower())
        if not clean_nw:
            continue
        while w_idx < len(words_obj):
            w_text = getattr(words_obj[w_idx], "word", str(words_obj[w_idx]))
            clean_ow = re.sub(r"[^\w]", "", w_text.lower())
            w_idx += 1
            if clean_ow == clean_nw:
                aligned_words.append(words_obj[w_idx - 1])
                break

    return aligned_words if aligned_words else words_obj


def clean_subtitles(raw_subtitles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Subtitles cleaning pipeline adhering strictly to Hogwarts Audio quality standards.
    Handles hallucination pruning, inline deduplication, overlap removal, and timestamp alignment.
    """
    final_subtitles: List[Dict[str, Any]] = []

    for current_sub in raw_subtitles:
        text = str(current_sub.get("text", "")).strip()
        words = current_sub.get("words", [])

        if is_garbage_text(text):
            continue

        # A. In-line deduplication
        text_before = text
        text = re.sub(r"\b(\w+[\s,]+)\1", r"\1", text, flags=re.IGNORECASE)
        text = re.sub(r"(He said,)\s*(He\s)", r"\2", text, flags=re.IGNORECASE)

        if text != text_before and words:
            words = align_words_array(text, words)

        current_sub["text"] = text
        if "words" in current_sub:
            current_sub["words"] = words

        if not final_subtitles:
            final_subtitles.append(current_sub)
            continue

        prev_sub = final_subtitles[-1]

        def pure(t: str) -> str:
            return re.sub(r"[^\w]", "", t.lower())

        p_text = pure(prev_sub.get("text", ""))
        c_text = pure(current_sub.get("text", ""))

        prev_end = float(prev_sub.get("end", 0.0))
        curr_start = float(current_sub.get("start", 0.0))
        overlap_duration = prev_end - curr_start

        # B. Precision Hallucination vs. Echo Check
        if (p_text in c_text or c_text in p_text) and len(c_text) > 0:
            if overlap_duration > 0.2:
                if len(c_text) > len(p_text):
                    final_subtitles.pop()
                    final_subtitles.append(current_sub)
                continue

        # C. Inter-line overlap cleaning
        cleaned_curr_text, cleaned_curr_words = clean_text_overlap(
            prev_sub.get("text", ""),
            current_sub.get("text", ""),
            current_sub.get("words")
        )
        if cleaned_curr_text != current_sub.get("text", ""):
            if is_garbage_text(cleaned_curr_text):
                continue
            current_sub["text"] = cleaned_curr_text
            if "words" in current_sub:
                current_sub["words"] = cleaned_curr_words

        # D. Final Time Alignment
        if float(current_sub.get("start", 0.0)) < float(prev_sub.get("end", 0.0)):
            prev_sub["end"] = current_sub["start"]
            final_subtitles[-1] = prev_sub

        final_subtitles.append(current_sub)

    return merge_orphan_subtitles(final_subtitles)


def merge_orphan_subtitles(subtitles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Merges dangling orphan fragments (<= 2 words or < 16 chars) into their parent cue.
    Guarantees no orphan single words like 'world?', 'and culture.', 'from leaving.'.
    """
    if len(subtitles) <= 1:
        return subtitles

    merged: List[Dict[str, Any]] = []
    sentence_end_punct = (".", "!", "?", "。", "！", "？")

    for cue in subtitles:
        text = str(cue.get("text", "")).strip()
        if not text:
            continue

        if not merged:
            merged.append(dict(cue))
            continue

        prev = merged[-1]
        prev_text = str(prev.get("text", "")).strip()

        prev_ends_sentence = prev_text.endswith(sentence_end_punct)
        curr_words = text.split()
        curr_duration = float(cue.get("end", 0.0)) - float(cue.get("start", 0.0))

        # Condition for an orphan fragment that belongs to the preceding sentence
        is_trailing_orphan = (
            not prev_ends_sentence and (
                len(curr_words) <= 2 or
                (len(text) < 16 and curr_duration < 1.6)
            )
        )

        # Condition for a leading orphan (e.g. single word 'And' / 'So' / 'However,' left on its own)
        prev_words = prev_text.split()
        prev_duration = float(prev.get("end", 0.0)) - float(prev.get("start", 0.0))
        is_leading_orphan = (
            not prev_ends_sentence and (
                len(prev_words) <= 1 and prev_duration < 1.2
            )
        )

        if is_trailing_orphan:
            # Merge current orphan into previous cue
            prev["text"] = f"{prev_text} {text}".strip()
            prev["end"] = max(float(prev.get("end", 0.0)), float(cue.get("end", 0.0)))
            if "words" in prev and "words" in cue:
                prev["words"] = (prev.get("words") or []) + (cue.get("words") or [])
            if "translation" in prev or "translation" in cue:
                p_trans = str(prev.get("translation", "")).strip()
                c_trans = str(cue.get("translation", "")).strip()
                if p_trans and c_trans:
                    prev["translation"] = f"{p_trans} {c_trans}".strip()
                elif c_trans:
                    prev["translation"] = c_trans
            merged[-1] = prev
        elif is_leading_orphan:
            # Merge previous single word forward into current cue
            cue["text"] = f"{prev_text} {text}".strip()
            cue["start"] = min(float(prev.get("start", 0.0)), float(cue.get("start", 0.0)))
            if "words" in prev and "words" in cue:
                cue["words"] = (prev.get("words") or []) + (cue.get("words") or [])
            if "translation" in prev or "translation" in cue:
                p_trans = str(prev.get("translation", "")).strip()
                c_trans = str(cue.get("translation", "")).strip()
                if p_trans and c_trans:
                    cue["translation"] = f"{p_trans} {c_trans}".strip()
                elif p_trans:
                    cue["translation"] = p_trans
            merged[-1] = dict(cue)
        else:
            merged.append(dict(cue))

    return merged


def generate_cloze_md(filename: str, paragraphs: List[Dict[str, Any]], path: str, blank_ratio: float = 0.25) -> None:
    """
    Generates a cloze exercise markdown file without emojis.
    """
    import random
    try:
        import spacy
        _local_nlp = spacy.load("en_core_web_sm")
    except (ImportError, OSError):
        return

    content_pos = {"NOUN", "VERB", "ADJ", "ADV"}
    skip_lemmas = {"be", "have", "do", "will", "would", "can", "could", "shall", "should", "may", "might", "must", "get"}

    all_blanks = []
    cloze_paras = []
    blank_counter = [0]

    def _process_para(text: str) -> str:
        doc = _local_nlp(text)
        candidates = [
            tok for tok in doc
            if tok.pos_ in content_pos
            and tok.lemma_.lower() not in skip_lemmas
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

    for p in paragraphs:
        cloze_paras.append(_process_para(p.get("text", "")))

    with open(_lp(path), "w", encoding="utf-8") as f:
        f.write(f"# Cloze Exercise: {filename}\n\n")
        f.write("*Fill in the blanks based on what you hear.*\n\n---\n\n")
        for p, cloze_text in zip(paragraphs, cloze_paras):
            f.write(f"**[{format_timestamp_transcript(p.get('start', 0.0))}]**\n\n")
            f.write(cloze_text + "\n\n")
        f.write("---\n\n## Answer Key\n\n")
        for bid, word in all_blanks:
            f.write(f"**({bid})** {word}\n")


def generate_shadow_md(filename: str, paragraphs: List[Dict[str, Any]], path: str) -> None:
    """
    Generates a shadowing practice script with prosody annotations without emojis.
    """
    local_nlp = None
    try:
        import spacy
        local_nlp = spacy.load("en_core_web_sm")
    except (ImportError, OSError):
        pass

    stress_pos = {"NOUN", "PROPN", "ADJ", "ADV"}
    skip_aux = {"be", "have", "do", "will", "would", "can", "could", "shall", "should", "may", "might", "must"}

    def _annotate_sentence(sent_text: str) -> str:
        if local_nlp is None:
            intonation = "^" if sent_text.strip().endswith("?") else "v"
            return sent_text.strip() + " " + intonation

        doc = local_nlp(sent_text.strip())
        tokens = []
        for tok in doc:
            if tok.is_space:
                continue
            is_stressed = (
                tok.pos_ in stress_pos
                or (tok.pos_ == "VERB" and tok.dep_ not in {"aux", "auxpass"}
                    and tok.lemma_.lower() not in skip_aux)
            )
            word = tok.text_with_ws.rstrip() if tok.whitespace_ else tok.text
            tokens.append(f"[{tok.text.upper()}]" if is_stressed else word)

        result = " ".join(tokens)
        result = re.sub(r"\s*([,;])\s*", r"\1 | ", result)
        intonation = "^" if sent_text.strip().endswith("?") else "v"
        return result + " " + intonation

    def _annotate_paragraph(text: str) -> str:
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        annotated = [_annotate_sentence(s) for s in sentences if s.strip()]
        return " ||\n".join(annotated)

    with open(_lp(path), "w", encoding="utf-8") as f:
        f.write(f"# Shadowing Script: {filename}\n")
        f.write("*Generated by Hogwarts Audio Transcription Studio*\n\n")
        f.write("## Prosody Legend\n\n")
        f.write("| Symbol | Meaning |\n|---|---|\n")
        f.write("| `[WORD]` | Stressed content word |\n")
        f.write("| `|` | Short pause |\n")
        f.write("| `||` | Long pause between sentences |\n")
        f.write("| `^` | Rising intonation |\n")
        f.write("| `v` | Falling intonation |\n\n---\n\n")

        for i, p in enumerate(paragraphs, 1):
            ts = format_timestamp_transcript(p.get("start", 0.0))
            f.write(f"### [{ts}] Paragraph {i}\n\n")
            annotated = _annotate_paragraph(p.get("text", ""))
            f.write(f"{annotated}\n\n")
            if p.get("translation"):
                f.write(f"> *{p['translation']}*\n\n")
            f.write("---\n\n")
