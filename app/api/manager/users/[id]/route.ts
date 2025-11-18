import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ASSIGNABLE_ROLES } from "@/lib/roles";

const allowed = new Set(["ADMIN", "MANAGER_MULTI"]);

const UpdateSchema = z
  .object({
    nom: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(MANAGER_ASSIGNABLE_ROLES).optional(),
    mot_de_passe: z.string().min(6).optional(),
  })
  .refine(
    (data) => data.nom || data.email || data.role || data.mot_de_passe,
    { message: "Aucune donnée à mettre à jour" },
  );

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const userId = Number(params.id);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const target = await prisma.utilisateur.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  if (target.role === "ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Action interdite" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const data: any = {};

    if (parsed.data.nom) data.nom = parsed.data.nom;
    if (parsed.data.email && parsed.data.email !== target.email) {
      const emailExists = await prisma.utilisateur.findUnique({ where: { email: parsed.data.email } });
      if (emailExists) {
        return NextResponse.json({ error: "Cette adresse email est déjà utilisée" }, { status: 400 });
      }
      data.email = parsed.data.email;
    }
    if (parsed.data.role) data.role = parsed.data.role as any;
    if (parsed.data.mot_de_passe) {
      data.mot_de_passe = await bcrypt.hash(parsed.data.mot_de_passe, 10);
    }

    const updated = await prisma.utilisateur.update({
      where: { id: userId },
      data,
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
        ...updated,
        date_creation: updated.date_creation?.toISOString() ?? null,
      },
    });
  } catch (error: any) {
    console.error("[manager/users/PUT]", error);
    return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const userId = Number(params.id);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const target = await prisma.utilisateur.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "Suppression interdite" }, { status: 403 });
  }

  try {
    await prisma.utilisateur.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[manager/users/DELETE]", error);
    return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
  }
}

