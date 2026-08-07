"""
calculators.py

Calculators and decision-support algorithms:
1. Precision Smart Irrigation Advisory
2. Agricultural Water Consumption Calculator
3. Rainwater Harvesting & Artificial Recharge Estimator
4. Agro-Hydro Crop Suitability Engine
5. Borewell Drilling & Financial Cost Estimator
"""

from typing import Dict, List, Any


def calculate_smart_irrigation(
    crop: str,
    land_area_acres: float,
    soil_type: str,
    current_water_table_m: float,
) -> Dict[str, Any]:
    """
    Computes daily water requirement (m³) and potential savings vs traditional flood irrigation.
    """
    # Crop coefficient base water requirement per acre (m3/day)
    crop_req_map = {
        "Paddy": 45.0,
        "Sugarcane": 55.0,
        "Cotton": 28.0,
        "Maize": 22.0,
        "Millets": 14.0,
        "Groundnut": 18.0,
        "Banana": 40.0,
        "Vegetables": 20.0,
    }

    base_req = crop_req_map.get(crop, 25.0)
    soil_mult = 1.15 if soil_type.lower() == "sandy" else (0.90 if soil_type.lower() == "clay" else 1.0)

    daily_req = round(base_req * land_area_acres * soil_mult, 1)
    water_saving_pct = 42.5  # Drip/sprinkler efficiency savings vs flood irrigation

    timing = "Early Morning (06:00 AM – 08:30 AM) or Late Evening (05:30 PM – 07:30 PM)"
    summary = f"Optimal micro-irrigation schedule for {land_area_acres} acres of {crop} on {soil_type} soil: apply {daily_req} m³ water daily across split cycles."

    return {
        "daily_water_req_m3": daily_req,
        "water_saving_pct": water_saving_pct,
        "recommended_timing": timing,
        "schedule_summary": summary,
    }


def calculate_water_consumption(
    crop: str,
    land_area_acres: float,
    water_source: str,
    current_water_table_m: float,
) -> Dict[str, Any]:
    """
    Calculates total crop season water demand and security horizon in days.
    """
    base_season_m3_per_acre = {
        "Paddy": 4500.0,
        "Sugarcane": 7200.0,
        "Cotton": 2800.0,
        "Maize": 2200.0,
        "Millets": 1200.0,
        "Groundnut": 1600.0,
    }.get(crop, 2500.0)

    req_water = round(base_season_m3_per_acre * land_area_acres, 1)

    # Estimate available storage based on water table depth
    storage_depth = max(1.0, 20.0 - current_water_table_m)
    avail_water = round(storage_depth * land_area_acres * 350.0, 1)

    security_days = int(min(365, (avail_water / (req_water / 115.0))))

    rec = "Water storage capacity is adequate for the full crop lifecycle." if security_days > 90 else "Water stress probable. Switch to low-water deficit irrigation."

    return {
        "required_water_m3": req_water,
        "available_water_m3": avail_water,
        "security_days": security_days,
        "recommendation": rec,
    }


def calculate_rainwater_harvesting(
    roof_area_sqm: float,
    annual_rainfall_mm: float,
    runoff_coefficient: float = 0.85,
) -> Dict[str, Any]:
    """
    Computes annual harvestable rainwater volume (Liters), storage tank capacity, and recharge potential.
    """
    harvestable_liters = round(roof_area_sqm * annual_rainfall_mm * runoff_coefficient, 1)
    tank_size = round(harvestable_liters * 0.20, 1)  # 20% rule of thumb for peak monsoon surge storage
    recharge_potential = round(harvestable_liters * 0.80, 1)
    efficiency_score = round(min(98.0, 75.0 + (roof_area_sqm / 50.0)), 1)

    return {
        "harvestable_water_liters": harvestable_liters,
        "recommended_tank_size_liters": tank_size,
        "recharge_potential_liters": recharge_potential,
        "efficiency_score": efficiency_score,
    }


def recommend_crops(
    district: str,
    groundwater_level_m: float,
    rainfall_mm: float,
    temperature_c: float,
    soil_type: str,
) -> Dict[str, Any]:
    """
    Agro-hydro crop selection engine matching crops to current water availability and soil profile.
    """
    crops_master = [
        {"crop_name": "Millets (Ragi/Bajra)", "min_rain": 20.0, "max_depth": 18.0, "yield": 1.4, "water_int": "Low"},
        {"crop_name": "Groundnut", "min_rain": 35.0, "max_depth": 14.0, "yield": 1.8, "water_int": "Medium-Low"},
        {"crop_name": "Maize", "min_rain": 45.0, "max_depth": 12.0, "yield": 2.6, "water_int": "Medium"},
        {"crop_name": "Pulses (Blackgram/Redgram)", "min_rain": 25.0, "max_depth": 16.0, "yield": 1.1, "water_int": "Low"},
        {"crop_name": "Paddy (Rice)", "min_rain": 85.0, "max_depth": 6.0, "yield": 3.8, "water_int": "High"},
        {"crop_name": "Sugarcane", "min_rain": 110.0, "max_depth": 5.0, "yield": 42.0, "water_int": "Very High"},
    ]

    recommendations = []
    for c in crops_master:
        score = 85.0
        if groundwater_level_m > c["max_depth"]:
            score -= 35.0
        if rainfall_mm < c["min_rain"]:
            score -= 20.0

        score = max(30.0, min(99.0, score))
        reason = f"Highly suited for {soil_type} soil with current water depth of {groundwater_level_m}m."

        recommendations.append({
            "crop_name": c["crop_name"],
            "suitability_score": score,
            "expected_yield_ton_acre": c["yield"],
            "water_intensity": c["water_int"],
            "recommendation_reason": reason,
        })

    recommendations.sort(key=lambda x: x["suitability_score"], reverse=True)
    return {"recommendations": recommendations}


def estimate_borewell_cost(
    target_depth_m: float,
    geology_type: str,
    casing_type: str,
) -> Dict[str, Any]:
    """
    Financial cost & yield estimation engine for borewell drilling operations.
    """
    depth_ft = target_depth_m * 3.28084
    rate_per_ft = 120.0 if geology_type.lower() == "alluvial" else (180.0 if geology_type.lower() == "hard rock" else 150.0)

    drilling_cost = round(depth_ft * rate_per_ft, 2)
    casing_rate = 220.0 if casing_type.upper() == "STEEL" else 130.0
    casing_cost = round(depth_ft * 0.4 * casing_rate, 2)
    pump_cost = 45000.0 if target_depth_m > 80.0 else 32000.0

    total_cost = round(drilling_cost + casing_cost + pump_cost, 2)
    expected_yield_lph = round(max(1500.0, 12000.0 - (target_depth_m * 65.0)), 0)
    payback_years = round(total_cost / 65000.0, 1)

    return {
        "estimated_drilling_cost": drilling_cost,
        "casing_cost": casing_cost,
        "pump_cost": pump_cost,
        "total_estimated_cost": total_cost,
        "expected_yield_lph": expected_yield_lph,
        "roi_payback_years": payback_years,
    }
