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
      if (session.user) {
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
        session.user.id = user.id;
        session.user.plan = u?.plan ?? "trial";
        session.user.subscriptionStatus = u?.subscriptionStatus ?? "trial";
        session.user.trialStartDate = u?.trialStartDate ?? null;
        session.user.trialEndDate = u?.trialEndDate ?? null;
        session.user.simulationsUsed = u?.simulationsUsed ?? 0;
        session.user.simulationsLimit = u?.simulationsLimit ?? UNLIMITED_LIMIT;
      }
      return session;
    },
  },
  events: {
    // Initialize the trial window on first login. The Prisma adapter
    // creates the User row before this fires, so we patch the trial
    // end date and mark the plan as "trial" with unlimited usage.
    async createUser({ user }) {
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
    },
  },
};
