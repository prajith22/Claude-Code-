import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAccessState, paywallReason } from "@/lib/access";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/signin");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
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
