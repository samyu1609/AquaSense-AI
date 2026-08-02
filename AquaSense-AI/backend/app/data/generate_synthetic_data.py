"""
generate_synthetic_data.py

Generates a realistic synthetic groundwater dataset that mirrors the schema
of the real CGWB (groundwater level), IMD (rainfall), and NASA POWER
(temperature / humidity / solar radiation / wind speed) datasets.

WHY SYNTHETIC: this sandbox has no internet access, so the real CGWB/IMD/
NASA POWER files can't be downloaded here. This script produces data with
the exact same column structure the real datasets use, so the ML pipeline
below (train_model.py) is a drop-in replacement once you place the real
CSVs in this folder with matching column names.

Output: backend/app/data/groundwater_master.csv
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)

# Tamil Nadu districts with approximate lat/lon centroids
DISTRICTS = {
    "Chennai": (13.0827, 80.2707),
    "Coimbatore": (11.0168, 76.9558),
    "Madurai": (9.9252, 78.1198),
    "Salem": (11.6643, 78.1460),
    "Tiruchirappalli": (10.7905, 78.7047),
    "Tirunelveli": (8.7139, 77.7567),
    "Erode": (11.3410, 77.7172),
    "Vellore": (12.9165, 79.1325),
    "Thanjavur": (10.7870, 79.1378),
    "Dindigul": (10.3673, 77.9803),
    "Cuddalore": (11.7480, 79.7714),
    "Kanyakumari": (8.0883, 77.5385),
}

BLOCKS_PER_DISTRICT = 3
VILLAGES_PER_BLOCK = 2
DATE_RANGE = pd.date_range(start="2018-01-01", end="2025-12-01", freq="MS")  # monthly


def seasonal_rainfall(month: int, base: float) -> float:
    """Tamil Nadu gets most rain Oct-Dec (northeast monsoon) + some Jun-Sep."""
    if month in (10, 11, 12):
        return base * np.random.uniform(2.0, 3.5)
    if month in (6, 7, 8, 9):
        return base * np.random.uniform(1.2, 2.0)
    return base * np.random.uniform(0.1, 0.6)


def seasonal_temp(month: int) -> float:
    """Peak summer Apr-Jun, cooler Dec-Jan for TN."""
    if month in (4, 5, 6):
        return np.random.uniform(33, 40)
    if month in (12, 1):
        return np.random.uniform(22, 27)
    return np.random.uniform(27, 33)


def get_season(month: int) -> str:
    if month in (12, 1, 2):
        return "Winter"
    if month in (3, 4, 5):
        return "Summer"
    if month in (6, 7, 8, 9):
        return "Monsoon"
    return "Post-Monsoon"


rows = []
well_id = 1000

for district, (dlat, dlon) in DISTRICTS.items():
    # base groundwater level differs per district (coastal vs interior)
    district_base_level = np.random.uniform(4, 15)

    for b in range(BLOCKS_PER_DISTRICT):
        block_name = f"{district} Block {b+1}"
        for v in range(VILLAGES_PER_BLOCK):
            village_name = f"{district} Village {b+1}-{v+1}"
            well_id += 1
            lat = dlat + np.random.uniform(-0.25, 0.25)
            lon = dlon + np.random.uniform(-0.25, 0.25)

            prev_level = district_base_level
            for date in DATE_RANGE:
                month = date.month
                rainfall = round(seasonal_rainfall(month, base=20), 2)
                temperature = round(seasonal_temp(month), 2)
                humidity = round(np.clip(np.random.normal(65, 12), 30, 95), 2)
                solar_radiation = round(np.random.uniform(14, 24), 2)  # MJ/m^2/day
                wind_speed = round(np.random.uniform(1.5, 6.5), 2)  # m/s

                # Groundwater dynamics: rises with rainfall, depletes over dry months
                recharge = rainfall * 0.015
                depletion = np.random.uniform(0.05, 0.25)
                level = prev_level + recharge - depletion
                level = float(np.clip(level, 0.5, 25))

                rows.append({
                    "State": "Tamil Nadu",
                    "District": district,
                    "Block": block_name,
                    "Village": village_name,
                    "Observation_Well": f"OW-{well_id}",
                    "Latitude": round(lat, 5),
                    "Longitude": round(lon, 5),
                    "Date": date.strftime("%Y-%m-%d"),
                    "Month": month,
                    "Season": get_season(month),
                    "Rainfall_mm": rainfall,
                    "Temperature_C": temperature,
                    "Humidity_pct": humidity,
                    "Solar_Radiation": solar_radiation,
                    "Wind_Speed": wind_speed,
                    "Previous_Groundwater_Level": round(prev_level, 2),
                    "Groundwater_Level": round(level, 2),
                })
                prev_level = level

df = pd.DataFrame(rows)

# --- Cleaning pipeline ---
df = df.drop_duplicates()
df = df.dropna()

# --- Feature engineering ---
df["Rainfall_Lag1"] = df.groupby("Observation_Well")["Rainfall_mm"].shift(1).fillna(df["Rainfall_mm"].mean())
df["Level_Change"] = df["Groundwater_Level"] - df["Previous_Groundwater_Level"]
df["Is_Monsoon"] = df["Season"].isin(["Monsoon", "Post-Monsoon"]).astype(int)

out_path = "/home/claude/AquaSense-AI/backend/app/data/groundwater_master.csv"
df.to_csv(out_path, index=False)
print(f"Generated {len(df)} rows -> {out_path}")
print(df.head())
