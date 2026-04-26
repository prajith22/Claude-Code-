import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Root URL is a pure redirect: authed users land on /home, everyone
// else is sent straight to /signin. The split-panel sign-in page IS
// our marketing surface — there's no separate landing to maintain.
export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/home");
  redirect("/signin");
}
