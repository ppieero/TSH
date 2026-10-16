import os
from functools import lru_cache
from openai import AsyncOpenAI


@lru_cache(maxsize=1)
def get_client() -> AsyncOpenAI:
    """
    OpenAI client, created on first use so the service can start (and answer /health)
    without OPENAI_API_KEY; the requests that need it fail with a clear message instead.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    return AsyncOpenAI(api_key=api_key)
