import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate un prix en FCFA. */
export function formatXAF(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

/** Génère un slug URL-safe à partir d'un texte. */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Masque un numéro de téléphone : 6XXX XX 12 34 → 6XXX XX •• ••.
 *  Affiche les 4 premiers et 2 derniers caractères, masque le reste. */
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.length < 8) return "••• •• •• ••";
  const visible = cleaned.slice(0, 6);
  const tail = cleaned.slice(-2);
  return `${visible} •• ${tail}`;
}

/** Distance temporelle relative en français. */
export function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "an"],
    [2592000, "mois"],
    [86400, "jour"],
    [3600, "heure"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const v = Math.floor(seconds / secs);
    if (v >= 1) return `il y a ${v} ${label}${v > 1 && label !== "mois" ? "s" : ""}`;
  }
  return "à l'instant";
}

/** Hash SHA-256 (pour anonymiser une IP, RGPD). */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Yamo";
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
