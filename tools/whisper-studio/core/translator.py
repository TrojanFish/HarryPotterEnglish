import os
import re
import json
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any, Optional

import requests

logger = logging.getLogger("whisper_translator")

_API_KEYS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "api_keys.json")


def _get_api_key(name: str) -> str:
    """Safely retrieves API key from environment or local api_keys.json."""
    env_key = os.environ.get(f"{name.upper()}_API_KEY", "")
    if env_key:
        return env_key.strip()

    if os.path.exists(_API_KEYS_FILE):
        try:
            with open(_API_KEYS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return str(data.get(name.lower(), "")).strip()
        except Exception:
            pass
    return ""


def google_translate_text(text: str, target_lang: str = "zh-CN", timeout: int = 10) -> str:
    """Translates single text using Google Translate GTX endpoint."""
    text = text.strip()
    if not text:
        return ""

    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": "en",
        "tl": target_lang,
        "dt": "t",
        "q": text
    }
    try:
        response = requests.get(url, params=params, timeout=timeout)
        if response.status_code == 200:
            result = response.json()
            if result and isinstance(result, list) and len(result) > 0 and isinstance(result[0], list):
                return "".join([s[0] for s in result[0] if s and len(s) > 0 and s[0]])
    except Exception as exc:
        logger.warning(f"[WARN] Google translation failed for text '{text[:30]}...': {str(exc)}")
    return ""


def get_gemini_api_key() -> str:
    """Returns detected Gemini API key from environment or api_keys.json."""
    return _get_api_key("gemini")


def gemini_translate_text(
    text: str,
    target_lang: str = "zh-CN",
    timeout: int = 15,
    api_key: Optional[str] = None
) -> str:
    """Translates single text using Google Gemini API endpoint."""
    text = text.strip()
    if not text:
        return ""

    resolved_key = (api_key or "").strip() or _get_api_key("gemini")
    if not resolved_key:
        logger.warning("[WARN] GEMINI_API_KEY is not set. Falling back to Google translate.")
        return google_translate_text(text, target_lang=target_lang, timeout=timeout)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={resolved_key}"
    payload = {
        "contents": [{
            "parts": [{
                "text": f"Translate the following English subtitle text into natural Simplified Chinese. Output ONLY the translation without any notes or explanations:\n{text}"
            }]
        }]
    }

    try:
        response = requests.post(url, json=payload, timeout=timeout)
        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
        else:
            logger.warning(f"[WARN] Gemini translation returned HTTP {response.status_code}: {response.text[:100]}")
    except Exception as exc:
        logger.warning(f"[WARN] Gemini translation failed for text '{text[:30]}...': {str(exc)}")

    return google_translate_text(text, target_lang=target_lang, timeout=timeout)


_NUMBERED_LINE_RE = re.compile(r"^\[?(\d+)\]?[\.\:\s\-\)]\s*(.*)$")


def _parse_gemini_batch_response(raw_text: str, expected_count: int) -> Dict[int, str]:
    """
    Parses numbered translations from Gemini model response.
    Supports formats like:
      [1] 你好
      1. 你好
      1) 你好
    """
    parsed: Dict[int, str] = {}
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    for line in lines:
        # Strip potential markdown bold / bullet formatting
        clean_line = re.sub(r"^[\*\-\•]\s*", "", line).strip()
        match = _NUMBERED_LINE_RE.match(clean_line)
        if match:
            idx = int(match.group(1))
            val = match.group(2).strip()
            # Remove enclosing quotes if model wrapped translation
            if len(val) >= 2 and ((val[0] == '"' and val[-1] == '"') or (val[0] == '“' and val[-1] == '”')):
                val = val[1:-1].strip()
            parsed[idx] = val

    return parsed


def gemini_translate_batch(
    texts: List[str],
    api_key: Optional[str] = None,
    target_lang: str = "zh-CN",
    batch_size: int = 25,
    timeout: int = 30,
    max_retries: int = 2,
    fallback_to_google: bool = True
) -> List[str]:
    """
    Translates a list of texts in semantic chunks using Gemini API.
    Reduces total API requests by ~25x to avoid 15 RPM rate limits.
    Includes exponential backoff on 429 and graceful fallback to Google Translate.
    """
    if not texts:
        return []

    resolved_key = (api_key or "").strip() or _get_api_key("gemini")
    all_translations: List[str] = []

    # If no Gemini API key is available, fallback or empty
    if not resolved_key:
        if fallback_to_google:
            logger.warning("[WARN] GEMINI_API_KEY 未设置，自动无缝降级至 Google 翻译保障双语字幕。")
            with ThreadPoolExecutor(max_workers=5) as executor:
                return list(executor.map(lambda t: google_translate_text(t, target_lang=target_lang), texts))
        return ["" for _ in texts]

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={resolved_key}"

    # Process in batches
    for i in range(0, len(texts), batch_size):
        chunk = texts[i:i + batch_size]
        numbered_lines = "\n".join([f"[{idx + 1}] {t}" for idx, t in enumerate(chunk)])

        prompt = (
            "You are a professional subtitle translator for English learning materials.\n"
            "Translate each of the following numbered English subtitle lines into natural, concise Simplified Chinese.\n"
            "Preserve the exact line numbering. Output ONLY the numbered translations without notes, explanations, or code blocks.\n\n"
            "Format:\n"
            "[ID] Translated Text\n\n"
            f"Lines to translate:\n{numbered_lines}"
        )

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.2
            }
        }

        chunk_success = False
        parsed_map: Dict[int, str] = {}

        for attempt in range(max_retries + 1):
            try:
                response = requests.post(url, json=payload, timeout=timeout)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            raw_out = parts[0].get("text", "")
                            parsed_map = _parse_gemini_batch_response(raw_out, len(chunk))
                            chunk_success = True
                            break
                elif response.status_code == 429:
                    logger.warning(
                        f"[WARN] Gemini API 触发 429 速率限制 (第 {attempt + 1}/{max_retries + 1} 次)。"
                        f"等待重试..."
                    )
                    time.sleep(2.0 * (attempt + 1))
                else:
                    logger.warning(
                        f"[WARN] Gemini API 请求失败 HTTP {response.status_code}: {response.text[:120]}"
                    )
                    time.sleep(1.0)
            except Exception as exc:
                logger.warning(f"[WARN] Gemini 请求异常 (尝试 {attempt + 1}): {str(exc)}")
                time.sleep(1.0)

        # Assemble chunk results
        for idx_in_chunk, orig_text in enumerate(chunk, start=1):
            if not orig_text.strip():
                all_translations.append("")
                continue

            trans = parsed_map.get(idx_in_chunk, "").strip()
            if not trans and fallback_to_google:
                # If model missed this line or batch failed, fallback to Google
                trans = google_translate_text(orig_text, target_lang=target_lang)

            all_translations.append(trans)

    return all_translations


def translate_subtitles(
    cues: List[Dict[str, Any]],
    engine: str = "google",
    api_key: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Translates English text in each cue into Chinese translation field.
    Returns list of {'start': float, 'end': float, 'text': str, 'translation': str}
    """
    if not cues:
        return []

    engine_clean = str(engine).strip().lower()

    # Create shallow copy of cues with translation field guaranteed
    result_cues: List[Dict[str, Any]] = []
    for c in cues:
        new_cue = dict(c)
        if "translation" not in new_cue:
            new_cue["translation"] = ""
        result_cues.append(new_cue)

    if engine_clean in ("none", "skip", "false", ""):
        return result_cues

    # Separate items that need translation
    indices_to_translate = [
        idx for idx, cue in enumerate(result_cues)
        if cue.get("text", "").strip() and not cue.get("translation")
    ]

    if not indices_to_translate:
        return result_cues

    texts_to_translate = [result_cues[idx]["text"] for idx in indices_to_translate]

    if "gemini" in engine_clean:
        translations = gemini_translate_batch(
            texts_to_translate,
            api_key=api_key,
            fallback_to_google=True
        )
        for idx, trans in zip(indices_to_translate, translations):
            if trans:
                result_cues[idx]["translation"] = trans
    else:
        # Concurrent Google Translate
        def _translate_item(item_text: str) -> str:
            return google_translate_text(item_text)

        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_idx = {
                executor.submit(_translate_item, result_cues[idx].get("text", "")): idx
                for idx in indices_to_translate
            }

            for future in as_completed(future_to_idx):
                idx = future_to_idx[future]
                try:
                    trans = future.result()
                    if trans:
                        result_cues[idx]["translation"] = trans
                except Exception as exc:
                    logger.warning(f"[WARN] Google translation failed at cue {idx}: {str(exc)}")

    return result_cues
