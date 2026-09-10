/**
 * RakshaGrid M4 API
 *
 * Adapter between M3's API layer and M4 decision engines.
 * All calculations are deterministic and explainable.
 *
 * NOTE: raw flood/landslide/rainfall and vulnerability indicators are
 * not stored in the current MongoDB schemas. POST /risk-analysis therefore
 * accepts those M4 inputs while reading habitation population from MongoDB.
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { Habitation } from "../models/Habitation";
import { Site } from "../models/Site";
import { Zone } from "../models/Zone";

import { calculateHazardScore, HazardInput } from "../scoring/hazardScore";
import { calculateExposureScore } from "../scoring/exposureScore";
import { calculateVulnerabilityScore, VulnerabilityInput } from "../scoring/vulnerabilityScore";
import { calculateRiskScore } from "../scoring/riskScore";
import { classifyRedZones } from "../scoring/redZoneClassification";
import { calculatePriorityScore, RiskLevel } from "../scoring/priorityScore";
import { calculateSiteCapacities, CapacitySiteInput } from "../relocation/capacityEngine";
import { calculateSiteSuitability, SiteSuitabilityInput } from "../relocation/siteSuitability";

const router = Router();
router.use(authenticate);

router.get("/data", async (_req: Request, res: Response) => {
  const [habitations, zones, sites] = await Promise.all([
    Habitation.find().lean(),
    Zone.find().lean(),
    Site.find().lean(),
  ]);

  res.json({
    habitations,
    zones,
    sites,
    note: "M4 reads these real DB records; raw hazard/vulnerability indicators are supplied separately because the current schemas do not store them.",
  });
});

router.get("/sites-analysis", async (_req: Request, res: Response) => {
  const sites = await Site.find().lean();

  const capacityInputs: CapacitySiteInput[] = sites.map((site) => ({
    site_id: site.site_id,
    available_land: site.available_land,
    capacity_score: site.capacity_score,
  }));

  const suitabilityInputs: SiteSuitabilityInput[] = sites.map((site) => ({
    site_id: site.site_id,
    available_land: site.available_land,
    capacity_score: site.capacity_score,
    infra_access: site.infra_access,
  }));

  res.json({
    capacities: calculateSiteCapacities(capacityInputs),
    suitability: calculateSiteSuitability(suitabilityInputs),
  });
});

interface RiskRecordBody {
  habitation_id: string;
  flood_score: number;
  landslide_score: number;
  rainfall_score: number;
  exposed_area_ratio?: number;
  vulnerable_population_ratio: number;
  infrastructure_vulnerability: number;
  access_constraint: number;
}

router.post("/risk-analysis", async (req: Request, res: Response) => {
  const records = req.body?.records as RiskRecordBody[];

  if (!Array.isArray(records)) {
    return res.status(400).json({ error: "records must be an array." });
  }

  const ids = records.map((record) => record.habitation_id);
  const habitations = await Habitation.find({
    habitation_id: { $in: ids },
  }).lean();

  const populationById = new Map(
    habitations.map((habitation) => [habitation.habitation_id, habitation.population]),
  );

  const missing = ids.filter((id) => !populationById.has(id));
  if (missing.length > 0) {
    return res.status(400).json({
      error: "Some habitation IDs were not found in MongoDB.",
      missing_habitation_ids: missing,
    });
  }

  const hazardInputs: HazardInput[] = records.map((record) => ({
    habitation_id: record.habitation_id,
    flood_score: record.flood_score,
    landslide_score: record.landslide_score,
    rainfall_score: record.rainfall_score,
  }));

  const exposureInputs = records.map((record) => ({
    habitation_id: record.habitation_id,
    population: populationById.get(record.habitation_id)!,
    exposed_area_ratio: record.exposed_area_ratio,
  }));

  const vulnerabilityInputs: VulnerabilityInput[] = records.map((record) => ({
    habitation_id: record.habitation_id,
    vulnerable_population_ratio: record.vulnerable_population_ratio,
    infrastructure_vulnerability: record.infrastructure_vulnerability,
    access_constraint: record.access_constraint,
  }));

  const hazard = calculateHazardScore(hazardInputs);
  const exposure = calculateExposureScore(exposureInputs);
  const vulnerability = calculateVulnerabilityScore(vulnerabilityInputs);

  const exposureById = new Map(exposure.map((x) => [x.habitation_id, x.exposure_score]));
  const vulnerabilityById = new Map(
    vulnerability.map((x) => [x.habitation_id, x.vulnerability_score]),
  );

  const risk = calculateRiskScore(
    hazard.map((h) => ({
      habitation_id: h.habitation_id,
      hazard_score: h.hazard_score,
      exposure_score: exposureById.get(h.habitation_id)!,
      vulnerability_score: vulnerabilityById.get(h.habitation_id)!,
    })),
  );

  const redZones = classifyRedZones(risk);

  const priorityInputs = risk.map((item) => ({
    population: populationById.get(item.habitation_id)!,
    riskLevel: item.risk_level.toLowerCase() as RiskLevel,
  }));
  const priority = calculatePriorityScore(priorityInputs);

  const priorityById = new Map(
    risk.map((item, index) => [item.habitation_id, priority[index]]),
  );

  res.json({
    methodology: {
      hazard: { flood: 0.40, landslide: 0.35, rainfall: 0.25 },
      risk: { hazard: 0.50, exposure: 0.30, vulnerability: 0.20 },
      priority: { risk: 0.60, population: 0.40 },
      thresholds: { high: 0.67, medium: 0.34 },
    },
    results: risk.map((item) => ({
      habitation_id: item.habitation_id,
      population: populationById.get(item.habitation_id),
      hazard: hazard.find((x) => x.habitation_id === item.habitation_id),
      exposure: exposure.find((x) => x.habitation_id === item.habitation_id),
      vulnerability: vulnerability.find((x) => x.habitation_id === item.habitation_id),
      risk: item,
      red_zone: redZones.find((x) => x.habitation_id === item.habitation_id),
      priority: priorityById.get(item.habitation_id),
    })),
  });
});

export default router;
