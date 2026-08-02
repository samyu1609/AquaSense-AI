"""
recommend.py

Rule-based recommendation engine. Maps a risk classification to a list of
actionable water-management recommendations for farmers / officials.
"""

from typing import List

RECOMMENDATIONS = {
    "Critical": [
        "Avoid new borewell drilling in this area",
        "Switch to drip irrigation to minimise water use",
        "Install rainwater harvesting structures",
        "Reduce groundwater pumping hours immediately",
        "Grow low-water-intensity crops (millets, pulses) instead of paddy/sugarcane",
    ],
    "Moderate": [
        "Use sprinkler irrigation instead of flood irrigation",
        "Monitor groundwater levels monthly",
        "Plan crop water budgets around expected rainfall",
    ],
    "Safe": [
        "Continue current sustainable water usage practices",
        "Maintain periodic monitoring to catch early decline",
    ],
}


def get_recommendations(risk_label: str) -> List[str]:
    return RECOMMENDATIONS.get(risk_label, RECOMMENDATIONS["Moderate"])
