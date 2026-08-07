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


class DailyForecastItem(BaseModel):
    date: str
    day_label: str
    groundwater_level: float
    confidence: float
    risk: str
    risk_colour: str
    recommendation: str
    temperature: float
    rainfall: float
    humidity: float


class ForecastLocation(BaseModel):
    district: str
    latitude: float
    longitude: float


class ForecastWeather(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    pressure: float
    wind_speed: float
    source: str


class ForecastResponse(BaseModel):
    location: ForecastLocation
    weather: ForecastWeather
    today_prediction: DailyForecastItem
    forecast: List[DailyForecastItem]


# --- New Feature Schemas ---

class LatLngPoint(BaseModel):
    lat: float
    lng: float


class BorewellSiteRequest(BaseModel):
    district: str
    boundary_points: List[LatLngPoint]
    grid_density: Optional[int] = 5


class BorewellSiteCandidate(BaseModel):
    lat: float
    lng: float
    predicted_level_m: float
    risk: str
    risk_colour: str
    success_probability: float
    recommended_depth_m: float
    risk_score: float


class BorewellSiteResponse(BaseModel):
    district: str
    best_location: BorewellSiteCandidate
    candidates: List[BorewellSiteCandidate]
    overall_risk_score: float
    summary: str


class ShapFeatureAttribution(BaseModel):
    feature: str
    contribution: float
    direction: str  # "increases_level" or "decreases_level"


class ShapExplanationResponse(BaseModel):
    base_value: float
    prediction_value: float
    attributions: List[ShapFeatureAttribution]


class IoTSensorPayload(BaseModel):
    device_id: str
    district: str
    water_level_m: float
    temperature_c: float
    humidity_pct: float
    rain_gauge_mm: float
    soil_moisture_pct: float


class IoTSensorOut(BaseModel):
    id: int
    device_id: str
    district: str
    water_level_m: float
    temperature_c: float
    humidity_pct: float
    rain_gauge_mm: float
    soil_moisture_pct: float
    status: str
    recorded_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class ExtendedForecastResponse(BaseModel):
    district: str
    horizon_7d: List[DailyForecastItem]
    horizon_30d: List[DailyForecastItem]
    horizon_90d: List[DailyForecastItem]
    horizon_1y: List[DailyForecastItem]


class SmartIrrigationRequest(BaseModel):
    crop: str
    land_area_acres: float
    soil_type: str
    current_water_table_m: float


class SmartIrrigationResponse(BaseModel):
    daily_water_req_m3: float
    water_saving_pct: float
    recommended_timing: str
    schedule_summary: str


class WaterConsumptionRequest(BaseModel):
    crop: str
    land_area_acres: float
    water_source: str
    current_water_table_m: float


class WaterConsumptionResponse(BaseModel):
    required_water_m3: float
    available_water_m3: float
    security_days: int
    recommendation: str


class RainwaterHarvestingRequest(BaseModel):
    roof_area_sqm: float
    annual_rainfall_mm: float
    runoff_coefficient: Optional[float] = 0.85


class RainwaterHarvestingResponse(BaseModel):
    harvestable_water_liters: float
    recommended_tank_size_liters: float
    recharge_potential_liters: float
    efficiency_score: float


class CropRecommendationRequest(BaseModel):
    district: str
    groundwater_level_m: float
    rainfall_mm: float
    temperature_c: float
    soil_type: str


class CropRecommendationItem(BaseModel):
    crop_name: str
    suitability_score: float
    expected_yield_ton_acre: float
    water_intensity: str
    recommendation_reason: str


class CropRecommendationResponse(BaseModel):
    recommendations: List[CropRecommendationItem]


class BorewellCostRequest(BaseModel):
    target_depth_m: float
    geology_type: str  # "Hard Rock", "Alluvial", "Sedimentary"
    casing_type: str  # "PVC", "Steel"


class BorewellCostResponse(BaseModel):
    estimated_drilling_cost: float
    casing_cost: float
    pump_cost: float
    total_estimated_cost: float
    expected_yield_lph: float
    roi_payback_years: float


class DispatchAlertRequest(BaseModel):
    district: str
    message: str
    channels: List[str]  # ["Email", "SMS", "Push"]
    level: str  # "info", "warning", "critical"


