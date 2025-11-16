"use client";

import Link from "next/link";
import { useState } from "react";

interface RestaurantDashboardClientProps {
  commandesRecentes: any[];
  platsPlusVendus: any[];
  commandesValideesAujourdhui: number;
  commandesEnAttenteAujourdhui: number;
  top3PlatsMois: Array<{ id: number; nom: string; quantite_vendue: number }>;
}

export default function RestaurantDashboardClient({
  commandesRecentes,
  platsPlusVendus,
  commandesValideesAujourdhui,
  commandesEnAttenteAujourdhui,
  top3PlatsMois,
}: RestaurantDashboardClientProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleDownload = async (type: string, format?: string) => {
    setLoading(`${type}-${format || 'download'}`);
    try {
      let url = '';
      if (type === 'general') {
        // Rapport général en Excel
        url = '/api/exports/rapport/restaurant';
      } else if (type === 'commandes') {
        if (format === 'excel') {
          url = '/api/exports/restaurant/commandes/excel';
        } else {
          // Pour PDF, on peut utiliser une route qui génère un PDF de toutes les commandes
          url = '/api/exports/restaurant/commandes/pdf';
        }
      } else if (type === 'ventes') {
        if (format === 'excel') {
          url = '/api/exports/rapport/restaurant';
        } else {
          // Pour PDF des ventes, on peut utiliser la même route que le rapport général
          url = '/api/exports/restaurant/ventes/pdf';
        }
      }

      if (url) {
        const res = await fetch(url);
        if (res.ok) {
          const blob = await res.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          const extension = format === 'excel' ? 'xlsx' : 'pdf';
          a.download = `rapport-${type}-${new Date().toISOString().split("T")[0]}.${extension}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
        } else {
          alert("Erreur lors du téléchargement");
        }
      }
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      alert("Erreur lors du téléchargement");
    } finally {
      setLoading(null);
    }
  };

  const dotColors = ['bg-yellow-500', 'bg-gray-500', 'bg-orange-500'];
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Commandes récentes et Plats les plus vendus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Commandes récentes */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Commandes récentes</h2>
            <Link href="/restaurant/commandes" className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap">
              Voir toutes →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-100 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky left-0 bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider z-10">#</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Table</th>
                    <th className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Montant</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {commandesRecentes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 sm:px-4 py-4 sm:py-8 text-center text-xs sm:text-sm text-gray-500">
                        Aucune commande récente
                      </td>
                    </tr>
                  ) : (
                    commandesRecentes.map((c, idx) => (
                      <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="sticky left-0 bg-inherit px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap z-10">
                          <span className="text-xs sm:text-sm font-semibold text-gray-900">#{c.id}</span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex flex-col sm:block">
                            <span className="text-xs sm:text-sm text-gray-900 font-medium">Table {c.table_numero ?? "-"}</span>
                            <span className="sm:hidden mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                c.statut === "PAYE" ? "bg-green-100 text-green-800" :
                                c.statut === "SERVI" ? "bg-blue-100 text-blue-800" :
                                c.statut === "EN_PREPARATION" ? "bg-yellow-100 text-yellow-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {c.statut === "PAYE" ? "PAYE" : c.statut === "SERVI" ? "SERVI" : c.statut === "EN_PREPARATION" ? "EN_PREPARATION" : "EN_ATTENTE"}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-0.5 rounded-full text-xs font-semibold ${
                            c.statut === "PAYE" ? "bg-green-100 text-green-800" :
                            c.statut === "SERVI" ? "bg-blue-100 text-blue-800" :
                            c.statut === "EN_PREPARATION" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {c.statut === "PAYE" ? "PAYE" : c.statut === "SERVI" ? "SERVI" : c.statut === "EN_PREPARATION" ? "EN_PREPARATION" : "EN_ATTENTE"}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <span className="text-xs sm:text-sm font-semibold text-gray-900">{Number(c.total ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Plats les plus vendus */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-green-50 border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Plats les plus vendus (cette semaine)</h2>
          </div>
          <div className="p-3 sm:p-4">
            {platsPlusVendus.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <div className="text-base sm:text-lg text-gray-500 mb-2">—</div>
                <div className="text-xs sm:text-sm text-gray-500 font-medium">Aucune vente cette semaine</div>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {platsPlusVendus.map((plat, index) => (
                  <div key={plat.id || index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="font-semibold text-xs sm:text-sm text-gray-900 truncate">{plat.nom}</div>
                      </div>
                      <div className="text-xs text-gray-600 ml-7 sm:ml-8">
                        Quantité: <span className="font-bold text-gray-900">{plat.quantite_vendue}</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <div className="text-xs sm:text-sm font-bold text-green-700">{Number(plat.total_ventes).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rapports & Statistiques */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-indigo-50 border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Rapports & Statistiques</h2>
        </div>
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Panneau gauche : Rapports disponibles */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Rapports disponibles</h3>
              
              {/* Rapport général */}
              <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm text-gray-900 truncate">Rapport général</div>
                    <div className="text-xs text-gray-600 truncate">Synthèse complète des activités</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload('general')}
                  disabled={loading === 'general-download'}
                  className="w-full sm:w-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {loading === 'general-download' ? '...' : 'Télécharger'}
                </button>
              </div>

              {/* Liste des commandes */}
              <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm text-gray-900 truncate">Liste des commandes</div>
                    <div className="text-xs text-gray-600 truncate">Historique détaillé des commandes</div>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownload('commandes', 'excel')}
                    disabled={loading === 'commandes-excel'}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
                  >
                    {loading === 'commandes-excel' ? '...' : 'Excel'}
                  </button>
                  <button
                    onClick={() => handleDownload('commandes', 'pdf')}
                    disabled={loading === 'commandes-pdf'}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
                  >
                    {loading === 'commandes-pdf' ? '...' : 'PDF'}
                  </button>
                </div>
              </div>

              {/* Analyse des ventes */}
              <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm text-gray-900 truncate">Analyse des ventes</div>
                    <div className="text-xs text-gray-600 truncate">Statistiques de vente par période</div>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownload('ventes', 'excel')}
                    disabled={loading === 'ventes-excel'}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
                  >
                    {loading === 'ventes-excel' ? '...' : 'Excel'}
                  </button>
                  <button
                    onClick={() => handleDownload('ventes', 'pdf')}
                    disabled={loading === 'ventes-pdf'}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
                  >
                    {loading === 'ventes-pdf' ? '...' : 'PDF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Panneau droit : Statistiques avancées */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Statistiques avancées</h3>
              
              {/* Statuts des commandes (aujourd'hui) */}
              <div>
                <div className="text-xs text-gray-600 mb-2">Statuts des commandes (aujourd'hui)</div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xs text-green-700 font-medium mb-1">Validées</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-700">{commandesValideesAujourdhui}</div>
                  </div>
                  <div className="p-2 sm:p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-xs text-yellow-700 font-medium mb-1">En attente</div>
                    <div className="text-xl sm:text-2xl font-bold text-yellow-700">{commandesEnAttenteAujourdhui}</div>
                  </div>
                </div>
              </div>

              {/* Top 3 des plats (ce mois) */}
              <div>
                <div className="text-xs text-gray-600 mb-2">Top 3 des plats (ce mois)</div>
                <div className="space-y-2">
                  {top3PlatsMois.length === 0 ? (
                    <div className="text-xs text-gray-500 p-2">Aucune vente ce mois</div>
                  ) : (
                    top3PlatsMois.map((plat, index) => (
                      <div key={plat.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColors[index] || 'bg-gray-500'}`}></div>
                        <div className="flex-1 text-xs sm:text-sm text-gray-900 truncate">{plat.nom}</div>
                        <div className="text-xs text-gray-600 whitespace-nowrap">{plat.quantite_vendue} vendus</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tendances des ventes */}
              <div>
                <div className="text-xs text-gray-600 mb-2">Tendances des ventes</div>
                <div className="p-6 sm:p-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center min-h-[120px] sm:min-h-[150px]">
                  <div className="text-xs sm:text-sm text-gray-400">Graphique à venir</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

