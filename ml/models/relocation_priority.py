"""
Relocation Priority Engine

This module calculates how urgently each habitation should
be considered for relocation based on:

1. Hazard risk
2. Proximity to hazards
3. Population exposure
"""

import sys
from pathlib import Path
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import PROCESSED_DATA_DIR, RISK_WEIGHT, HAZARD_PROXIMITY_WEIGHT, POPULATION_EXPOSURE_WEIGHT  # noqa: E402


# --------------------------------------------------
# PATHS
# --------------------------------------------------

INPUT_FILE = PROCESSED_DATA_DIR / "habitation_features.csv"
OUTPUT_FILE = PROCESSED_DATA_DIR / "relocation_priorities.csv"

# NOTE: weights now live in ml/config.py so they can be tuned in one
# place and reused (e.g. by the explainability module) without import
# cycles or copy-pasted constants.


# --------------------------------------------------
# PRIORITY LEVEL FUNCTION
# --------------------------------------------------

def get_priority_level(score: float) -> str:
    """
    Convert numerical priority score into
    a human-readable priority category.
    """

    if score >= 0.80:
        return "CRITICAL"

    elif score >= 0.60:
        return "HIGH"

    elif score >= 0.40:
        return "MEDIUM"

    else:
        return "LOW"


# --------------------------------------------------
# CALCULATE PRIORITY
# --------------------------------------------------

def calculate_relocation_priority(
    features: pd.DataFrame,
) -> pd.DataFrame:
    """
    Calculate relocation priority for every habitation.
    """

    required_columns = [
        "habitation_id",
        "risk_normalized",
        "hazard_proximity_score",
        "population_exposure_score",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in features.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    # Make a copy so we do not modify the original dataframe
    result = features.copy()

    # Calculate final relocation priority score
    result["relocation_priority_score"] = (
        result["risk_normalized"]
        * RISK_WEIGHT

        + result["hazard_proximity_score"]
        * HAZARD_PROXIMITY_WEIGHT

        + result["population_exposure_score"]
        * POPULATION_EXPOSURE_WEIGHT
    )

    # Ensure values remain between 0 and 1
    result["relocation_priority_score"] = (
        result["relocation_priority_score"]
        .clip(0, 1)
    )

    # Convert numerical score into priority category
    result["priority_level"] = (
        result["relocation_priority_score"]
        .apply(get_priority_level)
    )

    # Sort most urgent habitations first
    result = result.sort_values(
        by="relocation_priority_score",
        ascending=False,
    )

    return result


# --------------------------------------------------
# SAVE RESULTS
# --------------------------------------------------

def save_priorities(
    priorities: pd.DataFrame,
) -> None:
    """
    Save relocation priority results.
    """

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    priorities.to_csv(
        OUTPUT_FILE,
        index=False,
    )


# --------------------------------------------------
# MAIN
# --------------------------------------------------

def main() -> None:

    print("Loading habitation features...")

    features = pd.read_csv(INPUT_FILE)

    print(
        f"Loaded {len(features)} habitations"
    )

    print("\nCalculating relocation priorities...")

    priorities = calculate_relocation_priority(
        features
    )

    save_priorities(
        priorities
    )

    # Display important columns
    display_columns = [
        "habitation_id",
        "population",
        "risk_score",
        "distance_to_nearest_hazard_m",
        "relocation_priority_score",
        "priority_level",
    ]

    # Only display columns that exist
    display_columns = [
        column
        for column in display_columns
        if column in priorities.columns
    ]

    print("\nRelocation priorities calculated:")

    print(
        priorities[
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