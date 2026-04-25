import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAccessState } from "@/lib/access";

// First-login window — within this many ms after createdAt the user is
// treated as "new" and routed to /paywall to pick a plan, even if their
// trial has technically already started.
const NEW_USER_WINDOW_MS = 60 * 1000;

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/signin");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/signin");
  return user;
}

export async function requireSubscribedUser() {
  const user = await requireUser();

  // Brand-new accounts get sent to the paywall first so they can pick a
  // plan / start their trial before browsing the simulator.
  const ageMs = Date.now() - new Date(user.createdAt).getTime();
  const isNewUser = !user.trialStartDate || ageMs < NEW_USER_WINDOW_MS;
  if (isNewUser) redirect("/paywall");

  const state = computeAccessState(user);
  if (state === "paywalled") redirect("/paywall");
  return user;
}
