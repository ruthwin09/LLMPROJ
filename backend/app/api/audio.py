"""Faster-Whisper Speech-to-Text Transcription Endpoints."""

import os
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional

from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/audio", tags=["audio"])


class TranscriptionResponse(BaseModel):
    text: str
    language: Optional[str] = "en"
    duration: Optional[float] = 0.0
    model: str = "faster-whisper"


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    model_size: Optional[str] = Form("base"),
    current_user: User = Depends(get_current_user)
):
    """
    Transcribes audio to text using the Faster-Whisper model (CTranslate2 optimized).
    """
    try:
        from faster_whisper import WhisperModel

        suffix = os.path.splitext(file.filename)[1] or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Load Faster-Whisper model on CPU with INT8 quantization for optimal speed
        whisper_model = WhisperModel(model_size, device="cpu", compute_type="int8")
        segments, info = whisper_model.transcribe(tmp_path, beam_size=5)

        full_text = " ".join([segment.text.strip() for segment in segments])

        try:
            os.remove(tmp_path)
        except OSError:
            pass

        return TranscriptionResponse(
            text=full_text,
            language=info.language,
            duration=info.duration,
            model=f"faster-whisper-{model_size}"
        )
    except ImportError:
        return TranscriptionResponse(
            text="[Faster-Whisper] Python package 'faster-whisper' not installed in current environment. Using web transcript.",
            language="en",
            duration=0.0,
            model="faster-whisper-fallback"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
