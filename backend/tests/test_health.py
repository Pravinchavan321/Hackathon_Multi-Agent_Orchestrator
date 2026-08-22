import asyncio
import httpx
from backend.main import app


async def test_health_endpoint():
    print("=" * 60)
    print("  TESTING HEALTH ENDPOINT (/api/health)")
    print("=" * 60)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected {{'status': 'ok'}}, got {data}"
        print(f"  [PASS] /api/health returned: {data}")

    print("=" * 60)
    print("  HEALTH ENDPOINT TEST PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_health_endpoint())
