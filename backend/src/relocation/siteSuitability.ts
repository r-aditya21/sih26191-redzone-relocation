/**
 * SafeShift M4 - Safe Site Suitability Engine
 *
 * Ranks relocation sites using:
 *
 *   Capacity
 *   Infrastructure
 *   Available Land
 *   Distance
 *
 * IMPORTANT:
 * These are prototype MCDA weights and are configurable.
 * They are not official government standards.
 */

export interface SiteSuitabilityInput {
  site_id: string;
  capacity_score: number;
  available_land: number;
  infra_access: number;
}

export interface SiteSuitabilityWeights {
  capacity: number;
  infrastructure: number;
  land: number;
  distance: number;
}

export interface SiteSuitabilityResult {
  site_id: string;

  capacity_score: number;
  normalized_land: number;
  infrastructure_score: number;
  distance_score: number;

  suitability_score: number;

  explanation: {
    capacity_contribution: number;
    infrastructure_contribution: number;
    land_contribution: number;
    distance_contribution: number;
  };
}

export const DEFAULT_SITE_SUITABILITY_WEIGHTS: SiteSuitabilityWeights = {
  capacity: 0.45,
  infrastructure: 0.25,
  land: 0.20,
  distance: 0.10,
};

function validateWeights(
  weights: SiteSuitabilityWeights
): void {
  const values = [
    weights.capacity,
    weights.infrastructure,
    weights.land,
    weights.distance,
  ];

  if (
    values.some(
      (value) =>
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1
    )
  ) {
    throw new Error(
      "Site suitability weights must be between 0 and 1."
    );
  }

  const sum = values.reduce(
    (total, value) => total + value,
    0
  );

  if (Math.abs(sum - 1) > 1e-9) {
    throw new Error(
      "Site suitability weights must sum to 1."
    );
  }
}

function validateSite(
  site: SiteSuitabilityInput
): void {
  if (!site.site_id) {
    throw new Error("site_id is required.");
  }

  if (
    !Number.isFinite(site.capacity_score) ||
    site.capacity_score < 0 ||
    site.capacity_score > 1
  ) {
    throw new Error(
      "capacity_score must be between 0 and 1."
    );
  }

  if (
    !Number.isFinite(site.available_land) ||
    site.available_land < 0
  ) {
    throw new Error(
      "available_land must be a non-negative number."
    );
  }

  if (
    !Number.isFinite(site.infra_access) ||
    site.infra_access < 0 ||
    site.infra_access > 1
  ) {
    throw new Error(
      "infra_access must be between 0 and 1."
    );
  }
}

function normalize(
  value: number,
  minimum: number,
  maximum: number
): number {
  if (maximum === minimum) {
    return 0.5;
  }

  return (value - minimum) / (maximum - minimum);
}

/**
 * Distance score.
 *
 * 0 km gives a score close to 1.
 * Increasing distance decreases the score.
 */
function calculateDistanceScore(
  distanceKm: number
): number {
  if (
    !Number.isFinite(distanceKm) ||
    distanceKm < 0
  ) {
    throw new Error(
      "distanceKm must be a non-negative number."
    );
  }

  return 1 / (1 + distanceKm);
}

/**
 * Calculate suitability for all sites.
 *
 * `distanceKm` must correspond to the same order as `sites`.
 */
export function calculateSiteSuitability(
  sites: SiteSuitabilityInput[],
  distanceKm: number[],
  weights: SiteSuitabilityWeights =
    DEFAULT_SITE_SUITABILITY_WEIGHTS
): SiteSuitabilityResult[] {
  validateWeights(weights);

  if (sites.length !== distanceKm.length) {
    throw new Error(
      "sites and distanceKm must have the same length."
    );
  }

  if (sites.length === 0) {
    return [];
  }

  sites.forEach(validateSite);

  const landValues = sites.map(
    (site) => site.available_land
  );

  const minimumLand = Math.min(...landValues);
  const maximumLand = Math.max(...landValues);

  return sites.map((site, index) => {
    const normalizedLand = normalize(
      site.available_land,
      minimumLand,
      maximumLand
    );

    const distanceScore =
      calculateDistanceScore(distanceKm[index]);

    const capacityContribution =
      weights.capacity * site.capacity_score;

    const infrastructureContribution =
      weights.infrastructure *
      site.infra_access;

    const landContribution =
      weights.land * normalizedLand;

    const distanceContribution =
      weights.distance * distanceScore;

    const suitabilityScore =
      capacityContribution +
      infrastructureContribution +
      landContribution +
      distanceContribution;

    return {
      site_id: site.site_id,

      capacity_score: Number(
        site.capacity_score.toFixed(6)
      ),

      normalized_land: Number(
        normalizedLand.toFixed(6)
      ),

      infrastructure_score: Number(
        site.infra_access.toFixed(6)
      ),

      distance_score: Number(
        distanceScore.toFixed(6)
      ),

      suitability_score: Number(
        suitabilityScore.toFixed(6)
      ),

      explanation: {
        capacity_contribution: Number(
          capacityContribution.toFixed(6)
        ),

        infrastructure_contribution: Number(
          infrastructureContribution.toFixed(6)
        ),

        land_contribution: Number(
          landContribution.toFixed(6)
        ),

        distance_contribution: Number(
          distanceContribution.toFixed(6)
        ),
      },
    };
  });
}

/**
 * Rank sites from best to worst.
 */
export function rankSitesBySuitability(
  results: SiteSuitabilityResult[]
): SiteSuitabilityResult[] {
  return [...results].sort(
    (a, b) =>
      b.suitability_score -
      a.suitability_score
  );
}