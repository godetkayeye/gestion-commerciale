"use client";

import Link from "next/link";

interface ContratDetailClientProps {
  contrat: any;
  totalPaiements: number;
  totalPenalites: number;
}

export default function ContratDetailClient({ contrat, totalPaiements, totalPenalites }: ContratDetailClientProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informations du bien */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du bien</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Adresse:</span>
              <span className="text-sm font-medium text-gray-900">{contrat.bien?.adresse || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Type:</span>
              <span className="text-sm font-medium text-gray-900">{contrat.bien?.type || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Superficie:</span>
              <span className="text-sm font-medium text-gray-900">
                {contrat.bien?.superficie ? `${Number(contrat.bien.superficie).toFixed(2)} m²` : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Prix mensuel:</span>
              <span className="text-sm font-medium text-gray-900">
                {contrat.bien?.prix_mensuel ? `${Number(contrat.bien.prix_mensuel).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC` : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Informations du locataire */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du locataire</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Nom:</span>
              <span className="text-sm font-medium text-gray-900">{contrat.locataire?.nom || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Contact:</span>
              <span className="text-sm font-medium text-gray-900">{contrat.locataire?.contact || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Profession:</span>
              <span className="text-sm font-medium text-gray-900">{contrat.locataire?.profession || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pièce d'identité:</span>
              <span className="text-sm font-medium text-gray-900">{contrat.locataire?.piece_identite || "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Détails du contrat */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails du contrat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Date de début</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(contrat.date_debut).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date de fin</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(contrat.date_fin).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Dépôt de garantie</p>
            <p className="text-sm font-medium text-gray-900">
              {contrat.depot_garantie ? `${Number(contrat.depot_garantie).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC` : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avance</p>
            <p className="text-sm font-medium text-gray-900">
              {contrat.avance ? `${Number(contrat.avance).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC` : "-"}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Statut:</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              contrat.statut === "ACTIF" ? "bg-green-100 text-green-800" :
              contrat.statut === "TERMINE" ? "bg-gray-100 text-gray-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>
              {contrat.statut === "ACTIF" ? "Actif" : contrat.statut === "TERMINE" ? "Terminé" : "En attente"}
            </span>
          </div>
        </div>
      </div>

      {/* Historique des paiements */}
      {contrat.paiements && contrat.paiements.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Historique des paiements</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Montant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Reste dû</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Pénalité</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {contrat.paiements.map((p: any, idx: number) => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {new Date(p.date_paiement).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {Number(p.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {Number(p.reste_du) > 0 ? (
                        <span className="text-sm text-red-600 font-medium">
                          {Number(p.reste_du).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                        </span>
                      ) : (
                        <span className="text-sm text-green-600 font-medium">Payé</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {Number(p.penalite) > 0 ? (
                        <span className="text-sm text-orange-600 font-medium">
                          {Number(p.penalite).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-blue-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={1} className="px-4 py-3 text-right font-semibold text-gray-900">Totaux:</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900">{totalPaiements.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</span>
                  </td>
                  <td className="px-4 py-3">-</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-orange-700">{totalPenalites.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {(!contrat.paiements || contrat.paiements.length === 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          Aucun paiement enregistré pour ce contrat
        </div>
      )}
    </div>
  );
}

