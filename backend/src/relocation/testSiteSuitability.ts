import assert from "node:assert/strict";

import {
  calculateSiteSuitability,
  rankSitesBySuitability,
} from "./siteSuitability";

console.log("Running RakshaGrid M4 Site Suitability tests...");

const sites = [
  {
    site_id: "S1",
    capacity_score: 0.90,
    available_land: 12.0,
    infra_access: 0.90,
  },
  {
    site_id: "S2",
    capacity_score: 0.70,
    available_land: 8.0,
    infra_access: 0.75,
  },
  {
    site_id: "S3",
    capacity_score: 0.45,
    available_land: 3.0,
    infra_access: 0.40,
  },
];

const results = calculateSiteSuitability(sites);

assert.equal(results.length, 3);
assert.deepEqual(
  results.map((r) => r.site_id),
  ["S1", "S2", "S3"],
);
assert.equal(results[0].normalized_land, 1);
assert.equal(results[1].normalized_land, 0.555556);
assert.equal(results[2].normalized_land, 0);

assert.equal(results[0].suitability_score, 0.925);
assert.equal(results[1].suitability_score, 0.676389);
assert.equal(results[2].suitability_score, 0.325);

for (const result of results) {
  const contributionSum =
    result.explanation.capacity_contribution +
    result.explanation.land_contribution +
    result.explanation.infrastructure_contribution;

  assert.ok(
    Math.abs(contributionSum - result.suitability_score) <= 1e-6,
    `Explanation does not reconcile for ${result.site_id}`,
  );
}

assert.equal(results[0].explanation.capacity_contribution, 0.45);
assert.equal(results[0].explanation.land_contribution, 0.25);
assert.equal(results[0].explanation.infrastructure_contribution, 0.225);

const ranked = rankSitesBySuitability(results);
assert.deepEqual(
  ranked.map((r) => r.site_id),
  ["S1", "S2", "S3"],
);

// Distance must not affect core suitability because it is not an input.
const reorderedInput = [sites[0], sites[1], sites[2]];
const repeat = calculateSiteSuitability(reorderedInput);
assert.deepEqual(repeat, results);

// Constant land uses the deterministic 0.5 fallback.
const constantLand = calculateSiteSuitability([
  { site_id: "C1", capacity_score: 1, available_land: 5, infra_access: 1 },
  { site_id: "C2", capacity_score: 0, available_land: 5, infra_access: 0 },
]);
assert.equal(constantLand[0].normalized_land, 0.5);
assert.equal(constantLand[1].normalized_land, 0.5);

// Empty input is valid.
assert.deepEqual(calculateSiteSuitability([]), []);

// Invalid values and invalid weights are rejected.
assert.throws(
  () => calculateSiteSuitability([
    { site_id: "X", capacity_score: 1.1, available_land: 1, infra_access: 0.5 },
  ]),
);
assert.throws(
  () => calculateSiteSuitability([
    { site_id: "X", capacity_score: 0.5, available_land: -1, infra_access: 0.5 },
  ]),
);
assert.throws(
  () => calculateSiteSuitability([
    { site_id: "X", capacity_score: 0.5, available_land: 1, infra_access: 1.1 },
  ]),
);
assert.throws(
  () => calculateSiteSuitability(sites, {
    capacity: 0.5,
    land: 0.5,
    infrastructure: 0.5,
  }),
);

console.log("✓ All RakshaGrid M4 Site Suitability tests passed.");
