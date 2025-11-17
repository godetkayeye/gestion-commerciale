import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { compare } from "bcrypt";

const UpdateProfileSchema = z.object({
  currentEmail: z.string().email("Email actuel requis"),
  newEmail: z.string().email().optional(),
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères").optional(),
});

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const parsed = UpdateProfileSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur par email actuel
    const user = await prisma.utilisateur.findUnique({
      where: { email: parsed.data.currentEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Vérifier le mot de passe actuel
    let validPassword = false;
    try {
      validPassword = await compare(parsed.data.currentPassword, user.mot_de_passe);
    } catch (error) {
      // Tolérance DEV: si le mot de passe en base n'est pas hashé
      if (process.env.NODE_ENV !== "production" && parsed.data.currentPassword === user.mot_de_passe) {
        validPassword = true;
      }
    }

    if (!validPassword) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 401 }
      );
    }

    // Préparer les données à mettre à jour
    const updateData: { email?: string; mot_de_passe?: string } = {};

    // Mettre à jour l'email si fourni
    if (parsed.data.newEmail && parsed.data.newEmail !== user.email) {
      // Vérifier si le nouvel email n'est pas déjà utilisé
      const emailExists = await prisma.utilisateur.findUnique({
        where: { email: parsed.data.newEmail },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: "Cette adresse email est déjà utilisée" },
          { status: 400 }
        );
      }
      updateData.email = parsed.data.newEmail;
    }

    // Mettre à jour le mot de passe si fourni
    if (parsed.data.newPassword) {
      const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);
      updateData.mot_de_passe = hashedPassword;
    }

    // Si aucune modification n'est demandée
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucune modification à effectuer" },
        { status: 400 }
      );
    }

    // Mettre à jour l'utilisateur
    const updated = await prisma.utilisateur.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        date_creation: true,
      },
    });

    return NextResponse.json({
      message: "Profil mis à jour avec succès",
      user: updated,
    });
  } catch (error: any) {
    console.error("[user/profile/PUT]", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}

