import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { prisma } from "@/lib/prisma";
import { SpendingLogger } from "@/components/SpendingLogger";
import { WeeklySummary } from "@/components/WeeklySummary";
import { SpendingHistory } from "@/components/SpendingHistory";

export default async function TrackerPage() {
  const user = await requireOnboardedSubscribedUser();
  const entries = await prisma.spendingLog.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 200,
  });

  const serialized = entries.map((e) => ({
    id: e.id,
    amount: e.amount,
    category: e.category,
    note: e.note,
    date: e.date.toISOString(),
  }));

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <h1 className="text-[24px] font-semibold tracking-tight">Tracker</h1>
        <p className="text-sm text-ink-muted">
          Log what you actually spent. This is real money, not a simulation.
        </p>
      </header>

      <WeeklySummary entries={serialized} />
      <SpendingLogger />
      <SpendingHistory entries={serialized} />
    </div>
  );
}
