import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import LocationDashboardClient from "./LocationDashboardClient";

const allowed = new Set(["ADMIN"]);

export default async function LocationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Calculer les dates pour les filtres
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

  const [biensLibres, biensOccupes, biensMaintenance, loyersMois, loyersJour, paiementsRecentsRaw, contratsActifs, locatairesEnRetardRaw, loyersImpayesRaw] = await Promise.all([
    prisma.biens.count({ where: { etat: "LIBRE" as any } }),
    prisma.biens.count({ where: { etat: "OCCUPE" as any } }),
    prisma.biens.count({ where: { etat: "MAINTENANCE" as any } }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: {
        date_paiement: {
          gte: debutMois,
        },
      },
    }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: {
        date_paiement: {
          gte: aujourdhui,
        },
      },
    }),
    prisma.paiements_location.findMany({ 
      orderBy: { date_paiement: "desc" }, 
      take: 5, 
      include: { contrat: { include: { bien: true, locataire: true } } } 
    }),
    prisma.contrats.count({ where: { statut: "ACTIF" as any } }),
    prisma.paiements_location.findMany({ 
      where: { penalite: { gt: 0 } }, 
      include: { contrat: { include: { locataire: true, bien: true } } }, 
      orderBy: { penalite: "desc" },
      take: 10 
    }),
    prisma.paiements_location.aggregate({
      _sum: { reste_du: true }
    }),
  ]);

  const totalBiens = biensLibres + biensOccupes + biensMaintenance;
  const tauxOccupation = totalBiens > 0 ? ((biensOccupes / totalBiens) * 100).toFixed(1) : "0";
  const loyersImpayes = Number(loyersImpayesRaw._sum.reste_du ?? 0);

  // Convertir les objets Decimal en nombres pour les composants clients
  const paiementsRecents = convertDecimalToNumber(paiementsRecentsRaw);
  const locatairesEnRetard = convertDecimalToNumber(locatairesEnRetardRaw);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Location — Tableau de bord</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Biens libres</div>
          <div className="mt-1 text-2xl font-semibold text-green-700">{biensLibres}</div>
          <div className="text-xs text-gray-400 mt-1">Disponibles à la location</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Biens occupés</div>
          <div className="mt-1 text-2xl font-semibold text-blue-700">{biensOccupes}</div>
          <div className="text-xs text-gray-400 mt-1">Taux d'occupation: {tauxOccupation}%</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Loyers (jour)</div>
          <div className="mt-1 text-2xl font-semibold text-blue-700">{Number(loyersJour._sum.montant ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</div>
          <div className="text-xs text-gray-400 mt-1">Chiffres en Franc Congolais</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Loyers (mois)</div>
          <div className="mt-1 text-2xl font-semibold text-blue-700">{Number(loyersMois._sum.montant ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</div>
          <div className="text-xs text-gray-400 mt-1">Chiffres en Franc Congolais</div>
        </div>
      </div>

      <LocationDashboardClient
        paiementsRecents={paiementsRecents}
        locatairesEnRetard={locatairesEnRetard}
        totalBiens={totalBiens}
        contratsActifs={contratsActifs}
        biensMaintenance={biensMaintenance}
        tauxOccupation={tauxOccupation}
        loyersImpayes={loyersImpayes}
      />
    </div>
  );
}

