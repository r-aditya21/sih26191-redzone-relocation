"""
Stage 1 of the SIH 26191 pipeline: prepare habitation features.

Loads raw habitation + hazard-zone GeoJSON, determines which hazard
zone (if any) contains each habitation, and computes distance to the
nearest hazard zone.

CHANGES FROM THE ORIGINAL VERSION (see audit report for full context):
  - Filenames and the UTM EPSG code are no longer hardcoded here; they
    come from ml/config.py and ml/geo_utils.py so the real dataset can
    be swapped in without touching this file.
  - Validation added: unique habitation_id / zone_id, required columns
    present, non-negative population, correct geometry types, known
    risk_level vocabulary, and automatic repair of invalid geometries.
    Every one of these was a real, demonstrated failure mode against
    synthetic "new city" test data during the audit.
"""

import sys
from pathlib import Path

import geopandas as gpd
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from config import (  # noqa: E402
    HABITATIONS_FILE,
    ZONES_FILE,
    PROCESSED_DATA_DIR,
    RISK_LEVEL_MAP,
    FORCE_UTM_EPSG,
)
from geo_utils import get_utm_epsg  # noqa: E402
from validation import (  # noqa: E402
    validate_unique_ids,
    validate_required_columns,
    validate_non_negative,
    validate_geometry_type,
    validate_risk_levels,
    repair_invalid_geometries,
)


def load_data():
    """Load raw habitation and hazard-zone GeoJSON files, then validate them."""

    habitations = gpd.read_file(HABITATIONS_FILE)
    zones = gpd.read_file(ZONES_FILE)

    # --- Validation: fail loud and specific, before any spatial op runs ---
    validate_required_columns(
        habitations, ["habitation_id", "name", "population"], "habitations file"
    )
    validate_required_columns(
        zones, ["zone_id", "hazard_type", "risk_level"], "zones file"
    )

    validate_unique_ids(habitations, "habitation_id", "habitations file")
    validate_unique_ids(zones, "zone_id", "zones file")

    validate_non_negative(habitations, "population", "habitations file")

    validate_geometry_type(habitations, "Point", "habitations file")
    validate_geometry_type(zones, "Polygon", "zones file")

    validate_risk_levels(zones, "risk_level", RISK_LEVEL_MAP, "zones file")

    habitations = repair_invalid_geometries(habitations, "habitations file")
    zones = repair_invalid_geometries(zones, "zones file")

    return habitations, zones


def prepare_habitation_features(habitations, zones):
    """
    Create risk-related features for every habitation.
    """

    # Reproject to a projected CRS so distances can be measured in
    # meters. The UTM zone is auto-detected from the data's own
    # centroid (see ml/geo_utils.py) rather than hardcoded, so this
    # works correctly for any Indian district, not just Chamoli.
    utm_epsg = get_utm_epsg(habitations, force_epsg=FORCE_UTM_EPSG)
    print(f"Using UTM zone EPSG:{utm_epsg} (auto-detected from data centroid).")

    habitations = habitations.to_crs(epsg=utm_epsg)
    zones = zones.to_crs(epsg=utm_epsg)

    # Keep a copy of basic habitation data.
    result = habitations[
        [
            "habitation_id",
            "name",
            "population",
            "geometry",
        ]
    ].copy()

    # --------------------------------------------------
    # FEATURE 1: Is the habitation inside any hazard zone?
    # --------------------------------------------------
    result["in_hazard_zone"] = False

    # --------------------------------------------------
    # FEATURE 2: Highest risk level affecting the habitation
    # --------------------------------------------------
    result["risk_level"] = "none"
    result["risk_score"] = 0

    # --------------------------------------------------
    # FEATURE 3: Hazard type affecting the habitation
    # --------------------------------------------------
    result["hazard_type"] = "none"

    # --------------------------------------------------
    # FEATURE 4: Distance to nearest hazard zone
    # --------------------------------------------------
    result["distance_to_nearest_hazard_m"] = None

    # Normalize risk_level to lowercase once, for a case-insensitive,
    # config-driven lookup against RISK_LEVEL_MAP (validated already).
    zones = zones.copy()
    zones["_risk_level_lower"] = zones["risk_level"].astype(str).str.lower()
    zones["_risk_score"] = zones["_risk_level_lower"].map(RISK_LEVEL_MAP)

    for habitation_index, habitation in result.iterrows():

        habitation_geometry = habitation.geometry

        containing_zones = zones[zones.geometry.contains(habitation_geometry)]

        if not containing_zones.empty:

            result.at[habitation_index, "in_hazard_zone"] = True

            highest_risk_zone = containing_zones.loc[
                containing_zones["_risk_score"].idxmax()
            ]

            result.at[habitation_index, "risk_level"] = highest_risk_zone["risk_level"]
            result.at[habitation_index, "risk_score"] = highest_risk_zone["_risk_score"]
            result.at[habitation_index, "hazard_type"] = highest_risk_zone["hazard_type"]

        distances = zones.geometry.distance(habitation_geometry)
        nearest_distance = distances.min()

        result.at[habitation_index, "distance_to_nearest_hazard_m"] = round(
            nearest_distance, 2
        )

    return result


def save_prepared_data(result):
    """Save the prepared dataset."""

    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

    output_file = PROCESSED_DATA_DIR / "prepared_habitations.csv"

    # Geometry cannot be directly useful in a standard CSV.
    # Save latitude/longitude separately, always in WGS84 (EPSG:4326)
    # so downstream consumers get a consistent, well-known CRS
    # regardless of which UTM zone was used internally.
    result_wgs84 = result.to_crs(epsg=4326)

    result_wgs84["longitude"] = result_wgs84.geometry.x
    result_wgs84["latitude"] = result_wgs84.geometry.y

    output_columns = [
        "habitation_id",
        "name",
        "population",
        "in_hazard_zone",
        "hazard_type",
        "risk_level",
        "risk_score",
        "distance_to_nearest_hazard_m",
        "longitude",
        "latitude",
    ]

    prepared_data = result_wgs84[output_columns]

    prepared_data.to_csv(output_file, index=False)

    return output_file


def main():

    print("Loading raw data...")

    habitations, zones = load_data()

    print(f"Loaded {len(habitations)} habitations")
    print(f"Loaded {len(zones)} hazard zones")

    print("\nPreparing habitation features...")

    prepared_habitations = prepare_habitation_features(habitations, zones)

    output_file = save_prepared_data(prepared_habitations)

    print("\nPrepared dataset:")
    print(prepared_habitations.drop(columns="geometry").to_string())

    print(f"\nSaved prepared data to:\n{output_file}")


if __name__ == "__main__":
    main()
