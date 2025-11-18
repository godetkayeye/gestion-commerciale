import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import ManagerDashboardClient from "./ManagerDashboardClient";
import { MANAGER_ASSIGNABLE_ROLES, Role } from "@/lib/roles";

const allowed = new Set(["ADMIN", "MANAGER_MULTI"]);

export default async function ManagerPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Calculer les dates pour les filtres
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

  // Données Bar/Terrasse
  const [commandesBarRecentesRaw, boissonsStockBasRaw, commandesBarEnCours, totalBoissons, commandesBarValideesMois, facturesBarMois] = await Promise.all([
    prisma.commandes_bar.findMany({ orderBy: { date_commande: "desc" }, take: 5, include: { table: true, serveur: true, details: { include: { boisson: true } } } }),
    prisma.boissons.findMany({ where: { stock: { lte: 5 } }, take: 5 }),
    prisma.commandes_bar.count({ where: { status: "EN_COURS" as any } }),
    prisma.boissons.count(),
    prisma.commandes_bar.count({ where: { status: "VALIDEE" as any, date_commande: { gte: debutMois } } }),
    prisma.factures.count({ where: { date_facture: { gte: debutMois } } }),
  ]);

  // Données Restaurant
  const [commandesRestaurantRecentesRaw, commandesRestaurantEnCours] = await Promise.all([
    prisma.commande.findMany({ orderBy: { date_commande: "desc" }, take: 5, include: { details: { include: { repas: true } } } }),
    prisma.commande.count({ where: { statut: { in: ["EN_ATTENTE", "EN_PREPARATION"] as any } } }),
  ]);

  // Données Location
  const [biensLibres, biensOccupes, biensMaintenance, paiementsRecentsRaw, contratsActifs, locatairesEnRetardRaw, loyersImpayesRaw, usersRaw] = await Promise.all([
    prisma.biens.count({ where: { etat: "LIBRE" as any } }),
    prisma.biens.count({ where: { etat: "OCCUPE" as any } }),
    prisma.biens.count({ where: { etat: "MAINTENANCE" as any } }),
    prisma.paiements_location.findMany({ orderBy: { date_paiement: "desc" }, take: 5, include: { contrat: { include: { bien: true, locataire: true } } } }),
    prisma.contrats.count({ where: { statut: "ACTIF" as any } }),
    prisma.paiements_location.findMany({ where: { penalite: { gt: 0 } }, include: { contrat: { include: { locataire: true, bien: true } } }, orderBy: { penalite: "desc" }, take: 5 }),
    prisma.paiements_location.aggregate({ _sum: { reste_du: true } }),
    prisma.utilisateur.findMany({
      orderBy: { date_creation: "desc" },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        date_creation: true,
      },
    }),
  ]);

  const totalBiens = biensLibres + biensOccupes + biensMaintenance;
  const tauxOccupation = totalBiens > 0 ? ((biensOccupes / totalBiens) * 100).toFixed(1) : "0";
  const loyersImpayes = Number(loyersImpayesRaw._sum.reste_du ?? 0);

  // Convertir les objets Decimal en nombres pour les composants clients
  const commandesBarRecentes = convertDecimalToNumber(commandesBarRecentesRaw);
  const boissonsStockBas = convertDecimalToNumber(boissonsStockBasRaw);
  const commandesRestaurantRecentes = convertDecimalToNumber(commandesRestaurantRecentesRaw);
  const paiementsRecents = convertDecimalToNumber(paiementsRecentsRaw);
  const locatairesEnRetard = convertDecimalToNumber(locatairesEnRetardRaw);
  const users = usersRaw
    .filter((user) => user.role !== "ADMIN")
    .map((user) => ({
      ...user,
      role: user.role as Role,
      date_creation: user.date_creation?.toISOString() ?? null,
    }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Manager Multi — Tableau de bord</h1>

      <ManagerDashboardClient
        // Bar/Terrasse
        commandesBarRecentes={commandesBarRecentes}
        boissonsStockBas={boissonsStockBas}
        commandesBarEnCours={commandesBarEnCours}
        totalBoissons={totalBoissons}
        commandesBarValideesMois={commandesBarValideesMois}
        facturesBarMois={facturesBarMois}
        // Restaurant
        commandesRestaurantRecentes={commandesRestaurantRecentes}
        commandesRestaurantEnCours={commandesRestaurantEnCours}
        // Location
        biensLibres={biensLibres}
        biensOccupes={biensOccupes}
        biensMaintenance={biensMaintenance}
        tauxOccupation={tauxOccupation}
        paiementsRecents={paiementsRecents}
        locatairesEnRetard={locatairesEnRetard}
        totalBiens={totalBiens}
        contratsActifs={contratsActifs}
        loyersImpayes={loyersImpayes}
        users={users}
        assignableRoles={MANAGER_ASSIGNABLE_ROLES}
      />
    </div>
  );
}

