from typing import Iterable

from .schemas import Zone, Habitation, SafeSite


DEFAULT_HABITATION_WEIGHTS = {
    "risk": 0.60,
    "population": 0.40,
}

DEFAULT_SITE_WEIGHTS = {
    "capacity": 0.50,
    "land": 0.25,
    "infrastructure": 0.25,
}

RISK_LEVEL_SCORE = {
    "low": 1 / 3,
    "medium": 2 / 3,
    "high": 1.0,
}


def _validate_weight_sum(weights: dict[str, float]) -> None:
    if not weights:
        raise ValueError("Weights cannot be empty.")

    if any(weight < 0 or weight > 1 for weight in weights.values()):
        raise ValueError("Each weight must be between 0 and 1.")

    if abs(sum(weights.values()) - 1.0) > 1e-9:
        raise ValueError("Weights must sum to 1.")


def _min_max_normalize(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    if maximum == minimum:
        return 0.5

    return (value - minimum) / (maximum - minimum)


def _priority_category(score: float) -> str:
    if score >= 0.67:
        return "HIGH"

    if score >= 0.34:
        return "MEDIUM"

    return "LOW"


def _validate_habitation(habitation: Habitation) -> None:
    if habitation.population < 0:
        raise ValueError(
            f"Population cannot be negative: {habitation.habitation_id}"
        )


def _validate_site(site: SafeSite) -> None:
    if not 0 <= site.capacity_score <= 1:
        raise ValueError(
            f"capacity_score must be between 0 and 1: {site.site_id}"
        )

    if site.available_land < 0:
        raise ValueError(
            f"available_land cannot be negative: {site.site_id}"
        )

    if not 0 <= site.infra_access <= 1:
        raise ValueError(
            f"infra_access must be between 0 and 1: {site.site_id}"
        )


def calculate_habitation_priorities(
    habitations: Iterable[Habitation],
    zones: Iterable[Zone],
    weights: dict[str, float] | None = None,
) -> list[dict]:
    """
    Calculate transparent relocation-priority scores for habitations.

    NOTE:
    The default weights and risk mapping are prototype development
    defaults and must be validated before being treated as final
    methodology.
    """

    weights = weights or DEFAULT_HABITATION_WEIGHTS.copy()

    _validate_weight_sum(weights)

    required_weights = {"risk", "population"}

    if set(weights.keys()) != required_weights:
        raise ValueError(
            f"Habitation weights must contain exactly: {required_weights}"
        )

    habitations = list(habitations)
    zones = list(zones)

    zone_by_id = {
        zone.zone_id: zone
        for zone in zones
    }

    for habitation in habitations:
        _validate_habitation(habitation)

        if not habitation.current_zone_id:
            raise ValueError(
                f"Missing current_zone_id: {habitation.habitation_id}"
            )

        if habitation.current_zone_id not in zone_by_id:
            raise ValueError(
                f"Unknown current_zone_id "
                f"'{habitation.current_zone_id}' for "
                f"{habitation.habitation_id}"
            )

    populations = [
        habitation.population
        for habitation in habitations
    ]

    population_min = min(populations) if populations else 0
    population_max = max(populations) if populations else 0

    results = []

    for habitation in habitations:
        zone = zone_by_id[habitation.current_zone_id]

        if zone.risk_level not in RISK_LEVEL_SCORE:
            raise ValueError(
                f"Invalid risk_level '{zone.risk_level}' "
                f"for zone {zone.zone_id}"
            )

        normalized_risk = RISK_LEVEL_SCORE[zone.risk_level]

        normalized_population = _min_max_normalize(
            habitation.population,
            population_min,
            population_max,
        )

        risk_contribution = (
            weights["risk"] * normalized_risk
        )

        population_contribution = (
            weights["population"] * normalized_population
        )

        priority_score = (
            risk_contribution
            + population_contribution
        )

        results.append(
            {
                "habitation_id": habitation.habitation_id,
                "name": habitation.name,
                "priority_score": round(priority_score, 6),
                "priority": _priority_category(priority_score),
                "explanation": {
                    "risk_level": zone.risk_level,
                    "normalized_risk": round(
                        normalized_risk,
                        6,
                    ),
                    "risk_weight": weights["risk"],
                    "risk_contribution": round(
                        risk_contribution,
                        6,
                    ),
                    "population": habitation.population,
                    "normalized_population": round(
                        normalized_population,
                        6,
                    ),
                    "population_weight": weights["population"],
                    "population_contribution": round(
                        population_contribution,
                        6,
                    ),
                },
            }
        )

    results.sort(
        key=lambda result: result["priority_score"],
        reverse=True,
    )

    return results


def calculate_site_suitability(
    sites: Iterable[SafeSite],
    weights: dict[str, float] | None = None,
) -> list[dict]:
    """
    Calculate transparent suitability scores for relocation sites.

    NOTE:
    The default weights are prototype development defaults and must
    be validated before being treated as final methodology.
    """

    weights = weights or DEFAULT_SITE_WEIGHTS.copy()

    _validate_weight_sum(weights)

    required_weights = {
        "capacity",
        "land",
        "infrastructure",
    }

    if set(weights.keys()) != required_weights:
        raise ValueError(
            "Site weights must contain exactly: "
            f"{required_weights}"
        )

    sites = list(sites)

    for site in sites:
        _validate_site(site)

    lands = [
        site.available_land
        for site in sites
    ]

    land_min = min(lands) if lands else 0
    land_max = max(lands) if lands else 0

    results = []

    for site in sites:
        normalized_land = _min_max_normalize(
            site.available_land,
            land_min,
            land_max,
        )

        capacity_contribution = (
            weights["capacity"]
            * site.capacity_score
        )

        land_contribution = (
            weights["land"]
            * normalized_land
        )

        infrastructure_contribution = (
            weights["infrastructure"]
            * site.infra_access
        )

        suitability_score = (
            capacity_contribution
            + land_contribution
            + infrastructure_contribution
        )

        results.append(
            {
                "site_id": site.site_id,
                "suitability_score": round(
                    suitability_score,
                    6,
                ),
                "explanation": {
                    "capacity_score": site.capacity_score,
                    "capacity_weight": weights["capacity"],
                    "capacity_contribution": round(
                        capacity_contribution,
                        6,
                    ),
                    "available_land": site.available_land,
                    "normalized_land": round(
                        normalized_land,
                        6,
                    ),
                    "land_weight": weights["land"],
                    "land_contribution": round(
                        land_contribution,
                        6,
                    ),
                    "infra_access": site.infra_access,
                    "infrastructure_weight": weights["infrastructure"],
                    "infrastructure_contribution": round(
                        infrastructure_contribution,
                        6,
                    ),
                },
            }
        )

    results.sort(
        key=lambda result: result["suitability_score"],
        reverse=True,
    )

    return results