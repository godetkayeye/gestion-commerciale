import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import RapportsCaisseClient from "./RapportsCaisseClient";

const allowed = new Set(["ADMIN", "CAISSE_RESTAURANT", "MANAGER_MULTI"]);

export default async function RapportsCaissePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Calculer les dates
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const finAujourdhui = new Date(aujourdhui);
  finAujourdhui.setHours(23, 59, 59, 999);

  const debutSemaine = new Date(aujourdhui);
  debutSemaine.setDate(aujourdhui.getDate() - aujourdhui.getDay()); // Dimanche de la semaine
  debutSemaine.setHours(0, 0, 0, 0);

  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

  // Récupérer les paiements
  const [paiementsJour, paiementsSemaine, paiementsMois, paiementsDetailJour] = await Promise.all([
    prisma.paiement.aggregate({
      _sum: { montant: true },
      _count: true,
      where: {
        module: "RESTAURANT" as any,
        date_paiement: {
          gte: aujourdhui,
          lte: finAujourdhui,
        },
      },
    }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      _count: true,
      where: {
        module: "RESTAURANT" as any,
        date_paiement: { gte: debutSemaine },
      },
    }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      _count: true,
      where: {
        module: "RESTAURANT" as any,
        date_paiement: { gte: debutMois },
      },
    }),
    // Utiliser une requête SQL brute pour éviter les problèmes avec l'enum Devise
    prisma.$queryRaw<Array<{
      id: number;
      module: string;
      reference_id: number;
      montant: any;
      mode_paiement: string;
      devise: string;
      caissier_id: number | null;
      date_paiement: Date | null;
    }>>`
      SELECT id, module, reference_id, montant, mode_paiement, 
             UPPER(devise) as devise, caissier_id, date_paiement
      FROM paiement
      WHERE module = 'restaurant'
        AND date_paiement >= ${aujourdhui}
        AND date_paiement <= ${finAujourdhui}
      ORDER BY date_paiement DESC
    `,
  ]);

  // Récupérer les caissiers séparément pour éviter les problèmes de type
  const paiementsDetailJourWithCaissiers = await Promise.all(
    paiementsDetailJour.map(async (paiement: any) => {
      const paiementData: any = { ...paiement };
      
      if (paiement.caissier_id) {
        try {
          paiementData.caissier = await prisma.utilisateur.findUnique({
            where: { id: paiement.caissier_id },
            select: { id: true, nom: true, email: true },
          });
        } catch (e) {
          console.error("Erreur lors de la récupération du caissier:", e);
        }
      }
      
      return paiementData;
    })
  );

  // Pour chaque paiement, récupérer les détails de la commande (plats + boissons)
  const paiementsWithDetails = await Promise.all(
    paiementsDetailJourWithCaissiers.map(async (paiement) => {
      if (!paiement.reference_id) {
        return { ...paiement, commandeDetails: null, totalCommande: 0 };
      }

      try {
        // Récupérer la commande avec ses détails (plats)
        const commande = await prisma.commande.findUnique({
          where: { id: paiement.reference_id },
          include: {
            details: {
              include: {
                repas: true,
              },
            },
          },
        });

        if (!commande) {
          return { ...paiement, commandeDetails: null, totalCommande: 0 };
        }

        // Récupérer les boissons depuis les commandes bar liées
        let boissons: any[] = [];
        let totalBoissons = 0;
        
        try {
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
          
          commandesBar.forEach((cmdBar: any) => {
            if (cmdBar.details && Array.isArray(cmdBar.details)) {
              boissons.push(...cmdBar.details);
              cmdBar.details.forEach((detail: any) => {
                const prixTotal = Number(detail.prix_total || 0);
                totalBoissons += prixTotal;
              });
            }
          });
        } catch (e) {
          console.log("Erreur lors de la récupération des boissons pour commande", commande.id, e);
        }

        // Calculer le total réel des plats
        let totalPlats = 0;
        if (commande.details && Array.isArray(commande.details)) {
          commande.details.forEach((detail: any) => {
            const prixTotal = Number(detail.prix_total || 0);
            totalPlats += prixTotal;
          });
        }

        // Total combiné
        const totalCommande = totalPlats + totalBoissons;

        return {
          ...paiement,
          commandeDetails: {
            ...commande,
            boissons,
          },
          totalCommande,
        };
      } catch (e) {
        console.log("Erreur lors de la récupération des détails de la commande", paiement.reference_id, e);
        return { ...paiement, commandeDetails: null, totalCommande: 0 };
      }
    })
  );

  // Convertir les objets Decimal en nombres et normaliser les dates
  const paiementsDetailJourConverted = convertDecimalToNumber(paiementsWithDetails).map((p: any) => {
    // Convertir la date MySQL en format utilisable si nécessaire
    let datePaiement = p.date_paiement;
    if (datePaiement && typeof datePaiement === 'string' && datePaiement.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
      // Format MySQL 'YYYY-MM-DD HH:MM:SS' - convertir en ISO
      datePaiement = datePaiement.replace(' ', 'T') + 'Z';
    }
    return {
      ...p,
      date_paiement: datePaiement,
    };
  });

  return (
    <RapportsCaisseClient
      totalJour={Number(paiementsJour._sum.montant ?? 0)}
      countJour={paiementsJour._count}
      totalSemaine={Number(paiementsSemaine._sum.montant ?? 0)}
      countSemaine={paiementsSemaine._count}
      totalMois={Number(paiementsMois._sum.montant ?? 0)}
      countMois={paiementsMois._count}
      paiementsDetailJour={paiementsDetailJourConverted}
    />
  );
}

