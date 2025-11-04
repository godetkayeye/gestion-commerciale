import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDateRanges } from "@/lib/utils";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "CAISSIER", "SERVEUR"]);

export default async function RestaurantPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const ranges = getDateRanges(new Date());

  const [dailyStats, weeklyStats, monthlyStats, recentCommandes, topDishesGroup] = await Promise.all([
    prisma.commande.aggregate({
      _sum: { total: true },
      where: {
        date_commande: { gte: ranges.daily.start, lte: ranges.daily.end },
        statut: "PAYE"
      }
    }),
    prisma.commande.aggregate({
      _sum: { total: true },
      where: {
        date_commande: { gte: ranges.weekly.start, lte: ranges.weekly.end },
        statut: "PAYE"
      }
    }),
    prisma.commande.aggregate({
      _sum: { total: true },
      where: {
        date_commande: { gte: ranges.monthly.start, lte: ranges.monthly.end },
        statut: "PAYE"
      }
    }),
    prisma.commande.findMany({
      orderBy: { date_commande: "desc" },
      take: 5,
      include: {
        details: true
      }
    }),
    prisma.details_commande.groupBy({
      by: ["repas_id"],
      where: {
        commande: {
          date_commande: {
            gte: ranges.weekly.start,
            lte: ranges.weekly.end,
          },
        },
      },
      _sum: {
        quantite: true,
        prix_total: true,
      },
    }),
  ]);

  // Resolve repas names for top dishes
  const repasIds = topDishesGroup.map((g) => g.repas_id).filter((id): id is number => id !== null);
  const repas = await prisma.repas.findMany({ where: { id: { in: repasIds } }, select: { id: true, nom: true } });

  const topDishes = topDishesGroup
    .map((g) => {
      const r = repas.find((x) => x.id === g.repas_id);
      return {
        id: g.repas_id,
        nom: r?.nom ?? "Inconnu",
        quantite: g._sum.quantite ?? 0,
        total: Number(g._sum.prix_total ?? 0),
      };
    })
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, 5);

  const formatMoney = (n: number) => Number(n || 0).toFixed(2) + " FC";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Restaurant — Tableau de bord</h1>
        <div className="flex items-center gap-2">
          <a href="/restaurant/commandes/nouvelle" className="px-3 py-2 bg-green-600 text-white rounded-md text-sm">Nouvelle commande</a>
          <a href="/restaurant/commandes" className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">Voir commandes</a>
          <a href="/restaurant/repas" className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md text-sm">Gestion des plats</a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Recettes — Aujourd'hui</div>
          <div className="mt-2 text-2xl font-semibold text-blue-700">{formatMoney(Number(dailyStats._sum.total || 0))}</div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Recettes — Cette semaine</div>
          <div className="mt-2 text-2xl font-semibold text-blue-700">{formatMoney(Number(weeklyStats._sum.total || 0))}</div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Recettes — Ce mois</div>
          <div className="mt-2 text-2xl font-semibold text-blue-700">{formatMoney(Number(monthlyStats._sum.total || 0))}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Commandes récentes</h3>
          <div className="space-y-2">
            {recentCommandes.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                <div>
                  <div className="text-sm font-medium text-gray-900">Commande #{c.id}</div>
                  <div className="text-xs text-gray-500">Table {c.table_numero ?? '—'} · {c.statut}</div>
                </div>
                <div className="text-sm font-medium text-gray-900">{formatMoney(Number(c.total || 0))}</div>
              </div>
            ))}
            {recentCommandes.length === 0 && <div className="text-sm text-gray-500">Aucune commande récente</div>}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Plats les plus vendus (cette semaine)</h3>
          <div className="space-y-2">
            {topDishes.map((d, idx) => (
              <div key={d.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">{idx + 1}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{d.nom}</div>
                    <div className="text-xs text-gray-500">Quantité: {d.quantite}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">{formatMoney(d.total)}</div>
              </div>
            ))}
            {topDishes.length === 0 && <div className="text-sm text-gray-500">Aucune donnée disponible</div>}
          </div>
        </div>
      </div>

      {/* Nouvelle section : Rapports & Statistiques */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rapports & Statistiques</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Carte des rapports */}
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Rapports disponibles</h3>
            <div className="space-y-3">
              <a 
                href="/api/exports/restaurant/rapport"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Rapport général</div>
                    <div className="text-xs text-gray-500">Synthèse complète des activités</div>
                  </div>
                </div>
                <button className="px-3 py-1 text-xs text-blue-600 border border-blue-200 rounded-full hover:bg-blue-50">
                  Télécharger
                </button>
              </a>

              <a 
                href="/api/exports/restaurant/commandes"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Liste des commandes</div>
                    <div className="text-xs text-gray-500">Historique détaillé des commandes</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs text-green-600 border border-green-200 rounded-full hover:bg-green-50">
                    Excel
                  </button>
                  <button className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded-full hover:bg-red-50">
                    PDF
                  </button>
                </div>
              </a>

              <a 
                href="/api/exports/restaurant/ventes"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Analyse des ventes</div>
                    <div className="text-xs text-gray-500">Statistiques de vente par période</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs text-green-600 border border-green-200 rounded-full hover:bg-green-50">
                    Excel
                  </button>
                  <button className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded-full hover:bg-red-50">
                    PDF
                  </button>
                </div>
              </a>
            </div>
          </div>

          {/* Carte des statistiques avancées */}
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Statistiques avancées</h3>
            <div className="space-y-4">
              {/* Statuts des commandes */}
              <div>
                <div className="text-sm text-gray-700 mb-2">Statuts des commandes (aujourd'hui)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600">Validées</div>
                    <div className="text-2xl font-semibold text-green-700">
                      {recentCommandes.filter(c => c.statut === "PAYE").length}
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-yellow-600">En attente</div>
                    <div className="text-2xl font-semibold text-yellow-700">
                      {recentCommandes.filter(c => c.statut === "EN_ATTENTE").length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance des plats */}
              <div>
                <div className="text-sm text-gray-700 mb-2">Top 3 des plats (ce mois)</div>
                <div className="space-y-2">
                  {topDishes.slice(0, 3).map((dish, index) => (
                    <div key={dish.id} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-yellow-400' :
                        index === 1 ? 'bg-gray-400' :
                        'bg-orange-400'
                      }`} />
                      <div className="flex-1 text-sm text-gray-600">{dish.nom}</div>
                      <div className="text-sm font-medium text-gray-900">{dish.quantite} vendus</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tendances */}
              <div>
                <div className="text-sm text-gray-700 mb-2">Tendances des ventes</div>
                <div className="h-[100px] w-full bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-sm text-gray-500">Graphique à venir</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


