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
import { applyWalletDelta, getSettingNumber } from "@/lib/actions/wallet";

export type AuthState =
  | { ok: true; nextStep?: { type: "PAYMENT"; tier: "PREMIUM" | "VIP"; amount: number } }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** Génère un code parrainage unique format YAMO-XXXX. */
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `YAMO-${code}`;
}

/** Connexion par email/téléphone + mot de passe. */
export async function loginAction(_prev: AuthState | null, formData: FormData): Promise<AuthState> {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`login:${ip}`, RL.auth);
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
    return { ok: true };
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
  const rl = rateLimit(`register:${ip}`, RL.auth);
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
  const { name, email, phone, password, role, tier, referralCode } = parsed.data;
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

  // Bonus parrainage inscription (immédiat, plus petit que le bonus paiement)
  if (referrer) {
    const bonus = await getSettingNumber("referral.bonus.signup", 500);
    if (bonus > 0) {
      await applyWalletDelta({
        userId: referrer.id,
        amount: bonus,
        type: "REFERRAL_BONUS",
        description: `Bonus parrainage : ${name} vient de s'inscrire`,
        reference: `ref_signup_${user.id}`,
        idempotencyRef: `ref_signup_${user.id}`,
        metadata: { refereeId: user.id },
      }).catch(() => null);
      await prisma.notification.create({
        data: {
          userId: referrer.id,
          title: "Bonus parrainage 🎁",
          body: `${name} vient de s'inscrire avec votre code. ${bonus} FCFA crédités !`,
          link: "/portefeuille",
        },
      });
    }
  }

  // Auto-login
  await signIn("credentials", { identifier: email, password, redirect: false });

  // Si tier payant choisi → étape paiement
  if (role === "ESCORT" && (tier === "PREMIUM" || tier === "VIP")) {
    const priceKey = tier === "VIP" ? "pricing.vip.amount" : "pricing.premium.amount";
    const amount = await getSettingNumber(priceKey, tier === "VIP" ? 15000 : 5000);
    return { ok: true, nextStep: { type: "PAYMENT", tier, amount } };
  }

  return { ok: true };
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/");
}
