/**
 * SafeShift M4 - Relocation Recommendation Engine
 *
 * Combines:
 *
 * 1. Site capacity
 * 2. Site suitability
 * 3. Population requirement
 * 4. Site safety status
 *
 * The engine filters infeasible/unsafe sites first and then
 * ranks the remaining candidates.
 *
 * IMPORTANT:
 * This is a prototype decision-support engine.
 * Weights and planning assumptions are configurable.
 */

import {
  CapacitySiteInput,
  checkCapacityFeasibility,
  DEFAULT_CAPACITY_CONFIG,
  CapacityConfig,
} from "./capacityEngine";

import {
  calculateSiteSuitability,
  rankSitesBySuitability,
  SiteSuitabilityInput,
  SiteSuitabilityResult,
} from "./siteSuitability";

export type SiteSafetyLevel =
  | "low"
  | "medium"
  | "high"
  | "unknown";

export interface RelocationSiteInput
  extends CapacitySiteInput,
    SiteSuitabilityInput {
  distance_km: number;
  safety_level?: SiteSafetyLevel;
}

export interface RelocationHabitationInput {
  habitation_id: string;
  name: string;
  population: number;
}

export interface RelocationRecommendation {
  rank: number;
  site_id: string;

  suitability_score: number;

  estimated_capacity: number;
  required_population: number;
  remaining_capacity: number;

  distance_km: number;

  safety_level: SiteSafetyLevel;

  explanation: {
    suitability: SiteSuitabilityResult["explanation"];
    capacity_feasible: boolean;
    safety_accepted: boolean;
  };
}

export interface RelocationResult {
  habitation_id: string;
  habitation_name: string;
  population: number;

  feasible_site_count: number;

  recommendations: RelocationRecommendation[];

  rejected_sites: {
    site_id: string;
    reason: string;
  }[];

  no_feasible_site: boolean;
}

export interface RelocationConfig {
  top_n: number;
  capacity: CapacityConfig;

  /**
   * Whether medium-risk sites can be recommended.
   *
   * Prototype default:
   * medium risk is allowed but clearly labelled.
   */
  allow_medium_risk_sites: boolean;
}

export const DEFAULT_RELOCATION_CONFIG: RelocationConfig = {
  top_n: 3,
  capacity: DEFAULT_CAPACITY_CONFIG,
  allow_medium_risk_sites: true,
};

function validateHabitation(
  habitation: RelocationHabitationInput
): void {
  if (!habitation.habitation_id) {
    throw new Error(
      "habitation_id is required."
    );
  }

  if (!Number.isFinite(habitation.population)) {
    throw new Error(
      "population must be a finite number."
    );
  }

  if (habitation.population < 0) {
    throw new Error(
      "population cannot be negative."
    );
  }
}

function validateConfig(
  config: RelocationConfig
): void {
  if (
    !Number.isInteger(config.top_n) ||
    config.top_n <= 0
  ) {
    throw new Error(
      "top_n must be a positive integer."
    );
  }
}

/**
 * Determine whether a site is acceptable from a safety
 * perspective.
 *
 * High-risk sites are always rejected.
 * Medium-risk sites are configurable.
 * Low-risk sites are accepted.
 * Unknown sites are rejected to avoid falsely claiming safety.
 */
function isSafetyAccepted(
  safetyLevel: SiteSafetyLevel,
  allowMediumRiskSites: boolean
): boolean {
  if (safetyLevel === "high") {
    return false;
  }

  if (safetyLevel === "medium") {
    return allowMediumRiskSites;
  }

  if (safetyLevel === "low") {
    return true;
  }

  return false;
}

/**
 * Generate relocation recommendations for one habitation.
 */
export function recommendRelocationSites(
  habitation: RelocationHabitationInput,
  sites: RelocationSiteInput[],
  config: RelocationConfig =
    DEFAULT_RELOCATION_CONFIG
): RelocationResult {
  validateHabitation(habitation);
  validateConfig(config);

  if (sites.length === 0) {
    return {
      habitation_id:
        habitation.habitation_id,

      habitation_name:
        habitation.name,

      population:
        habitation.population,

      feasible_site_count: 0,

      recommendations: [],

      rejected_sites: [],

      no_feasible_site: true,
    };
  }

  /*
   * --------------------------------------------------
   * STEP 1 — Capacity filtering
   * --------------------------------------------------
   */

  const capacityEligibleSites: RelocationSiteInput[] = [];

  const rejectedSites: {
    site_id: string;
    reason: string;
  }[] = [];

  for (const site of sites) {
    const capacityResult =
      checkCapacityFeasibility(
        site,
        habitation.population,
        config.capacity
      );

    if (!capacityResult.feasible) {
      rejectedSites.push({
        site_id: site.site_id,
        reason:
          `Insufficient capacity: ` +
          `${capacityResult.estimated_capacity} ` +
          `available for ${habitation.population} people.`,
      });

      continue;
    }

    /*
     * ------------------------------------------------
     * STEP 2 — Safety filtering
     * ------------------------------------------------
     */

    const safetyLevel =
      site.safety_level ?? "unknown";

    const safetyAccepted =
      isSafetyAccepted(
        safetyLevel,
        config.allow_medium_risk_sites
      );

    if (!safetyAccepted) {
      rejectedSites.push({
        site_id: site.site_id,
        reason:
          safetyLevel === "high"
            ? "Site is classified as high risk."
            : "Site safety level is unknown or not permitted.",
      });

      continue;
    }

    capacityEligibleSites.push(site);
  }

  if (capacityEligibleSites.length === 0) {
    return {
      habitation_id:
        habitation.habitation_id,

      habitation_name:
        habitation.name,

      population:
        habitation.population,

      feasible_site_count: 0,

      recommendations: [],

      rejected_sites: rejectedSites,

      no_feasible_site: true,
    };
  }

  /*
   * --------------------------------------------------
   * STEP 3 — Suitability scoring
   * --------------------------------------------------
   */

  const suitabilityInputs: SiteSuitabilityInput[] =
    capacityEligibleSites.map(
      (site) => ({
        site_id: site.site_id,
        capacity_score:
          site.capacity_score,
        available_land:
          site.available_land,
        infra_access:
          site.infra_access,
      })
    );

  const distances =
    capacityEligibleSites.map(
      (site) => site.distance_km
    );

  const suitabilityResults =
    calculateSiteSuitability(
      suitabilityInputs,
      distances
    );

  /*
   * --------------------------------------------------
   * STEP 4 — Rank
   * --------------------------------------------------
   */

  const ranked =
    rankSitesBySuitability(
      suitabilityResults
    );

  /*
   * --------------------------------------------------
   * STEP 5 — Top-N recommendations
   * --------------------------------------------------
   */

  const recommendations =
    ranked
      .slice(0, config.top_n)
      .map(
        (
          suitability,
          index
        ) => {
          const site =
            capacityEligibleSites.find(
              (candidate) =>
                candidate.site_id ===
                suitability.site_id
            )!;

          const capacity =
            checkCapacityFeasibility(
              site,
              habitation.population,
              config.capacity
            );

          const safetyLevel =
            site.safety_level ?? "unknown";

          return {
            rank: index + 1,

            site_id:
              site.site_id,

            suitability_score:
              suitability.suitability_score,

            estimated_capacity:
              capacity.estimated_capacity,

            required_population:
              habitation.population,

            remaining_capacity:
              capacity.remaining_capacity,

            distance_km:
              site.distance_km,

            safety_level:
              safetyLevel,

            explanation: {
              suitability:
                suitability.explanation,

              capacity_feasible:
                capacity.feasible,

              safety_accepted:
                isSafetyAccepted(
                  safetyLevel,
                  config.allow_medium_risk_sites
                ),
            },
          };
        }
      );

  return {
    habitation_id:
      habitation.habitation_id,

    habitation_name:
      habitation.name,

    population:
      habitation.population,

    feasible_site_count:
      capacityEligibleSites.length,

    recommendations,

    rejected_sites:
      rejectedSites,

    no_feasible_site:
      recommendations.length === 0,
  };
}