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
      // ALWAYS make sure session.user.id is set first — it's the only
      // field the rest of the app strictly depends on. The plan/status
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
              simulationsUsed: true,
              simulationsLimit: true,
            },
          });
          session.user.plan = u?.plan ?? null;
          session.user.subscriptionStatus = u?.subscriptionStatus ?? null;
          session.user.simulationsUsed = u?.simulationsUsed ?? 0;
          session.user.simulationsLimit = u?.simulationsLimit ?? 0;
        } catch (err) {
          console.error("[auth.session] augmentation failed:", err);
          session.user.plan = null;
          session.user.subscriptionStatus = null;
          session.user.simulationsUsed = 0;
          session.user.simulationsLimit = 0;
        }
      }
      return session;
    },
  },
};
