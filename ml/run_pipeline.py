"""
SIH 26191
GEOSPATIAL SCORING + CAPACITY-AWARE ALLOCATION PIPELINE

Runs the complete relocation prioritization / allocation / explanation
pipeline in the correct order.

NOTE ON TERMINOLOGY: this pipeline is a deterministic MCDA scoring
formula + geospatial rule-based classification + a greedy
capacity-aware optimizer + a template-based explanation generator.
There is no trained machine-learning model in it, deliberately: the
available dataset has no historical relocation outcomes to validate a
model against, so a "predictive model" would just be memorization
dressed up as AI. This is intentional and matches the M5 role's own
brief ("keep [ML] only if it clearly outperforms the simple formula").
"""

import subprocess
import sys
from pathlib import Path


# ============================================================
# PROJECT CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]


# ============================================================
# PIPELINE STEPS
# ============================================================

PIPELINE_STEPS = [

    (
        "STEP 1: Preparing habitation and hazard data",
        "ml/data/prepare_data.py"
    ),

    (
        "STEP 2: Building habitation features",
        "ml/features/build_habitation_features.py"
    ),

    (
        "STEP 3: Building relocation site features",
        "ml/features/build_site_features.py"
    ),

    (
        "STEP 4: Calculating relocation priorities",
        "ml/models/relocation_priority.py"
    ),

    (
        "STEP 5: Matching habitations to relocation sites",
        "ml/matching/match_habitations_to_sites.py"
    ),

    (
        "STEP 6: Running global relocation optimization",
        "ml/optimization/relocation_optimizer.py"
    ),

    (
        "STEP 7: Generating final recommendations",
        "ml/recommendations/generate_recommendations.py"
    ),

    (
        "STEP 8: Generating explainability report",
        "ml/explainability/generate_explanations.py"
    )
]


# ============================================================
# RUN PIPELINE
# ============================================================

def run_pipeline():

    print("\n" + "=" * 70)
    print("SIH 26191")
    print("GLOBAL RELOCATION OPTIMIZATION ENGINE")
    print("GEOSPATIAL SCORING + CAPACITY-AWARE ALLOCATION PIPELINE")
    print("=" * 70)

    print(
        f"\nProject root:\n{PROJECT_ROOT}"
    )

    print(
        f"\nTotal pipeline steps: "
        f"{len(PIPELINE_STEPS)}"
    )

    # --------------------------------------------------------
    # Run each pipeline step
    # --------------------------------------------------------

    for step_number, (
        step_name,
        script_path
    ) in enumerate(
        PIPELINE_STEPS,
        start=1
    ):

        print("\n" + "-" * 70)

        print(
            f"RUNNING {step_name}"
        )

        print("-" * 70)

        full_script_path = (
            PROJECT_ROOT / script_path
        )

        # Check if script exists

        if not full_script_path.exists():

            print(
                f"\nERROR: Pipeline script not found:\n"
                f"{full_script_path}"
            )

            print(
                "\nPipeline stopped."
            )

            sys.exit(1)

        # Run the script

        try:

            result = subprocess.run(

                [
                    sys.executable,
                    str(full_script_path)
                ],

                cwd=PROJECT_ROOT,

                check=True
            )

            print(
                f"\n✓ {step_name} completed successfully"
            )

        except subprocess.CalledProcessError:

            print(
                f"\n✗ ERROR: {step_name} failed."
            )

            print(
                "\nPipeline stopped to prevent "
                "incorrect downstream results."
            )

            sys.exit(1)

    # ========================================================
    # PIPELINE COMPLETED
    # ========================================================

    print("\n" + "=" * 70)

    print(
        "PIPELINE COMPLETED SUCCESSFULLY"
    )

    print("=" * 70)

    print(
        "\nFinal outputs are available in:"
    )

    print(
        PROJECT_ROOT / "data" / "processed"
    )

    print(
        "\nAUTHORITATIVE outputs (use these):"
    )

    print(
        "- relocation_priorities.csv        (per-habitation priority score/level)"
    )

    print(
        "- relocation_allocations.csv       (capacity-aware final assignments)"
    )

    print(
        "- unassigned_habitations.csv       (habitations that didn't fit anywhere)"
    )

    print(
        "- site_allocation_summary.csv      (per-site capacity utilization)"
    )

    print(
        "- relocation_recommendations.csv   (human-readable recommendations)"
    )

    print(
        "- explanations.csv / explanations.json  (per-habitation 'why' breakdown)"
    )

    print(
        "\nBASELINE / REFERENCE only (not capacity-aware, do not use as final plan):"
    )

    print(
        "- habitation_site_matches.csv"
    )

    print(
        "\nPipeline is ready for backend integration."
    )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    run_pipeline()