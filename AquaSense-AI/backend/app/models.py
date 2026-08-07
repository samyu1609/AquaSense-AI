"""
models.py

SQLAlchemy ORM models for every table in the system: Users, Groundwater,
Predictions, Weather, Recommendations, Alerts, Logs.
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")  # "user" or "admin"
    created_at = Column(DateTime, default=datetime.utcnow)

    predictions = relationship("Prediction", back_populates="user")


class Groundwater(Base):
    __tablename__ = "groundwater"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String(100))
    district = Column(String(100), index=True)
    block = Column(String(100))
    village = Column(String(100))
    observation_well = Column(String(50))
    latitude = Column(Float)
    longitude = Column(Float)
    date = Column(DateTime)
    groundwater_level = Column(Float)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    district = Column(String(100), index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    predicted_level = Column(Float)
    confidence = Column(Float)
    risk = Column(String(20))
    model_used = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predictions")


class Weather(Base):
    __tablename__ = "weather"

    id = Column(Integer, primary_key=True, index=True)
    district = Column(String(100), index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    rainfall = Column(Float)
    pressure = Column(Float)
    wind_speed = Column(Float)
    fetched_at = Column(DateTime, default=datetime.utcnow)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"))
    text = Column(Text)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    district = Column(String(100), index=True)
    message = Column(Text)
    level = Column(String(20))  # info / warning / critical
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(200))
    detail = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class IoTSensorData(Base):
    __tablename__ = "iot_sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), index=True)
    district = Column(String(100))
    water_level_m = Column(Float)
    temperature_c = Column(Float)
    humidity_pct = Column(Float)
    rain_gauge_mm = Column(Float)
    soil_moisture_pct = Column(Float)
    status = Column(String(30), default="Normal")
    recorded_at = Column(DateTime, default=datetime.utcnow)


class BorewellRecommendation(Base):
    __tablename__ = "borewell_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    district = Column(String(100), index=True)
    boundary_geojson = Column(Text)
    best_lat = Column(Float)
    best_lon = Column(Float)
    success_probability = Column(Float)
    recommended_depth_m = Column(Float)
    expected_water_level_m = Column(Float)
    risk_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

