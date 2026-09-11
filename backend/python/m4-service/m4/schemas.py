from dataclasses import dataclass
from typing import Optional, Literal


RiskLevel = Literal["low", "medium", "high"]


@dataclass(frozen=True)
class Zone:
    zone_id: str
    hazard_type: str
    risk_level: RiskLevel


@dataclass(frozen=True)
class Habitation:
    habitation_id: str
    name: str
    population: int
    current_zone_id: Optional[str]


@dataclass(frozen=True)
class SafeSite:
    site_id: str
    capacity_score: float
    available_land: float
    infra_access: float