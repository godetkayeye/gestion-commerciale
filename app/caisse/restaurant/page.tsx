import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import Link from "next/link";
import CaisseRestaurantClient from "./CaisseRestaurantClient";

const allowed = new Set(["ADMIN", "CAISSE_RESTAURANT", "MANAGER_MULTI"]);
const TAUX_CHANGE = 2200;

export default async function CaisseRestaurantPage() {
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
    paiementsAujourdhuiRaw,
    recettesJour,
    recettesSemaine,
    recettesMois,
    commandesEnAttenteCount,
    paiementsAujourdhuiCount,
  ] = await Promise.all([
    prisma.commande.findMany({
      where: {
        statut: { in: ["EN_ATTENTE", "EN_PREPARATION", "SERVI"] as any },
      },
      orderBy: { date_commande: "desc" },
      include: {
        details: {
          include: {
            repas: true,
          },
        },
      },
      take: 50,
    }),
    prisma.paiement.findMany({
      where: {
        module: "RESTAURANT" as any,
        date_paiement: {
          gte: aujourdhui,
          lte: finAujourdhui,
        },
      },
      orderBy: { date_paiement: "desc" },
      take: 20,
    }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: {
        module: "RESTAURANT" as any,
        date_paiement: { gte: aujourdhui, lte: finAujourdhui },
      },
    }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: {
        module: "RESTAURANT" as any,
        date_paiement: { gte: semainePassee },
      },
    }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: {
        module: "RESTAURANT" as any,
        date_paiement: { gte: debutMois },
      },
    }),
    prisma.commande.count({
      where: {
        statut: { in: ["EN_ATTENTE", "EN_PREPARATION", "SERVI"] as any },
      },
    }),
    prisma.paiement.count({
      where: {
        module: "RESTAURANT" as any,
        date_paiement: { gte: aujourdhui, lte: finAujourdhui },
      },
    }),
  ]);

  // Calculer les totaux
  const totalAujourdhui = Number(recettesJour._sum.montant ?? 0);

  // Récupérer les boissons pour chaque commande et calculer le total combiné
  const commandesWithBoissons = await Promise.all(
    commandesEnAttenteRaw.map(async (commande) => {
      let boissons: any[] = [];
      let totalBoissons = 0;
      
      try {
        // Récupérer les commandes bar liées à cette commande restaurant
        const commandesBar = await prisma.commandes_bar.findMany({
          where: { commande_restaurant_id: commande.id } as any,
          include: {
            details: {
              include: {
                boisson: true,
              },
            },
          },
        });
        
        // Extraire toutes les boissons de toutes les commandes bar liées
        // et calculer le total des boissons
        commandesBar.forEach((cmdBar: any) => {
          if (cmdBar.details && Array.isArray(cmdBar.details)) {
            boissons.push(...cmdBar.details);
            // Calculer le total des boissons
            cmdBar.details.forEach((detail: any) => {
              const prixTotal = Number(detail.prix_total || 0);
              totalBoissons += prixTotal;
            });
          }
        });
      } catch (e) {
        console.log("Erreur lors de la récupération des boissons pour commande", commande.id, e);
      }
      
      // Calculer le total réel des plats depuis les détails
      let totalPlats = 0;
      if (commande.details && Array.isArray(commande.details)) {
        commande.details.forEach((detail: any) => {
          const prixTotal = Number(detail.prix_total || 0);
          totalPlats += prixTotal;
        });
      }
      
      // Calculer le total combiné (plats + boissons) à partir des détails réels
      const totalCombined = totalPlats + totalBoissons;
      
      return {
        ...commande,
        total: totalCombined, // Remplacer le total par le total combiné calculé depuis les détails
        boissons,
      };
    })
  );

  const commandesEnAttente = convertDecimalToNumber(commandesWithBoissons);
  const paiementsAujourdhui = convertDecimalToNumber(paiementsAujourdhuiRaw);
  const formatUSD = (montantFC: number) =>
    `${(montantFC / TAUX_CHANGE).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et boutons */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Caisse VILAKAZI — Tableau de bord</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/caisse/restaurant/rapports"
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
            {formatUSD(totalAujourdhui)}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Recettes — Cette semaine</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-blue-700 break-words">
            {formatUSD(Number(recettesSemaine._sum.montant ?? 0))}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Recettes — Ce mois</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-blue-700 break-words">
            {formatUSD(Number(recettesMois._sum.montant ?? 0))}
          </div>
        </div>
      </div>

      <CaisseRestaurantClient
        commandesEnAttente={commandesEnAttente}
        paiementsAujourdhui={paiementsAujourdhui}
        totalAujourdhui={totalAujourdhui}
        commandesEnAttenteCount={commandesEnAttenteCount}
        paiementsAujourdhuiCount={paiementsAujourdhuiCount}
        tauxChange={TAUX_CHANGE}
      />
    </div>
  );
}

