/**
 * RakshaGrid M4 API
 *
 * Adapter between M3's API layer and M4 decision engines.
 * Python M4 service is the source of truth for risk calculations.
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { Habitation } from "../models/Habitation";
import { Site } from "../models/Site";
import { Zone } from "../models/Zone";

import { callM4Risk } from "../services/m4PythonClient";

import {
  calculateSiteCapacities,
  CapacitySiteInput,
} from "../relocation/capacityEngine";

import {
  calculateSiteSuitability,
  SiteSuitabilityInput,
} from "../relocation/siteSuitability";

const router = Router();

router.use(authenticate);


/**
 * GET /api/m4/data
 */
router.get("/data", async (_req: Request, res: Response) => {
  try {
    const [habitations, zones, sites] = await Promise.all([
      Habitation.find().lean(),
      Zone.find().lean(),
      Site.find().lean(),
    ]);

    res.json({
      habitations,
      zones,
      sites,
      note:
        "M4 reads these real DB records; raw hazard/vulnerability indicators are supplied separately because the current schemas do not store them.",
    });
  } catch (error) {
    console.error("M4 data error:", error);

    res.status(500).json({
      error: "Failed to load M4 data",
    });
  }
});


/**
 * GET /api/m4/sites-analysis
 */
router.get("/sites-analysis", async (_req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error("M4 sites analysis error:", error);

    res.status(500).json({
      error: "Failed to analyze sites",
    });
  }
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


/**
 * POST /api/m4/risk-analysis
 *
 * Uses MongoDB for habitation population
 * and Python M4 service for risk calculations.
 */
router.post(
  "/risk-analysis",
  async (req: Request, res: Response) => {
    try {
      const records = req.body?.records as RiskRecordBody[];

      if (!Array.isArray(records)) {
        return res.status(400).json({
          error: "records must be an array.",
        });
      }

      const ids = records.map(
        (record) => record.habitation_id,
      );

      const habitations = await Habitation.find({
        habitation_id: { $in: ids },
      }).lean();

      const populationById = new Map(
        habitations.map((habitation) => [
          habitation.habitation_id,
          habitation.population,
        ]),
      );

      const missing = ids.filter(
        (id) => !populationById.has(id),
      );

      if (missing.length > 0) {
        return res.status(400).json({
          error: "Some habitation IDs were not found in MongoDB.",
          missing_habitation_ids: missing,
        });
      }

      const pythonResults = await Promise.all(
        records.map(async (record) => {
          const population =
            populationById.get(record.habitation_id)!;

          return callM4Risk({
            habitation_id: record.habitation_id,
            population,

            flood_score: record.flood_score,
            landslide_score: record.landslide_score,
            rainfall_score: record.rainfall_score,

            exposed_area_ratio:
              record.exposed_area_ratio ?? 0,

            vulnerable_population_ratio:
              record.vulnerable_population_ratio,

            infrastructure_vulnerability:
              record.infrastructure_vulnerability,

            access_constraint:
              record.access_constraint,
          });
        }),
      );

      res.json({
        methodology: {
          hazard: {
            flood: 0.4,
            landslide: 0.35,
            rainfall: 0.25,
          },

          risk: {
            hazard: 0.5,
            exposure: 0.3,
            vulnerability: 0.2,
          },

          priority: {
            risk: 0.6,
            population: 0.4,
          },

          thresholds: {
            high: 0.67,
            medium: 0.34,
          },
        },

        results: pythonResults,
      });
    } catch (error) {
      console.error("M4 Python risk analysis error:", error);

      res.status(500).json({
        error: "M4 risk analysis failed",
      });
    }
  },
);


/**
 * POST /api/m4/python-risk
 *
 * Temporary direct Python M4 test route.
 */
router.post(
  "/python-risk",
  async (req: Request, res: Response) => {
    try {
      const result = await callM4Risk(req.body);

      res.json(result);
    } catch (error) {
      console.error("M4 Python error:", error);

      res.status(500).json({
        error: "M4 Python service unavailable",
      });
    }
  },
);


export default router;