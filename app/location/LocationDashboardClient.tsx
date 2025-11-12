"use client";

import Link from "next/link";

interface LocationDashboardClientProps {
  paiementsRecents: any[];
  locatairesEnRetard: any[];
  totalBiens: number;
  contratsActifs: number;
  biensMaintenance: number;
  tauxOccupation: string;
  loyersImpayes: number;
}

export default function LocationDashboardClient({
  paiementsRecents,
  locatairesEnRetard,
  totalBiens,
  contratsActifs,
  biensMaintenance,
  tauxOccupation,
  loyersImpayes
}: LocationDashboardClientProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paiements récents */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Paiements récents</h2>
            <Link href="/location/paiements" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
              Voir tous →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Locataire</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Montant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Reste dû</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paiementsRecents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      Aucun paiement récent
                    </td>
                  </tr>
                ) : (
                  paiementsRecents.map((p, idx) => (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {new Date(p.date_paiement).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-medium">{p.contrat?.locataire?.nom ?? "-"}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">{Number(p.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {Number(p.reste_du) > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            {Number(p.reste_du).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
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

        {/* Locataires en retard de paiement */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-red-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Locataires en retard de paiement</h2>
            {loyersImpayes > 0 && (
              <span className="text-sm font-semibold text-red-700">
                Total impayé: {loyersImpayes.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
              </span>
            )}
          </div>
          <div className="p-4">
            {locatairesEnRetard.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500 mb-2">✓</div>
                <div className="text-sm text-gray-500 font-medium">Aucun retard de paiement</div>
                <div className="text-xs text-gray-400 mt-1">Tous les loyers sont à jour</div>
              </div>
            ) : (
              <div className="space-y-3">
                {locatairesEnRetard.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{p.contrat?.locataire?.nom ?? "N/A"}</div>
                      <div className="text-xs text-gray-600 mt-1">{p.contrat?.bien?.adresse ?? "N/A"}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Pénalité: {Number(p.penalite).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC | 
                        Reste dû: {Number(p.reste_du).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      Retard
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Accès rapide */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-indigo-50 border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Accès rapide</h2>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <Link className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium text-center shadow-sm transition-colors" href="/location/biens">
              Gérer les biens
            </Link>
            <Link className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium text-center shadow-sm transition-colors" href="/location/locataires">
              Gérer les locataires
            </Link>
            <Link className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium text-center shadow-sm transition-colors" href="/location/contrats">
              Gérer les contrats
            </Link>
            <Link className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium text-center shadow-sm transition-colors" href="/location/paiements">
              Voir les paiements
            </Link>
            <Link className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium text-center shadow-sm transition-colors" href="/location/contrats/nouveau">
              Nouveau contrat
            </Link>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-purple-50 border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Statistiques rapides</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">Total biens</span>
              <span className="text-lg font-bold text-blue-700">{totalBiens}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">Contrats actifs</span>
              <span className="text-lg font-bold text-green-700">{contratsActifs}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">Biens en maintenance</span>
              <span className="text-lg font-bold text-orange-700">{biensMaintenance}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">Taux d'occupation</span>
              <span className="text-lg font-bold text-indigo-700">{tauxOccupation}%</span>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-amber-50 border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Actions rapides</h2>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <Link className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium text-center shadow-sm transition-colors" href="/location/biens/nouveau">
              Ajouter un bien
            </Link>
            <Link className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium text-center shadow-sm transition-colors" href="/location/locataires/nouveau">
              Nouveau locataire
            </Link>
            <Link className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium text-center shadow-sm transition-colors" href="/location/paiements/nouveau">
              Enregistrer un paiement
            </Link>
            <Link className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium text-center shadow-sm transition-colors" href="/location/rapports">
              Rapports & Statistiques
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

