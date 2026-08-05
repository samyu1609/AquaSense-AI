"""
test_forecast.py

Tests for GET /api/prediction/forecast endpoint and 7-day recursive forecasting logic.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_forecast_endpoint_default():
    response = client.get("/api/prediction/forecast?district=Chennai")
    assert response.status_code == 200
    data = response.json()

    assert "location" in data
    assert data["location"]["district"] == "Chennai"
    assert "weather" in data
    assert "today_prediction" in data
    assert "forecast" in data

    forecast = data["forecast"]
    assert len(forecast) == 7

    # Check Day 1 vs Day 2 structure
    day1 = forecast[0]
    day2 = forecast[1]

    assert day1["day_label"] == "Today"
    assert day2["day_label"] == "Tomorrow"
    assert "groundwater_level" in day1
    assert "confidence" in day1
    assert "risk" in day1
    assert "recommendation" in day1

    # Check confidence decay in recursive forecasting
    assert day1["confidence"] >= day2["confidence"]


def test_forecast_endpoint_with_custom_coordinates():
    response = client.get("/api/prediction/forecast?district=Coimbatore&lat=11.0168&lon=76.9558&previous_level=9.2")
    assert response.status_code == 200
    data = response.json()

    assert data["location"]["district"] == "Coimbatore"
    assert round(data["location"]["latitude"], 2) == 11.02
    assert len(data["forecast"]) == 7
