import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { signInSchema } from "@/lib/validations/auth";

const nextAuthResult = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: {},
        password: {},
      },
      async authorize(creds) {
        const parsed = signInSchema.safeParse(creds);
        if (!parsed.success) return null;

        const { identifier, password } = parsed.data;
        const isEmail = identifier.includes("@");
        const cleanedPhone = identifier.replace(/\s/g, "").replace(/^237/, "+237");

        const user = await prisma.user.findFirst({
          where: isEmail ? { email: identifier } : { phone: cleanedPhone },
        });
        if (!user?.password) return null;
        if (user.isBanned) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        // Mise à jour timestamp lastLogin sans bloquer
        prisma.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch(() => null);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});

export const { handlers, signIn, signOut, auth } = nextAuthResult;
// Re-exporte GET/POST pour que la route /api/auth/[...nextauth] puisse les utiliser.
export const { GET, POST } = nextAuthResult.handlers;
