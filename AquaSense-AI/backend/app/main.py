"""
main.py

AquaSense AI backend entrypoint. Wires together database, routers,
CORS, ML startup checks, and health endpoints.
"""

import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, engine
from .ml.predict_utils import verify_model_loaded
from .routers import (
    admin_router,
    auth_router,
    predict_router,
    recommendation_router,
    trend_router,
    weather_router,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aquasense.main")

# Create all database tables (idempotent) on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AquaSense AI",
    description="AI-Based Groundwater Decision Support System API",
    version="1.0.0",
)

# Configure CORS for production (supports Vercel, Render, local dev)
cors_env = os.getenv("CORS_ORIGINS", "*")
if cors_env == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in cors_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api prefix
app.include_router(auth_router.router, prefix="/api")
app.include_router(predict_router.router, prefix="/api")
app.include_router(weather_router.router, prefix="/api")
app.include_router(recommendation_router.router, prefix="/api")
app.include_router(trend_router.router, prefix="/api")
app.include_router(admin_router.router, prefix="/api")


@app.on_event("startup")
def startup_checks():
    model_ok = verify_model_loaded()
    if model_ok:
        logger.info("✓ AquaSense ML Model loaded successfully.")
    else:
        logger.warning("! AquaSense running with hydrological fallback engine.")


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "AquaSense AI Backend API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    model_status = "loaded" if verify_model_loaded() else "fallback"
    return {
        "status": "healthy",
        "database": "connected",
        "model_status": model_status,
    }
