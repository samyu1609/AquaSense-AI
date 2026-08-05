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


async def get_7day_weather_forecast(district: str, lat: float = None, lon: float = None) -> tuple:
    """
    Returns (current_weather_dict, daily_weather_series_list).
    daily_weather_series_list is a 7-element list of dicts with keys: temperature, humidity, rainfall.
    """
    current_wx = _climatology_fallback(district)
    daily_series = []

    if OPENWEATHER_API_KEY and lat is not None and lon is not None:
        try:
            url_current = "https://api.openweathermap.org/data/2.5/weather"
            params = {"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"}
            async with httpx.AsyncClient(timeout=8) as client:
                resp = await client.get(url_current, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    current_wx = {
                        "district": district,
                        "temperature": round(float(data["main"]["temp"]), 1),
                        "humidity": round(float(data["main"]["humidity"]), 1),
                        "rainfall": round(float(data.get("rain", {}).get("1h", 0.0)), 1),
                        "pressure": round(float(data["main"]["pressure"]), 1),
                        "wind_speed": round(float(data["wind"]["speed"]), 1),
                        "source": "openweather_live",
                    }

            url_forecast = "https://api.openweathermap.org/data/2.5/forecast"
            async with httpx.AsyncClient(timeout=8) as client:
                f_resp = await client.get(url_forecast, params=params)
                if f_resp.status_code == 200:
                    fdata = f_resp.json()
                    # Aggregate 3-hour forecasts by day
                    from collections import defaultdict
                    by_day = defaultdict(list)
                    for item in fdata.get("list", []):
                        day_key = item["dt_txt"].split(" ")[0]
                        by_day[day_key].append(item)

                    sorted_days = sorted(by_day.keys())
                    for day_k in sorted_days[:7]:
                        items = by_day[day_k]
                        avg_temp = sum(it["main"]["temp"] for it in items) / len(items)
                        avg_hum = sum(it["main"]["humidity"] for it in items) / len(items)
                        total_rain = sum(it.get("rain", {}).get("3h", 0.0) for it in items)
                        daily_series.append({
                            "temperature": round(avg_temp, 1),
                            "humidity": round(avg_hum, 1),
                            "rainfall": round(total_rain, 1),
                        })
        except Exception:
            pass

    # If daily_series is empty or incomplete (< 7 days), pad with climatology estimates with minor daily variations
    base_temp = current_wx["temperature"]
    base_hum = current_wx["humidity"]
    base_rain = current_wx["rainfall"]

    # Variational multipliers over 7 days for realistic weather progression
    temp_offsets = [0.0, -0.4, -0.8, -0.3, 0.2, 0.5, 0.1]
    hum_offsets = [0.0, 2.0, 4.0, 1.0, -2.0, -3.0, -1.0]
    rain_offsets = [0.0, -2.5, -5.0, -7.5, -9.0, -10.0, -11.0]

    while len(daily_series) < 7:
        idx = len(daily_series)
        t_off = temp_offsets[idx] if idx < len(temp_offsets) else 0.0
        h_off = hum_offsets[idx] if idx < len(hum_offsets) else 0.0
        r_off = rain_offsets[idx] if idx < len(rain_offsets) else 0.0

        daily_series.append({
            "temperature": round(max(15.0, base_temp + t_off), 1),
            "humidity": round(np_clip(base_hum + h_off, 20.0, 100.0), 1),
            "rainfall": round(max(0.0, base_rain + r_off), 1),
        })

    return current_wx, daily_series


def np_clip(val, min_val, max_val):
    return max(min_val, min(max_val, val))

