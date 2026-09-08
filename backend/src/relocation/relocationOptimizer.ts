/**
 * SafeShift M4 - Capacity-Aware Relocation Optimizer
 *
 * Allocates multiple habitations to relocation sites while
 * respecting site capacity.
 *
 * Objective:
 * Prefer higher suitability sites and shorter distances
 * while preventing capacity violations.
 *
 * This is a deterministic prototype optimizer designed to
 * work without an external optimization package.
 *
 * It can later be replaced by OR-Tools without changing
 * the surrounding M4 API design.
 */

export interface OptimizationHabitation {
  habitation_id: string;
  name: string;
  population: number;
}

export interface OptimizationSite {
  site_id: string;
  capacity: number;
}

export interface AssignmentCandidate {
  habitation_id: string;
  site_id: string;
  suitability_score: number;
  distance_km: number;
}

export interface RelocationAssignment {
  habitation_id: string;
  habitation_name: string;
  population: number;

  site_id: string;

  suitability_score: number;
  distance_km: number;

  capacity_before: number;
  capacity_after: number;
}

export interface OptimizationResult {
  assignments: RelocationAssignment[];

  unassigned_habitations: {
    habitation_id: string;
    name: string;
    population: number;
    reason: string;
  }[];

  site_utilization: {
    site_id: string;
    capacity: number;
    assigned_population: number;
    remaining_capacity: number;
    utilization_ratio: number;
  }[];
}

function validateHabitation(
  habitation: OptimizationHabitation
): void {
  if (!habitation.habitation_id) {
    throw new Error(
      "habitation_id is required."
    );
  }

  if (
    !Number.isFinite(habitation.population) ||
    habitation.population < 0
  ) {
    throw new Error(
      "population must be a non-negative number."
    );
  }
}

function validateSite(
  site: OptimizationSite
): void {
  if (!site.site_id) {
    throw new Error(
      "site_id is required."
    );
  }

  if (
    !Number.isFinite(site.capacity) ||
    site.capacity < 0
  ) {
    throw new Error(
      "capacity must be a non-negative number."
    );
  }
}

function validateCandidate(
  candidate: AssignmentCandidate
): void {
  if (!candidate.habitation_id) {
    throw new Error(
      "Candidate habitation_id is required."
    );
  }

  if (!candidate.site_id) {
    throw new Error(
      "Candidate site_id is required."
    );
  }

  if (
    !Number.isFinite(
      candidate.suitability_score
    ) ||
    candidate.suitability_score < 0 ||
    candidate.suitability_score > 1
  ) {
    throw new Error(
      "suitability_score must be between 0 and 1."
    );
  }

  if (
    !Number.isFinite(candidate.distance_km) ||
    candidate.distance_km < 0
  ) {
    throw new Error(
      "distance_km must be non-negative."
    );
  }
}

/**
 * Internal priority score for assignment ordering.
 *
 * Suitability has the strongest influence.
 * Distance provides a secondary preference.
 */
function assignmentPriority(
  candidate: AssignmentCandidate
): number {
  const distanceScore =
    1 / (1 + candidate.distance_km);

  return (
    0.80 *
      candidate.suitability_score +
    0.20 * distanceScore
  );
}

/**
 * Optimize assignments.
 *
 * Strategy:
 *
 * 1. Validate inputs.
 * 2. Rank habitation-site candidates by suitability.
 * 3. Assign each habitation to its best available site.
 * 4. Never exceed site capacity.
 * 5. Keep unassigned habitations explicitly visible.
 *
 * This is a deterministic greedy optimization prototype.
 */
export function optimizeRelocations(
  habitations: OptimizationHabitation[],
  sites: OptimizationSite[],
  candidates: AssignmentCandidate[]
): OptimizationResult {
  habitations.forEach(
    validateHabitation
  );

  sites.forEach(validateSite);

  candidates.forEach(
    validateCandidate
  );

  const habitationMap =
    new Map(
      habitations.map(
        (habitation) => [
          habitation.habitation_id,
          habitation,
        ]
      )
    );

  const siteCapacity = new Map(
    sites.map((site) => [
      site.site_id,
      site.capacity,
    ])
  );

  const remainingCapacity =
    new Map(siteCapacity);

  /*
   * Rank all possible assignments.
   */
  const rankedCandidates =
    [...candidates].sort(
      (a, b) =>
        assignmentPriority(b) -
        assignmentPriority(a)
    );

  const assignedHabitations =
    new Set<string>();

  const assignments: RelocationAssignment[] =
    [];

  /*
   * Assign each habitation at most once.
   */
  for (const candidate of
    rankedCandidates) {

    if (
      assignedHabitations.has(
        candidate.habitation_id
      )
    ) {
      continue;
    }

    const habitation =
      habitationMap.get(
        candidate.habitation_id
      );

    if (!habitation) {
      continue;
    }

    const available =
      remainingCapacity.get(
        candidate.site_id
      );

    if (
      available === undefined
    ) {
      continue;
    }

    /*
     * Capacity constraint.
     */
    if (
      available <
      habitation.population
    ) {
      continue;
    }

    const capacityBefore =
      available;

    const capacityAfter =
      available -
      habitation.population;

    remainingCapacity.set(
      candidate.site_id,
      capacityAfter
    );

    assignedHabitations.add(
      candidate.habitation_id
    );

    assignments.push({
      habitation_id:
        habitation.habitation_id,

      habitation_name:
        habitation.name,

      population:
        habitation.population,

      site_id:
        candidate.site_id,

      suitability_score:
        candidate.suitability_score,

      distance_km:
        candidate.distance_km,

      capacity_before:
        capacityBefore,

      capacity_after:
        capacityAfter,
    });
  }

  /*
   * Identify habitations that could not be assigned.
   */
  const unassignedHabitations =
    habitations
      .filter(
        (habitation) =>
          !assignedHabitations.has(
            habitation.habitation_id
          )
      )
      .map(
        (habitation) => ({
          habitation_id:
            habitation.habitation_id,

          name:
            habitation.name,

          population:
            habitation.population,

          reason:
            "No candidate site with sufficient remaining capacity was available.",
        })
      );

  /*
   * Calculate final site utilization.
   */
  const siteUtilization =
    sites.map((site) => {
      const remaining =
        remainingCapacity.get(
          site.site_id
        ) ?? site.capacity;

      const assigned =
        site.capacity -
        remaining;

      const utilizationRatio =
        site.capacity === 0
          ? 0
          : assigned /
            site.capacity;

      return {
        site_id:
          site.site_id,

        capacity:
          site.capacity,

        assigned_population:
          assigned,

        remaining_capacity:
          remaining,

        utilization_ratio:
          Number(
            utilizationRatio.toFixed(6)
          ),
      };
    });

  return {
    assignments,

    unassigned_habitations:
      unassignedHabitations,

    site_utilization:
      siteUtilization,
  };
}