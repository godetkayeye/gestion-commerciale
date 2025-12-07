import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI", "GERANT_RESTAURANT", "SERVEUR"]);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Récupérer tous les serveurs depuis la table personnel avec le rôle SERVEUR
  const serveurs = await prisma.personnel.findMany({
    where: {
      role: "SERVEUR",
    },
    orderBy: {
      nom: "asc",
    },
    select: {
      id: true,
      nom: true,
    },
  });

  // Adapter le format pour correspondre au type Serveur attendu (avec email vide car personnel n'a pas d'email)
  const serveursFormatted = serveurs.map((s) => ({
    id: s.id,
    nom: s.nom,
    email: "", // La table personnel n'a pas d'email, on met une chaîne vide
  }));

  return NextResponse.json(serveursFormatted);
}


