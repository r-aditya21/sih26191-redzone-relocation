/**
 * SafeShift M4 - End-to-End Demonstration
 *
 * Demonstrates the complete M4 decision-support pipeline:
 *
 * Risk/Priority
 *      ↓
 * Site Capacity
 *      ↓
 * Site Suitability
 *      ↓
 * Relocation Recommendation
 *      ↓
 * Capacity-Aware Optimization
 *      ↓
 * Rainfall What-If Simulation
 *
 * IMPORTANT:
 * This uses synthetic demonstration data.
 * Prototype weights/assumptions are not official government standards.
 */

import {
  calculatePriorityScore,
  PriorityInput,
} from "./scoring/priorityScore";

import {
  calculateSiteCapacities,
  CapacitySiteInput,
} from "./relocation/capacityEngine";

import {
  calculateSiteSuitability,
  SiteSuitabilityInput,
} from "./relocation/siteSuitability";

import {
  recommendRelocationSites,
  RelocationSiteInput,
} from "./relocation/relocationEngine";

import {
  optimizeRelocations,
  OptimizationHabitation,
  OptimizationSite,
  AssignmentCandidate,
} from "./relocation/relocationOptimizer";

import {
  runRainfallScenario,
  WhatIfInput,
} from "./scoring/whatIfSimulation";

console.log("==================================================");
console.log("        SAFESHIFT — M4 END-TO-END DEMO");
console.log("==================================================");
console.log("Synthetic demonstration data only.");
console.log("Prototype planning assumptions are not");
console.log("official government standards.");
console.log("==================================================\n");

// ==================================================
// 1. HABITATION PRIORITY
// ==================================================

console.log("1. HABITATION PRIORITY");
console.log("----------------------------------------------");

const habitations = [
  {
    habitation_id: "H1",
    name: "Village A",
    population: 700,
    riskLevel: "high" as const,
    baselineRiskScore: 0.90,
  },
  {
    habitation_id: "H2",
    name: "Village B",
    population: 700,
    riskLevel: "medium" as const,
    baselineRiskScore: 0.60,
  },
  {
    habitation_id: "H3",
    name: "Village C",
    population: 250,
    riskLevel: "low" as const,
    baselineRiskScore: 0.25,
  },
];

const priorityInputs: PriorityInput[] = habitations.map((habitation) => ({
  population: habitation.population,
  riskLevel: habitation.riskLevel,
}));

const priorityResults = calculatePriorityScore(priorityInputs);

for (let i = 0; i < habitations.length; i++) {
  const habitation = habitations[i];
  const result = priorityResults[i];

  console.log(
    `${habitation.name} | ` +
      `priority=${result.priority_score.toFixed(3)} | ` +
      `urgency=${result.urgency}`
  );
}

// ==================================================
// 2. SITE CAPACITY
// ==================================================

console.log("\n2. SAFE-SITE CAPACITY");
console.log("----------------------------------------------");

const capacityInputs: CapacitySiteInput[] = [
  {
    site_id: "S1",
    available_land: 12,
    capacity_score: 0.90,
  },
  {
    site_id: "S2",
    available_land: 10,
    capacity_score: 0.80,
  },
  {
    site_id: "S3",
    available_land: 8,
    capacity_score: 0.65,
  },
];

const capacityResults = calculateSiteCapacities(capacityInputs);

for (const site of capacityResults) {
  console.log(
    `${site.site_id} | ` +
      `estimated capacity=${site.estimated_capacity.toFixed(0)} persons`
  );
}

// ==================================================
// 3. SITE SUITABILITY
// ==================================================

console.log("\n3. SAFE-SITE SUITABILITY");
console.log("----------------------------------------------");

const suitabilityInputs: SiteSuitabilityInput[] = [
  {
    site_id: "S1",
    capacity_score: 0.90,
    available_land: 12,
    infra_access: 0.90,
  },
  {
    site_id: "S2",
    capacity_score: 0.80,
    available_land: 10,
    infra_access: 0.85,
  },
  {
    site_id: "S3",
    capacity_score: 0.65,
    available_land: 8,
    infra_access: 0.70,
  },
];

const suitabilityResults = suitabilityInputs.flatMap((site) =>
  calculateSiteSuitability([site], [
    site.site_id === "S1"
      ? 2
      : site.site_id === "S2"
        ? 4
        : 6,
  ])
);

const rankedSuitability = [...suitabilityResults].sort(
  (a, b) => b.suitability_score - a.suitability_score
);

for (const site of rankedSuitability) {
  console.log(
    `${site.site_id} | ` +
      `suitability=${site.suitability_score.toFixed(3)}`
  );
}

// ==================================================
// 4. RELOCATION RECOMMENDATION
// ==================================================

console.log("\n4. RELOCATION RECOMMENDATION");
console.log("----------------------------------------------");

const relocationSites: RelocationSiteInput[] = [
  {
    site_id: "S1",
    available_land: 12,
    capacity_score: 0.90,
    infra_access: 0.90,
    distance_km: 2,
    safety_level: "low",
  },
  {
    site_id: "S2",
    available_land: 10,
    capacity_score: 0.80,
    infra_access: 0.85,
    distance_km: 4,
    safety_level: "low",
  },
  {
    site_id: "S3",
    available_land: 8,
    capacity_score: 0.65,
    infra_access: 0.70,
    distance_km: 6,
    safety_level: "medium",
  },
  {
    site_id: "S4",
    available_land: 20,
    capacity_score: 0.90,
    infra_access: 0.80,
    distance_km: 3,
    safety_level: "high",
  },
];

const recommendation = recommendRelocationSites(
  {
    habitation_id: "H1",
    name: "Village A",
    population: 1200,
  },
  relocationSites,
  {
    top_n: 3,
    capacity: {
      persons_per_hectare: 100,
    },
    allow_medium_risk_sites: true,
  }
);

for (const site of recommendation.recommendations) {
  console.log(
    `Rank ${site.rank} | ` +
      `${site.site_id} | ` +
      `suitability=${site.suitability_score.toFixed(3)} | ` +
      `capacity=${site.estimated_capacity.toFixed(0)}`
  );
}

console.log(
  `Feasible sites: ${recommendation.feasible_site_count}`
);

console.log(
  `Rejected sites: ${recommendation.rejected_sites.length}`
);

// ==================================================
// 5. CAPACITY-AWARE OPTIMIZATION
// ==================================================

console.log("\n5. CAPACITY-AWARE RELOCATION OPTIMIZATION");
console.log("----------------------------------------------");

const optimizationHabitations: OptimizationHabitation[] = [
  {
    habitation_id: "H1",
    name: "Village A",
    population: 700,
  },
  {
    habitation_id: "H2",
    name: "Village B",
    population: 500,
  },
  {
    habitation_id: "H3",
    name: "Village C",
    population: 300,
  },
];

const optimizationSites: OptimizationSite[] = [
  {
    site_id: "S1",
    capacity: 900,
  },
  {
    site_id: "S2",
    capacity: 700,
  },
];

const assignmentCandidates: AssignmentCandidate[] = [
  {
    habitation_id: "H1",
    site_id: "S1",
    suitability_score: 0.95,
    distance_km: 2,
  },
  {
    habitation_id: "H1",
    site_id: "S2",
    suitability_score: 0.75,
    distance_km: 5,
  },
  {
    habitation_id: "H2",
    site_id: "S1",
    suitability_score: 0.80,
    distance_km: 3,
  },
  {
    habitation_id: "H2",
    site_id: "S2",
    suitability_score: 0.90,
    distance_km: 2,
  },
  {
    habitation_id: "H3",
    site_id: "S1",
    suitability_score: 0.70,
    distance_km: 4,
  },
  {
    habitation_id: "H3",
    site_id: "S2",
    suitability_score: 0.85,
    distance_km: 3,
  },
];

const optimizationResult = optimizeRelocations(
  optimizationHabitations,
  optimizationSites,
  assignmentCandidates
);

for (const assignment of optimizationResult.assignments) {
  console.log(
    `${assignment.habitation_name} -> ${assignment.site_id} | ` +
      `population=${assignment.population} | ` +
      `suitability=${assignment.suitability_score.toFixed(3)} | ` +
      `remaining capacity=${assignment.capacity_after}`
  );
}

console.log(
  `Assigned: ${optimizationResult.assignments.length}/` +
    `${optimizationHabitations.length}`
);

console.log(
  `Unassigned: ${optimizationResult.unassigned_habitations.length}`
);

console.log("\nSite utilization:");

for (const site of optimizationResult.site_utilization) {
  console.log(
    `${site.site_id} | ` +
      `${site.assigned_population}/${site.capacity} persons | ` +
      `remaining=${site.remaining_capacity} | ` +
      `utilization=${(site.utilization_ratio * 100).toFixed(1)}%`
  );
}

// ==================================================
// 6. RAINFALL WHAT-IF SIMULATION
// ==================================================

console.log("\n6. RAINFALL WHAT-IF SIMULATION");
console.log("----------------------------------------------");

const whatIfInputs: WhatIfInput[] = habitations.map((habitation) => ({
  habitation_id: habitation.habitation_id,
  name: habitation.name,
  population: habitation.population,
  baseline_risk_score: habitation.baselineRiskScore,
}));

const whatIfResults = runRainfallScenario(whatIfInputs, {
  rainfall_increase_percent: 30,
  sensitivity: 0.50,
  risk_weight: 0.60,
  population_weight: 0.40,
});

for (const result of whatIfResults) {
  console.log(
    `${result.name} | ` +
      `risk ${result.baseline_risk_score.toFixed(3)} -> ` +
      `${result.scenario_risk_score.toFixed(3)} | ` +
      `priority ${result.baseline_priority_score.toFixed(3)} -> ` +
      `${result.scenario_priority_score.toFixed(3)}`
  );
}

// ==================================================
// FINAL
// ==================================================

console.log("\n==================================================");
console.log("             M4 PIPELINE COMPLETED");
console.log("==================================================");

console.log("✓ Habitation Risk/Priority");
console.log("✓ Safe-Site Capacity");
console.log("✓ Safe-Site Suitability");
console.log("✓ Relocation Recommendation");
console.log("✓ Capacity-Aware Optimization");
console.log("✓ Rainfall What-If Simulation");

console.log("==================================================");
console.log("M4 END-TO-END DEMONSTRATION SUCCESSFUL");
console.log("==================================================");