"""
Shared validation helpers for the SIH 26191 M5 pipeline.

CALL THESE AT THE START OF EVERY SCRIPT THAT LOADS RAW OR PROCESSED
DATA, BEFORE any merge() / groupby() / join is performed on an ID
column.

WHY THIS FILE EXISTS (read this before deleting/skipping a check)
--------------------------------------------------------------------
Confirmed by direct testing: if habitation_id or site_id contains a
duplicate value, pandas.merge() silently performs a CROSS JOIN on the
duplicated rows instead of a clean 1:1 merge. Two habitations sharing
one ID by accident (very plausible with real, messy, multi-source
government data — village/ward code collisions happen constantly)
turned 2 input rows into 4 duplicated, population-double-counted
allocation rows, with the pipeline still printing "completed
successfully" and zero errors or warnings.

This is a disaster-management decision-support tool. Silently wrong
capacity/allocation numbers are worse than a loud crash. Every
validation function below raises a clear, specific ValueError instead
of allowing the pipeline to continue with corrupted data.
"""

from typing import Optional

import pandas as pd


def validate_unique_ids(df: pd.DataFrame, id_column: str, dataset_name: str) -> None:
    """
    Raise a clear error if id_column contains duplicate values.

    MUST be called before any pandas.merge() / groupby() that uses
    id_column as a key, otherwise duplicate IDs silently produce a
    cross-product instead of a clean 1:1 merge.
    """
    if id_column not in df.columns:
        raise ValueError(
            f"{dataset_name}: expected column '{id_column}' not found. "
            f"Available columns: {list(df.columns)}"
        )

    duplicated_mask = df[id_column].duplicated(keep=False)

    if duplicated_mask.any():
        duplicate_ids = sorted(df.loc[duplicated_mask, id_column].astype(str).unique().tolist())
        raise ValueError(
            f"{dataset_name}: duplicate values found in '{id_column}': {duplicate_ids}. "
            f"Every {id_column} must be unique before running the pipeline. "
            f"Fix the source data and re-run. Do NOT proceed with duplicate IDs — "
            f"this will silently corrupt downstream matching/allocation results "
            f"via a cross-product merge, not raise an error."
        )


def validate_required_columns(df: pd.DataFrame, required_columns: list, dataset_name: str) -> None:
    """
    Raise one clear, combined error listing ALL missing columns at once,
    instead of letting the pipeline crash on the first missing column
    with an unhelpful raw KeyError traceback.
    """
    missing = [column for column in required_columns if column not in df.columns]

    if missing:
        raise ValueError(
            f"{dataset_name}: missing required column(s): {missing}. "
            f"Available columns: {list(df.columns)}. "
            f"Check the real dataset's property names against the data contract "
            f"in docs/CONTRACT.md and update the raw file or the column mapping."
        )


def validate_range(
    df: pd.DataFrame,
    column: str,
    minimum: float,
    maximum: float,
    dataset_name: str,
) -> None:
    """Raise a clear error if any value in column falls outside [minimum, maximum]."""
    if column not in df.columns:
        return

    out_of_range = df[(df[column] < minimum) | (df[column] > maximum)]

    if not out_of_range.empty:
        bad_ids = out_of_range.iloc[:, 0].astype(str).tolist()
        raise ValueError(
            f"{dataset_name}: column '{column}' has {len(out_of_range)} value(s) "
            f"outside the expected range [{minimum}, {maximum}] "
            f"(first column values of offending rows: {bad_ids[:10]}). "
            f"This usually means a data-entry error or a units mismatch upstream."
        )


def validate_non_negative(df: pd.DataFrame, column: str, dataset_name: str) -> None:
    """Raise a clear error if any value in column is negative."""
    if column not in df.columns:
        return

    negative = df[df[column] < 0]

    if not negative.empty:
        raise ValueError(
            f"{dataset_name}: column '{column}' has {len(negative)} negative value(s), "
            f"which is not physically valid (e.g. negative population or negative land)."
        )


def validate_geometry_type(gdf, expected_type: str, dataset_name: str) -> None:
    """
    Raise a clear error if any geometry in gdf is not of expected_type
    ("Point" or "Polygon"). The pipeline assumes habitations are Points
    and zones/sites are Polygons but never checked this before — a
    wrong geometry type does not crash, it silently produces
    geometrically meaningless contains()/distance() results.
    """
    actual_types = gdf.geometry.geom_type.unique().tolist()

    if actual_types != [expected_type]:
        raise ValueError(
            f"{dataset_name}: expected all geometries to be '{expected_type}', "
            f"but found: {actual_types}. Mixed or wrong geometry types will not "
            f"raise a normal error later — they will silently produce incorrect "
            f"spatial calculations (e.g. contains()/distance() on the wrong shape)."
        )


def validate_risk_levels(gdf, column: str, known_levels: dict, dataset_name: str) -> None:
    """
    Raise a clear error if a risk_level (or similar categorical) column
    contains any value not present in known_levels (case-insensitive).

    Previously, an unrecognized risk_level string silently mapped to
    NaN, and NaN flowing into idxmax() silently picked an
    arbitrary/undefined "highest risk zone" with no error at all. Real
    hazard-atlas datasets frequently use vocabulary this pipeline's
    original 3-word map ("low"/"medium"/"high") did not anticipate
    (e.g. "severe", "moderate", "very high") — add real synonyms to
    ml/config.py's RISK_LEVEL_MAP rather than silently failing here.
    """
    if column not in gdf.columns:
        raise ValueError(f"{dataset_name}: expected column '{column}' not found.")

    actual_values = set(gdf[column].astype(str).str.lower().unique())
    known_values = set(known_levels.keys())
    unknown_values = actual_values - known_values

    if unknown_values:
        raise ValueError(
            f"{dataset_name}: column '{column}' contains value(s) not recognized "
            f"by RISK_LEVEL_MAP in ml/config.py: {sorted(unknown_values)}. "
            f"Known values: {sorted(known_values)}. "
            f"Add the real dataset's vocabulary to RISK_LEVEL_MAP before proceeding — "
            f"an unrecognized value would otherwise silently become NaN and produce "
            f"an undefined 'highest risk zone' result with no error."
        )


def repair_invalid_geometries(gdf, dataset_name: str, verbose: bool = True):
    """
    Attempt to repair invalid geometries (self-intersecting polygons
    etc.) using the standard buffer(0) trick, and warn loudly about how
    many were fixed. Real government shapefile/GeoJSON exports commonly
    contain a handful of invalid polygons; contains()/distance() on an
    invalid geometry can silently return wrong results rather than
    raising an error.
    """
    invalid_mask = ~gdf.geometry.is_valid
    invalid_count = int(invalid_mask.sum())

    if invalid_count > 0:
        if verbose:
            print(
                f"WARNING: {dataset_name}: {invalid_count} invalid geometries found "
                f"and auto-repaired with buffer(0). Recommend re-checking these "
                f"records against the original source data — auto-repair can change "
                f"a geometry's shape slightly."
            )
        gdf = gdf.copy()
        gdf.loc[invalid_mask, "geometry"] = gdf.loc[invalid_mask, "geometry"].buffer(0)

    return gdf
