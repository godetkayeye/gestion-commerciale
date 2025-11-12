import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import RapportsLocationClient from "./RapportsLocationClient";

const allowed = new Set(["ADMIN"]);

export default async function RapportsLocationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Calculer les dates
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const semainePassee = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);
  const debutAnnee = new Date(aujourdhui.getFullYear(), 0, 1);

  // Statistiques des biens
  const [biensLibres, biensOccupes, biensMaintenance, totalBiens] = await Promise.all([
    prisma.biens.count({ where: { etat: "LIBRE" as any } }),
    prisma.biens.count({ where: { etat: "OCCUPE" as any } }),
    prisma.biens.count({ where: { etat: "MAINTENANCE" as any } }),
    prisma.biens.count()
  ]);

  const tauxOccupation = totalBiens > 0 ? ((biensOccupes / totalBiens) * 100) : 0;

  // Loyers encaissés
  const [loyersJour, loyersSemaine, loyersMois, loyersAnnee] = await Promise.all([
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: { date_paiement: { gte: aujourdhui } }
    }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: { date_paiement: { gte: semainePassee } }
    }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: { date_paiement: { gte: debutMois } }
    }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: { date_paiement: { gte: debutAnnee } }
    })
  ]);

  // Loyers impayés (reste dû total)
  const loyersImpayesRaw = await prisma.paiements_location.aggregate({
    _sum: { reste_du: true }
  });
  const loyersImpayes = Number(loyersImpayesRaw._sum.reste_du ?? 0);

  // Locataires en retard de paiement (avec pénalités)
  const locatairesEnRetardRaw = await prisma.paiements_location.findMany({
    where: {
      penalite: { gt: 0 }
    },
    include: {
      contrat: {
        include: {
          locataire: true,
          bien: true
        }
      }
    },
    orderBy: { penalite: "desc" },
    take: 20
  });

  // Paiements par mois (6 derniers mois) pour graphique
  const paiementsParMois = [];
  for (let i = 5; i >= 0; i--) {
    const dateDebut = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() - i, 1);
    const dateFin = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() - i + 1, 0);
    dateFin.setHours(23, 59, 59, 999);

    const paiements = await prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: {
        date_paiement: {
          gte: dateDebut,
          lte: dateFin
        }
      }
    });

    paiementsParMois.push({
      mois: dateDebut.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
      montant: Number(paiements._sum.montant ?? 0)
    });
  }

  // Répartition des biens par type
  const biensParTypeRaw = await prisma.biens.groupBy({
    by: ["type"],
    _count: { id: true }
  });

  const biensParType = biensParTypeRaw.map(b => ({
    type: b.type,
    count: b._count.id
  }));

  // Top 10 des biens les plus rentables (par total des loyers encaissés)
  const biensRentablesRaw = await prisma.paiements_location.groupBy({
    by: ["contrat_id"],
    _sum: { montant: true },
    orderBy: { _sum: { montant: "desc" } },
    take: 10
  });

  const contratIds = biensRentablesRaw.map(b => b.contrat_id).filter((id): id is number => id !== null);
  const contrats = await prisma.contrats.findMany({
    where: { id: { in: contratIds } },
    include: { bien: true, locataire: true }
  });

  const biensRentables = biensRentablesRaw.map(br => {
    const contrat = contrats.find(c => c.id === br.contrat_id);
    return {
      bien: contrat?.bien?.adresse || "N/A",
      locataire: contrat?.locataire?.nom || "N/A",
      total: Number(br._sum.montant ?? 0)
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rapports & Statistiques — Location</h1>
        <a
          href="/location"
          className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          ← Retour au tableau de bord
        </a>
      </div>

      <RapportsLocationClient
        tauxOccupation={tauxOccupation}
        biensLibres={biensLibres}
        biensOccupes={biensOccupes}
        biensMaintenance={biensMaintenance}
        totalBiens={totalBiens}
        loyersJour={Number(loyersJour._sum.montant ?? 0)}
        loyersSemaine={Number(loyersSemaine._sum.montant ?? 0)}
        loyersMois={Number(loyersMois._sum.montant ?? 0)}
        loyersAnnee={Number(loyersAnnee._sum.montant ?? 0)}
        loyersImpayes={loyersImpayes}
        locatairesEnRetard={convertDecimalToNumber(locatairesEnRetardRaw)}
        paiementsParMois={paiementsParMois}
        biensParType={biensParType}
        biensRentables={biensRentables}
      />
    </div>
  );
}

