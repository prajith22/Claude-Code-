import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAccessState } from "@/lib/access";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/signin");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/signin");
  return user;
}

export async function requireSubscribedUser() {
  const user = await requireUser();
  const state = computeAccessState({
    subscriptionStatus: user.subscriptionStatus,
    trialStartDate: user.trialStartDate,
  });
  if (state === "paywalled") redirect("/paywall");
  return user;
}
