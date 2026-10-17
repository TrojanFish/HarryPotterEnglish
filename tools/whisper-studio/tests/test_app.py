import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
STUDIO_ROOT = os.path.dirname(CURRENT_DIR)
PROJECT_ROOT = os.path.dirname(STUDIO_ROOT)
if STUDIO_ROOT not in sys.path:
    sys.path.insert(0, STUDIO_ROOT)

from core.suite_exporter import EMOJI_PATTERN

# Setup headless mock gradio if gradio is not installed in current environment
try:
    import gradio as gr
except ImportError:
    import types

    mock_gr = types.ModuleType("gradio")

    class MockComponent:
        def __init__(self, *args, **kwargs):
            self.args = args
            self.kwargs = kwargs
            self.value = kwargs.get("value", "")

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            return False

        def click(self, *args, **kwargs):
            return self

        def change(self, *args, **kwargs):
            return self

        def upload(self, *args, **kwargs):
            return self

        def select(self, *args, **kwargs):
            return self

        def launch(self, *args, **kwargs):
            return self

    class MockBlocks(MockComponent):
        pass

    mock_gr.Blocks = MockBlocks
    mock_gr.Row = MockComponent
    mock_gr.Column = MockComponent
    mock_gr.Tabs = MockComponent
    mock_gr.Tab = MockComponent
    mock_gr.TabItem = MockComponent
    mock_gr.Markdown = MockComponent
    mock_gr.HTML = MockComponent
    mock_gr.File = MockComponent
    mock_gr.Radio = MockComponent
    mock_gr.Textbox = MockComponent
    mock_gr.Number = MockComponent
    mock_gr.Dropdown = MockComponent
    mock_gr.Checkbox = MockComponent
    mock_gr.Button = MockComponent
    mock_gr.update = lambda **kwargs: kwargs

    sys.modules["gradio"] = mock_gr
    import gradio as gr


class TestAppModule(unittest.TestCase):
    def test_legacy_modules_not_imported(self):
        """Verify app.py does not import deprecated logic.py or legacy scripts."""
        app_path = os.path.join(STUDIO_ROOT, "app.py")
        with open(app_path, "r", encoding="utf-8") as f:
            content = f.read()

        deprecated = ["from logic import", "import logic", "ollama_utils", "pdf_utils", "anki_utils", "ass_utils"]
        for dep in deprecated:
            self.assertNotIn(dep, content, f"app.py should not import deprecated module: {dep}")

    def test_zero_unicode_emojis_in_app_source(self):
        """Verify zero unicode emojis exist in app.py source code."""
        app_path = os.path.join(STUDIO_ROOT, "app.py")
        with open(app_path, "r", encoding="utf-8") as f:
            content = f.read()

        matches = EMOJI_PATTERN.findall(content)
        self.assertEqual(len(matches), 0, f"Found emojis in app.py: {matches}")

    def test_build_ui_returns_blocks(self):
        """Verify build_ui returns a valid Gradio Blocks instance."""
        import app
        self.assertTrue(hasattr(app, "build_ui"), "app.py must expose build_ui()")
        demo = app.build_ui()
        self.assertIsInstance(demo, gr.Blocks)

    def test_detect_device_format(self):
        """Verify detect_device returns clean text badges without emojis."""
        import app
        self.assertTrue(hasattr(app, "detect_device"), "app.py must expose detect_device()")
        device, badge = app.detect_device()
        self.assertIn(device, ["cuda", "cpu"])
        self.assertTrue(badge.startswith("[") and badge.endswith("]"), f"Badge should be bracketed text: {badge}")
        self.assertIsNone(EMOJI_PATTERN.search(badge), f"Badge should contain no emojis: {badge}")

    def test_derive_id_and_title(self):
        """Verify derive_id and derive_title functions produce clean strings."""
        import app
        content_id = app.derive_id("Harry Potter 01 - The Boy Who Lived.mp3")
        self.assertEqual(content_id, "harry-potter-01-the-boy-who-lived")

        title = app.derive_title("harry-potter-01-the-boy-who-lived.mp4")
        self.assertEqual(title, "Harry Potter 01 The Boy Who Lived")

    def test_scan_batch_folder(self):
        """Verify scan_batch_folder scans directories and returns clean text logs."""
        import app
        with tempfile.TemporaryDirectory() as tmp_dir:
            # Empty folder
            msg = app.scan_batch_folder(tmp_dir)
            self.assertIn("[INFO]", msg)
            self.assertIn("0", msg)

            # Create media files
            f1 = os.path.join(tmp_dir, "talk1.mp4")
            f2 = os.path.join(tmp_dir, "talk2.mp3")
            f3 = os.path.join(tmp_dir, "notes.txt")
            open(f1, "w").close()
            open(f2, "w").close()
            open(f3, "w").close()

            msg = app.scan_batch_folder(tmp_dir)
            self.assertIn("[INFO]", msg)
            self.assertIn("2", msg)
            self.assertNotIn("❌", msg)
            self.assertNotIn("⚠️", msg)

    def test_transcribe_and_export_single_mock(self):
        """Verify single file workflow completes successfully in mock mode."""
        import app
        with tempfile.TemporaryDirectory() as tmp_dir:
            content_root = os.path.join(tmp_dir, "content")
            dummy_media = os.path.join(tmp_dir, "sample_talk.mp4")
            with open(dummy_media, "wb") as f:
                f.write(b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42")

            log_output, summary_output = app.transcribe_and_export_single(
                media_file=dummy_media,
                target_type="ted",
                content_id="sample-talk",
                title="Sample Talk",
                speaker="Albus Dumbledore",
                chapter=1,
                author="J.K. Rowling",
                narrator="Stephen Fry",
                model_size="deepdml/faster-whisper-large-v3-turbo-ct2",
                compute_type="int8",
                translation_engine="none",
                force_overwrite=True,
                mock_mode=True,
                content_root=content_root
            )

            self.assertIn("[INFO]", log_output)
            self.assertIn("[SUCCESS]", summary_output)
            self.assertIn("subtitle.vtt", summary_output)
            self.assertNotIn("❌", log_output)
            self.assertNotIn("✅", summary_output)


if __name__ == "__main__":
    unittest.main()
