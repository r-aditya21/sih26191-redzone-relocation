"""
SIH 26191 - Relocation Recommendation Generator

This module converts relocation optimization results into
human-readable recommendations for decision-makers.
"""

import sys
from pathlib import Path
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import PROCESSED_DATA_DIR as PROCESSED_DIR  # noqa: E402


# ============================================================
# PATH CONFIGURATION
# ============================================================

ALLOCATIONS_FILE = PROCESSED_DIR / "relocation_allocations.csv"
UNASSIGNED_FILE = PROCESSED_DIR / "unassigned_habitations.csv"
SITE_SUMMARY_FILE = PROCESSED_DIR / "site_allocation_summary.csv"

OUTPUT_FILE = PROCESSED_DIR / "relocation_recommendations.csv"


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_priority_action(priority_level: str) -> str:

    priority = str(priority_level).upper()

    actions = {
        "CRITICAL": "Immediate relocation is strongly recommended.",
        "HIGH": "Relocation should be prioritized as soon as possible.",
        "MEDIUM": "Relocation should be planned and monitored.",
        "LOW": (
            "Continue monitoring and schedule relocation "
            "based on future risk."
        )
    }

    return actions.get(
        priority,
        "Further risk assessment is recommended."
    )


def get_capacity_status(utilization_percent: float) -> str:

    if utilization_percent >= 95:
        return "CRITICAL CAPACITY - Site is almost full."

    elif utilization_percent >= 80:
        return "HIGH UTILIZATION - Limited capacity remaining."

    elif utilization_percent >= 50:
        return "MODERATE UTILIZATION - Capacity should be monitored."

    else:
        return (
            "AVAILABLE CAPACITY - "
            "Site has sufficient remaining capacity."
        )


def get_distance_assessment(distance_km: float) -> str:

    if distance_km <= 5:
        return "very close to the habitation"

    elif distance_km <= 15:
        return "within a reasonable relocation distance"

    elif distance_km <= 30:
        return "at a moderate relocation distance"

    else:
        return "at a relatively long relocation distance"


# ============================================================
# ASSIGNED RECOMMENDATIONS
# ============================================================

def generate_assigned_recommendations(
    allocations: pd.DataFrame,
    site_summary: pd.DataFrame
) -> pd.DataFrame:

    recommendations = allocations.merge(

        site_summary[
            [
                "site_id",
                "remaining_capacity",
                "capacity_utilization_percent"
            ]
        ],

        on="site_id",

        how="left"
    )

    recommendation_texts = []

    priority_actions = []

    distance_assessments = []

    capacity_statuses = []

    for _, row in recommendations.iterrows():

        priority_action = get_priority_action(
            row["priority_level"]
        )

        distance_assessment = get_distance_assessment(
            float(row["distance_km"])
        )

        utilization = float(
            row["capacity_utilization_percent"]
        )

        capacity_status = get_capacity_status(
            utilization
        )

        recommendation = (
            f"Relocate habitation {row['habitation_id']} "
            f"to site {row['site_id']}. "
            f"Priority level: {row['priority_level']}. "
            f"The relocation site is {distance_assessment}. "
            f"{priority_action} "
            f"Site capacity status: {capacity_status}"
        )

        recommendation_texts.append(
            recommendation
        )

        priority_actions.append(
            priority_action
        )

        distance_assessments.append(
            distance_assessment
        )

        capacity_statuses.append(
            capacity_status
        )

    recommendations[
        "recommendation_status"
    ] = "ASSIGNED"

    recommendations[
        "priority_action"
    ] = priority_actions

    recommendations[
        "distance_assessment"
    ] = distance_assessments

    recommendations[
        "site_capacity_status"
    ] = capacity_statuses

    recommendations[
        "recommendation"
    ] = recommendation_texts

    return recommendations


# ============================================================
# UNASSIGNED RECOMMENDATIONS
# ============================================================

def generate_unassigned_recommendations(
    unassigned: pd.DataFrame
) -> pd.DataFrame:

    if unassigned.empty:

        return pd.DataFrame()

    recommendations = unassigned.copy()

    recommendation_texts = []

    for _, row in recommendations.iterrows():

        habitation_id = row.get(
            "habitation_id",
            "UNKNOWN"
        )

        priority_level = row.get(
            "priority_level",
            "UNKNOWN"
        )

        recommendation = (
            f"Habitation {habitation_id} could not be assigned "
            f"to a suitable relocation site. "
            f"Priority level: {priority_level}. "
            f"Additional safe relocation sites should be identified "
            f"or existing site capacity should be expanded."
        )

        recommendation_texts.append(
            recommendation
        )

    recommendations[
        "recommendation_status"
    ] = "UNASSIGNED"

    recommendations[
        "priority_action"
    ] = (
        "Identify additional relocation capacity."
    )

    recommendations[
        "distance_assessment"
    ] = "Not assigned"

    recommendations[
        "site_capacity_status"
    ] = "No site assigned"

    recommendations[
        "recommendation"
    ] = recommendation_texts

    return recommendations


# ============================================================
# MAIN
# ============================================================

def main():

    print("\n" + "=" * 70)
    print("SIH 26191")
    print("RELOCATION RECOMMENDATION GENERATOR")
    print("=" * 70)

    # --------------------------------------------------------
    # Load relocation allocations
    # --------------------------------------------------------

    print("\nLoading relocation allocations...")

    if not ALLOCATIONS_FILE.exists():

        raise FileNotFoundError(
            f"Allocation file not found:\n"
            f"{ALLOCATIONS_FILE}"
        )

    allocations = pd.read_csv(
        ALLOCATIONS_FILE
    )

    print(
        f"Loaded {len(allocations)} "
        f"relocation allocations"
    )

    # --------------------------------------------------------
    # Load site allocation summary
    # --------------------------------------------------------

    print("\nLoading site allocation summary...")

    if not SITE_SUMMARY_FILE.exists():

        raise FileNotFoundError(
            f"Site summary file not found:\n"
            f"{SITE_SUMMARY_FILE}"
        )

    site_summary = pd.read_csv(
        SITE_SUMMARY_FILE
    )

    print(
        f"Loaded {len(site_summary)} "
        f"relocation sites"
    )

    # --------------------------------------------------------
    # Load unassigned habitations
    # --------------------------------------------------------

    print("\nLoading unassigned habitations...")

    if UNASSIGNED_FILE.exists():

        try:

            unassigned = pd.read_csv(
                UNASSIGNED_FILE
            )

            print(
                f"Loaded {len(unassigned)} "
                f"unassigned habitations"
            )

        except pd.errors.EmptyDataError:

            unassigned = pd.DataFrame()

            print(
                "No unassigned habitations found"
            )

    else:

        unassigned = pd.DataFrame()

        print(
            "No unassigned habitation file found"
        )

    # --------------------------------------------------------
    # Generate assigned recommendations
    # --------------------------------------------------------

    print(
        "\nGenerating assigned habitation recommendations..."
    )

    assigned_recommendations = (
        generate_assigned_recommendations(

            allocations,

            site_summary
        )
    )

    # --------------------------------------------------------
    # Generate unassigned recommendations
    # --------------------------------------------------------

    print(
        "\nGenerating unassigned habitation recommendations..."
    )

    unassigned_recommendations = (
        generate_unassigned_recommendations(
            unassigned
        )
    )

    # --------------------------------------------------------
    # Combine recommendations
    # --------------------------------------------------------

    if not unassigned_recommendations.empty:

        final_recommendations = pd.concat(

            [
                assigned_recommendations,
                unassigned_recommendations
            ],

            ignore_index=True,

            sort=False
        )

    else:

        final_recommendations = (
            assigned_recommendations.copy()
        )

    # --------------------------------------------------------
    # Save output
    # --------------------------------------------------------

    PROCESSED_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    final_recommendations.to_csv(

        OUTPUT_FILE,

        index=False
    )

    # --------------------------------------------------------
    # Display results
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("RELOCATION RECOMMENDATIONS GENERATED")
    print("=" * 70)

    print(
        f"\nTotal recommendations: "
        f"{len(final_recommendations)}"
    )

    print(
        "\nRECOMMENDATION SUMMARY:"
    )

    print(

        final_recommendations[
            "recommendation_status"
        ]

        .value_counts()
    )

    display_columns = [

        "habitation_id",

        "priority_level",

        "site_id",

        "distance_km",

        "recommendation_status",

        "recommendation"
    ]

    available_columns = [

        column

        for column in display_columns

        if column in final_recommendations.columns
    ]

    print("\nFINAL RECOMMENDATIONS:\n")

    print(

        final_recommendations[
            available_columns
        ]

        .to_string(
            index=False
        )
    )

    print(
        f"\nSaved recommendations to:\n"
        f"{OUTPUT_FILE}"
    )

    print(
        "\nRecommendation generation "
        "completed successfully."
    )


if __name__ == "__main__":

    main()