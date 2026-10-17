import os
import sys
import json
import shutil
import tempfile
import unittest
from unittest.mock import patch, MagicMock

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
STUDIO_ROOT = os.path.dirname(CURRENT_DIR)
if STUDIO_ROOT not in sys.path:
    sys.path.insert(0, STUDIO_ROOT)

import cli
from core.transcriber import Transcriber
from core.translator import translate_subtitles
from core.text_utils import clean_subtitles, compute_wpm, estimate_cefr, advanced_split


class TestCliArgumentValidation(unittest.TestCase):
    def test_missing_all_args(self):
        with self.assertRaises(SystemExit) as cm:
            cli.main([])
        self.assertNotEqual(cm.exception.code, 0)

    def test_missing_type(self):
        with self.assertRaises(SystemExit) as cm:
            cli.main(["--input", "sample.mp4", "--id", "test-item"])
        self.assertNotEqual(cm.exception.code, 0)

    def test_missing_input(self):
        with self.assertRaises(SystemExit) as cm:
            cli.main(["--type", "ted", "--id", "test-item"])
        self.assertNotEqual(cm.exception.code, 0)

    def test_missing_id(self):
        with self.assertRaises(SystemExit) as cm:
            cli.main(["--input", "sample.mp4", "--type", "ted"])
        self.assertNotEqual(cm.exception.code, 0)

    def test_invalid_type(self):
        with self.assertRaises(SystemExit) as cm:
            cli.main(["--input", "sample.mp4", "--type", "movie", "--id", "test-item"])
        self.assertNotEqual(cm.exception.code, 0)


class TestCliEndToEndMock(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp(prefix="whisper-cli-test-")
        self.content_root = os.path.join(self.tmp_dir, "content")
        os.makedirs(self.content_root, exist_ok=True)

        self.dummy_video = os.path.join(self.tmp_dir, "dummy_talk.mp4")
        with open(self.dummy_video, "wb") as f:
            f.write(b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42")

        self.dummy_audio = os.path.join(self.tmp_dir, "dummy_podcast.mp3")
        with open(self.dummy_audio, "wb") as f:
            f.write(b"ID3\x03\x00\x00\x00\x00\x00#dummy_audio_bytes")

    def tearDown(self):
        if os.path.exists(self.tmp_dir):
            shutil.rmtree(self.tmp_dir, ignore_errors=True)

    def test_cli_ted_export_mock(self):
        args = [
            "--input", self.dummy_video,
            "--type", "ted",
            "--id", "spells-and-magic",
            "--title", "Spells and Magic in Hogwarts",
            "--speaker", "Hermione Granger",
            "--content-root", self.content_root,
            "--mock",
            "--translate", "none"
        ]

        exit_code = cli.main(args)
        self.assertEqual(exit_code, 0)

        item_dir = os.path.join(self.content_root, "ted", "spells-and-magic")
        self.assertTrue(os.path.isdir(item_dir))

        video_path = os.path.join(item_dir, "video.mp4")
        self.assertTrue(os.path.isfile(video_path))

        vtt_path = os.path.join(item_dir, "subtitle.vtt")
        self.assertTrue(os.path.isfile(vtt_path))
        with open(vtt_path, "r", encoding="utf-8") as f:
            vtt_content = f.read()
        self.assertIn("WEBVTT - Hogwarts Audio Bilingual Subtitles", vtt_content)

        meta_path = os.path.join(item_dir, "meta.json")
        self.assertTrue(os.path.isfile(meta_path))
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        self.assertEqual(meta["id"], "spells-and-magic")
        self.assertEqual(meta["title"], "Spells and Magic in Hogwarts")
        self.assertEqual(meta["speaker"], "Hermione Granger")

    def test_cli_podcast_export_mock(self):
        args = [
            "--input", self.dummy_audio,
            "--type", "podcast",
            "--id", "hp-book-1",
            "--chapter", "2",
            "--title", "The Vanishing Glass",
            "--author", "J.K. Rowling",
            "--narrator", "Stephen Fry",
            "--content-root", self.content_root,
            "--mock",
            "--translate", "none"
        ]

        exit_code = cli.main(args)
        self.assertEqual(exit_code, 0)

        ep_dir = os.path.join(self.content_root, "podcasts", "hp-book-1", "episodes", "ep02")
        self.assertTrue(os.path.isdir(ep_dir))

        audio_path = os.path.join(ep_dir, "audio.mp3")
        self.assertTrue(os.path.isfile(audio_path))

        vtt_path = os.path.join(ep_dir, "subtitles.vtt")
        self.assertTrue(os.path.isfile(vtt_path))
        with open(vtt_path, "r", encoding="utf-8") as f:
            vtt_content = f.read()
        self.assertIn("WEBVTT - Hogwarts Audio Bilingual Subtitles", vtt_content)

        ep_meta_path = os.path.join(ep_dir, "meta.json")
        self.assertTrue(os.path.isfile(ep_meta_path))
        with open(ep_meta_path, "r", encoding="utf-8") as f:
            ep_meta = json.load(f)
        self.assertEqual(ep_meta["chapter"], 2)
        self.assertEqual(ep_meta["title"], "The Vanishing Glass")

        series_meta_path = os.path.join(self.content_root, "podcasts", "hp-book-1", "meta.json")
        self.assertTrue(os.path.isfile(series_meta_path))
        with open(series_meta_path, "r", encoding="utf-8") as f:
            series_meta = json.load(f)
        self.assertEqual(series_meta["author"], "J.K. Rowling")
        self.assertEqual(series_meta["narrator"], "Stephen Fry")


class TestTranscriber(unittest.TestCase):
    def test_mock_transcribe_default(self):
        t = Transcriber(mock_mode=True)
        cues = t.transcribe("sample.mp3")
        self.assertIsInstance(cues, list)
        self.assertGreater(len(cues), 0)
        self.assertIn("start", cues[0])
        self.assertIn("end", cues[0])
        self.assertIn("text", cues[0])

    def test_mock_transcribe_with_custom_mock_data(self):
        t = Transcriber(mock_mode=True)
        custom_data = [
            {"start": 1.0, "end": 4.0, "text": "A custom mock sentence."}
        ]
        cues = t.transcribe("sample.mp3", mock_data=custom_data)
        self.assertEqual(len(cues), 1)
        self.assertEqual(cues[0]["text"], "A custom mock sentence.")


class TestTranslator(unittest.TestCase):
    def test_translate_none_engine(self):
        cues = [{"start": 0.0, "end": 2.0, "text": "Hello world."}]
        result = translate_subtitles(cues, engine="none")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["text"], "Hello world.")
        self.assertEqual(result[0].get("translation", ""), "")

    @patch("requests.get")
    def test_translate_google_engine(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [[["你好世界。", "Hello world."]]]
        mock_get.return_value = mock_resp

        cues = [{"start": 0.0, "end": 2.0, "text": "Hello world."}]
        result = translate_subtitles(cues, engine="google")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["translation"], "你好世界。")


class TestTextUtils(unittest.TestCase):
    def test_clean_subtitles_hallucination_removal(self):
        raw = [
            {"start": 0.0, "end": 2.0, "text": "Thank you for watching"},
            {"start": 2.0, "end": 5.0, "text": "Real dialogue that is important."}
        ]
        cleaned = clean_subtitles(raw)
        self.assertEqual(len(cleaned), 1)
        self.assertEqual(cleaned[0]["text"], "Real dialogue that is important.")

    def test_compute_wpm(self):
        cues = [
            {"start": 0.0, "end": 60.0, "text": "One two three four five six seven eight nine ten."}
        ]
        wpm = compute_wpm(cues)
        self.assertEqual(wpm, 10)

    def test_estimate_cefr(self):
        text = "This is a simple sentence. We like learning English."
        level, grade, desc = estimate_cefr(text)
        self.assertIn(level, ["A2", "B1", "B2", "C1", "C2"])
        self.assertIsInstance(grade, float)


if __name__ == "__main__":
    unittest.main()
