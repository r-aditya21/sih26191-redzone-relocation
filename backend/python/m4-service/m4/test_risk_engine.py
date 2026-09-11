import pytest

from m4.risk_engine import (
    calculate_habitation_priorities,
    calculate_site_suitability,
)
from m4.schemas import Zone, Habitation, SafeSite


def test_high_risk_large_population_ranks_first():
    zones = [
        Zone(
            zone_id="Z1",
            hazard_type="landslide",
            risk_level="high",
        ),
        Zone(
            zone_id="Z2",
            hazard_type="flood",
            risk_level="low",
        ),
    ]

    habitations = [
        Habitation(
            habitation_id="H1",
            name="Village A",
            population=1000,
            current_zone_id="Z1",
        ),
        Habitation(
            habitation_id="H2",
            name="Village B",
            population=100,
            current_zone_id="Z2",
        ),
    ]

    results = calculate_habitation_priorities(
        habitations,
        zones,
    )

    assert results[0]["habitation_id"] == "H1"
    assert results[0]["priority"] == "HIGH"


def test_better_safe_site_scores_higher():
    sites = [
        SafeSite(
            site_id="S1",
            capacity_score=0.9,
            available_land=10.0,
            infra_access=0.9,
        ),
        SafeSite(
            site_id="S2",
            capacity_score=0.4,
            available_land=2.0,
            infra_access=0.4,
        ),
    ]

    results = calculate_site_suitability(sites)

    assert results[0]["site_id"] == "S1"
    assert results[0]["suitability_score"] > results[1]["suitability_score"]


def test_negative_population_is_rejected():
    zones = [
        Zone(
            zone_id="Z1",
            hazard_type="landslide",
            risk_level="high",
        )
    ]

    habitations = [
        Habitation(
            habitation_id="H1",
            name="Invalid Village",
            population=-100,
            current_zone_id="Z1",
        )
    ]

    with pytest.raises(ValueError):
        calculate_habitation_priorities(
            habitations,
            zones,
        )


def test_invalid_capacity_is_rejected():
    sites = [
        SafeSite(
            site_id="S1",
            capacity_score=1.5,
            available_land=10.0,
            infra_access=0.8,
        )
    ]

    with pytest.raises(ValueError):
        calculate_site_suitability(sites)


def test_weights_must_sum_to_one():
    zones = [
        Zone(
            zone_id="Z1",
            hazard_type="landslide",
            risk_level="high",
        )
    ]

    habitations = [
        Habitation(
            habitation_id="H1",
            name="Village A",
            population=500,
            current_zone_id="Z1",
        )
    ]

    invalid_weights = {
        "risk": 0.8,
        "population": 0.5,
    }

    with pytest.raises(ValueError):
        calculate_habitation_priorities(
            habitations,
            zones,
            weights=invalid_weights,
        )
def test_missing_current_zone_id_is_rejected():
    zones = [
        Zone(
            zone_id="Z1",
            hazard_type="landslide",
            risk_level="high",
        )
    ]

    habitations = [
        Habitation(
            habitation_id="H1",
            name="Village A",
            population=500,
            current_zone_id=None,
        )
    ]

    with pytest.raises(ValueError):
        calculate_habitation_priorities(
            habitations,
            zones,
        )


def test_unknown_zone_reference_is_rejected():
    zones = [
        Zone(
            zone_id="Z1",
            hazard_type="landslide",
            risk_level="high",
        )
    ]

    habitations = [
        Habitation(
            habitation_id="H1",
            name="Village A",
            population=500,
            current_zone_id="Z999",
        )
    ]

    with pytest.raises(ValueError):
        calculate_habitation_priorities(
            habitations,
            zones,
        )


def test_invalid_infrastructure_access_is_rejected():
    sites = [
        SafeSite(
            site_id="S1",
            capacity_score=0.8,
            available_land=10.0,
            infra_access=1.5,
        )
    ]

    with pytest.raises(ValueError):
        calculate_site_suitability(sites)


def test_invalid_risk_level_is_rejected():
    zones = [
        Zone(
            zone_id="Z1",
            hazard_type="landslide",
            risk_level="extreme",
        )
    ]

    habitations = [
        Habitation(
            habitation_id="H1",
            name="Village A",
            population=500,
            current_zone_id="Z1",
        )
    ]

    with pytest.raises(ValueError):
        calculate_habitation_priorities(
            habitations,
            zones,
        )


def test_zero_population_is_valid():
    zones = [
        Zone(
            zone_id="Z1",
            hazard_type="landslide",
            risk_level="high",
        )
    ]

    habitations = [
        Habitation(
            habitation_id="H1",
            name="Village A",
            population=0,
            current_zone_id="Z1",
        )
    ]

    results = calculate_habitation_priorities(
        habitations,
        zones,
    )

    assert len(results) == 1
    assert results[0]["priority_score"] >= 0


def test_zero_available_land_is_valid():
    sites = [
        SafeSite(
            site_id="S1",
            capacity_score=0.8,
            available_land=0.0,
            infra_access=0.7,
        )
    ]

    results = calculate_site_suitability(sites)

    assert len(results) == 1
    assert results[0]["suitability_score"] >= 0


def test_constant_population_values_are_handled():
    zones = [
        Zone(
            zone_id="Z1",
            hazard_type="landslide",
            risk_level="high",
        ),
        Zone(
            zone_id="Z2",
            hazard_type="flood",
            risk_level="low",
        ),
    ]

    habitations = [
        Habitation(
            habitation_id="H1",
            name="Village A",
            population=500,
            current_zone_id="Z1",
        ),
        Habitation(
            habitation_id="H2",
            name="Village B",
            population=500,
            current_zone_id="Z2",
        ),
    ]

    results = calculate_habitation_priorities(
        habitations,
        zones,
    )

    assert len(results) == 2
    assert all(
        0 <= result["priority_score"] <= 1
        for result in results
    )


def test_empty_habitation_input_returns_empty_result():
    results = calculate_habitation_priorities(
        [],
        [],
    )

    assert results == []


def test_empty_site_input_returns_empty_result():
    results = calculate_site_suitability([])

    assert results == []