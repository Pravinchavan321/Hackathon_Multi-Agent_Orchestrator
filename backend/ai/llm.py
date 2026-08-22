from langchain_google_genai import ChatGoogleGenerativeAI
from backend.core.config import settings
from backend.core.logging import log

class AIOfflineError(Exception):
    pass

class OfflineLLMProxy:
    async def ainvoke(self, *args, **kwargs):
        raise AIOfflineError("AI Engine Offline")
    
    def invoke(self, *args, **kwargs):
        raise AIOfflineError("AI Engine Offline")

    def with_structured_output(self, *args, **kwargs):
        return self


def _create_llm():
    if not settings.AI_ENABLED:
        log.error("AI is disabled via AI_ENABLED=false")
        raise AIOfflineError("AI is disabled")
    if not settings.AI_API_KEY or settings.AI_API_KEY == "your_api_key_here":
        log.error("AI_API_KEY is missing or invalid")
        raise AIOfflineError("AI_API_KEY is missing or invalid")
    
    keys = [k.strip() for k in settings.AI_API_KEY.split(",") if k.strip()]
    if not keys:
        raise AIOfflineError("No valid API keys found")
        
    primary_llm = ChatGoogleGenerativeAI(
        model=settings.AI_MODEL,
        google_api_key=keys[0],
        max_retries=1,
    )
    
    if len(keys) > 1:
        fallback_llms = [
            ChatGoogleGenerativeAI(
                model=settings.AI_MODEL,
                google_api_key=key,
                max_retries=1,
            ) for key in keys[1:]
        ]
        log.info(f"Instantiated ChatGoogleGenerativeAI client with {len(fallback_llms)} fallback keys")
        return primary_llm.with_fallbacks(fallback_llms)
        
    log.info("Instantiating ChatGoogleGenerativeAI client (single key)...")
    return primary_llm

try:
    llm = _create_llm()
except AIOfflineError:
    llm = OfflineLLMProxy()
