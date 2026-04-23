import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

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
            onboardingCompleted: true,
            subscriptionStatus: true,
            trialStartDate: true,
          },
        });
        session.user.id = user.id;
        session.user.onboardingCompleted = u?.onboardingCompleted ?? false;
        session.user.subscriptionStatus = u?.subscriptionStatus ?? "trialing";
        session.user.trialStartDate = u?.trialStartDate ?? null;
      }
      return session;
    },
  },
};
