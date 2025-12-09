import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { ROLE_VALUES } from "@/lib/roles";

const CreateSchema = z.object({
  nom: z.string().min(2),
  email: z.string().email(),
  mot_de_passe: z.string().min(6),
  role: z.enum(ROLE_VALUES),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  let body: any = null;
  let parsed: any = null;

  try {
    body = await req.json();
    
    // Normaliser le rôle AVANT la validation Zod pour s'assurer qu'il est en majuscules
    if (body.role && typeof body.role === 'string') {
      body.role = body.role.trim().toUpperCase();
    }
    
    parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    // Check if email already exists
    const exists = await prisma.utilisateur.findUnique({ where: { email: parsed.data.email } });
    if (exists) {
      return NextResponse.json({ error: "Cette adresse email est déjà utilisée" }, { status: 400 });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(parsed.data.mot_de_passe, 10);
    
    // Le rôle est déjà normalisé en majuscules grâce à la normalisation avant Zod
    // Mais on s'assure quand même qu'il est valide
    const normalizedRole: string = String(parsed.data.role || "").trim().toUpperCase();
    
    // Vérifier que le rôle normalisé est valide
    const validRoles = ["ADMIN", "MANAGER", "MANAGER_MULTI", "CAISSIER", "CAISSE_RESTAURANT", "CAISSE_BAR", "ECONOMAT", "MAGASINIER", "LOCATION", "CAISSE_PHARMACIE", "PHARMACIE", "STOCK", "OTHER", "CONSEIL_ADMINISTRATION", "SUPERVISEUR", "CAISSE_LOCATION"];
    if (!validRoles.includes(normalizedRole)) {
      console.error("[admin/users/POST] Rôle invalide:", { original: body.role, parsed: parsed.data.role, normalized: normalizedRole });
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
    console.log("[admin/users/POST] Rôle mappé:", { original: body.role, normalized: normalizedRole, dbRole });
    
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

    return NextResponse.json(
      normalizedUser,
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[admin/users/POST]", error);
    const message = error instanceof Error ? error.message : String(error);
    
    // Vérifier si c'est une erreur liée au rôle (enum invalide)
    if (message.includes("enum") || message.includes("Invalid value") || message.includes("Unknown argument") || message.includes("Data truncated")) {
      const roleAttempted = parsed?.data?.role || body?.role || "inconnu";
      return NextResponse.json(
        { 
          error: "Rôle invalide", 
          details: `Le rôle "${roleAttempted}" n'est pas reconnu par la base de données. Assurez-vous que la base de données a été mise à jour avec le script SQL pour ajouter les nouveaux rôles (manager_multi, caisse_restaurant, caisse_bar, caisse_location).`,
          message 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Erreur serveur", details: message },
      { status: 500 }
    );
  }
}