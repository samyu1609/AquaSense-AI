"""
routers/weather_router.py

GET /api/weather?district=...&lat=...&lon=...

Calls the real OpenWeather API when OPENWEATHER_API_KEY is set in the
environment. Falls back to a seasonal climatology estimate (derived from
the training dataset) when no key is configured, so the endpoint always
returns a usable response for demos/offline dev.
"""

import os
from datetime import datetime

import httpx
import pandas as pd
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(tags=["weather"])

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "groundwater_master.csv")


def _climatology_fallback(district: str) -> dict:
    """Estimate current conditions from historical averages for this month."""
    df = pd.read_csv(DATA_PATH)
    month = datetime.utcnow().month
    subset = df[(df["District"] == district) & (df["Month"] == month)]
    if subset.empty:
        subset = df[df["Month"] == month]

    return {
        "district": district,
        "temperature": round(float(subset["Temperature_C"].mean()), 1),
        "humidity": round(float(subset["Humidity_pct"].mean()), 1),
        "rainfall": round(float(subset["Rainfall_mm"].mean()), 1),
        "pressure": 1011.0,  # typical sea-level pressure for TN coastal/inland avg
        "wind_speed": round(float(subset["Wind_Speed"].mean()), 1),
        "source": "climatology_estimate",
    }


@router.get("/weather", response_model=None)
async def get_weather(
    district: str = Query(...),
    lat: float = Query(None),
    lon: float = Query(None),
):
    if OPENWEATHER_API_KEY and lat is not None and lon is not None:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"}
        try:
            async with httpx.AsyncClient(timeout=8) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
            return {
                "district": district,
                "temperature": data["main"]["temp"],
                "humidity": data["main"]["humidity"],
                "rainfall": data.get("rain", {}).get("1h", 0.0),
                "pressure": data["main"]["pressure"],
                "wind_speed": data["wind"]["speed"],
                "source": "openweather_live",
            }
        except Exception as exc:  # network error, bad key, rate limit, etc.
            raise HTTPException(
                status_code=502,
                detail=f"OpenWeather request failed ({exc}); remove OPENWEATHER_API_KEY "
                       f"to use the offline climatology fallback instead.",
            )

    return _climatology_fallback(district)
