import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDashboardNamespace } from "@/lib/dashboard-namespace";

export default async function CompteRedirect() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte");
  const ns = getDashboardNamespace(session.user.role);
  redirect(`${ns}/compte`);
}
