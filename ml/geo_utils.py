"""
Shared geospatial utilities for the SIH 26191 M5 pipeline.

Previously, EPSG:32644 (UTM zone 44N) was hardcoded in prepare_data.py.
That is only the correct projected CRS for locations roughly between
78 deg E and 84 deg E (most of Uttarakhand, but NOT most of India).
If the real dataset is for a district outside that band, the pipeline
would still run (no crash) but silently produce distorted distance
calculations.

get_utm_epsg() fixes this by computing the correct UTM zone from the
data's own centroid every time the pipeline runs, so it works for any
Indian district without code changes.

haversine_distance() was previously duplicated in two different files
with two different levels of accuracy (a flat degree*111 approximation
in match_habitations_to_sites.py, and a correct implementation in
relocation_optimizer.py). This module is now the single source of
truth — both callers import from here.
"""

import math

import pandas as pd


def get_utm_epsg(gdf, force_epsg: int | None = None) -> int:
    """
    Determine the correct UTM EPSG code for a GeoDataFrame's location.

    Uses the centroid of all geometries to pick the zone. This is
    correct for any single Indian district, which never spans more
    than one UTM zone in practice.

    Pass force_epsg (e.g. from ml.config.FORCE_UTM_EPSG) to bypass
    auto-detection and use a specific zone instead.
    """
    if force_epsg is not None:
        return force_epsg

    centroid = gdf.geometry.union_all().centroid
    longitude, latitude = centroid.x, centroid.y

    zone_number = int((longitude + 180) / 6) + 1
    is_northern_hemisphere = latitude >= 0

    return (32600 if is_northern_hemisphere else 32700) + zone_number


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great-circle distance between two lat/lon coordinates.

    Returns distance in kilometres. This is the single accurate
    distance implementation for the whole pipeline — every module that
    needs a habitation-to-site or habitation-to-zone distance in
    kilometres should import this function rather than writing its own.
    """
    earth_radius_km = 6371.0

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    delta_lat = lat2_rad - lat1_rad
    delta_lon = lon2_rad - lon1_rad

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return earth_radius_km * c


def normalize_min_max(series: pd.Series) -> pd.Series:
    """
    Min-max normalize a numeric series to the 0-1 range.

    Single shared implementation used by every feature-building module,
    so the min==max edge case (every value in the dataset identical —
    plausible in a small district with very few candidate relocation
    sites) is handled the SAME way everywhere in the codebase.

    Convention: when every value is identical, return a NEUTRAL 0.5
    rather than 0.0 ("worst") or 1.0 ("best") — there is no information
    in the data to justify treating a uniform feature as either extreme.
    This also matches M4's own _min_max_normalize() convention
    (m4/risk_engine.py), so the two scoring systems agree on this edge
    case if they are ever reconciled.
    """
    minimum = series.min()
    maximum = series.max()

    if pd.isna(minimum) or pd.isna(maximum):
        return pd.Series([0.5] * len(series), index=series.index)

    if maximum == minimum:
        return pd.Series([0.5] * len(series), index=series.index)

    return (series - minimum) / (maximum - minimum)
