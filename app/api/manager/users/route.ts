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
    
    // Normaliser le rôle AVANT la validation Zod pour s'assurer qu'il est en majuscules
    if (body.role && typeof body.role === 'string') {
      body.role = body.role.trim().toUpperCase();
    }
    
    const parsed = CreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const exists = await prisma.utilisateur.findUnique({ where: { email: parsed.data.email } });
    if (exists) {
      return NextResponse.json({ error: "Cette adresse email est déjà utilisée" }, { status: 400 });
    }

    // Le rôle est déjà normalisé en majuscules grâce à la normalisation avant Zod
    // Mais on s'assure quand même qu'il est valide
    const normalizedRole: string = String(parsed.data.role || "").trim().toUpperCase();
    
    // Vérifier que le rôle normalisé est valide
    const validRoles = ["ADMIN", "MANAGER", "MANAGER_MULTI", "CAISSIER", "CAISSE_RESTAURANT", "CAISSE_BAR", "ECONOMAT", "MAGASINIER", "LOCATION", "CAISSE_PHARMACIE", "PHARMACIE", "STOCK", "OTHER", "CONSEIL_ADMINISTRATION", "SUPERVISEUR", "CAISSE_LOCATION"];
    if (!validRoles.includes(normalizedRole)) {
      console.error("[manager/users/POST] Rôle invalide:", { original: body.role, parsed: parsed.data.role, normalized: normalizedRole });
      return NextResponse.json({ 
        error: "Rôle invalide", 
        details: `Le rôle "${body.role}" (normalisé: "${normalizedRole}") n'est pas valide. Rôles acceptés: ${validRoles.join(", ")}` 
      }, { status: 400 });
    }
    
    // Mapper les rôles Prisma (majuscules) vers les valeurs MySQL (minuscules)
    const roleMapping: Record<string, string> = {
      'ADMIN': 'admin',
      'MANAGER': 'manager_multi',
      'MANAGER_MULTI': 'manager_multi',
      'CAISSIER': 'caissier',
      'CAISSE_RESTAURANT': 'caisse_restaurant',
      'CAISSE_BAR': 'caisse_bar',
      'ECONOMAT': 'economat',
      'MAGASINIER': 'magasinier',
      'LOCATION': 'location',
      'CAISSE_PHARMACIE': 'caisse',
      'PHARMACIE': 'pharmacien',
      'STOCK': 'stock',
      'OTHER': 'other',
      'CONSEIL_ADMINISTRATION': 'conseil_administration',
      'SUPERVISEUR': 'superviseur',
      'CAISSE_LOCATION': 'caisse_location',
    };
    
    const dbRole = roleMapping[normalizedRole] || normalizedRole.toLowerCase();
    console.log("[manager/users/POST] Rôle mappé:", { original: body.role, normalized: normalizedRole, dbRole });

    const hashedPassword = await bcrypt.hash(parsed.data.mot_de_passe, 10);
    
    // Utiliser une requête SQL brute pour insérer avec le rôle en minuscules
    await prisma.$executeRaw`
      INSERT INTO utilisateur (nom, email, mot_de_passe, role, date_creation)
      VALUES (${parsed.data.nom}, ${parsed.data.email}, ${hashedPassword}, ${dbRole}, NOW())
    `;
    
    // Récupérer l'utilisateur créé
    const user = await prisma.$queryRaw<Array<{ id: number; nom: string; email: string; role: string; date_creation: Date | null }>>`
      SELECT id, nom, email, role, date_creation
      FROM utilisateur
      WHERE email = ${parsed.data.email}
      LIMIT 1
    `;
    
    if (!user || user.length === 0) {
      throw new Error("Erreur lors de la création de l'utilisateur");
    }
    
    // Normaliser le rôle de la base de données vers le format Prisma (majuscules)
    const userRole = String(user[0].role).toUpperCase();
    const normalizedUser = {
      id: user[0].id,
      nom: user[0].nom,
      email: user[0].email,
      role: userRole,
      date_creation: user[0].date_creation?.toISOString() ?? null,
    };

    return NextResponse.json({
      user: normalizedUser,
    });
  } catch (error: any) {
    console.error("[manager/users/POST]", error);
    
    // Messages d'erreur plus descriptifs selon le type d'erreur
    let errorMessage = "Erreur serveur";
    if (error.code === "P2002") {
      errorMessage = "Cette adresse email est déjà utilisée";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      error: errorMessage, 
      details: error.message || "Erreur inconnue lors de la création de l'utilisateur" 
    }, { status: 500 });
  }
}

