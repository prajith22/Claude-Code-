import { requireSubscribedUser } from "@/lib/session-guards";
import { QuickSimFlow } from "@/components/QuickSimFlow";

// Quick Sim renders as a fixed full-screen overlay so the green-flash
// step covers everything including the (app) layout's TopNav and
// BottomNav. Auth is still gated by the layout's requireSubscribedUser
// upstream — we re-call it here just to be defensive about direct
// /quick-sim hits.
export default async function QuickSimPage() {
  await requireSubscribedUser();
  return <QuickSimFlow />;
}
