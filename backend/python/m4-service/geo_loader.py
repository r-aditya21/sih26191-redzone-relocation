"""
backend/geo_loader.py
======================

Loads the cleaned Chamoli GeoJSON datasets (`data/cleaned/*.geojson`)
and turns them into the `m4` package's `Zone` / `Habitation` / `SafeSite`
objects, so `m4.risk_engine` can score them.

Why this file needs to exist at all
------------------------------------
`chamoli_habitations.geojson` sets `current_zone_id: null` on every
single record — the field exists in the schema, but nothing in the raw
survey data populates it. `m4.risk_engine.calculate_habitation_priorities`
*requires* a real, non-null `current_zone_id` that matches a known zone
(it raises `ValueError` otherwise, by design — see
`test_missing_current_zone_id_is_rejected` /
`test_unknown_zone_reference_is_rejected` in `m4/test_risk_engine.py`).

So before this data can reach the risk engine at all, something has to
answer "which hazard zone polygon does this habitation point fall
inside?". That's a point-in-polygon spatial join, and it's what
`load_habitations()` below does.

Two habitations in the real dataset — H014 "Gopeshwar Central" and H015
"Pipalkoti Market Area", both tagged `primary_hazard: "none"` in the
source properties — don't fall inside *any* mapped hazard zone (this
lines up with them sitting right where the safe relocation sites
S002/S001 are). Rather than inventing a fake zone for them just to
satisfy the engine's validation, `load_habitations()` returns them
separately as `unzoned` records: they simply don't need a relocation
priority score.

On the point-in-polygon implementation
---------------------------------------
This dataset's zone and site polygons are all simple single-ring
rectangles (no holes, no MultiPolygons) — see `_zone_polygons()`. A
plain ray-casting test is enough and avoids adding a `shapely`/GDAL
dependency for what is currently ~10 small polygons. If the real hazard
zones later get more complex geometry (holes, multi-part polygons drawn
from actual GSI hazard mapping), swap `_point_in_polygon` for
`shapely.geometry.shape(zone_geom).contains(Point(x, y))` — everything
else in this file stays the same, since it only depends on getting back
a zone_id per habitation.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from m4.schemas import Zone, Habitation, SafeSite

# backend/geo_loader.py -> backend/ -> repo root -> data/cleaned
DATA_DIR = Path(__file__).resolve().parent / "data"


def _load_feature_collection(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(
            f"Expected GeoJSON file not found: {path}. "
            "Check that data/cleaned/ has been populated."
        )
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)["features"]


def _point_in_polygon(x: float, y: float, ring: list[list[float]]) -> bool:
    """Ray-casting point-in-polygon test against a single polygon ring."""
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y):
            x_intersect = (xj - xi) * (y - yi) / (yj - yi) + xi
            if x < x_intersect:
                inside = not inside
        j = i
    return inside


def _zone_polygons(data_dir: Path) -> list[tuple[str, list[list[float]]]]:
    features = _load_feature_collection(data_dir / "chamoli_zones.geojson")
    return [
        (f["properties"]["zone_id"], f["geometry"]["coordinates"][0])
        for f in features
    ]


def load_zones(data_dir: Path = DATA_DIR) -> list[Zone]:
    features = _load_feature_collection(data_dir / "chamoli_zones.geojson")
    return [
        Zone(
            zone_id=f["properties"]["zone_id"],
            hazard_type=f["properties"]["hazard_type"],
            risk_level=f["properties"]["risk_level"],
        )
        for f in features
    ]


def load_zone_extras(data_dir: Path = DATA_DIR) -> dict[str, dict]:
    """Raw per-zone fields the engine doesn't use (name, description),
    keyed by zone_id, for anything that wants to display them."""
    features = _load_feature_collection(data_dir / "chamoli_zones.geojson")
    return {f["properties"]["zone_id"]: f["properties"] for f in features}


def load_habitations(
    data_dir: Path = DATA_DIR,
) -> tuple[list[Habitation], list[dict]]:
    """
    Returns `(zoned_habitations, unzoned_records)`.

    `zoned_habitations` is ready to pass straight into
    `calculate_habitation_priorities`. `unzoned_records` holds the raw
    GeoJSON `properties` dict for every habitation that didn't resolve
    to a zone (either `current_zone_id` was already null AND no zone
    polygon contains its point, or it referenced a zone_id that isn't
    in the current zones file) — so callers can still report on them
    without violating the engine's "every habitation needs a real zone"
    validation.
    """
    features = _load_feature_collection(data_dir / "chamoli_habitations.geojson")
    polygons = _zone_polygons(data_dir)
    known_zone_ids = {zid for zid, _ in polygons}

    zoned: list[Habitation] = []
    unzoned: list[dict] = []

    for f in features:
        props = f["properties"]
        x, y = f["geometry"]["coordinates"]

        zone_id = props.get("current_zone_id")

        if zone_id and zone_id not in known_zone_ids:
            # Data-quality guard: a stale/typo'd zone reference should be
            # reported, not silently treated as "no zone".
            zone_id = None

        if not zone_id:
            for candidate_id, ring in polygons:
                if _point_in_polygon(x, y, ring):
                    zone_id = candidate_id
                    break

        if zone_id:
            zoned.append(
                Habitation(
                    habitation_id=props["habitation_id"],
                    name=props["name"],
                    population=props["population"],
                    current_zone_id=zone_id,
                )
            )
        else:
            unzoned.append(props)

    return zoned, unzoned


def load_sites(data_dir: Path = DATA_DIR) -> list[SafeSite]:
    features = _load_feature_collection(data_dir / "chamoli_sites.geojson")
    return [
        SafeSite(
            site_id=f["properties"]["site_id"],
            capacity_score=f["properties"]["capacity_score"],
            available_land=f["properties"]["available_land"],
            infra_access=f["properties"]["infra_access"],
        )
        for f in features
    ]


def load_site_extras(data_dir: Path = DATA_DIR) -> dict[str, dict]:
    """Raw per-site fields the scoring engine doesn't consume yet
    (name, water_access, road_distance_km, max_families, notes), keyed
    by site_id. `m4.schemas.SafeSite` intentionally only carries the
    three fields the suitability formula actually weighs — extend that
    dataclass (and the weights in `calculate_site_suitability`) if you
    decide water access or road distance should affect the score itself
    rather than just being displayed alongside it.
    """
    features = _load_feature_collection(data_dir / "chamoli_sites.geojson")
    return {f["properties"]["site_id"]: f["properties"] for f in features}
