import assert from "node:assert/strict";
import { calculateHazardScore } from "./hazardScore";
import { calculateExposureScore } from "./exposureScore";
import { calculateVulnerabilityScore } from "./vulnerabilityScore";
import { calculateRiskScore, classifyRiskScore } from "./riskScore";
import { classifyRedZones } from "./redZoneClassification";

const hazard = calculateHazardScore([
  { habitation_id: "H1", flood_score: 1, landslide_score: 0.8, rainfall_score: 0.6 },
  { habitation_id: "H2", flood_score: 0.2, landslide_score: 0.3, rainfall_score: 0.4 },
]);
assert.equal(hazard[0].hazard_score, 0.83);
assert.equal(hazard[1].hazard_score, 0.285);

const exposure = calculateExposureScore([
  { habitation_id: "H1", population: 1000, exposed_area_ratio: 1 },
  { habitation_id: "H2", population: 500, exposed_area_ratio: 0.5 },
]);
assert.equal(exposure[0].exposure_score, 1);
assert.equal(exposure[1].exposure_score, 0.15);

const vulnerability = calculateVulnerabilityScore([
  {
    habitation_id: "H1",
    vulnerable_population_ratio: 0.8,
    infrastructure_vulnerability: 0.7,
    access_constraint: 0.6,
  },
]);
assert.equal(vulnerability[0].vulnerability_score, 0.73);

const risk = calculateRiskScore([
  {
    habitation_id: "H1",
    hazard_score: hazard[0].hazard_score,
    exposure_score: exposure[0].exposure_score,
    vulnerability_score: vulnerability[0].vulnerability_score,
  },
]);
assert.equal(risk[0].risk_score, 0.861);
assert.equal(risk[0].risk_level, "HIGH");

const contributionSum =
  risk[0].explanation.hazard_contribution +
  risk[0].explanation.exposure_contribution +
  risk[0].explanation.vulnerability_contribution;
assert.equal(Number(contributionSum.toFixed(6)), risk[0].risk_score);

assert.equal(classifyRiskScore(0.67), "HIGH");
assert.equal(classifyRiskScore(0.34), "MEDIUM");
assert.equal(classifyRiskScore(0.339999), "LOW");

const zones = classifyRedZones(risk);
assert.equal(zones[0].is_red_zone, true);

assert.throws(() =>
  calculateHazardScore([
    { habitation_id: "bad", flood_score: 2, landslide_score: 0, rainfall_score: 0 },
  ]),
);

assert.throws(() =>
  calculateRiskScore([
    { habitation_id: "bad", hazard_score: -1, exposure_score: 0, vulnerability_score: 0 },
  ]),
);

console.log("Risk pipeline tests: all passed");
