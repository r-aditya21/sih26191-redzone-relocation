"""
backend/test_geo_loader.py

Covers the one genuinely tricky piece of glue code in this repo: the
point-in-polygon spatial join that resolves each habitation's
current_zone_id (always null in the raw GeoJSON) against the mapped
hazard zone polygons.

Run from the repo root with pytest configured as in m4/ (see the
m4_project README this repo's m4/ package came from) — or directly:
    python -m pytest backend/
"""

from geo_loader import load_zones, load_habitations, load_sites
from m4.risk_engine import calculate_habitation_priorities, calculate_site_suitability


def test_all_zones_load():
    zones = load_zones()
    assert len(zones) == 10
    assert all(z.risk_level in {"low", "medium", "high"} for z in zones)


def test_habitations_split_into_zoned_and_unzoned():
    zoned, unzoned = load_habitations()
    assert len(zoned) == 13
    assert len(unzoned) == 2
    assert {u["habitation_id"] for u in unzoned} == {"H014", "H015"}
    # both unzoned records are explicitly tagged with no hazard in the
    # source data, which is why they don't land in a zone polygon
    assert all(u["primary_hazard"] == "none" for u in unzoned)


def test_known_habitation_zone_assignments():
    zoned, _ = load_habitations()
    by_id = {h.habitation_id: h for h in zoned}
    # spot-check a few against the source data's own primary_hazard field
    assert by_id["H001"].current_zone_id == "Z001"  # Joshimath -> landslide subsidence zone
    assert by_id["H004"].current_zone_id == "Z002"  # Reni Village -> GLOF zone
    assert by_id["H006"].current_zone_id == "Z003"  # Chamoli Town -> flood plain
    assert by_id["H013"].current_zone_id == "Z010"  # Urgam Village -> low-risk landslide zone


def test_zoned_habitations_are_engine_ready():
    zones = load_zones()
    zoned, _ = load_habitations()
    # this is the real assertion: if the spatial join produced a bad or
    # missing zone reference, this raises ValueError (see
    # m4/test_risk_engine.py's own validation tests)
    results = calculate_habitation_priorities(zoned, zones)
    assert len(results) == 13
    assert results[0]["priority_score"] >= results[-1]["priority_score"]


def test_sites_load_and_score():
    sites = load_sites()
    assert len(sites) == 7
    results = calculate_site_suitability(sites)
    assert len(results) == 7
    assert results[0]["suitability_score"] >= results[-1]["suitability_score"]
