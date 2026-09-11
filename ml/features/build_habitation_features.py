"""
Stage 2 of the SIH 26191 pipeline: build habitation risk features.

CHANGES FROM THE ORIGINAL VERSION:
  - normalize_min_max() now imported from ml/geo_utils.py (single
    shared implementation) instead of a local copy, so the min==max
    fallback (0.5, "neutral") is consistent across every module.
  - MAX_HAZARD_DISTANCE_M now imported from ml/config.py so it only
    needs to change in one place.
  - Renamed "AI/ML-ready features" -> "risk features" in the docstring;
    these are engineered features for a deterministic formula, not
    inputs to a trained model.
"""

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import PROCESSED_DATA_DIR, MAX_HAZARD_DISTANCE_M  # noqa: E402
from geo_utils import normalize_min_max  # noqa: E402
from validation import validate_required_columns  # noqa: E402

INPUT_FILE = PROCESSED_DATA_DIR / "prepared_habitations.csv"
OUTPUT_FILE = PROCESSED_DATA_DIR / "habitation_features.csv"


def calculate_hazard_proximity_score(distance):
    """
    Convert distance from a hazard zone into a score between 0 and 1.

    0 meters               -> 1.0
    MAX_HAZARD_DISTANCE_M  -> 0.0
    Anything beyond that   -> 0.0

    NOTE (kept from the original audit): this linear decay curve and
    its 20km cutoff is a prototype assumption, not tied to real
    hazard-specific spread physics (a landslide's run-out distance and
    a flood's inundation extent are very different). If a domain
    expert / M4 provides better hazard-specific distance curves before
    the real data arrives, replace this function's logic — the rest of
    the pipeline does not need to change.
    """
    score = 1 - (distance / MAX_HAZARD_DISTANCE_M)
    return score.clip(lower=0, upper=1)


def build_features(data):
    """Create risk-scoring features for every habitation."""

    validate_required_columns(
        data,
        ["habitation_id", "population", "risk_score", "distance_to_nearest_hazard_m"],
        "prepared_habitations.csv",
    )

    result = data.copy()

    # FEATURE 1: Normalized population
    result["population_normalized"] = normalize_min_max(result["population"])

    # FEATURE 2: Normalized hazard risk
    result["risk_normalized"] = normalize_min_max(result["risk_score"])

    # FEATURE 3: Hazard proximity score
    result["hazard_proximity_score"] = calculate_hazard_proximity_score(
        result["distance_to_nearest_hazard_m"]
    )

    # FEATURE 4: Population exposure score
    result["population_exposure_score"] = (
        result["population_normalized"] * result["hazard_proximity_score"]
    )

    # FEATURE 5: Risk exposure score
    result["risk_exposure_score"] = (
        result["risk_normalized"] * result["hazard_proximity_score"]
    )

    return result


def main():

    print("Loading prepared habitation data...")

    data = pd.read_csv(INPUT_FILE)

    print(f"Loaded {len(data)} habitations")

    print("\nBuilding habitation features...")

    features = build_features(data)

    features.to_csv(OUTPUT_FILE, index=False)

    print("\nFeature dataset created:")

    display_columns = [
        "habitation_id",
        "population",
        "risk_score",
        "distance_to_nearest_hazard_m",
        "population_normalized",
        "risk_normalized",
        "hazard_proximity_score",
        "population_exposure_score",
        "risk_exposure_score",
    ]

    print(features[display_columns].to_string(index=False))

    print(f"\nSaved to:\n{OUTPUT_FILE}")


if __name__ == "__main__":
    main()
