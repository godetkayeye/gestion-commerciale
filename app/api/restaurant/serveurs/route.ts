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
  // Utiliser une requête SQL brute pour éviter les erreurs avec les rôles invalides
  const serveursRaw = await prisma.$queryRaw<Array<{ id: number; nom: string; email: string; role: string }>>`
    SELECT id, nom, email, role
    FROM utilisateur
    WHERE role IN ('caisse_restaurant', 'caissier', 'CAISSE_RESTAURANT', 'CAISSIER', 'serveur', 'SERVEUR')
    ORDER BY nom ASC
  `;

  // Normaliser les rôles et filtrer
  const roleMapping: Record<string, string> = {
    'serveur': 'CAISSIER',
    'SERVEUR': 'CAISSIER',
  };

  const serveurs = serveursRaw
    .filter((u) => {
      const role = String(u.role).trim().toUpperCase();
      return role === 'CAISSE_RESTAURANT' || role === 'CAISSIER';
    })
    .map((u) => ({
      id: u.id,
      nom: u.nom,
      email: u.email,
    }));

  return NextResponse.json(serveurs);
}


