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
    
    // Normaliser le rôle en majuscules pour correspondre à l'enum Prisma
    const normalizedRole = parsed.data.role.toUpperCase() as any;
    
    const user = await prisma.utilisateur.create({
      data: {
        nom: parsed.data.nom,
        email: parsed.data.email,
        mot_de_passe: hashedPassword,
        role: normalizedRole,
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