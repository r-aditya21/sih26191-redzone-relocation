import { Schema, model, Document, Types } from "mongoose";

export interface IHabitation extends Document {
  habitation_id: string;
  name: string;
  population: number;
  coordinates: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  current_zone_id: string | null; // set by geospatial lookup against Zone, see helper below
}

const HabitationSchema = new Schema<IHabitation>(
  {
    habitation_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    population: { type: Number, required: true },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [lng, lat] — note: lng first, lat second (GeoJSON order)
        required: true,
      },
    },
    current_zone_id: { type: String, default: null },
  },
  { timestamps: true }
);

HabitationSchema.index({ coordinates: "2dsphere" });

export const Habitation = model<IHabitation>("Habitation", HabitationSchema);
