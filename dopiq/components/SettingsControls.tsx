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
  // True when the user has an access-granting subscription, regardless
  // of payment processor (Stripe-active or IAP-active both count).
  hasSubscription: boolean;
  // Which payment system owns this subscription, mirrored from the
  // User row. Drives whether the management UI shows Stripe controls
  // (Cancel/Resume/Change/Update Payment) or the Apple deep link.
  // null means no subscription has ever been started.
  subscriptionSource: string | null;
  stripeError: string | null;
  plans: PlanSummary[];
  // App Store reviewer accounts have no Stripe customer/subscription.
  // hasSubscription already hides every Stripe-gated section, but we
  // also swap the "Current plan" card copy so the reviewer doesn't
  // see "No plan selected".
  isReviewer: boolean;
  // True when the request came from the Dopiq iOS WebView. Used to
  // surface IAP-specific affordances (Restore Purchases) that talk
  // back to the native shell via window.ReactNativeWebView.
  isIOSWebView: boolean;
};

// iOS App Store deep link for the per-Apple-ID subscriptions list.
// WKWebView routes itms-apps:// requests to the App Store app via
// the system URL handler, so a plain <a href> is enough — no
// postMessage shim required.
const APPLE_MANAGE_SUBSCRIPTIONS_URL =
  "itms-apps://apps.apple.com/account/subscriptions";

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

// Tells the iOS shell to run getAvailablePurchases + verify-receipt
// and Alert the result. The shell listens for this message in
// dopiq-ios/App.tsx (onWebViewMessage). Web users never run this —
// the button that triggers it only renders when isIOSWebView is true,
// AND the postMessage call no-ops outside the WebView.
function postRestoreToNativeShell(): void {
  // window.ReactNativeWebView is injected by react-native-webview.
  type RNWebView = { postMessage: (msg: string) => void };
  const w = (typeof window !== "undefined" ? window : undefined) as
    | (Window & { ReactNativeWebView?: RNWebView })
    | undefined;
  w?.ReactNativeWebView?.postMessage(
    JSON.stringify({ type: "restore_purchases" }),
  );
}

export function SettingsControls({
  currentPlan,
  status,
  nextBillingAt,
  cancelAtPeriodEnd,
  hasSubscription,
  subscriptionSource,
  stripeError,
  plans,
  isReviewer,
  isIOSWebView,
}: Props) {
  // Gate every Stripe-bound management section on this — reviewer
  // accounts and IAP users both have hasSubscription=true on their
  // User rows but no Stripe object to talk to. Without this gate the
  // Cancel/Resume/Change/Update Payment buttons would all 4xx the
  // /api/stripe/* routes for those users.
  const hasStripeSubscription =
    hasSubscription && subscriptionSource === "stripe";
  const hasIOSSubscription =
    hasSubscription && subscriptionSource === "ios";
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

  async function resumeSubscription() {
    setBusy("resume");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/stripe/resume", { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Couldn’t resume subscription.");
      setLocalCancelAtPeriodEnd(false);
      setNotice("Subscription resumed. Billing will continue normally.");
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
            {isReviewer
              ? "Reviewer access"
              : planRecord?.name ?? "No plan selected"}
          </h2>
          <span className="rounded-pill bg-surface-alt px-3 py-1 text-[12px] font-bold text-ink">
            {isReviewer ? "Active" : statusLabel}
          </span>
        </div>
        {isReviewer ? (
          <p className="mt-1 text-[14px] text-ink-muted">
            Unlimited simulations · no billing
          </p>
        ) : (
          planRecord && (
            <p className="mt-1 text-[14px] text-ink-muted">
              ${planRecord.priceUsd.toFixed(2)}/mo ·{" "}
              {planRecord.simulationsLimit >= 999_999
                ? "Unlimited simulations"
                : `${planRecord.simulationsLimit} simulations / month`}
            </p>
          )
        )}
        {!isReviewer && nextBillingLabel && hasSubscription && (
          <p className="mt-3 text-[13px] text-ink-muted">
            {localCancelAtPeriodEnd
              ? `Access ends on ${nextBillingLabel}.`
              : status === "trialing"
              ? `Trial ends ${nextBillingLabel}. Card will be charged then.`
              : `Next billing date: ${nextBillingLabel}.`}
          </p>
        )}
      </section>

      {/* Apple-managed subscription card. Rendered for IAP users
          in lieu of the Stripe Cancel/Resume/Change/Update controls,
          which don't apply when the subscription is governed by
          Apple. Deep-links to the per-Apple-ID Subscriptions screen
          inside iOS Settings via the itms-apps:// scheme. WKWebView
          forwards that scheme to the App Store app automatically,
          so this works in the iOS shell without any native
          interceptor. On desktop / mobile Safari (rare path: a paid
          iOS user opens dopiqapp.com on their laptop) the link is a
          no-op gracefully. */}
      {hasIOSSubscription && (
        <section className="rounded-card border border-surface-border bg-white p-6 shadow-card">
          <h3 className="font-heading text-[18px] font-bold text-ink">
            Manage subscription
          </h3>
          <p className="mt-1 text-[13px] text-ink-muted">
            Subscriptions are managed through Apple. Tap below to open
            iOS Settings → Apple ID → Subscriptions, where you can
            change plan, update payment, or cancel.
          </p>
          <a
            href={APPLE_MANAGE_SUBSCRIPTIONS_URL}
            className="btn-navy mt-4 inline-flex"
          >
            Manage in iOS Settings
          </a>
        </section>
      )}

      {/* Payment method — Stripe portal. Hidden for IAP users since
          Apple manages their card on file. */}
      {hasStripeSubscription && (
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

      {/* Change plan — Stripe-only. IAP users change plans via
          Apple Settings, surfaced through the Apple-managed card
          above. */}
      {hasStripeSubscription && !localCancelAtPeriodEnd && (
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

      {/* Cancel — soft outlined style; the destructive cousin
          (Delete) is solid red so the visual hierarchy reads
          "easy reversible action" → "permanent action". Stripe-only;
          IAP users cancel inside iOS Settings (linked above). */}
      {hasStripeSubscription && !localCancelAtPeriodEnd && (
        <section className="rounded-card border border-surface-border bg-white p-6 shadow-card">
          <h3 className="font-heading text-[18px] font-bold text-ink">
            Cancel subscription
          </h3>
          <button
            type="button"
            onClick={() => setConfirmingCancel(true)}
            className="mt-3 rounded-pill border border-surface-border bg-white px-5 py-2.5 text-[13px] font-semibold text-ink-muted transition hover:bg-surface-alt hover:text-ink"
          >
            Cancel subscription
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
            You keep full access until the end of your billing period.
            Your account and all your data stay intact — savings,
            streak, bet history. You can resubscribe anytime.
          </p>
        </section>
      )}

      {/* Resume — only when a cancellation is pending. Brand-green
          outline so it reads as a positive, restorative action.
          Stripe-only — Apple's resume mechanic lives inside iOS
          Settings → Subscriptions. */}
      {hasStripeSubscription && localCancelAtPeriodEnd && (
        <section className="rounded-card border border-surface-border bg-white p-6 shadow-card">
          <h3 className="font-heading text-[18px] font-bold text-ink">
            Resume subscription
          </h3>
          <button
            type="button"
            onClick={resumeSubscription}
            disabled={busy === "resume"}
            className="mt-3 rounded-pill border-2 border-brand bg-white px-5 py-2.5 text-[13px] font-bold text-brand transition hover:bg-brand-light disabled:opacity-60"
          >
            {busy === "resume" ? "Resuming…" : "Resume subscription"}
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
            {nextBillingLabel
              ? `Your subscription is set to end on ${nextBillingLabel}. Resume to keep your access and continue billing normally.`
              : "Your subscription is set to end at the close of this billing period. Resume to keep your access and continue billing normally."}
          </p>
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

      {/* Restore Purchases — iOS only. Tapping postMessages the
          native shell, which calls getAvailablePurchases against
          Apple, posts the latest receipt to /api/iap/verify-receipt,
          and surfaces the result via a native Alert. Hidden on web
          since web subscribers manage their plan via the Stripe
          sections above. */}
      {isIOSWebView && (
        <section className="rounded-card border border-surface-border bg-white p-6 shadow-card">
          <h3 className="font-heading text-[18px] font-bold text-ink">
            Restore purchases
          </h3>
          <p className="mt-2 text-[14px] text-ink-muted">
            Already subscribed on this Apple ID? Restore to sync your
            subscription with this account.
          </p>
          <button
            type="button"
            onClick={postRestoreToNativeShell}
            className="btn-secondary mt-4 inline-flex"
          >
            Restore purchases
          </button>
        </section>
      )}

      {/* Delete account — last so destructive actions sit at the
          bottom of the page, away from the day-to-day controls.
          Solid red button is intentional: it should feel heavier
          than the soft outlined Cancel above it. */}
      <section className="rounded-card border border-red-200 bg-white p-6 shadow-card">
        <h3 className="font-heading text-[18px] font-bold text-ink">
          Delete account
        </h3>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="mt-3 rounded-pill bg-red-600 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-red-700"
        >
          Delete account
        </button>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
          Immediately cancels your billing and permanently erases your
          account and all data. This cannot be undone.
        </p>
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
          hasIOSSubscription={hasIOSSubscription}
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
  hasIOSSubscription,
  onConfirm,
  onClose,
}: {
  busy: boolean;
  hasIOSSubscription: boolean;
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
          This will permanently delete your account and all your saved
          data. This cannot be undone.
        </p>
        {hasIOSSubscription && (
          // IAP-source users keep paying Apple after a DB deletion
          // unless they cancel the auto-renewal in iOS Settings. The
          // backend can't reach Apple's StoreKit servers on the
          // user's behalf, so we have to tell them how to stop the
          // billing themselves.
          <p className="mt-3 rounded-card border border-[#E8E4E0] bg-[#FFF9E6] px-3 py-2 text-[12px] leading-relaxed text-[#5D4037]">
            Your active subscription will continue until the end of
            your billing period. To cancel auto-renewal, manage
            subscriptions in iOS Settings → Apple ID → Subscriptions.
          </p>
        )}
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
