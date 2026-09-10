import { getToken, clearToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function apiFetch<T>(path: string): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Session expired, please log in again");
  }

  if (!res.ok) {
    throw new Error(`API error ${res.status} on ${path}`);
  }
  return res.json() as Promise<T>;
}

export type HazardType = "landslide" | "flood" | "erosion" | "cloudburst" | "glof";
export type RiskLevel = "low" | "medium" | "high";

export interface Zone {
  _id: string;
  zone_id: string;
  hazard_type: HazardType;
  risk_level: RiskLevel;
  geometry: { type: "Polygon"; coordinates: number[][][] };
}

export interface Habitation {
  _id: string;
  habitation_id: string;
  name: string;
  population: number;
  coordinates: { type: "Point"; coordinates: [number, number] };
  current_zone_id: string | null;
}

export interface Site {
  _id: string;
  site_id: string;
  capacity_score: number;
  available_land: number;
  infra_access: number;
  geometry: { type: "Polygon"; coordinates: number[][][] };
}

export interface PriorityHabitation {
  habitation_id: string;
  name: string;
  population: number;
  risk_level: string;
  priority_score: number;
  urgency: "immediate" | "short-term" | "medium-term";
}

export const fetchZones = () => apiFetch<Zone[]>("/api/zones");
export const fetchHabitations = () => apiFetch<Habitation[]>("/api/habitations");
export const fetchSites = () => apiFetch<Site[]>("/api/sites");
export const fetchPriorities = () => apiFetch<PriorityHabitation[]>("/api/priorities");
export const checkHealth = () => apiFetch<{ status: string; message: string }>("/");