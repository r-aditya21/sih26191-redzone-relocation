/**
 * SafeShift M4 - Capacity Engine
 *
 * Purpose:
 * Estimate the practical relocation capacity of a candidate
 * safe site and determine whether it can accommodate a
 * habitation population.
 *
 * IMPORTANT:
 * The persons-per-hectare value is a configurable PROTOTYPE
 * planning assumption. It is NOT an official government standard.
 */

export interface CapacitySiteInput {
  site_id: string;
  available_land: number;
  capacity_score: number;
}

export interface CapacityResult {
  site_id: string;
  available_land: number;
  capacity_score: number;
  planning_density: number;
  estimated_capacity: number;
}

export interface CapacityFeasibilityResult {
  site_id: string;
  required_population: number;
  estimated_capacity: number;
  remaining_capacity: number;
  feasible: boolean;
}

export interface CapacityConfig {
  persons_per_hectare: number;
}

/**
 * Prototype planning density.
 *
 * This value can be changed later after the team provides
 * an approved planning assumption.
 */
export const DEFAULT_CAPACITY_CONFIG: CapacityConfig = {
  persons_per_hectare: 100,
};

/**
 * Validate a site before calculating capacity.
 */
function validateSite(site: CapacitySiteInput): void {
  if (!site.site_id) {
    throw new Error("site_id is required.");
  }

  if (!Number.isFinite(site.available_land)) {
    throw new Error("available_land must be a finite number.");
  }

  if (site.available_land < 0) {
    throw new Error("available_land cannot be negative.");
  }

  if (!Number.isFinite(site.capacity_score)) {
    throw new Error("capacity_score must be a finite number.");
  }

  if (
    site.capacity_score < 0 ||
    site.capacity_score > 1
  ) {
    throw new Error(
      "capacity_score must be between 0 and 1."
    );
  }
}

/**
 * Validate capacity configuration.
 */
function validateConfig(config: CapacityConfig): void {
  if (
    !Number.isFinite(config.persons_per_hectare) ||
    config.persons_per_hectare <= 0
  ) {
    throw new Error(
      "persons_per_hectare must be greater than 0."
    );
  }
}

/**
 * Estimate the number of people a site can practically
 * accommodate.
 *
 * Formula:
 *
 * estimated_capacity =
 *     available_land
 *     × persons_per_hectare
 *     × capacity_score
 *
 * capacity_score acts as a normalized usability factor.
 */
export function estimateSiteCapacity(
  site: CapacitySiteInput,
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG
): CapacityResult {
  validateSite(site);
  validateConfig(config);

  const estimatedCapacity =
    site.available_land *
    config.persons_per_hectare *
    site.capacity_score;

  return {
    site_id: site.site_id,
    available_land: site.available_land,
    capacity_score: site.capacity_score,
    planning_density: config.persons_per_hectare,
    estimated_capacity: Math.floor(estimatedCapacity),
  };
}

/**
 * Determine whether a site can accommodate a habitation.
 */
export function checkCapacityFeasibility(
  site: CapacitySiteInput,
  requiredPopulation: number,
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG
): CapacityFeasibilityResult {
  if (!Number.isFinite(requiredPopulation)) {
    throw new Error(
      "requiredPopulation must be a finite number."
    );
  }

  if (requiredPopulation < 0) {
    throw new Error(
      "requiredPopulation cannot be negative."
    );
  }

  const capacity = estimateSiteCapacity(
    site,
    config
  );

  const remainingCapacity =
    capacity.estimated_capacity - requiredPopulation;

  return {
    site_id: site.site_id,
    required_population: requiredPopulation,
    estimated_capacity: capacity.estimated_capacity,
    remaining_capacity: remainingCapacity,
    feasible: remainingCapacity >= 0,
  };
}

/**
 * Calculate capacities for multiple sites.
 */
export function calculateSiteCapacities(
  sites: CapacitySiteInput[],
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG
): CapacityResult[] {
  return sites.map((site) =>
    estimateSiteCapacity(site, config)
  );
}

/**
 * Find all sites that can accommodate a habitation.
 */
export function findFeasibleSites(
  sites: CapacitySiteInput[],
  requiredPopulation: number,
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG
): CapacityFeasibilityResult[] {
  return sites
    .map((site) =>
      checkCapacityFeasibility(
        site,
        requiredPopulation,
        config
      )
    )
    .filter((result) => result.feasible);
}