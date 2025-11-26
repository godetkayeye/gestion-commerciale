import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // Utiliser une requête SQL brute pour éviter les erreurs Prisma avec les rôles en minuscules
        const users = await prisma.$queryRaw<Array<{ id: number; nom: string; email: string; mot_de_passe: string; role: string }>>`
          SELECT id, nom, email, mot_de_passe, role
          FROM utilisateur
          WHERE email = ${credentials.email}
          LIMIT 1
        `;
        
        if (!users || users.length === 0) {
          console.log('[next-auth][authorize] user not found for', credentials.email);
          return null;
        }
        
        const user = users[0];
        let valid = false;
        try {
          valid = await compare(credentials.password, user.mot_de_passe);
        } catch {}
        if (!valid) {
          // Tolérance DEV: si le mot de passe en base n'est pas hashé
          if (process.env.NODE_ENV !== "production" && credentials.password === user.mot_de_passe) {
            valid = true;
          }
        }
        if (!valid) return null;
        const role = (user.role || "").toString().toUpperCase();
        console.log('[next-auth][authorize] success sign-in', { email: user.email, role });
        return {
          id: String(user.id),
          name: user.nom,
          email: user.email,
          role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // normalize role to uppercase for consistency
        const role = ((user as any).role || "").toString().toUpperCase();
        token.role = role;
        token.name = user.name;
        try {
          console.log('[next-auth][jwt] sign-in user:', { id: (user as any).id, email: (user as any).email, role });
        } catch (e) {}
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // ensure role is normalized and present on session.user
        session.user.role = (token.role as string | undefined)?.toString().toUpperCase();
        try {
          console.log('[next-auth][session] session user:', { email: session.user.email, role: session.user.role });
        } catch (e) {}
      }
      return session;
    },
  },
};


