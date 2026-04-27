import { Suspense } from "react";
import { SignUpForm } from "@/components/SignUpForm";
import { SignInMarketing } from "@/components/SignInMarketing";

export default function SignUpPage() {
  return (
    <main className="min-h-[100dvh] bg-white md:grid md:grid-cols-2">
      <SignInMarketing />
      <section className="flex min-h-[100dvh] items-center justify-center px-6 py-10 md:py-12">
        <Suspense fallback={null}>
          <SignUpForm />
        </Suspense>
      </section>
    </main>
  );
}
