"""
routers/recommendation_router.py

GET /api/recommendation?risk=Critical -> returns advice list for a risk level
Also auto-creates an Alert record when a Critical prediction is made
(called internally from predict_router via create_alert_if_critical).
"""

from fastapi import APIRouter, Query
from sqlalchemy.orm import Session

from .. import models
from ..ml.recommend import get_recommendations

router = APIRouter(tags=["recommendation"])


@router.get("/recommendation")
def recommendation(risk: str = Query(...)):
    return {"risk": risk, "recommendations": get_recommendations(risk)}


def create_alert_if_critical(db: Session, district: str, level: float, risk: str):
    """Called after a prediction is saved; raises a dashboard alert for
    Critical risk so the early-warning system + admin dashboard can surface it."""
    if risk != "Critical":
        return None
    alert = models.Alert(
        district=district,
        message=f"Groundwater level in {district} has dropped to {level} m — Critical risk.",
        level="critical",
    )
    db.add(alert)
    db.commit()
    return alert
