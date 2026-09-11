from fastapi import FastAPI
from pydantic import BaseModel

from m4 import (
    calculate_hazard_scores,
    calculate_exposure_scores,
    calculate_vulnerability_scores,
    calculate_risk_scores,
)

app = FastAPI(
    title="RakshaGrid M4 Risk Service",
    version="1.0.0",
)


class RiskInput(BaseModel):
    habitation_id: str
    population: int

    flood_score: float
    landslide_score: float
    rainfall_score: float

    exposed_area_ratio: float

    vulnerable_population_ratio: float
    infrastructure_vulnerability: float
    access_constraint: float


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "rakshagrid-m4",
    }


@app.post("/risk")
def calculate_risk(data: RiskInput):
    base_input = data.model_dump()

    hazard = calculate_hazard_scores([base_input])[0]

    exposure = calculate_exposure_scores([base_input])[0]

    vulnerability = calculate_vulnerability_scores([base_input])[0]

    risk_input = {
        "habitation_id": data.habitation_id,
        "hazard_score": hazard["hazard_score"],
        "exposure_score": exposure["exposure_score"],
        "vulnerability_score": vulnerability["vulnerability_score"],
    }

    risk = calculate_risk_scores([risk_input])[0]

    return {
        "habitation_id": data.habitation_id,
        "hazard": hazard,
        "exposure": exposure,
        "vulnerability": vulnerability,
        "risk": risk,
    }