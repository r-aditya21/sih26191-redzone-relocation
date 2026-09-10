import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/zones`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch zones from backend" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Zones API error:", error);

    return NextResponse.json(
      { error: "Backend server is unavailable" },
      { status: 500 }
    );
  }
}