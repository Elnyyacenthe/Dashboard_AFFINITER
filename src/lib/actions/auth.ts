"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { signUpSchema, signInSchema } from "@/lib/validations/auth";
import { rateLimit, RL } from "@/lib/rate-limit";
import { getSettingNumber } from "@/lib/settings";
import { getDashboardNamespace } from "@/lib/dashboard-namespace";
import type { Role } from "@prisma/client";

export type AuthState =
  | {
      ok: true;
      /** URL où le client doit naviguer après login (interne /admin OU externe dashboard.affiniter.cm). */
      redirectTo?: string;
      nextStep?: { type: "PAYMENT"; tier: "PREMIUM" | "VIP"; amount: number };
    }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** Construit l'URL de redirection finale selon le rôle après login. */
function destinationForRole(role: Role): string {
  return getDashboardNamespace(role);
}

/** Génère un code parrainage unique format AFF-XXXX. */
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `AFF-${code}`;
}

/** Connexion par email/téléphone + mot de passe. */
export async function loginAction(_prev: AuthState | null, formData: FormData): Promise<AuthState> {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`login:${ip}`, RL.auth);
  if (!rl.success) {
    return { ok: false, error: "Trop de tentatives. Réessayez dans une minute." };
  }

  const raw = {
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  };
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Champs invalides",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
    // On lit le rôle réel depuis la DB pour calculer la destination
    const isEmail = parsed.data.identifier.includes("@");
    const cleanedPhone = parsed.data.identifier
      .replace(/\s/g, "")
      .replace(/^237/, "+237");
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: parsed.data.identifier }
        : { phone: cleanedPhone },
      select: { role: true },
    });
    const redirectTo = user ? destinationForRole(user.role) : "/";
    return { ok: true, redirectTo };
  } catch (e) {
    if (e instanceof AuthError) {
      return { ok: false, error: "Identifiants invalides" };
    }
    throw e;
  }
}

/** Inscription Client ou Escort avec tier optionnel + code parrainage. */
export async function registerAction(_prev: AuthState | null, formData: FormData): Promise<AuthState> {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`register:${ip}`, RL.auth);
  if (!rl.success) {
    return { ok: false, error: "Trop de tentatives. Réessayez plus tard." };
  }

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
    tier: formData.get("tier") || "STANDARD",
    referralCode: formData.get("referralCode") || undefined,
    acceptTerms: formData.get("acceptTerms") === "on",
    acceptAdult: formData.get("acceptAdult") === "on",
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Formulaire invalide",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const { name, email, phone, password, role, referralCode } = parsed.data;
  const cleanedPhone = phone.replace(/\s/g, "").replace(/^237/, "+237");

  // Anti-doublon (email, téléphone)
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone: cleanedPhone }] },
  });
  if (existing) {
    return { ok: false, error: "Un compte existe déjà avec cet email ou téléphone" };
  }

  // Recherche du parrain si code fourni
  let referrer: { id: string } | null = null;
  if (referralCode) {
    referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });
    if (!referrer) {
      return { ok: false, error: "Code parrainage invalide" };
    }
  }

  // Génère un code parrainage unique pour le nouvel user
  let myReferralCode = generateReferralCode();
  while (await prisma.user.findUnique({ where: { referralCode: myReferralCode } })) {
    myReferralCode = generateReferralCode();
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      phone: cleanedPhone,
      password: hashed,
      name,
      role,
      referralCode: myReferralCode,
      referredById: referrer?.id,
    },
    select: { id: true },
  });

  // NOTE C6 (audit Phase 1) : le bonus parrainage à l'INSCRIPTION est SUPPRIMÉ.
  // Anciennement, le parrain recevait 500 FCFA à chaque nouveau filleul inscrit
  // → ouvrait la porte au farming (créer 100 faux comptes pour gagner 50 000 FCFA).
  // Désormais le bonus est crédité UNIQUEMENT au 1er paiement du filleul
  // (cf. maybeReferralBonusOnPayment dans lib/actions/wallet.ts).
  // Le parrain reçoit en revanche une notification informative non monétaire.
  if (referrer) {
    await prisma.notification.create({
      data: {
        userId: referrer.id,
        title: "Nouveau filleul 👋",
        body: `${name} vient de s'inscrire avec votre code. Vous recevrez un bonus dès son premier paiement Premium / VIP.`,
        link: "/parrainage",
      },
    }).catch(() => null);
  }

  // Auto-login
  await signIn("credentials", { identifier: email, password, redirect: false });

  // v3 — Tous les nouveaux comptes ESCORT vont vers /escort/abonnement
  // (sans abonnement actif, ils ne peuvent rien faire).
  if (role === "ESCORT") {
    return { ok: true, redirectTo: "/escort/abonnement" };
  }

  return { ok: true, redirectTo: destinationForRole(role) };
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/");
}
