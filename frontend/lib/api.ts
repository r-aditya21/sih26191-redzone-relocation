import { getToken, clearToken } from "./auth";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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


// ADD THIS HERE
async function apiPost<T>(
  path: string,
  body: unknown
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
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

export interface M4RiskInput {
  habitation_id: string;
  flood_score: number;
  landslide_score: number;
  rainfall_score: number;
  exposed_area_ratio?: number;
  vulnerable_population_ratio: number;
  infrastructure_vulnerability: number;
  access_constraint: number;
}

export interface M4RiskResult {
  habitation_id: string;
  population: number;
  hazard: {
    hazard_score: number;
    explanation: Record<string, number>;
  };
  exposure: {
    exposure_score: number;
    explanation: Record<string, number>;
  };
  vulnerability: {
    vulnerability_score: number;
    explanation: Record<string, number>;
  };
  risk: {
    risk_score: number;
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    explanation: Record<string, number>;
  };
}

export interface M4RiskAnalysisResponse {
  methodology: {
    hazard: {
      flood: number;
      landslide: number;
      rainfall: number;
    };
    risk: {
      hazard: number;
      exposure: number;
      vulnerability: number;
    };
    priority: {
      risk: number;
      population: number;
    };
    thresholds: {
      high: number;
      medium: number;
    };
  };
  results: M4RiskResult[];
}

export const fetchM4RiskAnalysis = (
  records: M4RiskInput[],
) =>
  apiPost<M4RiskAnalysisResponse>(
    "/api/m4/risk-analysis",
    { records },
  );
export const fetchZones = () => apiFetch<Zone[]>("/api/zones");
export const fetchHabitations = () => apiFetch<Habitation[]>("/api/habitations");
export const fetchSites = () => apiFetch<Site[]>("/api/sites");
export const fetchPriorities = () => apiFetch<PriorityHabitation[]>("/api/priorities");
export const checkHealth = () => apiFetch<{ status: string; message: string }>("/");