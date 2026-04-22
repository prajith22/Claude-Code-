import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      onboardingCompleted?: boolean;
      subscriptionStatus?: string;
      trialStartDate?: Date | null;
    } & DefaultSession["user"];
  }
}
