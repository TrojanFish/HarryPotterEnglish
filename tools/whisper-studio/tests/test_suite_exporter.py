import os
import sys
import shutil
import tempfile
import unittest
import json

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
STUDIO_ROOT = os.path.dirname(CURRENT_DIR)
if STUDIO_ROOT not in sys.path:
    sys.path.insert(0, STUDIO_ROOT)

from core.suite_exporter import format_bilingual_vtt, strip_emojis, export_hogwarts_suite


class TestFormatBilingualVtt(unittest.TestCase):
    def test_header_and_basic_cues(self):
        cues = [
            {
                "start": 0.0,
                "end": 4.5,
                "text": "Welcome to Hogwarts.",
                "translation": "欢迎来到霍格沃茨。"
            },
            {
                "start": 4.5,
                "end": 8.2,
                "text": "Magic is real here.",
                "translation": "魔法在这里是真实的。"
            }
        ]
        vtt = format_bilingual_vtt(cues)
        self.assertTrue(vtt.startswith("WEBVTT - Hogwarts Audio Bilingual Subtitles\n\n"))
        self.assertIn("00:00.000 --> 00:04.500", vtt)
        self.assertIn("Welcome to Hogwarts.\n欢迎来到霍格沃茨。", vtt)
        self.assertIn("00:04.500 --> 00:08.200", vtt)
        self.assertIn("Magic is real here.\n魔法在这里是真实的。", vtt)

    def test_timestamp_formatting_under_hour(self):
        cues = [{"start": 65.5, "end": 70.0, "text": "Test", "translation": "测试"}]
        vtt = format_bilingual_vtt(cues)
        self.assertIn("01:05.500 --> 01:10.000", vtt)

    def test_timestamp_formatting_over_hour(self):
        cues = [{"start": 3665.25, "end": 3670.8, "text": "Test", "translation": "测试"}]
        vtt = format_bilingual_vtt(cues)
        self.assertIn("01:01:05.250 --> 01:01:10.800", vtt)

    def test_timestamp_formatting_rollover(self):
        cues = [{"start": 59.9996, "end": 60.5, "text": "Rollover", "translation": "进位"}]
        vtt = format_bilingual_vtt(cues)
        self.assertIn("01:00.000 --> 01:00.800", vtt)

    def test_minimum_duration_enforced(self):
        # Duration is only 0.2s, must be extended to at least 0.8s
        cues = [{"start": 1.0, "end": 1.2, "text": "Quick", "translation": "快"}]
        vtt = format_bilingual_vtt(cues)
        self.assertIn("00:01.000 --> 00:01.800", vtt)

    def test_emoji_stripping_in_subtitles(self):
        cues = [
            {
                "start": 0.0,
                "end": 3.0,
                "text": "Harry Potter \U0001F9D9\u200D\u2642\uFE0F and the Wand \u2728",
                "translation": "哈利波特 \U0001F3F0 与魔杖 \u26A1"
            }
        ]
        vtt = format_bilingual_vtt(cues)
        self.assertIn("Harry Potter and the Wand\n哈利波特 与魔杖", vtt)
        self.assertNotIn("\U0001F9D9", vtt)
        self.assertNotIn("\u2728", vtt)
        self.assertNotIn("\U0001F3F0", vtt)
        self.assertNotIn("\u26A1", vtt)

    def test_empty_cues(self):
        vtt = format_bilingual_vtt([])
        self.assertEqual(vtt.strip(), "WEBVTT - Hogwarts Audio Bilingual Subtitles")

    def test_cue_without_translation(self):
        cues = [{"start": 0.0, "end": 2.0, "text": "English only sentence."}]
        vtt = format_bilingual_vtt(cues)
        self.assertIn("00:00.000 --> 00:02.000\nEnglish only sentence.", vtt)


class TestStripEmojis(unittest.TestCase):
    def test_strips_emojis_and_preserves_text(self):
        raw = "Welcome \U0001F389 to Hogwarts \U0001F3F0! It \'s great \u2728"
        cleaned = strip_emojis(raw)
        self.assertEqual(cleaned, "Welcome to Hogwarts! It's great")

    def test_chinese_text_preservation(self):
        raw = "霍格沃茨魔法学校 \U0001F9D9 城堡 \U0001F3F0 礼堂！"
        cleaned = strip_emojis(raw)
        self.assertEqual(cleaned, "霍格沃茨魔法学校 城堡 礼堂！")


class TestExportHogwartsSuite(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp(prefix="hogwarts-suite-test-")
        self.content_root = os.path.join(self.tmp_dir, "content")
        os.makedirs(self.content_root, exist_ok=True)

        # Mock media files
        self.mock_video = os.path.join(self.tmp_dir, "sample_talk.mp4")
        with open(self.mock_video, "wb") as f:
            f.write(b"MOCK_MP4_DATA")

        self.mock_webm = os.path.join(self.tmp_dir, "sample_talk.webm")
        with open(self.mock_webm, "wb") as f:
            f.write(b"MOCK_WEBM_DATA")

        self.mock_audio = os.path.join(self.tmp_dir, "sample_audio.mp3")
        with open(self.mock_audio, "wb") as f:
            f.write(b"MOCK_MP3_DATA")

        self.mock_m4a = os.path.join(self.tmp_dir, "sample_audio.m4a")
        with open(self.mock_m4a, "wb") as f:
            f.write(b"MOCK_M4A_DATA")

        self.sample_cues = [
            {"start": 0.0, "end": 4.0, "text": "Welcome to Hogwarts.", "translation": "欢迎来到霍格沃茨。"},
            {"start": 4.0, "end": 9.5, "text": "Here is magic.", "translation": "这是魔法。"}
        ]

    def tearDown(self):
        shutil.rmtree(self.tmp_dir, ignore_errors=True)

    def test_export_ted_talk_standard(self):
        meta_info = {
            "type": "ted",
            "id": "how-magic-works",
            "title": "How Magic Works",
            "speaker": "Albus Dumbledore",
            "year": 2024,
            "difficulty": "Intermediate",
            "cefrLevel": "B2",
            "topic": "Magic Theory",
            "description": "An introduction to magic."
        }
        result = export_hogwarts_suite(
            media_path=self.mock_video,
            subtitles=self.sample_cues,
            meta_info=meta_info,
            content_root=self.content_root,
            recompile_feed=False
        )

        self.assertTrue(result["success"])
        self.assertEqual(len(result["errors"]), 0)
        target_dir = os.path.join(self.content_root, "ted", "how-magic-works")
        self.assertEqual(result["target_dir"], target_dir)

        # Check files exist
        video_path = os.path.join(target_dir, "video.mp4")
        vtt_path = os.path.join(target_dir, "subtitle.vtt")
        meta_path = os.path.join(target_dir, "meta.json")
        self.assertTrue(os.path.exists(video_path))
        self.assertTrue(os.path.exists(vtt_path))
        self.assertTrue(os.path.exists(meta_path))

        # Check meta.json schema
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        self.assertEqual(meta["id"], "how-magic-works")
        self.assertEqual(meta["title"], "How Magic Works")
        self.assertEqual(meta["speaker"], "Albus Dumbledore")
        self.assertEqual(meta["year"], 2024)
        self.assertEqual(meta["difficulty"], "Intermediate")
        self.assertEqual(meta["cefrLevel"], "B2")
        self.assertEqual(meta["topic"], "Magic Theory")
        self.assertEqual(meta["description"], "An introduction to magic.")
        self.assertGreater(meta["duration"], 0)
        self.assertGreater(meta["wpm"], 0)

        # Check VTT content
        with open(vtt_path, "r", encoding="utf-8") as f:
            vtt = f.read()
        self.assertTrue(vtt.startswith("WEBVTT - Hogwarts Audio Bilingual Subtitles"))
        self.assertIn("Welcome to Hogwarts.", vtt)

    def test_export_ted_talk_webm_preserved(self):
        meta_info = {
            "type": "ted",
            "id": "webm-lecture"
        }
        result = export_hogwarts_suite(
            media_path=self.mock_webm,
            subtitles=self.sample_cues,
            meta_info=meta_info,
            content_root=self.content_root,
            recompile_feed=False
        )
        self.assertTrue(result["success"])
        webm_path = os.path.join(result["target_dir"], "video.webm")
        self.assertTrue(os.path.exists(webm_path))

    def test_ted_overwrite_protection(self):
        meta_info = {"type": "ted", "id": "protected-talk"}
        first = export_hogwarts_suite(
            self.mock_video, self.sample_cues, meta_info, self.content_root, recompile_feed=False
        )
        self.assertTrue(first["success"])

        # Second without force fails safely
        second = export_hogwarts_suite(
            self.mock_video, self.sample_cues, meta_info, self.content_root, recompile_feed=False, force=False
        )
        self.assertFalse(second["success"])
        self.assertTrue(any("already exists" in err for err in second["errors"]))

        # Third with force succeeds
        third = export_hogwarts_suite(
            self.mock_video, self.sample_cues, meta_info, self.content_root, recompile_feed=False, force=True
        )
        self.assertTrue(third["success"])

    def test_export_podcast_standard(self):
        meta_info = {
            "type": "podcast",
            "id": "hp-book-1",
            "title": "The Boy Who Lived",
            "chapter": 1,
            "author": "J.K. Rowling",
            "narrator": "Stephen Fry"
        }
        result = export_hogwarts_suite(
            media_path=self.mock_audio,
            subtitles=self.sample_cues,
            meta_info=meta_info,
            content_root=self.content_root,
            recompile_feed=False
        )

        self.assertTrue(result["success"])
        target_dir = os.path.join(self.content_root, "podcasts", "hp-book-1", "episodes", "ep01")
        self.assertEqual(result["target_dir"], target_dir)

        audio_path = os.path.join(target_dir, "audio.mp3")
        vtt_path = os.path.join(target_dir, "subtitles.vtt")
        ep_meta_path = os.path.join(target_dir, "meta.json")
        series_meta_path = os.path.join(self.content_root, "podcasts", "hp-book-1", "meta.json")

        self.assertTrue(os.path.exists(audio_path))
        self.assertTrue(os.path.exists(vtt_path))
        self.assertTrue(os.path.exists(ep_meta_path))
        self.assertTrue(os.path.exists(series_meta_path))

        with open(ep_meta_path, "r", encoding="utf-8") as f:
            ep_meta = json.load(f)
        self.assertEqual(ep_meta["chapter"], 1)
        self.assertEqual(ep_meta["audio"], "audio.mp3")
        self.assertEqual(ep_meta["vtt"], "subtitles.vtt")

        with open(series_meta_path, "r", encoding="utf-8") as f:
            series_meta = json.load(f)
        self.assertEqual(series_meta["id"], "hp-book-1")
        self.assertEqual(series_meta["author"], "J.K. Rowling")
        self.assertEqual(series_meta["narrator"], "Stephen Fry")

    def test_export_podcast_multi_chapter_zero_padded(self):
        meta_info = {
            "type": "podcast",
            "id": "hp-book-2",
            "chapter": 7,
            "title": "Mudbloods and Murmurs"
        }
        result = export_hogwarts_suite(
            media_path=self.mock_audio,
            subtitles=self.sample_cues,
            meta_info=meta_info,
            content_root=self.content_root,
            recompile_feed=False
        )
        self.assertTrue(result["success"])
        target_dir = os.path.join(self.content_root, "podcasts", "hp-book-2", "episodes", "ep07")
        self.assertEqual(result["target_dir"], target_dir)
        self.assertTrue(os.path.exists(os.path.join(target_dir, "audio.mp3")))

    def test_export_podcast_m4a_preserved(self):
        meta_info = {
            "type": "podcast",
            "id": "hp-book-3",
            "chapter": 2
        }
        result = export_hogwarts_suite(
            media_path=self.mock_m4a,
            subtitles=self.sample_cues,
            meta_info=meta_info,
            content_root=self.content_root,
            recompile_feed=False
        )
        self.assertTrue(result["success"])
        m4a_path = os.path.join(result["target_dir"], "audio.m4a")
        self.assertTrue(os.path.exists(m4a_path))

    def test_validation_errors(self):
        # Missing media
        res1 = export_hogwarts_suite(
            "nonexistent.mp4", self.sample_cues, {"type": "ted", "id": "t1"}, self.content_root, recompile_feed=False
        )
        self.assertFalse(res1["success"])
        self.assertTrue(any("not found" in e for e in res1["errors"]))

        # Invalid type
        res2 = export_hogwarts_suite(
            self.mock_video, self.sample_cues, {"type": "invalid", "id": "t1"}, self.content_root, recompile_feed=False
        )
        self.assertFalse(res2["success"])
        self.assertTrue(any("type" in e for e in res2["errors"]))

        # Invalid ID
        res3 = export_hogwarts_suite(
            self.mock_video, self.sample_cues, {"type": "ted", "id": "../bad/id"}, self.content_root, recompile_feed=False
        )
        self.assertFalse(res3["success"])
        self.assertTrue(any("ID" in e or "slug" in e for e in res3["errors"]))

    def test_recompile_feed_execution(self):
        meta_info = {
            "type": "ted",
            "id": "ted-compiled-test",
            "title": "Compiled Test",
            "speaker": "Minerva McGonagall"
        }
        res = export_hogwarts_suite(
            self.mock_video, self.sample_cues, meta_info, self.content_root, recompile_feed=True
        )
        self.assertTrue(res["success"], f"Export failed: {res.get('errors')}")
        feed_path = os.path.join(self.content_root, "feed.json")
        self.assertTrue(os.path.exists(feed_path), "feed.json was not generated by recompile_feed")
        with open(feed_path, "r", encoding="utf-8") as f:
            feed_data = json.load(f)
        self.assertEqual(feed_data["stats"]["tedTalksCount"], 1)


if __name__ == "__main__":
    unittest.main()
