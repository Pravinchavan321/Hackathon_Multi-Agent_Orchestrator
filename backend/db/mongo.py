from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from backend.core.config import settings
from backend.core.logging import log

_client = None

async def connect_mongo():
    global _client
    try:
        log.info("Connecting to MongoDB...", uri=settings.MONGO_URI)
        _client = AsyncIOMotorClient(settings.MONGO_URI)
        
        # Ping the database to ensure connection is valid
        await _client.admin.command('ping')
        
        # Initialize Beanie with an empty list for now
        await init_beanie(database=_client[settings.MONGO_DB_NAME], document_models=[])
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
