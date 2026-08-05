"""
routers/forecast_router.py

GET /api/prediction/forecast

Computes a recursive 7-day groundwater level forecast using live or estimated
telemetry, multi-step ML inference, decaying confidence scores, and day-by-day risk recommendations.
Also persists today's baseline prediction record to the database for trend analytics.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..ml.predict_utils import predict_7day_forecast
from .recommendation_router import create_alert_if_critical
from .weather_router import get_7day_weather_forecast

router = APIRouter(tags=["forecast"])

# Default district centroid coordinates in Tamil Nadu
DISTRICT_COORDS = {
    "Chennai": (13.0827, 80.2707),
    "Coimbatore": (11.0168, 76.9558),
    "Madurai": (9.9252, 78.1198),
    "Salem": (11.6643, 78.1460),
    "Tiruchirappalli": (10.7905, 78.7047),
    "Tirunelveli": (8.7139, 77.7567),
    "Erode": (11.3410, 77.7172),
    "Vellore": (12.9165, 79.1325),
    "Thanjavur": (10.7870, 79.1378),
    "Dindigul": (10.3673, 77.9803),
    "Cuddalore": (11.7480, 79.7714),
    "Kanyakumari": (8.0883, 77.5385),
}


@router.get("/prediction/forecast", response_model=schemas.ForecastResponse)
async def get_forecast(
    district: str = Query("Chennai"),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    previous_level: Optional[float] = Query(8.5),
    season: Optional[str] = Query("Monsoon"),
    db: Session = Depends(get_db),
):
    # Determine latitude / longitude
    if lat is None or lon is None:
        coords = DISTRICT_COORDS.get(district, (11.1271, 78.6569))
        lat, lon = coords

    # Get current weather telemetry and 7-day weather series
    current_wx, daily_wx_series = await get_7day_weather_forecast(district=district, lat=lat, lon=lon)

    month = datetime.now().month

    # Generate 7-day forecast items using recursive multi-step ML pipeline
    forecast_list = predict_7day_forecast(
        latitude=lat,
        longitude=lon,
        district=district,
        initial_previous_level=previous_level,
        month=month,
        season=season,
        daily_weather_series=daily_wx_series,
    )

    today_item = forecast_list[0]

    # Persist today's prediction record to database for history/trend tracking
    try:
        record = models.Prediction(
            district=district,
            latitude=lat,
            longitude=lon,
            predicted_level=today_item["groundwater_level"],
            confidence=today_item["confidence"],
            risk=today_item["risk"],
            model_used="AquaSense ML Recursive Engine",
        )
        db.add(record)
        db.commit()

        # Trigger auto alert if critical
        create_alert_if_critical(db, district, today_item["groundwater_level"], today_item["risk"])
    except Exception:
        db.rollback()

    return {
        "location": {
            "district": district,
            "latitude": lat,
            "longitude": lon,
        },
        "weather": current_wx,
        "today_prediction": today_item,
        "forecast": forecast_list,
    }
