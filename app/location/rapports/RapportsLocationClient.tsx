"use client";

import { useState } from "react";

interface RapportsLocationClientProps {
  tauxOccupation: number;
  biensLibres: number;
  biensOccupes: number;
  biensMaintenance: number;
  totalBiens: number;
  loyersJour: number;
  loyersSemaine: number;
  loyersMois: number;
  loyersAnnee: number;
  loyersImpayes: number;
  locatairesEnRetard: any[];
  paiementsParMois: { mois: string; montant: number }[];
  biensParType: { type: string; count: number }[];
  biensRentables: { bien: string; locataire: string; total: number }[];
}

export default function RapportsLocationClient({
  tauxOccupation,
  biensLibres,
  biensOccupes,
  biensMaintenance,
  totalBiens,
  loyersJour,
  loyersSemaine,
  loyersMois,
  loyersAnnee,
  loyersImpayes,
  locatairesEnRetard,
  paiementsParMois,
  biensParType,
  biensRentables
}: RapportsLocationClientProps) {
  const [loading, setLoading] = useState(false);

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exports/rapport/location/pdf");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rapport-location-${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Erreur lors de l'export PDF");
      }
    } catch (error) {
      console.error("Erreur export PDF:", error);
      alert("Erreur lors de l'export PDF");
    } finally {
      setLoading(false);
    }
  };

  // Trouver le montant maximum pour l'échelle du graphique
  const maxMontant = Math.max(...paiementsParMois.map(p => p.montant), 1);

  return (
    <div className="space-y-6">
      {/* Boutons d'export */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleExportPDF}
          disabled={loading}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? "Export en cours..." : "Exporter en PDF"}
        </button>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Taux d'occupation</p>
          <p className="text-3xl font-bold text-indigo-700">{tauxOccupation.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">{biensOccupes} / {totalBiens} biens occupés</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Loyers encaissés (mois)</p>
          <p className="text-3xl font-bold text-green-700">{loyersMois.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</p>
          <p className="text-xs text-gray-400 mt-1">Ce mois</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Loyers impayés</p>
          <p className="text-3xl font-bold text-red-700">{loyersImpayes.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</p>
          <p className="text-xs text-gray-400 mt-1">Total restant dû</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Loyers encaissés (année)</p>
          <p className="text-3xl font-bold text-purple-700">{loyersAnnee.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</p>
          <p className="text-xs text-gray-400 mt-1">Cette année</p>
        </div>
      </div>

      {/* Graphique des paiements par mois */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Évolution des loyers encaissés (6 derniers mois)</h2>
        <div className="space-y-3">
          {paiementsParMois.map((p, idx) => {
            const pourcentage = (p.montant / maxMontant) * 100;
            return (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-700 font-medium">{p.mois}</div>
                <div className="flex-1 relative">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${pourcentage}%` }}
                    >
                      {p.montant > 0 && (
                        <span className="text-xs font-semibold text-white">
                          {p.montant.toLocaleString("fr-FR", { minimumFractionDigits: 0 })} FC
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-32 text-right text-sm font-semibold text-gray-900">
                  {p.montant.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Répartition des biens par type */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Répartition des biens par type</h2>
          <div className="space-y-3">
            {biensParType.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucun bien enregistré</p>
            ) : (
              biensParType.map((b, idx) => {
                const pourcentage = totalBiens > 0 ? (b.count / totalBiens) * 100 : 0;
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-gray-700 font-medium capitalize">{b.type?.replace("_", " ") || "Autre"}</div>
                    <div className="flex-1 relative">
                      <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${pourcentage}%` }}
                        >
                          {b.count > 0 && (
                            <span className="text-xs font-semibold text-white">{b.count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm font-semibold text-gray-900">
                      {b.count} ({pourcentage.toFixed(1)}%)
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* État des biens */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">État des biens</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Biens libres</p>
                <p className="text-xs text-gray-500 mt-1">Disponibles à la location</p>
              </div>
              <div className="text-2xl font-bold text-green-700">{biensLibres}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Biens occupés</p>
                <p className="text-xs text-gray-500 mt-1">Actuellement loués</p>
              </div>
              <div className="text-2xl font-bold text-blue-700">{biensOccupes}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">En maintenance</p>
                <p className="text-xs text-gray-500 mt-1">Non disponibles</p>
              </div>
              <div className="text-2xl font-bold text-orange-700">{biensMaintenance}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Locataires en retard de paiement */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Locataires en retard de paiement</h2>
        {locatairesEnRetard.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-sm text-gray-500 mb-2">✓</div>
            <div className="text-sm text-gray-500 font-medium">Aucun retard de paiement</div>
            <div className="text-xs text-gray-400 mt-1">Tous les loyers sont à jour</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Locataire</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Bien</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Pénalité</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Reste dû</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {locatairesEnRetard.map((p, idx) => (
                  <tr key={p.id} className={`hover:bg-red-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-red-50/30"}`}>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{p.contrat?.locataire?.nom ?? "N/A"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{p.contrat?.bien?.adresse ?? "N/A"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                        {Number(p.penalite).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        {Number(p.reste_du).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top 10 des biens les plus rentables */}
      {biensRentables.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 10 des biens les plus rentables</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Rang</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Bien</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Locataire</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Total encaissé</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {biensRentables.map((b, idx) => (
                  <tr key={idx} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-semibold text-sm">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{b.bien}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{b.locataire}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {b.total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Loyers (jour)</p>
          <p className="text-2xl font-bold text-blue-700">{loyersJour.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Loyers (semaine)</p>
          <p className="text-2xl font-bold text-green-700">{loyersSemaine.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Total biens</p>
          <p className="text-2xl font-bold text-indigo-700">{totalBiens}</p>
        </div>
      </div>
    </div>
  );
}

