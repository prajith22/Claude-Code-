import { redirect } from "next/navigation";
import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAccessState, paywallReason } from "@/lib/access";

/**
 * Per-request cached fetch of the currently signed-in user.
 *
 * `cache()` from React dedupes calls within a single server render
 * pass — so when (app)/layout.tsx calls requireSubscribedUser() and
 * a page inside that layout also reads the user (via getCurrentUser
 * or one of the require* helpers), they share a single Prisma
 * roundtrip instead of doubling up.
 *
 * Returns null when no session cookie is present (or the row was
 * deleted underneath us). Callers that need a guaranteed user
 * should go through requireUser / requireSubscribedUser; pages
 * that only need to read fields off the row (and rely on the
 * layout for auth enforcement) can call this directly.
 */
export const getCurrentUser = cache(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  // Credentials users must verify their email before they can use
  // any gated page. Google OAuth users have emailVerified set the
  // first time they sign in (see lib/auth.ts events.signIn) since
  // Google has already verified them.
  if (user.passwordHash && !user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }
  return user;
}

export async function requireSubscribedUser() {
  const user = await requireUser();
  if (computeAccessState(user) === "active") return user;

  // Brand-new accounts haven't seen the 3-screen welcome yet — show
  // it once before sending them to the paywall. Once
  // onboardingCompleted flips true the user falls through to the
  // normal paywall flow on subsequent visits.
  if (!user.onboardingCompleted) {
    redirect("/onboarding");
  }

  const reason = paywallReason(user);
  redirect(reason === "none" ? "/paywall" : `/paywall?reason=${reason}`);
}
