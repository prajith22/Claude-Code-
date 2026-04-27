import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SESSION_MAX_AGE = 365 * 24 * 60 * 60; // 365 days
const SESSION_UPDATE_AGE = 24 * 60 * 60; // 24 hours

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // JWT strategy is required for CredentialsProvider, which doesn't
  // create database session rows. Google sign-ins still create User +
  // Account rows via the adapter; the JWT just replaces the session
  // table for both providers.
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  // Persistent cookie that survives browser restarts. NextAuth's JWT
  // cookie is persistent by default for the session maxAge — this
  // explicit config makes that intent legible.
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE,
      },
    },
  },
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
    CredentialsProvider({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Error messages thrown here surface to the client as
      // /signin?error=<message>. The signin form maps known phrases
      // back to a single friendly hint per failure mode.
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password.");
        }
        const email = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          throw new Error("No account with that email.");
        }
        if (!user.passwordHash) {
          // OAuth-only account — they signed up with Google and have
          // no password set. Nudge them at the right provider.
          throw new Error("Try signing in with Google instead.");
        }
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) {
          throw new Error("Wrong password.");
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only populated on the initial sign-in; on subsequent
      // requests we just refresh whatever's already in the token.
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
        try {
          const u = await prisma.user.findUnique({
            where: { id: token.id as string },
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
