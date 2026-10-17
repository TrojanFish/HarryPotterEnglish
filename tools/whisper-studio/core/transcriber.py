import os
import logging
from typing import List, Dict, Any, Optional

from core.text_utils import advanced_split, clean_subtitles

logger = logging.getLogger("whisper_transcriber")

DEFAULT_MODEL_SIZE = "deepdml/faster-whisper-large-v3-turbo-ct2"


class Transcriber:
    """
    Audio transcription pipeline wrapper.
    Integrates faster-whisper, Spacy syntactic splitting, and hallucination pruning.
    Supports mock mode for rapid CI and unit testing without downloading 1GB model weights.
    """

    def __init__(
        self,
        model_size: str = DEFAULT_MODEL_SIZE,
        compute_type: str = "int8",
        mock_mode: bool = False
    ):
        self.model_size = model_size
        self.compute_type = compute_type
        self.mock_mode = mock_mode
        self.model = None

    def _load_model(self) -> None:
        """Lazily instantiates the faster-whisper model."""
        if self.model is not None:
            return

        try:
            from faster_whisper import WhisperModel
            logger.info(f"[INFO] Loading Faster-Whisper model '{self.model_size}' (compute: {self.compute_type})...")
            self.model = WhisperModel(self.model_size, compute_type=self.compute_type)
        except ImportError as exc:
            raise RuntimeError(
                f"faster-whisper is not installed. Run 'pip install faster-whisper' or use mock_mode=True. Details: {str(exc)}"
            )

    def transcribe(
        self,
        audio_path: str,
        mock_data: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Runs transcription (or returns mock_data), performs Spacy advanced_split and clean_subtitles.
        Returns list of {'start': float, 'end': float, 'text': str}
        """
        if self.mock_mode or mock_data is not None:
            data = mock_data
            if data is None:
                data = [
                    {
                        "start": 0.0,
                        "end": 3.5,
                        "text": "Welcome to Hogwarts School of Witchcraft and Wizardry."
                    },
                    {
                        "start": 3.8,
                        "end": 7.2,
                        "text": "Today we will explore the wonderful world of magic."
                    }
                ]
            return clean_subtitles(data)

        if not audio_path or not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        self._load_model()

        segments, _ = self.model.transcribe(
            audio_path,
            beam_size=5,
            word_timestamps=True,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500)
        )

        all_words = []
        for segment in segments:
            if getattr(segment, "words", None):
                all_words.extend(segment.words)

        raw_subtitles = advanced_split(all_words)
        return clean_subtitles(raw_subtitles)
