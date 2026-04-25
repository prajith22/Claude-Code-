"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  useBetSlipStore,
  type SlipSelection,
} from "@/lib/bet-slip-store";
import {
  cn,
  combineAmericanOdds,
  combinedDecimal,
  formatOdds,
  formatUSD,
} from "@/lib/utils";
import { useSimulationGuard } from "@/lib/use-simulation-guard";

const QUICK_AMOUNTS = [10, 25, 50, 100];

export function BetSlipPanel() {
  const selections = useBetSlipStore((s) => s.selections);
  const stake = useBetSlipStore((s) => s.stake);
  const setStake = useBetSlipStore((s) => s.setStake);
  const clear = useBetSlipStore((s) => s.clear);
  const remove = useBetSlipStore((s) => s.remove);
  const router = useRouter();
  const { tryRun, modal } = useSimulationGuard();

  async function placeBet() {
    if (selections.length === 0 || stake <= 0) return;
    await tryRun(() => {
      const combinedOdds = combineAmericanOdds(selections.map((s) => s.odds));
      const decimal = combinedDecimal(selections.map((s) => s.odds));
      const potentialReturn = stake * decimal;
      try {
        sessionStorage.setItem(
          "dopiq-last-placed-bet",
          JSON.stringify({
            selections,
            stake,
            combinedOdds,
            potentialReturn,
            placedAt: new Date().toISOString(),
          }),
        );
      } catch {
        // sessionStorage blocked — confirmation page will show a fallback
      }
      clear();
      router.push("/bet/confirmed");
    });
  }

  return (
    <>
      {/* Desktop: sticky right rail */}
      <div className="hidden lg:block">
        <div className="sticky top-20">
          <SlipCard
            selections={selections}
            stake={stake}
            onSetStake={setStake}
            onRemove={remove}
            onClear={clear}
            onPlace={placeBet}
            variant="desktop"
          />
        </div>
      </div>

      {/* Mobile: slide-up bottom sheet, only when the slip has picks */}
      <AnimatePresence>
        {selections.length > 0 && (
          <motion.div
            key="mobile-sheet"
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            exit={{ y: "105%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
          >
            <SlipCard
              selections={selections}
              stake={stake}
              onSetStake={setStake}
              onRemove={remove}
              onClear={clear}
              onPlace={placeBet}
              variant="mobile"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {modal}
    </>
  );
}

function SlipCard({
  selections,
  stake,
  onSetStake,
  onRemove,
  onClear,
  onPlace,
  variant,
}: {
  selections: SlipSelection[];
  stake: number;
  onSetStake: (n: number) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  onPlace: () => void;
  variant: "desktop" | "mobile";
}) {
  const isParlay = selections.length >= 2;
  const combinedOdds =
    selections.length > 0
      ? combineAmericanOdds(selections.map((s) => s.odds))
      : 0;
  const decimal =
    selections.length > 0 ? combinedDecimal(selections.map((s) => s.odds)) : 0;
  const profit = decimal > 0 ? stake * (decimal - 1) : 0;

  const canPlace = selections.length > 0 && stake > 0;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden border border-surface-border bg-white shadow-cardHover",
        variant === "desktop"
          ? "max-h-[calc(100vh-6rem)] rounded-card"
          : "max-h-[80vh] rounded-t-card",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-navy px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-[15px] font-extrabold text-white">
            Bet Slip
          </h2>
          {selections.length > 0 && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold text-white">
              {selections.length}
            </span>
          )}
        </div>
        {selections.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-[12px] font-semibold text-white/70 transition hover:text-white"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {selections.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {isParlay && (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-brand-light bg-brand-light/50 px-3 py-2">
                <span className="text-[12px] font-bold uppercase tracking-widest text-brand">
                  Parlay · {selections.length} legs
                </span>
                <span className="font-mono text-[20px] font-extrabold text-brand">
                  {formatOdds(combinedOdds)}
                </span>
              </div>
            )}
            <ul className="space-y-2">
              {selections.map((sel) => (
                <li
                  key={sel.key}
                  className="flex items-start gap-2 rounded-xl border border-surface-border bg-surface-alt px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-ink">
                      {sel.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {sel.sport} · {sel.matchup} ·{" "}
                      <span className="uppercase">
                        {sel.type === "total"
                          ? "Total"
                          : sel.type === "spread"
                            ? "Spread"
                            : "Moneyline"}
                      </span>
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[13px] font-bold text-brand">
                    {formatOdds(sel.odds)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(sel.key)}
                    aria-label="Remove selection"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-border hover:text-ink"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path
                        d="M4 4l8 8M12 4l-8 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Footer: stake input + place */}
      {selections.length > 0 && (
        <div className="space-y-3 border-t border-surface-border bg-white px-4 py-3">
          <div>
            <label
              htmlFor={`slip-stake-${variant}`}
              className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted"
            >
              Fake amount
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-surface-border bg-surface-alt px-3 py-2">
              <span className="text-ink-muted">$</span>
              <input
                id={`slip-stake-${variant}`}
                type="number"
                min={0}
                step={1}
                inputMode="decimal"
                value={Number.isNaN(stake) ? "" : stake}
                onChange={(e) => onSetStake(Number.parseFloat(e.target.value))}
                className="w-full bg-transparent text-[15px] font-bold text-ink outline-none"
              />
            </div>
            <div className="mt-2 flex gap-1.5">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onSetStake(v)}
                  className={cn(
                    "flex-1 rounded-full border px-2 py-1 text-[12px] font-semibold transition",
                    stake === v
                      ? "border-brand bg-brand-light text-brand"
                      : "border-surface-border bg-white text-ink-muted hover:bg-surface-alt",
                  )}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-ink-muted">
              Potential payout
            </span>
            <span className="font-mono text-[17px] font-extrabold text-brand">
              {formatUSD(profit)}
            </span>
          </div>

          <button
            type="button"
            onClick={onPlace}
            disabled={!canPlace}
            className="btn-primary w-full"
          >
            Place Bet
          </button>
          <p className="text-center text-[11px] text-ink-muted">
            Simulated · No real money at risk
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <BasketballIcon />
      <p className="mt-4 text-[14px] font-semibold text-ink-muted">
        Your picks will show up here
      </p>
      <p className="mt-1 text-[12px] text-ink-faint">
        Tap an odds cell on any game to add it.
      </p>
    </div>
  );
}

function BasketballIcon() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden
      className="text-ink-faint"
    >
      <circle cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 22h36M22 4v36M9 9l26 26M9 35l26-26"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
