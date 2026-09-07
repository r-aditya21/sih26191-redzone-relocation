# Data & API Contract

Locked on Day 1. Any change to this file must be flagged to the whole team
before building against it.

## Data schema

### Zone
| field | type | notes |
|---|---|---|
| zone_id | string | unique id |
| hazard_type | string | landslide / flood / erosion / cloudburst |
| risk_level | string | low / medium / high |
| geometry | GeoJSON polygon | |

### Habitation
| field | type | notes |
|---|---|---|
| habitation_id | string | unique id |
| name | string | |
| population | integer | |
| coordinates | GeoJSON point | |
| current_zone_id | string | references Zone.zone_id |

### Safe Site
| field | type | notes |
|---|---|---|
| site_id | string | unique id |
| capacity_score | float | 0–1, from M4's formula |
| available_land | float | in hectares |
| infra_access | float | 0–1 score |
| geometry | GeoJSON polygon | |

## API endpoints (owned by M3)

| Method | Endpoint | Returns |
|---|---|---|
| GET | /zones | All classified red zones |
| GET | /habitations | All habitations with population + current zone |
| GET | /sites | Candidate safe relocation sites with capacity scores |
| GET | /priorities | Ranked relocation priority list |

## Case study region
Chamoli uttarakhand