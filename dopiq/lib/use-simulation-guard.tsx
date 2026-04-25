"use client";

import { useCallback, useState } from "react";
import { UpgradeModal } from "@/components/UpgradeModal";

type GuardState = {
  open: boolean;
  plan: string | null;
  used: number;
  limit: number;
};

const INITIAL: GuardState = {
  open: false,
  plan: null,
  used: 0,
  limit: 0,
};

// Wraps a "place X" action with a server-side simulation count check.
// Call `tryRun(handler)`; if the user is over their cap the handler is
// skipped and the upgrade modal opens instead. Drop `<modal />` once
// in the consuming component's tree.
export function useSimulationGuard() {
  const [state, setState] = useState<GuardState>(INITIAL);

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const tryRun = useCallback(async (handler: () => void | Promise<void>) => {
    const res = await fetch("/api/simulations/use", { method: "POST" });
    if (res.status === 403) {
      const data = (await res.json().catch(() => ({}))) as {
        plan?: string;
        used?: number;
        limit?: number;
      };
      setState({
        open: true,
        plan: data.plan ?? null,
        used: data.used ?? 0,
        limit: data.limit ?? 0,
      });
      return false;
    }
    if (!res.ok) {
      // Fail open on transient errors so a flaky network doesn't block
      // the simulator entirely. The cap will catch up on the next run.
      console.warn("[simulation-guard] non-403 error from API:", res.status);
    }
    await handler();
    return true;
  }, []);

  const modal = (
    <UpgradeModal
      open={state.open}
      onClose={close}
      currentPlan={state.plan}
      used={state.used}
      limit={state.limit}
    />
  );

  return { tryRun, modal };
}
