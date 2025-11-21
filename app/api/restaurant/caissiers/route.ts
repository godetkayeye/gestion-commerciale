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
  const caissiers = await prisma.utilisateur.findMany({
    where: {
      role: {
        in: ["CAISSIER", "CAISSE_RESTAURANT"] as any[],
      },
    },
    select: {
      id: true,
      nom: true,
      email: true,
      role: true,
    },
    orderBy: {
      nom: "asc",
    },
  });

  return NextResponse.json(caissiers);
}


