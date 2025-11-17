import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import BarDashboardClient from "./BarDashboardClient";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSIER", "BAR", "MANAGER_MULTI"]);

export default async function BarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Calculer les dates pour les filtres
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const semainePassee = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

  const [recettesJour, recettesSemaine, recettesMois, commandesRecentesRaw, boissonsStockBasRaw, commandesEnCours, totalBoissons, commandesValideesMois, facturesMois] = await Promise.all([
    prisma.factures.aggregate({ _sum: { total: true }, where: { date_facture: { gte: aujourdhui } } }),
    prisma.factures.aggregate({ _sum: { total: true }, where: { date_facture: { gte: semainePassee } } }),
    prisma.factures.aggregate({ _sum: { total: true }, where: { date_facture: { gte: debutMois } } }),
    prisma.commandes_bar.findMany({ orderBy: { date_commande: "desc" }, take: 5, include: { table: true, serveur: true, details: { include: { boisson: true } } } }),
    prisma.boissons.findMany({ where: { stock: { lte: 5 } }, take: 5 }),
    prisma.commandes_bar.count({ where: { status: "EN_COURS" as any } }),
    prisma.boissons.count(),
    prisma.commandes_bar.count({ where: { status: "VALIDEE" as any, date_commande: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    prisma.factures.count({ where: { date_facture: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
  ]);

  // Convertir les objets Decimal en nombres pour les composants clients
  const commandesRecentes = convertDecimalToNumber(commandesRecentesRaw);
  const boissonsStockBas = convertDecimalToNumber(boissonsStockBasRaw);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">BLACK & WHITE — Tableau de bord</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Recettes (jour)</div>
          <div className="mt-1 text-2xl font-semibold text-blue-700">{Number(recettesJour._sum.total ?? 0).toFixed(2)} FC</div>
          <div className="text-xs text-gray-400 mt-1">Chiffres en Franc Congolais</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Recettes (semaine)</div>
          <div className="mt-1 text-2xl font-semibold text-blue-700">{Number(recettesSemaine._sum.total ?? 0).toFixed(2)} FC</div>
          <div className="text-xs text-gray-400 mt-1">Chiffres en Franc Congolais</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Recettes (mois)</div>
          <div className="mt-1 text-2xl font-semibold text-blue-700">{Number(recettesMois._sum.total ?? 0).toFixed(2)} FC</div>
          <div className="text-xs text-gray-400 mt-1">Chiffres en Franc Congolais</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Commandes en cours</div>
          <div className="mt-1 text-2xl font-semibold text-orange-600">{commandesEnCours}</div>
          <div className="text-xs text-gray-400 mt-1">En attente de validation</div>
        </div>
      </div>

      <BarDashboardClient
        commandesRecentes={commandesRecentes}
        boissonsStockBas={boissonsStockBas}
        totalBoissons={totalBoissons}
        commandesValideesMois={commandesValideesMois}
        facturesMois={facturesMois}
      />
    </div>
  );
}

