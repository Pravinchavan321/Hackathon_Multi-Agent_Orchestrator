import redis.asyncio as redis
from backend.core.config import settings
from backend.core.logging import log

redis_client = None


async def connect_redis():
    global redis_client
    try:
        log.info("Connecting to Redis...", url=settings.REDIS_URL)
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True, protocol=2)
        # Test connection
        await redis_client.ping()
        log.info("Successfully connected to Redis")
    except Exception as e:
        log.error("Failed to connect to Redis", error=str(e))
        raise


async def close_redis():
    global redis_client
    if redis_client is not None:
        log.info("Closing Redis connection...")
        await redis_client.close()
        log.info("Redis connection closed")
