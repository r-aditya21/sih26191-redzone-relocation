import assert from "node:assert/strict";

import {
  estimateSiteCapacity,
  checkCapacityFeasibility,
  calculateSiteCapacities,
  findFeasibleSites,
} from "./capacityEngine";

console.log("Running M4 Capacity Engine tests...");

// --------------------------------------------------
// TEST 1: Capacity calculation
// --------------------------------------------------

const siteA = {
  site_id: "S1",
  available_land: 15,
  capacity_score: 0.9,
};

const capacityA = estimateSiteCapacity(siteA);

assert.equal(
  capacityA.estimated_capacity,
  1350
);

console.log("✓ Test 1 passed: capacity calculation");

// --------------------------------------------------
// TEST 2: Feasible habitation
// --------------------------------------------------

const feasibilityA = checkCapacityFeasibility(
  siteA,
  1200
);

assert.equal(
  feasibilityA.estimated_capacity,
  1350
);

assert.equal(
  feasibilityA.remaining_capacity,
  150
);

assert.equal(
  feasibilityA.feasible,
  true
);

console.log("✓ Test 2 passed: feasible site");

// --------------------------------------------------
// TEST 3: Infeasible habitation
// --------------------------------------------------

const feasibilityB = checkCapacityFeasibility(
  siteA,
  1500
);

assert.equal(
  feasibilityB.remaining_capacity,
  -150
);

assert.equal(
  feasibilityB.feasible,
  false
);

console.log("✓ Test 3 passed: infeasible site");

// --------------------------------------------------
// TEST 4: Multiple sites
// --------------------------------------------------

const sites = [
  {
    site_id: "S1",
    available_land: 15,
    capacity_score: 0.9,
  },
  {
    site_id: "S2",
    available_land: 8,
    capacity_score: 0.8,
  },
  {
    site_id: "S3",
    available_land: 5,
    capacity_score: 0.5,
  },
];

const capacities = calculateSiteCapacities(sites);

assert.equal(
  capacities.length,
  3
);

assert.equal(
  capacities[0].estimated_capacity,
  1350
);

assert.equal(
  capacities[1].estimated_capacity,
  640
);

assert.equal(
  capacities[2].estimated_capacity,
  250
);

console.log("✓ Test 4 passed: multiple site capacity");

// --------------------------------------------------
// TEST 5: Feasible-site filtering
// --------------------------------------------------

const feasibleSites = findFeasibleSites(
  sites,
  600
);

assert.equal(
  feasibleSites.length,
  2
);

assert.equal(
  feasibleSites[0].site_id,
  "S1"
);

assert.equal(
  feasibleSites[1].site_id,
  "S2"
);

console.log(
  "✓ Test 5 passed: feasible-site filtering"
);

// --------------------------------------------------
// TEST 6: Custom planning density
// --------------------------------------------------

const customCapacity = estimateSiteCapacity(
  {
    site_id: "S4",
    available_land: 10,
    capacity_score: 1,
  },
  {
    persons_per_hectare: 150,
  }
);

assert.equal(
  customCapacity.estimated_capacity,
  1500
);

console.log(
  "✓ Test 6 passed: custom planning density"
);

// --------------------------------------------------
// FINAL
// --------------------------------------------------

console.log(
  "\nAll M4 Capacity Engine tests passed successfully. ✓"
);