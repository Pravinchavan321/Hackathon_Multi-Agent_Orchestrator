import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ROOT_DIR = _BACKEND_DIR.parent

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "hackathon_db"
    REDIS_URL: str = "redis://localhost:6379"
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000
    AI_PROVIDER: str = "google"
    AI_API_KEY: str = ""
    AI_MODEL: str = "gemini-flash-lite-latest"
    AI_ENABLED: bool = True
    LOG_LEVEL: str = "INFO"
    PORT: int = 8080
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "*"
    LANGCHAIN_TRACING_V2: str = "true"
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "hackathon-orchestrator"

    model_config = SettingsConfigDict(
        env_file=(
            str(_BACKEND_DIR / ".env.example"),
            str(_ROOT_DIR / ".env"),
            str(_BACKEND_DIR / ".env"),
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()

# Propagate LangSmith / LangChain tracing configuration to os.environ for native LangChain/LangGraph capture
os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT
if settings.LANGCHAIN_TRACING_V2.lower() == "true" and settings.LANGCHAIN_API_KEY:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = settings.LANGCHAIN_API_KEY
else:
    os.environ["LANGCHAIN_TRACING_V2"] = "false"



