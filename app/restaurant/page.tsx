import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import Link from "next/link";
import RestaurantDashboardClient from "./RestaurantDashboardClient";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "CAISSIER", "SERVEUR", "MANAGER_MULTI"]);
const TAUX_CHANGE = 2200;

export default async function RestaurantPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Calculer les dates pour les filtres
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const semainePassee = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

  // Récupérer les données
  const [recettesJour, recettesSemaine, recettesMois, commandesRecentesRaw] = await Promise.all([
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT", date_paiement: { gte: aujourdhui } } }),
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT", date_paiement: { gte: semainePassee } } }),
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT", date_paiement: { gte: debutMois } } }),
    prisma.commande.findMany({ 
      orderBy: { date_commande: "desc" }, 
      take: 10, 
      include: { details: { include: { repas: true } } } 
    }),
  ]);

  // Récupérer les commandes payées/servies de cette semaine pour les plats les plus vendus
  const commandesSemaine = await prisma.commande.findMany({
    where: {
      date_commande: { gte: semainePassee },
      statut: { in: ["PAYE", "SERVI"] as any }
    },
    include: {
      details: {
        include: {
          repas: true
        }
      }
    }
  });

  // Récupérer les statuts des commandes d'aujourd'hui
  const [commandesValideesAujourdhui, commandesEnAttenteAujourdhui] = await Promise.all([
    prisma.commande.count({ where: { date_commande: { gte: aujourdhui }, statut: { in: ["PAYE", "SERVI"] as any } } }),
    prisma.commande.count({ where: { date_commande: { gte: aujourdhui }, statut: "EN_ATTENTE" as any } }),
  ]);

  // Récupérer les commandes du mois pour le top 3 des plats
  const commandesMois = await prisma.commande.findMany({
    where: {
      date_commande: { gte: debutMois },
      statut: { in: ["PAYE", "SERVI"] as any }
    },
    include: {
      details: {
        include: {
          repas: true
        }
      }
    }
  });

  // Grouper les plats vendus du mois
  const platsMoisMap = new Map<number, { id: number; nom: string; quantite_vendue: number }>();
  
  commandesMois.forEach(commande => {
    commande.details.forEach(detail => {
      if (detail.repas_id && detail.repas) {
        const repasId = detail.repas_id;
        const existing = platsMoisMap.get(repasId);
        if (existing) {
          existing.quantite_vendue += detail.quantite;
        } else {
          platsMoisMap.set(repasId, {
            id: repasId,
            nom: detail.repas.nom,
            quantite_vendue: detail.quantite,
          });
        }
      }
    });
  });

  // Top 3 des plats du mois
  const top3PlatsMois = Array.from(platsMoisMap.values())
    .sort((a, b) => b.quantite_vendue - a.quantite_vendue)
    .slice(0, 3);

  // Grouper les plats vendus manuellement
  const platsMap = new Map<number, { id: number; nom: string; quantite_vendue: number; total_ventes: number }>();
  
  commandesSemaine.forEach(commande => {
    commande.details.forEach(detail => {
      if (detail.repas_id && detail.repas) {
        const repasId = detail.repas_id;
        const existing = platsMap.get(repasId);
        if (existing) {
          existing.quantite_vendue += detail.quantite;
          existing.total_ventes += Number(detail.prix_total);
        } else {
          platsMap.set(repasId, {
            id: repasId,
            nom: detail.repas.nom,
            quantite_vendue: detail.quantite,
            total_ventes: Number(detail.prix_total),
          });
        }
      }
    });
  });

  // Trier par quantité vendue et prendre les 5 premiers
  const platsPlusVendus = Array.from(platsMap.values())
    .sort((a, b) => b.quantite_vendue - a.quantite_vendue)
    .slice(0, 5);

  // Convertir les objets Decimal en nombres
  const commandesRecentes = convertDecimalToNumber(commandesRecentesRaw);

  const formatUSD = (montantFC: number) =>
    `${(montantFC / TAUX_CHANGE).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et boutons */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">VILAKAZI — Tableau de bord</h1>
        <div className="flex flex-wrap gap-2">
          <Link 
            href="/restaurant/commandes/nouvelle" 
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-colors text-center"
          >
            Nouvelle commande
          </Link>
          <Link 
            href="/restaurant/commandes" 
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-colors text-center"
          >
            Voir commandes
          </Link>
          <Link 
            href="/restaurant/repas" 
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-colors text-center"
          >
            Gestion des plats
          </Link>
        </div>
      </div>

      {/* KPIs - Recettes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Recettes — Aujourd'hui</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-blue-700 break-words">{formatUSD(Number(recettesJour._sum.montant ?? 0))}</div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Recettes — Cette semaine</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-blue-700 break-words">{formatUSD(Number(recettesSemaine._sum.montant ?? 0))}</div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Recettes — Ce mois</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-blue-700 break-words">{formatUSD(Number(recettesMois._sum.montant ?? 0))}</div>
        </div>
      </div>

      <RestaurantDashboardClient
        commandesRecentes={commandesRecentes}
        platsPlusVendus={platsPlusVendus}
        commandesValideesAujourdhui={commandesValideesAujourdhui}
        commandesEnAttenteAujourdhui={commandesEnAttenteAujourdhui}
        top3PlatsMois={top3PlatsMois}
      />
    </div>
  );
}


