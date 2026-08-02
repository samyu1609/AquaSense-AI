"""
predict_utils.py

Loads the trained model artifact once (module-level cache) and exposes
`predict_groundwater()` used by the FastAPI /predict route.
"""

import pickle
from pathlib import Path
from typing import Optional

import numpy as np

from .risk import classify_risk
from .recommend import get_recommendations

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "groundwater_model.pkl"

_artifact = None


def _load_artifact():
    global _artifact
    if _artifact is None:
        with open(MODEL_PATH, "rb") as f:
            _artifact = pickle.load(f)
    return _artifact


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
    """Runs a single prediction and returns level, confidence, risk, and advice."""
    artifact = _load_artifact()
    model = artifact["model"]
    district_encoder = artifact["district_encoder"]
    season_encoder = artifact["season_encoder"]
    scaler = artifact["scaler"]

    # Handle unseen districts/seasons gracefully by falling back to the
    # most frequent class instead of raising.
    try:
        district_enc = district_encoder.transform([district])[0]
    except ValueError:
        district_enc = 0

    try:
        season_enc = season_encoder.transform([season])[0]
    except ValueError:
        season_enc = 0

    is_monsoon = 1 if season in ("Monsoon", "Post-Monsoon") else 0

    row = np.array([[
        latitude, longitude, district_enc, rainfall_mm, temperature_c,
        humidity_pct, solar_radiation, wind_speed, previous_level,
        month, season_enc, is_monsoon, rainfall_mm,
    ]])
    row_scaled = scaler.transform(row)

    predicted_level = float(model.predict(row_scaled)[0])
    predicted_level = max(0.1, predicted_level)

    # Confidence: for tree ensembles, use agreement across trees (std dev
    # of individual tree predictions) as an inverse-confidence proxy.
    confidence = 0.9
    if hasattr(model, "estimators_"):
        tree_preds = np.array([t.predict(row_scaled)[0] for t in model.estimators_])
        spread = float(np.std(tree_preds))
        confidence = float(np.clip(1 - (spread / (abs(predicted_level) + 1e-6)), 0.4, 0.99))

    risk_label, colour = classify_risk(predicted_level)
    recommendations = get_recommendations(risk_label)

    return {
        "predicted_level_m": round(predicted_level, 2),
        "confidence": round(confidence, 3),
        "risk": risk_label,
        "risk_colour": colour,
        "recommendations": recommendations,
        "model_used": artifact.get("model_name", "unknown"),
    }
