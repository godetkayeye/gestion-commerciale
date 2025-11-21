import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ASSIGNABLE_ROLES } from "@/lib/roles";

const allowed = new Set(["ADMIN", "MANAGER_MULTI"]);

const CreateSchema = z.object({
  nom: z.string().min(2),
  email: z.string().email(),
  mot_de_passe: z.string().min(6),
  role: z.enum(MANAGER_ASSIGNABLE_ROLES),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Utiliser une requête SQL brute pour éviter les erreurs Prisma avec les rôles invalides
  const usersRaw = await prisma.$queryRaw<Array<{ id: number; nom: string; email: string; role: string; date_creation: Date | null }>>`
    SELECT id, nom, email, role, date_creation
    FROM utilisateur
    ORDER BY date_creation DESC
  `;

  // Filtrer et normaliser les rôles
  const validRoles = new Set(["ADMIN", "CAISSIER", "LOCATION", "MANAGER_MULTI", "CAISSE_RESTAURANT", "CAISSE_BAR", "CAISSE_LOCATION", "CONSEIL_ADMINISTRATION", "SUPERVISEUR", "ECONOMAT"]);
  const roleMapping: Record<string, string> = {
    'bar': 'CAISSE_BAR',
    'BAR': 'CAISSE_BAR',
    'gerant_restaurant': 'CAISSE_RESTAURANT',
    'GERANT_RESTAURANT': 'CAISSE_RESTAURANT',
    'serveur': 'CAISSIER',
    'SERVEUR': 'CAISSIER',
    'gerant_pharmacie': 'CAISSIER',
    'GERANT_PHARMACIE': 'CAISSIER',
    'pharmacien': 'CAISSIER',
    'PHARMACIEN': 'CAISSIER',
  };

  const users = usersRaw
    .filter((user) => {
      const roleStr = String(user.role).trim();
      const normalizedRole = roleMapping[roleStr] || roleStr.toUpperCase();
      return normalizedRole !== "ADMIN" && validRoles.has(normalizedRole);
    })
    .map((user) => {
      const roleStr = String(user.role).trim();
      const normalizedRole = roleMapping[roleStr] || roleStr.toUpperCase();
      return {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: normalizedRole,
        date_creation: user.date_creation?.toISOString() ?? null,
      };
    });

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const exists = await prisma.utilisateur.findUnique({ where: { email: parsed.data.email } });
    if (exists) {
      return NextResponse.json({ error: "Cette adresse email est déjà utilisée" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(parsed.data.mot_de_passe, 10);
    const user = await prisma.utilisateur.create({
      data: {
        nom: parsed.data.nom,
        email: parsed.data.email,
        mot_de_passe: hashedPassword,
        role: parsed.data.role as any,
      },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        date_creation: true,
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        date_creation: user.date_creation?.toISOString() ?? null,
      },
    });
  } catch (error: any) {
    console.error("[manager/users/POST]", error);
    return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
  }
}

