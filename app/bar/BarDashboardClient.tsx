"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalAjouterBoisson from "@/app/components/ModalAjouterBoisson";
import ModalNouvelleCommandeBar from "@/app/components/ModalNouvelleCommandeBar";

interface BarDashboardClientProps {
  commandesRecentes: any[];
  boissonsStockBas: any[];
  totalBoissons: number;
  commandesValideesMois: number;
  facturesMois: number;
}

export default function BarDashboardClient({ commandesRecentes, boissonsStockBas, totalBoissons, commandesValideesMois, facturesMois }: BarDashboardClientProps) {
  const router = useRouter();
  const [modalBoissonOpen, setModalBoissonOpen] = useState(false);
  const [modalCommandeOpen, setModalCommandeOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        {/* Grille responsive - 1 colonne sur mobile, 2 sur desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Commandes récentes */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-blue-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Commandes récentes</h2>
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
                  {commandesRecentes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 md:px-4 py-4 md:py-8 text-center text-xs md:text-sm text-gray-500">
                        Aucune commande récente
                      </td>
                    </tr>
                  ) : (
                    commandesRecentes.map((c, idx) => (
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
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Alertes stock faible</h2>
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
                          Stock: <span className="font-bold text-red-700">{Number(b.stock).toFixed(2)}</span> {b.unite_mesure}
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

        {/* Grille responsive - 1 colonne sur mobile, 3 sur desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Accès rapide */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-indigo-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Accès rapide</h2>
            </div>
            <div className="p-2 md:p-4 flex flex-col gap-2">
              <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar/boissons">
                Gérer les boissons
              </Link>
              <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar/categories">
                Catégories
              </Link>
              <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar/tables">
                Tables/Zones
              </Link>
              <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar/commandes">
                Voir les commandes
              </Link>
              <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar/mouvements-stock">
                Mouvements stock
              </Link>
              <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar/personnel">
                Gestion personnel
              </Link>
              <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar/commissions">
                Commissions
              </Link>
              <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar/rapports">
                Rapports
              </Link>
              <button
                onClick={() => setModalCommandeOpen(true)}
                className="px-3 md:px-4 py-2 md:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm font-medium shadow-sm transition-colors"
              >
                Nouvelle commande
              </button>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-purple-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Statistiques</h2>
            </div>
            <div className="p-3 md:p-4 space-y-3 md:space-y-4">
              <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs md:text-sm font-medium text-gray-700">Total boissons</span>
                <span className="text-base md:text-lg font-bold text-blue-700">{totalBoissons}</span>
              </div>
              <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs md:text-sm font-medium text-gray-700">Validées (mois)</span>
                <span className="text-base md:text-lg font-bold text-green-700">{commandesValideesMois}</span>
              </div>
              <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs md:text-sm font-medium text-gray-700">Factures (mois)</span>
                <span className="text-base md:text-lg font-bold text-indigo-700">{facturesMois}</span>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-green-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Actions</h2>
            </div>
            <div className="p-3 md:p-4 flex flex-col gap-2">
              <button
                onClick={() => setModalBoissonOpen(true)}
                className="px-3 md:px-4 py-2 md:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs md:text-sm font-medium shadow-sm transition-colors"
              >
                Ajouter une boisson
              </button>
              <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar/commandes">
                Gérer les commandes
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ModalAjouterBoisson
        isOpen={modalBoissonOpen}
        onClose={() => setModalBoissonOpen(false)}
        onSuccess={handleRefresh}
      />
      <ModalNouvelleCommandeBar
        isOpen={modalCommandeOpen}
        onClose={() => setModalCommandeOpen(false)}
        onSuccess={handleRefresh}
      />
    </>
  );
}

