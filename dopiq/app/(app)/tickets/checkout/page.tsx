"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TicketsCheckout,
  type PendingPurchase,
} from "@/components/tickets/TicketsCheckout";

/**
 * Shared checkout entry point. Each sub-sim (Concerts / Sports /
 * Travel) writes a PendingPurchase to sessionStorage and routes
 * here; TicketsCheckout drives the WaitingRoom → maybe price-bump
 * → fee breakdown chain.
 *
 * Auth-gated indirectly: middleware bounces unauthenticated users
 * before this page renders, and the booking pages upstream already
 * called useSimulationGuard which consumed the monthly slot.
 */
export default function TicketsCheckoutPage() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingPurchase | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("dopiq-tickets-pending-checkout");
    if (!raw) {
      router.replace("/tickets");
      return;
    }
    try {
      setPending(JSON.parse(raw) as PendingPurchase);
    } catch {
      router.replace("/tickets");
    }
  }, [router]);

  if (!pending) return null;
  return <TicketsCheckout pending={pending} />;
}
