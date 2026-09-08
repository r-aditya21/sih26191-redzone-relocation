import assert from "node:assert/strict";

import {
  recommendRelocationSites,
} from "./relocationEngine";

console.log(
  "Running M4 Relocation Engine tests..."
);

// --------------------------------------------------
// TEST DATA
// --------------------------------------------------

const habitation = {
  habitation_id: "H001",
  name: "Village A",
  population: 1000,
};

const sites = [
  {
    site_id: "S1",

    available_land: 15,
    capacity_score: 0.90,
    infra_access: 0.90,

    distance_km: 3,

    safety_level: "low" as const,
  },

  {
    site_id: "S2",

    available_land: 12,
    capacity_score: 0.85,
    infra_access: 0.80,

    distance_km: 5,

    safety_level: "low" as const,
  },

  {
    site_id: "S3",

    available_land: 5,
    capacity_score: 0.50,
    infra_access: 0.50,

    distance_km: 4,

    safety_level: "low" as const,
  },

  {
    site_id: "S4",

    available_land: 20,
    capacity_score: 0.95,
    infra_access: 0.95,

    distance_km: 2,

    safety_level: "high" as const,
  },
];

// --------------------------------------------------
// TEST 1
// --------------------------------------------------

const result =
  recommendRelocationSites(
    habitation,
    sites
  );

assert.equal(
  result.habitation_id,
  "H001"
);

assert.equal(
  result.population,
  1000
);

console.log(
  "✓ Test 1 passed: habitation processing"
);

// --------------------------------------------------
// TEST 2
// --------------------------------------------------

assert.equal(
  result.rejected_sites.some(
    (site) =>
      site.site_id === "S4"
  ),
  true
);

console.log(
  "✓ Test 2 passed: high-risk site rejected"
);

// --------------------------------------------------
// TEST 3
// --------------------------------------------------

assert.ok(
  result.feasible_site_count >= 1
);

assert.equal(
  result.no_feasible_site,
  false
);

console.log(
  "✓ Test 3 passed: feasible sites identified"
);

// --------------------------------------------------
// TEST 4
// --------------------------------------------------

assert.ok(
  result.recommendations.length <= 3
);

console.log(
  "✓ Test 4 passed: Top-3 recommendation limit"
);

// --------------------------------------------------
// TEST 5
// --------------------------------------------------

for (
  let i = 1;
  i < result.recommendations.length;
  i++
) {
  assert.ok(
    result.recommendations[
      i - 1
    ].suitability_score >=
      result.recommendations[
        i
      ].suitability_score
  );
}

console.log(
  "✓ Test 5 passed: recommendations ranked"
);

// --------------------------------------------------
// TEST 6
// --------------------------------------------------

for (const recommendation of
  result.recommendations) {
  assert.ok(
    recommendation.estimated_capacity >=
      recommendation.required_population
  );

  assert.equal(
    recommendation.explanation
      .capacity_feasible,
    true
  );

  assert.equal(
    recommendation.explanation
      .safety_accepted,
    true
  );
}

console.log(
  "✓ Test 6 passed: capacity and safety constraints"
);

// --------------------------------------------------
// TEST 7
// --------------------------------------------------

const impossibleHabitation = {
  habitation_id: "H999",
  name: "Large Village",
  population: 10000,
};

const impossibleResult =
  recommendRelocationSites(
    impossibleHabitation,
    sites
  );

assert.equal(
  impossibleResult.no_feasible_site,
  true
);

assert.equal(
  impossibleResult.recommendations.length,
  0
);

console.log(
  "✓ Test 7 passed: no-feasible-site handling"
);

// --------------------------------------------------
// FINAL
// --------------------------------------------------

console.log(
  "\nAll M4 Relocation Engine tests passed successfully. ✓"
);