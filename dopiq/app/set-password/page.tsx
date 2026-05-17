import { Suspense } from "react";
import type { Metadata } from "next";
import { SetPasswordForm } from "@/components/SetPasswordForm";

export const metadata: Metadata = {
  title: "Set your password — Dopiq",
};

// Reads ?token from the URL via useSearchParams (client), so the
// page must SSR per request — not statically cached. Mirrors
// /signin/page.tsx structure (force-dynamic + Suspense wrapper).
export const dynamic = "force-dynamic";

export default function SetPasswordPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF8] px-6 pb-10 pt-[calc(env(safe-area-inset-top)+3rem)] md:pb-12">
      <Suspense fallback={null}>
        <SetPasswordForm />
      </Suspense>
    </main>
  );
}
