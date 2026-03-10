import os
import json
import re
from openai import AsyncOpenAI
from phonology.patterns import PHONOLOGICAL_PATTERNS, PATTERN_EXAMPLES, normalize_word

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """Eres un fonoaudiólogo clínico especialista en fonología del desarrollo infantil en español latinoamericano.

Tu tarea es analizar la pronunciación de un niño y detectar procesos fonológicos de simplificación.

PROCESOS FONOLÓGICOS A DETECTAR (exactamente estos 17 códigos):

OMISIONES (EM):
- EM-C1: Omisión de coda nasal (pan→pa, tren→tre, manta→mata)
- EM-C2: Omisión de coda sibilante (dos→do, mes→me, pasta→pata)
- EM-C3: Omisión de coda líquida (sol→so, mar→ma, falda→fada)
- EM-G: Reducción de grupo consonántico (flor→lor, tren→ren, brazo→razo, plato→pato)
- EM-RD: Reducción de diptongo (tierra→tera, puerta→pera, fuego→fego)
- EM-MT: Reducción metrical (teléfono→téfono, mariposa→maposa, elefante→efante)
- EM-M: Metátesis - transposición de segmentos (cocodrilo→crododilo, peligro→perligo)

ASIMILACIONES (EA):
- EA-N: Asimilación nasal - consonante se nasaliza por proximidad (boca→moca, dedo→neno)
- EA-L: Asimilación labial - consonante adquiere rasgos labiales (cama→pama, gato→bato, dedo→bebo)
- EA-D: Asimilación dental/alveolar (casa→tasa, dato→tato, leche→lele)

SUSTITUCIONES (ES):
- ES-O: Sustitución de oclusivas (t/d por p/b o viceversa)
- ES-F: Sustitución de fricativas (s/z por f o viceversa)
- ES-P: Sustitución de palatales (ll/y por otro fonema)
- ES-SL: Sustitución de laterales (l/r confusión)
- ES-SLNL: Sustitución semiconsonante-lateral (ll→r, y→l)
- ES-PS: Sustitución obstruyente por sonora (p→b, t→d, k→g)

INSTRUCCIONES:
1. Compara la palabra transcrita con la palabra objetivo
2. Identifica las diferencias fonológicas específicas
3. Asigna el/los código(s) correspondiente(s)
4. Considera la edad del niño (procesos son normales a ciertas edades)
5. Si la pronunciación es correcta, match=true y diagnosis_codes=[]
6. La confianza debe reflejar qué tan claro está el análisis

IMPORTANTE:
- Solo usa los 17 códigos listados arriba
- Sé específico en la descripción de la desviación
- Considera variaciones dialectales normales
- Una sola palabra puede tener múltiples procesos

RESPONDE SIEMPRE EN ESTE FORMATO JSON (sin markdown, solo JSON puro):
{
  "match": boolean,
  "deviations": [
    {
      "code": "EM-C1",
      "description": "Omisión de coda nasal /n/ en posición final",
      "position": "final",
      "example": "pan → pa"
    }
  ],
  "diagnosis_codes": ["EM-C1"],
  "confidence": 0.85,
  "audio_quality": "good"
}"""


async def analyze_phonology(transcribed: str, target_word: str, age_months: int) -> dict:
    """
    Analyze transcribed pronunciation against target word.
    Returns structured phonological analysis.
    """
    # Quick exact match check
    transcribed_clean = normalize_word(transcribed)
    target_clean = normalize_word(target_word)

    if transcribed_clean == target_clean:
        return {
            "match": True,
            "deviations": [],
            "diagnosis_codes": [],
            "confidence": 1.0,
            "audio_quality": "good",
            "transcribed": transcribed,
        }

    user_message = f"""Analiza la pronunciación del niño:

Palabra objetivo: {target_word}
Pronunciación del niño: {transcribed}
Edad del niño: {age_months} meses ({age_months // 12} años {age_months % 12} meses)

Identifica qué proceso(s) fonológico(s) aplican y responde en formato JSON."""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.1,
        max_tokens=500,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    result = json.loads(content)

    # Validate and sanitize response
    valid_codes = {
        'EM-C1', 'EM-C2', 'EM-C3', 'EM-G', 'EM-RD', 'EM-MT', 'EM-M',
        'EA-N', 'EA-L', 'EA-D',
        'ES-O', 'ES-F', 'ES-P', 'ES-SL', 'ES-SLNL', 'ES-PS'
    }

    if 'diagnosis_codes' in result:
        result['diagnosis_codes'] = [c for c in result['diagnosis_codes'] if c in valid_codes]
    else:
        result['diagnosis_codes'] = []

    if 'deviations' not in result:
        result['deviations'] = []

    if 'confidence' not in result:
        result['confidence'] = 0.7

    if 'audio_quality' not in result:
        result['audio_quality'] = 'good'

    # Ensure match is consistent with deviations
    if not result.get('diagnosis_codes'):
        result['match'] = True

    result['transcribed'] = transcribed

    return result
