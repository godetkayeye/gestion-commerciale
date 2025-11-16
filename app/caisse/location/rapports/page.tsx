import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import RapportsCaisseLocationClient from "./RapportsCaisseLocationClient";

const allowed = new Set(["ADMIN", "CAISSE_LOCATION", "MANAGER_MULTI"]);

export default async function RapportsCaisseLocationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Calculer les dates
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const finAujourdhui = new Date(aujourdhui);
  finAujourdhui.setHours(23, 59, 59, 999);
  const debutSemaine = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

  // Récupérer les paiements
  const [paiementsJour, paiementsSemaine, paiementsMois, paiementsDetailJour] = await Promise.all([
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      _count: true,
      where: {
        date_paiement: {
          gte: aujourdhui,
          lte: finAujourdhui,
        },
      },
    }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      _count: true,
      where: {
        date_paiement: { gte: debutSemaine },
      },
    }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      _count: true,
      where: {
        date_paiement: { gte: debutMois },
      },
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
    }),
  ]);

  // Convertir les objets Decimal en nombres
  const paiementsDetailJourConverted = convertDecimalToNumber(paiementsDetailJour);

  return (
    <RapportsCaisseLocationClient
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

