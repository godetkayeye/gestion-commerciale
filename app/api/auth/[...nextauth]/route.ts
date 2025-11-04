import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const handler = NextAuth({
  ...authOptions,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.utilisateur.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
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
        return {
          id: String(user.id),
          name: user.nom,
          email: user.email,
          role: user.role as unknown as string,
        } as any;
      },
    }),
  ],
});

export { handler as GET, handler as POST };


