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

  // Récupérer tous les utilisateurs avec les rôles de caissier
  // Utiliser une requête SQL brute pour éviter les erreurs avec les rôles invalides
  const caissiersRaw = await prisma.$queryRaw<Array<{ id: number; nom: string; email: string; role: string }>>`
    SELECT id, nom, email, role
    FROM utilisateur
    WHERE role IN ('caissier', 'caisse_restaurant', 'CAISSIER', 'CAISSE_RESTAURANT', 'serveur', 'SERVEUR')
    ORDER BY nom ASC
  `;

  // Normaliser les rôles et filtrer
  const caissiers = caissiersRaw
    .filter((u) => {
      const role = String(u.role).trim().toUpperCase();
      return role === 'CAISSIER' || role === 'CAISSE_RESTAURANT';
    })
    .map((u) => ({
      id: u.id,
      nom: u.nom,
      email: u.email,
      role: String(u.role).trim().toUpperCase(),
    }));

  return NextResponse.json(caissiers);
}


