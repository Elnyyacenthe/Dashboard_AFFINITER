"use client";

import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "menu" | "button";
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bouton de déconnexion universel — utilise `signOut` depuis next-auth/react
 * (client-side) au lieu d'un form action server, car Radix DropdownMenuItem
 * capture les clics et empêche le form submit.
 *
 * - `variant="menu"` : entrée de DropdownMenu (gère elle-même `onSelect.preventDefault`)
 * - `variant="button"` : bouton standalone pour sidebar
 */
export function LogoutButton({ variant = "menu", className, children }: Props) {
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await signOut({ callbackUrl: "/", redirect: true });
    });
  }

  if (variant === "menu") {
    return (
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          handleLogout();
        }}
        disabled={pending}
        className={cn("text-destructive focus:text-destructive", className)}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        {children ?? "Déconnexion"}
      </DropdownMenuItem>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50",
        className,
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      {children ?? "Déconnexion"}
    </button>
  );
}
