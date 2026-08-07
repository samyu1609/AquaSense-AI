"""
routers/iot_router.py

IoT Telemetry & ESP32 Integration Router.
Endpoints:
POST /api/iot/telemetry -> Receive ESP32 sensor readings (Water Level, Temp, Humidity, Rain Gauge, Soil Moisture)
GET  /api/iot/live      -> Fetch latest sensor streams
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["iot"])


@router.post("/iot/telemetry", response_model=schemas.IoTSensorOut)
def receive_telemetry(payload: schemas.IoTSensorPayload, db: Session = Depends(get_db)):
    """Receives ESP32 sensor telemetry payload and saves to DB."""
    status = "Normal"
    if payload.water_level_m < 4.0:
        status = "Critical Depletion"
    elif payload.soil_moisture_pct < 25.0:
        status = "Low Soil Moisture"

    record = models.IoTSensorData(
        device_id=payload.device_id,
        district=payload.district,
        water_level_m=payload.water_level_m,
        temperature_c=payload.temperature_c,
        humidity_pct=payload.humidity_pct,
        rain_gauge_mm=payload.rain_gauge_mm,
        soil_moisture_pct=payload.soil_moisture_pct,
        status=status,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Auto alert if sensor detects critical water level
    if status == "Critical Depletion":
        alert = models.Alert(
            district=payload.district,
            message=f"ESP32 Sensor [{payload.device_id}] triggered critical water level alert: {payload.water_level_m}m in {payload.district}.",
            level="critical",
        )
        db.add(alert)
        db.commit()

    return record


@router.get("/iot/live", response_model=List[schemas.IoTSensorOut])
def get_live_sensors(district: str = Query("Chennai"), db: Session = Depends(get_db)):
    """Fetches latest IoT sensor telemetry stream."""
    records = (
        db.query(models.IoTSensorData)
        .filter(models.IoTSensorData.district == district)
        .order_by(models.IoTSensorData.recorded_at.desc())
        .limit(10)
        .all()
    )

    if not records:
        # Seed realistic live baseline sensor stream if DB is empty for demo/testing
        sample_sensors = [
            models.IoTSensorData(
                device_id="ESP32-NODE-01",
                district=district,
                water_level_m=9.4,
                temperature_c=31.2,
                humidity_pct=62.0,
                rain_gauge_mm=12.5,
                soil_moisture_pct=48.0,
                status="Normal",
            ),
            models.IoTSensorData(
                device_id="ESP32-NODE-02",
                district=district,
                water_level_m=3.8,
                temperature_c=33.5,
                humidity_pct=54.0,
                rain_gauge_mm=0.0,
                soil_moisture_pct=18.0,
                status="Critical Depletion",
            ),
        ]
        return sample_sensors

    return records
