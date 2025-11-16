import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import Link from "next/link";
import CaisseLocationClient from "./CaisseLocationClient";

const allowed = new Set(["ADMIN", "CAISSE_LOCATION", "MANAGER_MULTI"]);

export default async function CaisseLocationPage() {
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
    contratsEnAttenteRaw,
    paiementsAujourdhuiRaw,
    recettesJour,
    recettesSemaine,
    recettesMois,
    contratsEnAttenteCount,
    paiementsAujourdhuiCount,
  ] = await Promise.all([
    prisma.contrats.findMany({
      where: {
        statut: { in: ["EN_ATTENTE", "ACTIF"] as any },
      },
      orderBy: { date_debut: "desc" },
      include: {
        bien: true,
        locataire: true,
      },
      take: 50,
    }),
    prisma.paiements_location.findMany({
      where: {
        date_paiement: {
          gte: aujourdhui,
          lte: finAujourdhui,
        },
      },
      orderBy: { date_paiement: "desc" },
      include: {
        contrat: {
          include: {
            bien: true,
            locataire: true,
          },
        },
      },
      take: 20,
    }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: {
        date_paiement: { gte: aujourdhui, lte: finAujourdhui },
      },
    }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: {
        date_paiement: { gte: semainePassee },
      },
    }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: {
        date_paiement: { gte: debutMois },
      },
    }),
    prisma.contrats.count({
      where: {
        statut: { in: ["EN_ATTENTE", "ACTIF"] as any },
      },
    }),
    prisma.paiements_location.count({
      where: {
        date_paiement: { gte: aujourdhui, lte: finAujourdhui },
      },
    }),
  ]);

  // Calculer les totaux
  const totalAujourdhui = Number(recettesJour._sum.montant ?? 0);

  const contratsEnAttente = convertDecimalToNumber(contratsEnAttenteRaw);
  const paiementsAujourdhui = convertDecimalToNumber(paiementsAujourdhuiRaw);

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et boutons */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Caisse Location — Tableau de bord</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/caisse/location/rapports"
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
            {Number(recettesSemaine._sum.montant ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Recettes — Ce mois</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-blue-700 break-words">
            {Number(recettesMois._sum.montant ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
          </div>
        </div>
      </div>

      <CaisseLocationClient
        contratsEnAttente={contratsEnAttente}
        paiementsAujourdhui={paiementsAujourdhui}
        totalAujourdhui={totalAujourdhui}
        contratsEnAttenteCount={contratsEnAttenteCount}
        paiementsAujourdhuiCount={paiementsAujourdhuiCount}
      />
    </div>
  );
}

