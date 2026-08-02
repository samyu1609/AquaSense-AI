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
