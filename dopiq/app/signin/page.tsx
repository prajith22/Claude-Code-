import { Suspense } from "react";
import { SignInForm } from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-16 pb-10 safe-top">
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
