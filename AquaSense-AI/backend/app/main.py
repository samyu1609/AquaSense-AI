"""
main.py

AquaSense AI backend entrypoint. Wires together the database, routers,
CORS, and creates tables on startup.

Run locally:
    uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, engine
from .routers import (
    admin_router,
    auth_router,
    predict_router,
    recommendation_router,
    trend_router,
    weather_router,
)

# Create all tables (idempotent) on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AquaSense AI",
    description="AI-Based Groundwater Decision Support System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api")
app.include_router(predict_router.router, prefix="/api")
app.include_router(weather_router.router, prefix="/api")
app.include_router(recommendation_router.router, prefix="/api")
app.include_router(trend_router.router, prefix="/api")
app.include_router(admin_router.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "service": "AquaSense AI backend"}


@app.get("/health")
def health():
    return {"status": "healthy"}
