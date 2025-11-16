import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import CommandesClient from "./CommandesClient";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI"]);

export default async function CommandesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

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
      include: { details: { include: { repas: true } } }
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
  const commandes = convertDecimalToNumber(commandesRaw);

  return (
    <CommandesClient
      initial={commandes}
      commandesAujourdhui={commandesAujourdhui}
      pourcentageChangement={pourcentageChangement}
      commandesEnAttente={commandesEnAttente}
      commandesEnPreparation={commandesEnPreparation}
      totalVentes={totalVentes}
    />
  );
}


