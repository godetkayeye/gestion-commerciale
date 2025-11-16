import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import ManagerDashboardClient from "./ManagerDashboardClient";

const allowed = new Set(["ADMIN", "MANAGER_MULTI"]);

export default async function ManagerPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Calculer les dates pour les filtres
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const semainePassee = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

  // Données Bar/Terrasse
  const [recettesBarJour, recettesBarSemaine, recettesBarMois, commandesBarRecentesRaw, boissonsStockBasRaw, commandesBarEnCours, totalBoissons, commandesBarValideesMois, facturesBarMois] = await Promise.all([
    prisma.factures.aggregate({ _sum: { total: true }, where: { date_facture: { gte: aujourdhui } } }),
    prisma.factures.aggregate({ _sum: { total: true }, where: { date_facture: { gte: semainePassee } } }),
    prisma.factures.aggregate({ _sum: { total: true }, where: { date_facture: { gte: debutMois } } }),
    prisma.commandes_bar.findMany({ orderBy: { date_commande: "desc" }, take: 5, include: { table: true, serveur: true, details: { include: { boisson: true } } } }),
    prisma.boissons.findMany({ where: { stock: { lte: 5 } }, take: 5 }),
    prisma.commandes_bar.count({ where: { status: "EN_COURS" as any } }),
    prisma.boissons.count(),
    prisma.commandes_bar.count({ where: { status: "VALIDEE" as any, date_commande: { gte: debutMois } } }),
    prisma.factures.count({ where: { date_facture: { gte: debutMois } } }),
  ]);

  // Données Restaurant
  const [recettesRestaurantJour, recettesRestaurantSemaine, recettesRestaurantMois, commandesRestaurantRecentesRaw, commandesRestaurantEnCours] = await Promise.all([
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT", date_paiement: { gte: aujourdhui } } }),
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT", date_paiement: { gte: semainePassee } } }),
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT", date_paiement: { gte: debutMois } } }),
    prisma.commande.findMany({ orderBy: { date_commande: "desc" }, take: 5, include: { details: { include: { repas: true } } } }),
    prisma.commande.count({ where: { statut: { in: ["EN_ATTENTE", "EN_PREPARATION"] as any } } }),
  ]);

  // Données Location
  const [biensLibres, biensOccupes, biensMaintenance, loyersLocationJour, loyersLocationMois, paiementsRecentsRaw, contratsActifs, locatairesEnRetardRaw, loyersImpayesRaw] = await Promise.all([
    prisma.biens.count({ where: { etat: "LIBRE" as any } }),
    prisma.biens.count({ where: { etat: "OCCUPE" as any } }),
    prisma.biens.count({ where: { etat: "MAINTENANCE" as any } }),
    prisma.paiements_location.aggregate({ _sum: { montant: true }, where: { date_paiement: { gte: aujourdhui } } }),
    prisma.paiements_location.aggregate({ _sum: { montant: true }, where: { date_paiement: { gte: debutMois } } }),
    prisma.paiements_location.findMany({ orderBy: { date_paiement: "desc" }, take: 5, include: { contrat: { include: { bien: true, locataire: true } } } }),
    prisma.contrats.count({ where: { statut: "ACTIF" as any } }),
    prisma.paiements_location.findMany({ where: { penalite: { gt: 0 } }, include: { contrat: { include: { locataire: true, bien: true } } }, orderBy: { penalite: "desc" }, take: 5 }),
    prisma.paiements_location.aggregate({ _sum: { reste_du: true } }),
  ]);

  const totalBiens = biensLibres + biensOccupes + biensMaintenance;
  const tauxOccupation = totalBiens > 0 ? ((biensOccupes / totalBiens) * 100).toFixed(1) : "0";
  const loyersImpayes = Number(loyersImpayesRaw._sum.reste_du ?? 0);

  // Convertir les objets Decimal en nombres pour les composants clients
  const commandesBarRecentes = convertDecimalToNumber(commandesBarRecentesRaw);
  const boissonsStockBas = convertDecimalToNumber(boissonsStockBasRaw);
  const commandesRestaurantRecentes = convertDecimalToNumber(commandesRestaurantRecentesRaw);
  const paiementsRecents = convertDecimalToNumber(paiementsRecentsRaw);
  const locatairesEnRetard = convertDecimalToNumber(locatairesEnRetardRaw);

  // Calculer les totaux globaux
  const recettesTotalJour = Number(recettesBarJour._sum.total ?? 0) + Number(recettesRestaurantJour._sum.montant ?? 0) + Number(loyersLocationJour._sum.montant ?? 0);
  const recettesTotalSemaine = Number(recettesBarSemaine._sum.total ?? 0) + Number(recettesRestaurantSemaine._sum.montant ?? 0);
  const recettesTotalMois = Number(recettesBarMois._sum.total ?? 0) + Number(recettesRestaurantMois._sum.montant ?? 0) + Number(loyersLocationMois._sum.montant ?? 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Manager Multi — Tableau de bord</h1>
      
      {/* KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Recettes totales (jour)</div>
          <div className="mt-1 text-2xl font-semibold text-blue-700">{recettesTotalJour.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</div>
          <div className="text-xs text-gray-400 mt-1">Tous modules confondus</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Recettes totales (semaine)</div>
          <div className="mt-1 text-2xl font-semibold text-green-700">{recettesTotalSemaine.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</div>
          <div className="text-xs text-gray-400 mt-1">Tous modules confondus</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Recettes totales (mois)</div>
          <div className="mt-1 text-2xl font-semibold text-purple-700">{recettesTotalMois.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</div>
          <div className="text-xs text-gray-400 mt-1">Tous modules confondus</div>
        </div>
      </div>

      <ManagerDashboardClient
        // Bar/Terrasse
        recettesBarJour={Number(recettesBarJour._sum.total ?? 0)}
        recettesBarSemaine={Number(recettesBarSemaine._sum.total ?? 0)}
        recettesBarMois={Number(recettesBarMois._sum.total ?? 0)}
        commandesBarRecentes={commandesBarRecentes}
        boissonsStockBas={boissonsStockBas}
        commandesBarEnCours={commandesBarEnCours}
        totalBoissons={totalBoissons}
        commandesBarValideesMois={commandesBarValideesMois}
        facturesBarMois={facturesBarMois}
        // Restaurant
        recettesRestaurantJour={Number(recettesRestaurantJour._sum.montant ?? 0)}
        recettesRestaurantSemaine={Number(recettesRestaurantSemaine._sum.montant ?? 0)}
        recettesRestaurantMois={Number(recettesRestaurantMois._sum.montant ?? 0)}
        commandesRestaurantRecentes={commandesRestaurantRecentes}
        commandesRestaurantEnCours={commandesRestaurantEnCours}
        // Location
        biensLibres={biensLibres}
        biensOccupes={biensOccupes}
        biensMaintenance={biensMaintenance}
        tauxOccupation={tauxOccupation}
        loyersLocationJour={Number(loyersLocationJour._sum.montant ?? 0)}
        loyersLocationMois={Number(loyersLocationMois._sum.montant ?? 0)}
        paiementsRecents={paiementsRecents}
        locatairesEnRetard={locatairesEnRetard}
        totalBiens={totalBiens}
        contratsActifs={contratsActifs}
        loyersImpayes={loyersImpayes}
      />
    </div>
  );
}

