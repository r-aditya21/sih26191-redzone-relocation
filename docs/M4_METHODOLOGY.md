# SafeShift — M4 Risk & Optimization Methodology

## 1. Purpose

M4 is responsible for designing a transparent, explainable, deterministic,
and defensible risk-prioritization and safe-site assessment methodology
for SafeShift.

The methodology will support:

1. Prioritization of vulnerable habitations for planned relocation.
2. Assessment of candidate safe relocation sites.
3. Transparent explanation of why a habitation or site receives its score.

The methodology is intended to support government disaster-management
decision making and must remain reproducible and understandable to
decision makers.

---

## 2. Scope

M4 covers:

* risk and relocation-priority methodology
* MCDA criteria
* criterion classification
* normalization
* weighting methodology
* score aggregation
* priority classification
* safe-site assessment
* explainability
* validation rules
* edge-case handling

M4 does not own:

* GIS data generation
* frontend implementation
* backend API architecture
* ML/AI models
* deployment infrastructure

M4 must not modify another team's component without prior coordination
and agreement.

---

## 3. Decision Problems

SafeShift contains two related but distinct decision problems.

### 3.1 Habitation Relocation Priority

Determine which habitations should receive higher relocation priority
based on the available hazard and habitation-level information.

The purpose of this score is to represent **relocation urgency/priority**.

Potential factors include:

* hazard/risk information
* population
* habitation-to-zone relationship

The exact criteria and their definitions must be finalized before
production implementation.

### 3.2 Safe-Site Suitability

Assess candidate relocation sites based on available site-level
information relevant to relocation suitability.

Potential factors include:

* capacity
* available land
* infrastructure access

The purpose of this score is to represent **relative suitability of a
candidate relocation site**.

### 3.3 Separation of Decision Scores

The methodology separates:

1. Habitation relocation priority.
2. Safe-site suitability.

These represent different decision questions and should not be combined
into one undifferentiated score.

The habitation score answers:

> Which habitation requires greater relocation priority?

The safe-site score answers:

> Which candidate site is relatively more suitable for relocation?

A later allocation or matching step may use both outputs if the required
data and architecture are available.

---

## 4. Candidate Criteria

### 4.1 Habitation Priority Criteria

The following are candidate criteria based on the current shared contract:

* `risk_level`
* `population`
* `current_zone_id` and its relationship to the corresponding zone

These criteria are candidates only.

Their exact interpretation, transformation, and inclusion in the final
score must be confirmed before implementation.

### 4.2 Safe-Site Criteria

The following are candidate site-level criteria based on the current
shared contract:

* `capacity_score`
* `available_land`
* `infra_access`

These criteria are candidates only.

Their exact interpretation and calculation must be confirmed before
implementation.

### 4.3 Criterion Finalization

No criterion shall be included in the production scoring model merely
because it exists as a field.

Before implementation, every criterion must have:

* a defined meaning
* a defined data source
* a defined data type/range
* a defined scoring direction
* a defined normalization method
* a documented justification for inclusion

No final weights are assigned at this stage.

---

## 5. MCDA Principles

The methodology shall follow these principles:

1. **Transparency** — decision logic must be visible and documented.
2. **Explainability** — scores must be decomposable into criterion
   contributions.
3. **Determinism** — identical valid inputs must produce identical outputs.
4. **Reproducibility** — results must be independently reproducible.
5. **Consistency** — criteria must be transformed consistently.
6. **Explicit direction** — every criterion must state whether a higher
   value increases priority or suitability.
7. **Explicit missing-data handling** — missing information must not be
   silently converted into arbitrary values.
8. **Explicit invalid-data handling** — invalid values must be detected
   according to defined validation rules.
9. **No hidden factors** — production scores must not contain undocumented
   criteria or adjustments.
10. **No ML dependency** — the core M4 scoring methodology must not depend
    on machine-learning predictions.

---

## 6. Criterion Direction and Classification

Every criterion must have an explicitly documented scoring direction.

### 6.1 Priority/Urgency Criterion

A criterion is priority-oriented when a higher value indicates greater
relocation urgency.

Example concept:

```text
higher hazard severity
        ↓
higher relocation priority
```

### 6.2 Benefit/Suitability Criterion

A criterion is benefit-oriented when a higher value indicates a more
suitable relocation site.

Example concept:

```text
better infrastructure access
        ↓
higher site suitability
```

### 6.3 Cost/Constraint Criterion

A criterion is cost- or constraint-oriented when a higher value represents
a disadvantage or constraint that should reduce suitability.

### 6.4 Classification Rule

Every criterion used in the final model must be explicitly classified as:

* priority/urgency
* benefit/suitability
* cost/constraint

No criterion shall be silently inverted during implementation.

---

## 7. Normalization

MCDA criteria may have different units and numerical ranges.

Before aggregation, selected criteria must be transformed to a common
scale suitable for comparison.

The selected normalization method must:

* be explicitly documented
* preserve the intended ordering
* specify scoring direction
* define behavior when all values are equal
* avoid division-by-zero
* define handling of missing values
* define handling of invalid values

### 7.1 Normalized Score Range

Where applicable, normalized criteria should use a common range of:

```text
0 to 1
```

The interpretation of the endpoints must be documented for each criterion.

### 7.2 Constant-Value Criteria

If all valid observations for a criterion have the same value, the
normalization method must define a deterministic behavior rather than
performing a division by zero.

The final rule will be selected during methodology validation.

### 7.3 Capacity Score

The current project contract defines:

```text
capacity_score: float, 0–1, from M4's formula
```

Therefore, M4 must distinguish between:

1. the underlying capacity-related inputs, and
2. the resulting normalized `capacity_score`.

The score must not be unnecessarily normalized again if it is already
defined on the required 0–1 scale.

The underlying capacity formula must be documented before implementation.

---

## 8. Weighting

Each selected criterion may receive a weight representing its relative
importance.

For `n` criteria:

```text
sum(w_i) = 1
```

and:

```text
0 <= w_i <= 1
```

Weights must:

* be explicitly documented
* have a defensible justification
* sum to 1
* not be hidden inside implementation code
* be easy to modify for scenario analysis

### 8.1 Weight Selection

Weights must not be selected arbitrarily.

Before implementation, M4 must document:

* why each criterion receives its weight
* why criteria have different or equal importance
* the source or rationale supporting the weighting decision
* how sensitive the final ranking is to reasonable weight changes

No final weights are approved in this document at the current stage.

---

## 9. Aggregation

The final aggregation method must be:

* deterministic
* explainable
* reproducible
* computationally simple
* suitable for a government decision-support prototype

### 9.1 Preliminary Aggregation Model

A weighted-sum MCDA model is being considered because it provides:

* transparent calculations
* deterministic results
* simple implementation
* straightforward contribution analysis
* reproducibility

Conceptually:

```text
Score = Σ (w_i × normalized_criterion_i)
```

This is a preliminary design choice.

It must be validated against representative test cases before production
implementation.

The final aggregation method must be documented before scoring code is
written.

---

## 10. Priority Classification

A continuous habitation priority score may be converted into categories
such as:

* High Priority
* Medium Priority
* Low Priority

The final category thresholds must:

* be explicitly documented
* have a defensible rationale
* be deterministic
* be validated against representative cases

No arbitrary thresholds are finalized at this stage.

---

## 11. Safe-Site Assessment

Candidate relocation sites should be assessed using validated site-level
information available through the agreed project contract.

Potential inputs include:

* capacity
* available land
* infrastructure access

The final site-suitability methodology must define:

1. criterion meanings
2. scoring directions
3. normalization
4. weights
5. aggregation
6. feasibility constraints
7. missing-data behavior
8. explainability

A high suitability score must not automatically imply that a site is
physically or legally feasible unless those constraints are explicitly
represented in the available data.

---

## 12. Explainability

Every generated priority or suitability result should be explainable.

The eventual result should allow the system to identify:

* overall score
* criterion values
* normalized criterion values
* criterion weights
* individual criterion contributions
* dominant factors affecting the result

Conceptually:

```text
Input values
     ↓
Normalized criteria
     ↓
Weights
     ↓
Criterion contributions
     ↓
Overall score
     ↓
Decision category
```

The system should avoid producing an unexplained black-box score.

Where appropriate, explanations should identify the strongest positive
and negative contributors to the final result.

---

## 13. Missing and Invalid Data

The methodology must explicitly define behavior when required data is:

* missing
* null
* invalid
* outside the expected range
* inconsistent with related records

The implementation must not silently replace missing information with
arbitrary values.

Possible handling strategies may include:

* excluding the affected criterion when methodologically justified
* marking the result as incomplete
* rejecting invalid records
* applying an explicitly documented fallback rule

The final strategy must be selected before production implementation.

---

## 14. Edge Cases

The methodology must define deterministic behavior for:

* zero population
* zero available land
* zero capacity
* invalid `risk_level`
* missing `current_zone_id`
* missing habitation-zone relationship
* missing safe-site information
* duplicate IDs
* no feasible relocation site
* tied scores
* constant criterion values
* invalid geometry where geometry is used
* out-of-range `infra_access`
* out-of-range `capacity_score`
* negative population
* negative available land

Edge-case behavior must be documented before production scoring code
is finalized.

---

## 15. Validation Strategy

M4 methodology will be validated using:

### 15.1 Boundary-Value Tests

Test minimum, maximum, zero, and other meaningful boundary values.

### 15.2 Missing-Data Tests

Verify deterministic behavior when required inputs are missing.

### 15.3 Invalid-Data Tests

Verify rejection or explicit handling of invalid values.

### 15.4 Ranking Sanity Checks

Verify that clearly higher-priority cases rank appropriately.

### 15.5 Monotonicity Checks

Where theoretically applicable, verify that increasing a criterion in its
defined direction does not unexpectedly reduce its contribution.

### 15.6 Weight-Sensitivity Checks

Change weights within reasonable ranges and observe whether rankings are
stable or meaningfully sensitive.

### 15.7 Reproducibility Checks

Verify that identical inputs and methodology parameters produce identical
results.

### 15.8 Explainability Checks

Verify that reported criterion contributions reconcile with the final
score.

---

## 16. Contract Dependencies

The following fields are currently defined in the shared project contract.

### Zone

* `zone_id`
* `hazard_type`
* `risk_level`
* `geometry`

### Habitation

* `habitation_id`
* `name`
* `population`
* `coordinates`
* `current_zone_id`

### Safe Site

* `site_id`
* `capacity_score`
* `available_land`
* `infra_access`
* `geometry`

The shared contract is currently the source of truth for these field
names and basic data types.

Definitions that are not sufficiently specified must be confirmed before
production implementation.

M4 must not silently change the shared contract.

Any proposed contract change must be flagged to the whole team as required
by `docs/CONTRACT.md`.

---

## 17. M4 ↔ M1 ↔ M3 Dependency Boundary

### M1 dependency

M4 requires confirmed definitions for:

* hazard/risk classification
* hazard-zone generation
* habitation-zone relationship
* population meaning/source
* available-land meaning
* infrastructure-access meaning
* geometry/CRS assumptions
* safe-site capacity inputs

### M3 dependency

M4 requires confirmed definitions for:

* API response structures
* backend data types
* `/priorities` response structure
* location of M4 scoring logic within the backend
* validation/error conventions
* integration of M4 outputs with the API

M4 methodology design may proceed independently, but production
implementation must conform to the confirmed shared data and API
contracts.

---

## 18. Implementation Status

Current status:

```text
Methodology design: In progress
Production scoring code: Not started
Optimization/allocation implementation: Not started
Backend integration: Not started
Frontend integration: Not started
GIS pipeline modification: Not started
ML/AI dependency: Not required
```

This document defines the M4 methodology framework.

Final criteria, normalization rules, weights, thresholds, formulas, and
implementation interfaces must be validated before production scoring
code is written.
