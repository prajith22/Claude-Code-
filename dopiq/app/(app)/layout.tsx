import { requireSubscribedUser } from "@/lib/session-guards";
import { isIOSWebView } from "@/lib/is-ios-webview";
import { BottomNav } from "@/components/BottomNav";
import { NightModeClass } from "@/components/NightModeClass";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSubscribedUser();
  // Apple prohibits gambling features for apps from individual
  // developer accounts. Strip the Bet tab from both navs when the
  // request comes from inside the iOS WebView; web users see every
  // tab as before.
  const excludeBet = isIOSWebView();

  return (
    <div className="min-h-[100dvh]">
      <NightModeClass />
      <main className="pb-nav mx-auto max-w-2xl px-4 pt-[calc(env(safe-area-inset-top)+1rem)] md:max-w-4xl lg:max-w-6xl">
        {children}
      </main>
      <BottomNav excludeBet={excludeBet} />
    </div>
  );
}
