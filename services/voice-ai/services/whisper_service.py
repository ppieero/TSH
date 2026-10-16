from services.openai_client import get_client


async def transcribe_audio(file_path: str) -> str:
    """
    Transcribe audio file using OpenAI Whisper.
    Returns transcription text in Spanish.
    """
    with open(file_path, "rb") as audio_file:
        response = await get_client().audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="es",  # Force Spanish
            response_format="text",
            prompt="Transcribe la pronunciación de una sola palabra en español dicha por un niño pequeño."
        )
    return response.strip().lower()
