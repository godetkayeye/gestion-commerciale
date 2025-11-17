import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "CONSEIL_ADMINISTRATION", "MANAGER_MULTI"]);

export default async function ConseilPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Calculer les dates pour les filtres
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const semainePassee = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

  // Récupérer les données Restaurant (VILAKAZI)
  const [recettesRestaurantJour, recettesRestaurantSemaine, recettesRestaurantMois, commandesRestaurantRecentesRaw] = await Promise.all([
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT", date_paiement: { gte: aujourdhui } } }),
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT", date_paiement: { gte: semainePassee } } }),
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT", date_paiement: { gte: debutMois } } }),
    prisma.commande.findMany({ 
      orderBy: { date_commande: "desc" }, 
      take: 10, 
      include: { details: { include: { repas: true } } } 
    }),
  ]);

  // Récupérer les données Bar (BLACK & WHITE)
  const [recettesBarJour, recettesBarSemaine, recettesBarMois, commandesBarRecentesRaw] = await Promise.all([
    prisma.factures.aggregate({ _sum: { total: true }, where: { date_facture: { gte: aujourdhui } } }),
    prisma.factures.aggregate({ _sum: { total: true }, where: { date_facture: { gte: semainePassee } } }),
    prisma.factures.aggregate({ _sum: { total: true }, where: { date_facture: { gte: debutMois } } }),
    prisma.commandes_bar.findMany({ 
      orderBy: { date_commande: "desc" }, 
      take: 10, 
      include: { table: true, serveur: true, details: { include: { boisson: true } } } 
    }),
  ]);

  const commandesRestaurantRecentes = convertDecimalToNumber(commandesRestaurantRecentesRaw);
  const commandesBarRecentes = convertDecimalToNumber(commandesBarRecentesRaw);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Conseil d'Administration — Vue d'ensemble</h1>
        <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold whitespace-nowrap">
          Mode lecture seule
        </div>
      </div>

      {/* Module VILAKAZI (Restaurant) */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">V</div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">VILAKAZI (Restaurant)</h2>
        </div>

        {/* KPIs Restaurant */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 mb-2">Recettes — Aujourd'hui</div>
            <div className="text-2xl md:text-3xl font-semibold text-green-700">
              {Number(recettesRestaurantJour._sum.montant ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 mb-2">Recettes — Cette semaine</div>
            <div className="text-2xl md:text-3xl font-semibold text-green-700">
              {Number(recettesRestaurantSemaine._sum.montant ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 mb-2">Recettes — Ce mois</div>
            <div className="text-2xl md:text-3xl font-semibold text-green-700">
              {Number(recettesRestaurantMois._sum.montant ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
            </div>
          </div>
        </div>

        {/* Commandes récentes Restaurant */}
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
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      Aucune commande récente
                    </td>
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
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {c.date_commande ? new Date(c.date_commande).toLocaleDateString("fr-FR") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Module BLACK & WHITE (Bar/Terrasse) */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">B</div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">BLACK & WHITE (Bar/Terrasse)</h2>
        </div>

        {/* KPIs Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 mb-2">Recettes — Aujourd'hui</div>
            <div className="text-2xl md:text-3xl font-semibold text-blue-700">
              {Number(recettesBarJour._sum.total ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 mb-2">Recettes — Cette semaine</div>
            <div className="text-2xl md:text-3xl font-semibold text-blue-700">
              {Number(recettesBarSemaine._sum.total ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 mb-2">Recettes — Ce mois</div>
            <div className="text-2xl md:text-3xl font-semibold text-blue-700">
              {Number(recettesBarMois._sum.total ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
            </div>
          </div>
        </div>

        {/* Commandes récentes Bar */}
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
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      Aucune commande récente
                    </td>
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
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {c.date_commande ? new Date(c.date_commande).toLocaleDateString("fr-FR") : "-"}
                      </td>
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

