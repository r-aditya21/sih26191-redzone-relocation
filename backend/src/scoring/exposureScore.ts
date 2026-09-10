/**
 * RakshaGrid M4 - Exposure Score
 *
 * Population is normalized across the evaluated habitation set.
 * Optional exposed_area_ratio can represent the fraction of the
 * habitation exposed to the hazard. When omitted, population
 * remains the complete exposure signal.
 *
 * Default weights: population 0.70, exposed area 0.30.
 */

export interface ExposureInput {
  habitation_id: string;
  population: number;
  exposed_area_ratio?: number;
}

export interface ExposureWeights {
  population: number;
  exposed_area: number;
}

export interface ExposureResult {
  habitation_id: string;
  exposure_score: number;
  explanation: {
    population: number;
    normalized_population: number;
    population_weight: number;
    population_contribution: number;
    exposed_area_ratio: number;
    exposed_area_weight: number;
    exposed_area_contribution: number;
  };
}

export const DEFAULT_EXPOSURE_WEIGHTS: ExposureWeights = {
  population: 0.70,
  exposed_area: 0.30,
};

function validateWeights(weights: ExposureWeights): void {
  const values = Object.values(weights);
  if (values.some((v) => !Number.isFinite(v) || v < 0 || v > 1)) {
    throw new Error("Exposure weights must be finite values between 0 and 1.");
  }
  if (Math.abs(values.reduce((a, b) => a + b, 0) - 1) > 1e-9) {
    throw new Error("Exposure weights must sum to 1.");
  }
}

function normalize(value: number, min: number, max: number): number {
  return max === min ? 0.5 : (value - min) / (max - min);
}

export function calculateExposureScore(
  inputs: ExposureInput[],
  weights: ExposureWeights = DEFAULT_EXPOSURE_WEIGHTS,
): ExposureResult[] {
  validateWeights(weights);
  if (inputs.length === 0) return [];

  const populations = inputs.map((x) => x.population);
  const min = Math.min(...populations);
  const max = Math.max(...populations);

  return inputs.map((input) => {
    if (!Number.isFinite(input.population) || input.population < 0) {
      throw new Error("Population must be a finite non-negative number.");
    }
    const area = input.exposed_area_ratio ?? 1;
    if (!Number.isFinite(area) || area < 0 || area > 1) {
      throw new Error("exposed_area_ratio must be between 0 and 1.");
    }

    const normalizedPopulation = normalize(input.population, min, max);
    const populationContribution = weights.population * normalizedPopulation;
    const areaContribution = weights.exposed_area * area;
    const score = populationContribution + areaContribution;

    return {
      habitation_id: input.habitation_id,
      exposure_score: Number(score.toFixed(6)),
      explanation: {
        population: input.population,
        normalized_population: Number(normalizedPopulation.toFixed(6)),
        population_weight: weights.population,
        population_contribution: Number(populationContribution.toFixed(6)),
        exposed_area_ratio: area,
        exposed_area_weight: weights.exposed_area,
        exposed_area_contribution: Number(areaContribution.toFixed(6)),
      },
    };
  });
}
