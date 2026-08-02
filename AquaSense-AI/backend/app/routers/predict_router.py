"""
routers/predict_router.py

GET  /api/predict  (query params) -> runs model inference
Also persists every prediction to the database for history/trend charts.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..ml.predict_utils import predict_groundwater
from .recommendation_router import create_alert_if_critical

router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=schemas.PredictionResponse)
def predict(payload: schemas.PredictionRequest, db: Session = Depends(get_db)):
    result = predict_groundwater(
        latitude=payload.latitude,
        longitude=payload.longitude,
        district=payload.district,
        rainfall_mm=payload.rainfall_mm,
        temperature_c=payload.temperature_c,
        humidity_pct=payload.humidity_pct,
        previous_level=payload.previous_level,
        month=payload.month,
        season=payload.season,
    )

    record = models.Prediction(
        district=payload.district,
        latitude=payload.latitude,
        longitude=payload.longitude,
        predicted_level=result["predicted_level_m"],
        confidence=result["confidence"],
        risk=result["risk"],
        model_used=result["model_used"],
    )
    db.add(record)
    db.commit()

    # Early-warning: auto-raise a dashboard alert if this reading is Critical
    create_alert_if_critical(db, payload.district, result["predicted_level_m"], result["risk"])

    return result
