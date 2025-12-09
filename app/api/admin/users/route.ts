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
    
    console.log("[admin/users/POST] Rôle normalisé:", { original: body.role, normalized: normalizedRole });
    
    const user = await prisma.utilisateur.create({
      data: {
        nom: parsed.data.nom,
        email: parsed.data.email,
        mot_de_passe: hashedPassword,
        role: normalizedRole as any,
      },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        date_creation: true,
      },
    });

    return NextResponse.json(
      user,
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