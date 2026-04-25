import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { TRIAL_DAYS, UNLIMITED_LIMIT } from "@/lib/stripe";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
  ],
  session: { strategy: "database" },
  pages: { signIn: "/signin" },
  callbacks: {
    async session({ session, user }) {
      // ALWAYS make sure session.user.id is set first — it's the only
      // field the rest of the app strictly depends on. The plan/trial
      // augmentation is best-effort and must not be allowed to throw,
      // because a thrown session callback returns null to the caller
      // and tips the user into an infinite "redirect to /signin" loop.
      if (session.user) {
        session.user.id = user.id;
        try {
          const u = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              plan: true,
              subscriptionStatus: true,
              trialStartDate: true,
              trialEndDate: true,
              simulationsUsed: true,
              simulationsLimit: true,
            },
          });
          session.user.plan = u?.plan ?? "trial";
          session.user.subscriptionStatus = u?.subscriptionStatus ?? "trial";
          session.user.trialStartDate = u?.trialStartDate ?? null;
          session.user.trialEndDate = u?.trialEndDate ?? null;
          session.user.simulationsUsed = u?.simulationsUsed ?? 0;
          session.user.simulationsLimit = u?.simulationsLimit ?? UNLIMITED_LIMIT;
        } catch (err) {
          // Most common cause: schema columns missing because
          // `npx prisma db push` hasn't run after a schema change.
          // Log loudly so the dev sees it and falls back to safe
          // defaults so the session still loads.
          console.error("[auth.session] augmentation failed:", err);
          session.user.plan = "trial";
          session.user.subscriptionStatus = "trial";
          session.user.simulationsUsed = 0;
          session.user.simulationsLimit = UNLIMITED_LIMIT;
        }
      }
      return session;
    },
  },
  events: {
    // Initialize the trial window on first login. The Prisma adapter
    // creates the User row before this fires; we patch the trial end
    // date and mark the plan as "trial" with unlimited usage.
    async createUser({ user }) {
      try {
        const now = new Date();
        const end = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: "trial",
            subscriptionStatus: "trial",
            trialStartDate: now,
            trialEndDate: end,
            billingCycleStart: now,
            simulationsUsed: 0,
            simulationsLimit: UNLIMITED_LIMIT,
          },
        });
      } catch (err) {
        // Don't let trial init break the OAuth flow — the user still
        // gets a session and lands on /paywall, which falls back to
        // sensible defaults if the columns ever come back empty.
        console.error("[auth.createUser] trial init failed:", err);
      }
    },
  },
};
