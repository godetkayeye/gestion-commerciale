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
    prisma.paiement.findMany({
      where: {
        module: "RESTAURANT" as any,
        date_paiement: {
          gte: aujourdhui,
          lte: finAujourdhui,
        },
      },
      orderBy: { date_paiement: "desc" },
    }),
  ]);

  // Convertir les objets Decimal en nombres
  const paiementsDetailJourConverted = convertDecimalToNumber(paiementsDetailJour);

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

