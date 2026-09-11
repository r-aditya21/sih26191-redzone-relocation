"""
Stage 3 of the SIH 26191 pipeline: build relocation-site features.

CHANGES FROM THE ORIGINAL VERSION:
  - SITES_FILE now comes from ml/config.py instead of being hardcoded.
  - normalize_min_max() imported from ml/geo_utils.py (shared 0.5
    neutral fallback for the min==max edge case, instead of 0.0 -
    a single relocation site in a small district should not be scored
    "worst possible" just because there's nothing to compare it to).
  - Validation added: unique site_id, required columns present,
    capacity_score/infra_access in [0,1], available_land non-negative,
    Polygon geometry type, invalid-geometry auto-repair.
"""

import sys
from pathlib import Path

import geopandas as gpd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import SITES_FILE, PROCESSED_DATA_DIR  # noqa: E402
from geo_utils import normalize_min_max  # noqa: E402
from validation import (  # noqa: E402
    validate_unique_ids,
    validate_required_columns,
    validate_range,
    validate_non_negative,
    validate_geometry_type,
    repair_invalid_geometries,
)


def load_sites():
    sites = gpd.read_file(SITES_FILE)

    validate_required_columns(
        sites,
        ["site_id", "capacity_score", "available_land", "infra_access"],
        "sites file",
    )
    validate_unique_ids(sites, "site_id", "sites file")
    validate_range(sites, "capacity_score", 0.0, 1.0, "sites file")
    validate_range(sites, "infra_access", 0.0, 1.0, "sites file")
    validate_non_negative(sites, "available_land", "sites file")
    validate_geometry_type(sites, "Polygon", "sites file")

    sites = repair_invalid_geometries(sites, "sites file")

    return sites


def build_site_features(sites):
    """Build standardized relocation-site features."""

    result = sites.copy()

    # FEATURE 1: Normalized capacity
    result["capacity_normalized"] = normalize_min_max(result["capacity_score"])

    # FEATURE 2: Normalized available land
    result["available_land_normalized"] = normalize_min_max(result["available_land"])

    # FEATURE 3: Normalized infrastructure access
    result["infrastructure_normalized"] = normalize_min_max(result["infra_access"])

    # FEATURE 4: Base site suitability score (equal-weight average)
    result["base_site_suitability_score"] = (
        result["capacity_normalized"]
        + result["available_land_normalized"]
        + result["infrastructure_normalized"]
    ) / 3

    return result


def save_features(features):
    """Save site features as a standard CSV."""

    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

    features_wgs84 = features.to_crs(epsg=4326)

    representative_points = features_wgs84.geometry.representative_point()

    features_wgs84["longitude"] = representative_points.x
    features_wgs84["latitude"] = representative_points.y

    output_columns = [
        "site_id",
        "capacity_score",
        "available_land",
        "infra_access",
        "capacity_normalized",
        "available_land_normalized",
        "infrastructure_normalized",
        "base_site_suitability_score",
        "longitude",
        "latitude",
    ]

    output_file = PROCESSED_DATA_DIR / "site_features.csv"

    output_data = features_wgs84[output_columns]

    output_data.to_csv(output_file, index=False)

    return output_data, output_file


def main():

    print("Loading relocation site data...")

    sites = load_sites()

    print(f"Loaded {len(sites)} relocation sites")

    print("\nBuilding site features...")

    features = build_site_features(sites)

    output_data, output_file = save_features(features)

    print("\nSite feature dataset created:")

    print(output_data.to_string(index=False))

    print(f"\nSaved to:\n{output_file}")


if __name__ == "__main__":
    main()
