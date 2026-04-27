"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import type { PlanId } from "@/lib/stripe";

type PlanSummary = {
  id: PlanId;
  name: string;
  priceUsd: number;
  simulationsLimit: number;
};

type Props = {
  currentPlan: PlanId | null;
  status: string | null;
  nextBillingAt: number | null;
  cancelAtPeriodEnd: boolean;
  hasSubscription: boolean;
  stripeError: string | null;
  plans: PlanSummary[];
};

const STATUS_LABELS: Record<string, string> = {
  trialing: "Free trial",
  active: "Active",
  past_due: "Payment failed",
  unpaid: "Payment failed",
  canceled: "Canceled",
  incomplete: "Incomplete",
  incomplete_expired: "Expired",
  paused: "Paused",
};

function formatDate(unixSec: number | null) {
  if (!unixSec) return null;
  return new Date(unixSec * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function SettingsControls({
  currentPlan,
  status,
  nextBillingAt,
  cancelAtPeriodEnd,
  hasSubscription,
  stripeError,
  plans,
}: Props) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(stripeError);
  const [notice, setNotice] = useState<string | null>(null);
  const [localCancelAtPeriodEnd, setLocalCancelAtPeriodEnd] =
    useState(cancelAtPeriodEnd);

  const statusLabel = status ? STATUS_LABELS[status] ?? status : "No plan";
  const nextBillingLabel = formatDate(nextBillingAt);
  const planRecord = plans.find((p) => p.id === currentPlan) ?? null;

  async function openPortal() {
    setBusy("portal");
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to open portal.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  async function changePlan(plan: PlanId) {
    setBusy(`plan-${plan}`);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to change plan.");
      setNotice("Plan updated. Your next invoice will reflect the change.");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  async function confirmCancel() {
    setBusy("cancel");
    setError(null);
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel.");
      setLocalCancelAtPeriodEnd(true);
      setConfirmingCancel(false);
      setNotice(
        nextBillingLabel
          ? `Subscription canceled. You keep access until ${nextBillingLabel}.`
          : "Subscription canceled. You keep access until the end of the billing period.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function confirmDelete() {
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Couldn’t delete your account.");
      }
      // Stripe is canceled, DB rows are gone — drop the JWT cookie
      // and land on /signin with a friendly notice. signOut handles
      // the redirect; no router.push needed.
      await signOut({
        callbackUrl: "/signin?deleted=1",
        redirect: true,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-medium text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-card border border-brand bg-brand-light px-4 py-3 text-[14px] font-medium text-ink">
          {notice}
        </div>
      )}

      {/* Current plan card */}
      <section className="rounded-card border border-surface-border bg-white p-6 shadow-card">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-ink-muted">
          Current plan
        </p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-heading text-[24px] font-bold text-ink">
            {planRecord?.name ?? "No plan selected"}
          </h2>
          <span className="rounded-pill bg-surface-alt px-3 py-1 text-[12px] font-bold text-ink">
            {statusLabel}
          </span>
        </div>
        {planRecord && (
          <p className="mt-1 text-[14px] text-ink-muted">
            ${planRecord.priceUsd.toFixed(2)}/mo ·{" "}
            {planRecord.simulationsLimit >= 999_999
              ? "Unlimited simulations"
              : `${planRecord.simulationsLimit} simulations / month`}
          </p>
        )}
        {nextBillingLabel && hasSubscription && (
          <p className="mt-3 text-[13px] text-ink-muted">
            {localCancelAtPeriodEnd
              ? `Access ends on ${nextBillingLabel}.`
              : status === "trialing"
              ? `Trial ends ${nextBillingLabel}. Card will be charged then.`
              : `Next billing date: ${nextBillingLabel}.`}
          </p>
        )}
      </section>

      {/* Payment method */}
      {hasSubscription && (
        <section className="rounded-card border border-surface-border bg-white p-6 shadow-card">
          <h3 className="font-heading text-[18px] font-bold text-ink">
            Payment method
          </h3>
          <p className="mt-1 text-[13px] text-ink-muted">
            Update your card or view invoices in the Stripe customer portal.
          </p>
          <button
            type="button"
            onClick={openPortal}
            disabled={busy === "portal"}
            className="btn-navy mt-4"
          >
            {busy === "portal" ? "Opening portal…" : "Update payment method"}
          </button>
        </section>
      )}

      {/* Change plan */}
      {hasSubscription && !localCancelAtPeriodEnd && (
        <section className="rounded-card border border-surface-border bg-white p-6 shadow-card">
          <h3 className="font-heading text-[18px] font-bold text-ink">
            Change plan
          </h3>
          <p className="mt-1 text-[13px] text-ink-muted">
            Switch up or down anytime. Stripe prorates the difference.
          </p>
          <ul className="mt-4 space-y-3">
            {plans.map((p) => {
              const isCurrent = p.id === currentPlan;
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border px-4 py-3"
                >
                  <div>
                    <p className="text-[15px] font-bold text-ink">{p.name}</p>
                    <p className="text-[12px] text-ink-muted">
                      ${p.priceUsd.toFixed(2)}/mo ·{" "}
                      {p.simulationsLimit >= 999_999
                        ? "Unlimited simulations"
                        : `${p.simulationsLimit} simulations / month`}
                    </p>
                  </div>
                  {isCurrent ? (
                    <span className="rounded-pill bg-brand-light px-3 py-1 text-[11px] font-bold text-brand">
                      Current
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => changePlan(p.id)}
                      disabled={busy === `plan-${p.id}`}
                      className="btn-secondary"
                    >
                      {busy === `plan-${p.id}` ? "Switching…" : "Switch"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Cancel */}
      {hasSubscription && !localCancelAtPeriodEnd && (
        <section className="rounded-card border border-surface-border bg-white p-6 shadow-card">
          <h3 className="font-heading text-[18px] font-bold text-ink">
            Cancel subscription
          </h3>
          <p className="mt-1 text-[13px] text-ink-muted">
            You&apos;ll keep access until the end of the current billing
            period. No refunds for the time already paid.
          </p>
          <button
            type="button"
            onClick={() => setConfirmingCancel(true)}
            className="mt-4 rounded-pill border border-red-200 bg-white px-5 py-2.5 text-[13px] font-bold text-red-700 transition hover:bg-red-50"
          >
            Cancel subscription
          </button>
        </section>
      )}

      {/* No subscription fallback */}
      {!hasSubscription && (
        <section className="rounded-card border border-surface-border bg-white p-6 shadow-card text-center">
          <p className="text-[14px] text-ink-muted">
            You don&apos;t have an active subscription.
          </p>
          <a href="/paywall" className="btn-primary mt-4 inline-flex">
            Choose a plan
          </a>
        </section>
      )}

      {/* Delete account — last so destructive actions sit at the
          bottom of the page, away from the day-to-day controls. */}
      <section className="rounded-card border border-red-200 bg-white p-6 shadow-card">
        <h3 className="font-heading text-[18px] font-bold text-ink">
          Delete account
        </h3>
        <p className="mt-1 text-[13px] text-ink-muted">
          Permanently remove your account, your simulations, and any
          active subscription. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="mt-4 rounded-pill bg-red-600 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-red-700"
        >
          Delete account
        </button>
      </section>

      {confirmingCancel && (
        <CancelModal
          busy={busy === "cancel"}
          accessEndsLabel={nextBillingLabel}
          onConfirm={confirmCancel}
          onClose={() => !busy && setConfirmingCancel(false)}
        />
      )}

      {confirmingDelete && (
        <DeleteAccountModal
          busy={busy === "delete"}
          onConfirm={confirmDelete}
          onClose={() => !busy && setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}

function CancelModal({
  busy,
  accessEndsLabel,
  onConfirm,
  onClose,
}: {
  busy: boolean;
  accessEndsLabel: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-5">
      <div className="w-full max-w-md rounded-card bg-white p-6 shadow-cardHover">
        <h2 className="font-heading text-[22px] font-bold text-ink">
          Cancel your subscription?
        </h2>
        <p className="mt-2 text-[14px] text-ink-muted">
          {accessEndsLabel
            ? `You'll keep full access until ${accessEndsLabel}, then you'll lose access.`
            : "You'll keep access until the end of the current billing period."}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="btn-secondary"
          >
            Keep subscription
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-pill bg-red-600 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Canceling…" : "Confirm cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteAccountModal({
  busy,
  onConfirm,
  onClose,
}: {
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-5">
      <div className="w-full max-w-md rounded-card bg-white p-6 shadow-cardHover">
        <h2 className="font-heading text-[22px] font-bold text-ink">
          Delete your account?
        </h2>
        <p className="mt-2 text-[14px] text-ink-muted">
          This will permanently delete your account and cancel your
          subscription. This cannot be undone.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="btn-secondary"
          >
            Keep my account
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-pill bg-red-600 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Yes, delete it"}
          </button>
        </div>
      </div>
    </div>
  );
}
