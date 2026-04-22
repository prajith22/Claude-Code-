import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { BottomNav } from "@/components/BottomNav";
import { TopNav } from "@/components/TopNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOnboardedSubscribedUser();

  return (
    <div className="min-h-[100dvh] bg-white">
      <TopNav />
      <main className="mx-auto max-w-2xl px-4 pt-4 pb-28 md:max-w-4xl md:pb-10">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
