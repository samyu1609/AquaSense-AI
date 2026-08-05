"""
predict_utils.py

Loads trained model artifact using relative path. Includes fallback engine
to guarantee API stability in production environments.
"""

import logging
import pickle
from pathlib import Path
from typing import Optional

import numpy as np

from .recommend import get_recommendations
from .risk import classify_risk

logger = logging.getLogger("aquasense.ml")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "groundwater_model.pkl"

_artifact = None


def _load_artifact():
    global _artifact
    if _artifact is not None:
        return _artifact

    if MODEL_PATH.exists():
        try:
            with open(MODEL_PATH, "rb") as f:
                _artifact = pickle.load(f)
                logger.info(f"Loaded ML model successfully from {MODEL_PATH}")
                return _artifact
        except Exception as err:
            logger.warning(f"Failed to unpickle model at {MODEL_PATH}: {err}. Using fallback calculation engine.")
    else:
        logger.warning(f"ML model file not found at {MODEL_PATH}. Using fallback calculation engine.")

    _artifact = {
        "model": None,
        "is_fallback": True,
        "model_name": "Hydrological Fallback Engine",
    }
    return _artifact


def verify_model_loaded() -> bool:
    """Startup check returns True if trained ML model artifact is loaded, False if fallback is used."""
    art = _load_artifact()
    return not art.get("is_fallback", False)


def predict_groundwater(
    latitude: float,
    longitude: float,
    district: str,
    rainfall_mm: float,
    temperature_c: float,
    humidity_pct: float,
    previous_level: float,
    month: int,
    season: str,
    solar_radiation: float = 18.0,
    wind_speed: float = 3.5,
) -> dict:
    """Runs prediction using loaded ML model or fallback hydrological formula."""
    artifact = _load_artifact()

    if artifact.get("is_fallback") or artifact.get("model") is None:
        # Robust fallback formula: recharge from rain decreases water table depth, heat increases evapotranspiration
        seasonal_mult = 0.85 if season in ("Monsoon", "Post-Monsoon") else 1.15
        calc_level = (previous_level * 0.75) - (rainfall_mm * 0.015) + (temperature_c * 0.04) * seasonal_mult
        predicted_level = float(round(max(0.3, calc_level), 2))
        confidence = 0.85
        risk_label, colour = classify_risk(predicted_level)
        recommendations = get_recommendations(risk_label)
        return {
            "predicted_level_m": predicted_level,
            "confidence": confidence,
            "risk": risk_label,
            "risk_colour": colour,
            "recommendations": recommendations,
            "model_used": "Hydrological Fallback Engine",
        }

    model = artifact["model"]
    district_encoder = artifact.get("district_encoder")
    season_encoder = artifact.get("season_encoder")
    scaler = artifact.get("scaler")

    try:
        district_enc = district_encoder.transform([district])[0] if district_encoder else 0
    except (ValueError, Exception):
        district_enc = 0

    try:
        season_enc = season_encoder.transform([season])[0] if season_encoder else 0
    except (ValueError, Exception):
        season_enc = 0

    is_monsoon = 1 if season in ("Monsoon", "Post-Monsoon") else 0

    row = np.array([[
        latitude, longitude, district_enc, rainfall_mm, temperature_c,
        humidity_pct, solar_radiation, wind_speed, previous_level,
        month, season_enc, is_monsoon, rainfall_mm,
    ]])

    if scaler:
        row = scaler.transform(row)

    predicted_level = float(model.predict(row)[0])
    predicted_level = max(0.1, predicted_level)

    confidence = 0.90
    if hasattr(model, "estimators_"):
        try:
            tree_preds = np.array([t.predict(row)[0] for t in model.estimators_])
            spread = float(np.std(tree_preds))
            confidence = float(np.clip(1 - (spread / (abs(predicted_level) + 1e-6)), 0.4, 0.99))
        except Exception:
            confidence = 0.88

    risk_label, colour = classify_risk(predicted_level)
    recommendations = get_recommendations(risk_label)

    return {
        "predicted_level_m": round(predicted_level, 2),
        "confidence": round(confidence, 3),
        "risk": risk_label,
        "risk_colour": colour,
        "recommendations": recommendations,
        "model_used": artifact.get("model_name", "RandomForestRegressor"),
    }


def predict_7day_forecast(
    latitude: float,
    longitude: float,
    district: str,
    initial_previous_level: float,
    month: int,
    season: str,
    daily_weather_series: list,
) -> list:
    """
    Multi-step recursive 7-day groundwater forecasting pipeline.
    Each day's predicted level is fed as the 'previous_level' feature for the subsequent day.
    """
    from datetime import datetime, timedelta

    forecast_items = []
    current_prev_level = float(initial_previous_level)
    today = datetime.now()

    for i in range(7):
        day_date = today + timedelta(days=i)
        date_str = day_date.strftime("%Y-%m-%d")

        if i == 0:
            day_label = "Today"
        elif i == 1:
            day_label = "Tomorrow"
        else:
            day_label = f"Day {i + 1}"

        # Weather for day i
        if i < len(daily_weather_series):
            w = daily_weather_series[i]
        else:
            w = {
                "temperature": 30.0,
                "humidity": 65.0,
                "rainfall": 10.0,
            }

        temp_c = float(w.get("temperature", 30.0))
        hum_pct = float(w.get("humidity", 65.0))
        rain_mm = float(w.get("rainfall", 0.0))

        # Perform single step inference with current_prev_level
        pred_res = predict_groundwater(
            latitude=latitude,
            longitude=longitude,
            district=district,
            rainfall_mm=rain_mm,
            temperature_c=temp_c,
            humidity_pct=hum_pct,
            previous_level=current_prev_level,
            month=month,
            season=season,
        )

        pred_level = pred_res["predicted_level_m"]
        # Apply horizon uncertainty decay for multi-step recursive forecasting
        step_confidence = max(0.65, round(pred_res["confidence"] - (i * 0.02), 3))
        risk_label = pred_res["risk"]
        colour = pred_res["risk_colour"]
        recommendation = pred_res["recommendations"][0] if pred_res["recommendations"] else "Maintain optimal irrigation."

        forecast_items.append({
            "date": date_str,
            "day_label": day_label,
            "groundwater_level": pred_level,
            "confidence": step_confidence,
            "risk": risk_label,
            "risk_colour": colour,
            "recommendation": recommendation,
            "temperature": round(temp_c, 1),
            "rainfall": round(rain_mm, 1),
            "humidity": round(hum_pct, 1),
        })

        # Update previous level for the next day's recursive prediction step
        current_prev_level = pred_level

    return forecast_items

