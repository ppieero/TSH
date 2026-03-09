"""
VoiceCheck — Voice AI Service (Python FastAPI)
Pipeline: Audio upload → Whisper transcription → GPT-4o phonological analysis
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="VoiceCheck AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3001").split(","),
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Transcribe audio using OpenAI Whisper.
    Audio files are PHI — never stored in DB, only in encrypted Storage.
    """
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid audio file")

    # TODO: implement Whisper transcription
    # 1. Read audio bytes
    # 2. Send to openai.audio.transcriptions.create(model="whisper-1")
    # 3. Return transcription
    return {"transcription": "", "message": "Implement with OpenAI Whisper"}


@app.post("/analyze")
async def analyze(payload: dict):
    """
    Analyze phonological patterns from transcription.
    Uses GPT-4o with clinical prompts to detect the 17 phonological patterns.
    Returns: match, deviations, diagnosis_codes, confidence
    """
    # TODO: implement GPT-4o analysis
    # 1. Load prompt from phonology/prompts/
    # 2. Send transcription + target_word to GPT-4o
    # 3. Parse structured response
    # 4. Return analysis result
    return {
        "match": False,
        "deviations": [],
        "diagnosis_codes": [],
        "confidence": 0.0,
        "message": "Implement with GPT-4o + clinical prompts"
    }
