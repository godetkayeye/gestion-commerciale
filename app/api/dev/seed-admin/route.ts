import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { nom, email, password, role } = body ?? {};
    if (!email || !password || !nom) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    const exists = await prisma.utilisateur.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ ok: true, message: "Utilisateur déjà existant" });
    }
    const hashed = await hash(password, 10);
    const roleValues = [
      "ADMIN",
      "PHARMACIEN",
      "SERVEUR",
      "CAISSIER",
      "GERANT_RESTAURANT",
      "GERANT_PHARMACIE",
      "BAR",
      "LOCATION",
      "MANAGER_MULTI",
      "CAISSE_RESTAURANT",
      "CAISSE_BAR",
      "CAISSE_LOCATION",
      "CONSEIL_ADMINISTRATION",
      "SUPERVISEUR",
      "ECONOMAT",
    ] as const;
    type RoleType = (typeof roleValues)[number];
    const roleMap: Record<string, RoleType> = roleValues.reduce((acc, value) => {
      acc[value] = value;
      return acc;
    }, {} as Record<string, RoleType>);
    const normalize = (v: string | undefined): RoleType => {
      const key = (v ?? "ADMIN").toUpperCase();
      return roleMap[key] ?? "ADMIN";
    };
    const user = await prisma.utilisateur.create({
      data: {
        nom,
        email,
        mot_de_passe: hashed,
        role: normalize(role) as any,
      },
    });
    return NextResponse.json({ ok: true, id: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}


