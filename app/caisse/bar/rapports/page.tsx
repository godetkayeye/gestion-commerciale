import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import RapportsCaisseBarClient from "./RapportsCaisseBarClient";

const allowed = new Set(["ADMIN", "CAISSE_BAR", "MANAGER_MULTI"]);

export default async function RapportsCaisseBarPage() {
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

  // Récupérer les factures
  const [facturesJour, facturesSemaine, facturesMois, facturesDetailJour] = await Promise.all([
    prisma.factures.aggregate({
      _sum: { total: true },
      _count: true,
      where: {
        date_facture: {
          gte: aujourdhui,
          lte: finAujourdhui,
        },
      },
    }),
    prisma.factures.aggregate({
      _sum: { total: true },
      _count: true,
      where: {
        date_facture: { gte: debutSemaine },
      },
    }),
    prisma.factures.aggregate({
      _sum: { total: true },
      _count: true,
      where: {
        date_facture: { gte: debutMois },
      },
    }),
    prisma.factures.findMany({
      where: {
        date_facture: {
          gte: aujourdhui,
          lte: finAujourdhui,
        },
      },
      orderBy: { date_facture: "desc" },
      include: {
        commande: {
          include: {
            table: true,
            serveur: true,
          },
        },
      },
    }),
  ]);

  // Convertir les objets Decimal en nombres
  const facturesDetailJourConverted = convertDecimalToNumber(facturesDetailJour);

  return (
    <RapportsCaisseBarClient
      totalJour={Number(facturesJour._sum.total ?? 0)}
      countJour={facturesJour._count}
      totalSemaine={Number(facturesSemaine._sum.total ?? 0)}
      countSemaine={facturesSemaine._count}
      totalMois={Number(facturesMois._sum.total ?? 0)}
      countMois={facturesMois._count}
      facturesDetailJour={facturesDetailJourConverted}
    />
  );
}

