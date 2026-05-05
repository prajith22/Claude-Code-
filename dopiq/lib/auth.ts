import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { importPKCS8, SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

const SESSION_MAX_AGE = 365 * 24 * 60 * 60; // 365 days
const SESSION_UPDATE_AGE = 24 * 60 * 60; // 24 hours

// ---- Sign in with Apple — dynamic client_secret JWT ---------------
//
// Apple requires the OAuth client_secret to be a freshly-signed
// ES256 JWT, not a static string. We generate it at request time
// from APPLE_TEAM_ID / APPLE_KEY_ID / APPLE_ID + the base64-encoded
// .p8 private key in APPLE_PRIVATE_KEY, then cache it for slightly
// less than its 6-month lifetime. The JWT is injected into the
// token exchange via the AppleProvider's token.request hook below
// (clientSecret on the OAuthConfig type is a string and is fixed
// at openid-client construct time, so we override the token call).

const APPLE_JWT_TTL_SEC = 15_777_000; // ~6 months — Apple's hard cap
const APPLE_JWT_REFRESH_BEFORE_MS = 86_400_000; // refresh 24h early
const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";

// Boot-time validation — refuse to start a production deploy with
// any of the four Apple env vars missing, so we fail loudly at
// build/first-boot rather than later when a user clicks the
// "Continue with Apple" button. Local dev is unaffected.
// Boot-time validation — refuse to start a production deploy with
// any required env var missing, so we fail loudly at build/first
// boot rather than later when a user clicks a button or opens a
// verification email. Covers both the Apple JWT pieces and the
// canonical app URL used by the verification email + verify route.
// Local dev is unaffected.
if (process.env.NODE_ENV === "production") {
  const required = [
    "APPLE_ID",
    "APPLE_TEAM_ID",
    "APPLE_KEY_ID",
    "APPLE_PRIVATE_KEY",
    "APPLE_IAP_SHARED_SECRET",
    "NEXT_PUBLIC_APP_URL",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `[auth] Required environment variable(s) missing: ${missing.join(", ")}`,
    );
  }
}

let _appleSecretCache: { value: string; expiresAtMs: number } | null = null;

async function generateAppleClientSecret(): Promise<string> {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const servicesId = process.env.APPLE_ID;
  const privateKeyB64 = process.env.APPLE_PRIVATE_KEY;
  if (!teamId || !keyId || !servicesId || !privateKeyB64) {
    throw new Error(
      "[auth] APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_ID, and APPLE_PRIVATE_KEY must all be set",
    );
  }

  // The .p8 file is base64-encoded into the env var so the PEM
  // newlines aren't mangled by the Vercel UI; decode back to the
  // raw PEM string before importing.
  const pem = Buffer.from(privateKeyB64, "base64").toString("utf8");
  const key = await importPKCS8(pem, "ES256");

  const nowSec = Math.floor(Date.now() / 1000);
  return await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setSubject(servicesId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + APPLE_JWT_TTL_SEC)
    .sign(key);
}

async function getAppleClientSecret(): Promise<string> {
  if (
    _appleSecretCache &&
    Date.now() < _appleSecretCache.expiresAtMs - APPLE_JWT_REFRESH_BEFORE_MS
  ) {
    return _appleSecretCache.value;
  }
  const value = await generateAppleClientSecret();
  _appleSecretCache = {
    value,
    expiresAtMs: Date.now() + APPLE_JWT_TTL_SEC * 1000,
  };
  return value;
}

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
    // ---- Cross-site cookies for Apple's form_post callback -------
    // Apple posts the OAuth response from appleid.apple.com back to
    // /api/auth/callback/apple as a cross-site POST. Cookies set
    // with sameSite=lax are stripped on that request, which means
    // NextAuth can't read its own pkce / state / nonce cookies on
    // the callback and fails with "PKCE code_verifier cookie was
    // missing". Override these three with sameSite=none + secure
    // so they survive the cross-site round trip. They only need to
    // live long enough for one OAuth handshake (15 min).
    pkceCodeVerifier: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.pkce.code_verifier"
          : "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 900,
      },
    },
    state: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.state"
          : "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 900,
      },
    },
    nonce: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.nonce"
          : "next-auth.nonce",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 900,
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
    // Sign in with Apple. APPLE_ID is the Services ID. The
    // client_secret is a freshly-signed ES256 JWT generated by
    // getAppleClientSecret() above and injected via token.request,
    // because openid-client only accepts a static clientSecret at
    // construct time. Apple only returns the user's name on the
    // first sign-in, so the PrismaAdapter records it then and
    // subsequent sign-ins reuse the stored profile.
    AppleProvider({
      clientId: process.env.APPLE_ID ?? "",
      // Placeholder — the real secret is supplied per request below.
      clientSecret: "managed-by-token-request",
      token: {
        async request(context) {
          const clientSecret = await getAppleClientSecret();
          const body = new URLSearchParams({
            client_id: process.env.APPLE_ID ?? "",
            client_secret: clientSecret,
            code: String(context.params.code ?? ""),
            grant_type: "authorization_code",
            redirect_uri: context.provider.callbackUrl,
          });
          const res = await fetch(APPLE_TOKEN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
          });
          const tokens = await res.json();
          if (!res.ok) {
            console.error("[auth] Apple token exchange failed:", tokens);
            throw new Error(
              typeof tokens?.error === "string"
                ? `apple_token_exchange_${tokens.error}`
                : "apple_token_exchange_failed",
            );
          }
          return { tokens };
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
        // Block credentials sign-in for accounts that haven't clicked
        // the verification link yet. Checked AFTER bcrypt so an
        // attacker can't probe which emails are verified by timing
        // / error-message difference. Google + Apple users have
        // emailVerified stamped via events.signIn so this guard
        // doesn't apply to them — they have no passwordHash, and
        // that path was already short-circuited above.
        if (user.passwordHash && !user.emailVerified) {
          throw new Error("Verify your email first.");
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
  events: {
    // Google and Apple have already verified the user's email before
    // redirecting back, so we stamp emailVerified on the first OAuth
    // sign-in for both. The credentials provider returns from
    // authorize() and never hits this event, so credentials users
    // still need the email link.
    async signIn({ user, account }) {
      if (account?.provider !== "google" && account?.provider !== "apple") {
        return;
      }
      if (!user?.id) return;
      try {
        const existing = await prisma.user.findUnique({
          where: { id: user.id },
          select: { emailVerified: true },
        });
        if (existing && !existing.emailVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        }
      } catch (err) {
        console.error("[auth.events.signIn] verify-stamp failed:", err);
      }
    },
  },
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
              isReviewer: true,
            },
          });
          session.user.plan = u?.plan ?? null;
          session.user.subscriptionStatus = u?.subscriptionStatus ?? null;
          session.user.simulationsUsed = u?.simulationsUsed ?? 0;
          session.user.simulationsLimit = u?.simulationsLimit ?? 0;
          session.user.isReviewer = u?.isReviewer ?? false;
        } catch (err) {
          console.error("[auth.session] augmentation failed:", err);
          session.user.plan = null;
          session.user.subscriptionStatus = null;
          session.user.simulationsUsed = 0;
          session.user.simulationsLimit = 0;
          session.user.isReviewer = false;
        }
      }
      return session;
    },
  },
};
