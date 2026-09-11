import pytest
from m4.risk_engine import (
    calculate_hazard_scores,
    calculate_exposure_scores,
    calculate_vulnerability_scores,
    calculate_risk_scores,
    classify_risk_score,
)

def test_complete_pipeline_and_reconciliation():
    hazard = calculate_hazard_scores([{
        "habitation_id": "H1",
        "flood_score": 1.0,
        "landslide_score": 0.8,
        "rainfall_score": 0.6,
    }])[0]
    assert hazard["hazard_score"] == 0.83

    exposure = calculate_exposure_scores([{
        "habitation_id": "H1",
        "population": 1000,
        "exposed_area_ratio": 1.0,
    }])[0]
    assert exposure["exposure_score"] == 0.65

    vulnerability = calculate_vulnerability_scores([{
        "habitation_id": "H1",
        "vulnerable_population_ratio": 0.8,
        "infrastructure_vulnerability": 0.7,
        "access_constraint": 0.6,
    }])[0]
    assert vulnerability["vulnerability_score"] == 0.73

    risk = calculate_risk_scores([{
        "habitation_id": "H1",
        "hazard_score": hazard["hazard_score"],
        "exposure_score": exposure["exposure_score"],
        "vulnerability_score": vulnerability["vulnerability_score"],
    }])[0]
    assert risk["risk_score"] == 0.756
    assert risk["risk_level"] == "HIGH"

    explanation = risk["explanation"]
    total = (
        explanation["hazard_contribution"]
        + explanation["exposure_contribution"]
        + explanation["vulnerability_contribution"]
    )
    assert round(total, 6) == risk["risk_score"]

def test_risk_boundaries():
    assert classify_risk_score(0.67) == "HIGH"
    assert classify_risk_score(0.34) == "MEDIUM"
    assert classify_risk_score(0.33) == "LOW"

def test_invalid_inputs():
    with pytest.raises(ValueError):
        calculate_hazard_scores([{
            "habitation_id": "H1",
            "flood_score": 2,
            "landslide_score": 0,
            "rainfall_score": 0,
        }])
    with pytest.raises(ValueError):
        calculate_risk_scores([{
            "habitation_id": "H1",
            "hazard_score": -1,
            "exposure_score": 0,
            "vulnerability_score": 0,
        }])
