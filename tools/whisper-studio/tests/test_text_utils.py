import os
import sys
import unittest

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
STUDIO_ROOT = os.path.dirname(CURRENT_DIR)
if STUDIO_ROOT not in sys.path:
    sys.path.insert(0, STUDIO_ROOT)

from core.text_utils import advanced_split, clean_subtitles, _advanced_split_v2_fallback
from core.suite_exporter import EMOJI_PATTERN, format_bilingual_vtt


class DummyWord:
    def __init__(self, word: str, start: float, end: float):
        self.word = word
        self.start = start
        self.end = end


def make_word_objects(text: str, start_time: float = 0.0, word_duration: float = 0.35) -> list:
    words = []
    t = start_time
    for tok in text.strip().split():
        prefix = " " if words else ""
        words.append(DummyWord(prefix + tok, t, t + word_duration * 0.9))
        t += word_duration
    return words


class TestSentenceSplittingAndOrphanMerging(unittest.TestCase):
    def test_zero_emojis_in_text_utils(self):
        text_utils_path = os.path.join(STUDIO_ROOT, "core", "text_utils.py")
        with open(text_utils_path, "r", encoding="utf-8") as f:
            content = f.read()
        matches = EMOJI_PATTERN.findall(content)
        self.assertEqual(len(matches), 0, f"Found emojis in text_utils.py: {matches}")

    def test_advanced_split_prevents_orphan_single_word(self):
        """Verify advanced_split does not leave a trailing 1-word orphan like 'world?'."""
        text = "So, what could the future look like if we harness our technology to create a more sustainable world?"
        words = make_word_objects(text)

        cues = advanced_split(words)
        self.assertGreater(len(cues), 0)

        # Check every cue in result: no cue should be a single orphan word
        for idx, cue in enumerate(cues):
            cue_words = cue["text"].strip().split()
            self.assertGreaterEqual(
                len(cue_words),
                3,
                f"Cue {idx} is an orphan with fewer than 3 words: {repr(cue['text'])}"
            )
            self.assertNotEqual(
                cue["text"].strip(),
                "world?",
                "Subtitle segmentation should never isolate 'world?' as an orphan cue"
            )

    def test_fallback_split_prevents_orphan_single_word(self):
        """Verify heuristic fallback also prevents trailing orphan single words."""
        text = "So, what could the future look like if we harness our technology to create a more sustainable world?"
        words = make_word_objects(text)

        cues = _advanced_split_v2_fallback(words, target_chars=58, max_chars=85)
        self.assertGreater(len(cues), 0)

        for idx, cue in enumerate(cues):
            cue_words = cue["text"].strip().split()
            self.assertGreaterEqual(
                len(cue_words),
                3,
                f"Fallback Cue {idx} is an orphan with fewer than 3 words: {repr(cue['text'])}"
            )

    def test_clean_subtitles_merges_dangling_orphan_cue(self):
        """Verify clean_subtitles merges dangling orphan words into the preceding cue."""
        raw_cues = [
            {
                "start": 336.68,
                "end": 342.06,
                "text": "So, what could the future look like if we harness our technology to create a more sustainable"
            },
            {
                "start": 342.06,
                "end": 342.86,
                "text": "world?"
            }
        ]

        cleaned = clean_subtitles(raw_cues)
        self.assertEqual(len(cleaned), 1, "Orphan 'world?' must be merged into preceding cue")
        self.assertEqual(
            cleaned[0]["text"],
            "So, what could the future look like if we harness our technology to create a more sustainable world?"
        )
        self.assertAlmostEqual(cleaned[0]["start"], 336.68)
        self.assertAlmostEqual(cleaned[0]["end"], 342.86)

    def test_clean_subtitles_merges_multiple_orphan_patterns(self):
        """Verify multiple common orphan patterns (e.g. 'and culture.', 'from leaving.') are merged."""
        raw_cues = [
            {
                "start": 85.67,
                "end": 89.87,
                "text": "reforms that reshaped the country's economy, landscape,"
            },
            {
                "start": 89.95,
                "end": 91.03,
                "text": "and culture."
            },
            {
                "start": 100.21,
                "end": 105.85,
                "text": "They banned foreign traders from entering the country and heavily restricted citizens"
            },
            {
                "start": 105.85,
                "end": 106.81,
                "text": "from leaving."
            }
        ]

        cleaned = clean_subtitles(raw_cues)
        self.assertEqual(len(cleaned), 2, "Both orphan pairs should be merged into 2 complete cues")
        self.assertEqual(
            cleaned[0]["text"],
            "reforms that reshaped the country's economy, landscape, and culture."
        )
        self.assertEqual(
            cleaned[1]["text"],
            "They banned foreign traders from entering the country and heavily restricted citizens from leaving."
        )

    def test_format_bilingual_vtt_merges_unmerged_orphan_cues(self):
        """Verify format_bilingual_vtt provides safety net merging for any orphan cues."""
        cues = [
            {
                "start": 10.0,
                "end": 15.0,
                "text": "We are creating a sustainable",
                "translation": "我们正在创造一个可持续的"
            },
            {
                "start": 15.0,
                "end": 15.8,
                "text": "world.",
                "translation": "世界。"
            }
        ]
        vtt = format_bilingual_vtt(cues)
        self.assertNotIn("world.\n", vtt.replace("We are creating a sustainable world.", ""))
        self.assertIn("We are creating a sustainable world.", vtt)


if __name__ == "__main__":
    unittest.main()
