"""
risk.py

Classifies a predicted groundwater level (in meters below ground level,
higher = better/safer) into a risk band with an associated colour code
for the GIS map and dashboard.
"""

from typing import Tuple


def classify_risk(level_m: float) -> Tuple[str, str]:
    """
    Returns (risk_label, colour_hex) for a given groundwater level in metres.

    >= 10 m  -> Safe     (green)
    5 - 10 m -> Moderate (yellow)
    < 5 m    -> Critical (red)
    """
    if level_m >= 10:
        return "Safe", "#22C55E"
    if level_m >= 5:
        return "Moderate", "#EAB308"
    return "Critical", "#EF4444"
