import { Schema, model, Document } from "mongoose";

export interface ISite extends Document {
  site_id: string;
  capacity_score: number; // 0-1, computed by M4's formula
  available_land: number; // hectares
  infra_access: number; // 0-1 score
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

const SiteSchema = new Schema<ISite>(
  {
    site_id: { type: String, required: true, unique: true },
    capacity_score: { type: Number, min: 0, max: 1, required: true },
    available_land: { type: Number, required: true },
    infra_access: { type: Number, min: 0, max: 1, required: true },
    geometry: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
  },
  { timestamps: true }
);

SiteSchema.index({ geometry: "2dsphere" });

export const Site = model<ISite>("Site", SiteSchema);
