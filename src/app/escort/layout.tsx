import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame, LayoutDashboard, ListChecks, User, BarChart3, CreditCard, Wallet, BadgeCheck, Gift } from "lucide-react";

import { auth } from "@/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Separator } from "@/components/ui/separator";
import { SITE_NAME } from "@/lib/utils";

export default async function EscortLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/escort/dashboard");
  if (session.user.role !== "ESCORT" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
      <aside className="border-b border-border/60 bg-card/40 backdrop-blur md:border-b-0 md:border-r">
        <div className="flex h-16 items-center px-6">
          <Link href="/" className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold gradient-text">{SITE_NAME}</span>
          </Link>
        </div>
        <Separator />
        <div className="space-y-2 p-4">
          <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">
            Espace Escort
          </p>
          <SidebarNav
            items={[
              { href: "/escort/dashboard", label: "Vue d'ensemble", icon: <LayoutDashboard className="h-4 w-4" /> },
              { href: "/escort/annonces", label: "Mes annonces", icon: <ListChecks className="h-4 w-4" /> },
              { href: "/escort/profil", label: "Mon profil", icon: <User className="h-4 w-4" /> },
              { href: "/escort/verification", label: "Vérification ID", icon: <BadgeCheck className="h-4 w-4" /> },
              { href: "/escort/statistiques", label: "Statistiques", icon: <BarChart3 className="h-4 w-4" /> },
              { href: "/escort/premium", label: "Boost / Premium", icon: <CreditCard className="h-4 w-4" /> },
              { href: "/escort/portefeuille", label: "Portefeuille", icon: <Wallet className="h-4 w-4" /> },
              { href: "/escort/parrainage", label: "Parrainage", icon: <Gift className="h-4 w-4" /> },
            ]}
          />
          <Separator className="my-4" />
          <LogoutButton variant="button" />
        </div>
      </aside>
      <main className="p-6 md:p-10">{children}</main>
    </div>
  );
}
