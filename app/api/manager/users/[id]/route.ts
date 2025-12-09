import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ASSIGNABLE_ROLES } from "@/lib/roles";

const allowed = new Set(["ADMIN", "MANAGER_MULTI"]);

type RouteContext = { params: Promise<{ id: string }> };

function parseUserId(raw: string | string[] | undefined): number | null {
  if (!raw) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return null;
  return parsed;
}

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

export async function PUT(req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const params = await context.params;
  const userId = parseUserId(params?.id);
  if (!userId) {
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
    if (parsed.data.role) {
      // Normaliser le rôle en majuscules pour correspondre à l'enum Prisma
      let normalizedRole: string = String(parsed.data.role).trim().toUpperCase();
      
      // Vérifier que le rôle normalisé est valide
      const validRoles = ["ADMIN", "MANAGER", "MANAGER_MULTI", "CAISSIER", "CAISSE_RESTAURANT", "CAISSE_BAR", "ECONOMAT", "MAGASINIER", "LOCATION", "CAISSE_PHARMACIE", "PHARMACIE", "STOCK", "OTHER", "CONSEIL_ADMINISTRATION", "SUPERVISEUR", "CAISSE_LOCATION"];
      if (!validRoles.includes(normalizedRole)) {
        console.error("[manager/users/PUT] Rôle invalide:", { original: parsed.data.role, normalized: normalizedRole });
        return NextResponse.json({ 
          error: "Rôle invalide", 
          details: `Le rôle "${parsed.data.role}" (normalisé: "${normalizedRole}") n'est pas valide. Rôles acceptés: ${validRoles.join(", ")}` 
        }, { status: 400 });
      }
      
      data.role = normalizedRole as any;
    }
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

export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const params = await context.params;
  const userId = parseUserId(params?.id);
  if (!userId) {
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

