"""
seed_admin.py

Creates a default admin account so you can log into the admin dashboard
immediately after first setup.

Run:
    python seed_admin.py
"""

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models import User

Base.metadata.create_all(bind=engine)
db = SessionLocal()

ADMIN_EMAIL = "admin@aquasense.ai"
ADMIN_PASSWORD = "ChangeMe123!"

existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
if existing:
    print("Admin already exists.")
else:
    admin = User(
        name="AquaSense Admin",
        email=ADMIN_EMAIL,
        hashed_password=hash_password(ADMIN_PASSWORD),
        role="admin",
    )
    db.add(admin)
    db.commit()
    print(f"Admin created: {ADMIN_EMAIL} / {ADMIN_PASSWORD}  (change this password immediately)")

db.close()
