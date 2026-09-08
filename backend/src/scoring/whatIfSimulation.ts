/**
 * SafeShift M4 - What-If Scenario Simulation
 *
 * Simulates how a change in rainfall stress can affect
 * normalized hazard/risk scores and habitation priorities.
 *
 * IMPORTANT:
 * This is a scenario-analysis tool, NOT a rainfall forecast.
 *
 * The sensitivity parameter is configurable and must be
 * calibrated against real historical data before production use.
 */

export type RiskLevel =
  | "low"
  | "medium"
  | "high";

export interface WhatIfInput {
  habitation_id: string;
  name: string;
  population: number;

  /**
   * Baseline normalized risk score: 0 to 1.
   */
  baseline_risk_score: number;
}

export interface WhatIfConfig {
  /**
   * Rainfall increase expressed as a percentage.
   *
   * Example:
   * 30 means +30% rainfall stress.
   */
  rainfall_increase_percent: number;

  /**
   * Scenario sensitivity.
   *
   * 0 means rainfall has no simulated effect.
   * 1 means full rainfall percentage effect.
   *
   * This is a prototype parameter.
   */
  sensitivity: number;

  /**
   * Weight of risk in priority calculation.
   */
  risk_weight: number;

  /**
   * Weight of population in priority calculation.
   */
  population_weight: number;
}

export interface WhatIfResult {
  habitation_id: string;
  name: string;

  population: number;

  baseline_risk_score: number;
  scenario_risk_score: number;

  risk_change: number;

  baseline_priority_score: number;
  scenario_priority_score: number;

  priority_change: number;

  baseline_risk_level: RiskLevel;
  scenario_risk_level: RiskLevel;
}

export const DEFAULT_WHAT_IF_CONFIG: WhatIfConfig = {
  rainfall_increase_percent: 30,
  sensitivity: 0.50,

  risk_weight: 0.60,
  population_weight: 0.40,
};

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.max(
    minimum,
    Math.min(maximum, value)
  );
}

function validateInput(
  input: WhatIfInput
): void {
  if (!input.habitation_id) {
    throw new Error(
      "habitation_id is required."
    );
  }

  if (
    !Number.isFinite(input.population) ||
    input.population < 0
  ) {
    throw new Error(
      "population must be a non-negative number."
    );
  }

  if (
    !Number.isFinite(
      input.baseline_risk_score
    ) ||
    input.baseline_risk_score < 0 ||
    input.baseline_risk_score > 1
  ) {
    throw new Error(
      "baseline_risk_score must be between 0 and 1."
    );
  }
}

function validateConfig(
  config: WhatIfConfig
): void {
  if (
    !Number.isFinite(
      config.rainfall_increase_percent
    ) ||
    config.rainfall_increase_percent < 0
  ) {
    throw new Error(
      "rainfall_increase_percent must be non-negative."
    );
  }

  if (
    !Number.isFinite(config.sensitivity) ||
    config.sensitivity < 0 ||
    config.sensitivity > 1
  ) {
    throw new Error(
      "sensitivity must be between 0 and 1."
    );
  }

  if (
    config.risk_weight < 0 ||
    config.risk_weight > 1 ||
    config.population_weight < 0 ||
    config.population_weight > 1
  ) {
    throw new Error(
      "Priority weights must be between 0 and 1."
    );
  }

  const weightSum =
    config.risk_weight +
    config.population_weight;

  if (
    Math.abs(weightSum - 1) > 1e-9
  ) {
    throw new Error(
      "Priority weights must sum to 1."
    );
  }
}

/**
 * Convert normalized risk to a human-readable category.
 */
export function classifyRisk(
  score: number
): RiskLevel {
  if (score >= 0.67) {
    return "high";
  }

  if (score >= 0.34) {
    return "medium";
  }

  return "low";
}

/**
 * Calculate scenario risk after rainfall stress.
 *
 * Formula:
 *
 * scenario_risk =
 *     baseline_risk
 *     +
 *     (rainfall_increase / 100)
 *     × sensitivity
 *
 * The result is capped at 1.
 */
export function simulateRisk(
  baselineRiskScore: number,
  rainfallIncreasePercent: number,
  sensitivity: number
): number {
  if (
    !Number.isFinite(
      baselineRiskScore
    ) ||
    baselineRiskScore < 0 ||
    baselineRiskScore > 1
  ) {
    throw new Error(
      "baselineRiskScore must be between 0 and 1."
    );
  }

  if (
    !Number.isFinite(
      rainfallIncreasePercent
    ) ||
    rainfallIncreasePercent < 0
  ) {
    throw new Error(
      "rainfallIncreasePercent must be non-negative."
    );
  }

  if (
    !Number.isFinite(sensitivity) ||
    sensitivity < 0 ||
    sensitivity > 1
  ) {
    throw new Error(
      "sensitivity must be between 0 and 1."
    );
  }

  const rainfallEffect =
    (rainfallIncreasePercent / 100) *
    sensitivity;

  return Number(
    clamp(
      baselineRiskScore +
        rainfallEffect,
      0,
      1
    ).toFixed(6)
  );
}

/**
 * Calculate priority using a known population range.
 */
function calculatePriority(
  riskScore: number,
  population: number,
  minimumPopulation: number,
  maximumPopulation: number,
  riskWeight: number,
  populationWeight: number
): number {
  let normalizedPopulation = 0.5;

  if (
    maximumPopulation !==
    minimumPopulation
  ) {
    normalizedPopulation =
      (population -
        minimumPopulation) /
      (maximumPopulation -
        minimumPopulation);
  }

  const score =
    riskWeight * riskScore +
    populationWeight *
      normalizedPopulation;

  return Number(
    clamp(score, 0, 1).toFixed(6)
  );
}

/**
 * Run a rainfall scenario across multiple habitations.
 */
export function runRainfallScenario(
  inputs: WhatIfInput[],
  config: WhatIfConfig =
    DEFAULT_WHAT_IF_CONFIG
): WhatIfResult[] {
  validateConfig(config);

  if (inputs.length === 0) {
    return [];
  }

  inputs.forEach(validateInput);

  const populations =
    inputs.map(
      (input) => input.population
    );

  const minimumPopulation =
    Math.min(...populations);

  const maximumPopulation =
    Math.max(...populations);

  return inputs.map((input) => {
    const scenarioRisk =
      simulateRisk(
        input.baseline_risk_score,
        config.rainfall_increase_percent,
        config.sensitivity
      );

    const baselinePriority =
      calculatePriority(
        input.baseline_risk_score,
        input.population,
        minimumPopulation,
        maximumPopulation,
        config.risk_weight,
        config.population_weight
      );

    const scenarioPriority =
      calculatePriority(
        scenarioRisk,
        input.population,
        minimumPopulation,
        maximumPopulation,
        config.risk_weight,
        config.population_weight
      );

    return {
      habitation_id:
        input.habitation_id,

      name:
        input.name,

      population:
        input.population,

      baseline_risk_score:
        input.baseline_risk_score,

      scenario_risk_score:
        scenarioRisk,

      risk_change:
        Number(
          (
            scenarioRisk -
            input.baseline_risk_score
          ).toFixed(6)
        ),

      baseline_priority_score:
        baselinePriority,

      scenario_priority_score:
        scenarioPriority,

      priority_change:
        Number(
          (
            scenarioPriority -
            baselinePriority
          ).toFixed(6)
        ),

      baseline_risk_level:
        classifyRisk(
          input.baseline_risk_score
        ),

      scenario_risk_level:
        classifyRisk(
          scenarioRisk
        ),
    };
  });
}