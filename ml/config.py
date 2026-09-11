"""
Central configuration for the SIH 26191 M5 (AI/ML) pipeline.

WHY THIS FILE EXISTS
---------------------
Before this file existed, raw filenames ("chamoli_habitations.geojson"
etc.) were hardcoded independently in three different scripts. When the
real district dataset arrives, you should NOT need to hunt through
multiple files to change a filename or a CRS assumption — everything
that might change between the dummy dataset and a real one lives here.

HOW TO SWITCH TO REAL DATA
---------------------------
Option A (simplest): rename your real files to match the defaults below
and drop them in data/raw/. No code changes needed.

Option B: keep your real files' original names and set environment
variables before running the pipeline, e.g. (PowerShell):

    $env:SIH_HABITATIONS_FILE = "district_habitations.geojson"
    $env:SIH_ZONES_FILE       = "district_hazard_zones.geojson"
    $env:SIH_SITES_FILE       = "district_relocation_sites.geojson"
    python ml\run_pipeline.py

Either way, no other file in ml/ needs to be touched.
"""

import os
from pathlib import Path

# ------------------------------------------------------------------
# PATHS
# ------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]
INPUT_DATA_DIR = PROJECT_ROOT / "data" / os.environ.get(
    "SIH_INPUT_DATA_DIR", "cleaned"
)
PROCESSED_DATA_DIR = PROJECT_ROOT / "data" / "processed"

# ------------------------------------------------------------------
# INPUT FILENAMES (override via environment variables — see docstring)
# ------------------------------------------------------------------

HABITATIONS_FILENAME = os.environ.get(
    "SIH_HABITATIONS_FILE", "chamoli_habitations.geojson"
)
ZONES_FILENAME = os.environ.get(
    "SIH_ZONES_FILE", "chamoli_zones.geojson"
)
SITES_FILENAME = os.environ.get(
    "SIH_SITES_FILE", "chamoli_sites.geojson"
)

HABITATIONS_FILE = INPUT_DATA_DIR / HABITATIONS_FILENAME
ZONES_FILE = INPUT_DATA_DIR / ZONES_FILENAME
SITES_FILE = INPUT_DATA_DIR / SITES_FILENAME

# ------------------------------------------------------------------
# CRS / GEOSPATIAL CONFIGURATION
# ------------------------------------------------------------------

# The pipeline no longer hardcodes a single UTM zone (EPSG:32644).
# Instead it auto-detects the correct UTM zone from the data's own
# centroid at runtime (see ml/geo_utils.py: get_utm_epsg()).
# This flag exists so you can force a specific zone if you ever need to
# (e.g. for consistency with a GIS teammate's QGIS project), by setting:
#     $env:SIH_FORCE_UTM_EPSG = "32644"
FORCE_UTM_EPSG = os.environ.get("SIH_FORCE_UTM_EPSG")
if FORCE_UTM_EPSG is not None:
    FORCE_UTM_EPSG = int(FORCE_UTM_EPSG)

# ------------------------------------------------------------------
# RISK VOCABULARY
# ------------------------------------------------------------------

# Real hazard-atlas datasets (NDMA, GSI, CWC) do not always use this
# exact 3-word vocabulary. If the real dataset uses different labels
# (e.g. "severe", "moderate", "very high"), add the mapping here rather
# than editing prepare_data.py directly.
RISK_LEVEL_MAP = {
    "low": 1,
    "medium": 2,
    "high": 3,
    # Add real-dataset synonyms below as you encounter them, e.g.:
    # "moderate": 2,
    # "severe": 3,
    # "very high": 3,
}

# ------------------------------------------------------------------
# FEATURE / MODEL CONSTANTS
# ------------------------------------------------------------------

# Distance in meters at which hazard influence becomes ~0.
# This is a prototype assumption, not tied to real hazard-spread
# science (landslide run-out distance vs. flood inundation extent are
# physically different). Revisit if a domain expert / M4 provides a
# better basis before the real data arrives.
MAX_HAZARD_DISTANCE_M = 20000

# Estimated number of people accommodated per unit of available land
# (hectares). Prototype assumption — replace with actual planning
# standards once available.
PEOPLE_PER_LAND_UNIT = 1000

MAX_CAPACITY_UTILIZATION = 1.0

RISK_WEIGHT = 0.50
HAZARD_PROXIMITY_WEIGHT = 0.30
POPULATION_EXPOSURE_WEIGHT = 0.20
