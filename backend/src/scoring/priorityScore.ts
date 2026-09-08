export type RiskLevel = "low" | "medium" | "high";

export interface PriorityInput {
  population: number;
  riskLevel: RiskLevel;
}

export interface PriorityExplanation {
  risk_level: RiskLevel;
  normalized_risk: number;
  risk_weight: number;
  risk_contribution: number;
  population: number;
  normalized_population: number;
  population_weight: number;
  population_contribution: number;
}

export interface PriorityResult {
  priority_score: number;
  urgency: "immediate" | "short-term" | "medium-term";
  explanation: PriorityExplanation;
}

export interface PriorityWeights {
  risk: number;
  population: number;
}

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  risk: 0.60,
  population: 0.40,
};

const RISK_LEVEL_SCORE: Record<RiskLevel, number> = {
  low: 1 / 3,
  medium: 2 / 3,
  high: 1,
};

function validateWeights(weights: PriorityWeights): void {
  if (
    weights.risk < 0 ||
    weights.risk > 1 ||
    weights.population < 0 ||
    weights.population > 1
  ) {
    throw new Error("Priority weights must be between 0 and 1.");
  }

  const sum = weights.risk + weights.population;

  if (Math.abs(sum - 1) > 1e-9) {
    throw new Error("Priority weights must sum to 1.");
  }
}

function normalizePopulation(
  population: number,
  minimum: number,
  maximum: number,
): number {
  if (maximum === minimum) {
    return 0.5;
  }

  return (population - minimum) / (maximum - minimum);
}

function getUrgency(
  score: number,
): "immediate" | "short-term" | "medium-term" {
  /*
   * Keep the existing backend urgency scale so that we do not
   * unnecessarily break the current frontend/API contract.
   */
  if (score >= 0.75) {
    return "immediate";
  }

  if (score >= 0.45) {
    return "short-term";
  }

  return "medium-term";
}

export function calculatePriorityScore(
  inputs: PriorityInput[],
  weights: PriorityWeights = DEFAULT_PRIORITY_WEIGHTS,
): PriorityResult[] {
  validateWeights(weights);

  if (inputs.length === 0) {
    return [];
  }

  for (const input of inputs) {
    if (!Number.isFinite(input.population)) {
      throw new Error("Population must be a finite number.");
    }

    if (input.population < 0) {
      throw new Error("Population cannot be negative.");
    }

    if (!(input.riskLevel in RISK_LEVEL_SCORE)) {
      throw new Error(`Invalid risk level: ${input.riskLevel}`);
    }
  }

  const populations = inputs.map((input) => input.population);

  const minimumPopulation = Math.min(...populations);
  const maximumPopulation = Math.max(...populations);

  return inputs.map((input) => {
    const normalizedRisk = RISK_LEVEL_SCORE[input.riskLevel];

    const normalizedPopulation = normalizePopulation(
      input.population,
      minimumPopulation,
      maximumPopulation,
    );

    const riskContribution =
      weights.risk * normalizedRisk;

    const populationContribution =
      weights.population * normalizedPopulation;

    const priorityScore =
      riskContribution + populationContribution;

    return {
      priority_score: Number(priorityScore.toFixed(6)),

      urgency: getUrgency(priorityScore),

      explanation: {
        risk_level: input.riskLevel,
        normalized_risk: Number(normalizedRisk.toFixed(6)),
        risk_weight: weights.risk,
        risk_contribution: Number(
          riskContribution.toFixed(6),
        ),

        population: input.population,
        normalized_population: Number(
          normalizedPopulation.toFixed(6),
        ),
        population_weight: weights.population,
        population_contribution: Number(
          populationContribution.toFixed(6),
        ),
      },
    };
  });
}