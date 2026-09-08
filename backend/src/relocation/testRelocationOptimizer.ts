import assert from "node:assert/strict";

import {
  optimizeRelocations,
} from "./relocationOptimizer";

console.log(
  "Running M4 Relocation Optimizer tests..."
);

// --------------------------------------------------
// HABITATIONS
// --------------------------------------------------

const habitations = [
  {
    habitation_id: "H1",
    name: "Village A",
    population: 800,
  },
  {
    habitation_id: "H2",
    name: "Village B",
    population: 600,
  },
  {
    habitation_id: "H3",
    name: "Village C",
    population: 400,
  },
];

// --------------------------------------------------
// SITES
// --------------------------------------------------

const sites = [
  {
    site_id: "S1",
    capacity: 1000,
  },
  {
    site_id: "S2",
    capacity: 1000,
  },
];

// --------------------------------------------------
// CANDIDATES
// --------------------------------------------------

const candidates = [
  {
    habitation_id: "H1",
    site_id: "S1",
    suitability_score: 0.95,
    distance_km: 2,
  },
  {
    habitation_id: "H1",
    site_id: "S2",
    suitability_score: 0.80,
    distance_km: 5,
  },

  {
    habitation_id: "H2",
    site_id: "S1",
    suitability_score: 0.90,
    distance_km: 3,
  },
  {
    habitation_id: "H2",
    site_id: "S2",
    suitability_score: 0.85,
    distance_km: 4,
  },

  {
    habitation_id: "H3",
    site_id: "S1",
    suitability_score: 0.70,
    distance_km: 6,
  },
  {
    habitation_id: "H3",
    site_id: "S2",
    suitability_score: 0.75,
    distance_km: 2,
  },
];

// --------------------------------------------------
// TEST 1
// --------------------------------------------------

const result =
  optimizeRelocations(
    habitations,
    sites,
    candidates
  );

assert.equal(
  result.assignments.length,
  3
);

console.log(
  "✓ Test 1 passed: all feasible habitations assigned"
);

// --------------------------------------------------
// TEST 2
// --------------------------------------------------

for (const utilization of
  result.site_utilization) {
  assert.ok(
    utilization.assigned_population <=
      utilization.capacity
  );
}

console.log(
  "✓ Test 2 passed: capacity never exceeded"
);

// --------------------------------------------------
// TEST 3
// --------------------------------------------------

assert.equal(
  result.assignments[0].habitation_id,
  "H1"
);

assert.equal(
  result.assignments[0].site_id,
  "S1"
);

console.log(
  "✓ Test 3 passed: highest-priority assignment"
);

// --------------------------------------------------
// TEST 4
// --------------------------------------------------

assert.equal(
  result.unassigned_habitations.length,
  0
);

console.log(
  "✓ Test 4 passed: no feasible habitation left unassigned"
);

// --------------------------------------------------
// TEST 5
// --------------------------------------------------

for (const assignment of
  result.assignments) {
  assert.ok(
    assignment.capacity_after >= 0
  );
}

console.log(
  "✓ Test 5 passed: remaining capacity valid"
);

// --------------------------------------------------
// TEST 6
// --------------------------------------------------

for (const utilization of
  result.site_utilization) {
  assert.ok(
    utilization.utilization_ratio >= 0 &&
      utilization.utilization_ratio <= 1
  );
}

console.log(
  "✓ Test 6 passed: utilization ratios valid"
);

// --------------------------------------------------
// TEST 7 — NO-FEASIBLE-SITE SCENARIO
// --------------------------------------------------

const impossibleHabitation = {
  habitation_id: "H999",
  name: "Large Village",
  population: 10000,
};

const impossibleResult =
  optimizeRelocations(
    [impossibleHabitation],
    sites,
    [
      {
        habitation_id: "H999",
        site_id: "S1",
        suitability_score: 0.95,
        distance_km: 2,
      },
      {
        habitation_id: "H999",
        site_id: "S2",
        suitability_score: 0.90,
        distance_km: 3,
      },
    ]
  );

assert.equal(
  impossibleResult.assignments.length,
  0
);

assert.equal(
  impossibleResult.unassigned_habitations.length,
  1
);

assert.equal(
  impossibleResult.unassigned_habitations[0]
    .habitation_id,
  "H999"
);

console.log(
  "✓ Test 7 passed: unassigned habitation detected"
);

// --------------------------------------------------
// FINAL
// --------------------------------------------------

console.log(
  "\nAll M4 Relocation Optimizer tests passed successfully. ✓"
);