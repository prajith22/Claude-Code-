import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BILLING_CYCLE_DAYS, isUnlimited } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CYCLE_MS = BILLING_CYCLE_DAYS * 24 * 60 * 60 * 1000;

// Records one simulation against the current user's monthly quota.
// - Resets the counter when the billing cycle has elapsed.
// - Lets unlimited plans through unconditionally.
// - Returns 403 with the user's plan + usage when over the limit so the
//   client can render the upgrade modal without an extra round-trip.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      plan: true,
      simulationsUsed: true,
      simulationsLimit: true,
      billingCycleStart: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Roll the billing cycle forward whenever a full period has elapsed.
  // billingCycleStart is null until the Stripe webhook sets it on first
  // subscription event — treat null as "needs a fresh cycle".
  let used = user.simulationsUsed;
  let cycleStart: Date = user.billingCycleStart ?? new Date();
  if (
    !user.billingCycleStart ||
    Date.now() - cycleStart.getTime() >= CYCLE_MS
  ) {
    used = 0;
    cycleStart = new Date();
  }

  if (isUnlimited(user.simulationsLimit)) {
    if (used !== user.simulationsUsed || cycleStart !== user.billingCycleStart) {
      await prisma.user.update({
        where: { id: user.id },
        data: { simulationsUsed: used, billingCycleStart: cycleStart },
      });
    }
    return NextResponse.json({
      ok: true,
      plan: user.plan,
      used,
      limit: user.simulationsLimit,
      unlimited: true,
    });
  }

  if (used >= user.simulationsLimit) {
    // Persist any cycle reset that happened so the counter doesn't stay
    // stale even when the user is at the cap.
    if (cycleStart !== user.billingCycleStart) {
      await prisma.user.update({
        where: { id: user.id },
        data: { simulationsUsed: used, billingCycleStart: cycleStart },
      });
    }
    return NextResponse.json(
      {
        error: "You've hit your monthly tier limit. Upgrade to keep simulating.",
        plan: user.plan,
        used,
        limit: user.simulationsLimit,
        unlimited: false,
      },
      { status: 403 },
    );
  }

  const next = used + 1;
  await prisma.user.update({
    where: { id: user.id },
    data: { simulationsUsed: next, billingCycleStart: cycleStart },
  });

  return NextResponse.json({
    ok: true,
    plan: user.plan,
    used: next,
    limit: user.simulationsLimit,
    unlimited: false,
  });
}
