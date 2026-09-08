import assert from "node:assert/strict";

import {
  calculateSiteSuitability,
  rankSitesBySuitability,
} from "./siteSuitability";

console.log(
  "Running M4 Site Suitability tests..."
);

// --------------------------------------------------
// TEST DATA
// --------------------------------------------------

const sites = [
  {
    site_id: "S1",
    capacity_score: 0.90,
    available_land: 15,
    infra_access: 0.90,
  },
  {
    site_id: "S2",
    capacity_score: 0.80,
    available_land: 10,
    infra_access: 0.80,
  },
  {
    site_id: "S3",
    capacity_score: 0.50,
    available_land: 5,
    infra_access: 0.50,
  },
];

const distances = [
  2,
  5,
  10,
];

// --------------------------------------------------
// TEST 1
// --------------------------------------------------

const results =
  calculateSiteSuitability(
    sites,
    distances
  );

assert.equal(results.length, 3);

console.log(
  "✓ Test 1 passed: suitability calculation"
);

// --------------------------------------------------
// TEST 2
// --------------------------------------------------

assert.equal(
  results[0].site_id,
  "S1"
);

assert.ok(
  results[0].suitability_score >= 0 &&
  results[0].suitability_score <= 1
);

console.log(
  "✓ Test 2 passed: score range and ranking input"
);

// --------------------------------------------------
// TEST 3
// --------------------------------------------------

assert.ok(
  results[0].distance_score >
    results[1].distance_score
);

assert.ok(
  results[1].distance_score >
    results[2].distance_score
);

console.log(
  "✓ Test 3 passed: distance scoring"
);

// --------------------------------------------------
// TEST 4
// --------------------------------------------------

assert.ok(
  results[0].explanation.capacity_contribution >
    0
);

assert.ok(
  results[0].explanation.infrastructure_contribution >
    0
);

assert.ok(
  results[0].explanation.land_contribution >
    0
);

assert.ok(
  results[0].explanation.distance_contribution >
    0
);

console.log(
  "✓ Test 4 passed: explainability"
);

// --------------------------------------------------
// TEST 5
// --------------------------------------------------

const ranked =
  rankSitesBySuitability(results);

assert.equal(
  ranked.length,
  3
);

for (
  let i = 1;
  i < ranked.length;
  i++
) {
  assert.ok(
    ranked[i - 1].suitability_score >=
      ranked[i].suitability_score
  );
}

console.log(
  "✓ Test 5 passed: descending ranking"
);

// --------------------------------------------------
// FINAL
// --------------------------------------------------

console.log(
  "\nAll M4 Site Suitability tests passed successfully. ✓"
);