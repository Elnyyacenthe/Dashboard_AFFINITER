import { z } from "zod";

const PHONE_REGEX = /^(\+237|237)?[\s-]?6\d{8}$/;

export const adSchema = z.object({
  title: z.string().min(10, "Titre trop court (10 caractères minimum)").max(120),
  description: z
    .string()
    .min(50, "Description trop courte (50 caractères minimum)")
    .max(3000),
  cityId: z.string().cuid("Ville requise"),
  neighborhood: z.string().max(80).optional(),
  price: z.coerce.number().int().min(1000, "Prix minimum 1000 FCFA").max(10000000),
  priceNight: z.coerce.number().int().min(0).max(100000000).optional(),
  whatsappPhone: z
    .string()
    .refine((v) => PHONE_REGEX.test(v.replace(/\s/g, "")), "Numéro WhatsApp camerounais invalide"),
  callPhone: z.string().optional(),
  services: z.array(z.string()).default([]),
  incall: z.coerce.boolean().default(true),
  outcall: z.coerce.boolean().default(false),
  age: z.coerce.number().int().min(18, "Âge minimum : 18 ans").max(80),
  gender: z.enum(["FEMALE", "MALE", "TRANS", "COUPLE"]).default("FEMALE"),
  acceptAdult: z.literal(true, {
    errorMap: () => ({ message: "Vous devez confirmer être majeur(e) et consentant(e)" }),
  }),
});
export type AdInput = z.infer<typeof adSchema>;

export const adFilterSchema = z.object({
  q: z.string().optional(),
  citySlug: z.string().optional(),
  minPrice: z.coerce.number().int().optional(),
  maxPrice: z.coerce.number().int().optional(),
  minAge: z.coerce.number().int().optional(),
  maxAge: z.coerce.number().int().optional(),
  verified: z.coerce.boolean().optional(),
  service: z.string().optional(),
  gender: z.enum(["FEMALE", "MALE", "TRANS", "COUPLE"]).optional(),
  sort: z.enum(["recent", "price_asc", "price_desc", "popular"]).default("recent"),
  page: z.coerce.number().int().min(1).default(1),
});
export type AdFilter = z.infer<typeof adFilterSchema>;
