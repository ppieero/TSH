"""
VoiceCheck — Voice AI Service (Python FastAPI)
Pipeline: Audio upload → Whisper transcription → GPT-4o phonological analysis
"""
import os
import json
import base64
import tempfile
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from services.whisper_service import transcribe_audio
from services.gpt4o_service import analyze_phonology
from supabase import create_client, Client

load_dotenv()

app = FastAPI(title="VoiceCheck AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3001").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client for downloading audio files
supabase_url = os.getenv("SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
supabase: Optional[Client] = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)


class TranscribeRequest(BaseModel):
    audio_base64: str
    mime_type: str = "audio/webm"

class AnalyzeRequest(BaseModel):
    transcribed: str
    target_word: str
    age_months: int

class AnalyzeFullRequest(BaseModel):
    recording_id: str
    storage_path: str
    target_word: str
    age_months: int


@app.get("/health")
async def health():
    return {"status": "ok", "service": "voice-ai"}


@app.post("/transcribe")
async def transcribe(request: TranscribeRequest):
    """Transcribe base64 audio using Whisper"""
    try:
        # Decode base64 audio
        audio_data = base64.b64decode(
            request.audio_base64.split(",")[1] if "," in request.audio_base64
            else request.audio_base64
        )
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_data)
            tmp_path = f.name

        transcription = await transcribe_audio(tmp_path)
        os.unlink(tmp_path)
        return {"transcribed": transcription, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """Analyze transcription against target word for phonological patterns"""
    try:
        result = await analyze_phonology(
            transcribed=request.transcribed,
            target_word=request.target_word,
            age_months=request.age_months
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-full")
async def analyze_full(request: AnalyzeFullRequest):
    """Full pipeline: download from Supabase Storage → transcribe → analyze"""
    try:
        # Download audio from Supabase Storage
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")

        response = supabase.storage.from_("recordings").download(request.storage_path)

        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(response)
            tmp_path = f.name

        # Transcribe
        transcription = await transcribe_audio(tmp_path)
        os.unlink(tmp_path)

        # Analyze
        analysis = await analyze_phonology(
            transcribed=transcription,
            target_word=request.target_word,
            age_months=request.age_months
        )
        analysis["recording_id"] = request.recording_id
        analysis["transcribed"] = transcription

        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
