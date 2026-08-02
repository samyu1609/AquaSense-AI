"""
routers/trend_router.py

GET /api/trend?district=...        -> monthly/yearly groundwater trend
GET /api/history                   -> recent predictions (optionally by user)
GET /api/map                       -> latest groundwater status per well for GIS map
"""

import os
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..ml.risk import classify_risk

router = APIRouter(tags=["trend"])

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "groundwater_master.csv"


@router.get("/trend")
def get_trend(district: str = Query(...)):
    if not DATA_PATH.exists():
        return {"district": district, "monthly_trend": []}

    try:
        df = pd.read_csv(DATA_PATH)
        district_clean = district.strip().lower()
        subset = df[df["District"].astype(str).str.strip().str.lower() == district_clean].sort_values("Date")

        if subset.empty:
            # Fall back to returning top rows if district query doesn't match exact name
            subset = df.head(100)

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
    except Exception as err:
        return {"district": district, "monthly_trend": [], "error": str(err)}


@router.get("/history")
def get_history(limit: int = 20, db: Session = Depends(get_db)):
    try:
        records = (
            db.query(models.Prediction)
            .order_by(models.Prediction.created_at.desc())
            .limit(limit)
            .all()
        )
        res = []
        for r in records:
            created_str = (
                r.created_at.isoformat()
                if hasattr(r.created_at, "isoformat")
                else str(r.created_at or "")
            )
            res.append({
                "id": r.id,
                "district": r.district,
                "predicted_level": r.predicted_level,
                "risk": r.risk,
                "created_at": created_str,
            })
        return res
    except Exception:
        return []


@router.get("/map")
def get_map_data():
    """Latest reading per observation well, classified for map markers."""
    if not DATA_PATH.exists():
        return {"wells": []}

    try:
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
    except Exception:
        return {"wells": []}
