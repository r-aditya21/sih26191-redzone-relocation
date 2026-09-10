/**
 * RakshaGrid M4 - Complete Risk Score
 *
 * risk = 0.50*hazard + 0.30*exposure + 0.20*vulnerability
 * Risk is clamped to [0,1] for numerical safety.
 */

export interface RiskInput {
  habitation_id: string;
  hazard_score: number;
  exposure_score: number;
  vulnerability_score: number;
}

export interface RiskWeights {
  hazard: number;
  exposure: number;
  vulnerability: number;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskResult {
  habitation_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  explanation: {
    hazard_score: number;
    hazard_weight: number;
    hazard_contribution: number;
    exposure_score: number;
    exposure_weight: number;
    exposure_contribution: number;
    vulnerability_score: number;
    vulnerability_weight: number;
    vulnerability_contribution: number;
  };
}

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  hazard: 0.50,
  exposure: 0.30,
  vulnerability: 0.20,
};

function validateWeights(weights: RiskWeights): void {
  const values = Object.values(weights);
  if (values.some((v) => !Number.isFinite(v) || v < 0 || v > 1)) {
    throw new Error("Risk weights must be finite values between 0 and 1.");
  }
  if (Math.abs(values.reduce((a, b) => a + b, 0) - 1) > 1e-9) {
    throw new Error("Risk weights must sum to 1.");
  }
}

function validateScore(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be a finite value between 0 and 1.`);
  }
}

export function classifyRiskScore(score: number): RiskLevel {
  if (!Number.isFinite(score) || score < 0 || score > 1) {
    throw new Error("risk_score must be between 0 and 1.");
  }
  if (score >= 0.67) return "HIGH";
  if (score >= 0.34) return "MEDIUM";
  return "LOW";
}

export function calculateRiskScore(
  inputs: RiskInput[],
  weights: RiskWeights = DEFAULT_RISK_WEIGHTS,
): RiskResult[] {
  validateWeights(weights);

  return inputs.map((input) => {
    validateScore(input.hazard_score, "hazard_score");
    validateScore(input.exposure_score, "exposure_score");
    validateScore(input.vulnerability_score, "vulnerability_score");

    const hazardContribution = weights.hazard * input.hazard_score;
    const exposureContribution = weights.exposure * input.exposure_score;
    const vulnerabilityContribution =
      weights.vulnerability * input.vulnerability_score;

    const raw =
      hazardContribution + exposureContribution + vulnerabilityContribution;
    const riskScore = Math.min(1, Math.max(0, raw));

    return {
      habitation_id: input.habitation_id,
      risk_score: Number(riskScore.toFixed(6)),
      risk_level: classifyRiskScore(riskScore),
      explanation: {
        hazard_score: input.hazard_score,
        hazard_weight: weights.hazard,
        hazard_contribution: Number(hazardContribution.toFixed(6)),
        exposure_score: input.exposure_score,
        exposure_weight: weights.exposure,
        exposure_contribution: Number(exposureContribution.toFixed(6)),
        vulnerability_score: input.vulnerability_score,
        vulnerability_weight: weights.vulnerability,
        vulnerability_contribution: Number(vulnerabilityContribution.toFixed(6)),
      },
    };
  });
}
