import { requireSubscribedUser } from "@/lib/session-guards";
import { BottomNav } from "@/components/BottomNav";
import { TopNav } from "@/components/TopNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSubscribedUser();

  return (
    <div className="min-h-[100dvh]">
      <TopNav />
      <main className="pb-nav mx-auto max-w-2xl px-4 pt-4 md:max-w-4xl lg:max-w-6xl">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
