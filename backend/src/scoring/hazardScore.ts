/**
 * RakshaGrid M4 - Hazard Score
 *
 * Prototype methodology:
 *   hazard = 0.40*flood + 0.35*landslide + 0.25*rainfall
 *
 * All hazard inputs are normalized to [0, 1].
 * This is a transparent prototype formula, not an official government standard.
 */

export interface HazardInput {
  habitation_id: string;
  flood_score: number;
  landslide_score: number;
  rainfall_score: number;
}

export interface HazardWeights {
  flood: number;
  landslide: number;
  rainfall: number;
}

export interface HazardResult {
  habitation_id: string;
  hazard_score: number;
  explanation: {
    flood_score: number;
    flood_weight: number;
    flood_contribution: number;
    landslide_score: number;
    landslide_weight: number;
    landslide_contribution: number;
    rainfall_score: number;
    rainfall_weight: number;
    rainfall_contribution: number;
  };
}

export const DEFAULT_HAZARD_WEIGHTS: HazardWeights = {
  flood: 0.40,
  landslide: 0.35,
  rainfall: 0.25,
};

function validateWeights(weights: HazardWeights): void {
  const values = Object.values(weights);
  if (values.some((v) => !Number.isFinite(v) || v < 0 || v > 1)) {
    throw new Error("Hazard weights must be finite values between 0 and 1.");
  }
  if (Math.abs(values.reduce((a, b) => a + b, 0) - 1) > 1e-9) {
    throw new Error("Hazard weights must sum to 1.");
  }
}

function validateScore(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be a finite value between 0 and 1.`);
  }
}

export function calculateHazardScore(
  inputs: HazardInput[],
  weights: HazardWeights = DEFAULT_HAZARD_WEIGHTS,
): HazardResult[] {
  validateWeights(weights);
  return inputs.map((input) => {
    validateScore(input.flood_score, "flood_score");
    validateScore(input.landslide_score, "landslide_score");
    validateScore(input.rainfall_score, "rainfall_score");

    const floodContribution = weights.flood * input.flood_score;
    const landslideContribution = weights.landslide * input.landslide_score;
    const rainfallContribution = weights.rainfall * input.rainfall_score;
    const hazardScore = floodContribution + landslideContribution + rainfallContribution;

    return {
      habitation_id: input.habitation_id,
      hazard_score: Number(hazardScore.toFixed(6)),
      explanation: {
        flood_score: input.flood_score,
        flood_weight: weights.flood,
        flood_contribution: Number(floodContribution.toFixed(6)),
        landslide_score: input.landslide_score,
        landslide_weight: weights.landslide,
        landslide_contribution: Number(landslideContribution.toFixed(6)),
        rainfall_score: input.rainfall_score,
        rainfall_weight: weights.rainfall,
        rainfall_contribution: Number(rainfallContribution.toFixed(6)),
      },
    };
  });
}
