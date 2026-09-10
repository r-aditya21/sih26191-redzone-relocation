import {NextRequest, NextResponse} from "next/server";
import {connectDB} from "@/lib/mongodb";
import Zone from "@/models/Zone";

export async function GET(req: NextRequest) {
  await connectDB();
  const zones = await Zone.find().sort({risk: 1}).lean();
  return NextResponse.json(zones);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const zone = await Zone.create(body);
  return NextResponse.json(zone, {status: 201});
}