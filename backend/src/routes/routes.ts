import { Router, Request, Response } from "express";
import { Zone } from "../models/Zone";
import { Habitation } from "../models/Habitation";
import { Site } from "../models/Site";

const router = Router();

// ---- GET /zones ----
router.get("/zones", async (_req: Request, res: Response) => {
  const zones = await Zone.find();
  res.json(zones);
});

// ---- GET /habitations ----
router.get("/habitations", async (_req: Request, res: Response) => {
  const habitations = await Habitation.find();
  res.json(habitations);
});

// ---- GET /sites ----
router.get("/sites", async (_req: Request, res: Response) => {
  const sites = await Site.find();
  res.json(sites);
});

// ---- GET /priorities ----
// Ranks habitations by risk. Plug M4's real formula into calculatePriorityScore().
router.get("/priorities", async (_req: Request, res: Response) => {
  const habitations = await Habitation.find();

  const scored = await Promise.all(
    habitations.map(async (h) => {
      const zone = h.current_zone_id
        ? await Zone.findOne({ zone_id: h.current_zone_id })
        : null;
      const score = calculatePriorityScore(h.population, zone?.risk_level);
      return {
        habitation_id: h.habitation_id,
        name: h.name,
        population: h.population,
        risk_level: zone?.risk_level ?? "unknown",
        priority_score: score,
        urgency: urgencyLabel(score),
      };
    })
  );

  scored.sort((a, b) => b.priority_score - a.priority_score);
  res.json(scored);
});

// ---- Scoring helper — replace with M4's actual weighted formula ----
function calculatePriorityScore(
  population: number,
  riskLevel?: "low" | "medium" | "high"
): number {
  const riskWeight = { high: 1, medium: 0.6, low: 0.3, undefined: 0 }[
    riskLevel ?? "undefined"
  ];
  // Example placeholder: population impact + risk weight.
  // Swap this for M4's real formula (land availability, infra access, density etc.)
  const populationFactor = Math.min(population / 1000, 1); // normalize, cap at 1
  return Number((riskWeight * 0.7 + populationFactor * 0.3).toFixed(3));
}

function urgencyLabel(score: number): "immediate" | "short-term" | "medium-term" {
  if (score >= 0.75) return "immediate";
  if (score >= 0.45) return "short-term";
  return "medium-term";
}

// ---- Geospatial helper: find which zone a habitation falls inside ----
// Call this in your seed/import script to auto-populate current_zone_id.
export async function classifyHabitationZone(habitationId: string) {
  const habitation = await Habitation.findOne({ habitation_id: habitationId });
  if (!habitation) return null;

  const containingZone = await Zone.findOne({
    geometry: {
      $geoIntersects: {
        $geometry: habitation.coordinates,
      },
    },
  });

  if (containingZone) {
    habitation.current_zone_id = containingZone.zone_id;
    await habitation.save();
  }
  return containingZone;
}

export default router;
