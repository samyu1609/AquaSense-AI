"""
routers/admin_router.py

POST /api/upload    -> upload a new CSV to append to the training dataset
POST /api/retrain    -> retrain the model on the current dataset
GET  /api/dashboard -> admin summary stats
GET  /api/admin/users
DELETE /api/admin/predictions/{id}

All routes require an authenticated admin (JWT role check).
"""

from typing import List
import os
import subprocess
import sys

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_admin
from ..database import get_db

router = APIRouter(tags=["admin"])

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "groundwater_master.csv")
TRAIN_SCRIPT = os.path.join(os.path.dirname(__file__), "..", "ml", "train_model.py")


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    admin: models.User = Depends(get_current_admin),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    new_df = pd.read_csv(file.file)
    existing_df = pd.read_csv(DATA_PATH)

    missing_cols = set(existing_df.columns) - set(new_df.columns)
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded CSV is missing required columns: {sorted(missing_cols)}",
        )

    merged = pd.concat([existing_df, new_df[existing_df.columns]], ignore_index=True)
    merged = merged.drop_duplicates()
    merged.to_csv(DATA_PATH, index=False)

    return {"message": "Dataset updated", "total_rows": len(merged)}


@router.post("/retrain")
def retrain_model(admin: models.User = Depends(get_current_admin)):
    result = subprocess.run(
        [sys.executable, TRAIN_SCRIPT], capture_output=True, text=True
    )
    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {result.stderr}")
    return {"message": "Model retrained successfully", "log": result.stdout}


@router.get("/dashboard")
def admin_dashboard(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    total_users = db.query(models.User).count()
    total_predictions = db.query(models.Prediction).count()
    critical_count = db.query(models.Prediction).filter(models.Prediction.risk == "Critical").count()
    total_alerts = db.query(models.Alert).filter(models.Alert.resolved == False).count()  # noqa: E712

    return {
        "total_users": total_users,
        "total_predictions": total_predictions,
        "critical_predictions": critical_count,
        "open_alerts": total_alerts,
    }


@router.get("/admin/users", response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    return db.query(models.User).all()


@router.delete("/admin/predictions/{prediction_id}")
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    record = db.query(models.Prediction).filter(models.Prediction.id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found")
    db.delete(record)
    db.commit()
    return {"message": "Deleted"}
