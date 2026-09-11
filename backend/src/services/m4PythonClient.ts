const M4_URL = "http://127.0.0.1:8000";

export async function callM4Risk(input: {
  habitation_id: string;
  population: number;
  flood_score: number;
  landslide_score: number;
  rainfall_score: number;
  exposed_area_ratio: number;
  vulnerable_population_ratio: number;
  infrastructure_vulnerability: number;
  access_constraint: number;
}) {
  const response = await fetch(`${M4_URL}/risk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`M4 service error: ${response.status} ${errorText}`);
  }

  return response.json();
}