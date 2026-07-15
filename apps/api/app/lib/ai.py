"""AI provider abstraction — call configured LLM with a prompt.

Changing from OpenAI to Anthropic requires changing `AI_PROVIDER` env var
(from "openai" to "anthropic") and optionally `AI_MODEL`.
"""

from httpx import AsyncClient

from app.config import settings
from app.core.exceptions import AppError


async def call_ai(prompt: str) -> str:
    """Call the configured AI provider and return the response text."""
    if not settings.AI_API_KEY:
        raise AppError(status_code=500, detail="AI_API_KEY not configured.")

    provider = (settings.AI_PROVIDER or "openai").lower()

    try:
        if provider == "anthropic":
            return await _call_anthropic(prompt)
        return await _call_openai(prompt)
    except AppError:
        raise
    except Exception as e:
        raise AppError(status_code=502, detail=f"AI call failed: {e}")


async def _call_openai(prompt: str) -> str:
    async with AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.AI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.AI_MODEL or "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def _call_anthropic(prompt: str) -> str:
    async with AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.AI_API_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.AI_MODEL or "claude-3-5-haiku-latest",
                "max_tokens": 4096,
                "messages": [{"role": "user", "content": prompt}],
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["content"][0]["text"]
