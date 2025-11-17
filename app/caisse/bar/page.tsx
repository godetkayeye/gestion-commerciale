import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import Link from "next/link";
import CaisseBarClient from "./CaisseBarClient";

const allowed = new Set(["ADMIN", "CAISSE_BAR", "MANAGER_MULTI"]);

export default async function CaisseBarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Calculer les dates pour les filtres
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const finAujourdhui = new Date(aujourdhui);
  finAujourdhui.setHours(23, 59, 59, 999);
  const semainePassee = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

  // Récupérer les données
  const [
    commandesEnAttenteRaw,
    facturesAujourdhuiRaw,
    recettesJour,
    recettesSemaine,
    recettesMois,
    commandesEnAttenteCount,
    facturesAujourdhuiCount,
  ] = await Promise.all([
    prisma.commandes_bar.findMany({
      where: {
        status: "EN_COURS" as any,
      },
      orderBy: { date_commande: "desc" },
      include: {
        details: {
          include: {
            boisson: true,
          },
        },
        table: true,
        serveur: true,
      },
      take: 50,
    }),
    prisma.factures.findMany({
      where: {
        date_facture: {
          gte: aujourdhui,
          lte: finAujourdhui,
        },
      },
      orderBy: { date_facture: "desc" },
      include: {
        commande: {
          include: {
            table: true,
            serveur: true,
          },
        },
      },
      take: 20,
    }),
    prisma.factures.aggregate({
      _sum: { total: true },
      where: {
        date_facture: { gte: aujourdhui, lte: finAujourdhui },
      },
    }),
    prisma.factures.aggregate({
      _sum: { total: true },
      where: {
        date_facture: { gte: semainePassee },
      },
    }),
    prisma.factures.aggregate({
      _sum: { total: true },
      where: {
        date_facture: { gte: debutMois },
      },
    }),
    prisma.commandes_bar.count({
      where: {
        status: "EN_COURS" as any,
      },
    }),
    prisma.factures.count({
      where: {
        date_facture: { gte: aujourdhui, lte: finAujourdhui },
      },
    }),
  ]);

  // Calculer les totaux
  const totalAujourdhui = Number(recettesJour._sum.total ?? 0);

  const commandesEnAttente = convertDecimalToNumber(commandesEnAttenteRaw);
  const facturesAujourdhui = convertDecimalToNumber(facturesAujourdhuiRaw);

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et boutons */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Caisse BLACK & WHITE — Tableau de bord</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/caisse/bar/rapports"
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-colors text-center"
          >
            Rapports financiers
          </Link>
        </div>
      </div>

      {/* KPIs - Recettes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Recettes — Aujourd'hui</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-blue-700 break-words">
            {totalAujourdhui.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Recettes — Cette semaine</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-blue-700 break-words">
            {Number(recettesSemaine._sum.total ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Recettes — Ce mois</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-blue-700 break-words">
            {Number(recettesMois._sum.total ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
          </div>
        </div>
      </div>

      <CaisseBarClient
        commandesEnAttente={commandesEnAttente}
        facturesAujourdhui={facturesAujourdhui}
        totalAujourdhui={totalAujourdhui}
        commandesEnAttenteCount={commandesEnAttenteCount}
        facturesAujourdhuiCount={facturesAujourdhuiCount}
      />
    </div>
  );
}

