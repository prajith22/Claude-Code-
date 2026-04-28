import { Suspense } from "react";
import { SignInForm } from "@/components/SignInForm";
import { SignInMarketing } from "@/components/SignInMarketing";

export default function SignInPage() {
  return (
    <main className="min-h-[100dvh] bg-[#FAFAF8] md:grid md:grid-cols-2">
      <SignInMarketing />
      <section className="flex min-h-[100dvh] items-center justify-center px-6 py-10 md:py-12">
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </section>
    </main>
  );
}
