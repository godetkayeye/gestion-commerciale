"use client";

import Link from "next/link";

interface ManagerDashboardClientProps {
  // Bar/Terrasse
  commandesBarRecentes: any[];
  boissonsStockBas: any[];
  commandesBarEnCours: number;
  totalBoissons: number;
  commandesBarValideesMois: number;
  facturesBarMois: number;
  // Restaurant
  commandesRestaurantRecentes: any[];
  commandesRestaurantEnCours: number;
  // Location
  biensLibres: number;
  biensOccupes: number;
  biensMaintenance: number;
  tauxOccupation: string;
  paiementsRecents: any[];
  locatairesEnRetard: any[];
  totalBiens: number;
  contratsActifs: number;
  loyersImpayes: number;
}

export default function ManagerDashboardClient({
  commandesBarRecentes,
  boissonsStockBas,
  commandesBarEnCours,
  totalBoissons,
  commandesBarValideesMois,
  facturesBarMois,
  commandesRestaurantRecentes,
  commandesRestaurantEnCours,
  biensLibres,
  biensOccupes,
  biensMaintenance,
  tauxOccupation,
  paiementsRecents,
  locatairesEnRetard,
  totalBiens,
  contratsActifs,
  loyersImpayes,
}: ManagerDashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Module Bar/Terrasse */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">B</div>
            BLACK & WHITE
          </h2>
          <Link href="/bar" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
            Accéder au module →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Commandes récentes Bar */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-blue-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Commandes récentes</h3>
              <Link href="/bar/commandes" className="text-xs md:text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                Voir toutes →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Table</th>
                    <th className="hidden sm:table-cell text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Serveur</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {commandesBarRecentes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 md:px-4 py-4 md:py-8 text-center text-xs md:text-sm text-gray-500">
                        Aucune commande récente
                      </td>
                    </tr>
                  ) : (
                    commandesBarRecentes.map((c, idx) => (
                      <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm font-semibold text-gray-900">#{c.id}</span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm text-gray-900 font-medium">{c.table?.nom ?? "-"}</span>
                        </td>
                        <td className="hidden sm:table-cell px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm text-gray-900">{c.serveur?.nom ?? "-"}</span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-semibold ${
                            c.status === "VALIDEE" ? "bg-green-100 text-green-800" :
                            c.status === "EN_COURS" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {c.status === "VALIDEE" ? "Validée" : c.status === "EN_COURS" ? "En cours" : "Annulée"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Boissons en faible stock */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-red-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Alertes stock faible</h3>
            </div>
            <div className="p-3 md:p-4">
              {boissonsStockBas.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <div className="text-base md:text-lg text-gray-500 mb-2">✓</div>
                  <div className="text-xs md:text-sm text-gray-500 font-medium">Aucune alerte</div>
                  <div className="text-xs text-gray-400 mt-1">Tous les stocks sont suffisants</div>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {boissonsStockBas.map((b) => (
                    <div key={b.id} className="flex justify-between items-center p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs md:text-sm text-gray-900 mb-1 truncate">{b.nom}</div>
                        <div className="text-xs text-gray-600">
                          Stock: <span className="font-bold text-red-700">{b.stock}</span> {b.unite_mesure}
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white whitespace-nowrap">
                        Faible
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Module Restaurant */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold">R</div>
            VILAKAZI
          </h2>
          <Link href="/restaurant" className="text-sm font-medium text-green-600 hover:text-green-800 hover:underline">
            Accéder au module →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Commandes récentes Restaurant */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-green-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Commandes récentes</h3>
              <Link href="/restaurant/commandes" className="text-xs md:text-sm font-medium text-green-600 hover:text-green-800 hover:underline">
                Voir toutes →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Table</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {commandesRestaurantRecentes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 md:px-4 py-4 md:py-8 text-center text-xs md:text-sm text-gray-500">
                        Aucune commande récente
                      </td>
                    </tr>
                  ) : (
                    commandesRestaurantRecentes.map((c, idx) => (
                      <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm font-semibold text-gray-900">#{c.id}</span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm text-gray-900 font-medium">{c.table_numero ?? "-"}</span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-semibold ${
                            c.statut === "PAYE" ? "bg-green-100 text-green-800" :
                            c.statut === "SERVI" ? "bg-blue-100 text-blue-800" :
                            c.statut === "EN_PREPARATION" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {c.statut === "PAYE" ? "Payé" : c.statut === "SERVI" ? "Servi" : c.statut === "EN_PREPARATION" ? "En préparation" : "En attente"}
                          </span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm font-semibold text-gray-900">{Number(c.total ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistiques Restaurant */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-green-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Statistiques</h3>
            </div>
            <div className="p-3 md:p-4 space-y-3 md:space-y-4">
              <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs md:text-sm font-medium text-gray-700">Commandes en cours</span>
                <span className="text-base md:text-lg font-bold text-orange-700">{commandesRestaurantEnCours}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Location */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">L</div>
            ACAJOU
          </h2>
          <Link href="/location" className="text-sm font-medium text-purple-600 hover:text-purple-800 hover:underline">
            Accéder au module →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Paiements récents Location */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-purple-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Paiements récents</h3>
              <Link href="/location/paiements" className="text-xs md:text-sm font-medium text-purple-600 hover:text-purple-800 hover:underline">
                Voir tous →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Locataire</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Montant</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Reste dû</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paiementsRecents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 md:px-4 py-4 md:py-8 text-center text-xs md:text-sm text-gray-500">
                        Aucun paiement récent
                      </td>
                    </tr>
                  ) : (
                    paiementsRecents.map((p, idx) => (
                      <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm text-gray-900">
                            {new Date(p.date_paiement).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm text-gray-900 font-medium">{p.contrat?.locataire?.nom ?? "-"}</span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm font-semibold text-gray-900">{Number(p.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          {Number(p.reste_du) > 0 ? (
                            <span className="inline-flex items-center px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              {Number(p.reste_du).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              Payé
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Locataires en retard */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-red-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Locataires en retard</h3>
              {loyersImpayes > 0 && (
                <span className="text-xs md:text-sm font-semibold text-red-700">
                  Total: {loyersImpayes.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                </span>
              )}
            </div>
            <div className="p-3 md:p-4">
              {locatairesEnRetard.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <div className="text-base md:text-lg text-gray-500 mb-2">✓</div>
                  <div className="text-xs md:text-sm text-gray-500 font-medium">Aucun retard</div>
                  <div className="text-xs text-gray-400 mt-1">Tous les loyers sont à jour</div>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {locatairesEnRetard.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs md:text-sm font-semibold text-gray-900 truncate">{p.contrat?.locataire?.nom ?? "N/A"}</div>
                        <div className="text-xs text-gray-600 mt-1 truncate">{p.contrat?.bien?.adresse ?? "N/A"}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Pénalité: {Number(p.penalite).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC | 
                          Reste: {Number(p.reste_du).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 whitespace-nowrap">
                        Retard
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accès rapide, Statistiques et Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Accès rapide */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-indigo-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Accès rapide</h3>
          </div>
          <div className="p-2 md:p-4 flex flex-col gap-2">
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar">
              Bar / Terrasse
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/restaurant">
              Restaurant
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/location">
              Location
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar/rapports">
              Rapports Bar
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/location/rapports">
              Rapports Location
            </Link>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-purple-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Statistiques rapides</h3>
          </div>
          <div className="p-3 md:p-4 space-y-3 md:space-y-4">
            <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs md:text-sm font-medium text-gray-700">Total boissons</span>
              <span className="text-base md:text-lg font-bold text-blue-700">{totalBoissons}</span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs md:text-sm font-medium text-gray-700">Commandes validées (mois)</span>
              <span className="text-base md:text-lg font-bold text-green-700">{commandesBarValideesMois}</span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs md:text-sm font-medium text-gray-700">Factures Bar (mois)</span>
              <span className="text-base md:text-lg font-bold text-indigo-700">{facturesBarMois}</span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs md:text-sm font-medium text-gray-700">Total biens</span>
              <span className="text-base md:text-lg font-bold text-purple-700">{totalBiens}</span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs md:text-sm font-medium text-gray-700">Contrats actifs</span>
              <span className="text-base md:text-lg font-bold text-green-700">{contratsActifs}</span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs md:text-sm font-medium text-gray-700">Taux d'occupation</span>
              <span className="text-base md:text-lg font-bold text-indigo-700">{tauxOccupation}%</span>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-green-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Actions rapides</h3>
          </div>
          <div className="p-3 md:p-4 flex flex-col gap-2">
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar/commandes">
              Gérer commandes Bar
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/restaurant/commandes">
              Gérer commandes Restaurant
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/location/contrats">
              Gérer contrats
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/location/paiements">
              Enregistrer paiement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
