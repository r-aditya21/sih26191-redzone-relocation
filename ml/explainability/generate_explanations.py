"""
Stage 8 of the SIH 26191 pipeline: Explainability report.

WHAT THIS IS AND ISN'T
------------------------
This module produces a human-readable "why is this habitation
high-risk?" breakdown for every habitation, plus a simple
natural-language query interface ("Why is H001 high risk?").

It is intentionally NOT a machine-learning model, and does NOT use
SHAP/LIME or any other post-hoc black-box explainer. There is no
black box here to explain — every number in this report is a
sub-component of the same transparent weighted-sum formula computed
in ml/models/relocation_priority.py. This module's only job is to
translate those already-computed numbers into plain English and
structure them the way a decision-maker or dashboard would want to
read them.

This matches the team's own decision (recorded in the M5 audit):
building a Random Forest / XGBoost / deep-learning model on a dataset
with no historical relocation-outcome labels would be memorization,
not learning, and would not survive a judge asking "what's your
validation accuracy?". An explainability layer over a transparent
formula is honest AI-adjacent work that does not make a claim the
data can't support.

HONESTY ABOUT "Historical disaster events"
--------------------------------------------
The example format your teammate shared includes a "Historical
disaster events" reason. The CURRENT dataset (habitation/zone/site
GeoJSON, per docs/CONTRACT.md) has NO field for past disaster
history — no such data exists yet, dummy or real. This module does
NOT fabricate that bullet. Instead:
  - It only includes a historical-events reason if an optional
    `historical_event_count` (or similar) column is present in the
    input data.
  - If that data is genuinely unavailable (true today), it is listed
    under `data_gaps` in the output, not silently invented as a bullet
    in the explanation. When the real dataset (or a supplementary
    historical-events source) arrives with this field, no code change
    is needed here — just add the column and it will be picked up
    automatically (see OPTIONAL_HISTORICAL_EVENTS_COLUMN below).

INPUTS
------
Reads data/processed/relocation_priorities.csv (produced by
ml/models/relocation_priority.py) as the primary source — it already
carries every sub-score needed for an explanation. Optionally enriches
each row with allocation info (site_id, distance_km, allocation_status)
from data/processed/relocation_allocations.csv, if that file exists
and the pipeline has reached that stage.

OUTPUTS
-------
- data/processed/explanations.csv   (flat table, one row per habitation)
- data/processed/explanations.json  (structured, ready for an API /
  frontend "explain this village" panel — this is the shape a future
  GET /habitations/<id>/explanation endpoint would naturally return)
"""

import json
import re
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import PROCESSED_DATA_DIR  # noqa: E402

PRIORITIES_FILE = PROCESSED_DATA_DIR / "relocation_priorities.csv"
ALLOCATIONS_FILE = PROCESSED_DATA_DIR / "relocation_allocations.csv"

OUTPUT_CSV = PROCESSED_DATA_DIR / "explanations.csv"
OUTPUT_JSON = PROCESSED_DATA_DIR / "explanations.json"

# If/when a historical-events dataset becomes available, add a column
# with this name to prepared_habitations.csv (or merge it in here) and
# it will automatically be included as a real reason instead of a
# data-gap notice. Until then, this column will simply not be found,
# and the module behaves honestly rather than guessing.
OPTIONAL_HISTORICAL_EVENTS_COLUMN = "historical_event_count"

# Maps this module's own 4-level PRIORITY vocabulary (CRITICAL/HIGH/
# MEDIUM/LOW, from ml/models/relocation_priority.py) to the 3-level
# URGENCY vocabulary already wired into the live backend
# (backend/src/scoring/priorityScore.ts: immediate/short-term/
# medium-term). These are NOT the same scale and were built
# independently by M4 and M5 (see the audit report, Part 2E/12) — this
# mapping is provided so a dashboard can show either vocabulary without
# more code, but the team should decide with M3/M4 which one is
# actually surfaced to end users, rather than showing both.
PRIORITY_LEVEL_TO_URGENCY = {
    "CRITICAL": "immediate",
    "HIGH": "immediate",
    "MEDIUM": "short-term",
    "LOW": "medium-term",
}

# Thresholds used to turn a continuous 0-1 sub-score into a plain-English
# intensity word. These are display thresholds only — they do not
# change any upstream score, they just describe it.
HIGH_THRESHOLD = 0.66
MODERATE_THRESHOLD = 0.33


def describe_intensity(score: float) -> str:
    """Turn a 0-1 score into 'High' / 'Moderate' / 'Low', for display only."""
    if pd.isna(score):
        return "Unknown"
    if score >= HIGH_THRESHOLD:
        return "High"
    if score >= MODERATE_THRESHOLD:
        return "Moderate"
    return "Low"


def build_reasons(row: pd.Series) -> list:
    """
    Build the list of plain-English reason bullets for one habitation.

    Every bullet here is a direct, honest restatement of a number that
    ml/models/relocation_priority.py already computed — nothing is
    invented. If a future column isn't present, its bullet is simply
    not generated (see build_data_gaps() for what's flagged instead).
    """
    reasons = []

    hazard_type = str(row.get("hazard_type", "none"))
    in_hazard_zone = bool(row.get("in_hazard_zone", False))
    risk_intensity = describe_intensity(row.get("risk_normalized"))
    proximity_intensity = describe_intensity(row.get("hazard_proximity_score"))
    population_intensity = describe_intensity(row.get("population_normalized"))
    exposure_intensity = describe_intensity(row.get("risk_exposure_score"))

    # Reason 1: direct hazard-zone membership / type, only if the
    # habitation is actually inside a zone (matches "flood exposure" /
    # "landslide hazard" style from the example) OR reasonably close.
    if in_hazard_zone and hazard_type not in ("none", "nan", ""):
        reasons.append(
            f"{risk_intensity} {hazard_type} hazard exposure "
            f"(habitation lies within a classified '{row.get('risk_level', 'unknown')}' risk zone)."
        )
    elif proximity_intensity in ("High", "Moderate"):
        distance_m = row.get("distance_to_nearest_hazard_m")
        distance_text = f"{distance_m:.0f} m" if pd.notna(distance_m) else "an unspecified distance"
        reasons.append(
            f"{proximity_intensity} proximity to a hazard zone "
            f"(nearest hazard boundary is approximately {distance_text} away)."
        )

    # Reason 2: population exposure.
    if population_intensity in ("High", "Moderate"):
        population = row.get("population")
        population_text = f"{int(population):,}" if pd.notna(population) else "an unspecified number of"
        reasons.append(
            f"{population_intensity} population exposure "
            f"({population_text} people are concentrated close to the hazard)."
        )

    # Reason 3: combined vulnerability (risk x proximity), only called
    # out separately when it is meaningfully high, to avoid repeating
    # reason 1 in different words when it isn't adding information.
    if exposure_intensity == "High":
        reasons.append(
            "High overall vulnerability — both hazard risk and hazard "
            "proximity are elevated at the same time."
        )

    # Reason 4 (OPTIONAL, only if the data genuinely exists): historical
    # disaster events. See module docstring — never fabricated.
    if OPTIONAL_HISTORICAL_EVENTS_COLUMN in row.index and pd.notna(
        row[OPTIONAL_HISTORICAL_EVENTS_COLUMN]
    ):
        event_count = row[OPTIONAL_HISTORICAL_EVENTS_COLUMN]
        if event_count and event_count > 0:
            reasons.append(
                f"Historical disaster events on record: {int(event_count)} "
                f"past event(s) affecting this habitation."
            )

    if not reasons:
        reasons.append(
            "No significant hazard, proximity, or population exposure factors "
            "were identified for this habitation with the current data."
        )

    return reasons


def build_data_gaps(row: pd.Series) -> list:
    """
    List what information this explanation is MISSING, so a
    decision-maker knows the explanation is incomplete rather than
    assuming it's exhaustive. This is the honest counterpart to
    build_reasons() — it says what we don't know instead of guessing.
    """
    gaps = []

    if OPTIONAL_HISTORICAL_EVENTS_COLUMN not in row.index or pd.isna(
        row.get(OPTIONAL_HISTORICAL_EVENTS_COLUMN)
    ):
        gaps.append(
            "Historical disaster event records are not available in the "
            "current dataset for this habitation."
        )

    return gaps


def build_explanation(row: pd.Series) -> dict:
    """Build the full structured explanation for one habitation."""

    priority_level = str(row.get("priority_level", "UNKNOWN")).upper()
    priority_score = row.get("relocation_priority_score")
    overall_risk_100 = (
        round(float(priority_score) * 100) if pd.notna(priority_score) else None
    )

    explanation = {
        "habitation_id": row.get("habitation_id"),
        "name": row.get("name"),
        "overall_risk_score": overall_risk_100,
        "priority_level": priority_level,
        "urgency": PRIORITY_LEVEL_TO_URGENCY.get(priority_level, "unknown"),
        "reasons": build_reasons(row),
        "data_gaps": build_data_gaps(row),
    }

    # Enrich with allocation info if available (optional — the
    # explanation still works before the optimizer stage has run).
    for optional_field in ("site_id", "distance_km", "allocation_status"):
        if optional_field in row.index and pd.notna(row.get(optional_field)):
            explanation[optional_field] = row[optional_field]

    return explanation


def format_explanation_text(explanation: dict) -> str:
    """
    Render one explanation as the plain-text block shown in the example
    your teammate shared (bullets + overall risk + priority).
    """
    lines = [f"Why is {explanation['habitation_id']} high risk?", ""]

    for reason in explanation["reasons"]:
        lines.append(f"* {reason}")

    lines.append("")
    lines.append(f"Overall Risk: {explanation['overall_risk_score']}/100")
    lines.append(f"Priority: {explanation['priority_level']}")

    if explanation["data_gaps"]:
        lines.append("")
        lines.append("Data limitations:")
        for gap in explanation["data_gaps"]:
            lines.append(f"- {gap}")

    return "\n".join(lines)


def answer_query(question: str, explanations_by_id: dict) -> str:
    """
    OPTIONAL natural-language query interface.

    Deliberately simple and NOT an ML/NLP model: it looks for a
    habitation ID pattern in the question (e.g. "H001") and, if found
    and known, returns that habitation's explanation text. This is
    template matching, not language understanding — appropriate for a
    prototype where the input vocabulary (habitation IDs) is small and
    fixed, and consistent with the team's decision not to force ML
    where it isn't warranted.

    If no known ID is found, returns a helpful message listing valid
    IDs rather than guessing.
    """
    known_ids = list(explanations_by_id.keys())

    # Look for any token in the question that matches a known
    # habitation_id, case-insensitively.
    tokens = re.findall(r"[A-Za-z0-9_-]+", question.upper())

    for token in tokens:
        for habitation_id in known_ids:
            if token == str(habitation_id).upper():
                return format_explanation_text(explanations_by_id[habitation_id])

    sample_ids = ", ".join(str(i) for i in known_ids[:5])
    return (
        "I couldn't find a matching habitation ID in that question. "
        f"Known habitation IDs include: {sample_ids}"
        + ("..." if len(known_ids) > 5 else "")
        + ". Try asking, for example: \"Why is "
        + (str(known_ids[0]) if known_ids else "H001")
        + " high risk?\""
    )


def main():

    print("Loading relocation priority data...")

    if not PRIORITIES_FILE.exists():
        raise FileNotFoundError(
            f"Expected priorities file not found:\n{PRIORITIES_FILE}\n"
            f"Run ml/models/relocation_priority.py first."
        )

    priorities = pd.read_csv(PRIORITIES_FILE)
    print(f"Loaded {len(priorities)} habitations")

    # Optionally enrich with allocation info, if that stage has run.
    if ALLOCATIONS_FILE.exists():
        print("Enriching with allocation data...")
        allocations = pd.read_csv(ALLOCATIONS_FILE)
        enrich_columns = [
            column
            for column in ["habitation_id", "site_id", "distance_km", "allocation_status"]
            if column in allocations.columns
        ]
        priorities = priorities.merge(
            allocations[enrich_columns], on="habitation_id", how="left"
        )
    else:
        print("No allocation data found yet — explanations will not include site assignment.")

    print("\nGenerating explanations...")

    explanations = [build_explanation(row) for _, row in priorities.iterrows()]
    explanations_by_id = {explanation["habitation_id"]: explanation for explanation in explanations}

    # --- Save flat CSV ---
    csv_rows = []
    for explanation in explanations:
        csv_rows.append(
            {
                "habitation_id": explanation["habitation_id"],
                "name": explanation["name"],
                "overall_risk_score": explanation["overall_risk_score"],
                "priority_level": explanation["priority_level"],
                "urgency": explanation["urgency"],
                "reasons": " | ".join(explanation["reasons"]),
                "data_gaps": " | ".join(explanation["data_gaps"]),
                "site_id": explanation.get("site_id"),
                "distance_km": explanation.get("distance_km"),
                "allocation_status": explanation.get("allocation_status"),
            }
        )

    pd.DataFrame(csv_rows).to_csv(OUTPUT_CSV, index=False)

    # --- Save structured JSON (API/frontend-ready) ---
    with open(OUTPUT_JSON, "w", encoding="utf-8") as json_file:
        json.dump(explanations, json_file, indent=2, default=str)

    print(f"\nSaved {len(explanations)} explanations to:\n{OUTPUT_CSV}\n{OUTPUT_JSON}")

    # --- Demo: print one full example, and answer a sample NL query ---
    if explanations:
        print("\n" + "=" * 70)
        print("EXAMPLE EXPLANATION")
        print("=" * 70)
        print(format_explanation_text(explanations[0]))

        example_id = explanations[0]["habitation_id"]
        print("\n" + "=" * 70)
        print(f'EXAMPLE NL QUERY: "Why is {example_id} high risk?"')
        print("=" * 70)
        print(answer_query(f"Why is {example_id} high risk?", explanations_by_id))


if __name__ == "__main__":
    main()
