from .schemas import Zone, Habitation, SafeSite

from .risk_engine import (
    # habitation / safe-site scoring (used by the relocation dashboard)
    calculate_habitation_priorities,
    calculate_site_suitability,
    # multi-factor risk pipeline (hazard -> exposure -> vulnerability -> risk)
    # FIX: these were implemented and tested (test_risk_pipeline.py) but
    # never re-exported from the package, so any caller outside of
    # `m4.risk_engine` itself (e.g. a future API layer importing `m4`)
    # could not reach them without reaching into the private submodule.
    calculate_hazard_scores,
    calculate_exposure_scores,
    calculate_vulnerability_scores,
    calculate_risk_scores,
    classify_risk_score,
)

__all__ = [
    "Zone",
    "Habitation",
    "SafeSite",
    "calculate_habitation_priorities",
    "calculate_site_suitability",
    "calculate_hazard_scores",
    "calculate_exposure_scores",
    "calculate_vulnerability_scores",
    "calculate_risk_scores",
    "classify_risk_score",
]