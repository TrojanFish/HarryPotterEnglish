import os
import sys
import unittest
from unittest.mock import patch, MagicMock

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
STUDIO_ROOT = os.path.dirname(CURRENT_DIR)
if STUDIO_ROOT not in sys.path:
    sys.path.insert(0, STUDIO_ROOT)

from core.translator import (
    google_translate_text,
    gemini_translate_text,
    gemini_translate_batch,
    translate_subtitles,
    get_gemini_api_key
)
from core.suite_exporter import EMOJI_PATTERN


class TestTranslatorModule(unittest.TestCase):
    def test_zero_emojis_in_translator(self):
        translator_file = os.path.join(STUDIO_ROOT, "core", "translator.py")
        with open(translator_file, "r", encoding="utf-8") as f:
            content = f.read()
        matches = EMOJI_PATTERN.findall(content)
        self.assertEqual(len(matches), 0, f"Found emojis in translator.py: {matches}")

    @patch("requests.get")
    def test_google_translate_success(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [[["你好世界", "Hello world"]]]
        mock_get.return_value = mock_resp

        res = google_translate_text("Hello world")
        self.assertEqual(res, "你好世界")

    @patch("requests.post")
    def test_gemini_translate_single_text_success(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{"text": "你好，世界。"}]
                }
            }]
        }
        mock_post.return_value = mock_resp

        res = gemini_translate_text("Hello world.", api_key="fake-gemini-key")
        self.assertEqual(res, "你好，世界。")

    @patch("requests.post")
    def test_gemini_translate_batch_numbered_format(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{
                        "text": "[1] 你好。\n[2] 欢迎来到霍格沃茨。\n[3] 魔法是真实存在的。"
                    }]
                }
            }]
        }
        mock_post.return_value = mock_resp

        texts = ["Hello.", "Welcome to Hogwarts.", "Magic is real."]
        translations = gemini_translate_batch(texts, api_key="fake-gemini-key")

        self.assertEqual(len(translations), 3)
        self.assertEqual(translations[0], "你好。")
        self.assertEqual(translations[1], "欢迎来到霍格沃茨。")
        self.assertEqual(translations[2], "魔法是真实存在的。")

    @patch("time.sleep", return_value=None)
    @patch("requests.post")
    def test_gemini_translate_batch_retry_on_429(self, mock_post, mock_sleep):
        # First call returns 429 Too Many Requests, second call succeeds with 200
        mock_resp_429 = MagicMock()
        mock_resp_429.status_code = 429
        mock_resp_429.text = "RESOURCE_EXHAUSTED"

        mock_resp_200 = MagicMock()
        mock_resp_200.status_code = 200
        mock_resp_200.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{"text": "[1] 你好世界。"}]
                }
            }]
        }

        mock_post.side_effect = [mock_resp_429, mock_resp_200]

        translations = gemini_translate_batch(["Hello world."], api_key="fake-key", max_retries=1)
        self.assertEqual(translations, ["你好世界。"])
        self.assertEqual(mock_post.call_count, 2)

    @patch("time.sleep", return_value=None)
    @patch("requests.get")
    @patch("requests.post")
    def test_gemini_translate_batch_fallback_to_google(self, mock_post, mock_get, mock_sleep):
        # Gemini always fails with 429 or connection error
        mock_resp_429 = MagicMock()
        mock_resp_429.status_code = 429
        mock_resp_429.text = "Quota exceeded"
        mock_post.return_value = mock_resp_429

        # Google translate succeeds
        mock_google_resp = MagicMock()
        mock_google_resp.status_code = 200
        mock_google_resp.json.return_value = [[["谷歌翻译结果", "Hello world"]]]
        mock_get.return_value = mock_google_resp

        translations = gemini_translate_batch(
            ["Hello world"],
            api_key="fake-key",
            fallback_to_google=True
        )

        self.assertEqual(len(translations), 1)
        self.assertEqual(translations[0], "谷歌翻译结果")

    @patch("core.translator.gemini_translate_batch")
    def test_translate_subtitles_gemini_engine(self, mock_batch):
        mock_batch.return_value = ["第一句中文", "第二句中文"]

        cues = [
            {"start": 0.0, "end": 2.0, "text": "First sentence."},
            {"start": 2.0, "end": 4.0, "text": "Second sentence."}
        ]
        result = translate_subtitles(cues, engine="gemini", api_key="fake-gemini-key")

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["translation"], "第一句中文")
        self.assertEqual(result[1]["translation"], "第二句中文")
        mock_batch.assert_called_once()


if __name__ == "__main__":
    unittest.main()
