import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      subscriptionStatus?: string;
      trialStartDate?: Date | null;
    } & DefaultSession["user"];
  }
}
