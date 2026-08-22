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
    APP_ENV: str = "development"
    LANGCHAIN_TRACING_V2: str = "false"
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "hackathon"

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

