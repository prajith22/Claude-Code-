import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStreak, recordLogin } from "@/lib/streak";

export const dynamic = "force-dynamic";

// GET /api/user/streak → current streak for the signed-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentStreak = await getStreak(session.user.id);
  return NextResponse.json({ currentStreak });
}

// POST /api/user/streak → record today's login; returns updated streak
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { currentStreak } = await recordLogin(session.user.id);
  return NextResponse.json({ currentStreak });
}
