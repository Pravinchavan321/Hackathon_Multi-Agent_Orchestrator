from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from backend.core.config import settings
from backend.core.logging import log
from backend.models import User, Submission, AITask, AIInsight, AIRisk, AIActivityLog

# Compatibility patch for motor 3.7+ and beanie metadata handling
if not hasattr(AsyncIOMotorClient, "append_metadata"):
    AsyncIOMotorClient.append_metadata = lambda self, *args, **kwargs: None

_client = None


async def connect_mongo():
    global _client
    try:
        log.info("Connecting to MongoDB...", uri=settings.MONGO_URI)
        _client = AsyncIOMotorClient(settings.MONGO_URI)
        
        # Ping the database to ensure connection is valid
        await _client.admin.command('ping')
        
        # Initialize Beanie with document models
        await init_beanie(
            database=_client[settings.MONGO_DB_NAME],
            document_models=[User, Submission, AITask, AIInsight, AIRisk, AIActivityLog],
        )
        log.info("Successfully connected to MongoDB and initialized Beanie")
    except Exception as e:
        log.error("Failed to connect to MongoDB", error=str(e))
        raise


async def close_mongo():
    global _client
    if _client is not None:
        log.info("Closing MongoDB connection...")
        _client.close()
        log.info("MongoDB connection closed")
