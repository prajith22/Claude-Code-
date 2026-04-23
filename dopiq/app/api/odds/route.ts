import { NextResponse } from "next/server";
import { getAllOdds } from "@/lib/odds";

export const dynamic = "force-dynamic";

export async function GET() {
  const odds = await getAllOdds();
  return NextResponse.json(odds);
}
