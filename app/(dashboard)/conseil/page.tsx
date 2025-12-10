import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import { getTauxChange } from "@/lib/getTauxChange";
import { ensureTauxChangeColumn } from "@/app/api/location/paiements/utils";

const allowed = new Set(["ADMIN", "CONSEIL_ADMINISTRATION", "MANAGER_MULTI"]);

export default async function ConseilPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const semainePassee = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  semainePassee.setHours(0, 0, 0, 0);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

  const hierDebut = new Date(aujourdhui);
  hierDebut.setDate(hierDebut.getDate() - 1);
  const hierFin = new Date(aujourdhui.getTime() - 1);

  const semaineAvantDebut = new Date(semainePassee);
  semaineAvantDebut.setDate(semaineAvantDebut.getDate() - 7);
  const semaineAvantFin = new Date(semainePassee.getTime() - 1);

  const debutMoisPrecedent = new Date(debutMois);
  debutMoisPrecedent.setMonth(debutMoisPrecedent.getMonth() - 1);
  const finMoisPrecedent = new Date(debutMois.getTime() - 1);

  // S'assurer que la colonne taux_change existe
  await ensureTauxChangeColumn();

  const [
    recettesRestaurantJour,
    recettesRestaurantSemaine,
    recettesRestaurantMois,
    recettesRestaurantJourPrev,
    recettesRestaurantSemainePrev,
    recettesRestaurantMoisPrev,
    commandesRestaurantRecentesRaw,
    commandesRestaurantStatsRaw,
    recettesBarJour,
    recettesBarSemaine,
    recettesBarMois,
    recettesBarJourPrev,
    recettesBarSemainePrev,
    recettesBarMoisPrev,
    commandesBarRecentesRaw,
    commandesBarStatsRaw,
    recettesLocationJour,
    recettesLocationSemaine,
    recettesLocationMois,
    recettesLocationJourPrev,
    recettesLocationSemainePrev,
    recettesLocationMoisPrev,
    biensLibres,
    biensOccupes,
    biensMaintenance,
    platsIndisponibles,
    boissonsStockBasRaw,
    paiementsRestaurantRecentsRaw,
    facturesBarRecentsRaw,
    paiementsLocationRecentsRaw,
  ] = await Promise.all([
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT" as any, date_paiement: { gte: aujourdhui } } }),
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT" as any, date_paiement: { gte: semainePassee } } }),
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT" as any, date_paiement: { gte: debutMois } } }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { module: "RESTAURANT" as any, date_paiement: { gte: hierDebut, lte: hierFin } },
    }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { module: "RESTAURANT" as any, date_paiement: { gte: semaineAvantDebut, lte: semaineAvantFin } },
    }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { module: "RESTAURANT" as any, date_paiement: { gte: debutMoisPrecedent, lte: finMoisPrecedent } },
    }),
    prisma.commande.findMany({
      orderBy: { date_commande: "desc" },
      take: 10,
      include: { details: { include: { repas: true } } },
    }),
    prisma.commande.findMany({
      where: {
        date_commande: { gte: semainePassee },
        statut: { in: ["PAYE", "SERVI"] as any },
      },
      include: {
        details: {
          include: { repas: true },
        },
      },
    }),
    prisma.factures.aggregate({ _sum: { total: true }, where: { date_facture: { gte: aujourdhui } } }),
    prisma.factures.aggregate({ _sum: { total: true }, where: { date_facture: { gte: semainePassee } } }),
    prisma.factures.aggregate({ _sum: { total: true }, where: { date_facture: { gte: debutMois } } }),
    prisma.factures.aggregate({
      _sum: { total: true },
      where: { date_facture: { gte: hierDebut, lte: hierFin } },
    }),
    prisma.factures.aggregate({
      _sum: { total: true },
      where: { date_facture: { gte: semaineAvantDebut, lte: semaineAvantFin } },
    }),
    prisma.factures.aggregate({
      _sum: { total: true },
      where: { date_facture: { gte: debutMoisPrecedent, lte: finMoisPrecedent } },
    }),
    prisma.commandes_bar.findMany({
      orderBy: { date_commande: "desc" },
      take: 10,
      include: { table: true, serveur: true, details: { include: { boisson: true } } },
    }),
    prisma.commandes_bar.findMany({
      where: { date_commande: { gte: semainePassee } },
      include: {
        details: {
          include: { boisson: true },
        },
      },
    }),
    prisma.paiements_location.aggregate({ _sum: { montant: true }, where: { date_paiement: { gte: aujourdhui } } }),
    prisma.paiements_location.aggregate({ _sum: { montant: true }, where: { date_paiement: { gte: semainePassee } } }),
    prisma.paiements_location.aggregate({ _sum: { montant: true }, where: { date_paiement: { gte: debutMois } } }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: { date_paiement: { gte: hierDebut, lte: hierFin } },
    }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: { date_paiement: { gte: semaineAvantDebut, lte: semaineAvantFin } },
    }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: { date_paiement: { gte: debutMoisPrecedent, lte: finMoisPrecedent } },
    }),
    prisma.biens.count({ where: { etat: "LIBRE" as any } }),
    prisma.biens.count({ where: { etat: "OCCUPE" as any } }),
    prisma.biens.count({ where: { etat: "MAINTENANCE" as any } }),
    prisma.repas.findMany({ where: { disponible: false }, orderBy: { nom: "asc" }, take: 8 }),
    prisma.boissons.findMany({ where: { stock: { lte: 10 } }, orderBy: { stock: "asc" }, take: 8 }),
    prisma.paiement.findMany({
      where: { module: "RESTAURANT" as any },
      orderBy: { date_paiement: "desc" },
      take: 5,
    }),
    prisma.factures.findMany({
      orderBy: { date_facture: "desc" },
      take: 5,
    }),
    prisma.paiements_location.findMany({
      orderBy: { date_paiement: "desc" },
      take: 5,
      include: { contrat: { include: { locataire: true, bien: true } } },
    }),
  ]);

  const commandesRestaurantRecentes = convertDecimalToNumber(commandesRestaurantRecentesRaw);
  const commandesRestaurantStats = convertDecimalToNumber(commandesRestaurantStatsRaw);
  const commandesBarRecentes = convertDecimalToNumber(commandesBarRecentesRaw);
  const commandesBarStats = convertDecimalToNumber(commandesBarStatsRaw);
  const boissonsStockBas = convertDecimalToNumber(boissonsStockBasRaw);
  const paiementsRestaurantRecents = convertDecimalToNumber(paiementsRestaurantRecentsRaw);
  const paiementsLocationRecents = convertDecimalToNumber(paiementsLocationRecentsRaw);

  const topPlatsMap = new Map<number, { nom: string; quantite: number; total: number }>();
  commandesRestaurantStats.forEach((commande: any) => {
    commande.details?.forEach((detail: any) => {
      if (detail.repas_id && detail.repas) {
        const existing = topPlatsMap.get(detail.repas_id);
        if (existing) {
          existing.quantite += detail.quantite;
          existing.total += Number(detail.prix_total || 0);
        } else {
          topPlatsMap.set(detail.repas_id, {
            nom: detail.repas.nom,
            quantite: detail.quantite,
            total: Number(detail.prix_total || 0),
          });
        }
      }
    });
  });

  const topBoissonsMap = new Map<number, { nom: string; quantite: number; total: number }>();
  commandesBarStats.forEach((commande: any) => {
    commande.details?.forEach((detail: any) => {
      if (detail.boisson_id && detail.boisson) {
        const existing = topBoissonsMap.get(detail.boisson_id);
        if (existing) {
          existing.quantite += detail.quantite ?? 0;
          existing.total += Number(detail.prix_total || 0);
        } else {
          topBoissonsMap.set(detail.boisson_id, {
            nom: detail.boisson.nom,
            quantite: detail.quantite ?? 0,
            total: Number(detail.prix_total || 0),
          });
        }
      }
    });
  });

  const topPlats = Array.from(topPlatsMap.values())
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, 5);
  const topBoissons = Array.from(topBoissonsMap.values())
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, 5);

  const paiementsConsolides = [
    ...paiementsRestaurantRecents.map((p: any) => ({
      id: `REST-${p.id}`,
      module: "Restaurant",
      montant: Number(p.montant ?? 0),
      date: p.date_paiement ? new Date(p.date_paiement) : null,
      description: `Commande #${p.reference_id || "-"}`,
    })),
    ...convertDecimalToNumber(facturesBarRecentsRaw).map((f: any) => ({
      id: `BAR-${f.id}`,
      module: "Bar",
      montant: Number(f.total ?? 0),
      date: f.date_facture ? new Date(f.date_facture) : null,
      description: `Facture #${f.id}`,
    })),
    ...paiementsLocationRecents.map((p: any) => ({
      id: `LOC-${p.id}`,
      module: "Location",
      montant: Number(p.montant ?? 0),
      date: p.date_paiement ? new Date(p.date_paiement) : null,
      description: p.contrat
        ? `${p.contrat.locataire?.nom ?? ""} — ${p.contrat.bien?.nom ?? "Bien"}`
        : `Contrat #${p.contrat_id || "-"}`,
    })),
  ]
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
    .slice(0, 10);

  const totalRestaurantJour = Number(recettesRestaurantJour._sum.montant ?? 0);
  const totalRestaurantSemaine = Number(recettesRestaurantSemaine._sum.montant ?? 0);
  const totalRestaurantMois = Number(recettesRestaurantMois._sum.montant ?? 0);
  const totalRestaurantJourPrev = Number(recettesRestaurantJourPrev._sum.montant ?? 0);
  const totalRestaurantSemainePrev = Number(recettesRestaurantSemainePrev._sum.montant ?? 0);
  const totalRestaurantMoisPrev = Number(recettesRestaurantMoisPrev._sum.montant ?? 0);

  const totalBarJour = Number(recettesBarJour._sum.total ?? 0);
  const totalBarSemaine = Number(recettesBarSemaine._sum.total ?? 0);
  const totalBarMois = Number(recettesBarMois._sum.total ?? 0);
  const totalBarJourPrev = Number(recettesBarJourPrev._sum.total ?? 0);
  const totalBarSemainePrev = Number(recettesBarSemainePrev._sum.total ?? 0);
  const totalBarMoisPrev = Number(recettesBarMoisPrev._sum.total ?? 0);

  const totalLocationJour = Number(recettesLocationJour._sum.montant ?? 0);
  const totalLocationSemaine = Number(recettesLocationSemaine._sum.montant ?? 0);
  const totalLocationMois = Number(recettesLocationMois._sum.montant ?? 0);
  const totalLocationJourPrev = Number(recettesLocationJourPrev._sum.montant ?? 0);
  const totalLocationSemainePrev = Number(recettesLocationSemainePrev._sum.montant ?? 0);
  const totalLocationMoisPrev = Number(recettesLocationMoisPrev._sum.montant ?? 0);

  // Récupérer le taux de change depuis la base de données
  const TAUX_CHANGE = await getTauxChange();

  const formatUSD = (montantFC: number) =>
    `${(montantFC / TAUX_CHANGE).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

  const calcVariation = (current: number, previous: number) => {
    if (!previous) return null;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const consolidated = [
    {
      label: "Recettes aujourd'hui",
      value: formatUSD(totalRestaurantJour + totalBarJour + totalLocationJour),
      variation: calcVariation(totalRestaurantJour + totalBarJour + totalLocationJour, totalRestaurantJourPrev + totalBarJourPrev + totalLocationJourPrev),
      breakdown: [
        { label: "Restaurant", value: formatUSD(totalRestaurantJour) },
        { label: "Bar", value: formatUSD(totalBarJour) },
        { label: "Location", value: formatUSD(totalLocationJour) },
      ],
    },
    {
      label: "Recettes sur 7 jours",
      value: formatUSD(totalRestaurantSemaine + totalBarSemaine + totalLocationSemaine),
      variation: calcVariation(totalRestaurantSemaine + totalBarSemaine + totalLocationSemaine, totalRestaurantSemainePrev + totalBarSemainePrev + totalLocationSemainePrev),
      breakdown: [
        { label: "Restaurant", value: formatUSD(totalRestaurantSemaine) },
        { label: "Bar", value: formatUSD(totalBarSemaine) },
        { label: "Location", value: formatUSD(totalLocationSemaine) },
      ],
    },
    {
      label: "Recettes mensuelles",
      value: formatUSD(totalRestaurantMois + totalBarMois + totalLocationMois),
      variation: calcVariation(totalRestaurantMois + totalBarMois + totalLocationMois, totalRestaurantMoisPrev + totalBarMoisPrev + totalLocationMoisPrev),
      breakdown: [
        { label: "Restaurant", value: formatUSD(totalRestaurantMois) },
        { label: "Bar", value: formatUSD(totalBarMois) },
        { label: "Location", value: formatUSD(totalLocationMois) },
      ],
    },
  ];

  const totalBiens = biensLibres + biensOccupes + biensMaintenance;
  const tauxOccupation = totalBiens > 0 ? ((biensOccupes / totalBiens) * 100).toFixed(1) : "0";

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Conseil d'Administration — Vue d'ensemble</h1>
        <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold whitespace-nowrap">Mode lecture seule</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {consolidated.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 mb-2">{card.label}</div>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-semibold text-gray-900">{card.value}</div>
              {card.variation && (
                <div className={`text-sm font-semibold ${Number(card.variation) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {Number(card.variation) >= 0 ? "▲" : "▼"} {Math.abs(Number(card.variation)).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="mt-3 space-y-1">
              {card.breakdown.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm text-gray-600">
                  <span>{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-orange-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Stocks critiques — Restaurant</h3>
            <span className="text-xs font-medium text-orange-600">{platsIndisponibles.length} plat(s)</span>
          </div>
          <div className="divide-y divide-gray-100">
            {platsIndisponibles.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Tous les plats sont disponibles.</div>
            ) : (
              platsIndisponibles.map((plat) => (
                <div key={plat.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{plat.nom}</div>
                    <div className="text-xs text-gray-500">Indisponible — réapprovisionnement requis</div>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-600">Rupture</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Stocks critiques — Bar</h3>
            <span className="text-xs font-medium text-blue-600">{boissonsStockBas.length} boisson(s)</span>
          </div>
          <div className="divide-y divide-gray-100">
            {boissonsStockBas.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Aucune alerte sur les boissons.</div>
            ) : (
              boissonsStockBas.map((boisson: any) => (
                <div key={boisson.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{boisson.nom}</div>
                    <div className="text-xs text-gray-500">Stock: {Number(boisson.stock).toFixed(2)} {boisson.unite_mesure}</div>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Sous 10</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">L</div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">ACAJOU (Location)</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Biens libres</div>
            <div className="mt-1 text-2xl font-semibold text-green-700">{biensLibres}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Biens occupés</div>
            <div className="mt-1 text-2xl font-semibold text-blue-700">{biensOccupes}</div>
            <div className="text-xs text-gray-500 mt-1">Taux: {tauxOccupation}%</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Revenus — Aujourd'hui</div>
            <div className="mt-1 text-2xl font-semibold text-purple-700">{formatUSD(totalLocationJour)}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Revenus — Ce mois</div>
            <div className="mt-1 text-2xl font-semibold text-purple-700">{formatUSD(totalLocationMois)}</div>
          </div>
        </div>
      </div>

      {/* Synthèses supplémentaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Top 5 plats</h3>
            <span className="text-xs text-gray-500">Sur 7 jours</span>
          </div>
          <div className="divide-y divide-gray-100">
            {topPlats.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Pas de données suffisantes.</div>
            ) : (
              topPlats.map((plat, index) => (
                <div key={plat.nom} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{index + 1}. {plat.nom}</div>
                    <div className="text-xs text-gray-500">{plat.quantite} portions vendues</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{formatUSD(plat.total)}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Top 5 boissons</h3>
            <span className="text-xs text-gray-500">Sur 7 jours</span>
          </div>
          <div className="divide-y divide-gray-100">
            {topBoissons.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Pas de données suffisantes.</div>
            ) : (
              topBoissons.map((boisson, index) => (
                <div key={boisson.nom} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{index + 1}. {boisson.nom}</div>
                    <div className="text-xs text-gray-500">{boisson.quantite} unités vendues</div>
                  </div>
                    <div className="text-sm font-semibold text-gray-900">{formatUSD(boisson.total)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Paiements récents — Tous modules</h3>
          <span className="text-xs text-gray-500">Restaurant / Bar / Location</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Module</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Montant</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paiementsConsolides.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">Aucun paiement récent.</td>
                </tr>
              ) : (
                paiementsConsolides.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{p.module}</td>
                    <td className="px-4 py-3 text-gray-700">{p.description}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.date ? p.date.toLocaleString("fr-FR") : "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatUSD(p.montant)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Exports rapides</h3>
            <p className="text-sm text-gray-500">Synthèses caisse & location</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/exports/rapport/caisse/restaurant?periode=jour&format=pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Caisse Restaurant (PDF)
            </a>
            <a
              href="/api/exports/rapport/caisse/bar?format=pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Caisse Bar (PDF)
            </a>
            <a
              href="/api/exports/rapport/caisse/location?format=pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Caisse Location (PDF)
            </a>
          </div>
        </div>
      </div>

      {/* Module VILAKAZI (Restaurant) */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">V</div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">VILAKAZI (Restaurant)</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 mb-2">Recettes — Aujourd'hui</div>
            <div className="text-2xl md:text-3xl font-semibold text-green-700">{formatUSD(totalRestaurantJour)}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 mb-2">Recettes — Cette semaine</div>
            <div className="text-2xl md:text-3xl font-semibold text-green-700">{formatUSD(totalRestaurantSemaine)}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 mb-2">Recettes — Ce mois</div>
            <div className="text-2xl md:text-3xl font-semibold text-green-700">{formatUSD(totalRestaurantMois)}</div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-green-50 border-b border-gray-200 px-4 py-3">
            <h3 className="text-lg font-semibold text-gray-900">Commandes récentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Table</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {commandesRestaurantRecentes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">Aucune commande récente</td>
                  </tr>
                ) : (
                  commandesRestaurantRecentes.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">#{c.id}</td>
                      <td className="px-4 py-3 text-gray-900">{c.table_numero || "-"}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {Number(c.total ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          c.statut === "PAYE" ? "bg-green-100 text-green-800" :
                          c.statut === "SERVI" ? "bg-blue-100 text-blue-800" :
                          c.statut === "EN_PREPARATION" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {c.statut === "PAYE" ? "Payé" :
                           c.statut === "SERVI" ? "Servi" :
                           c.statut === "EN_PREPARATION" ? "En préparation" :
                           "En attente"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{c.date_commande ? new Date(c.date_commande).toLocaleDateString("fr-FR") : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">B</div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">BLACK & WHITE (Bar/Terrasse)</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 mb-2">Recettes — Aujourd'hui</div>
            <div className="text-2xl md:text-3xl font-semibold text-blue-700">{formatUSD(totalBarJour)}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 mb-2">Recettes — Cette semaine</div>
            <div className="text-2xl md:text-3xl font-semibold text-blue-700">{formatUSD(totalBarSemaine)}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 mb-2">Recettes — Ce mois</div>
            <div className="text-2xl md:text-3xl font-semibold text-blue-700">{formatUSD(totalBarMois)}</div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-gray-200 px-4 py-3">
            <h3 className="text-lg font-semibold text-gray-900">Commandes récentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Table</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Serveur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {commandesBarRecentes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">Aucune commande récente</td>
                  </tr>
                ) : (
                  commandesBarRecentes.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">#{c.id}</td>
                      <td className="px-4 py-3 text-gray-900">{c.table?.nom || "-"}</td>
                      <td className="px-4 py-3 text-gray-900">{c.serveur?.nom || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          c.status === "VALIDEE" ? "bg-green-100 text-green-800" :
                          c.status === "EN_COURS" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {c.status === "VALIDEE" ? "Validée" :
                           c.status === "EN_COURS" ? "En cours" :
                           "Annulée"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{c.date_commande ? new Date(c.date_commande).toLocaleDateString("fr-FR") : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

