import assert from "node:assert/strict";

import {
  simulateRisk,
  classifyRisk,
  runRainfallScenario,
} from "./whatIfSimulation";

console.log(
  "Running M4 What-If Simulation tests..."
);

// --------------------------------------------------
// TEST 1 — Risk simulation
// --------------------------------------------------

const simulatedRisk =
  simulateRisk(
    0.50,
    30,
    0.50
  );

assert.equal(
  simulatedRisk,
  0.65
);

console.log(
  "✓ Test 1 passed: rainfall risk simulation"
);

// --------------------------------------------------
// TEST 2 — Risk cannot exceed 1
// --------------------------------------------------

const cappedRisk =
  simulateRisk(
    0.90,
    100,
    1
  );

assert.equal(
  cappedRisk,
  1
);

console.log(
  "✓ Test 2 passed: risk capped at 1"
);

// --------------------------------------------------
// TEST 3 — Risk classification
// --------------------------------------------------

assert.equal(
  classifyRisk(0.20),
  "low"
);

assert.equal(
  classifyRisk(0.50),
  "medium"
);

assert.equal(
  classifyRisk(0.80),
  "high"
);

console.log(
  "✓ Test 3 passed: risk classification"
);

// --------------------------------------------------
// TEST DATA
// --------------------------------------------------

const habitations = [
  {
    habitation_id: "H1",
    name: "Village A",
    population: 1200,
    baseline_risk_score: 0.80,
  },
  {
    habitation_id: "H2",
    name: "Village B",
    population: 700,
    baseline_risk_score: 0.50,
  },
  {
    habitation_id: "H3",
    name: "Village C",
    population: 250,
    baseline_risk_score: 0.20,
  },
];

// --------------------------------------------------
// TEST 4 — Scenario
// --------------------------------------------------

const results =
  runRainfallScenario(
    habitations,
    {
      rainfall_increase_percent: 30,
      sensitivity: 0.50,
      risk_weight: 0.60,
      population_weight: 0.40,
    }
  );

assert.equal(
  results.length,
  3
);

console.log(
  "✓ Test 4 passed: scenario generated"
);

// --------------------------------------------------
// TEST 5 — Risk increases
// --------------------------------------------------

for (const result of results) {
  assert.ok(
    result.scenario_risk_score >=
      result.baseline_risk_score
  );

  assert.ok(
    result.risk_change >= 0
  );
}

console.log(
  "✓ Test 5 passed: risk increases under rainfall scenario"
);

// --------------------------------------------------
// TEST 6 — Priority increases
// --------------------------------------------------

for (const result of results) {
  assert.ok(
    result.scenario_priority_score >=
      result.baseline_priority_score
  );
}

console.log(
  "✓ Test 6 passed: priority changes correctly"
);

// --------------------------------------------------
// TEST 7 — High-risk village remains high
// --------------------------------------------------

const villageA =
  results.find(
    (result) =>
      result.habitation_id ===
      "H1"
  );

assert.ok(villageA);

assert.equal(
  villageA.scenario_risk_level,
  "high"
);

console.log(
  "✓ Test 7 passed: high-risk classification"
);

// --------------------------------------------------
// FINAL
// --------------------------------------------------

console.log(
  "\nAll M4 What-If Simulation tests passed successfully. ✓"
);