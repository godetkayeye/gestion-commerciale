import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const CreateSchema = z.object({
  nom: z.string().min(2),
  email: z.string().email(),
  mot_de_passe: z.string().min(6),
  role: z.enum([
    "ADMIN",
    "PHARMACIEN",
    "SERVEUR",
    "CAISSIER",
    "GERANT_RESTAURANT",
    "GERANT_PHARMACIE",
    "BAR",
    "LOCATION",
  ]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
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
    const user = await prisma.utilisateur.create({
      data: {
        nom: parsed.data.nom,
        email: parsed.data.email,
        mot_de_passe: hashedPassword,
        role: parsed.data.role,
      },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        date_creation: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("[admin/users/POST]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Erreur serveur", details: message },
      { status: 500 }
    );
  }
}