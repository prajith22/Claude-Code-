import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan?: string;
      subscriptionStatus?: string;
      trialStartDate?: Date | null;
      trialEndDate?: Date | null;
      simulationsUsed?: number;
      simulationsLimit?: number;
    } & DefaultSession["user"];
  }
}
