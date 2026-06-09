import { prisma } from "@/lib/prisma";

export async function getSettingNumber(key: string, fallback: number): Promise<number> {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  if (!setting) return fallback;
  const n = Number(setting.value);
  return Number.isFinite(n) ? n : fallback;
}

export async function getSettingString(key: string, fallback: string): Promise<string> {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return setting?.value ?? fallback;
}
