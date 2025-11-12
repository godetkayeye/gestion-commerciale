"use client";

import Link from "next/link";

interface HistoriqueLocataireClientProps {
  locataire: any;
}

export default function HistoriqueLocataireClient({ locataire }: HistoriqueLocataireClientProps) {
  if (locataire.contrats.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        Aucun contrat enregistré pour ce locataire
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {locataire.contrats.map((contrat: any) => (
        <div key={contrat.id} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Contrat #{contrat.id} - {contrat.bien?.adresse || "Bien inconnu"}
              </h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                contrat.statut === "ACTIF" ? "bg-green-100 text-green-800" :
                contrat.statut === "TERMINE" ? "bg-gray-100 text-gray-800" :
                "bg-yellow-100 text-yellow-800"
              }`}>
                {contrat.statut === "ACTIF" ? "Actif" : contrat.statut === "TERMINE" ? "Terminé" : "En attente"}
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  {contrat.depot_garantie ? `${Number(contrat.depot_garantie).toLocaleString("fr-FR")} FC` : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avance</p>
                <p className="text-sm font-medium text-gray-900">
                  {contrat.avance ? `${Number(contrat.avance).toLocaleString("fr-FR")} FC` : "-"}
                </p>
              </div>
            </div>

            {contrat.paiements && contrat.paiements.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Historique des paiements</h3>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
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
                              {new Date(p.date_paiement).toLocaleDateString("fr-FR")}
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
                  </table>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Link
                href={`/location/contrats/${contrat.id}`}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
              >
                Voir le contrat
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

