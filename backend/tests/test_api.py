import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_root():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/")
        assert res.status_code == 200
        assert res.json()["app"] == "ChatNest"

@pytest.mark.asyncio
async def test_auth_verify_otp():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/auth/verify-otp", json={"identifier": "priya", "otp": "123456"})
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["username"] == "priya"

@pytest.mark.asyncio
async def test_register_validation_and_duplicate():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Test duplicate username (priya is pre-seeded)
        dup_uname_res = await ac.post("/api/v1/auth/register", json={
            "display_name": "Priya Duplicate",
            "username": "priya",
            "phone_number": "9876543299"
        })
        assert dup_uname_res.status_code == 400
        assert "already taken" in dup_uname_res.json()["detail"]

        # Test duplicate phone number (9876543210 is pre-seeded for priya)
        dup_phone_res = await ac.post("/api/v1/auth/register", json={
            "display_name": "Phone Duplicate",
            "username": "unique_user_99",
            "phone_number": "9876543210"
        })
        assert dup_phone_res.status_code == 400
        assert "already registered" in dup_phone_res.json()["detail"]

        # Test valid unique registration
        import time
        unique_suffix = str(int(time.time()))[-4:]
        valid_res = await ac.post("/api/v1/auth/register", json={
            "display_name": "New Valid User",
            "username": f"user_{unique_suffix}",
            "phone_number": f"987654{unique_suffix}"
        })
        assert valid_res.status_code == 200
        assert valid_res.json()["username"] == f"user_{unique_suffix}"



@pytest.mark.asyncio
async def test_list_conversations():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        auth_res = await ac.post("/api/v1/auth/verify-otp", json={"identifier": "priya", "otp": "123456"})
        token = auth_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = await ac.get("/api/v1/conversations", headers=headers)
        assert res.status_code == 200
        convs = res.json()
        assert len(convs) >= 2
