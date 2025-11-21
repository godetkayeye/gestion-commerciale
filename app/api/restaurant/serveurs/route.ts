import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI"]);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Récupérer tous les utilisateurs avec les rôles de serveur (CAISSE_RESTAURANT, CAISSIER)
  const serveurs = await prisma.utilisateur.findMany({
    where: {
      role: {
        in: ["CAISSE_RESTAURANT", "CAISSIER"] as any[],
      },
    },
    select: {
      id: true,
      nom: true,
      email: true,
    },
    orderBy: {
      nom: "asc",
    },
  });

  return NextResponse.json(serveurs);
}


