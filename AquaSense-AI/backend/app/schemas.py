"""
schemas.py

Pydantic models for request validation and response serialization.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    # Using plain str so login works even before email-validator is installed;
    # the DB lookup will simply return None for invalid addresses.
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        orm_mode = True
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class PredictionRequest(BaseModel):
    latitude: float
    longitude: float
    district: str
    rainfall_mm: float
    temperature_c: float
    humidity_pct: float
    previous_level: float
    month: int
    season: str


class PredictionResponse(BaseModel):
    predicted_level_m: float
    confidence: float
    risk: str
    risk_colour: str
    recommendations: List[str]
    model_used: str


class WeatherResponse(BaseModel):
    district: str
    temperature: float
    humidity: float
    rainfall: float
    pressure: float
    wind_speed: float
    source: str


class TrendPoint(BaseModel):
    date: str
    groundwater_level: float
    rainfall: Optional[float] = None
    temperature: Optional[float] = None


class HistoryItem(BaseModel):
    id: int
    district: str
    predicted_level: float
    risk: str
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
