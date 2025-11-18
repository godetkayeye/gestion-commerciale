import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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
    const normalize = (v: string | undefined): Prisma.$Enums.Role => {
      const key = (v ?? "ADMIN").toUpperCase();
      switch (key) {
        case "ADMIN":
          return "ADMIN";
        case "PHARMACIEN":
          return "PHARMACIEN";
        case "SERVEUR":
          return "SERVEUR";
        case "CAISSIER":
          return "CAISSIER";
        case "GERANT_RESTAURANT":
          return "GERANT_RESTAURANT";
        case "GERANT_PHARMACIE":
          return "GERANT_PHARMACIE";
        case "BAR":
          return "BAR";
        case "LOCATION":
          return "LOCATION";
        case "MANAGER_MULTI":
          return "MANAGER_MULTI";
        case "CAISSE_RESTAURANT":
          return "CAISSE_RESTAURANT";
        case "CAISSE_BAR":
          return "CAISSE_BAR";
        case "CAISSE_LOCATION":
          return "CAISSE_LOCATION";
        case "CONSEIL_ADMINISTRATION":
          return "CONSEIL_ADMINISTRATION";
        case "SUPERVISEUR":
          return "SUPERVISEUR";
        case "ECONOMAT":
          return "ECONOMAT";
        default:
          return "ADMIN";
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


