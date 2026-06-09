import Link from "next/link";
import { cache } from "react";
import { Flame, Plus, User, LayoutDashboard, Shield, Wallet, Heart, Gift } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatXAF } from "@/lib/utils";

import { auth } from "@/auth";
import { LogoutButton } from "@/components/auth/logout-button";

/**
 * `cache()` dédoublonne automatiquement les appels identiques pendant une
 * même requête HTTP. Si plusieurs Server Components demandent le solde, on
 * fait une seule query Prisma au lieu de N. Évite aussi 2x auth().
 */
const getWalletBalance = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true },
  });
});
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SITE_NAME } from "@/lib/utils";

export async function Header() {
  const session = await auth();
  const user = session?.user;

  // Solde wallet à afficher dans le menu (dédoublonné via React cache)
  const dbUser = user ? await getWalletBalance(user.id) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Flame className="h-7 w-7 text-primary" />
          <span className="font-display text-2xl font-bold gradient-text">{SITE_NAME}</span>
        </Link>

        {/* Espace dashboard : pas de nav publique. Badge "Dashboard". */}
        <div className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:flex">
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-0.5 text-primary">
            Dashboard
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Lien vers le site public (env var configurable côté déploiement) */}
          {user?.role === "ESCORT" && (
            <Button
              asChild
              variant="accent"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <a
                href={`${process.env.NEXT_PUBLIC_AFFINITER_URL ?? "https://affiniter.cm"}/poster-une-annonce`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Plus className="mr-1" />
                Poster une annonce ↗
              </a>
            </Button>
          )}
          {user?.role === "CLIENT" && (
            <Button asChild variant="accent" size="sm" className="hidden sm:inline-flex">
              <Link href="/client/devenir-escort">
                <Plus className="mr-1" />
                Devenir escort
              </Link>
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="rounded-full outline-none ring-primary focus-visible:ring-2">
                  <Avatar className="h-9 w-9 border border-primary/40">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Avatar"} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              {/* Routing par rôle :
                  - ADMIN/MODERATOR → /admin
                  - ESCORT          → /escort/*
                  - CLIENT          → /client/*  */}
              {(() => {
                const ns =
                  user.role === "ADMIN" || user.role === "MODERATOR"
                    ? null
                    : user.role === "ESCORT"
                      ? "/escort"
                      : "/client";
                return (
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel>{user.name ?? user.email}</DropdownMenuLabel>
                    {ns && (
                      <DropdownMenuItem asChild>
                        <Link href={`${ns}/portefeuille`} className="flex justify-between">
                          <span className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" /> Portefeuille
                          </span>
                          <span className="text-xs font-bold text-primary">
                            {formatXAF(dbUser?.walletBalance ?? 0)}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {user.role === "ESCORT" && (
                      <DropdownMenuItem asChild>
                        <Link href="/escort/dashboard">
                          <LayoutDashboard className="h-4 w-4" /> Mon dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === "CLIENT" && (
                      <DropdownMenuItem asChild>
                        <Link href="/client">
                          <LayoutDashboard className="h-4 w-4" /> Mon espace
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                      <DropdownMenuItem asChild>
                        <a
                          href={
                            process.env.NEXT_PUBLIC_AFFINITER_ADMIN_URL ??
                            `${process.env.NEXT_PUBLIC_AFFINITER_URL ?? "https://affiniter.cm"}/admin`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Shield className="h-4 w-4" /> Administration ↗
                        </a>
                      </DropdownMenuItem>
                    )}
                    {ns && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`${ns}/favoris`}>
                            <Heart className="h-4 w-4" /> Mes favoris
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`${ns}/parrainage`}>
                            <Gift className="h-4 w-4" /> Parrainage
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`${ns}/compte`}>
                            <User className="h-4 w-4" /> Mon compte
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <LogoutButton />
                  </DropdownMenuContent>
                );
              })()}
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/connexion">Connexion</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/inscription">Inscription</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
