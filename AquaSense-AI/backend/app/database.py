"""
database.py

Database engine and session factory. Dynamically selects PostgreSQL DSN
when DATABASE_URL is set, or defaults to SQLite for local development.
Includes strict DSN scheme validation to prevent deployment crashes from
invalid environment variables.
"""

import logging
import os

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger("aquasense.db")

raw_db_url = os.getenv("DATABASE_URL", "").strip()

# Render / Heroku Postgres DSNs start with postgres://
# SQLAlchemy 1.4+ / 2.0 requires postgresql://
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

# Valid database URI schemes
VALID_SCHEMES = ("sqlite://", "postgresql://", "mysql://", "oracle://", "mssql://")

if any(raw_db_url.startswith(scheme) for scheme in VALID_SCHEMES):
    DATABASE_URL = raw_db_url
else:
    if raw_db_url:
        logger.warning(f"[WARN] Invalid DATABASE_URL value '{raw_db_url}'. Falling back to SQLite ('sqlite:///./aquasense.db').")
    DATABASE_URL = "sqlite:///./aquasense.db"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
