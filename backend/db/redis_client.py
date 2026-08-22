import redis.asyncio as redis
from backend.core.config import settings
from backend.core.logging import log

redis_client = None


async def connect_redis():
    """
    Connects to Redis if REDIS_URL is provided, or safely operates in standalone mode.
    Redis is completely optional.
    """
    global redis_client
    redis_url = getattr(settings, "REDIS_URL", "").strip()
    if not redis_url or redis_url.lower() in ("none", "disabled", "false", ""):
        log.info("Redis is disabled or not configured; proceeding in standalone mode.")
        redis_client = None
        return None

    try:
        log.info("Connecting to Redis...", url=redis_url)
        redis_client = redis.from_url(redis_url, decode_responses=True, protocol=2)
        await redis_client.ping()
        log.info("Successfully connected to Redis")
        return redis_client
    except Exception as e:
        log.warn("Redis connection unavailable; proceeding in standalone mode without cache", error=str(e))
        redis_client = None
        return None


async def close_redis():
    global redis_client
    if redis_client is not None:
        try:
            log.info("Closing Redis connection...")
            await redis_client.close()
            log.info("Redis connection closed")
        except Exception:
            pass
        finally:
            redis_client = None

