from typing import Iterable
import math

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

    if any(
        not isinstance(weight, (int, float))
        or not math.isfinite(weight)
        or weight < 0
        or weight > 1
        for weight in weights.values()
    ):
        raise ValueError("Each weight must be a finite number between 0 and 1.")

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
from typing import Iterable
import math

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

    if any(
        not isinstance(weight, (int, float))
        or not math.isfinite(weight)
        or weight < 0
        or weight > 1
        for weight in weights.values()
    ):
        raise ValueError("Each weight must be a finite number between 0 and 1.")

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
# ---------------------------------------------------------------------------
# RakshaGrid M4 - Complete Risk Pipeline
# ---------------------------------------------------------------------------

DEFAULT_HAZARD_WEIGHTS = {
    "flood": 0.40,
    "landslide": 0.35,
    "rainfall": 0.25,
}

DEFAULT_EXPOSURE_WEIGHTS = {
    "population": 0.70,
    "exposed_area": 0.30,
}

DEFAULT_VULNERABILITY_WEIGHTS = {
    "vulnerable_population": 0.50,
    "infrastructure": 0.30,
    "access": 0.20,
}

DEFAULT_RISK_WEIGHTS = {
    "hazard": 0.50,
    "exposure": 0.30,
    "vulnerability": 0.20,
}


def _validate_score(value: float, name: str) -> None:
    if (
        not isinstance(value, (int, float))
        or not math.isfinite(value)
        or value < 0
        or value > 1
    ):
        raise ValueError(
            f"{name} must be a finite value between 0 and 1."
        )


def _validate_pipeline_weights(
    weights: dict[str, float],
) -> None:
    _validate_weight_sum(weights)


def _normalize_pipeline(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    if maximum == minimum:
        return 0.5

    return (value - minimum) / (maximum - minimum)


def calculate_hazard_scores(
    inputs: Iterable[dict],
    weights: dict[str, float] | None = None,
) -> list[dict]:
    """
    Calculate transparent multi-hazard scores.

    Prototype methodology:
        40% flood
        35% landslide
        25% rainfall

    All inputs are normalized to [0, 1].
    """

    weights = weights or DEFAULT_HAZARD_WEIGHTS.copy()
    _validate_pipeline_weights(weights)

    required = {"flood", "landslide", "rainfall"}
    if set(weights.keys()) != required:
        raise ValueError(
            "Hazard weights must contain exactly: "
            f"{required}"
        )

    results = []

    for item in inputs:
        flood = item["flood_score"]
        landslide = item["landslide_score"]
        rainfall = item["rainfall_score"]

        _validate_score(flood, "flood_score")
        _validate_score(landslide, "landslide_score")
        _validate_score(rainfall, "rainfall_score")

        flood_contribution = weights["flood"] * flood
        landslide_contribution = weights["landslide"] * landslide
        rainfall_contribution = weights["rainfall"] * rainfall

        score = (
            flood_contribution
            + landslide_contribution
            + rainfall_contribution
        )

        results.append({
            "habitation_id": item["habitation_id"],
            "hazard_score": round(score, 6),
            "explanation": {
                "flood_score": flood,
                "flood_weight": weights["flood"],
                "flood_contribution": round(
                    flood_contribution, 6
                ),
                "landslide_score": landslide,
                "landslide_weight": weights["landslide"],
                "landslide_contribution": round(
                    landslide_contribution, 6
                ),
                "rainfall_score": rainfall,
                "rainfall_weight": weights["rainfall"],
                "rainfall_contribution": round(
                    rainfall_contribution, 6
                ),
            },
        })

    return results


def calculate_exposure_scores(
    inputs: Iterable[dict],
    weights: dict[str, float] | None = None,
) -> list[dict]:
    """
    Calculate exposure using normalized population and
    exposed-area ratio.

    Default:
        70% population
        30% exposed area
    """

    weights = weights or DEFAULT_EXPOSURE_WEIGHTS.copy()
    _validate_pipeline_weights(weights)

    required = {"population", "exposed_area"}
    if set(weights.keys()) != required:
        raise ValueError(
            "Exposure weights must contain exactly: "
            f"{required}"
        )

    inputs = list(inputs)

    if not inputs:
        return []

    populations = []

    for item in inputs:
        population = item["population"]

        if (
            not isinstance(population, (int, float))
            or not math.isfinite(population)
            or population < 0
        ):
            raise ValueError(
                "Population must be a finite non-negative number."
            )

        populations.append(population)

    minimum = min(populations)
    maximum = max(populations)

    results = []

    for item in inputs:
        population = item["population"]
        area = item.get("exposed_area_ratio", 1.0)

        if (
            not isinstance(area, (int, float))
            or not math.isfinite(area)
            or area < 0
            or area > 1
        ):
            raise ValueError(
                "exposed_area_ratio must be between 0 and 1."
            )

        normalized_population = _normalize_pipeline(
            population,
            minimum,
            maximum,
        )

        population_contribution = (
            weights["population"]
            * normalized_population
        )

        area_contribution = (
            weights["exposed_area"]
            * area
        )

        score = (
            population_contribution
            + area_contribution
        )

        results.append({
            "habitation_id": item["habitation_id"],
            "exposure_score": round(score, 6),
            "explanation": {
                "population": population,
                "normalized_population": round(
                    normalized_population, 6
                ),
                "population_weight": weights["population"],
                "population_contribution": round(
                    population_contribution, 6
                ),
                "exposed_area_ratio": area,
                "exposed_area_weight": weights["exposed_area"],
                "exposed_area_contribution": round(
                    area_contribution, 6
                ),
            },
        })

    return results


def calculate_vulnerability_scores(
    inputs: Iterable[dict],
    weights: dict[str, float] | None = None,
) -> list[dict]:
    """
    Calculate vulnerability from:
        50% vulnerable population
        30% infrastructure vulnerability
        20% access constraint
    """

    weights = weights or DEFAULT_VULNERABILITY_WEIGHTS.copy()
    _validate_pipeline_weights(weights)

    required = {
        "vulnerable_population",
        "infrastructure",
        "access",
    }

    if set(weights.keys()) != required:
        raise ValueError(
            "Vulnerability weights must contain exactly: "
            f"{required}"
        )

    results = []

    for item in inputs:
        vulnerable = item["vulnerable_population_ratio"]
        infrastructure = item["infrastructure_vulnerability"]
        access = item["access_constraint"]

        _validate_score(
            vulnerable,
            "vulnerable_population_ratio",
        )
        _validate_score(
            infrastructure,
            "infrastructure_vulnerability",
        )
        _validate_score(
            access,
            "access_constraint",
        )

        vulnerable_contribution = (
            weights["vulnerable_population"]
            * vulnerable
        )

        infrastructure_contribution = (
            weights["infrastructure"]
            * infrastructure
        )

        access_contribution = (
            weights["access"]
            * access
        )

        score = (
            vulnerable_contribution
            + infrastructure_contribution
            + access_contribution
        )

        results.append({
            "habitation_id": item["habitation_id"],
            "vulnerability_score": round(score, 6),
            "explanation": {
                "vulnerable_population_ratio": vulnerable,
                "vulnerable_population_weight":
                    weights["vulnerable_population"],
                "vulnerable_population_contribution":
                    round(vulnerable_contribution, 6),
                "infrastructure_vulnerability": infrastructure,
                "infrastructure_weight":
                    weights["infrastructure"],
                "infrastructure_contribution":
                    round(infrastructure_contribution, 6),
                "access_constraint": access,
                "access_weight": weights["access"],
                "access_contribution":
                    round(access_contribution, 6),
            },
        })

    return results


def classify_risk_score(score: float) -> str:
    _validate_score(score, "risk_score")

    if score >= 0.67:
        return "HIGH"

    if score >= 0.34:
        return "MEDIUM"

    return "LOW"


def calculate_risk_scores(
    inputs: Iterable[dict],
    weights: dict[str, float] | None = None,
) -> list[dict]:
    """
    Complete risk score:

        50% hazard
        30% exposure
        20% vulnerability
    """

    weights = weights or DEFAULT_RISK_WEIGHTS.copy()
    _validate_pipeline_weights(weights)

    required = {
        "hazard",
        "exposure",
        "vulnerability",
    }

    if set(weights.keys()) != required:
        raise ValueError(
            "Risk weights must contain exactly: "
            f"{required}"
        )

    results = []

    for item in inputs:
        hazard = item["hazard_score"]
        exposure = item["exposure_score"]
        vulnerability = item["vulnerability_score"]

        _validate_score(hazard, "hazard_score")
        _validate_score(exposure, "exposure_score")
        _validate_score(
            vulnerability,
            "vulnerability_score",
        )

        hazard_contribution = (
            weights["hazard"] * hazard
        )

        exposure_contribution = (
            weights["exposure"] * exposure
        )

        vulnerability_contribution = (
            weights["vulnerability"]
            * vulnerability
        )

        raw_score = (
            hazard_contribution
            + exposure_contribution
            + vulnerability_contribution
        )

        risk_score = min(1.0, max(0.0, raw_score))

        results.append({
            "habitation_id": item["habitation_id"],
            "risk_score": round(risk_score, 6),
            "risk_level": classify_risk_score(risk_score),
            "explanation": {
                "hazard_score": hazard,
                "hazard_weight": weights["hazard"],
                "hazard_contribution": round(
                    hazard_contribution, 6
                ),
                "exposure_score": exposure,
                "exposure_weight": weights["exposure"],
                "exposure_contribution": round(
                    exposure_contribution, 6
                ),
                "vulnerability_score": vulnerability,
                "vulnerability_weight":
                    weights["vulnerability"],
                "vulnerability_contribution":
                    round(
                        vulnerability_contribution,
                        6,
                    ),
            },
        })

    return results
