import { QuickSimFlow } from "@/components/QuickSimFlow";

// Quick Sim renders as a fixed full-screen overlay so the green-flash
// step covers everything including the (app) layout's TopNav and
// BottomNav. Auth + subscription are enforced upstream by
// (app)/layout.tsx; the previous extra requireSubscribedUser() call
// here was a duplicate Prisma roundtrip on every visit.
export default function QuickSimPage() {
  return <QuickSimFlow />;
}
