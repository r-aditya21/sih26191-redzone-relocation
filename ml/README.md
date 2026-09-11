# SIH 26191 — M5 (AI/ML) Pipeline

Geospatial risk scoring, capacity-aware relocation allocation, and
explainability layer for hazard-based red-zone identification and
relocation planning.

## What this is (and isn't)

This is a **deterministic MCDA (multi-criteria decision analysis)
scoring formula + geospatial rule-based classification + a greedy
capacity-aware optimizer + a template-based explanation generator**.
It is **not** a trained machine-learning model. With only a handful of
dummy habitations/sites and no historical relocation-outcome labels,
there is no valid ground truth to train or validate a supervised model
against — building one anyway would be memorization dressed up as AI.
This was a deliberate decision, not an oversight (see the M5 audit
report for the full reasoning).

## Setup

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Running the pipeline

```powershell
python ml\run_pipeline.py
```

Runs all 8 stages in order and writes outputs to `data/processed/`.

## Switching to the real dataset

1. Drop your real district's GeoJSON files into `data/raw/`.
2. Either name them `chamoli_habitations.geojson`,
   `chamoli_zones.geojson`, `chamoli_sites.geojson` (matching the
   defaults), **or** point at your real filenames without renaming
   anything, via environment variables:

   ```powershell
   $env:SIH_HABITATIONS_FILE = "district_habitations.geojson"
   $env:SIH_ZONES_FILE       = "district_hazard_zones.geojson"
   $env:SIH_SITES_FILE       = "district_relocation_sites.geojson"
   python ml\run_pipeline.py
   ```

3. Re-run. No code changes should be needed. The pipeline will:
   - Auto-detect the correct UTM zone from your data's own location
     (no longer hardcoded to Chamoli's zone).
   - **Fail loudly with a clear message** if `habitation_id`/`site_id`
     values are duplicated, a required column is missing, or a value
     is out of a valid range — rather than silently producing wrong
     numbers. This is intentional: a fail-fast error is much easier to
     fix than a wrong-but-plausible-looking relocation recommendation.

## Required input schema

**Habitations** (Point geometry): `habitation_id` (unique),
`name`, `population` (≥0).

**Hazard zones** (Polygon geometry): `zone_id` (unique),
`hazard_type` (any string), `risk_level` (must be `low`/`medium`/`high`,
case-insensitive — add real-dataset synonyms to `RISK_LEVEL_MAP` in
`ml/config.py` if your source uses different vocabulary, e.g.
`"severe"`, `"moderate"`).

**Relocation sites** (Polygon geometry): `site_id` (unique),
`capacity_score` (0–1), `available_land` (≥0, hectares),
`infra_access` (0–1).

**Optional**: `historical_event_count` on habitations — if present,
the explainability module will automatically include it as a reason;
if absent (the case today), it's honestly listed as a data gap rather
than guessed at.

## Pipeline stages

| # | Script | Output |
|---|---|---|
| 1 | `ml/data/prepare_data.py` | `prepared_habitations.csv` |
| 2 | `ml/features/build_habitation_features.py` | `habitation_features.csv` |
| 3 | `ml/features/build_site_features.py` | `site_features.csv` |
| 4 | `ml/models/relocation_priority.py` | `relocation_priorities.csv` |
| 5 | `ml/matching/match_habitations_to_sites.py` | `habitation_site_matches.csv` — **baseline/reference only, not capacity-aware** |
| 6 | `ml/optimization/relocation_optimizer.py` | `relocation_allocations.csv`, `unassigned_habitations.csv`, `site_allocation_summary.csv` — **authoritative** |
| 7 | `ml/recommendations/generate_recommendations.py` | `relocation_recommendations.csv` |
| 8 | `ml/explainability/generate_explanations.py` | `explanations.csv`, `explanations.json` |

## Configuration

All filenames, the CRS/UTM behavior, risk vocabulary, and scoring
weights live in `ml/config.py`. Shared geospatial helpers (UTM zone
detection, haversine distance, min-max normalization) live in
`ml/geo_utils.py`. Shared data-quality checks live in `ml/validation.py`.
Change these three files, not the individual pipeline stages, when
tuning behavior.

## Known open items for the team (not blocking, but worth a conversation)

- This pipeline's `priority_level` (CRITICAL/HIGH/MEDIUM/LOW) is a
  **different vocabulary and formula** from M4's `urgency`
  (immediate/short-term/medium-term), which is what's actually wired
  into the live backend API. `ml/explainability/generate_explanations.py`
  includes a mapping between the two so a dashboard isn't blocked, but
  the team should decide which system is the one actually shown to
  users, rather than shipping both.
- No code in this repo yet connects these CSV/JSON outputs to the
  backend — that integration still needs to be built (by M3/M6, or by
  you, depending on how the team splits remaining work).
- `MAX_HAZARD_DISTANCE_M` (20km hazard-influence cutoff) and
  `PEOPLE_PER_LAND_UNIT` (capacity-per-hectare estimate) in
  `ml/config.py` are prototype assumptions, not sourced from a
  hazard-specific or planning-standard reference. Worth a one-line
  callout in the demo if a judge asks about methodology.
