import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import CommandesClient from "./CommandesClient";

const allowed = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI", "CONSEIL_ADMINISTRATION", "SUPERVISEUR"]);

export default async function CommandesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const currentUser = session.user?.email
    ? await prisma.utilisateur.findUnique({
        where: { email: session.user.email },
        select: { id: true, nom: true, email: true, role: true },
      })
    : null;

  // Calculer les dates
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const hier = new Date(aujourdhui);
  hier.setDate(hier.getDate() - 1);
  const finAujourdhui = new Date(aujourdhui);
  finAujourdhui.setHours(23, 59, 59, 999);

  // Récupérer les commandes
  const [commandesRaw, commandesAujourdhui, commandesHier, commandesEnAttente, commandesEnPreparation, totalVentesRaw] = await Promise.all([
    prisma.commande.findMany({ 
      orderBy: { date_commande: "desc" }, 
      take: 100,
      include: { 
        details: { include: { repas: true } },
        // Ne pas inclure boissons directement car la relation peut ne pas exister
      }
    }),
    prisma.commande.count({ 
      where: { 
        date_commande: { 
          gte: aujourdhui,
          lte: finAujourdhui
        } 
      } 
    }),
    prisma.commande.count({ 
      where: { 
        date_commande: { 
          gte: hier,
          lt: aujourdhui
        } 
      } 
    }),
    prisma.commande.count({ 
      where: { 
        statut: "EN_ATTENTE" as any,
        date_commande: { 
          gte: aujourdhui,
          lte: finAujourdhui
        }
      } 
    }),
    prisma.commande.count({ 
      where: { 
        statut: "EN_PREPARATION" as any,
        date_commande: { 
          gte: aujourdhui,
          lte: finAujourdhui
        }
      } 
    }),
    prisma.commande.aggregate({
      _sum: { total: true },
      where: {
        date_commande: {
          gte: aujourdhui,
          lte: finAujourdhui
        }
      }
    }),
  ]);

  // Calculer le pourcentage de changement
  const pourcentageChangement = commandesHier > 0 
    ? (((commandesAujourdhui - commandesHier) / commandesHier) * 100).toFixed(0)
    : commandesAujourdhui > 0 ? "100" : "0";

  const totalVentes = Number(totalVentesRaw._sum.total ?? 0);
  
  // Récupérer les boissons pour chaque commande depuis les commandes bar liées
  // et calculer le total combiné (plats + boissons) à partir des détails réels
  const commandesWithBoissons = await Promise.all(
    commandesRaw.map(async (commande) => {
      let boissons: any[] = [];
      let totalBoissons = 0;
      
      // Calculer le total réel des plats depuis les détails
      let totalPlats = 0;
      if (commande.details && Array.isArray(commande.details)) {
        commande.details.forEach((detail: any) => {
          const prixTotal = Number(detail.prix_total || 0);
          totalPlats += prixTotal;
        });
      }
      
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
      
      // Calculer le total combiné (plats + boissons) à partir des détails réels
      const totalCombined = totalPlats + totalBoissons;
      
      return {
        ...commande,
        total: totalCombined, // Remplacer le total par le total combiné calculé depuis les détails
        boissons,
      };
    })
  );
  
  const commandes = convertDecimalToNumber(commandesWithBoissons);

  return (
    <CommandesClient
      initial={commandes}
      commandesAujourdhui={commandesAujourdhui}
      pourcentageChangement={pourcentageChangement}
      commandesEnAttente={commandesEnAttente}
      commandesEnPreparation={commandesEnPreparation}
      totalVentes={totalVentes}
      currentUser={
        currentUser
          ? {
              id: currentUser.id,
              nom: currentUser.nom,
              email: currentUser.email,
              role: currentUser.role,
            }
          : null
      }
    />
  );
}


