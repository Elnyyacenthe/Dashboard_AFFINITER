import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Config Auth.js partagée par le runtime Edge (middleware) et Node (route handlers).
 * Ne PAS importer Prisma ici — Prisma ne tourne pas en Edge.
 */
export const authConfig = {
  pages: {
    signIn: "/connexion",
    error: "/connexion",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      // Ce dashboard ne contient PAS l'interface admin. Les ADMIN/MODERATOR
      // sont renvoyés sur la home (`/`) qui les redirige vers affiniter.cm/admin externe.
      const isOnEscort = nextUrl.pathname.startsWith("/escort");
      const isOnClient = nextUrl.pathname.startsWith("/client");
      const isOnAuth =
        nextUrl.pathname.startsWith("/connexion") || nextUrl.pathname.startsWith("/inscription");

      if (isOnEscort) {
        return isLoggedIn && role === "ESCORT";
      }
      if (isOnClient) {
        // Tout utilisateur connecté peut accéder à /client/*
        return isLoggedIn;
      }
      if (isOnAuth && isLoggedIn) {
        // ADMIN/MODERATOR : renvoyés vers `/` qui redirigera vers l'admin externe
        const dest =
          role === "ESCORT" ? "/escort/dashboard" : role === "CLIENT" ? "/client" : "/";
        return Response.redirect(new URL(dest, nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  providers: [], // déclarés dans auth.ts (runtime Node)
} satisfies NextAuthConfig;
