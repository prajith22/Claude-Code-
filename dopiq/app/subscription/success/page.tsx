import Link from "next/link";

export default function SubscriptionSuccessPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
        <svg viewBox="0 0 20 20" className="h-8 w-8" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7.7 13.3 4.4 10l-1.4 1.4 4.7 4.7 10-10-1.4-1.4z"
          />
        </svg>
      </div>
      <h1 className="mt-6 text-[28px] font-semibold tracking-tight">
        You&apos;re in.
      </h1>
      <p className="mt-3 max-w-xs text-ink-muted">
        Subscription confirmed. Go get the dopamine hit without the damage.
      </p>
      <Link href="/home" className="btn-primary mt-8 w-full">
        Open Dopiq
      </Link>
    </main>
  );
}
