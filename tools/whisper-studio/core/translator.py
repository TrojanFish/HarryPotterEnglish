import os
import json
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


def gemini_translate_text(text: str, target_lang: str = "zh-CN", timeout: int = 15) -> str:
    """Translates single text using Google Gemini API endpoint."""
    text = text.strip()
    if not text:
        return ""

    api_key = _get_api_key("gemini")
    if not api_key:
        logger.warning("[WARN] GEMINI_API_KEY is not set. Falling back to empty translation.")
        return ""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
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
    except Exception as exc:
        logger.warning(f"[WARN] Gemini translation failed for text '{text[:30]}...': {str(exc)}")
    return ""


def translate_subtitles(cues: List[Dict[str, Any]], engine: str = "google") -> List[Dict[str, Any]]:
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

    # Batch translation function
    def _translate_item(item_text: str) -> str:
        if engine_clean == "gemini":
            return gemini_translate_text(item_text)
        else:
            return google_translate_text(item_text)

    # Parallelize translation requests across cues
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_idx = {
            executor.submit(_translate_item, cue.get("text", "")): idx
            for idx, cue in enumerate(result_cues)
            if cue.get("text", "").strip() and not cue.get("translation")
        }

        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                trans = future.result()
                if trans:
                    result_cues[idx]["translation"] = trans
            except Exception as exc:
                logger.warning(f"[WARN] Worker translation failed at cue {idx}: {str(exc)}")

    return result_cues
