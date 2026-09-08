import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { connectDB } from "../db";
import { Zone } from "../models/Zone";
import { Habitation } from "../models/Habitation";
import { Site } from "../models/Site";
import { classifyHabitationZone } from "../routes/routes";
import mongoose from "mongoose";

dotenv.config();

// Adjust these paths to match where M1 drops the cleaned files
const DATA_DIR = path.join(__dirname, "../../../data/cleaned");
const ZONES_FILE = path.join(DATA_DIR, "chamoli_zones.geojson");
const HABITATIONS_FILE = path.join(DATA_DIR, "chamoli_habitations.geojson");
const SITES_FILE = path.join(DATA_DIR, "chamoli_sites.geojson");

function readGeoJSON(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found, skipping: ${filePath}`);
    return null;
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

async function seedZones() {
  const geojson = readGeoJSON(ZONES_FILE);
  if (!geojson) return;

  const docs = geojson.features.map((f: any) => ({
    zone_id: f.properties.zone_id,
    hazard_type: f.properties.hazard_type,
    risk_level: f.properties.risk_level,
    geometry: f.geometry, // already GeoJSON Polygon
  }));

  await Zone.deleteMany({});
  await Zone.insertMany(docs);
  console.log(`Seeded ${docs.length} zones`);
}

async function seedHabitations() {
  const geojson = readGeoJSON(HABITATIONS_FILE);
  if (!geojson) return;

  const docs = geojson.features.map((f: any) => ({
    habitation_id: f.properties.habitation_id,
    name: f.properties.name,
    population: f.properties.population,
    coordinates: f.geometry, // GeoJSON Point
    current_zone_id: null, // filled in below via geospatial lookup
  }));

  await Habitation.deleteMany({});
  await Habitation.insertMany(docs);
  console.log(`Seeded ${docs.length} habitations`);

  // Auto-classify each habitation into a zone using $geoIntersects
  for (const doc of docs) {
    await classifyHabitationZone(doc.habitation_id);
  }
  console.log("Classified habitations into zones");
}

async function seedSites() {
  const geojson = readGeoJSON(SITES_FILE);
  if (!geojson) return;

  const docs = geojson.features.map((f: any) => ({
    site_id: f.properties.site_id,
    capacity_score: f.properties.capacity_score ?? 0, // 0 until M4's formula runs
    available_land: f.properties.available_land,
    infra_access: f.properties.infra_access,
    geometry: f.geometry, // GeoJSON Polygon
  }));

  await Site.deleteMany({});
  await Site.insertMany(docs);
  console.log(`Seeded ${docs.length} sites`);
}

async function run() {
  await connectDB();
  await seedZones();
  await seedHabitations();
  await seedSites();
  console.log("Seed complete");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
