import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
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
    const normalize = (v: string | undefined): Role => {
      const key = (v ?? "ADMIN").toUpperCase();
      switch (key) {
        case "ADMIN":
          return Role.ADMIN;
        case "PHARMACIEN":
          return Role.PHARMACIEN;
        case "SERVEUR":
          return Role.SERVEUR;
        case "CAISSIER":
          return Role.CAISSIER;
        case "GERANT_RESTAURANT":
          return Role.GERANT_RESTAURANT;
        case "GERANT_PHARMACIE":
          return Role.GERANT_PHARMACIE;
        case "BAR":
          return Role.BAR;
        case "LOCATION":
          return Role.LOCATION;
        case "MANAGER_MULTI":
          return Role.MANAGER_MULTI;
        case "CAISSE_RESTAURANT":
          return Role.CAISSE_RESTAURANT;
        case "CAISSE_BAR":
          return Role.CAISSE_BAR;
        case "CAISSE_LOCATION":
          return Role.CAISSE_LOCATION;
        case "CONSEIL_ADMINISTRATION":
          return Role.CONSEIL_ADMINISTRATION;
        case "SUPERVISEUR":
          return Role.SUPERVISEUR;
        case "ECONOMAT":
          return Role.ECONOMAT;
        default:
          return Role.ADMIN;
      }
    };
    const user = await prisma.utilisateur.create({
      data: {
        nom,
        email,
        mot_de_passe: hashed,
        role: normalize(role),
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


