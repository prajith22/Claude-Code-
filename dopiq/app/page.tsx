import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/home");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-14 pb-10 safe-top">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-alt px-3 py-1 text-xs font-semibold text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Dopiq
          </div>
        </div>
        <h1 className="text-[40px] leading-[1.05] font-semibold tracking-tight text-ink">
          Dopamine without the damage.
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-ink-muted">
          Simulate shopping, food delivery, and sports betting with fake money —
          spend it all, keep it all. One separate tool helps track what you
          actually spend in the real world.
        </p>
        <div className="mt-10 space-y-3">
          <Link href="/signin" className="btn-primary w-full">
            Continue with Google
          </Link>
          <p className="text-center text-xs text-ink-muted">
            Free for 30 days, then $3.99/month. Cancel anytime.
          </p>
        </div>
      </div>
      <footer className="pt-8 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} Dopiq
      </footer>
    </main>
  );
}
