// Express typings are provided by the consuming project when available.
import { Router, Request, Response } from "express";

import { Zone } from "../models/Zone";
import { Habitation } from "../models/Habitation";
import { Site } from "../models/Site";

import {
  calculatePriorityScore,
  RiskLevel,
} from "../scoring/priorityScore";

const router = Router();

// ---- GET /zones ----
router.get(
  "/zones",
  async (_req: Request, res: Response) => {
    const zones = await Zone.find();

    res.json(zones);
  }
);

// ---- GET /habitations ----
router.get(
  "/habitations",
  async (_req: Request, res: Response) => {
    const habitations = await Habitation.find();

    res.json(habitations);
  }
);

// ---- GET /sites ----
router.get(
  "/sites",
  async (_req: Request, res: Response) => {
    const sites = await Site.find();

    res.json(sites);
  }
);

// ---- GET /priorities ----
// M4 priority scoring:
//
// priority_score =
//     risk_weight × normalized_risk
//     + population_weight × normalized_population
//
// Default prototype weights:
//     risk       = 0.60
//     population = 0.40
//
// The M4 scoring engine also provides an explanation
// showing each criterion's contribution.
router.get(
  "/priorities",
  async (_req: Request, res: Response) => {
    const habitations = await Habitation.find();

    /*
     * First collect each habitation together with its
     * corresponding risk level.
     */
    const records = await Promise.all(
      habitations.map(async (habitation) => {
        const zone = habitation.current_zone_id
          ? await Zone.findOne({
              zone_id: habitation.current_zone_id,
            })
          : null;

        let riskLevel: RiskLevel | null = null;

        if (zone?.risk_level) {
          const normalizedRisk =
            String(zone.risk_level).toLowerCase();

          if (
            normalizedRisk === "low" ||
            normalizedRisk === "medium" ||
            normalizedRisk === "high"
          ) {
            riskLevel = normalizedRisk;
          }
        }

        return {
          habitation_id: habitation.habitation_id,
          name: habitation.name,
          population: habitation.population,
          risk_level: riskLevel,
        };
      })
    );

    /*
     * Only records with a valid risk level can be scored.
     *
     * We do NOT silently assign an artificial risk value
     * when a habitation has no zone.
     */
    const scoreableRecords = records.filter(
      (record) => record.risk_level !== null
    );

    /*
     * M4 engine expects the complete population/risk dataset
     * at once because population normalization is relative
     * to the minimum and maximum population in the dataset.
     */
    const scoreInputs = scoreableRecords.map(
      (record) => ({
        population: record.population,
        riskLevel: record.risk_level as RiskLevel,
      })
    );

    const scores = calculatePriorityScore(scoreInputs);

    /*
     * Merge the M4 scores back into the original
     * habitation records.
     */
    let scoreIndex = 0;

    const scored = records.map((record) => {
      /*
       * If risk information is unavailable, keep the record
       * visible but mark its score as 0 instead of inventing
       * a risk classification.
       */
      if (record.risk_level === null) {
        return {
          habitation_id: record.habitation_id,
          name: record.name,
          population: record.population,
          risk_level: "unknown",
          priority_score: 0,
          urgency: "medium-term" as const,
          explanation: {
            risk_level: "unknown",
            normalized_risk: 0,
            risk_weight: 0.60,
            risk_contribution: 0,
            population: record.population,
            normalized_population: 0,
            population_weight: 0.40,
            population_contribution: 0,
            note: "Priority score unavailable because the habitation is not associated with a valid risk zone.",
          },
        };
      }

      const score = scores[scoreIndex];
      scoreIndex += 1;

      return {
        habitation_id: record.habitation_id,
        name: record.name,
        population: record.population,
        risk_level: record.risk_level,
        priority_score: score.priority_score,
        urgency: score.urgency,
        explanation: score.explanation,
      };
    });

    /*
     * Highest-priority habitations appear first.
     */
    scored.sort(
      (
        a: { priority_score: number },
        b: { priority_score: number }
      ) =>
        b.priority_score - a.priority_score
    );

    res.json(scored);
  }
);

// ---- Geospatial helper: find which zone a habitation falls inside ----
// Call this in your seed/import script to auto-populate current_zone_id.
export async function classifyHabitationZone(
  habitationId: string
) {
  const habitation = await Habitation.findOne({
    habitation_id: habitationId,
  });

  if (!habitation) {
    return null;
  }

  const containingZone = await Zone.findOne({
    geometry: {
      $geoIntersects: {
        $geometry: habitation.coordinates,
      },
    },
  });

  if (containingZone) {
    habitation.current_zone_id =
      containingZone.zone_id;

    await habitation.save();
  }

  return containingZone;
}

export default router;
