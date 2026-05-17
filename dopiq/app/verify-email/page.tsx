import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyEmailScreen } from "@/components/VerifyEmailScreen";

export const metadata: Metadata = {
  title: "Verify your email — Dopiq",
};

export default function VerifyEmailPage() {
  return (
    <main className="min-h-[100dvh] bg-[#FAFAF8] pt-[env(safe-area-inset-top)]">
      <Suspense fallback={null}>
        <VerifyEmailScreen />
      </Suspense>
    </main>
  );
}
