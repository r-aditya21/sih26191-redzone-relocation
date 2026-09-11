"""
Global Capacity-Aware Relocation Optimizer
==========================================

This module performs global relocation allocation.

Unlike simple habitation-to-site matching, this optimizer considers:

- Population of each habitation
- Relocation priority
- Hazard risk
- Distance to relocation sites
- Site suitability
- Site capacity
- Available land
- Infrastructure access

The algorithm processes higher-priority habitations first and assigns
each habitation to the best feasible site without exceeding capacity.

Designed to work with both small prototype datasets and large
real-world datasets.
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import (  # noqa: E402
    PROCESSED_DATA_DIR as DATA_DIR,
    PEOPLE_PER_LAND_UNIT,
    MAX_CAPACITY_UTILIZATION,
)
from geo_utils import haversine_distance, normalize_min_max as normalize  # noqa: E402,F401
from validation import validate_unique_ids  # noqa: E402


# ============================================================
# PATH CONFIGURATION
# ============================================================

HABITATION_FILE = DATA_DIR / "habitation_features.csv"
SITE_FILE = DATA_DIR / "site_features.csv"
PRIORITY_FILE = DATA_DIR / "relocation_priorities.csv"

OUTPUT_FILE = DATA_DIR / "relocation_allocations.csv"
SITE_SUMMARY_FILE = DATA_DIR / "site_allocation_summary.csv"
UNASSIGNED_FILE = DATA_DIR / "unassigned_habitations.csv"

# NOTE: PEOPLE_PER_LAND_UNIT and MAX_CAPACITY_UTILIZATION now live in
# ml/config.py (single source of truth). normalize() and
# haversine_distance() now come from ml/geo_utils.py instead of local
# copies, so the min==max fallback (0.5, neutral) and the distance
# formula are identical across every module in the pipeline.


# Priority weights.

PRIORITY_WEIGHTS = {
    "CRITICAL": 4,
    "HIGH": 3,
    "MEDIUM": 2,
    "LOW": 1
}


# Priority processing order.

PRIORITY_ORDER = {
    "CRITICAL": 1,
    "HIGH": 2,
    "MEDIUM": 3,
    "LOW": 4
}


# ============================================================
# UTILITY FUNCTIONS
# ============================================================

# normalize() and haversine_distance() are now imported from
# ml/geo_utils.py above — see the import block at the top of this file.
# (Previously duplicated here with a DIFFERENT min==max fallback than
# the features modules: this version returned 1.0, features/*.py
# returned 0.0, and m4/risk_engine.py returned 0.5 — three different
# silent conventions for the same edge case. Now standardized to 0.5
# everywhere.)


# ============================================================
# DATA LOADING
# ============================================================

def load_data():
    """
    Load habitation features, relocation priorities,
    and relocation site feature datasets.

    Priority data is stored separately in the current
    processing pipeline and is merged using habitation_id.
    """

    print("\nLoading optimization datasets...")

    # --------------------------------------------------------
    # Check required files
    # --------------------------------------------------------

    if not HABITATION_FILE.exists():
        raise FileNotFoundError(
            f"Habitation feature file not found:\n"
            f"{HABITATION_FILE}"
        )

    if not SITE_FILE.exists():
        raise FileNotFoundError(
            f"Site feature file not found:\n"
            f"{SITE_FILE}"
        )

    # --------------------------------------------------------
    # Load main feature datasets
    # --------------------------------------------------------

    habitations = pd.read_csv(
        HABITATION_FILE
    )

    sites = pd.read_csv(
        SITE_FILE
    )

    validate_unique_ids(habitations, "habitation_id", "habitation_features.csv")
    validate_unique_ids(sites, "site_id", "site_features.csv")

    print(
        f"Loaded {len(habitations)} habitation feature records"
    )

    print(
        f"Loaded {len(sites)} relocation site records"
    )

    # --------------------------------------------------------
    # Load and merge priority data
    # --------------------------------------------------------

    if PRIORITY_FILE.exists():

        print(
            f"Loading relocation priorities from:\n"
            f"{PRIORITY_FILE}"
        )

        priorities = pd.read_csv(
            PRIORITY_FILE
        )

        print(
            f"Loaded {len(priorities)} priority records"
        )

        # Check that habitation_id exists.

        if "habitation_id" not in priorities.columns:

            raise ValueError(
                "relocation_priorities.csv does not contain "
                "'habitation_id'"
            )

        if "priority_level" not in priorities.columns:

            raise ValueError(
                "relocation_priorities.csv does not contain "
                "'priority_level'"
            )

        # Keep only required priority columns.

        priority_columns = [
            "habitation_id",
            "priority_level"
        ]

        # Also include priority score if available.

        if "priority_score" in priorities.columns:

            priority_columns.append(
                "priority_score"
            )

        priorities = priorities[
            priority_columns
        ].copy()

        # --- ADDED: validate uniqueness on BOTH sides before merging ---
        # A duplicate habitation_id on either side turns this merge into
        # a silent cross-product (cartesian join), duplicating
        # allocation rows and double-counting population against site
        # capacity, with no error or warning. Confirmed by direct test
        # during the M5 audit. Fail loud here instead.
        validate_unique_ids(habitations, "habitation_id", "habitation_features.csv")
        validate_unique_ids(priorities, "habitation_id", "relocation_priorities.csv")
        # --- END ADDED ---

        # Merge priorities with habitation features.

        habitations = habitations.merge(

            priorities,

            on="habitation_id",

            how="left"
        )

        # Any habitation without a calculated priority
        # receives LOW priority as a safe fallback.

        habitations[
            "priority_level"
        ] = (

            habitations[
                "priority_level"
            ]

            .fillna(
                "LOW"
            )

            .astype(str)

            .str.upper()
        )

        print(
            "Merged priority information with habitation features"
        )

    else:

        print(
            "\nWARNING:"
        )

        print(
            "relocation_priorities.csv not found."
        )

        print(
            "Assigning LOW priority as fallback."
        )

        habitations[
            "priority_level"
        ] = "LOW"

    # --------------------------------------------------------
    # Validate required columns
    # --------------------------------------------------------

    required_habitation_columns = [

        "habitation_id",

        "population",

        "latitude",

        "longitude",

        "priority_level"
    ]

    for column in required_habitation_columns:

        if column not in habitations.columns:

            raise ValueError(
                f"Required habitation column missing: "
                f"{column}"
            )

    required_site_columns = [

        "site_id",

        "latitude",

        "longitude",

        "available_land",

        "capacity_score"
    ]

    for column in required_site_columns:

        if column not in sites.columns:

            raise ValueError(
                f"Required site column missing: "
                f"{column}"
            )

    return habitations, sites
# ============================================================
# SITE CAPACITY ESTIMATION
# ============================================================

def estimate_site_capacity(sites: pd.DataFrame):
    """
    Estimate relocation capacity.

    If the real dataset later contains an explicit capacity
    column, this function can be updated to use that column
    directly.

    Prototype formula:

    estimated_capacity =
        available_land
        × PEOPLE_PER_LAND_UNIT
        × capacity_score
        × MAX_CAPACITY_UTILIZATION
    """

    sites = sites.copy()

    required_columns = [
        "site_id",
        "available_land",
        "capacity_score"
    ]

    for column in required_columns:

        if column not in sites.columns:

            raise ValueError(
                f"Required site column missing: {column}"
            )

    sites["estimated_capacity"] = (
        sites["available_land"]
        *
        PEOPLE_PER_LAND_UNIT
        *
        sites["capacity_score"]
        *
        MAX_CAPACITY_UTILIZATION
    )

    sites["estimated_capacity"] = (
        sites["estimated_capacity"]
        .round()
        .astype(int)
    )

    sites["remaining_capacity"] = (
        sites["estimated_capacity"]
    )

    sites["allocated_population"] = 0

    return sites


# ============================================================
# ALLOCATION SCORE
# ============================================================

def calculate_allocation_score(
    habitation,
    site,
    max_distance
):
    """
    Calculate suitability score for allocating one habitation
    to one relocation site.

    Score considers:

    - Distance
    - Site suitability
    - Capacity score
    - Infrastructure access

    Higher score = better allocation.
    """

    distance_km = haversine_distance(

        habitation["latitude"],
        habitation["longitude"],

        site["latitude"],
        site["longitude"]
    )

    # Distance score:
    # shorter distance = higher score

    if max_distance == 0:

        distance_score = 1.0

    else:

        distance_score = max(
            0,
            1 - (
                distance_km / max_distance
            )
        )

    site_suitability = (
        site.get(
            "base_site_suitability_score",
            site.get(
                "capacity_score",
                0
            )
        )
    )

    capacity_score = site.get(
        "capacity_score",
        0
    )

    infrastructure_score = site.get(
        "infra_access",
        0
    )

    # Weighted combined score.

    allocation_score = (

        0.40 * distance_score

        +

        0.25 * site_suitability

        +

        0.20 * capacity_score

        +

        0.15 * infrastructure_score
    )

    return {

        "distance_km": distance_km,

        "distance_score": distance_score,

        "allocation_score": allocation_score
    }


# ============================================================
# BUILD CANDIDATE ALLOCATIONS
# ============================================================

def build_candidate_allocations(
    habitations,
    sites
):
    """
    Generate candidate habitation-site allocations.

    Every habitation is evaluated against every relocation site.

    This preserves alternative relocation options rather than
    keeping only one best site.
    """

    print(
        "\nBuilding habitation-site candidates..."
    )

    candidates = []

    # Calculate an approximate maximum distance for
    # score normalization.

    all_distances = []

    for _, habitation in habitations.iterrows():

        for _, site in sites.iterrows():

            distance = haversine_distance(

                habitation["latitude"],
                habitation["longitude"],

                site["latitude"],
                site["longitude"]
            )

            all_distances.append(distance)

    max_distance = max(
        all_distances
    ) if all_distances else 1

    # Build candidates.

    for _, habitation in habitations.iterrows():

        for _, site in sites.iterrows():

            score_data = calculate_allocation_score(

                habitation,
                site,
                max_distance
            )

            candidates.append({

                "habitation_id":
                    habitation["habitation_id"],

                "population":
                    habitation["population"],

                "priority_level":
                    habitation.get(
                        "priority_level",
                        "LOW"
                    ),

                "site_id":
                    site["site_id"],

                "distance_km":
                    score_data["distance_km"],

                "distance_score":
                    score_data["distance_score"],

                "allocation_score":
                    score_data["allocation_score"]
            })

    candidates = pd.DataFrame(
        candidates
    )

    print(
        f"Generated {len(candidates)} "
        f"candidate allocations"
    )

    return candidates


# ============================================================
# GLOBAL ALLOCATION
# ============================================================

def optimize_relocation(
    habitations,
    sites,
    candidates
):
    """
    Perform capacity-aware global allocation.

    Strategy:

    1. Process CRITICAL habitations first.
    2. Process HIGH habitations.
    3. Process MEDIUM habitations.
    4. Process LOW habitations.

    For each habitation:

    - Examine candidate sites.
    - Select highest scoring site that has enough remaining
      capacity.
    - Deduct habitation population from site capacity.
    - If no site has enough capacity, mark habitation as
      unassigned.
    """

    print(
        "\nRunning global relocation optimization..."
    )

    sites = sites.copy()

    # Create fast lookup.

    site_lookup = {

        row["site_id"]: row

        for _, row in sites.iterrows()
    }

    habitations = habitations.copy()

    habitations["priority_rank"] = (

        habitations[
            "priority_level"
        ]

        .map(PRIORITY_ORDER)

        .fillna(99)
    )

    # Higher priority first.
    # Within same priority, larger population first.

    habitations = (

        habitations

        .sort_values(

            by=[
                "priority_rank",
                "population"
            ],

            ascending=[
                True,
                False
            ]
        )

        .reset_index(
            drop=True
        )
    )

    allocations = []

    unassigned = []

    for _, habitation in habitations.iterrows():

        habitation_id = (
            habitation[
                "habitation_id"
            ]
        )

        population = int(
            habitation[
                "population"
            ]
        )

        habitation_candidates = (

            candidates[

                candidates[
                    "habitation_id"
                ]
                ==
                habitation_id

            ]

            .sort_values(

                by="allocation_score",

                ascending=False
            )
        )

        assigned = False

        for _, candidate in (
            habitation_candidates.iterrows()
        ):

            site_id = (
                candidate[
                    "site_id"
                ]
            )

            site = site_lookup[
                site_id
            ]

            remaining_capacity = int(
                site[
                    "remaining_capacity"
                ]
            )

            # Capacity feasibility check.

            if (
                remaining_capacity
                >=
                population
            ):

                # Allocate habitation.

                site_lookup[
                    site_id
                ][
                    "remaining_capacity"
                ] -= population

                site_lookup[
                    site_id
                ][
                    "allocated_population"
                ] += population

                allocations.append({

                    "habitation_id":
                        habitation_id,

                    "population":
                        population,

                    "priority_level":
                        habitation[
                            "priority_level"
                        ],

                    "site_id":
                        site_id,

                    "distance_km":
                        round(
                            candidate[
                                "distance_km"
                            ],
                            3
                        ),

                    "allocation_score":
                        round(
                            candidate[
                                "allocation_score"
                            ],
                            4
                        ),

                    "allocation_status":
                        "ASSIGNED"
                })

                assigned = True

                break

        # No feasible site.

        if not assigned:

            unassigned.append({

                "habitation_id":
                    habitation_id,

                "population":
                    population,

                "priority_level":
                    habitation[
                        "priority_level"
                    ],

                "allocation_status":
                    "UNASSIGNED",

                "reason":
                    "No site with sufficient "
                    "remaining capacity"
            })

    # Convert updated lookup back into DataFrame.

    updated_sites = pd.DataFrame(

        list(
            site_lookup.values()
        )
    )

    allocations = pd.DataFrame(
        allocations
    )

    unassigned = pd.DataFrame(
        unassigned
    )

    return (

        allocations,

        unassigned,

        updated_sites
    )


# ============================================================
# SITE SUMMARY
# ============================================================

def build_site_summary(
    sites
):
    """
    Build final site utilization summary.
    """

    summary = sites.copy()

    summary[
        "capacity_utilization_percent"
    ] = (

        summary[
            "allocated_population"
        ]

        /
        summary[
            "estimated_capacity"
        ]

        * 100

    ).fillna(0)

    summary[
        "capacity_utilization_percent"
    ] = (

        summary[
            "capacity_utilization_percent"
        ]

        .round(2)
    )

    return summary


# ============================================================
# SAVE OUTPUTS
# ============================================================

def save_outputs(
    allocations,
    unassigned,
    site_summary
):
    """
    Save optimizer outputs.
    """

    DATA_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    allocations.to_csv(

        OUTPUT_FILE,

        index=False
    )

    unassigned.to_csv(

        UNASSIGNED_FILE,

        index=False
    )

    site_summary.to_csv(

        SITE_SUMMARY_FILE,

        index=False
    )

    print(
        "\nOptimization outputs saved:"
    )

    print(
        f"\nAllocations:\n{OUTPUT_FILE}"
    )

    print(
        f"\nUnassigned habitations:\n"
        f"{UNASSIGNED_FILE}"
    )

    print(
        f"\nSite allocation summary:\n"
        f"{SITE_SUMMARY_FILE}"
    )


# ============================================================
# DISPLAY RESULTS
# ============================================================

def display_results(
    allocations,
    unassigned,
    site_summary
):
    """
    Display optimization results.
    """

    print(
        "\n"
        +
        "=" * 70
    )

    print(
        "GLOBAL RELOCATION OPTIMIZATION RESULTS"
    )

    print(
        "=" * 70
    )

    print(
        f"\nAssigned habitations: "
        f"{len(allocations)}"
    )

    print(
        f"Unassigned habitations: "
        f"{len(unassigned)}"
    )

    if not allocations.empty:

        print(
            "\nALLOCATIONS:"
        )

        print(

            allocations.to_string(

                index=False
            )
        )

    if not unassigned.empty:

        print(
            "\nUNASSIGNED HABITATIONS:"
        )

        print(

            unassigned.to_string(

                index=False
            )
        )

    print(
        "\nSITE CAPACITY SUMMARY:"
    )

    display_columns = [

        "site_id",

        "estimated_capacity",

        "allocated_population",

        "remaining_capacity",

        "capacity_utilization_percent"
    ]

    available_columns = [

        column

        for column in display_columns

        if column in site_summary.columns
    ]

    print(

        site_summary[
            available_columns
        ].to_string(
            index=False
        )
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print(
        "\n"
        +
        "=" * 70
    )

    print(
        "SIH 26191"
    )

    print(
        "GLOBAL RELOCATION OPTIMIZATION ENGINE"
    )

    print(
        "=" * 70
    )

    # Load.

    habitations, sites = (
        load_data()
    )

    # Estimate site capacity.

    sites = (
        estimate_site_capacity(
            sites
        )
    )

    # Build all possible
    # habitation-site candidates.

    candidates = (
        build_candidate_allocations(

            habitations,

            sites
        )
    )

    # Run optimization.

    (

        allocations,

        unassigned,

        updated_sites

    ) = optimize_relocation(

        habitations,

        sites,

        candidates
    )

    # Build summary.

    site_summary = (
        build_site_summary(
            updated_sites
        )
    )

    # Display.

    display_results(

        allocations,

        unassigned,

        site_summary
    )

    # Save.

    save_outputs(

        allocations,

        unassigned,

        site_summary
    )

    print(
        "\nOptimization completed successfully."
    )


if __name__ == "__main__":

    main()