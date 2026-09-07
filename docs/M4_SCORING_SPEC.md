# SafeShift — M4 Scoring Specification

## 1. Purpose

This document defines the current implementation specification for the
SafeShift M4 Risk & Optimization Engine.

M4 currently produces two separate outputs:

1. Habitation relocation priority.
2. Safe-site suitability.

The outputs are deterministic and explainable.

---

## 2. Habitation Relocation Priority

### 2.1 Objective

The habitation priority score represents the relative urgency for planned
relocation among the evaluated habitations.

A higher score means higher relocation priority.

### 2.2 Current Inputs

The current prototype uses:

| Input | Source | Purpose |
|---|---|---|
| risk_level | Zone | Represents hazard-risk severity |
| population | Habitation | Represents population exposure |
| current_zone_id | Habitation | Links habitation to its zone |

### 2.3 Risk-Level Mapping

The current prototype maps the categorical risk level to an ordinal
0–1 value:

| Risk Level | Prototype Score |
|---|---:|
| low | 0.333333 |
| medium | 0.666667 |
| high | 1.000000 |

This mapping preserves the ordering:

    low < medium < high

This is a prototype ordinal transformation and must be validated before
being treated as a final calibrated risk model.

### 2.4 Population Normalization

Population is normalized using min-max normalization across the evaluated
habitations:

    normalized_population =
        (population - population_min)
        /
        (population_max - population_min)

The normalized value is intended to lie between 0 and 1.

If all evaluated habitations have the same population, the current
implementation uses:

    normalized_population = 0.5

This prevents division by zero and produces deterministic behavior.

### 2.5 Current Prototype Weights

The current development configuration uses:

| Criterion | Weight |
|---|---:|
| Risk | 0.60 |
| Population | 0.40 |

Therefore:

    risk_weight + population_weight = 1.00

These weights are prototype defaults and are not yet claimed to be
final or empirically calibrated.

### 2.6 Priority Score

The current prototype uses weighted-sum aggregation:

    Priority Score =
        (0.60 × normalized_risk)
        +
        (0.40 × normalized_population)

The score is therefore bounded approximately between 0 and 1.

### 2.7 Priority Categories

The current prototype classifies the continuous score as:

| Score | Category |
|---:|---|
| >= 0.67 | HIGH |
| >= 0.34 and < 0.67 | MEDIUM |
| < 0.34 | LOW |

These thresholds are prototype thresholds and must be validated against
representative project data before final deployment.

---

## 3. Safe-Site Suitability

### 3.1 Objective

The safe-site suitability score represents the relative suitability of
candidate relocation sites.

A higher score means a more suitable candidate among the evaluated sites.

Suitability does not automatically mean legal, physical, environmental,
or administrative feasibility unless those constraints are represented
in the available data.

### 3.2 Current Inputs

The current prototype uses:

| Input | Purpose |
|---|---|
| capacity_score | Existing normalized site capacity score |
| available_land | Available land in hectares |
| infra_access | Infrastructure-access score |

### 3.3 Capacity Score

The project contract defines `capacity_score` as a float from 0 to 1
provided by the M4 methodology.

The current site-suitability engine therefore treats `capacity_score` as
already normalized.

It is not normalized again.

The underlying capacity formula must be documented separately once the
required capacity inputs are confirmed.

### 3.4 Infrastructure Access

`infra_access` is expected to be a normalized score:

    0 <= infra_access <= 1

Higher values represent better infrastructure access.

### 3.5 Available Land Normalization

Available land is normalized across the evaluated candidate sites using:

    normalized_land =
        (available_land - land_min)
        /
        (land_max - land_min)

If all candidate sites have the same available-land value, the current
implementation uses:

    normalized_land = 0.5

This avoids division by zero.

### 3.6 Current Prototype Weights

The current development configuration uses:

| Criterion | Weight |
|---|---:|
| Capacity | 0.50 |
| Available Land | 0.25 |
| Infrastructure Access | 0.25 |

Therefore:

    capacity_weight
    + land_weight
    + infrastructure_weight
    = 1.00

These weights are prototype defaults and require validation.

### 3.7 Suitability Score

The current prototype uses:

    Suitability Score =
        (0.50 × capacity_score)
        +
        (0.25 × normalized_land)
        +
        (0.25 × infra_access)

The resulting score is approximately bounded between 0 and 1.

---

## 4. Explainability

Every calculated result contains criterion-level information.

For habitation priority, the engine reports:

- risk level
- normalized risk
- risk weight
- risk contribution
- population
- normalized population
- population weight
- population contribution
- overall priority score

For site suitability, the engine reports:

- capacity score
- capacity weight
- capacity contribution
- available land
- normalized land
- land weight
- land contribution
- infrastructure access
- infrastructure weight
- infrastructure contribution
- overall suitability score

The contributions should reconcile with the overall score:

    overall score =
        sum of criterion contributions

This allows decision makers to understand why a result received its
ranking.

---

## 5. Validation Rules

### Habitation

The current implementation rejects:

- negative population
- missing current_zone_id
- unknown current_zone_id
- invalid risk level

### Safe Site

The current implementation rejects:

- capacity_score outside 0–1
- negative available_land
- infra_access outside 0–1

### Weights

Weights must:

- be non-empty
- be between 0 and 1
- contain the required criteria
- sum to 1

---

## 6. Determinism

The engine is deterministic.

For identical:

- input records
- weights
- methodology
- configuration

the same scores and ranking should be produced.

No machine-learning model or random process is required for the current
M4 scoring engine.

---

## 7. Ranking

Results are sorted by descending score.

Therefore:

    highest score → highest priority/suitability

Tied scores retain deterministic ordering based on the underlying input
processing order.

A formal tie-breaking policy may be introduced during later integration
if required by the team.

---

## 8. Current Limitations

The current implementation is a prototype.

The following require further validation:

1. Final habitation criteria.
2. Final safe-site criteria.
3. Final weights.
4. Risk-level transformation.
5. Priority thresholds.
6. Capacity-score calculation inputs.
7. Real Chamoli data validation.
8. Physical and administrative site-feasibility constraints.
9. Final tie-breaking policy.
10. Integration with M3 backend APIs.

These limitations are intentionally documented rather than hidden.

---

## 9. Validation Status

Current automated validation:

    14 tests passing

Current demonstration:

    m4/demo.py

Current methodology status:

    Prototype implementation
    Not yet final calibrated methodology

Before final presentation, M4 should validate the scoring behavior using
representative project data and document the rationale for the final
parameters.