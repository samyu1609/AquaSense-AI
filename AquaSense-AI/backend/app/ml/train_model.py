"""
train_model.py

Trains three regression models on groundwater_master.csv, compares them on
MAE / RMSE / R^2, and persists the best-performing model + preprocessing
artifacts to disk for use by the prediction API.

Run:
    python train_model.py
"""

import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("xgboost not installed in this environment — skipping it "
          "(pip install xgboost to enable it; requirements.txt already lists it).")

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/app
DATA_PATH = BASE_DIR / "data" / "groundwater_master.csv"
MODEL_PATH = BASE_DIR / "ml" / "groundwater_model.pkl"
METRICS_PATH = BASE_DIR / "ml" / "model_metrics.json"

FEATURES = [
    "Latitude", "Longitude", "District_enc", "Rainfall_mm", "Temperature_C",
    "Humidity_pct", "Solar_Radiation", "Wind_Speed", "Previous_Groundwater_Level",
    "Month", "Season_enc", "Is_Monsoon", "Rainfall_Lag1",
]
TARGET = "Groundwater_Level"


def load_and_prepare():
    df = pd.read_csv(DATA_PATH)

    district_encoder = LabelEncoder()
    season_encoder = LabelEncoder()
    df["District_enc"] = district_encoder.fit_transform(df["District"])
    df["Season_enc"] = season_encoder.fit_transform(df["Season"])

    X = df[FEATURES]
    y = df[TARGET]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, district_encoder, season_encoder, scaler


def evaluate(name, model, X_test, y_test):
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    r2 = r2_score(y_test, preds)
    print(f"{name:20s} MAE={mae:.4f}  RMSE={rmse:.4f}  R2={r2:.4f}")
    return {"model": name, "mae": mae, "rmse": rmse, "r2": r2}


def main():
    X, y, district_encoder, season_encoder, scaler = load_and_prepare()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    candidates = {
        "LinearRegression": LinearRegression(),
        "RandomForest": RandomForestRegressor(
            n_estimators=200, max_depth=12, random_state=42, n_jobs=-1
        ),
    }
    if HAS_XGBOOST:
        candidates["XGBoost"] = XGBRegressor(
            n_estimators=300, max_depth=6, learning_rate=0.05,
            random_state=42, n_jobs=-1
        )

    results = []
    fitted = {}
    for name, model in candidates.items():
        model.fit(X_train, y_train)
        fitted[name] = model
        results.append(evaluate(name, model, X_test, y_test))

    # Best model = highest R^2 (ties broken by lowest RMSE)
    best = sorted(results, key=lambda r: (-r["r2"], r["rmse"]))[0]
    best_model = fitted[best["model"]]
    print(f"\nSelected best model: {best['model']}")

    artifact = {
        "model": best_model,
        "model_name": best["model"],
        "district_encoder": district_encoder,
        "season_encoder": season_encoder,
        "scaler": scaler,
        "features": FEATURES,
    }
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(artifact, f)

    with open(METRICS_PATH, "w") as f:
        json.dump({"results": results, "best": best["model"]}, f, indent=2)

    print(f"Saved model -> {MODEL_PATH}")
    print(f"Saved metrics -> {METRICS_PATH}")


if __name__ == "__main__":
    main()
