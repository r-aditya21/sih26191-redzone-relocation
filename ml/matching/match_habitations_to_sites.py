"""
Habitation to Relocation Site Matching Engine

This module evaluates possible relocation sites for each habitation
and recommends the most suitable site.

The current version uses:

1. Site suitability
2. Distance between habitation and site
3. Available land
4. Infrastructure access
5. Habitation relocation priority

The design is scalable and can later be extended with real
site capacity and additional constraints.
"""

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import PROCESSED_DATA_DIR  # noqa: E402
from geo_utils import haversine_distance  # noqa: E402
from validation import validate_unique_ids  # noqa: E402

# NOTE: this module produces a NON-capacity-constrained "naive"
# baseline match (every habitation can pick its best site regardless
# of how many others already went there). The AUTHORITATIVE,
# capacity-aware output is relocation_allocations.csv, produced by
# ml/optimization/relocation_optimizer.py. This file is kept as a
# reference/comparison baseline only — do not treat it as the final
# relocation plan.

# --------------------------------------------------
# PROJECT PATHS
# --------------------------------------------------

HABITATIONS_FILE = PROCESSED_DATA_DIR / "relocation_priorities.csv"
SITES_FILE = PROCESSED_DATA_DIR / "site_features.csv"
OUTPUT_FILE = PROCESSED_DATA_DIR / "habitation_site_matches.csv"


# --------------------------------------------------
# MATCHING WEIGHTS
# --------------------------------------------------

SITE_SUITABILITY_WEIGHT = 0.40
DISTANCE_WEIGHT = 0.25
LAND_WEIGHT = 0.15
INFRASTRUCTURE_WEIGHT = 0.10
RELOCATION_PRIORITY_WEIGHT = 0.10


# --------------------------------------------------
# DISTANCE FUNCTION
# --------------------------------------------------

def calculate_distance_km(
    longitude_1: float,
    latitude_1: float,
    longitude_2: float,
    latitude_2: float,
) -> float:
    """
    Calculate geographical distance in kilometres using the shared
    haversine implementation (ml/geo_utils.py).

    PREVIOUSLY this used a flat degree*111 approximation, which was
    measured (during the audit) to be ~9-10% off from true haversine
    distance at Chamoli's latitude, and disagreed with the optimizer's
    own (correct) distance calculation on the same habitation-site
    pairs. Both modules now share one implementation.
    """
    return haversine_distance(latitude_1, longitude_1, latitude_2, longitude_2)


# --------------------------------------------------
# DISTANCE SCORE
# --------------------------------------------------

def calculate_distance_score(
    distance_km: float,
    maximum_distance_km: float,
) -> float:
    """
    Convert distance into a score between 0 and 1.

    Shorter distance = better score.
    """

    if maximum_distance_km <= 0:
        return 1.0

    score = 1 - (
        distance_km / maximum_distance_km
    )

    return max(0.0, min(1.0, score))


# --------------------------------------------------
# BUILD ALL MATCHES
# --------------------------------------------------

def build_matches(
    habitations: pd.DataFrame,
    sites: pd.DataFrame,
) -> pd.DataFrame:
    """
    Create every possible habitation-site combination.
    """

    matches = []

    # First calculate all distances.
    all_distances = []

    for _, habitation in habitations.iterrows():
        for _, site in sites.iterrows():

            distance_km = calculate_distance_km(
                habitation["longitude"],
                habitation["latitude"],
                site["longitude"],
                site["latitude"],
            )

            all_distances.append(distance_km)

    maximum_distance_km = max(all_distances)

    print(
        f"Maximum matching distance: "
        f"{maximum_distance_km:.2f} km"
    )

    # Build scored matches.
    for _, habitation in habitations.iterrows():

        for _, site in sites.iterrows():

            distance_km = calculate_distance_km(
                habitation["longitude"],
                habitation["latitude"],
                site["longitude"],
                site["latitude"],
            )

            distance_score = calculate_distance_score(
                distance_km,
                maximum_distance_km,
            )

            # Final match score.
            match_score = (
                site["base_site_suitability_score"]
                * SITE_SUITABILITY_WEIGHT

                + distance_score
                * DISTANCE_WEIGHT

                + site["available_land_normalized"]
                * LAND_WEIGHT

                + site["infrastructure_normalized"]
                * INFRASTRUCTURE_WEIGHT

                + habitation["relocation_priority_score"]
                * RELOCATION_PRIORITY_WEIGHT
            )

            matches.append(
                {
                    "habitation_id":
                        habitation["habitation_id"],

                    "population":
                        habitation["population"],

                    "relocation_priority_score":
                        habitation[
                            "relocation_priority_score"
                        ],

                    "priority_level":
                        habitation["priority_level"],

                    "site_id":
                        site["site_id"],

                    "distance_km":
                        round(distance_km, 3),

                    "distance_score":
                        round(distance_score, 4),

                    "site_suitability_score":
                        round(
                            site[
                                "base_site_suitability_score"
                            ],
                            4,
                        ),

                    "available_land_score":
                        round(
                            site[
                                "available_land_normalized"
                            ],
                            4,
                        ),

                    "infrastructure_score":
                        round(
                            site[
                                "infrastructure_normalized"
                            ],
                            4,
                        ),

                    "match_score":
                        round(match_score, 4),
                }
            )

    return pd.DataFrame(matches)


# --------------------------------------------------
# FIND BEST SITE
# --------------------------------------------------

def find_best_matches(
    matches: pd.DataFrame,
) -> pd.DataFrame:
    """
    Select the highest scoring site for each habitation.
    """

    best_matches = (
        matches
        .sort_values(
            by=[
                "habitation_id",
                "match_score",
            ],
            ascending=[
                True,
                False,
            ],
        )
        .groupby(
            "habitation_id",
            as_index=False,
        )
        .first()
    )

    # Sort final recommendations by urgency.
    best_matches = (
        best_matches
        .sort_values(
            by="relocation_priority_score",
            ascending=False,
        )
    )

    return best_matches


# --------------------------------------------------
# SAVE RESULTS
# --------------------------------------------------

def save_results(
    best_matches: pd.DataFrame,
) -> None:

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    best_matches.to_csv(
        OUTPUT_FILE,
        index=False,
    )


# --------------------------------------------------
# MAIN
# --------------------------------------------------

def main() -> None:

    print(
        "Loading relocation priority data..."
    )

    habitations = pd.read_csv(
        HABITATIONS_FILE
    )

    validate_unique_ids(habitations, "habitation_id", "relocation_priorities.csv")

    print(
        f"Loaded {len(habitations)} habitations"
    )

    print(
        "\nLoading relocation site data..."
    )

    sites = pd.read_csv(
        SITES_FILE
    )

    validate_unique_ids(sites, "site_id", "site_features.csv")

    print(
        f"Loaded {len(sites)} relocation sites"
    )

    print(
        "\nBuilding habitation-site matches..."
    )

    matches = build_matches(
        habitations,
        sites,
    )

    print(
        "\nFinding best site for each habitation..."
    )

    best_matches = find_best_matches(
        matches
    )

    save_results(
        best_matches
    )

    print(
        "\nBest relocation matches:"
    )

    display_columns = [
        "habitation_id",
        "population",
        "priority_level",
        "site_id",
        "distance_km",
        "match_score",
    ]

    print(
        best_matches[
            display_columns
        ].to_string(
            index=False
        )
    )

    print(
        f"\nSaved to:\n{OUTPUT_FILE}"
    )


if __name__ == "__main__":
    main()