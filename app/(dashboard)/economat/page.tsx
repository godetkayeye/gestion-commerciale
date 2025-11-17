import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import EconomatClient from "./EconomatClient";

const allowed = new Set(["ADMIN", "ECONOMAT", "SUPERVISEUR", "MANAGER_MULTI"]);

export default async function EconomatPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Récupérer les boissons avec leurs stocks
  const boissonsRaw = await prisma.boissons.findMany({
    orderBy: { nom: "asc" },
    include: { categorie: true },
    take: 500,
  });

  // Récupérer les mouvements de stock récents
  const mouvementsRaw = await prisma.mouvements_stock.findMany({
    orderBy: { date_mouvement: "desc" },
    include: { boisson: true },
    take: 100,
  });

  const boissons = convertDecimalToNumber(boissonsRaw);
  const mouvements = convertDecimalToNumber(mouvementsRaw);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Économat — Gestion des stocks</h1>
      </div>

      <EconomatClient 
        boissons={boissons} 
        mouvements={mouvements}
        userRole={session.user?.role || ""}
      />
    </div>
  );
}

