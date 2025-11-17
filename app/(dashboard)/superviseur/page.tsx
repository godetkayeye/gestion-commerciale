import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import SuperviseurClient from "./SuperviseurClient";

const allowed = new Set(["ADMIN", "SUPERVISEUR", "MANAGER_MULTI"]);

export default async function SuperviseurPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Récupérer les commandes en cours (Bar et Restaurant)
  const [commandesBarRaw, commandesRestaurantRaw, boissonsRaw, mouvementsRaw] = await Promise.all([
    prisma.commandes_bar.findMany({
      where: { status: { in: ["EN_COURS", "VALIDEE"] as any } },
      orderBy: { date_commande: "desc" },
      include: { table: true, serveur: true, details: { include: { boisson: true } } },
      take: 50,
    }),
    prisma.commande.findMany({
      where: { statut: { in: ["EN_ATTENTE", "EN_PREPARATION", "SERVI"] as any } },
      orderBy: { date_commande: "desc" },
      include: { details: { include: { repas: true } } },
      take: 50,
    }),
    prisma.boissons.findMany({
      orderBy: { nom: "asc" },
      include: { categorie: true },
      take: 500,
    }),
    prisma.mouvements_stock.findMany({
      orderBy: { date_mouvement: "desc" },
      include: { boisson: true },
      take: 100,
    }),
  ]);

  const commandesBar = convertDecimalToNumber(commandesBarRaw);
  const commandesRestaurant = convertDecimalToNumber(commandesRestaurantRaw);
  const boissons = convertDecimalToNumber(boissonsRaw);
  const mouvements = convertDecimalToNumber(mouvementsRaw);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Superviseur — Tableau de bord</h1>
      </div>

      <SuperviseurClient
        commandesBar={commandesBar}
        commandesRestaurant={commandesRestaurant}
        boissons={boissons}
        mouvements={mouvements}
        userRole={session.user?.role || ""}
      />
    </div>
  );
}

