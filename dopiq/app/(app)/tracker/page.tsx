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
    <div className="space-y-5 pb-4">
      <header className="pt-2">
        <h1 className="text-[26px] font-bold tracking-tight">Tracker</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Real money. Real consequences. Log it honestly.
        </p>
      </header>

      <WeeklySummary entries={serialized} />
      <SpendingLogger />
      <SpendingHistory entries={serialized} />
    </div>
  );
}
