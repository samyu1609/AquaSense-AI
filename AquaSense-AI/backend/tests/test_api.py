"""
test_api.py

Automated test suite for testing all AquaSense AI FastAPI endpoints.
"""

from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.database import Base, engine, SessionLocal
from app.auth import hash_password
from app.models import User

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["service"] == "AquaSense AI backend"

    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_auth_and_admin_flow():
    # Register user
    email = "testuser@example.com"
    payload = {"name": "Test User", "email": email, "password": "Password123!"}
    res = client.post("/api/register", json=payload)
    assert res.status_code in (200, 400)  # 400 if already exists

    # Login user
    login_res = client.post("/api/login", json={"email": email, "password": "Password123!"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None

    # Seed admin if needed and login
    db = SessionLocal()
    admin_email = "admin_test@aquasense.ai"
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if not existing_admin:
        admin_user = User(
            name="Admin Test",
            email=admin_email,
            hashed_password=hash_password("AdminPass123!"),
            role="admin",
        )
        db.add(admin_user)
        db.commit()
    db.close()

    admin_login = client.post("/api/login", json={"email": admin_email, "password": "AdminPass123!"})
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]

    # Test Admin Dashboard
    headers = {"Authorization": f"Bearer {admin_token}"}
    dash_res = client.get("/api/dashboard", headers=headers)
    assert dash_res.status_code == 200
    assert "total_users" in dash_res.json()

    # Test List Users
    users_res = client.get("/api/admin/users", headers=headers)
    assert users_res.status_code == 200
    assert isinstance(users_res.json(), list)


def test_prediction_endpoint():
    payload = {
        "latitude": 13.0827,
        "longitude": 80.2707,
        "district": "Chennai",
        "rainfall_mm": 45.0,
        "temperature_c": 31.0,
        "humidity_pct": 70.0,
        "previous_level": 8.0,
        "month": 7,
        "season": "Monsoon",
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "predicted_level_m" in data
    assert "confidence" in data
    assert "risk" in data
    assert "risk_colour" in data
    assert "recommendations" in data


def test_weather_endpoint():
    res = client.get("/api/weather?district=Chennai")
    assert res.status_code == 200
    data = res.json()
    assert data["district"] == "Chennai"
    assert "temperature" in data
    assert "humidity" in data


def test_recommendation_endpoint():
    res = client.get("/api/recommendation?risk=Critical")
    assert res.status_code == 200
    data = res.json()
    assert data["risk"] == "Critical"
    assert len(data["recommendations"]) > 0


def test_trend_map_history_endpoints():
    trend_res = client.get("/api/trend?district=Chennai")
    assert trend_res.status_code == 200
    assert "monthly_trend" in trend_res.json()

    map_res = client.get("/api/map")
    assert map_res.status_code == 200
    assert "wells" in map_res.json()

    hist_res = client.get("/api/history")
    assert hist_res.status_code == 200
    assert isinstance(hist_res.json(), list)
