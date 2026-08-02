"""
routers/trend_router.py

GET /api/trend?district=...        -> monthly/yearly groundwater trend
GET /api/history                   -> recent predictions (optionally by user)
GET /api/map                       -> latest groundwater status per well for GIS map
"""

import os

import pandas as pd
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..ml.risk import classify_risk

router = APIRouter(tags=["trend"])

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "groundwater_master.csv")


@router.get("/trend")
def get_trend(district: str = Query(...)):
    df = pd.read_csv(DATA_PATH)
    subset = df[df["District"] == district].sort_values("Date")

    monthly = (
        subset.groupby("Date")
        .agg(
            groundwater_level=("Groundwater_Level", "mean"),
            rainfall=("Rainfall_mm", "mean"),
            temperature=("Temperature_C", "mean"),
        )
        .reset_index()
    )

    return {
        "district": district,
        "monthly_trend": monthly.to_dict(orient="records"),
    }


@router.get("/history")
def get_history(limit: int = 20, db: Session = Depends(get_db)):
    records = (
        db.query(models.Prediction)
        .order_by(models.Prediction.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "district": r.district,
            "predicted_level": r.predicted_level,
            "risk": r.risk,
            "created_at": r.created_at.isoformat(),
        }
        for r in records
    ]


@router.get("/map")
def get_map_data():
    """Latest reading per observation well, classified for map markers."""
    df = pd.read_csv(DATA_PATH)
    latest = df.sort_values("Date").groupby("Observation_Well").tail(1)

    wells = []
    for _, row in latest.iterrows():
        risk, colour = classify_risk(row["Groundwater_Level"])
        wells.append({
            "well": row["Observation_Well"],
            "district": row["District"],
            "village": row["Village"],
            "latitude": row["Latitude"],
            "longitude": row["Longitude"],
            "groundwater_level": row["Groundwater_Level"],
            "risk": risk,
            "colour": colour,
        })
    return {"wells": wells}
