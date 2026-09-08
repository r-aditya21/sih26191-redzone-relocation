import { Schema, model, Document } from "mongoose";

export type HazardType = "landslide" | "flood" | "erosion" | "cloudburst" | "glof";
export type RiskLevel = "low" | "medium" | "high";

export interface IZone extends Document {
  zone_id: string;
  hazard_type: HazardType;
  risk_level: RiskLevel;
  geometry: {
    type: "Polygon";
    coordinates: number[][][]; // GeoJSON polygon: array of linear rings
  };
}

const ZoneSchema = new Schema<IZone>(
  {
    zone_id: { type: String, required: true, unique: true },
    hazard_type: {
      type: String,
      enum: ["landslide", "flood", "erosion", "cloudburst", "glof"],
      required: true,
    },
    risk_level: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    geometry: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
      },
      coordinates: {
        type: [[[Number]]], // [ [ [lng, lat], [lng, lat], ... ] ]
        required: true,
      },
    },
  },
  { timestamps: true }
);

// 2dsphere index enables $geoWithin, $geoIntersects, $near queries
ZoneSchema.index({ geometry: "2dsphere" });

export const Zone = model<IZone>("Zone", ZoneSchema);
