import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan?: string | null;
      subscriptionStatus?: string | null;
      simulationsUsed?: number;
      simulationsLimit?: number;
      isReviewer?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
