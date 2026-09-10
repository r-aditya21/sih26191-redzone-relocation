/**
 * RakshaGrid M4 - Dynamic Red-Zone Classification
 *
 * Classification is derived from the current calculated risk score,
 * so it changes automatically when hazard/exposure/vulnerability
 * inputs or what-if scenarios change.
 */

import { classifyRiskScore, RiskLevel } from "./riskScore";

export interface RedZoneResult {
  habitation_id: string;
  risk_score: number;
  classification: RiskLevel;
  is_red_zone: boolean;
}

export function classifyRedZones(
  riskResults: Array<{ habitation_id: string; risk_score: number }>,
): RedZoneResult[] {
  return riskResults.map((result) => {
    const classification = classifyRiskScore(result.risk_score);
    return {
      habitation_id: result.habitation_id,
      risk_score: result.risk_score,
      classification,
      is_red_zone: classification === "HIGH",
    };
  });
}
